import { createQueue } from '../lib/queue.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type Bull from 'bull';

let queue: Bull.Queue | null = null;

/** Throttle map: service → last alert timestamp */
const throttleMap = new Map<string, number>();
const THROTTLE_MS = 60 * 60 * 1000; // 1 hour

async function checkHealthAndAlert(): Promise<void> {
  if (!env.ALERT_EMAIL) return;

  try {
    // Fetch internal health endpoint
    const res = await fetch(`http://localhost:${env.PORT}/api/health`);
    if (!res.ok) {
      logger.warn({ status: res.status }, 'Health endpoint returned non-OK');
      return;
    }

    const data = (await res.json()) as {
      status: string;
      services: Record<string, { status: string }>;
    };

    const critical = ['database', 'redis'];
    const now = Date.now();

    for (const svc of critical) {
      const svcData = data.services[svc];
      if (svcData && svcData.status === 'error') {
        const lastAlert = throttleMap.get(svc) ?? 0;
        if (now - lastAlert < THROTTLE_MS) continue;

        throttleMap.set(svc, now);
        logger.warn({ service: svc }, 'Critical service down, sending alert email');

        try {
          const { default: nodemailer } = await import('nodemailer');
          const transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465,
            auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
          });

          await transporter.sendMail({
            from: env.SMTP_USER,
            to: env.ALERT_EMAIL,
            subject: `[ALERTA] Servicio critico caido: ${svc}`,
            text: `El servicio "${svc}" esta reportando estado "error" en el health check.\n\nTimestamp: ${new Date().toISOString()}\nServidor: ${env.FRONTEND_URL}`,
          });

          logger.info({ service: svc, to: env.ALERT_EMAIL }, 'Alert email sent');
        } catch (emailErr) {
          logger.error({ err: emailErr, service: svc }, 'Failed to send alert email');
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error checking health for alerts');
  }
}

export function startAlertJob(): void {
  if (!env.ALERT_EMAIL) {
    logger.info('ALERT_EMAIL not configured, skipping alert job');
    return;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER) {
    logger.info('SMTP not configured, skipping alert job');
    return;
  }

  queue = createQueue('health-alerts');

  queue.process(async () => {
    await checkHealthAndAlert();
  });

  queue.add({}, { delay: 30_000, repeat: { every: 300_000 } }); // every 5 min

  logger.info('Health alert job started (Bull queue, every 5 min)');
}

export function stopAlertJob(): void {
  queue = null;
}
