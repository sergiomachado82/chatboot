import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { syncFromGoogleCalendar } from './googleCalendarService.js';
import { createQueue } from '../lib/queue.js';
import type Bull from 'bull';

let queue: Bull.Queue | null = null;

async function runSync(): Promise<void> {
  if (!env.GOOGLE_CALENDAR_ID || !env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
    return; // GCal not configured, skip silently
  }

  try {
    await syncFromGoogleCalendar();
  } catch (err) {
    logger.error({ err }, 'GCal sync job failed');
  }
}

export function startGCalSyncJob() {
  if (!env.GOOGLE_CALENDAR_ID) {
    logger.info('Google Calendar not configured, skipping GCal sync job');
    return;
  }

  queue = createQueue('gcal-sync');

  queue.process(async () => {
    await runSync();
  });

  queue.add({}, { delay: 15_000, repeat: { every: 300_000 } }); // 5 min

  logger.info('GCal sync job started (Bull queue, every 5 min)');
}

export function stopGCalSyncJob() {
  queue = null;
}
