import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './lib/prisma.js';
import { initRedis, closeRedis } from './lib/redis.js';
import { initSocketIO, closeSocketAdapter } from './services/socketManager.js';
import { startCleanupJob, stopCleanupJob } from './services/conversacionCleanup.js';
import { startIcalSyncJob, stopIcalSyncJob } from './services/icalSyncJob.js';
import { startGCalSyncJob, stopGCalSyncJob } from './services/gcalSyncJob.js';
import { startEmailPollerJob, stopEmailPollerJob } from './services/emailPollerService.js';
import { startAlertJob, stopAlertJob } from './services/alertService.js';
import { closeAllQueues } from './lib/queue.js';

const server = http.createServer(app);

async function start() {
  // Init services
  await prisma.$connect();
  logger.info('Database connected');

  await initRedis();
  initSocketIO(server);
  startCleanupJob();
  startIcalSyncJob();
  startGCalSyncJob();
  startEmailPollerJob();
  startAlertJob();

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
    if (env.SIMULATOR_MODE) {
      logger.info('WhatsApp Simulator mode enabled');
    }
  });
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);
  stopCleanupJob();
  stopIcalSyncJob();
  stopGCalSyncJob();
  stopEmailPollerJob();
  stopAlertJob();
  await closeAllQueues();

  // Stop accepting new connections, wait for in-flight requests
  server.close(async () => {
    logger.info('HTTP server closed, cleaning up services...');
    await closeSocketAdapter();
    await prisma.$disconnect();
    await closeRedis();
    logger.info('All services closed');
    process.exit(0);
  });

  // Give in-flight requests 2 seconds to finish before force-closing
  setTimeout(() => {
    logger.warn('Force-closing remaining connections after 2s grace period');
    server.closeAllConnections();
  }, 2_000);

  // Hard timeout: force exit after 10 seconds regardless
  setTimeout(() => {
    logger.error('Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});

export { server };
