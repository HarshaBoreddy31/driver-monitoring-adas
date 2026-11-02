/**
 * SmartDrive 3D - Main Server Entrypoint
 *
 * Requirements:
 * - Express API + HTTP Server + Socket.IO Server
 * - Shared authoritative state between API and WebSockets
 * - Graceful shutdown and error handling
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createApiRouter } from './api/routes';
import { SimulationEngine } from './simulation/SimulationEngine';
import { DatabaseEngine } from './storage/Database';
import { BoundedEventQueue } from './os_concepts/BoundedEventQueue';
import { SocketServer } from './socket/SocketServer';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const DB_PATH = process.env.DATABASE_PATH || './smartdrive.db';

export function createApp(dbPath: string = DB_PATH) {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: CORS_ORIGIN === '*' ? true : [CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    })
  );
  app.use(express.json());

  // Instantiate Core Subsystems
  const database = new DatabaseEngine(dbPath);
  const eventQueue = new BoundedEventQueue(100);
  const simulation = new SimulationEngine(database, eventQueue);

  // Mount API Routes
  app.use('/api', createApiRouter(simulation, database, eventQueue));

  return { app, simulation, database, eventQueue };
}

export function startServer() {
  const { app, simulation, database } = createApp();
  const server = http.createServer(app);

  // Attach Real-Time Socket.IO Server
  const socketServer = new SocketServer(server, simulation, CORS_ORIGIN);

  // Start the authoritative simulation loop automatically
  simulation.start();

  server.listen(PORT, () => {
    console.log('\n============================================================');
    console.log(' 🚗 SMARTDRIVE 3D — DISTANCE MONITORING BACKEND ACTIVE');
    console.log(` HTTP API:       http://localhost:${PORT}/api/health`);
    console.log(` WebSocket:      ws://localhost:${PORT}`);
    console.log(` Authoritative:  Calculated in backend at ${simulation.getSettings().tickRateMs}ms ticks`);
    console.log('============================================================\n');
  });

  // Graceful Shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefully...');
    simulation.pause();
    socketServer.close().then(() => {
      database.close();
      server.close(() => {
        console.log('[Server] Closed all connections. Exiting.');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { server, simulation, socketServer };
}

// Start if executed directly
if (require.main === module) {
  startServer();
}
