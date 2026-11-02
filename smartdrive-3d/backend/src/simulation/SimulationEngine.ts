/**
 * Authoritative Traffic Simulation Engine
 *
 * Requirements:
 * - Represents reference vehicle and at least 8 surrounding vehicles
 * - Consistent coordinate system (meters: X lateral, Y longitudinal relative to our vehicle)
 * - Configurable simulation update interval (tickRateMs)
 * - Authoritative distance, separation, and relative velocity calculations
 * - Deterministic warning evaluation and event queue dispatching
 * - Scenario triggers (lead braking, tailgating, blindspot cut-in)
 * - Control of reference vehicle (accelerate, brake, emergency brake, lane change)
 */

import {
  Vehicle,
  OurVehicle,
  SimulationSettings,
  SimulationState,
  WarningEvent,
} from '../types';
import { DistanceCalculator } from '../distance/DistanceCalculator';
import { WarningEngine } from '../warning/WarningEngine';
import { BoundedEventQueue } from '../os_concepts/BoundedEventQueue';
import { DatabaseEngine } from '../storage/Database';

export class SimulationEngine {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private tickIntervalId: NodeJS.Timeout | null = null;
  private tickCount: number = 0;
  private startTime: number = Date.now();

  private ourVehicle: OurVehicle;
  private vehicles: Map<string, Vehicle> = new Map();
  private settings: SimulationSettings;

  private warningEngine: WarningEngine;
  private eventQueue: BoundedEventQueue;
  private database: DatabaseEngine;

  // Listeners for WebSocket broadcasts
  private stateChangeListeners: Array<(state: SimulationState) => void> = [];
  private warningListeners: Array<(event: WarningEvent) => void> = [];

  constructor(database: DatabaseEngine, eventQueue: BoundedEventQueue) {
    this.database = database;
    this.eventQueue = eventQueue;
    this.warningEngine = new WarningEngine();

    // Default configuration
    this.settings = {
      tickRateMs: 100, // 10 Hz authoritative update
      dangerDistance: 5.0, // meters
      cautionDistance: 10.0, // 10m warning distance for front vehicles
      differentLaneWarningDistance: 1.0, // 1m warning distance for side lane vehicles
      ttcThreshold: 2.5, // seconds
      ourSpeedMs: 25.0, // 25 m/s = 90 km/h
      autoTraffic: true,
      laneWidth: 3.6, // Standard highway lane width (meters)
      warningSoundEnabled: true,
    };

    // Load persisted settings if available and ensure current thresholds are calibrated
    const saved = this.database.getSettings();
    if (saved) {
      this.settings = {
        ...this.settings,
        ...saved,
        cautionDistance: 10.0,
        dangerDistance: 5.0,
        differentLaneWarningDistance: 1.0,
      };
      this.database.saveSettings(this.settings);
    }

    // Initialize reference vehicle (Our Vehicle) in Center Lane (Lane 3)
    this.ourVehicle = {
      id: 'our-vehicle',
      name: 'Reference Vehicle (Our Car)',
      x: 0.0,
      y: 0.0,
      lane: 3,
      speed: this.settings.ourSpeedMs,
      targetSpeed: this.settings.ourSpeedMs,
      acceleration: 0.0,
      brakeActive: false,
      emergencyBrakeActive: false,
    };

    // Spawn initial diverse 9 surrounding vehicles
    this.initializeVehicles();
  }

