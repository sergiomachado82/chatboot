import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { syncFromBookingIcal } from './icalService.js';

const SYNC_INTERVAL_MS = 30 * 60 * 1000; // Every 30 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Iterate all complejos with an icalUrl configured and sync each one.
 */
async function runSync(): Promise<void> {
  const complejos = await prisma.complejo.findMany({
    where: { icalUrl: { not: null }, activo: true },
    select: { id: true, nombre: true, icalUrl: true },
  });

  if (complejos.length === 0) return;

  logger.info({ count: complejos.length }, 'Starting iCal sync cycle');

  for (const c of complejos) {
    try {
      const result = await syncFromBookingIcal(c.id, c.icalUrl!);
      if (result.created || result.updated || result.cancelled) {
        logger.info(
          { complejo: c.nombre, ...result },
          'iCal sync changes applied',
        );
      }
    } catch (err) {
      logger.error({ err, complejo: c.nombre }, 'iCal sync failed for complejo');
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
