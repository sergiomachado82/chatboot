import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { findOrCreateHuesped } from './huespedService.js';
import { findOrCreateConversacion, updateConversacionEstado } from './conversacionService.js';
import { createMensaje } from './mensajeService.js';
import { handleBotMessage } from './botEngine.js';
import { downloadMedia, sendWhatsAppMessage } from './whatsappService.js';
import { transcribeAudio } from './claudeService.js';
import { isRateLimited } from '../middleware/rateLimitWhatsApp.js';

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
  image?: { id: string; mime_type: string; caption?: string };
  name?: string;
}

export async function processIncomingMessage(message: WhatsAppMessage, contactName?: string) {
  const { from, id, type } = message;

  // Idempotency: skip if message already processed
  const existing = await prisma.mensaje.findFirst({ where: { waMessageId: id } });
  if (existing) {
    logger.debug({ waMessageId: id }, 'Duplicate message skipped');
    return;
  }

  logger.info({ from, type, body: (message.text?.body ?? '').slice(0, 100) }, 'Processing incoming message');

  // Log non-text/non-audio message types for debugging (image, document, sticker, etc.)
  if (type !== 'text' && type !== 'audio') {
    logger.warn({ from, type }, 'Received non-text/non-audio message type');
  }

  // Rate limit check per WhatsApp number
  if (await isRateLimited(from)) {
    logger.warn({ from }, 'Message dropped due to rate limit');
    return;
  }

  // 1. Find or create guest
  const huesped = await findOrCreateHuesped(from, contactName);

  // 2. Find or create conversation
  const conversacion = await findOrCreateConversacion(huesped.id);

  // 3. Resolve message content (text or audio transcription)
  let body: string;
  let msgTipo: 'text' | 'audio' | 'image' | 'document';
  let metadata: Record<string, unknown> | undefined;

  if (type === 'audio' && message.audio) {
    msgTipo = 'audio';
    try {
      const audioBuffer = await downloadMedia(message.audio.id);
      if (!audioBuffer) throw new Error('downloadMedia returned null');
      const textoTranscripto = await transcribeAudio(audioBuffer, message.audio.mime_type);
      body = textoTranscripto;
      metadata = { transcripcion: true, mimeType: message.audio.mime_type };
      logger.info({ from, transcripcion: textoTranscripto.slice(0, 100) }, 'Audio transcribed');
    } catch (err) {
      logger.error({ err, from }, 'Audio transcription failed');
      body = '[Audio no procesado]';
      // Escalate to human agent
      const conv = await findOrCreateConversacion((await findOrCreateHuesped(from, contactName)).id);
      await updateConversacionEstado(conv.id, 'espera_humano');
      await createMensaje({
        conversacionId: conv.id,
        tipo: 'text',
        direccion: 'saliente',
        origen: 'sistema',
        contenido: '[Sistema] No se pudo procesar el audio. Un agente te va a atender en breve.',
      });
      sendWhatsAppMessage(from, 'No pudimos procesar tu audio. Un agente te va a atender en breve.').catch(() => {});
      return;
    }
  } else if (type === 'image' && message.image) {
    msgTipo = 'image';
    const caption = message.image.caption ?? '';
    body = caption || '[Imagen recibida]';
    metadata = { mediaId: message.image.id, mimeType: message.image.mime_type };
    logger.info({ from, caption: caption.slice(0, 100) }, 'Image message received');

    // Save the image message and escalate to human (bot can't interpret images)
    await createMensaje({
      conversacionId: conversacion.id,
      tipo: msgTipo,
      direccion: 'entrante',
      origen: 'huesped',
      contenido: body,
      waMessageId: id,
      metadata,
    });

    if (conversacion.estado === 'bot') {
      await updateConversacionEstado(conversacion.id, 'espera_humano');
      await createMensaje({
        conversacionId: conversacion.id,
        tipo: 'text',
        direccion: 'saliente',
        origen: 'sistema',
        contenido: 'Conversacion escalada: el huesped envio una imagen.',
      });
      sendWhatsAppMessage(from, 'Recibimos tu imagen. Un agente la va a revisar y te contacta en breve.').catch(() => {});
    }
    return;
  } else {
    body = message.text?.body ?? '';
    msgTipo = type === 'text' ? 'text' : (type as 'image' | 'audio' | 'document');
  }

  // 4. Save incoming message
  await createMensaje({
    conversacionId: conversacion.id,
    tipo: msgTipo,
    direccion: 'entrante',
    origen: 'huesped',
    contenido: body,
    waMessageId: id,
    ...(metadata ? { metadata } : {}),
  });

  // 5. Route based on conversation state (skip if audio failed)
  if (conversacion.estado === 'bot' && body !== '[Audio no procesado]') {
    await handleBotMessage({
      conversacionId: conversacion.id,
      huespedId: huesped.id,
      huespedWaId: from,
      mensaje: body,
    });
  }
  // If espera_humano or humano_activo, agents see the message in real-time via socket
  // No auto-response needed
}

export function parseMetaWebhookPayload(body: Record<string, unknown>): { messages: WhatsAppMessage[]; contactName?: string } | null {
  try {
    const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
    const changes = (entry?.changes as Array<Record<string, unknown>>)?.[0];
    const value = changes?.value as Record<string, unknown>;
    const messages = (value?.messages as WhatsAppMessage[]) ?? [];
    const contacts = value?.contacts as Array<{ profile?: { name?: string } }>;
    const contactName = contacts?.[0]?.profile?.name;

    if (messages.length === 0) return null;
    return { messages, contactName };
  } catch {
    return null;
  }
}
