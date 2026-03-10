import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  return redis;
}

export async function initRedis(): Promise<Redis | null> {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis connection failed after 3 retries, continuing without Redis');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redis.on('error', (err) => {
      logger.error({ err }, 'Redis error');
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    await redis.ping();
    return redis;
  } catch (err) {
    logger.warn({ err }, 'Redis unavailable, continuing without it');
    redis = null;
    return null;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
