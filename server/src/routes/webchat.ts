import { Router } from 'express';
import { z } from 'zod';
import { processIncomingMessage } from '../services/webhookProcessor.js';
import { webchatRateLimiter } from '../middleware/rateLimiter.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const router = Router();

const webchatSchema = z.object({
  sessionId: z.string().min(8).max(64),
  message: z.string().min(1).max(2000),
  name: z.string().max(100).optional(),
});

router.post('/webchat/send', webchatRateLimiter, async (req, res) => {
  const parsed = webchatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { sessionId, message, name } = parsed.data;
  const waId = `web_${sessionId}`;

  try {
    // Process message through the full bot pipeline
    await processIncomingMessage(
      {
        from: waId,
        id: `webchat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: 'text',
        text: { body: message },
      },
      name ?? 'Visitante Web'
    );

    // Get the latest bot response from the conversation
    const huesped = await prisma.huesped.findUnique({ where: { waId } });
    if (!huesped) {
      res.json({ response: 'Un momento, estoy procesando tu consulta.' });
      return;
    }

    const conv = await prisma.conversacion.findFirst({
      where: { huespedId: huesped.id, estado: { not: 'cerrado' } },
    });

    if (!conv) {
      res.json({ response: 'Un momento, estoy procesando tu consulta.' });
      return;
    }

    // Get the latest bot message
    const botMessage = await prisma.mensaje.findFirst({
      where: { conversacionId: conv.id, origen: 'bot' },
      orderBy: { creadoEn: 'desc' },
    });

    const metadata = botMessage?.metadata as Record<string, unknown> | null;
    const imageUrls = (metadata?.imageUrls as string[] | undefined) ?? [];

    res.json({
      response: botMessage?.contenido ?? 'No se pudo generar una respuesta en este momento.',
      ...(imageUrls.length > 0 && { images: imageUrls }),
    });
  } catch (err) {
    logger.error({ err, sessionId }, 'Webchat processing error');
    res.status(500).json({ error: 'Error al procesar el mensaje.' });
  }
});

export default router;
