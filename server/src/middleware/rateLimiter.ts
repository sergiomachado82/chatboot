import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { getRedis } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const WINDOW_SECONDS = Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000);
const MAX_REQUESTS = env.RATE_LIMIT_MAX_REQUESTS;
const KEY_PREFIX = 'chatboot:ratelimit:api:';

// In-memory fallback when Redis is unavailable
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = req.ip ?? 'unknown';
  const redis = getRedis();

  if (redis) {
    try {
      const key = `${KEY_PREFIX}${ip}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, WINDOW_SECONDS);
      }

      if (count > MAX_REQUESTS) {
        res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded' });
        return;
      }

      next();
      return;
    } catch (err) {
      logger.warn({ err }, 'Redis rate limiter failed, falling back to memory');
    }
  }

  // Fallback: in-memory rate limiting
  const now = Date.now();
  const entry = memoryStore.get(ip);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(ip, { count: 1, resetAt: now + env.RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded' });
    return;
  }

  next();
}
