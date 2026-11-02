/**
 * SQLite Database Persistence Engine
 *
 * Requirements:
 * - Uses SQLite for warning history and persistent configuration
 * - Implements database initialization and schema management
 * - Handles database errors gracefully (simulation remains stable if disk write fails)
 * - Safe reset and clearing of history
 */

import path from 'path';
import fs from 'fs';
import { WarningEvent, SimulationSettings } from '../types';

export class DatabaseEngine {
  private db: any = null;
  private isConnected: boolean = false;
  private inMemoryEvents: WarningEvent[] = []; // In-memory safety buffer

  constructor(dbPath: string = './smartdrive.db') {
    this.initDatabase(dbPath);
  }

  private initDatabase(dbPath: string): void {
    try {
      if (dbPath === ':memory:') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { DatabaseSync } = require('node:sqlite');
        this.db = new DatabaseSync(':memory:');
        this.isConnected = true;
        this.createSchema();
        return;
      }

      const fullPath = path.resolve(dbPath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Try loading native node:sqlite DatabaseSync (available in Node.js 22.5+)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(fullPath);
      this.isConnected = true;
      this.createSchema();
      console.log(`[Storage] Native SQLite database connected at: ${fullPath}`);
    } catch (err) {
      console.warn('[Storage] Native node:sqlite not available or error initializing. Using in-memory fallback buffer:', err);
      this.isConnected = false;
    }
  }

  private createSchema(): void {
    if (!this.isConnected || !this.db) return;

    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS warning_events (
          id TEXT PRIMARY KEY,
          vehicle_id TEXT NOT NULL,
          vehicle_name TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          distance REAL NOT NULL,
          longitudinal_distance REAL NOT NULL,
          previous_state TEXT NOT NULL,
          new_state TEXT NOT NULL,
          relative_position TEXT NOT NULL,
          relative_velocity REAL NOT NULL,
          time_to_collision REAL,
          cleared_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_warning_timestamp ON warning_events(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_warning_vehicle ON warning_events(vehicle_id);

        CREATE TABLE IF NOT EXISTS simulation_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    } catch (err) {
      console.error('[Storage] Error creating database schema:', err);
    }
  }

  /**
   * Records a warning event to SQLite.
   */
  public insertEvent(event: WarningEvent): void {
    // Keep in in-memory list for immediate fast reads
    this.inMemoryEvents.unshift(event);
    if (this.inMemoryEvents.length > 500) {
      this.inMemoryEvents.pop();
    }

    if (!this.isConnected || !this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO warning_events (
          id, vehicle_id, vehicle_name, timestamp, distance,
          longitudinal_distance, previous_state, new_state,
          relative_position, relative_velocity, time_to_collision, cleared_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        event.id,
        event.vehicleId,
        event.vehicleName,
        event.timestamp,
        event.distance,
        event.longitudinalDistance,
        event.previousState,
        event.newState,
        event.relativePosition,
        event.relativeVelocity,
        event.timeToCollision ?? null,
        event.clearedAt ?? null
      );
    } catch (err) {
      console.error('[Storage] Failed to persist warning event to SQLite:', err);
    }
  }

  /**
   * Retrieves warning events ordered by timestamp descending.
   */
  public getEvents(limit: number = 50, offset: number = 0): WarningEvent[] {
    if (!this.isConnected || !this.db) {
      return this.inMemoryEvents.slice(offset, offset + limit);
    }

    try {
      const stmt = this.db.prepare(`
        SELECT
          id,
          vehicle_id as vehicleId,
          vehicle_name as vehicleName,
          timestamp,
          distance,
          longitudinal_distance as longitudinalDistance,
          previous_state as previousState,
          new_state as newState,
          relative_position as relativePosition,
          relative_velocity as relativeVelocity,
          time_to_collision as timeToCollision,
          cleared_at as clearedAt
        FROM warning_events
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `);

      return stmt.all(limit, offset) as WarningEvent[];
    } catch (err) {
      console.error('[Storage] Error reading events from SQLite, returning memory cache:', err);
      return this.inMemoryEvents.slice(offset, offset + limit);
    }
  }

  /**
   * Clears all recorded warning events.
   */
  public clearEvents(): void {
    this.inMemoryEvents = [];
    if (!this.isConnected || !this.db) return;

    try {
      this.db.exec('DELETE FROM warning_events;');
      console.log('[Storage] Cleared warning history from SQLite');
    } catch (err) {
      console.error('[Storage] Error clearing warning events:', err);
    }
  }

  /**
   * Saves settings to SQLite.
   */
  public saveSettings(settings: SimulationSettings): void {
    if (!this.isConnected || !this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO simulation_settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `);

      stmt.run('global_settings', JSON.stringify(settings), new Date().toISOString());
    } catch (err) {
      console.error('[Storage] Error saving simulation settings:', err);
    }
  }

  /**
   * Retrieves saved settings from SQLite.
   */
  public getSettings(): SimulationSettings | null {
    if (!this.isConnected || !this.db) return null;

    try {
      const stmt = this.db.prepare(`
        SELECT value FROM simulation_settings WHERE key = 'global_settings'
      `);
      const row = stmt.get() as { value: string } | undefined;
      if (row && row.value) {
        return JSON.parse(row.value) as SimulationSettings;
      }
    } catch (err) {
      console.error('[Storage] Error loading simulation settings from SQLite:', err);
    }
    return null;
  }

  public close(): void {
    if (this.db && typeof this.db.close === 'function') {
      try {
        this.db.close();
      } catch (err) {
        console.error('[Storage] Error closing SQLite database:', err);
      }
    }
  }
}
