import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server';

describe('Express REST API Endpoints', () => {
  let app: any;
  let simulation: any;
  let database: any;

  beforeAll(() => {
    const created = createApp(':memory:');
    app = created.app;
    simulation = created.simulation;
    database = created.database;
  });

  afterAll(() => {
    simulation.pause();
    database.close();
  });

  it('GET /api/health returns healthy system status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.version).toBe('1.0.0');
  });

  it('GET /api/status returns current simulation state', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.vehicleCount).toBeGreaterThanOrEqual(8);
    expect(res.body.ourVehicle).toBeDefined();
  });

  it('GET /api/vehicles returns list of all active vehicles with distances', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.vehicles)).toBe(true);
    expect(res.body.vehicles[0].distance).toBeGreaterThan(0);
  });

  it('GET /api/settings returns authoritative thresholds', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.settings.dangerDistance).toBe(5.0);
    expect(res.body.settings.cautionDistance).toBe(10.0);
    expect(res.body.settings.differentLaneWarningDistance).toBe(1.0);
  });

  it('PATCH /api/settings updates thresholds with validation', async () => {
    // Valid update
    const res = await request(app)
      .patch('/api/settings')
      .send({ dangerDistance: 12.0, cautionDistance: 28.0 });

    expect(res.status).toBe(200);
    expect(res.body.settings.dangerDistance).toBe(12.0);

    // Invalid update (out of bounds)
    const errRes = await request(app)
      .patch('/api/settings')
      .send({ dangerDistance: -5.0 });

    expect(errRes.status).toBe(400);
  });

  it('POST /api/simulation/pause and /resume control lifecycle', async () => {
    const pauseRes = await request(app).post('/api/simulation/pause');
    expect(pauseRes.status).toBe(200);

    const resumeRes = await request(app).post('/api/simulation/resume');
    expect(resumeRes.status).toBe(200);
  });

  it('GET /api/os/metrics returns OS queue diagnostics', async () => {
    const res = await request(app).get('/api/os/metrics');
    expect(res.status).toBe(200);
    expect(res.body.concepts.producerConsumerBuffer).toBeDefined();
    expect(res.body.concepts.cyclicScheduler).toBeDefined();
  });
});
