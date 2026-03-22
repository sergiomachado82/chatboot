import { getRedis } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const DEFAULT_TTL = 300; // 5 minutes

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedis();
      if (!redis) return null;
      const raw = await redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn({ err, key }, 'cache.get failed');
      return null;
    }
  },

  async set(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      logger.warn({ err, key }, 'cache.set failed');
    }
  },

  async del(...keys: string[]): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis || keys.length === 0) return;
      await redis.del(...keys);
    } catch (err) {
      logger.warn({ err, keys }, 'cache.del failed');
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.warn({ err, pattern }, 'cache.invalidatePattern failed');
    }
  },
};
