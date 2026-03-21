import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { processIncomingEmail } from './emailAutoResponderService.js';
import { createQueue } from '../lib/queue.js';
import type { ParsedMail } from 'mailparser';
import type Bull from 'bull';

let queue: Bull.Queue | null = null;
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

// ── Contact form detection & field extraction ──

export interface ContactFormFields {
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  complejo: string | null;
  huespedes: string | null;
  fechaIngreso: string | null;
  fechaSalida: string | null;
  mensaje: string | null;
}

function isContactFormEmail(parsed: ParsedMail): boolean {
  const html = parsed.html || '';
  const text = parsed.text || '';
  return (
    html.includes('formulario de contacto de lasgrutasdepartamentos') ||
    text.includes('formulario de contacto de lasgrutasdepartamentos')
  );
}

function extractContactFormFields(parsed: ParsedMail): ContactFormFields {
  const html = parsed.html || '';
  const text = parsed.text || '';

  // Primary: extract from embedded JSON comment (most reliable)
  const jsonMatch = html.match(/<!-- FORM_DATA:(.*?) -->/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      logger.info({ source: 'json_comment' }, 'Extracted form fields from JSON comment');
      return {
        nombre: data.nombre || null,
        email: data.email || null,
        telefono: data.telefono || null,
        complejo: data.complejo || null,
        huespedes: data.huespedes || null,
        fechaIngreso: data.fechaIngreso || null,
        fechaSalida: data.fechaSalida || null,
        mensaje: data.mensaje || null,
      };
    } catch {
      logger.warn({ raw: jsonMatch[1] }, 'Failed to parse FORM_DATA JSON comment');
    }
  }

  // Fallback: extract from text version
  logger.info({ source: 'text_fallback' }, 'No JSON comment found, falling back to text extraction');
  function fromText(label: string): string | null {
    const regex = new RegExp(`${label}[:\\s]+(.+)`, 'i');
    const match = text.match(regex);
    const val = match?.[1]?.trim();
    return val && val !== '-' && val !== 'No especificado' ? val : null;
  }

  // Extract mensaje from text
  let mensaje: string | null = null;
  const msgTextMatch = text.match(/Mensaje:\s*([\s\S]+?)(?:\n\s*\n|Enviado desde)/i);
  if (msgTextMatch) mensaje = msgTextMatch[1].trim() || null;

  return {
    nombre: fromText('Nombre'),
    email: fromText('Email'),
    telefono: fromText('Telefono'),
    complejo: fromText('Complejo'),
    huespedes: fromText('Huespedes'),
    fechaIngreso: fromText('Fecha ingreso'),
    fechaSalida: fromText('Fecha salida'),
    mensaje,
  };
}

function getReplyToAddress(parsed: ParsedMail): string | null {
  // replyTo can be an array of addresses
  const replyTo = parsed.replyTo?.value?.[0]?.address?.toLowerCase();
  return replyTo || null;
}

// ── Reusable email processing (used by IMAP poller and Postfix pipe endpoint) ──

