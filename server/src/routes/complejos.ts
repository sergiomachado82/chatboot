import { Router } from 'express';
import { z } from 'zod';
import {
  listComplejos,
  getComplejoById,
  createComplejo,
  updateComplejo,
  deleteComplejo,
  upsertTarifa,
  listTarifasEspeciales,
  createTarifaEspecial,
  updateTarifaEspecial,
  deleteTarifaEspecial,
  addMedia,
  removeMedia,
  reorderMedia,
  listBloqueos,
  deleteBloqueo,
} from '../services/complejoService.js';
import { syncTarifaEspecialToInventario, restoreSeasonalPrices } from '../services/inventarioSyncService.js';
import { recalcDisponible, dateRange } from '../services/inventarioService.js';
import { prisma } from '../lib/prisma.js';
import { pushBloqueoToGCal, deleteBloqueoFromGCal } from '../services/googleCalendarService.js';

/** Complejos (properties) API routes. */
const router = Router();

// LIST
router.get('/complejos', async (_req, res) => {
  const complejos = await listComplejos();
  res.json(complejos);
});

// GET ONE
router.get('/complejos/:id', async (req, res) => {
  const complejo = await getComplejoById(req.params.id);
  if (!complejo) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(complejo);
});

// CREATE
const createSchema = z.object({
  nombre: z.string().min(1),
  aliases: z.array(z.string()).optional(),
  direccion: z.string().optional(),
  ubicacion: z.string().optional(),
  tipo: z.string().optional(),
  superficie: z.string().optional(),
  capacidad: z.number().int().min(1).optional(),
  cantidadUnidades: z.number().int().min(1).optional(),
  dormitorios: z.number().int().min(0).optional(),
  banos: z.number().int().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  estadiaMinima: z.number().int().min(1).optional(),
  mascotas: z.boolean().optional(),
  ninos: z.boolean().optional(),
  fumar: z.boolean().optional(),
  fiestas: z.boolean().optional(),
  videoTour: z.string().optional(),
  titularCuenta: z.string().optional(),
  banco: z.string().optional(),
  cbu: z.string().optional(),
  aliasCbu: z.string().optional(),
  cuit: z.string().optional(),
  linkMercadoPago: z.string().optional(),
  porcentajeReserva: z.number().int().min(0).max(60).optional(),
  autoResponderEmail: z.boolean().optional(),
});

router.post('/complejos', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const complejo = await createComplejo(parsed.data);
  res.status(201).json(complejo);
});

// UPDATE
const updateSchema = createSchema.partial();

