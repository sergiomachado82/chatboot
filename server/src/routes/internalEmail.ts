import { Router } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { processRawEmailSource } from '../services/emailPollerService.js';

const router = Router();

router.post('/internal/incoming-email', async (req, res) => {
  // Check that the key is configured
  if (!env.INTERNAL_EMAIL_KEY) {
    logger.warn('INTERNAL_EMAIL_KEY not configured, rejecting internal email request');
    res.status(503).json({ error: 'Internal email endpoint not configured' });
    return;
  }

  // Validate Bearer token
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${env.INTERNAL_EMAIL_KEY}`) {
    logger.warn('Invalid or missing authorization for internal email endpoint');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { rawEmail } = req.body || {};
  if (!rawEmail || typeof rawEmail !== 'string') {
    // Return 200 so Postfix doesn't bounce
    res.json({ processed: false, error: 'Missing rawEmail field' });
    return;
  }

  let emailBuffer: Buffer;
  try {
    emailBuffer = Buffer.from(rawEmail, 'base64');
  } catch {
    res.json({ processed: false, error: 'Invalid base64 encoding' });
    return;
  }

  if (emailBuffer.length === 0) {
    res.json({ processed: false, error: 'Empty email content' });
    return;
  }

  logger.info({ size: emailBuffer.length }, 'Received email via internal pipe endpoint');

  // Always return 200 to avoid Postfix bounces; process in background
  res.json({ received: true });

  try {
    const result = await processRawEmailSource(emailBuffer);
    logger.info({ result }, 'Internal pipe email processing completed');
  } catch (err) {
    logger.error({ err }, 'Internal pipe email processing failed');
  }
});

export default router;
