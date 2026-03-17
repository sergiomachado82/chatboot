import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { syncFromIcalFeed } from './icalService.js';

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // Every 30 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Iterate all active iCal feeds and sync each one.
 */
async function runSync(): Promise<void> {
  const feeds = await prisma.icalFeed.findMany({
    where: { activo: true, complejo: { activo: true } },
    select: { id: true, complejoId: true, url: true, plataforma: true, complejo: { select: { nombre: true } } },
  });

  if (feeds.length === 0) return;

  logger.info({ count: feeds.length }, 'Starting iCal sync cycle');

  for (const feed of feeds) {
    try {
      const result = await syncFromIcalFeed(feed.complejoId, feed.url, feed.plataforma);
      if (result.created || result.updated || result.cancelled) {
        logger.info(
          { complejo: feed.complejo.nombre, plataforma: feed.plataforma, ...result },
          'iCal sync changes applied',
        );
      }
      // Update ultimoSync timestamp
      await prisma.icalFeed.update({
        where: { id: feed.id },
        data: { ultimoSync: new Date() },
      });
    } catch (err) {
      logger.error({ err, complejo: feed.complejo.nombre, plataforma: feed.plataforma }, 'iCal sync failed for feed');
    }
  }
}

export function startIcalSyncJob() {
  // Run once on startup (delayed 10s to let server finish init)
  setTimeout(() => {
    runSync().catch((err) => {
      logger.error({ err }, 'Error in iCal sync job');
    });
  }, 10_000);

  // Then run periodically
  intervalId = setInterval(() => {
    runSync().catch((err) => {
      logger.error({ err }, 'Error in iCal sync job');
    });
  }, SYNC_INTERVAL_MS);

  logger.info(`iCal sync job started (every ${SYNC_INTERVAL_MS / 1000 / 60} min)`);
}

export function stopIcalSyncJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
