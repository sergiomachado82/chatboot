import { Router } from 'express';
import { z } from 'zod';
import { getBotConfig, updateBotConfig, getBotConfigHistory } from '../services/botConfigService.js';
import { requireRole } from '../middleware/requireRole.js';
import { cacheControl, withETag } from '../middleware/cacheHeaders.js';
import { logAudit } from '../services/auditLogService.js';

const MAX_LOGO_SIZE = 500 * 1024; // 500 KB base64

const router = Router();

const updateSchema = z.object({
  nombreAgente: z.string().min(1).max(200).optional(),
  ubicacion: z.string().min(1).max(300).optional(),
  tono: z.string().min(1).max(200).optional(),
  idioma: z.enum(['es_AR', 'es', 'en']).optional(),
  usarEmojis: z.boolean().optional(),
  longitudRespuesta: z.enum(['corta', 'media', 'detallada']).optional(),
  autoPreReserva: z.boolean().optional(),
  modoEnvioFotos: z.enum(['auto', 'on_request', 'off']).optional(),
  escalarSiQueja: z.boolean().optional(),
  escalarSiPago: z.boolean().optional(),
  mensajeBienvenida: z.string().min(1).max(1000).optional(),
  mensajeDespedida: z.string().min(1).max(1000).optional(),
  mensajeFueraHorario: z.string().min(1).max(1000).optional(),
  mensajeEsperaHumano: z.string().min(1).max(1000).optional(),
  horarioInicio: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  horarioFin: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  telefonoContacto: z.string().min(1).max(50).optional(),
  titularesVerificados: z.array(z.string().min(1).max(200)).max(20).optional(),
  reglasPersonalizadas: z.array(z.string().min(1).max(500)).max(20).optional(),
});

router.get('/bot/config', cacheControl(300), withETag(), async (_req, res) => {
  try {
    const config = await getBotConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener configuracion del bot', message: (err as Error).message });
  }
});

router.patch('/bot/config', requireRole('admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const updated = await updateBotConfig(parsed.data, req.user?.id);
    logAudit({
      agenteId: req.user?.id,
      accion: 'UPDATE',
      entidad: 'botConfig',
      detalle: parsed.data as Record<string, unknown>,
      ip: req.ip,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar configuracion del bot', message: (err as Error).message });
  }
});

router.get('/bot/config/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const history = await getBotConfigHistory(limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial', message: (err as Error).message });
  }
});

const logoSchema = z.object({
  logo: z.string().max(MAX_LOGO_SIZE, 'El logo es demasiado grande (max 500KB)'),
});

router.post('/bot/logo', requireRole('admin'), async (req, res) => {
  const parsed = logoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', message: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    await updateBotConfig({ logo: parsed.data.logo }, req.user?.id);
    res.json({ message: 'Logo actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar logo', message: (err as Error).message });
  }
});

router.delete('/bot/logo', requireRole('admin'), async (_req, res) => {
  try {
    await updateBotConfig({ logo: null });
    res.json({ message: 'Logo eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar logo', message: (err as Error).message });
  }
});

export default router;
