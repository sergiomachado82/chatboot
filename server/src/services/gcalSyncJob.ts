import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { syncFromGoogleCalendar } from './googleCalendarService.js';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes

let intervalId: ReturnType<typeof setInterval> | null = null;

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

  // Run once on startup (delayed 15s to let server finish init)
  setTimeout(() => {
    runSync().catch((err) => {
      logger.error({ err }, 'Error in GCal sync job');
    });
  }, 15_000);

  // Then run periodically
  intervalId = setInterval(() => {
    runSync().catch((err) => {
      logger.error({ err }, 'Error in GCal sync job');
    });
  }, SYNC_INTERVAL_MS);

  logger.info(`GCal sync job started (every ${SYNC_INTERVAL_MS / 1000 / 60} min)`);
}

export function stopGCalSyncJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
