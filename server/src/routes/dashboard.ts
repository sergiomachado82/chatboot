import { Router } from 'express';
import { getDashboardStats } from '../services/dashboardService.js';
import { getMetrics } from '../services/metricsService.js';
import { calculateFunnel } from '../services/funnelService.js';

const router = Router();

router.get('/dashboard/stats', async (_req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/metrics', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();
    const metrics = await getMetrics(from, to);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/funnel', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();
    const funnel = await calculateFunnel(from, to);
    res.json(funnel);
  } catch (err) {
    next(err);
  }
});

export default router;
