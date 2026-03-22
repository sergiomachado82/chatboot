import { Router } from 'express';
import {
  createReserva,
  createReservaManual,
  deleteReserva,
  getReservaById,
  getReservasByDateRange,
  listReservas,
  updateReserva,
  updateReservaEstado,
} from '../services/reservaService.js';
import { z } from 'zod';
import { requireRole } from '../middleware/requireRole.js';
import { logAudit } from '../services/auditLogService.js';

/** Reservas (bookings) API routes. */
const router = Router();

const reservaQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  estado: z.enum(['pre_reserva', 'confirmada', 'cancelada', 'completada']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/reservas', async (req, res) => {
  const parsed = reservaQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { from, to, estado, page, pageSize } = parsed.data;
  if (from && to) {
    const reservas = await getReservasByDateRange(new Date(from), new Date(to));
    res.json(reservas);
    return;
  }

  const result = await listReservas(estado, page, pageSize);
  res.json(result);
});

router.get('/reservas/:id', async (req, res) => {
  const reserva = await getReservaById(req.params.id);
  if (!reserva) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(reserva);
});

// Create from bot (requires huespedId)
const createSchema = z.object({
  huespedId: z.string(),
  conversacionId: z.string().optional(),
  fechaEntrada: z.string(),
  fechaSalida: z.string(),
  numHuespedes: z.number().int().min(1),
  habitacion: z.string(),
  precioTotal: z.number().min(0),
  notas: z.string().optional(),
});

router.post('/reservas', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const reserva = await createReserva({
    ...parsed.data,
    fechaEntrada: new Date(parsed.data.fechaEntrada),
    fechaSalida: new Date(parsed.data.fechaSalida),
  });
  res.status(201).json(reserva);
});

// Create manual reservation (no huespedId required)
const createManualSchema = z.object({
  nombreHuesped: z.string().min(1),
  telefonoHuesped: z.string().optional(),
  dni: z.string().optional(),
  fechaEntrada: z.string(),
  fechaSalida: z.string(),
  numHuespedes: z.number().int().min(1).default(1),
  habitacion: z.string().optional(),
  tarifaNoche: z.number().min(0).optional(),
  precioTotal: z.number().min(0).optional(),
  montoReserva: z.number().min(0).optional(),
  saldo: z.number().min(0).optional(),
  estado: z.enum(['pre_reserva', 'confirmada', 'cancelada', 'completada']).optional(),
  origenReserva: z.string().optional(),
  nroFactura: z.string().optional(),
  importeUsd: z.number().min(0).optional(),
  notas: z.string().optional(),
});

router.post('/reservas/manual', async (req, res) => {
  const parsed = createManualSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const reserva = await createReservaManual({
    ...parsed.data,
    fechaEntrada: new Date(parsed.data.fechaEntrada),
    fechaSalida: new Date(parsed.data.fechaSalida),
  });
  res.status(201).json(reserva);
});

// Update reservation (full edit)
const updateSchema = z.object({
  nombreHuesped: z.string().min(1).optional(),
  telefonoHuesped: z.string().nullable().optional(),
  dni: z.string().nullable().optional(),
  fechaEntrada: z.string().optional(),
  fechaSalida: z.string().optional(),
  numHuespedes: z.number().int().min(1).optional(),
  habitacion: z.string().nullable().optional(),
  tarifaNoche: z.number().min(0).nullable().optional(),
  precioTotal: z.number().min(0).optional(),
  montoReserva: z.number().min(0).nullable().optional(),
  saldo: z.number().nullable().optional(),
  estado: z.enum(['pre_reserva', 'confirmada', 'cancelada', 'completada']).optional(),
  origenReserva: z.string().nullable().optional(),
  nroFactura: z.string().nullable().optional(),
  importeUsd: z.number().min(0).nullable().optional(),
  notas: z.string().nullable().optional(),
});

router.patch('/reservas/:id', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { fechaEntrada, fechaSalida, ...rest } = parsed.data;
  const data = {
    ...rest,
    ...(fechaEntrada ? { fechaEntrada: new Date(fechaEntrada) } : {}),
    ...(fechaSalida ? { fechaSalida: new Date(fechaSalida) } : {}),
  };

  const reserva = await updateReserva(req.params.id, data);
  if (!reserva) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(reserva);
});

// Update estado only
const updateEstadoSchema = z.object({
  estado: z.enum(['pre_reserva', 'confirmada', 'cancelada', 'completada']),
});

router.patch('/reservas/:id/estado', async (req, res) => {
  const parsed = updateEstadoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const reserva = await updateReservaEstado(req.params.id, parsed.data.estado);
  if (!reserva) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(reserva);
});

router.delete('/reservas/:id', requireRole('admin'), async (req, res) => {
  const deleted = await deleteReserva(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  logAudit({ agenteId: req.user?.id, accion: 'DELETE', entidad: 'reserva', entidadId: req.params.id, ip: req.ip });
  res.status(204).end();
});

export default router;
