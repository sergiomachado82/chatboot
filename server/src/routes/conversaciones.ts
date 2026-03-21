import { Router } from 'express';
import { z } from 'zod';
import {
  listConversaciones,
  getConversacionById,
  updateConversacionEstado,
  deleteConversaciones,
} from '../services/conversacionService.js';
import { getByConversacion, createMensaje } from '../services/mensajeService.js';
import { sendWhatsAppMessage } from '../services/whatsappService.js';

const router = Router();

const conversacionesQuerySchema = z.object({
  estado: z.string().optional(),
  search: z.string().min(1).max(200).optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD')
    .optional(),
});

// Bulk delete conversations
const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
});

router.post('/conversaciones/bulk-delete', async (req, res) => {
  const parsed = bulkDeleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const deletedCount = await deleteConversaciones(parsed.data.ids);
  res.json({ deletedCount });
});

router.get('/conversaciones', async (req, res) => {
  const parsed = conversacionesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const conversaciones = await listConversaciones(parsed.data);
  res.json(conversaciones);
});

router.get('/conversaciones/:id', async (req, res) => {
  const conv = await getConversacionById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(conv);
});

const mensajesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.string().datetime().optional(),
  search: z.string().min(1).max(200).optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato: YYYY-MM-DD')
    .optional(),
});

router.get('/conversaciones/:id/mensajes', async (req, res) => {
  const parsed = mensajesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const { limit, before, search, dateFrom, dateTo } = parsed.data;
  const result = await getByConversacion(req.params.id, { limit, before, search, dateFrom, dateTo });
  res.json(result);
});

// Agent takes control
router.post('/conversaciones/:id/tomar-control', async (req, res) => {
  const conv = await getConversacionById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const updated = await updateConversacionEstado(req.params.id, 'humano_activo', req.user!.id);

  await createMensaje({
    conversacionId: req.params.id,
    tipo: 'system',
    direccion: 'saliente',
    origen: 'sistema',
    contenido: `Agente ${req.user!.email} tomo el control de la conversacion`,
  });

  res.json(updated);
});

// Agent returns to bot
router.post('/conversaciones/:id/devolver-bot', async (req, res) => {
  const updated = await updateConversacionEstado(req.params.id, 'bot', null);

  await createMensaje({
    conversacionId: req.params.id,
    tipo: 'system',
    direccion: 'saliente',
    origen: 'sistema',
    contenido: 'Conversacion devuelta al bot',
  });

  res.json(updated);
});

// Close conversation
router.post('/conversaciones/:id/cerrar', async (req, res) => {
  const updated = await updateConversacionEstado(req.params.id, 'cerrado', null);

  await createMensaje({
    conversacionId: req.params.id,
    tipo: 'system',
    direccion: 'saliente',
    origen: 'sistema',
    contenido: 'Conversacion cerrada',
  });

  res.json(updated);
});

// Agent sends message
const sendMensajeSchema = z.object({
  contenido: z.string().min(1).max(4096),
});

router.post('/conversaciones/:id/mensajes', async (req, res) => {
  const parsed = sendMensajeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const { contenido } = parsed.data;

  const conv = await getConversacionById(req.params.id);
  if (!conv) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const mensaje = await createMensaje({
    conversacionId: req.params.id,
    direccion: 'saliente',
    origen: 'agente',
    contenido,
  });

  // Send to WhatsApp
  await sendWhatsAppMessage(conv.huesped.waId, contenido);

  res.json(mensaje);
});

export default router;
