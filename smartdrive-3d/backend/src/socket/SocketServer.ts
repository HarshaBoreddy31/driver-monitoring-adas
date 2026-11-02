/**
 * Socket.IO Real-Time Communication Server
 *
 * Requirements:
 * - Broadcasts simulation:state, vehicles:update, warning:triggered, warning:cleared, simulation:status
 * - Synchronizes full state when a client connects or reconnects
 * - Handles client commands and controls
 * - Handles disconnections and connection telemetry
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { SimulationState, WarningEvent } from '../types';

export class SocketServer {
  private io: Server;
  private simulation: SimulationEngine;
  private connectedClients: number = 0;

  constructor(httpServer: HttpServer, simulation: SimulationEngine, corsOrigin: string = '*') {
    this.simulation = simulation;
    this.io = new Server(httpServer, {
      cors: {
        origin:
          corsOrigin === '*'
            ? true
            : [
                corsOrigin,
                'http://localhost:5180',
                'http://127.0.0.1:5180',
                'http://localhost:5173',
                'http://127.0.0.1:5173',
              ],
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 10000,
      pingTimeout: 5000,
    });

    this.setupListeners();
    this.bindSimulationEvents();
  }

  private setupListeners(): void {
    this.io.on('connection', (socket: Socket) => {
      this.connectedClients++;
      console.log(`[WebSocket] Client connected: ${socket.id} (Total: ${this.connectedClients})`);

      const currentState = this.simulation.getState();

      // 1. Initial State Synchronization on connection / reconnection
      socket.emit('simulation:state', currentState);
      socket.emit('simulation:status', {
        isRunning: currentState.isRunning,
        isPaused: currentState.isPaused,
        tickCount: currentState.tickCount,
        uptimeSeconds: currentState.uptimeSeconds,
      });

      // 2. Client Controls Handlers
      socket.on('client:control:start', () => {
        this.simulation.start();
      });

      socket.on('client:control:pause', () => {
        this.simulation.pause();
      });

      socket.on('client:control:resume', () => {
        this.simulation.resume();
      });

      socket.on('client:control:reset', () => {
        this.simulation.reset();
      });

      socket.on('client:control:scenario', (data: { scenario: string }) => {
        if (data && data.scenario) {
          this.simulation.triggerScenario(data.scenario);
        }
      });

      socket.on('client:control:speed', (data: { speedMs: number }) => {
        if (data && typeof data.speedMs === 'number') {
          this.simulation.setOurSpeed(data.speedMs);
        }
      });

      socket.on('client:control:brake', (data: { active: boolean; emergency?: boolean }) => {
        if (data) {
          if (data.emergency) {
            this.simulation.applyEmergencyBrake();
          } else {
            this.simulation.applyBrake(data.active);
          }
        }
      });

      socket.on('client:control:lane', (data: { lane: number }) => {
        if (data && typeof data.lane === 'number') {
          this.simulation.setOurLane(data.lane);
        }
      });

      // Ping-pong latency verification
      socket.on('ping', (ack) => {
        if (typeof ack === 'function') {
          ack();
        }
      });

      socket.on('disconnect', () => {
        this.connectedClients--;
        console.log(`[WebSocket] Client disconnected: ${socket.id} (Remaining: ${this.connectedClients})`);
      });
    });
  }

  /**
   * Binds to simulation engine's internal observer events to broadcast updates.
   */
  private bindSimulationEvents(): void {
    // High-frequency state snapshot broadcast on tick
    this.simulation.onStateChange((state: SimulationState) => {
      // 1. Full state snapshot
      this.io.emit('simulation:state', state);

      // 2. High-frequency vehicle positions & calculated distance updates
      this.io.emit('vehicles:update', {
        vehicles: state.vehicles,
        ourVehicle: state.ourVehicle,
        timestamp: state.timestamp,
      });

      // 3. Status updates
      this.io.emit('simulation:status', {
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        tickCount: state.tickCount,
        uptimeSeconds: state.uptimeSeconds,
      });
    });

    // Authoritative warning event broadcast on state transition
    this.simulation.onWarningEvent((event: WarningEvent) => {
      if (event.newState === 'SAFE') {
        this.io.emit('warning:cleared', event);
      } else {
        this.io.emit('warning:triggered', event);
      }
    });
  }

  public getConnectedCount(): number {
    return this.connectedClients;
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        console.log('[WebSocket] Server closed');
        resolve();
      });
    });
  }
}
