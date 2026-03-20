import { Router } from 'express';
import { z } from 'zod';
import { listEmails, getEmailStats, getEmailById } from '../services/emailQueryService.js';

const router = Router();

const emailQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  respondido: z.enum(['true', 'false']).optional(),
  complejoId: z.string().optional(),
  esFormulario: z.enum(['true', 'false']).optional(),
  hasError: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

router.get('/emails', async (req, res) => {
  const parsed = emailQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { page, pageSize, respondido, complejoId, esFormulario, hasError, search } = parsed.data;

  const result = await listEmails(
    {
      respondido: respondido !== undefined ? respondido === 'true' : undefined,
      complejoId,
      esFormulario: esFormulario !== undefined ? esFormulario === 'true' : undefined,
      hasError: hasError === 'true' ? true : undefined,
      search,
    },
    page,
    pageSize,
  );

  res.json(result);
});

router.get('/emails/stats', async (_req, res) => {
  const stats = await getEmailStats();
  res.json(stats);
});

router.get('/emails/:id', async (req, res) => {
  const email = await getEmailById(req.params.id);
  if (!email) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(email);
});

export default router;
