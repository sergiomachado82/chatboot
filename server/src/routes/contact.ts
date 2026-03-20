import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { sendContactEmail } from '../services/emailService.js';
import { processIncomingEmail } from '../services/emailAutoResponderService.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const router = Router();

const contactRateLimiter = createRateLimiter('contact', 5, 60);

const contactSchema = z.object({
  nombre: z.string().min(1).max(200),
  email: z.string().email().max(200),
  telefono: z.string().min(1).max(50),
  complejo: z.string().max(200).optional(),
  huespedes: z.string().max(10).optional(),
  fechaIngreso: z.string().max(20).optional(),
  fechaSalida: z.string().max(20).optional(),
  mensaje: z.string().max(2000).optional(),
});

router.post('/contact', contactRateLimiter, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const data = parsed.data;
  const messageId = `contact_form_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const subject = `Consulta de disponibilidad - ${data.nombre}${data.complejo ? ` - ${data.complejo}` : ''}`;

  // Respond immediately to the frontend
  res.json({ ok: true });

  // Everything below runs in the background (fire-and-forget)
  (async () => {
    // Send admin notification email (best-effort)
    sendContactEmail(data).catch(err => {
      logger.error({ err }, 'Failed to send contact notification email');
    });

    // Get active complejos for auto-responder
    const activeComplejos = await prisma.complejo.findMany({
      where: { activo: true, autoResponderEmail: true },
      select: { id: true, nombre: true },
    });

    if (activeComplejos.length === 0) {
      logger.warn('No complejos with autoResponderEmail enabled, skipping auto-reply for contact form');
      // Still save to DB so it appears in admin panel
      await prisma.emailProcesado.create({
        data: {
          messageId,
          fromEmail: data.email,
          subject,
          respondido: false,
          bodyOriginal: JSON.stringify(data),
          esFormulario: true,
          error: 'No hay complejos con auto-responder habilitado',
        },
      });
      return;
    }

    try {
      const { complejoId, replyBody } = await processIncomingEmail({
        messageId,
        from: data.email,
        subject,
        body: data.mensaje || '',
        activeComplejos: activeComplejos.map(c => ({ id: c.id, nombre: c.nombre })),
        formFields: {
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono,
          complejo: data.complejo || null,
          huespedes: data.huespedes || null,
          fechaIngreso: data.fechaIngreso || null,
          fechaSalida: data.fechaSalida || null,
          mensaje: data.mensaje || null,
        },
      });

      await prisma.emailProcesado.create({
        data: {
          messageId,
          fromEmail: data.email,
          subject,
          complejoId,
          respondido: true,
          bodyOriginal: JSON.stringify(data),
          respuestaEnviada: replyBody,
          esFormulario: true,
        },
      });

      logger.info({ email: data.email, subject, complejoId }, 'Contact form auto-reply sent and saved');
    } catch (err: any) {
      logger.error({ err, email: data.email }, 'Failed to process contact form auto-reply');
      await prisma.emailProcesado.create({
        data: {
          messageId,
          fromEmail: data.email,
          subject,
          respondido: false,
          error: err.message?.slice(0, 500),
          bodyOriginal: JSON.stringify(data),
          esFormulario: true,
        },
      }).catch(dbErr => {
        logger.error({ dbErr }, 'Failed to save contact form error to DB');
      });
    }
  })().catch(err => {
    logger.error({ err }, 'Unexpected error in contact form background processing');
  });
});

export default router;