  /**
   * Initializes at least 8 surrounding vehicles with distinct initial positions,
   * speeds, types, and colors across multiple traffic lanes.
   */
  public initializeVehicles(): void {
    this.vehicles.clear();
    this.warningEngine.reset();

    const laneW = this.settings.laneWidth;

    const initialTraffic = [
      {
        id: 'veh-front-lead',
        name: 'Lead SUV',
        type: 'suv' as const,
        color: '#f8fafc', // Pearl White
        lane: 3,
        x: 0.0,
        y: 36.0,
        speed: 24.5,
        targetSpeed: 24.5,
        length: 4.8,
        width: 1.95,
      },
      {
        id: 'veh-front-left',
        name: 'Sedan (Front-Left)',
        type: 'sedan' as const,
        color: '#38bdf8', // Cyan Blue
        lane: 2,
        x: -laneW,
        y: 42.0,
        speed: 27.2,
        targetSpeed: 27.2,
        length: 4.6,
        width: 1.85,
      },
      {
        id: 'veh-front-right',
        name: 'Cruiser (Front-Right)',
        type: 'sedan' as const,
        color: '#a855f7', // Purple
        lane: 4,
        x: laneW,
        y: 38.0,
        speed: 23.8,
        targetSpeed: 23.8,
        length: 4.5,
        width: 1.82,
      },
      {
        id: 'veh-rear-tailgate',
        name: 'Rear Tailgater',
        type: 'sport' as const,
        color: '#ef4444', // Red
        lane: 3,
        x: 0.0,
        y: -18.0,
        speed: 26.2,
        targetSpeed: 26.2,
        length: 4.4,
        width: 1.88,
      },
      {
        id: 'veh-blindspot-l',
        name: 'Left Blindspot Car',
        type: 'sedan' as const,
        color: '#94a3b8', // Silver
        lane: 2,
        x: -laneW,
        y: -3.0,
        speed: 25.4,
        targetSpeed: 25.4,
        length: 4.5,
        width: 1.80,
      },
      {
        id: 'veh-blindspot-r',
        name: 'Right Blindspot SUV',
        type: 'suv' as const,
        color: '#fbbf24', // Amber Gold
        lane: 4,
        x: laneW,
        y: 4.0,
        speed: 24.7,
        targetSpeed: 24.7,
        length: 4.9,
        width: 2.0,
      },
      {
        id: 'veh-distant-truck',
        name: 'Freight Truck',
        type: 'truck' as const,
        color: '#10b981', // Emerald Green
        lane: 4,
        x: laneW,
        y: 72.0,
        speed: 21.0,
        targetSpeed: 21.0,
        length: 9.5,
        width: 2.5,
      },
      {
        id: 'veh-rear-left-fast',
        name: 'Fast Rear Cruiser',
        type: 'sport' as const,
        color: '#ec4899', // Pink
        lane: 1,
        x: -laneW * 2,
        y: -38.0,
        speed: 29.5,
        targetSpeed: 29.5,
        length: 4.6,
        width: 1.86,
      },
      {
        id: 'veh-distant-right',
        name: 'Right Lane Van',
        type: 'suv' as const,
        color: '#64748b', // Slate
        lane: 5,
        x: laneW * 2,
        y: 55.0,
        speed: 22.5,
        targetSpeed: 22.5,
        length: 5.2,
        width: 2.1,
      },
    ];

    for (const item of initialTraffic) {
      const metrics = DistanceCalculator.calculate(
        this.ourVehicle.x,
        this.ourVehicle.y,
        this.ourVehicle.speed,
        item.x,
        item.y,
        item.speed,
        'same'
      );

      const status = this.warningEngine.evaluateStatus(
        metrics.euclideanDistance,
        metrics.timeToCollision,
        'SAFE',
        this.settings
      );

      const vehicle: Vehicle = {
        id: item.id,
        name: item.name,
        type: item.type,
        color: item.color,
        lane: item.lane,
        targetLane: item.lane,
        x: item.x,
        y: item.y,
        speed: item.speed,
        targetSpeed: item.targetSpeed,
        acceleration: 0.0,
        direction: 'same',
        length: item.length,
        width: item.width,
        distance: metrics.euclideanDistance,
        longitudinalDistance: metrics.longitudinalDistance,
        lateralDistance: metrics.lateralDistance,
        relativeVelocity: metrics.relativeVelocity,
        relativePosition: metrics.relativePosition,
        safetyStatus: status,
        timeToCollision: metrics.timeToCollision,
        updatedAt: new Date().toISOString(),
      };

      this.vehicles.set(vehicle.id, vehicle);
    }
  }

