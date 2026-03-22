import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { getRedis } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const KEY_PREFIX = 'chatboot:ratelimit:';

// In-memory fallback stores (one per limiter namespace)
const memoryStores = new Map<string, Map<string, { count: number; resetAt: number }>>();

function getMemoryStore(namespace: string): Map<string, { count: number; resetAt: number }> {
  let store = memoryStores.get(namespace);
  if (!store) {
    store = new Map();
    memoryStores.set(namespace, store);
  }
  return store;
}

/**
 * Creates a rate limiter middleware with custom limits.
 * @param namespace - Redis key namespace (e.g. 'api', 'login', 'webchat')
 * @param maxRequests - Maximum requests per window
 * @param windowSeconds - Window size in seconds
 */
export function createRateLimiter(namespace: string, maxRequests: number, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;

  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    const ip = req.ip ?? 'unknown';
    const redis = getRedis();

    if (redis) {
      try {
        const key = `${KEY_PREFIX}${namespace}:${ip}`;
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, windowSeconds);
        }

        const ttl = await redis.ttl(key);
        const resetTimestamp = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds);

        res.set('X-RateLimit-Limit', String(maxRequests));
        res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - count)));
        res.set('X-RateLimit-Reset', String(resetTimestamp));

        if (count > maxRequests) {
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
    const store = getMemoryStore(namespace);
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      const resetTimestamp = Math.floor((now + windowMs) / 1000);
      res.set('X-RateLimit-Limit', String(maxRequests));
      res.set('X-RateLimit-Remaining', String(maxRequests - 1));
      res.set('X-RateLimit-Reset', String(resetTimestamp));
      next();
      return;
    }

    entry.count++;
    const resetTimestamp = Math.floor(entry.resetAt / 1000);
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    res.set('X-RateLimit-Reset', String(resetTimestamp));

    if (entry.count > maxRequests) {
      res.status(429).json({ error: 'Too Many Requests', message: 'Rate limit exceeded' });
      return;
    }

    next();
  };
}

// Default API rate limiter (used by protected routes)
const WINDOW_SECONDS = Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000);
const MAX_REQUESTS = env.RATE_LIMIT_MAX_REQUESTS;
export const rateLimiter = createRateLimiter('api', MAX_REQUESTS, WINDOW_SECONDS);

// Stricter limiters for public routes
export const loginRateLimiter = createRateLimiter('login', 5, 60); // 5 attempts per minute
export const webchatRateLimiter = createRateLimiter('webchat', 30, 60); // 30 messages per minute
