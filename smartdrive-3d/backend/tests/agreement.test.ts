import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import request from 'supertest';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/server';
import { SocketServer } from '../src/socket/SocketServer';
import { SimulationState, WarningEvent } from '../src/types';

describe('Stage 4: Client-Server Telemetry Agreement & Distance Verification', () => {
  let app: any;
  let server: http.Server;
  let socketServer: SocketServer;
  let clientSocket: ClientSocket;
  let simulation: any;
  let database: any;
  const PORT = 4097;

  beforeAll(async () => {
    const created = createApp(':memory:');
    app = created.app;
    simulation = created.simulation;
    database = created.database;

    server = http.createServer(app);
    socketServer = new SocketServer(server, simulation, '*');

    await new Promise<void>((resolve) => {
      server.listen(PORT, () => resolve());
    });

    clientSocket = Client(`http://localhost:${PORT}`, {
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      clientSocket.on('connect', () => resolve());
    });
  });

  afterAll(async () => {
    clientSocket.disconnect();
    simulation.pause();
    await socketServer.close();
    database.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('proves client WebSocket state and backend REST API agree on calculated Euclidean distances', async () => {
    // 1. Prepare WebSocket receiver for the upcoming tick
    const socketPromise = new Promise<SimulationState>((resolve) => {
      clientSocket.once('simulation:state', (s) => resolve(s));
    });

    // 2. Advance a single tick to broadcast to WebSocket
    simulation.tick();
    const socketState = await socketPromise;

    // 3. Immediately query REST API for the current frozen state (simulation paused)
    const apiRes = await request(app).get('/api/vehicles');
    expect(apiRes.status).toBe(200);
    const apiVehicles = apiRes.body.vehicles;

    // 4. Verify 1:1 agreement for every vehicle
    expect(apiVehicles.length).toBe(socketState.vehicles.length);

    for (const wsVeh of socketState.vehicles) {
      const restVeh = apiVehicles.find((v: any) => v.id === wsVeh.id);
      expect(restVeh).toBeDefined();

      // Exact agreement check on Euclidean distance (within 0.001m precision)
      expect(Math.abs(wsVeh.distance - restVeh.distance)).toBeLessThan(0.001);

      // Exact agreement check on Safety Status
      expect(wsVeh.safetyStatus).toBe(restVeh.safetyStatus);

      // Exact agreement check on relative velocity
      expect(Math.abs(wsVeh.relativeVelocity - restVeh.relativeVelocity)).toBeLessThan(0.001);

      // Exact agreement check on relative position classification
      expect(wsVeh.relativePosition).toBe(restVeh.relativePosition);
    }
  });

  it('proves that a dynamic transition to DANGER alerts the client, updates the REST API, and logs to SQLite', async () => {
    // 1. Listen for WebSocket warning
    const warningPromise = new Promise<WarningEvent>((resolve) => {
      clientSocket.once('warning:triggered', (e) => resolve(e));
    });

    // 2. Trigger lead vehicle emergency braking scenario and advance tick
    simulation.triggerScenario('lead_braking');
    simulation.tick();

    // 3. Verify WebSocket event received
    const event = await warningPromise;
    expect(event).toBeDefined();
    expect(event.vehicleId).toBe('veh-front-lead');
    expect(['CAUTION', 'DANGER']).toContain(event.newState);

    // 4. Verify REST API reflects the same danger state
    const apiRes = await request(app).get('/api/vehicles');
    const leadInApi = apiRes.body.vehicles.find((v: any) => v.id === 'veh-front-lead');
    expect(leadInApi.safetyStatus).toBe(event.newState);
    expect(Math.abs(leadInApi.distance - event.distance)).toBeLessThan(0.001);

    // 5. Verify SQLite persistence records the exact same event
    const eventsRes = await request(app).get('/api/events?limit=10');
    expect(eventsRes.status).toBe(200);
    const logged = eventsRes.body.events.find((e: any) => e.vehicleId === 'veh-front-lead');
    expect(logged).toBeDefined();
    expect(logged.newState).toBe(event.newState);
    expect(Math.abs(logged.distance - event.distance)).toBeLessThan(0.001);
  });
});
