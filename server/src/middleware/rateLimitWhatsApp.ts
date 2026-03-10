import { getRedis } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

const MAX_MESSAGES_PER_MINUTE = 10;
const WINDOW_SECONDS = 60;

/**
 * Check if a WhatsApp number has exceeded the rate limit.
 * Uses Redis sliding window counter. Falls back to allowing all messages if Redis is unavailable.
 * Returns true if the message should be BLOCKED.
 */
export async function isRateLimited(waId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // No Redis = no rate limiting

  const key = `chatboot:ratelimit:wa:${waId}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > MAX_MESSAGES_PER_MINUTE) {
      logger.warn({ waId, count, limit: MAX_MESSAGES_PER_MINUTE }, 'WhatsApp rate limit exceeded');
      return true;
    }

    return false;
  } catch (err) {
    logger.error({ err, waId }, 'Error checking rate limit');
    return false; // On error, allow the message
  }
}
