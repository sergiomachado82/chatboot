import { createQueue } from '../lib/queue.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import type Bull from 'bull';

let queue: Bull.Queue | null = null;

/** Throttle map: service → last alert timestamp */
const throttleMap = new Map<string, number>();
const THROTTLE_MS = 60 * 60 * 1000; // 1 hour

/** Sends an alert email using SMTP. Reused by all alert checks. */
async function sendAlertEmail(subject: string, text: string): Promise<void> {
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
    subject,
    text,
  });
}

/** Checks if the throttle allows sending an alert for the given key. If so, marks it as sent. */
function shouldAlert(key: string): boolean {
  const now = Date.now();
  const lastAlert = throttleMap.get(key) ?? 0;
  if (now - lastAlert < THROTTLE_MS) return false;
  throttleMap.set(key, now);
  return true;
}

/** Runs all health and integration checks and sends alert emails when thresholds are breached. */
async function checkHealthAndAlert(): Promise<void> {
  if (!env.ALERT_EMAIL) return;

  try {
    // --- Check 1: Health endpoint (database, redis) ---
    const res = await fetch(`http://localhost:${env.PORT}/api/health`);
    if (res.ok) {
      const data = (await res.json()) as {
        status: string;
        services: Record<string, { status: string }>;
      };

      const critical = ['database', 'redis'];
      for (const svc of critical) {
        const svcData = data.services[svc];
        if (svcData && svcData.status === 'error' && shouldAlert(svc)) {
          logger.warn({ service: svc }, 'Critical service down, sending alert email');
          try {
            await sendAlertEmail(
              `[ALERTA] Servicio critico caido: ${svc}`,
              `El servicio "${svc}" esta reportando estado "error" en el health check.\n\nTimestamp: ${new Date().toISOString()}\nServidor: ${env.FRONTEND_URL}`,
            );
            logger.info({ service: svc, to: env.ALERT_EMAIL }, 'Alert email sent');
          } catch (emailErr) {
            logger.error({ err: emailErr, service: svc }, 'Failed to send alert email');
          }
        }
      }
    } else {
      logger.warn({ status: res.status }, 'Health endpoint returned non-OK');
    }

    // --- Check 2: Claude API errors (≥3 in last 5 min) ---
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const claudeErrors = await prisma.integrationLog.count({
        where: { servicio: 'claude', creadoEn: { gte: fiveMinAgo } },
      });
      if (claudeErrors >= 3 && shouldAlert('claude_errors')) {
        logger.warn({ count: claudeErrors }, 'Claude error surge detected');
        await sendAlertEmail(
          '[ALERTA] Errores frecuentes de Claude IA',
          `Se detectaron ${claudeErrors} errores del servicio Claude en los ultimos 5 minutos.\n\nTimestamp: ${new Date().toISOString()}\nServidor: ${env.FRONTEND_URL}`,
        ).catch((err) => logger.error({ err }, 'Failed to send Claude alert email'));
      }
    } catch (err) {
      logger.error({ err }, 'Error checking Claude error logs');
    }

    // --- Check 3: WhatsApp API errors (≥3 in last 5 min) ---
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const waErrors = await prisma.integrationLog.count({
        where: { servicio: 'whatsapp', creadoEn: { gte: fiveMinAgo } },
      });
      if (waErrors >= 3 && shouldAlert('whatsapp_errors')) {
        logger.warn({ count: waErrors }, 'WhatsApp error surge detected');
        await sendAlertEmail(
          '[ALERTA] Errores frecuentes de WhatsApp',
          `Se detectaron ${waErrors} errores del servicio WhatsApp en los ultimos 5 minutos.\n\nTimestamp: ${new Date().toISOString()}\nServidor: ${env.FRONTEND_URL}`,
        ).catch((err) => logger.error({ err }, 'Failed to send WhatsApp alert email'));
      }
    } catch (err) {
      logger.error({ err }, 'Error checking WhatsApp error logs');
    }

    // --- Check 4: Escalation surge (≥5 in last hour) ---
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const escalations = await prisma.conversacion.count({
        where: { escaladaEn: { gte: oneHourAgo } },
      });
      if (escalations >= 5 && shouldAlert('escalation_surge')) {
        logger.warn({ count: escalations }, 'Escalation surge detected');
        await sendAlertEmail(
          '[ALERTA] Oleada de escalaciones',
          `Se detectaron ${escalations} escalaciones en la ultima hora.\n\nTimestamp: ${new Date().toISOString()}\nServidor: ${env.FRONTEND_URL}`,
        ).catch((err) => logger.error({ err }, 'Failed to send escalation alert email'));
      }
    } catch (err) {
      logger.error({ err }, 'Error checking escalation surge');
    }
  } catch (err) {
    logger.error({ err }, 'Error checking health for alerts');
  }
}

/** Starts the health alert background job using a Bull queue (every 5 min). */
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

/** Stops the alert job queue. */
export function stopAlertJob(): void {
  queue = null;
}
