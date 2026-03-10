import { Router } from 'express';
import { verifyCredentials, generateToken } from '../services/authService.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/auth/login', async (req, res) => {
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

export default router;
