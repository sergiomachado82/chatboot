import { Router } from 'express';
import { env } from '../config/env.js';
import { processIncomingMessage } from '../services/webhookProcessor.js';
import { transcribeAudio } from '../services/claudeService.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const router = Router();

const simulatorSchema = z.object({
  from: z.string().default('5491155550000'),
  body: z.string().min(1),
  name: z.string().optional(),
});

const simulatorAudioSchema = z.object({
  from: z.string().default('5491155550000'),
  audio: z.string().min(1),       // base64-encoded audio
  mimeType: z.string().min(1),    // e.g. "audio/ogg", "audio/webm"
  name: z.string().optional(),
});

// Only available in simulator mode
router.post('/simulator/send', (req, res) => {
  if (!env.SIMULATOR_MODE) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const parsed = simulatorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { from, body, name } = parsed.data;

  // Process as if it were a real WhatsApp message
  processIncomingMessage(
    {
      from,
      id: `sim_in_${Date.now()}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'text',
      text: { body },
    },
    name ?? 'Simulador'
  ).catch((err) => {
    logger.error({ err }, 'Simulator processing error');
  });

  res.json({ ok: true });
});

// Audio message endpoint for simulator
router.post('/simulator/send-audio', async (req, res) => {
  if (!env.SIMULATOR_MODE) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const parsed = simulatorAudioSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { from, audio, mimeType, name } = parsed.data;

  try {
    // Transcribe audio using Claude
    const audioBuffer = Buffer.from(audio, 'base64');
    const transcripcion = await transcribeAudio(audioBuffer, mimeType);

    logger.info({ from, transcripcion: transcripcion.slice(0, 100) }, 'Simulator: audio transcribed');

    // Process transcribed text as a message
    processIncomingMessage(
      {
        from,
        id: `sim_audio_${Date.now()}`,
        timestamp: String(Math.floor(Date.now() / 1000)),
        type: 'text',
        text: { body: transcripcion },
      },
      name ?? 'Simulador'
    ).catch((err) => {
      logger.error({ err }, 'Simulator audio processing error');
    });

    res.json({ ok: true, transcripcion });
  } catch (err) {
    logger.error({ err }, 'Simulator audio transcription failed');
    res.status(500).json({ error: 'Transcription failed' });
  }
});

export default router;
