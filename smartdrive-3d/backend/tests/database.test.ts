import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseEngine } from '../src/storage/Database';
import { WarningEvent } from '../src/types';

describe('DatabaseEngine (SQLite Persistence & Fallback)', () => {
  let db: DatabaseEngine;

  beforeEach(() => {
    db = new DatabaseEngine(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('persists and retrieves warning events correctly', () => {
    const event: WarningEvent = {
      id: 'test-evt-1',
      vehicleId: 'veh-1',
      vehicleName: 'Test Vehicle',
      timestamp: new Date().toISOString(),
      distance: 14.5,
      longitudinalDistance: 14.2,
      previousState: 'SAFE',
      newState: 'DANGER',
      relativePosition: 'front',
      relativeVelocity: -4.5,
      timeToCollision: 3.1,
    };

    db.insertEvent(event);

    const events = db.getEvents(10, 0);
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('test-evt-1');
    expect(events[0].distance).toBe(14.5);
    expect(events[0].newState).toBe('DANGER');
  });

  it('clears warning event history', () => {
    const event: WarningEvent = {
      id: 'test-evt-2',
      vehicleId: 'veh-2',
      vehicleName: 'Tailgater',
      timestamp: new Date().toISOString(),
      distance: 9.8,
      longitudinalDistance: 9.5,
      previousState: 'CAUTION',
      newState: 'DANGER',
      relativePosition: 'rear',
      relativeVelocity: 6.0,
      timeToCollision: 1.6,
    };

    db.insertEvent(event);
    expect(db.getEvents().length).toBe(1);

    db.clearEvents();
    expect(db.getEvents().length).toBe(0);
  });
});
