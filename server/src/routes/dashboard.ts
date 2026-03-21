import { Router } from 'express';
import { getDashboardStats } from '../services/dashboardService.js';

const router = Router();

router.get('/dashboard/stats', async (_req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
