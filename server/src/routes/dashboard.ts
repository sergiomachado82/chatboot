import { Router } from 'express';
import { getDashboardStats } from '../services/dashboardService.js';
import { getMetrics } from '../services/metricsService.js';
import { calculateFunnel } from '../services/funnelService.js';
import { getIntentAnalytics } from '../services/intentAnalyticsService.js';
import { getCsatMetrics } from '../services/csatService.js';
import { getTrends } from '../services/trendsService.js';
import { getAgentMetrics } from '../services/agentMetricsService.js';

const router = Router();

/** Parses from/to query params with a 30-day default range. */
function parseDateRange(query: Record<string, unknown>): { from: Date; to: Date } {
  const from = query.from ? new Date(query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to as string) : new Date();
  return { from, to };
}

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
    const { from, to } = parseDateRange(req.query);
    const metrics = await getMetrics(from, to);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/funnel', async (req, res, next) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const funnel = await calculateFunnel(from, to);
    res.json(funnel);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/intents', async (req, res, next) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const intents = await getIntentAnalytics(from, to);
    res.json(intents);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/csat', async (req, res, next) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const csat = await getCsatMetrics(from, to);
    res.json(csat);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/trends', async (req, res, next) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const trends = await getTrends(from, to);
    res.json(trends);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/agent-metrics', async (req, res, next) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const agentMetrics = await getAgentMetrics(from, to);
    res.json(agentMetrics);
  } catch (err) {
    next(err);
  }
});

export default router;
