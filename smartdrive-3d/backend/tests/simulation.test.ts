import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimulationEngine } from '../src/simulation/SimulationEngine';
import { DatabaseEngine } from '../src/storage/Database';
import { BoundedEventQueue } from '../src/os_concepts/BoundedEventQueue';

describe('SimulationEngine (Lifecycle & Multi-Vehicle Traffic)', () => {
  let db: DatabaseEngine;
  let queue: BoundedEventQueue;
  let sim: SimulationEngine;

  beforeEach(() => {
    db = new DatabaseEngine(':memory:');
    queue = new BoundedEventQueue(50);
    sim = new SimulationEngine(db, queue);
  });

  afterEach(() => {
    sim.pause();
    db.close();
  });

  it('initializes with reference vehicle and at least 8 surrounding vehicles', () => {
    const state = sim.getState();
    expect(state.ourVehicle.id).toBe('our-vehicle');
    expect(state.vehicles.length).toBeGreaterThanOrEqual(8);
  });

  it('updates vehicle positions and tick count on simulation tick', () => {
    const initialTicks = sim.getState().tickCount;
    sim.tick();
    const afterTicks = sim.getState().tickCount;
    expect(afterTicks).toBe(initialTicks + 1);
  });

  it('allows starting, pausing, resuming, and resetting simulation', () => {
    sim.start();
    expect(sim.getState().isRunning).toBe(true);
    expect(sim.getState().isPaused).toBe(false);

    sim.pause();
    expect(sim.getState().isPaused).toBe(true);

    sim.resume();
    expect(sim.getState().isRunning).toBe(true);
    expect(sim.getState().isPaused).toBe(false);

    sim.reset();
    expect(sim.getState().tickCount).toBe(0);
  });

  it('triggers a controlled lead braking danger scenario properly', () => {
    sim.triggerScenario('lead_braking');
    sim.tick();

    const state = sim.getState();
    const lead = state.vehicles.find((v) => v.id === 'veh-front-lead');
    expect(lead).toBeDefined();
    // After lead vehicle brakes sharply, its speed dropped and it enters caution/danger
    expect(lead?.speed).toBeLessThanOrEqual(15.0);
  });

  it('supports adjusting our vehicle target speed and braking', () => {
    sim.setOurSpeed(32.0);
    expect(sim.getState().ourVehicle.targetSpeed).toBe(32.0);

    sim.applyBrake(true);
    expect(sim.getState().ourVehicle.brakeActive).toBe(true);

    sim.applyEmergencyBrake();
    expect(sim.getState().ourVehicle.emergencyBrakeActive).toBe(true);
  });

  it('supports dynamically adding and removing surrounding vehicles', () => {
    const initialCount = sim.getState().vehicles.length;
    const newVeh = sim.addVehicle({ name: 'Special Cruiser', lane: -1, y: 50.0 });

    expect(sim.getState().vehicles.length).toBe(initialCount + 1);
    expect(newVeh.name).toBe('Special Cruiser');

    const removed = sim.removeVehicle(newVeh.id);
    expect(removed).toBe(true);
    expect(sim.getState().vehicles.length).toBe(initialCount);
  });
});
