import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { passwordSchema } from '../utils/passwordPolicy.js';

const router = Router();

router.get('/agentes', async (_req, res) => {
  const agentes = await prisma.agente.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, online: true, creadoEn: true },
    orderBy: { creadoEn: 'asc' },
  });
  res.json(agentes);
});

const createSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
  rol: z.enum(['admin', 'agente']).default('agente'),
});

router.post('/agentes', async (req, res) => {
  if (req.user?.rol !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Only admins can create agents' });
    return;
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);
  const agente = await prisma.agente.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      passwordHash: hash,
      rol: parsed.data.rol,
    },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, online: true, creadoEn: true },
  });

  res.status(201).json(agente);
});

export default router;
