import { Router } from 'express';
import { env } from '../config/env.js';
import { webhookSignature } from '../middleware/webhookSignature.js';
import { processIncomingMessage, parseMetaWebhookPayload } from '../services/webhookProcessor.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Meta verification (GET)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WA_VERIFY_TOKEN) {
    logger.info('Webhook verified');
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send('Forbidden');
});

// Receive messages (POST)
router.post('/webhook', webhookSignature, (req, res) => {
  // Always respond 200 immediately to Meta
  res.sendStatus(200);

  const parsed = parseMetaWebhookPayload(req.body);
  if (!parsed) return;

  // Process messages asynchronously
  for (const message of parsed.messages) {
    processIncomingMessage(message, parsed.contactName).catch((err) => {
      logger.error({ err }, 'Error processing webhook message');
    });
  }
});

export default router;
