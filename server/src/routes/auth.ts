import { Router } from 'express';
import { verifyCredentials, generateToken, generateResetToken, resetPassword } from '../services/authService.js';
import { sendResetEmail } from '../services/emailService.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { passwordSchema } from '../utils/passwordPolicy.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/auth/login', loginRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', message: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, password } = parsed.data;
  const agente = await verifyCredentials(email, password);

  if (!agente) {
    logger.warn({ email }, 'Failed login attempt');
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
    return;
  }

  const token = generateToken({ id: agente.id, email: agente.email, rol: agente.rol });
  res.json({ token, agente });
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

router.post('/auth/forgot-password', loginRateLimiter, async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', message: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email } = parsed.data;

  try {
    const token = await generateResetToken(email);

    // Always return success to avoid leaking whether the email exists
    if (token) {
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
      await sendResetEmail(email, resetUrl);
      logger.info({ email }, 'Password reset email sent');
    }

    res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.' });
  } catch (err) {
    logger.error({ err, email }, 'Error sending reset email');
    res.status(500).json({ error: 'Server error', message: 'No se pudo enviar el email. Intenta más tarde.' });
  }
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

router.post('/auth/reset-password', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', message: parsed.error.flatten().fieldErrors });
    return;
  }

  const { token, password } = parsed.data;

  try {
    const success = await resetPassword(token, password);

    if (!success) {
      res.status(400).json({ error: 'Invalid token', message: 'El enlace es inválido o ha expirado.' });
      return;
    }

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    logger.error({ err }, 'Error resetting password');
    res.status(500).json({ error: 'Server error', message: 'Error al restablecer la contraseña.' });
  }
});

export default router;
