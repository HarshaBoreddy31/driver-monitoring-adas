import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../src/server';
import { SocketServer } from '../src/socket/SocketServer';
import { SimulationState, WarningEvent } from '../src/types';

describe('Stage 2: Socket.IO Real-Time Communication & Synchronization', () => {
  let server: http.Server;
  let socketServer: SocketServer;
  let clientSocket: ClientSocket;
  let simulation: any;
  let database: any;
  const PORT = 4098;

  beforeAll(async () => {
    const created = createApp(':memory:');
    simulation = created.simulation;
    database = created.database;

    server = http.createServer(created.app);
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

  it('synchronizes initial simulation:state and simulation:status on client connection', async () => {
    // Connect a fresh client to test initial sync
    const freshClient = Client(`http://localhost:${PORT}`, {
      transports: ['websocket'],
    });

    const [state, status] = await Promise.all([
      new Promise<SimulationState>((resolve) => {
        freshClient.once('simulation:state', (s) => resolve(s));
      }),
      new Promise<any>((resolve) => {
        freshClient.once('simulation:status', (st) => resolve(st));
      }),
    ]);

    expect(state).toBeDefined();
    expect(state.ourVehicle.id).toBe('our-vehicle');
    expect(state.vehicles.length).toBeGreaterThanOrEqual(8);
    expect(status).toBeDefined();
    expect(typeof status.isRunning).toBe('boolean');

    freshClient.disconnect();
  });

  it('broadcasts authoritative vehicles:update with valid Euclidean distances on simulation tick', async () => {
    const updatePromise = new Promise<any>((resolve) => {
      clientSocket.once('vehicles:update', (data) => resolve(data));
    });

    simulation.tick();

    const data = await updatePromise;
    expect(data).toBeDefined();
    expect(data.vehicles).toBeDefined();
    expect(data.vehicles.length).toBeGreaterThanOrEqual(8);

    // Verify distance is mathematical Euclidean distance d = sqrt(dx^2 + dy^2)
    const testVeh = data.vehicles[0];
    const dx = testVeh.x - data.ourVehicle.x;
    const dy = testVeh.y - data.ourVehicle.y;
    const expectedEuclidean = Math.sqrt(dx * dx + dy * dy);
    expect(Math.abs(testVeh.distance - expectedEuclidean)).toBeLessThan(0.01);
  });

  it('broadcasts warning:triggered event when a vehicle enters danger threshold', async () => {
    const warningPromise = new Promise<WarningEvent>((resolve) => {
      clientSocket.once('warning:triggered', (event) => resolve(event));
    });

    // Trigger lead braking scenario which breaches the 15m danger threshold
    simulation.triggerScenario('lead_braking');
    simulation.tick();

    const event = await warningPromise;
    expect(event).toBeDefined();
    expect(['CAUTION', 'DANGER']).toContain(event.newState);
    expect(event.distance).toBeDefined();
    expect(event.vehicleId).toBeDefined();
    expect(event.relativePosition).toBeDefined();
  });

  it('broadcasts simulation:status changes when simulation is paused or resumed', async () => {
    const statusPromise = new Promise<any>((resolve) => {
      clientSocket.once('simulation:status', (status) => resolve(status));
    });

    simulation.pause();

    const status = await statusPromise;
    expect(status).toBeDefined();
    expect(status.isPaused).toBe(true);
  });

  it('accepts client control commands over Socket.IO and updates authoritative state', async () => {
    // 1. Throttle / Speed command
    clientSocket.emit('client:control:speed', { speedMs: 35.0 });
    await new Promise((r) => setTimeout(r, 40));
    expect(simulation.getState().ourVehicle.targetSpeed).toBe(35.0);

    // 2. Stepped Lane change command
    clientSocket.emit('client:control:lane', { lane: 2 });
    await new Promise((r) => setTimeout(r, 40));
    expect(simulation.getState().ourVehicle.lane).toBe(2);

    // 3. Emergency Brake command
    clientSocket.emit('client:control:brake', { active: true, emergency: true });
    await new Promise((r) => setTimeout(r, 40));
    expect(simulation.getState().ourVehicle.emergencyBrakeActive).toBe(true);
  });

  it('handles client reconnection and sends updated state to the reconnected client', async () => {
    // Disconnect and reconnect
    clientSocket.disconnect();
    expect(clientSocket.connected).toBe(false);

    // Mutate state while client is disconnected
    simulation.setOurSpeed(22.0);

    const reconnectedPromise = new Promise<SimulationState>((resolve) => {
      const onState = (s: SimulationState) => {
        clientSocket.off('simulation:state', onState);
        resolve(s);
      };
      clientSocket.on('simulation:state', onState);
    });

    clientSocket.connect();

    const reconnectedState = await reconnectedPromise;
    expect(reconnectedState).toBeDefined();
    expect(reconnectedState.ourVehicle.targetSpeed).toBe(22.0);
  });
});
