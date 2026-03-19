import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { sendContactEmail } from '../services/emailService.js';
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

  try {
    await sendContactEmail(parsed.data);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Failed to send contact email');
    res.status(500).json({ error: 'No se pudo enviar el mensaje. Intenta nuevamente.' });
  }
});

export default router;
