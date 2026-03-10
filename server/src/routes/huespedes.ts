import { Router } from 'express';
import { z } from 'zod';
import { listHuespedes, getHuespedById, updateHuesped } from '../services/huespedService.js';
import { getReservasByHuesped } from '../services/reservaService.js';

const router = Router();

router.get('/huespedes', async (_req, res) => {
  const huespedes = await listHuespedes();
  res.json(huespedes);
});

router.get('/huespedes/:id', async (req, res) => {
  const huesped = await getHuespedById(req.params.id);
  if (!huesped) { res.status(404).json({ error: 'Not found' }); return; }
  const reservas = await getReservasByHuesped(req.params.id);
  res.json({ ...huesped, reservas });
});

const updateHuespedSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  telefono: z.string().max(50).optional(),
  email: z.string().email().optional(),
  notas: z.string().max(2000).optional(),
});

router.patch('/huespedes/:id', async (req, res) => {
  const parsed = updateHuespedSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const updated = await updateHuesped(req.params.id, parsed.data);
  res.json(updated);
});

export default router;
