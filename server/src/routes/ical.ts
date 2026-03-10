import { Router } from 'express';
import { generateIcal } from '../services/icalService.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Public endpoint: Booking.com (and other channels) fetch this URL
 * to read our availability calendar.
 * GET /api/ical/:complejoId.ics
 */
router.get('/ical/:complejoId.ics', async (req, res) => {
  try {
    const { complejoId } = req.params;
    const calendar = await generateIcal(complejoId);

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="calendar.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    res.send(calendar);
  } catch (err) {
    logger.error({ err, complejoId: req.params.complejoId }, 'Error generating iCal');
    res.status(404).json({ error: 'Complejo not found or iCal generation failed' });
  }
});

export default router;
