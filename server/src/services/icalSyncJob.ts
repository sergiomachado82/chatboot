import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { syncFromIcalFeed } from './icalService.js';
import { createQueue } from '../lib/queue.js';
import type Bull from 'bull';

let queue: Bull.Queue | null = null;

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
  queue = createQueue('ical-sync');

  queue.process(async () => {
    await runSync();
  });

  queue.add({}, { delay: 10_000, repeat: { every: 1_800_000 } }); // 30 min

  logger.info('iCal sync job started (Bull queue, every 30 min)');
}

export function stopIcalSyncJob() {
  queue = null;
}
