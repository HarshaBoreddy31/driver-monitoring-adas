/**
 * Frontend Domain Types
 */

export type SafetyStatus = 'SAFE' | 'CAUTION' | 'DANGER';

export type RelativePosition =
  | 'front'
  | 'front-left'
  | 'front-right'
  | 'rear'
  | 'rear-left'
  | 'rear-right'
  | 'adjacent-left'
  | 'adjacent-right';

export type VehicleType = 'sedan' | 'suv' | 'truck' | 'sport';

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  color: string;
  x: number; // Lateral position (meters)
  y: number; // Longitudinal position relative to our car (meters)
  lane: number;
  targetLane: number;
  speed: number; // m/s
  targetSpeed: number;
  acceleration: number;
  direction: 'same' | 'opposite';
  length: number;
  width: number;
  distance: number; // Authoritative Euclidean distance (meters)
  longitudinalDistance: number;
  lateralDistance: number;
  relativeVelocity: number; // m/s
  relativePosition: RelativePosition;
  safetyStatus: SafetyStatus;
  timeToCollision: number | null; // Seconds
  updatedAt: string;
}

export interface OurVehicle {
  id: 'our-vehicle';
  name: string;
  x: number;
  y: number;
  lane: number;
  speed: number;
  targetSpeed: number;
  acceleration: number;
  brakeActive: boolean;
  emergencyBrakeActive: boolean;
}

export interface WarningEvent {
  id: string;
  vehicleId: string;
  vehicleName: string;
  timestamp: string;
  distance: number;
  longitudinalDistance: number;
  previousState: SafetyStatus;
  newState: SafetyStatus;
  relativePosition: RelativePosition;
  relativeVelocity: number;
  timeToCollision: number | null;
  clearedAt?: string;
}

export interface SimulationSettings {
  tickRateMs: number;
  dangerDistance: number;
  cautionDistance: number;
  differentLaneWarningDistance?: number;
  ttcThreshold: number;
  ourSpeedMs: number;
  autoTraffic: boolean;
  laneWidth: number;
  warningSoundEnabled: boolean;
  activeScenario?: string;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  tickCount: number;
  uptimeSeconds: number;
  ourVehicle: OurVehicle;
  vehicles: Vehicle[];
  activeWarnings: {
    dangerCount: number;
    cautionCount: number;
    nearestVehicle: {
      id: string;
      name: string;
      distance: number;
      relativePosition: RelativePosition;
      safetyStatus: SafetyStatus;
    } | null;
  };
  settings: SimulationSettings;
  timestamp: string;
}

export type CameraViewMode = 'chase' | 'cockpit' | 'topDown';
