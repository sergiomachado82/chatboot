import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getIO } from './socketManager.js';
import { logIntegrationError } from './integrationLogService.js';

export async function downloadMedia(mediaId: string): Promise<Buffer | null> {
  if (env.SIMULATOR_MODE) {
    logger.debug({ mediaId }, 'Simulator: no real media to download');
    return null;
  }

  // Step 1: Get the media URL
  const metaRes = await fetch(
    `https://graph.facebook.com/${env.WA_API_VERSION}/${mediaId}`,
    { headers: { 'Authorization': `Bearer ${env.WA_ACCESS_TOKEN}` } }
  );
  const metaData = await metaRes.json() as { url?: string };
  if (!metaRes.ok || !metaData.url) {
    logger.error({ mediaId, metaData }, 'Failed to get media URL');
    return null;
  }

  // Step 2: Download the binary file
  const fileRes = await fetch(metaData.url, {
    headers: { 'Authorization': `Bearer ${env.WA_ACCESS_TOKEN}` },
  });
  if (!fileRes.ok) {
    logger.error({ mediaId, status: fileRes.status }, 'Failed to download media file');
    return null;
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<{ success: boolean; messageId?: string }> {
  try {
    const { text, imageUrls } = extractImages(body);

    if (text.trim()) {
      await sendText(to, text.trim());
    }

    for (const url of imageUrls) {
      await sendImage(to, url);
    }

    return { success: true, messageId: `msg_${Date.now()}` };
  } catch (err) {
    logger.error({ err, to }, 'sendWhatsAppMessage failed');
    logIntegrationError('whatsapp', 'Error enviando mensaje', (err as Error).message).catch(() => {});
    return { success: false };
  }
}

function extractImages(body: string): { text: string; imageUrls: string[] } {
  const imageUrls: string[] = [];
  const urlRegex = /(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp)(?:\S*)?)/gi;

  const text = body.replace(urlRegex, (match) => {
    imageUrls.push(match);
    return '';
  });

  // Clean up extra whitespace and empty lines
  const cleanText = text.replace(/\n{3,}/g, '\n\n').trim();

  return { text: cleanText, imageUrls };
}

async function sendText(to: string, body: string) {
  // Web chat users: response is already saved to DB, no need to send via WhatsApp
  if (to.startsWith('web_')) {
    logger.debug({ to }, 'Web chat: skip WhatsApp send');
    return;
  }

  if (env.SIMULATOR_MODE) {
    logger.debug({ to, body }, 'Simulator: sending text');
    const io = getIO();
    io?.emit('simulator:mensaje', {
      from: 'bot',
      type: 'text',
      body,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${env.WA_API_VERSION}/${env.WA_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.WA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      logger.error({ data, status: res.status }, 'WhatsApp API error (text)');
      throw new Error(`WhatsApp API error: ${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendImage(to: string, imageUrl: string, caption?: string) {
  if (to.startsWith('web_')) {
    logger.debug({ to }, 'Web chat: skip image send');
    return;
  }

  if (env.SIMULATOR_MODE) {
    logger.debug({ to, imageUrl }, 'Simulator: sending image');
    const io = getIO();
    io?.emit('simulator:mensaje', {
      from: 'bot',
      type: 'image',
      imageUrl,
      body: caption || '',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${env.WA_API_VERSION}/${env.WA_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.WA_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'image',
          image: {
            link: imageUrl,
            ...(caption ? { caption } : {}),
          },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      logger.error({ data, status: res.status }, 'WhatsApp API error (image)');
      throw new Error(`WhatsApp API error: ${res.status}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}