  /**
   * Starts or resumes the periodic simulation tick.
   */
  public start(): void {
    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;

    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
    }

    this.tickIntervalId = setInterval(() => {
      this.tick();
    }, this.settings.tickRateMs);

    console.log(`[Simulation] Engine started at ${this.settings.tickRateMs}ms tick interval`);
    this.notifyStateChange();
  }

  /**
   * Pauses the simulation loop.
   */
  public pause(): void {
    this.isPaused = true;
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    console.log('[Simulation] Engine paused');
    this.notifyStateChange();
  }

  /**
   * Resumes the paused simulation.
   */
  public resume(): void {
    this.start();
  }

  /**
   * Resets simulation to initial state.
   */
  public reset(): void {
    const wasRunning = this.isRunning && !this.isPaused;
    this.pause();
    this.tickCount = 0;
    this.startTime = Date.now();

    this.ourVehicle = {
      id: 'our-vehicle',
      name: 'Reference Vehicle (Our Car)',
      x: 0.0,
      y: 0.0,
      lane: 3,
      speed: this.settings.ourSpeedMs,
      targetSpeed: this.settings.ourSpeedMs,
      acceleration: 0.0,
      brakeActive: false,
      emergencyBrakeActive: false,
    };

    this.initializeVehicles();
    this.eventQueue.reset();
    console.log('[Simulation] Engine reset to initial state');

    if (wasRunning) {
      this.start();
    } else {
      this.notifyStateChange();
    }
  }

  /**
   * Core simulation periodic tick (RTOS Cyclic Executive pattern).
   */
  public tick(): void {
    if (this.isPaused) return;

    const dt = this.settings.tickRateMs / 1000.0;
    this.tickCount++;

    // 1. Update our vehicle kinematics
    this.updateOurVehicle(dt);

    // 2. Update each surrounding vehicle and recalculate authoritative metrics
    const updatedVehicles: Vehicle[] = [];

    for (const [id, vehicle] of this.vehicles.entries()) {
      // Dynamic autonomous vehicle behavior
      this.updateVehicleKinematics(vehicle, dt);

      // Authoritative Distance & Kinematic Calculations
      const metrics = DistanceCalculator.calculate(
        this.ourVehicle.x,
        this.ourVehicle.y,
        this.ourVehicle.speed,
        vehicle.x,
        vehicle.y,
        vehicle.speed,
        vehicle.direction
      );

      vehicle.distance = metrics.euclideanDistance;
      vehicle.longitudinalDistance = metrics.longitudinalDistance;
      vehicle.lateralDistance = metrics.lateralDistance;
      vehicle.relativeVelocity = metrics.relativeVelocity;
      vehicle.relativePosition = metrics.relativePosition;
      vehicle.timeToCollision = metrics.timeToCollision;
      vehicle.updatedAt = new Date().toISOString();

      // Warning Engine evaluation (considers same-lane vs 10m different-lane rule)
      const { status, event } = this.warningEngine.processVehicle(vehicle, this.settings, this.ourVehicle.lane);
      vehicle.safetyStatus = status;

      if (event) {
        // Enqueue in Bounded Event Queue (Producer-Consumer)
        this.eventQueue.enqueue(event);
        // Persist event to SQLite database asynchronously
        this.database.insertEvent(event);
        // Notify WebSocket subscribers immediately
        this.notifyWarningEvent(event);
      }

      updatedVehicles.push(vehicle);
    }

    // Broadcast synchronized simulation state snapshot
    this.notifyStateChange();
  }

  /**
   * Updates Our Vehicle's acceleration, braking, and longitudinal speed.
   */
  private updateOurVehicle(dt: number): void {
    if (this.ourVehicle.emergencyBrakeActive) {
      this.ourVehicle.acceleration = -12.0; // Hard braking -12 m/s^2
      this.ourVehicle.speed = Math.max(0.0, this.ourVehicle.speed + this.ourVehicle.acceleration * dt);
      if (this.ourVehicle.speed <= 0.1) {
        this.ourVehicle.emergencyBrakeActive = false;
        this.ourVehicle.acceleration = 0.0;
      }
    } else if (this.ourVehicle.brakeActive) {
      this.ourVehicle.acceleration = -4.5; // Smooth braking -4.5 m/s^2
      this.ourVehicle.speed = Math.max(0.0, this.ourVehicle.speed + this.ourVehicle.acceleration * dt);
    } else {
      // Cruise controller towards targetSpeed
      const speedDiff = this.ourVehicle.targetSpeed - this.ourVehicle.speed;
      if (Math.abs(speedDiff) > 0.1) {
        const accelRate = speedDiff > 0 ? 3.0 : -3.5;
        this.ourVehicle.acceleration = accelRate;
        this.ourVehicle.speed += accelRate * dt;
        if ((accelRate > 0 && this.ourVehicle.speed > this.ourVehicle.targetSpeed) ||
            (accelRate < 0 && this.ourVehicle.speed < this.ourVehicle.targetSpeed)) {
          this.ourVehicle.speed = this.ourVehicle.targetSpeed;
          this.ourVehicle.acceleration = 0.0;
        }
      } else {
        this.ourVehicle.acceleration = 0.0;
      }
    }

    // Smooth lane alignment (Lane 1=-2W, Lane 2=-1W, Lane 3=0, Lane 4=+1W, Lane 5=+2W)
    const targetX = (this.ourVehicle.lane - 3) * this.settings.laneWidth;
    if (Math.abs(this.ourVehicle.x - targetX) > 0.02) {
      const dir = targetX > this.ourVehicle.x ? 1 : -1;
      this.ourVehicle.x += dir * 6.0 * dt; // Responsive, crisp lateral steering
      if ((dir > 0 && this.ourVehicle.x > targetX) || (dir < 0 && this.ourVehicle.x < targetX)) {
        this.ourVehicle.x = targetX;
      }
    }
  }

  /**
   * Updates a surrounding vehicle's position and speed in relation to our vehicle.
   */
  private updateVehicleKinematics(vehicle: Vehicle, dt: number): void {
    if (!this.settings.autoTraffic) {
      // Manual/static simulation step
      const relSpeed = vehicle.speed - this.ourVehicle.speed;
      vehicle.y += relSpeed * dt;
      return;
    }

    // Autonomous traffic motion:
    // Longitudinal movement based on relative speed
    const relativeSpeed = vehicle.speed - this.ourVehicle.speed;
    vehicle.y += relativeSpeed * dt;

    // Autonomous lane change interpolation (Lane 1=-2W, Lane 2=-1W, Lane 3=0, Lane 4=+1W, Lane 5=+2W)
    const targetX = (vehicle.targetLane - 3) * this.settings.laneWidth;
    if (Math.abs(vehicle.x - targetX) > 0.05) {
      const dir = targetX > vehicle.x ? 1 : -1;
      vehicle.x += dir * 2.5 * dt;
      if ((dir > 0 && vehicle.x > targetX) || (dir < 0 && vehicle.x < targetX)) {
        vehicle.x = targetX;
        vehicle.lane = vehicle.targetLane;
      }
    }

    // Smooth speed regulation towards targetSpeed
    const speedDiff = vehicle.targetSpeed - vehicle.speed;
    if (Math.abs(speedDiff) > 0.1) {
      const a = speedDiff > 0 ? 1.5 : -2.0;
      vehicle.speed += a * dt;
    }

    // Road boundary wrapping and anti-collision buffer
    // Vehicles far ahead (> 95m) or far behind (< -65m) wrap around to maintain traffic density
    if (vehicle.y > 95.0) {
      vehicle.y = -50.0 - Math.random() * 15.0;
      vehicle.speed = this.ourVehicle.speed + (Math.random() * 4.0 - 1.0);
      vehicle.targetSpeed = vehicle.speed;
    } else if (vehicle.y < -65.0) {
      vehicle.y = 80.0 + Math.random() * 15.0;
      vehicle.speed = this.ourVehicle.speed - (Math.random() * 3.0 + 1.0);
      vehicle.targetSpeed = vehicle.speed;
    }
  }

  /**
   * Controlled Demonstration Scenarios for faculty presentation.
   */
  public triggerScenario(scenarioName: string): void {
    console.log(`[Simulation] Triggering demo scenario: ${scenarioName}`);
    this.settings.activeScenario = scenarioName;

    switch (scenarioName) {
      case 'lead_braking': {
        // Front vehicle suddenly brakes hard right in our lane (Lane 3) within 5m danger threshold
        const lead = this.vehicles.get('veh-front-lead');
        if (lead) {
          lead.lane = 3;
          lead.targetLane = 3;
          lead.x = 0.0;
          lead.y = 4.8;
          lead.speed = 10.0; // Drops from 25 m/s to 10 m/s
          lead.targetSpeed = 8.0;
        }
        break;
      }

      case 'aggressive_tailgate': {
        // Rear tailgater aggressively accelerates right to our bumper (Lane 3)
        const tail = this.vehicles.get('veh-rear-tailgate');
        if (tail) {
          tail.lane = 3;
          tail.targetLane = 3;
          tail.x = 0.0;
          tail.y = -4.5;
          tail.speed = 36.0; // Accelerates to close the gap rapidly
          tail.targetSpeed = 36.0;
        }
        break;
      }

      case 'blindspot_cut_in': {
        // Left blindspot car cuts right in front of our vehicle within 1m side threshold
        const cut = this.vehicles.get('veh-blindspot-l');
        if (cut) {
          cut.y = 4.0;
          cut.lane = 2;
          cut.targetLane = 3; // Merges into our lane
          cut.x = -0.8; // Within 1m side clearance
          cut.speed = 22.0;
          cut.targetSpeed = 22.0;
        }
        break;
      }

      case 'multi_hazard': {
        // Lead brakes AND rear vehicle accelerates
        this.triggerScenario('lead_braking');
        this.triggerScenario('aggressive_tailgate');
        break;
      }

      case 'reset_normal':
      default: {
        this.initializeVehicles();
        this.settings.activeScenario = undefined;
        break;
      }
    }

    this.notifyStateChange();
  }

  // --- Reference Vehicle Controls ---

  public setOurSpeed(speedMs: number): void {
    this.ourVehicle.targetSpeed = Math.max(0.0, Math.min(45.0, speedMs));
    this.settings.ourSpeedMs = this.ourVehicle.targetSpeed;
  }

  public setOurLane(lane: number): void {
    // Human 1..5 standard highway lanes (1=Far Left, 2=Left, 3=Center, 4=Right, 5=Far Right)
    this.ourVehicle.lane = Math.max(1, Math.min(5, Math.round(lane)));
  }

  public applyBrake(active: boolean): void {
    this.ourVehicle.brakeActive = active;
  }

  public applyEmergencyBrake(): void {
    this.ourVehicle.emergencyBrakeActive = true;
  }

  // --- Target Vehicle Manipulations ---

  public setVehicleSpeed(vehicleId: string, speedMs: number): boolean {
    const v = this.vehicles.get(vehicleId);
    if (v) {
      v.targetSpeed = Math.max(0.0, Math.min(50.0, speedMs));
      v.speed = v.targetSpeed;
      return true;
    }
    return false;
  }

  public addVehicle(params?: Partial<Vehicle>): Vehicle {
    const id = `veh-custom-${Date.now()}`;
    const lane = params?.lane ?? (Math.floor(Math.random() * 5) + 1);
    const x = (lane - 3) * this.settings.laneWidth;
    const y = params?.y ?? (Math.random() > 0.5 ? 40.0 : -25.0);
    const speed = params?.speed ?? (this.ourVehicle.speed + (Math.random() * 6 - 3));

    const metrics = DistanceCalculator.calculate(
      this.ourVehicle.x,
      this.ourVehicle.y,
      this.ourVehicle.speed,
      x,
      y,
      speed,
      'same'
    );

    const newVehicle: Vehicle = {
      id,
      name: params?.name ?? `Vehicle #${this.vehicles.size + 1}`,
      type: params?.type ?? 'sedan',
      color: params?.color ?? '#38bdf8',
      lane,
      targetLane: lane,
      x,
      y,
      speed,
      targetSpeed: speed,
      acceleration: 0,
      direction: 'same',
      length: 4.6,
      width: 1.85,
      distance: metrics.euclideanDistance,
      longitudinalDistance: metrics.longitudinalDistance,
      lateralDistance: metrics.lateralDistance,
      relativeVelocity: metrics.relativeVelocity,
      relativePosition: metrics.relativePosition,
      safetyStatus: 'SAFE',
      timeToCollision: metrics.timeToCollision,
      updatedAt: new Date().toISOString(),
    };

    this.vehicles.set(id, newVehicle);
    this.notifyStateChange();
    return newVehicle;
  }

  public removeVehicle(vehicleId: string): boolean {
    const removed = this.vehicles.delete(vehicleId);
    if (removed) {
      this.warningEngine.removeVehicle(vehicleId);
      this.notifyStateChange();
    }
    return removed;
  }

  public updateSettings(partial: Partial<SimulationSettings>): SimulationSettings {
    this.settings = { ...this.settings, ...partial };
    this.database.saveSettings(this.settings);

    // If tick rate changed, restart timer interval
    if (partial.tickRateMs && this.isRunning && !this.isPaused) {
      this.start();
    }

    this.notifyStateChange();
    return this.settings;
  }

  // --- State Snapshot Accessors ---

  public getState(): SimulationState {
    const vehicleList = Array.from(this.vehicles.values());

    let dangerCount = 0;
    let cautionCount = 0;
    let nearest: Vehicle | null = null;

    for (const v of vehicleList) {
      if (v.safetyStatus === 'DANGER') dangerCount++;
      if (v.safetyStatus === 'CAUTION') cautionCount++;

      if (!nearest || v.distance < nearest.distance) {
        nearest = v;
      }
    }

    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      tickCount: this.tickCount,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      ourVehicle: { ...this.ourVehicle },
      vehicles: vehicleList,
      activeWarnings: {
        dangerCount,
        cautionCount,
        nearestVehicle: nearest
          ? {
              id: nearest.id,
              name: nearest.name,
              distance: nearest.distance,
              relativePosition: nearest.relativePosition,
              safetyStatus: nearest.safetyStatus,
            }
          : null,
      },
      settings: { ...this.settings },
      timestamp: new Date().toISOString(),
    };
  }

  public getSettings(): SimulationSettings {
    return { ...this.settings };
  }

  // --- Observer Event Registrations ---

  public onStateChange(listener: (state: SimulationState) => void): void {
    this.stateChangeListeners.push(listener);
  }

  public onWarningEvent(listener: (event: WarningEvent) => void): void {
    this.warningListeners.push(listener);
  }

  private notifyStateChange(): void {
    const state = this.getState();
    for (const listener of this.stateChangeListeners) {
      listener(state);
    }
  }

  private notifyWarningEvent(event: WarningEvent): void {
    for (const listener of this.warningListeners) {
      listener(event);
    }
  }
}