router.patch('/complejos/:id', async (req, res) => {
  const parsed = updateSchema.extend({ activo: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const complejo = await updateComplejo(req.params.id, parsed.data);
    res.json(complejo);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// DELETE (soft)
router.delete('/complejos/:id', async (req, res) => {
  try {
    const complejo = await deleteComplejo(req.params.id);
    res.json(complejo);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// TARIFAS
const tarifaSchema = z.object({
  temporada: z.string().min(1),
  precioNoche: z.number().min(0),
  estadiaMinima: z.number().int().min(1).nullable().optional(),
});

router.put('/complejos/:id/tarifas', async (req, res) => {
  const parsed = tarifaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const tarifa = await upsertTarifa(
    req.params.id,
    parsed.data.temporada,
    parsed.data.precioNoche,
    parsed.data.estadiaMinima,
  );
  res.json(tarifa);
});

// TARIFAS ESPECIALES
const tarifaEspecialSchema = z.object({
  fechaInicio: z.string().min(1),
  fechaFin: z.string().min(1),
  precioNoche: z.number().min(0),
  estadiaMinima: z.number().int().min(1).nullable().optional(),
  motivo: z.string().nullable().optional(),
});

const tarifaEspecialUpdateSchema = tarifaEspecialSchema.partial().extend({
  activo: z.boolean().optional(),
});

router.get('/complejos/:id/tarifas-especiales', async (req, res) => {
  const items = await listTarifasEspeciales(req.params.id);
  res.json(items);
});

router.post('/complejos/:id/tarifas-especiales', async (req, res) => {
  const parsed = tarifaEspecialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const te = await createTarifaEspecial(req.params.id, {
    fechaInicio: new Date(parsed.data.fechaInicio),
    fechaFin: new Date(parsed.data.fechaFin),
    precioNoche: parsed.data.precioNoche,
    estadiaMinima: parsed.data.estadiaMinima,
    motivo: parsed.data.motivo,
  });

  // Sync to Inventario
  await syncTarifaEspecialToInventario(
    req.params.id,
    new Date(parsed.data.fechaInicio),
    new Date(parsed.data.fechaFin),
    parsed.data.precioNoche,
  );

  res.status(201).json(te);
});

router.patch('/complejos/:id/tarifas-especiales/:teId', async (req, res) => {
  const parsed = tarifaEspecialUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const updateData: {
      fechaInicio?: Date;
      fechaFin?: Date;
      precioNoche?: number;
      estadiaMinima?: number | null;
      motivo?: string | null;
      activo?: boolean;
    } = { ...parsed.data };
    if (parsed.data.fechaInicio) updateData.fechaInicio = new Date(parsed.data.fechaInicio);
    if (parsed.data.fechaFin) updateData.fechaFin = new Date(parsed.data.fechaFin);

    const te = await updateTarifaEspecial(req.params.teId, updateData);

    // Re-sync to Inventario with updated data
    await syncTarifaEspecialToInventario(
      req.params.id,
      new Date(te.fechaInicio),
      new Date(te.fechaFin),
      te.precioNoche,
    );

    res.json(te);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

router.delete('/complejos/:id/tarifas-especiales/:teId', async (req, res) => {
  try {
    const te = await deleteTarifaEspecial(req.params.teId);

    // Restore seasonal prices for the deleted override's date range
    await restoreSeasonalPrices(req.params.id, new Date(te.fechaInicio), new Date(te.fechaFin));

    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// BLOQUEOS
const bloqueoSchema = z.object({
  fechaInicio: z.string().min(1),
  fechaFin: z.string().min(1),
  motivo: z.string().nullable().optional(),
  unidades: z.number().int().min(0).optional(),
});

router.get('/complejos/:id/bloqueos', async (req, res) => {
  const items = await listBloqueos(req.params.id);
  res.json(items);
});

router.post('/complejos/:id/bloqueos', async (req, res) => {
  const parsed = bloqueoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const complejo = await getComplejoById(req.params.id);
  if (!complejo) {
    res.status(404).json({ error: 'Complejo not found' });
    return;
  }

  const fechaInicio = new Date(parsed.data.fechaInicio);
  const fechaFin = new Date(parsed.data.fechaFin);
  const unidades = parsed.data.unidades ?? 0;
  const dates = dateRange(fechaInicio, fechaFin);

  const bloqueo = await prisma.bloqueo.create({
    data: {
      complejoId: req.params.id,
      fechaInicio,
      fechaFin,
      motivo: parsed.data.motivo ?? null,
      unidades,
    },
  });

  // Recalc inventory availability (handles multi-unit correctly)
  if (dates.length > 0) {
    await recalcDisponible(complejo.nombre, dates);
  }

  // Push to Google Calendar (fire-and-forget)
  pushBloqueoToGCal(bloqueo.id).catch((err) => console.error('GCal push failed for bloqueo', err));

  res.status(201).json(bloqueo);
});

router.delete('/complejos/:id/bloqueos/:bloqueoId', async (req, res) => {
  try {
    const complejo = await getComplejoById(req.params.id);
    if (!complejo) {
      res.status(404).json({ error: 'Complejo not found' });
      return;
    }

    const bloqueo = await deleteBloqueo(req.params.bloqueoId);

    // Delete from Google Calendar if it was synced
    if (bloqueo.googleCalEventId) {
      deleteBloqueoFromGCal(bloqueo.googleCalEventId).catch((err) =>
        console.error('GCal delete failed for bloqueo', err),
      );
    }

    // Recalc inventory availability (handles multi-unit correctly)
    const dates = dateRange(new Date(bloqueo.fechaInicio), new Date(bloqueo.fechaFin));
    if (dates.length > 0) {
      await recalcDisponible(complejo.nombre, dates, bloqueo.id);
    }

    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// ICAL FEEDS
const icalFeedSchema = z.object({
  plataforma: z.enum(['booking', 'airbnb', 'vrbo', 'otro']),
  url: z.string().url(),
  etiqueta: z.string().optional(),
});

router.get('/complejos/:id/ical-feeds', async (req, res) => {
  const feeds = await prisma.icalFeed.findMany({
    where: { complejoId: req.params.id },
    orderBy: { creadoEn: 'asc' },
  });
  res.json(feeds);
});

router.post('/complejos/:id/ical-feeds', async (req, res) => {
  const parsed = icalFeedSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const feed = await prisma.icalFeed.create({
      data: {
        complejoId: req.params.id,
        plataforma: parsed.data.plataforma,
        url: parsed.data.url,
        etiqueta: parsed.data.etiqueta ?? null,
      },
    });
    res.status(201).json(feed);
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as Record<string, unknown>).code === 'P2002') {
      res.status(409).json({ error: 'Esta URL ya existe para este complejo' });
      return;
    }
    throw err;
  }
});

router.delete('/complejos/:id/ical-feeds/:feedId', async (req, res) => {
  try {
    await prisma.icalFeed.delete({ where: { id: req.params.feedId } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// MEDIA
const addMediaSchema = z.object({
  url: z.string().url(),
  tipo: z.string().optional(),
  caption: z.string().optional(),
  orden: z.number().int().optional(),
});

router.post('/complejos/:id/media', async (req, res) => {
  const parsed = addMediaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const media = await addMedia(
    req.params.id,
    parsed.data.url,
    parsed.data.tipo,
    parsed.data.caption,
    parsed.data.orden,
  );
  res.status(201).json(media);
});

router.delete('/complejos/:id/media/:mediaId', async (req, res) => {
  try {
    await removeMedia(req.params.mediaId);
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string()),
});

router.patch('/complejos/:id/media/orden', async (req, res) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const media = await reorderMedia(req.params.id, parsed.data.orderedIds);
  res.json(media);
});

export default router;
