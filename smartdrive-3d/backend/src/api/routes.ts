/**
 * Express REST API Routes
 *
 * Requirements:
 * - GET /api/health
 * - GET /api/vehicles
 * - GET /api/status
 * - GET /api/events
 * - DELETE /api/events
 * - GET /api/settings
 * - PATCH /api/settings
 * - POST /api/simulation/start
 * - POST /api/simulation/pause
 * - POST /api/simulation/resume
 * - POST /api/simulation/reset
 * - POST /api/simulation/scenario
 * - POST /api/simulation/speed
 * - POST /api/simulation/brake
 * - GET /api/os/metrics
 * - Input validation using Zod
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { DatabaseEngine } from '../storage/Database';
import { BoundedEventQueue } from '../os_concepts/BoundedEventQueue';

export function createApiRouter(
  simulation: SimulationEngine,
  database: DatabaseEngine,
  eventQueue: BoundedEventQueue
): Router {
  const router = Router();

  // --- System Health ---
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'SmartDrive 3D Backend & Authoritative Calculation Engine',
      version: '1.0.0',
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  });

  // --- Simulation Status ---
  router.get('/status', (_req: Request, res: Response) => {
    const state = simulation.getState();
    res.json({
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      tickCount: state.tickCount,
      uptimeSeconds: state.uptimeSeconds,
      activeWarnings: state.activeWarnings,
      vehicleCount: state.vehicles.length,
      ourVehicle: state.ourVehicle,
      timestamp: state.timestamp,
    });
  });

  // --- Vehicles Telemetry ---
  router.get('/vehicles', (_req: Request, res: Response) => {
    const state = simulation.getState();
    res.json({
      success: true,
      vehicles: state.vehicles,
      ourVehicle: state.ourVehicle,
      count: state.vehicles.length,
      timestamp: state.timestamp,
    });
  });

  // --- Warning Events History ---
  router.get('/events', (req: Request, res: Response) => {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const events = database.getEvents(limit, offset);
    res.json({
      success: true,
      events,
      count: events.length,
      limit,
      offset,
    });
  });

  router.delete('/events', (_req: Request, res: Response) => {
    database.clearEvents();
    res.json({ success: true, message: 'Warning history cleared' });
  });

  // --- Settings ---
  router.get('/settings', (_req: Request, res: Response) => {
    res.json({
      success: true,
      settings: simulation.getSettings(),
    });
  });

  const settingsSchema = z.object({
    dangerDistance: z.number().min(1).max(40).optional(),
    cautionDistance: z.number().min(3).max(70).optional(),
    differentLaneWarningDistance: z.number().min(0.2).max(30).optional(),
    ttcThreshold: z.number().min(1.0).max(10.0).optional(),
    ourSpeedMs: z.number().min(0).max(50).optional(),
    tickRateMs: z.number().min(20).max(1000).optional(),
    autoTraffic: z.boolean().optional(),
    warningSoundEnabled: z.boolean().optional(),
  });

  router.patch('/settings', (req: Request, res: Response) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.format() });
      return;
    }

    const updated = simulation.updateSettings(parsed.data);
    res.json({ success: true, settings: updated });
  });

  // --- Simulation Lifecycle Controls ---
  router.post('/simulation/start', (_req: Request, res: Response) => {
    simulation.start();
    res.json({ success: true, message: 'Simulation started' });
  });

  router.post('/simulation/pause', (_req: Request, res: Response) => {
    simulation.pause();
    res.json({ success: true, message: 'Simulation paused' });
  });

  router.post('/simulation/resume', (_req: Request, res: Response) => {
    simulation.resume();
    res.json({ success: true, message: 'Simulation resumed' });
  });

  router.post('/simulation/reset', (_req: Request, res: Response) => {
    simulation.reset();
    res.json({ success: true, message: 'Simulation reset to default state' });
  });

  // --- Scenario Triggers ---
  const scenarioSchema = z.object({
    scenario: z.enum([
      'lead_braking',
      'aggressive_tailgate',
      'blindspot_cut_in',
      'multi_hazard',
      'reset_normal',
    ]),
  });

  router.post('/simulation/scenario', (req: Request, res: Response) => {
    const parsed = scenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.format() });
      return;
    }

    simulation.triggerScenario(parsed.data.scenario);
    res.json({
      success: true,
      message: `Scenario '${parsed.data.scenario}' activated`,
    });
  });

  // --- Reference Vehicle Controls ---
  const speedSchema = z.object({
    speedMs: z.number().min(0).max(45),
  });

  router.post('/simulation/speed', (req: Request, res: Response) => {
    const parsed = speedSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.format() });
      return;
    }

    simulation.setOurSpeed(parsed.data.speedMs);
    res.json({ success: true, speedMs: parsed.data.speedMs });
  });

  const laneSchema = z.object({
    lane: z.number().min(1).max(5),
  });

  router.post('/simulation/lane', (req: Request, res: Response) => {
    const parsed = laneSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.format() });
      return;
    }

    simulation.setOurLane(parsed.data.lane);
    res.json({ success: true, lane: parsed.data.lane });
  });

  const brakeSchema = z.object({
    active: z.boolean(),
    emergency: z.boolean().optional(),
  });

  router.post('/simulation/brake', (req: Request, res: Response) => {
    const parsed = brakeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.format() });
      return;
    }

    if (parsed.data.emergency) {
      simulation.applyEmergencyBrake();
    } else {
      simulation.applyBrake(parsed.data.active);
    }

    res.json({
      success: true,
      brakeActive: parsed.data.active,
      emergencyBrake: !!parsed.data.emergency,
    });
  });

  // --- Target Vehicle Manipulations ---
  router.post('/simulation/vehicles', (req: Request, res: Response) => {
    const newVehicle = simulation.addVehicle(req.body);
    res.status(201).json({ success: true, vehicle: newVehicle });
  });

  router.delete('/simulation/vehicles/:id', (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = simulation.removeVehicle(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    res.json({ success: true, message: `Vehicle ${id} removed` });
  });

  router.post('/simulation/vehicles/:id/speed', (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const parsed = speedSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.format() });
      return;
    }

    const updated = simulation.setVehicleSpeed(id, parsed.data.speedMs);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }
    res.json({ success: true, vehicleId: id, speedMs: parsed.data.speedMs });
  });

  // --- Operating Systems Telemetry & Metrics ---
  router.get('/os/metrics', (_req: Request, res: Response) => {
    const queueMetrics = eventQueue.getMetrics();
    res.json({
      success: true,
      concepts: {
        cyclicScheduler: {
          periodMs: simulation.getSettings().tickRateMs,
          tickCount: simulation.getState().tickCount,
          pattern: 'Periodic RTOS Cyclic Executive with drift compensation',
        },
        producerConsumerBuffer: {
          queueType: 'Bounded In-Memory FIFO Queue',
          ...queueMetrics,
        },
        sharedMemoryArchitecture: {
          concurrencyModel: 'Single-Writer Authoritative Kernel State with Immutable Snapshots',
          threadSafety: 'Node.js Event Loop non-preemptive cooperative scheduling',
        },
      },
    });
  });

  return router;
}
