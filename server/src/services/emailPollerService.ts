import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { processIncomingEmail } from './emailAutoResponderService.js';

let intervalId: ReturnType<typeof setInterval> | null = null;
let isPolling = false;

function getImapConfig() {
  return {
    host: env.IMAP_HOST || env.SMTP_HOST || '198.54.114.136',
    port: env.IMAP_PORT,
    secure: true,
    auth: {
      user: env.IMAP_USER || env.SMTP_USER,
      pass: env.IMAP_PASS || env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
    logger: false as const,
  };
}

async function pollEmails(): Promise<void> {
  if (isPolling) {
    logger.debug('Email poll already in progress, skipping');
    return;
  }

  if (!env.EMAIL_AUTO_RESPONDER_ENABLED) {
    return;
  }

  // Check if any complejo has autoResponderEmail enabled
  const activeComplejos = await prisma.complejo.findMany({
    where: { activo: true, autoResponderEmail: true },
    select: { id: true, nombre: true },
  });

  if (activeComplejos.length === 0) {
    logger.debug('No complejos with autoResponderEmail enabled, skipping poll');
    return;
  }

  const imapUser = env.IMAP_USER || env.SMTP_USER;
  const imapPass = env.IMAP_PASS || env.SMTP_PASS;
  if (!imapUser || !imapPass) {
    logger.warn('IMAP credentials not configured, skipping email poll');
    return;
  }

  isPolling = true;
  let client: ImapFlow | null = null;
  let loggedOut = false;

  try {
    const imapConfig = getImapConfig();
    logger.info({ host: imapConfig.host, port: imapConfig.port, user: imapConfig.auth.user }, 'Connecting to IMAP...');

    client = new ImapFlow(imapConfig);
    await client.connect();
    logger.info('IMAP connected successfully');

    const lock = await client.getMailboxLock('INBOX');
    try {
      // First search for unseen message UIDs
      const unseenUids = await client.search({ seen: false }, { uid: true });

      if (!unseenUids || unseenUids.length === 0) {
        logger.debug('No unseen emails found');
        lock.release();
        await client.logout();
        loggedOut = true;
        return;
      }

      logger.info({ count: unseenUids.length }, 'Found unseen emails');

      // Fetch each unseen message by UID
      for (const uid of unseenUids) {
        try {
          const msg = await client.fetchOne(uid, {
            uid: true,
            flags: true,
            envelope: true,
            source: true,
          }, { uid: true });

          if (!msg || !msg.source) {
            logger.warn({ uid }, 'Could not fetch email source');
            continue;
          }

          const parsed = await simpleParser(msg.source);

          const messageId = parsed.messageId || `unknown-${uid}-${Date.now()}`;
          const fromAddress = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
          const subject = parsed.subject || '';

          logger.info({ uid, from: fromAddress, subject }, 'Processing email');

          // Anti-loop: skip our own emails
          if (fromAddress.includes('info@lasgrutasdepartamentos') ||
              fromAddress.includes('lasgrutasdepartamentos@gmail')) {
            logger.debug({ from: fromAddress }, 'Skipping own email');
            await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
            continue;
          }

          // Anti-loop: skip auto-submitted emails
          const autoSubmitted = parsed.headers.get('auto-submitted');
          if (autoSubmitted && autoSubmitted !== 'no') {
            logger.debug({ from: fromAddress, autoSubmitted }, 'Skipping auto-submitted email');
            await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
            continue;
          }

          // Anti-loop: skip emails with precedence bulk/junk/list
          const precedence = parsed.headers.get('precedence');
          if (precedence && ['bulk', 'junk', 'list'].includes(String(precedence).toLowerCase())) {
            logger.debug({ from: fromAddress, precedence }, 'Skipping bulk/list email');
            await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
            continue;
          }

          // Skip if X-Auto-Responded-Message header present
          if (parsed.headers.get('x-auto-responded-message')) {
            logger.debug({ from: fromAddress }, 'Skipping already auto-responded email');
            await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
            continue;
          }

          // Dedup: skip if already processed
          const existing = await prisma.emailProcesado.findUnique({
            where: { messageId },
          });
          if (existing) {
            logger.debug({ messageId }, 'Email already processed, skipping');
            await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
            continue;
          }

          // Rate limit: max 5 replies per sender in 24h
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const recentReplies = await prisma.emailProcesado.count({
            where: {
              fromEmail: fromAddress,
              respondido: true,
              creadoEn: { gte: oneDayAgo },
            },
          });
          if (recentReplies >= 5) {
            logger.warn({ from: fromAddress, count: recentReplies }, 'Rate limit reached for sender');
            await prisma.emailProcesado.create({
              data: { messageId, fromEmail: fromAddress, subject, error: 'Rate limit exceeded' },
            });
            await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });
            continue;
          }

          // Process the email
          const bodyText = parsed.text || '';
          logger.info({ from: fromAddress, subject, messageId }, 'Delegating to auto-responder');

          try {
            const complejoId = await processIncomingEmail({
              messageId,
              from: fromAddress,
              subject,
              body: bodyText,
              inReplyTo: parsed.messageId,
              activeComplejos: activeComplejos.map(c => ({ id: c.id, nombre: c.nombre })),
            });

            await prisma.emailProcesado.create({
              data: {
                messageId,
                fromEmail: fromAddress,
                subject,
                complejoId,
                respondido: true,
              },
            });

            logger.info({ from: fromAddress, subject, complejoId }, 'Email auto-reply sent successfully');
          } catch (err: any) {
            logger.error({ err, from: fromAddress, subject }, 'Failed to process email');
            await prisma.emailProcesado.create({
              data: {
                messageId,
                fromEmail: fromAddress,
                subject,
                respondido: false,
                error: err.message?.slice(0, 500),
              },
            });
          }

          // Mark as seen
          await client.messageFlagsAdd({ uid }, ['\\Seen'], { uid: true });

        } catch (msgErr) {
          logger.error({ err: msgErr, uid }, 'Error processing individual email');
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    loggedOut = true;
    logger.info('IMAP poll cycle completed');
  } catch (err) {
    logger.error({ err }, 'Email polling error');
  } finally {
    if (client && !loggedOut) {
      try { await client.logout(); } catch { /* ignore */ }
    }
    isPolling = false;
  }
}

export function startEmailPollerJob() {
  if (!env.EMAIL_AUTO_RESPONDER_ENABLED) {
    logger.info('Email auto-responder disabled (EMAIL_AUTO_RESPONDER_ENABLED=false)');
    return;
  }

  // Run once on startup (delayed 15s to let server finish init)
  setTimeout(() => {
    pollEmails().catch((err) => {
      logger.error({ err }, 'Error in email poll job');
    });
  }, 15_000);

  // Then run periodically
  intervalId = setInterval(() => {
    pollEmails().catch((err) => {
      logger.error({ err }, 'Error in email poll job');
    });
  }, env.EMAIL_POLL_INTERVAL_MS);

  logger.info(`Email poller started (every ${env.EMAIL_POLL_INTERVAL_MS / 1000}s)`);
}

export function stopEmailPollerJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
