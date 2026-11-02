/**
 * SmartDrive 3D - Authoritative Domain Types
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
  x: number; // Lateral position in meters (0 = center lane, -3.6 = left, +3.6 = right)
  y: number; // Longitudinal position in meters relative to our vehicle (0 = our car, +y = ahead, -y = behind)
  lane: number; // Lane index (-2, -1, 0, 1, 2)
  targetLane: number;
  speed: number; // Current speed in m/s
  targetSpeed: number; // Target cruise speed in m/s
  acceleration: number; // In m/s^2
  direction: 'same' | 'opposite';
  length: number; // Meters
  width: number; // Meters
  distance: number; // Calculated authoritative Euclidean distance: sqrt(x^2 + y^2)
  longitudinalDistance: number; // Separation along road axis |y|
  lateralDistance: number; // Separation across lanes |x|
  relativeVelocity: number; // v_target - v_our (m/s)
  relativePosition: RelativePosition;
  safetyStatus: SafetyStatus;
  timeToCollision: number | null; // Seconds, null if not closing in
  updatedAt: string; // ISO 8601
}

export interface OurVehicle {
  id: 'our-vehicle';
  name: 'Reference Vehicle (Our Car)';
  x: number;
  y: number;
  lane: number;
  speed: number; // m/s
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
  tickRateMs: number; // Default 100ms
  dangerDistance: number; // Default 15.0m
  cautionDistance: number; // Default 30.0m
  differentLaneWarningDistance?: number; // Default 10.0m for vehicles in different lanes
  ttcThreshold: number; // Default 2.5s
  ourSpeedMs: number; // Default 25.0 m/s (90 km/h)
  autoTraffic: boolean; // Automatic dynamic traffic AI
  laneWidth: number; // 3.6m standard highway lane
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

export interface OSMetricQueueInfo {
  size: number;
  capacity: number;
  droppedCount: number;
  processedCount: number;
  highWaterMark: number;
}
