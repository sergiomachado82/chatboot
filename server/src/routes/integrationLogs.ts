import { Router } from 'express';
import { getIntegrationLogs } from '../services/integrationLogService.js';

const router = Router();

router.get('/integration-logs', async (req, res) => {
  try {
    const servicio = req.query.servicio as string | undefined;
    const limit = Number(req.query.limit) || 100;
    const logs = await getIntegrationLogs({ servicio, limit });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener logs', message: (err as Error).message });
  }
});

export default router;