export async function processRawEmailSource(source: Buffer): Promise<{ processed: boolean; error?: string }> {
  if (!env.EMAIL_AUTO_RESPONDER_ENABLED) {
    return { processed: false, error: 'Auto-responder disabled' };
  }

  const activeComplejos = await prisma.complejo.findMany({
    where: { activo: true, autoResponderEmail: true },
    select: { id: true, nombre: true },
  });

  if (activeComplejos.length === 0) {
    return { processed: false, error: 'No complejos with autoResponderEmail enabled' };
  }

  const parsed = await simpleParser(source);

  const messageId = parsed.messageId || `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fromAddress = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
  const subject = parsed.subject || '';

  logger.info({ from: fromAddress, subject, messageId }, 'processRawEmailSource: processing email');

  // ── Detect contact form submissions ──
  const isForm = isContactFormEmail(parsed);
  let replyTo = fromAddress;
  let formFields: ContactFormFields | null = null;

  if (isForm) {
    const visitorEmail = getReplyToAddress(parsed);
    if (!visitorEmail) {
      logger.warn({ subject }, 'Contact form email without Reply-To, skipping');
      return { processed: false, error: 'Contact form without Reply-To' };
    }
    replyTo = visitorEmail;
    formFields = extractContactFormFields(parsed);
    logger.info({ replyTo, formFields }, 'Contact form detected, extracted fields');
  } else {
    // Regular email — apply anti-loop filters
    if (fromAddress.includes('info@lasgrutasdepartamentos') || fromAddress.includes('lasgrutasdepartamentos@gmail')) {
      logger.debug({ from: fromAddress }, 'Skipping own email');
      return { processed: false, error: 'Own email (loop prevention)' };
    }

    const skipDomains = [
      'booking.com',
      'airbnb.com',
      'invertironline.com',
      'iol.invertironline.com',
      'mercadolibre.com',
      'mercadopago.com',
      'bna.com.ar',
      'mailing.bna.com.ar',
      'noreply',
      'no-reply',
      'mailer-daemon',
      'postmaster',
      'newsletter',
      'notifications',
      'alert',
      'billing',
    ];
    if (skipDomains.some((d) => fromAddress.includes(d))) {
      logger.debug({ from: fromAddress }, 'Skipping notification sender');
      return { processed: false, error: 'Notification sender' };
    }

    const autoSubmitted = parsed.headers.get('auto-submitted');
    if (autoSubmitted && autoSubmitted !== 'no') {
      logger.debug({ from: fromAddress, autoSubmitted }, 'Skipping auto-submitted email');
      return { processed: false, error: 'Auto-submitted email' };
    }

    const precedence = parsed.headers.get('precedence');
    if (precedence && ['bulk', 'junk', 'list'].includes(String(precedence).toLowerCase())) {
      logger.debug({ from: fromAddress, precedence }, 'Skipping bulk/list email');
      return { processed: false, error: 'Bulk/list email' };
    }

    if (parsed.headers.get('x-auto-responded-message')) {
      logger.debug({ from: fromAddress }, 'Skipping already auto-responded email');
      return { processed: false, error: 'Already auto-responded' };
    }
  }

  // ── Dedup ──
  const existing = await prisma.emailProcesado.findUnique({
    where: { messageId },
  });
  if (existing) {
    logger.debug({ messageId }, 'Email already processed, skipping');
    return { processed: false, error: 'Duplicate messageId' };
  }

  // ── Rate limit: max 5 replies per recipient in 24h ──
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentReplies = await prisma.emailProcesado.count({
    where: {
      fromEmail: replyTo,
      respondido: true,
      creadoEn: { gte: oneDayAgo },
    },
  });
  if (recentReplies >= 5) {
    logger.warn({ replyTo, count: recentReplies }, 'Rate limit reached for recipient');
    await prisma.emailProcesado.create({
      data: { messageId, fromEmail: replyTo, subject, error: 'Rate limit exceeded' },
    });
    return { processed: false, error: 'Rate limit exceeded' };
  }

  // ── Process the email ──
  const bodyText = parsed.text || '';
  logger.info({ replyTo, subject, messageId, isForm }, 'Delegating to auto-responder');

  try {
    const { complejoId, replyBody } = await processIncomingEmail({
      messageId,
      from: replyTo,
      subject,
      body: bodyText,
      inReplyTo: parsed.messageId,
      activeComplejos: activeComplejos.map((c) => ({ id: c.id, nombre: c.nombre })),
      formFields: formFields || undefined,
    });

    await prisma.emailProcesado.create({
      data: {
        messageId,
        fromEmail: replyTo,
        subject,
        complejoId,
        respondido: true,
        bodyOriginal: isForm && formFields ? JSON.stringify(formFields) : bodyText.slice(0, 5000),
        respuestaEnviada: replyBody,
        esFormulario: isForm,
      },
    });

    logger.info({ replyTo, subject, complejoId, isForm }, 'Email auto-reply sent successfully');
    return { processed: true };
  } catch (err: unknown) {
    logger.error({ err, replyTo, subject }, 'Failed to process email');
    const errMsg = err instanceof Error ? err.message : String(err);
    await prisma.emailProcesado.create({
      data: {
        messageId,
        fromEmail: replyTo,
        subject,
        respondido: false,
        error: errMsg.slice(0, 500),
        bodyOriginal: isForm && formFields ? JSON.stringify(formFields) : bodyText.slice(0, 5000),
        esFormulario: isForm,
      },
    });
    return { processed: false, error: errMsg.slice(0, 200) };
  }
}

// ── IMAP polling logic ──

async function pollEmails(): Promise<void> {
  if (isPolling) {
    logger.debug('Email poll already in progress, skipping');
    return;
  }

  if (!env.EMAIL_AUTO_RESPONDER_ENABLED) {
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
      const unseenUids = await client.search({ seen: false }, { uid: true });

      if (!unseenUids || unseenUids.length === 0) {
        logger.debug('No unseen emails found');
        lock.release();
        await client.logout();
        loggedOut = true;
        return;
      }

      logger.info({ count: unseenUids.length }, 'Found unseen emails');

      for (const uid of unseenUids) {
        try {
          const msg = await client.fetchOne(
            uid,
            {
              uid: true,
              flags: true,
              envelope: true,
              source: true,
            },
            { uid: true },
          );

          if (!msg || !msg.source) {
            logger.warn({ uid }, 'Could not fetch email source');
            continue;
          }

          await processRawEmailSource(msg.source);
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
      try {
        await client.logout();
      } catch {
        /* ignore */
      }
    }
    isPolling = false;
  }
}

export function startEmailPollerJob() {
  if (!env.EMAIL_AUTO_RESPONDER_ENABLED) {
    logger.info('Email auto-responder disabled (EMAIL_AUTO_RESPONDER_ENABLED=false)');
    return;
  }

  queue = createQueue('email-poll');

  queue.process(async () => {
    await pollEmails();
  });

  queue.add({}, { delay: 15_000, repeat: { every: env.EMAIL_POLL_INTERVAL_MS } });

  logger.info(`Email poller started (Bull queue, every ${env.EMAIL_POLL_INTERVAL_MS / 1000}s)`);
}

export function stopEmailPollerJob() {
  queue = null;
}
