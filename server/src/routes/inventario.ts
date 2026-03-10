import { Router } from 'express';
import { getInventario, updateInventarioEntry, checkAvailability } from '../services/inventarioService.js';
import { z } from 'zod';

const router = Router();

const inventarioQuerySchema = z.object({
  habitacion: z.string().optional(),
  mes: z.coerce.number().int().min(0).max(11).optional(),
  anio: z.coerce.number().int().min(2020).max(2100).optional(),
});

router.get('/inventario', async (req, res) => {
  const parsed = inventarioQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const { habitacion, mes, anio } = parsed.data;
  const data = await getInventario(habitacion, mes, anio);
  res.json(data);
});

const availabilitySchema = z.object({
  fechaEntrada: z.string(),
  fechaSalida: z.string(),
  habitacion: z.string().optional(),
});

router.get('/inventario/disponibilidad', async (req, res) => {
  const parsed = availabilitySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { fechaEntrada, fechaSalida, habitacion } = parsed.data;
  const results = await checkAvailability(new Date(fechaEntrada), new Date(fechaSalida), habitacion);
  res.json(results);
});

const updateInventarioSchema = z.object({
  disponible: z.boolean().optional(),
  precio: z.number().min(0).optional(),
  notas: z.string().max(1000).optional(),
});

router.put('/inventario/:id', async (req, res) => {
  const parsed = updateInventarioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const updated = await updateInventarioEntry(req.params.id, parsed.data);
  res.json(updated);
});

export default router;
