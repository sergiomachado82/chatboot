import { Router } from 'express';
import { z } from 'zod';
import { getBusinessProfile, updateBusinessProfile } from '../services/whatsappProfileService.js';

const router = Router();

const VERTICALS = [
  'UNDEFINED', 'OTHER', 'AUTO', 'BEAUTY', 'APPAREL', 'EDU', 'ENTERTAIN',
  'EVENT_PLAN', 'FINANCE', 'GROCERY', 'GOVT', 'HOTEL', 'HEALTH',
  'NONPROFIT', 'PROF_SERVICES', 'RETAIL', 'TRAVEL', 'RESTAURANT', 'NOT_A_BIZ',
] as const;

const updateSchema = z.object({
  about: z.string().max(139).optional(),
  description: z.string().max(512).optional(),
  address: z.string().max(256).optional(),
  email: z.string().email().optional(),
  websites: z.array(z.string().url()).max(2).optional(),
  vertical: z.enum(VERTICALS).optional(),
});

router.get('/whatsapp/profile', async (_req, res) => {
  try {
    const profile = await getBusinessProfile();
    res.json(profile);
  } catch (err) {
    res.status(502).json({ error: 'Error al obtener perfil de WhatsApp', message: (err as Error).message });
  }
});

router.patch('/whatsapp/profile', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const result = await updateBusinessProfile(parsed.data);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Error al actualizar perfil de WhatsApp', message: (err as Error).message });
  }
});

export default router;
