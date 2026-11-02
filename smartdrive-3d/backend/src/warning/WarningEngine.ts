/**
 * Warning Engine Module
 *
 * Requirements:
 * - Deterministic safety classification (SAFE, CAUTION, DANGER)
 * - Configurable distance thresholds and optional TTC rules
 * - Lane-aware thresholds:
 *   - Same lane: 15m danger, 30m caution
 *   - Different lanes: 10m warning distance rule (6m danger, 10m caution, >10m safe)
 * - Hysteresis buffer to eliminate boundary thrashing
 * - State-transition event generation (broadcast only on actual state changes)
 * - Duplicate event prevention on recurring simulation ticks
 * - Warning clear / downgrade lifecycle management
 */

import { SafetyStatus, Vehicle, WarningEvent, SimulationSettings } from '../types';

export class WarningEngine {
  // Track previous state per vehicle ID: { vehicleId: SafetyStatus }
  private previousStates: Map<string, SafetyStatus> = new Map();

  // Hysteresis deadband in meters to prevent state flickering
  private readonly HYSTERESIS_BUFFER = 1.0;

  /**
   * Evaluates the safety status of a single vehicle according to configurable thresholds.
   *
   * Rules:
   * 1. VEHICLES IN SIDE / DIFFERENT LANES:
   *    - Warning distance threshold is 1.0m!
   *    - DANGER: distance <= 0.5m (immediate lateral sideswipe hazard)
   *    - CAUTION: distance <= 1.0m (side lane proximity warning sign)
   *    - SAFE: distance > 1.0m (safe clearance for adjacent traffic)
   *
   * 2. VEHICLES IN SAME LANE (Front / Rear):
   *    - Warning distance threshold is 10.0m!
   *    - DANGER: distance <= dangerDistance (default 5.0m), OR (TTC <= ttcThreshold AND distance <= cautionDistance)
   *    - CAUTION: distance <= cautionDistance (default 10.0m), OR (TTC <= ttcThreshold * 1.8)
   *    - SAFE: distance > cautionDistance + hysteresis (clear forward corridor)
   */
  public evaluateStatus(
    distance: number,
    ttc: number | null,
    previousState: SafetyStatus,
    settings: SimulationSettings,
    isSameLane: boolean = true
  ): SafetyStatus {
    // Rule for vehicles in SIDE / DIFFERENT LANES (Threshold = 1.0m):
    if (!isSameLane) {
      const diffLaneCaution = settings.differentLaneWarningDistance ?? 1.0;
      const diffLaneDanger = 0.5;
      const sideHysteresis = 0.1; // 10cm deadband

      const dangerThreshold =
        previousState === 'DANGER'
          ? diffLaneDanger + sideHysteresis
          : diffLaneDanger;

      const cautionThreshold =
        previousState === 'CAUTION'
          ? diffLaneCaution + sideHysteresis
          : diffLaneCaution;

      if (distance <= dangerThreshold) {
        return 'DANGER';
      }
      if (distance <= cautionThreshold) {
        return 'CAUTION';
      }
      return 'SAFE';
    }

    // Rule for vehicles in the SAME LANE / FRONT (Warning Threshold = 10.0m):
    const dangerDistance = settings.dangerDistance ?? 5.0;
    const cautionDistance = settings.cautionDistance ?? 10.0;
    const { ttcThreshold } = settings;
    const frontHysteresis = 0.5; // 50cm deadband

    // Apply hysteresis based on previous state
    const dangerThreshold =
      previousState === 'DANGER'
        ? dangerDistance + frontHysteresis
        : dangerDistance;

    const cautionThreshold =
      previousState === 'CAUTION'
        ? cautionDistance + frontHysteresis
        : cautionDistance;

    // Check DANGER condition
    const isDangerDistance = distance <= dangerThreshold;
    const isDangerTTC = ttc !== null && ttc <= ttcThreshold && distance <= cautionDistance;

    if (isDangerDistance || isDangerTTC) {
      return 'DANGER';
    }

    // Check CAUTION condition
    const isCautionDistance = distance <= cautionThreshold;
    const isCautionTTC = ttc !== null && ttc <= ttcThreshold * 1.8 && distance <= cautionDistance * 1.2;

    if (isCautionDistance || isCautionTTC) {
      return 'CAUTION';
    }

    return 'SAFE';
  }

  /**
   * Processes a vehicle update tick.
   * If a state change occurs (e.g. SAFE -> CAUTION, CAUTION -> DANGER, DANGER -> SAFE),
   * generates an authoritative WarningEvent.
   * If the state is unchanged from previous tick, returns null (prevents duplicate spam).
   */
  public processVehicle(
    vehicle: Vehicle,
    settings: SimulationSettings,
    ourLane: number = 3
  ): { status: SafetyStatus; event: WarningEvent | null } {
    const prevState = this.previousStates.get(vehicle.id) ?? 'SAFE';
    // Vehicle is in the same lane if its lane index equals ourLane and lateral offset is under half lane width
    const isSameLane = vehicle.lane === ourLane || Math.abs(vehicle.lateralDistance) < 1.8;
    const newStatus = this.evaluateStatus(
      vehicle.distance,
      vehicle.timeToCollision,
      prevState,
      settings,
      isSameLane
    );

    let event: WarningEvent | null = null;

    if (newStatus !== prevState) {
      // Authoritative State Transition Event
      event = {
        id: `evt-${vehicle.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        timestamp: new Date().toISOString(),
        distance: vehicle.distance,
        longitudinalDistance: vehicle.longitudinalDistance,
        previousState: prevState,
        newState: newStatus,
        relativePosition: vehicle.relativePosition,
        relativeVelocity: vehicle.relativeVelocity,
        timeToCollision: vehicle.timeToCollision,
        clearedAt: newStatus === 'SAFE' ? new Date().toISOString() : undefined,
      };

      // Update state tracking
      this.previousStates.set(vehicle.id, newStatus);
    }

    return { status: newStatus, event };
  }

  /**
   * Resets vehicle state memory (used when resetting simulation).
   */
  public reset(): void {
    this.previousStates.clear();
  }

  /**
   * Manually unregisters a vehicle when removed from simulation.
   */
  public removeVehicle(vehicleId: string): void {
    this.previousStates.delete(vehicleId);
  }
}
