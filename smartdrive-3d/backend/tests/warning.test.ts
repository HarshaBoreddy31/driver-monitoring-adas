import { describe, it, expect, beforeEach } from 'vitest';
import { WarningEngine } from '../src/warning/WarningEngine';
import { Vehicle, SimulationSettings } from '../src/types';

describe('WarningEngine (Safety Thresholds & Duplicate Event Prevention)', () => {
  let engine: WarningEngine;
  let settings: SimulationSettings;

  beforeEach(() => {
    engine = new WarningEngine();
    settings = {
      tickRateMs: 100,
      dangerDistance: 5.0, // 5m imminent danger
      cautionDistance: 10.0, // 10m front warning threshold
      differentLaneWarningDistance: 1.0, // 1m side lane warning threshold
      ttcThreshold: 2.5,
      ourSpeedMs: 25.0,
      autoTraffic: true,
      laneWidth: 3.6,
      warningSoundEnabled: true,
    };
  });

  const createDummyVehicle = (id: string, distance: number, ttc: number | null = null): Vehicle => ({
    id,
    name: 'Test Vehicle',
    type: 'sedan',
    color: '#ffffff',
    lane: 3,
    targetLane: 3,
    x: 0,
    y: distance,
    speed: 25.0,
    targetSpeed: 25.0,
    acceleration: 0,
    direction: 'same',
    length: 4.5,
    width: 1.8,
    distance,
    longitudinalDistance: distance,
    lateralDistance: 0,
    relativeVelocity: 0,
    relativePosition: 'front',
    safetyStatus: 'SAFE',
    timeToCollision: ttc,
    updatedAt: new Date().toISOString(),
  });

  it('classifies front vehicle as SAFE when distance exceeds 10m caution threshold', () => {
    const status = engine.evaluateStatus(15.0, null, 'SAFE', settings, true);
    expect(status).toBe('SAFE');
  });

  it('classifies front vehicle as CAUTION when within 10m front warning threshold', () => {
    const status = engine.evaluateStatus(8.0, null, 'SAFE', settings, true);
    expect(status).toBe('CAUTION');
  });

  it('classifies front vehicle as DANGER when within 5m danger threshold', () => {
    const status = engine.evaluateStatus(3.5, null, 'SAFE', settings, true);
    expect(status).toBe('DANGER');
  });

  it('uses 1m warning threshold for side lane vehicles and 10m for front vehicles', () => {
    // 1. Side Lane Vehicles (isSameLane = false):
    // Normal adjacent traffic clearance (e.g. 3.6m or 1.5m) => SAFE
    const sideFar = engine.evaluateStatus(2.5, null, 'SAFE', settings, false);
    expect(sideFar).toBe('SAFE');

    const sideBorder = engine.evaluateStatus(1.5, null, 'SAFE', settings, false);
    expect(sideBorder).toBe('SAFE');

    // Encroaching side vehicle within 1.0m => CAUTION
    const sideCaution = engine.evaluateStatus(0.8, null, 'SAFE', settings, false);
    expect(sideCaution).toBe('CAUTION');

    // Imminent sideswipe contact within 0.5m => DANGER
    const sideDanger = engine.evaluateStatus(0.4, null, 'SAFE', settings, false);
    expect(sideDanger).toBe('DANGER');

    // 2. Front Vehicle (isSameLane = true):
    // At 12m => SAFE
    const frontSafe = engine.evaluateStatus(12.0, null, 'SAFE', settings, true);
    expect(frontSafe).toBe('SAFE');

    // At 8.0m (<= 10m) => CAUTION
    const frontCaution = engine.evaluateStatus(8.0, null, 'SAFE', settings, true);
    expect(frontCaution).toBe('CAUTION');

    // At 4.0m (<= 5m) => DANGER
    const frontDanger = engine.evaluateStatus(4.0, null, 'SAFE', settings, true);
    expect(frontDanger).toBe('DANGER');
  });

  it('classifies as DANGER when TTC is critically low even if distance is moderate', () => {
    // Distance = 8m (normally caution), but TTC is 1.8s (below 2.5s threshold)
    const status = engine.evaluateStatus(8.0, 1.8, 'SAFE', settings, true);
    expect(status).toBe('DANGER');
  });

  it('generates an event only on state transition and prevents duplicate events on identical ticks', () => {
    const vehicle = createDummyVehicle('veh-1', 20.0);

    // Tick 1: Safe -> Safe (Initial at 20m)
    const res1 = engine.processVehicle(vehicle, settings, 3);
    expect(res1.status).toBe('SAFE');
    expect(res1.event).toBeNull(); // No transition from default SAFE

    // Tick 2: Vehicle closes in to 8m (Caution - within 10m)
    vehicle.distance = 8.0;
    const res2 = engine.processVehicle(vehicle, settings, 3);
    expect(res2.status).toBe('CAUTION');
    expect(res2.event).not.toBeNull();
    expect(res2.event?.previousState).toBe('SAFE');
    expect(res2.event?.newState).toBe('CAUTION');

    // Tick 3: Vehicle stays at 8m on next tick -> MUST NOT duplicate event!
    const res3 = engine.processVehicle(vehicle, settings, 3);
    expect(res3.status).toBe('CAUTION');
    expect(res3.event).toBeNull(); // Duplicate prevented!

    // Tick 4: Vehicle enters Danger zone (3.5m <= 5m)
    vehicle.distance = 3.5;
    const res4 = engine.processVehicle(vehicle, settings, 3);
    expect(res4.status).toBe('DANGER');
    expect(res4.event).not.toBeNull();
    expect(res4.event?.previousState).toBe('CAUTION');
    expect(res4.event?.newState).toBe('DANGER');

    // Tick 5: Vehicle pulls away to 25m (Safe > 10m)
    vehicle.distance = 25.0;
    const res5 = engine.processVehicle(vehicle, settings, 3);
    expect(res5.status).toBe('SAFE');
    expect(res5.event).not.toBeNull();
    expect(res5.event?.previousState).toBe('DANGER');
    expect(res5.event?.newState).toBe('SAFE');
  });
});
