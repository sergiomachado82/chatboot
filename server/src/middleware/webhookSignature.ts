import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function webhookSignature(req: Request, res: Response, next: NextFunction): void {
  if (env.SIMULATOR_MODE) {
    next();
    return;
  }

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature || !env.WA_APP_SECRET) {
    logger.warn('Missing webhook signature or app secret');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const rawBody = (req as Record<string, unknown>).rawBody as Buffer | undefined;
  const body = rawBody ?? JSON.stringify(req.body);
  const expected = 'sha256=' + crypto.createHmac('sha256', env.WA_APP_SECRET).update(body).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    logger.warn('Invalid webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}
