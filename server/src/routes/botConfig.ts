import { Router } from 'express';
import { z } from 'zod';
import { getBotConfig, updateBotConfig } from '../services/botConfigService.js';

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
  horarioInicio: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  horarioFin: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  telefonoContacto: z.string().min(1).max(50).optional(),
});

router.get('/bot/config', async (_req, res) => {
  try {
    const config = await getBotConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener configuracion del bot', message: (err as Error).message });
  }
});

router.patch('/bot/config', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const updated = await updateBotConfig(parsed.data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar configuracion del bot', message: (err as Error).message });
  }
});

export default router;
