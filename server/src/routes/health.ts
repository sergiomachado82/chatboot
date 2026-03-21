import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getRedis } from '../lib/redis.js';
import { env } from '../config/env.js';

const router = Router();

let claudeCache: { status?: string; latencyMs?: number; checkedAt?: number } = {};

router.get('/health', async (_req, res) => {
  const services: Record<string, { status: 'ok' | 'error' | 'not_configured'; latencyMs?: number }> = {};

  // Database check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    services.database = { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    services.database = { status: 'error' };
  }

  // Redis check
  try {
    const redis = getRedis();
    if (redis) {
      const start = Date.now();
      await redis.ping();
      services.redis = { status: 'ok', latencyMs: Date.now() - start };
    } else {
      services.redis = { status: 'error' };
    }
  } catch {
    services.redis = { status: 'error' };
  }

  // Claude API check with cached ping
  if (env.ANTHROPIC_API_KEY) {
    const now = Date.now();
    if (!claudeCache.checkedAt || now - claudeCache.checkedAt > 60_000) {
      try {
        const start = Date.now();
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
        await client.messages.countTokens({
          model: env.CLAUDE_CLASSIFIER_MODEL,
          messages: [{ role: 'user', content: 'ping' }],
        });
        claudeCache = { status: 'ok', latencyMs: Date.now() - start, checkedAt: now };
      } catch {
        claudeCache = { status: 'error', checkedAt: now };
      }
    }
    services.claude = {
      status: claudeCache.status as 'ok' | 'error',
      ...(claudeCache.latencyMs ? { latencyMs: claudeCache.latencyMs } : {}),
    };
  } else {
    services.claude = { status: 'not_configured' };
  }

  // WhatsApp API check
  if (env.SIMULATOR_MODE) {
    services.whatsapp = { status: 'ok' };
  } else if (env.WA_ACCESS_TOKEN && env.WA_PHONE_NUMBER_ID) {
    services.whatsapp = { status: 'ok' };
  } else {
    services.whatsapp = { status: 'not_configured' };
  }

  // Google Sheets check
  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_SHEET_ID) {
    services.sheets = { status: 'ok' };
  } else {
    services.sheets = { status: 'not_configured' };
  }

  const allOk = Object.values(services).every((s) => s.status === 'ok' || s.status === 'not_configured');

  res.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    simulatorMode: env.SIMULATOR_MODE,
    services,
  });
});

export default router;
