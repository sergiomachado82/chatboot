import { google, calendar_v3 } from 'googleapis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { recalcDisponible, dateRange } from './inventarioService.js';

const MANAGED_TAG = 'chatbootManaged';

function getAuth() {
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY || !env.GOOGLE_CALENDAR_ID) {
    return null;
  }

  return new google.auth.JWT(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar']
  );
}

function getCalendar() {
  const auth = getAuth();
  if (!auth) return null;
  return { api: google.calendar({ version: 'v3', auth }), calendarId: env.GOOGLE_CALENDAR_ID };
}

/** Format Date as YYYY-MM-DD for all-day GCal events */
function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ──────────────────────────────────────────────
// PUSH: Sistema → Google Calendar
// ──────────────────────────────────────────────

/**
 * Push a reserva to Google Calendar.
 * Creates, updates, or deletes the GCal event depending on the reserva state.
 */
export async function pushReservaToGCal(reservaId: string): Promise<void> {
  const cal = getCalendar();
  if (!cal) return;

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    select: {
      id: true,
      nombreHuesped: true,
      habitacion: true,
      fechaEntrada: true,
      fechaSalida: true,
      estado: true,
      googleCalEventId: true,
    },
  });
  if (!reserva) return;

  const isCancelled = reserva.estado === 'cancelada' || reserva.estado === 'cancelado';

  // If cancelled and has GCal event, delete it
  if (isCancelled && reserva.googleCalEventId) {
    try {
      await cal.api.events.delete({
        calendarId: cal.calendarId,
        eventId: reserva.googleCalEventId,
      });
      await prisma.reserva.update({
        where: { id: reservaId },
        data: { googleCalEventId: null },
      });
      logger.info({ reservaId }, 'Deleted reserva event from GCal');
    } catch (err: any) {
      if (err.code === 404 || err.code === 410) {
        // Event already deleted, clear reference
        await prisma.reserva.update({
          where: { id: reservaId },
          data: { googleCalEventId: null },
        });
      } else {
        throw err;
      }
    }
    return;
  }

  // If cancelled but no GCal event, nothing to do
  if (isCancelled) return;

  const summary = `Reserva: ${reserva.habitacion ?? 'Sin asignar'} - ${reserva.nombreHuesped ?? 'Sin nombre'}`;
  const eventBody: calendar_v3.Schema$Event = {
    summary,
    start: { date: formatDate(reserva.fechaEntrada) },
    end: { date: formatDate(reserva.fechaSalida) },
    extendedProperties: {
      private: { [MANAGED_TAG]: 'true' },
    },
  };

  if (reserva.googleCalEventId) {
    // Update existing event
    try {
      await cal.api.events.update({
        calendarId: cal.calendarId,
        eventId: reserva.googleCalEventId,
        requestBody: eventBody,
      });
      logger.info({ reservaId }, 'Updated reserva event in GCal');
    } catch (err: any) {
      if (err.code === 404 || err.code === 410) {
        // Event was deleted externally, create a new one
        const created = await cal.api.events.insert({
          calendarId: cal.calendarId,
          requestBody: eventBody,
        });
        if (created.data.id) {
          await prisma.reserva.update({
            where: { id: reservaId },
            data: { googleCalEventId: created.data.id },
          });
        }
      } else {
        throw err;
      }
    }
  } else {
    // Create new event
    const created = await cal.api.events.insert({
      calendarId: cal.calendarId,
      requestBody: eventBody,
    });
    if (created.data.id) {
      await prisma.reserva.update({
        where: { id: reservaId },
        data: { googleCalEventId: created.data.id },
      });
      logger.info({ reservaId, gcalEventId: created.data.id }, 'Created reserva event in GCal');
    }
  }
}

/**
 * Push a bloqueo to Google Calendar.
 * Skips if the bloqueo originated from Google Calendar (avoids loops).
 */
export async function pushBloqueoToGCal(bloqueoId: string): Promise<void> {
  const cal = getCalendar();
  if (!cal) return;

  const bloqueo = await prisma.bloqueo.findUnique({
    where: { id: bloqueoId },
    include: { complejo: { select: { nombre: true } } },
  });
  if (!bloqueo || bloqueo.origenGoogle) return;

  const summary = `Bloqueado: ${bloqueo.complejo.nombre}${bloqueo.motivo ? ` - ${bloqueo.motivo}` : ''}`;
  const eventBody: calendar_v3.Schema$Event = {
    summary,
    start: { date: formatDate(bloqueo.fechaInicio) },
    end: { date: formatDate(bloqueo.fechaFin) },
    extendedProperties: {
      private: { [MANAGED_TAG]: 'true' },
    },
  };

  if (bloqueo.googleCalEventId) {
    // Already synced, update
    try {
      await cal.api.events.update({
        calendarId: cal.calendarId,
        eventId: bloqueo.googleCalEventId,
        requestBody: eventBody,
      });
    } catch (err: any) {
      if (err.code === 404 || err.code === 410) {
        const created = await cal.api.events.insert({
          calendarId: cal.calendarId,
          requestBody: eventBody,
        });
        if (created.data.id) {
          await prisma.bloqueo.update({
            where: { id: bloqueoId },
            data: { googleCalEventId: created.data.id },
          });
        }
      } else {
        throw err;
      }
    }
  } else {
    const created = await cal.api.events.insert({
      calendarId: cal.calendarId,
      requestBody: eventBody,
    });
    if (created.data.id) {
      await prisma.bloqueo.update({
        where: { id: bloqueoId },
        data: { googleCalEventId: created.data.id },
      });
      logger.info({ bloqueoId, gcalEventId: created.data.id }, 'Created bloqueo event in GCal');
    }
  }
}

/**
 * Delete a bloqueo event from Google Calendar by its GCal event ID.
 */
export async function deleteBloqueoFromGCal(googleCalEventId: string): Promise<void> {
  const cal = getCalendar();
  if (!cal) return;

  try {
    await cal.api.events.delete({
      calendarId: cal.calendarId,
      eventId: googleCalEventId,
    });
    logger.info({ gcalEventId: googleCalEventId }, 'Deleted bloqueo event from GCal');
  } catch (err: any) {
    if (err.code !== 404 && err.code !== 410) {
      throw err;
    }
    // Already deleted, ignore
  }
}

// ──────────────────────────────────────────────
// PULL: Google Calendar → Sistema
// ──────────────────────────────────────────────

/** In-memory sync token for incremental sync. Full sync happens on restart. */
let syncToken: string | null = null;

/**
 * Sync events from Google Calendar into the system as bloqueos.
 * Uses incremental sync (syncToken) when available, full sync on first run.
 * Only imports events that are NOT managed by us (no chatbootManaged property).
 */
export async function syncFromGoogleCalendar(): Promise<{
  created: number;
  deleted: number;
}> {
  const cal = getCalendar();
  if (!cal) return { created: 0, deleted: 0 };

  let created = 0;
  let deleted = 0;
  let pageToken: string | undefined;
  const affectedComplejos = new Set<string>();

  try {
    do {
      const params: calendar_v3.Params$Resource$Events$List = {
        calendarId: cal.calendarId,
        singleEvents: true,
        maxResults: 250,
      };

      if (syncToken && !pageToken) {
        params.syncToken = syncToken;
      } else if (!syncToken && !pageToken) {
        // Full sync: only future events (from 30 days ago)
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 30);
        params.timeMin = timeMin.toISOString();
      }

      if (pageToken) {
        params.pageToken = pageToken;
      }

      let response: Awaited<ReturnType<typeof cal.api.events.list>>;
      try {
        response = await cal.api.events.list(params);
      } catch (err: any) {
        if (err.code === 410) {
          // syncToken expired, do full sync
          syncToken = null;
          logger.info('GCal syncToken expired, performing full sync');
          return syncFromGoogleCalendar();
        }
        throw err;
      }

      const events = response.data.items ?? [];

      for (const event of events) {
        if (!event.id) continue;

        // Skip events managed by us
        const isManaged = event.extendedProperties?.private?.[MANAGED_TAG] === 'true';
        if (isManaged) continue;

        // Check if this event was cancelled (deleted)
        if (event.status === 'cancelled') {
          // Find and delete corresponding bloqueo
          const bloqueo = await prisma.bloqueo.findFirst({
            where: { googleCalEventId: event.id, origenGoogle: true },
          });
          if (bloqueo) {
            const complejo = await prisma.complejo.findUnique({
              where: { id: bloqueo.complejoId },
              select: { nombre: true },
            });
            await prisma.bloqueo.delete({ where: { id: bloqueo.id } });
            if (complejo) {
              const dates = dateRange(new Date(bloqueo.fechaInicio), new Date(bloqueo.fechaFin));
              if (dates.length > 0) {
                await recalcDisponible(complejo.nombre, dates, bloqueo.id);
              }
            }
            deleted++;
            logger.info({ gcalEventId: event.id, bloqueoId: bloqueo.id }, 'Deleted GCal-imported bloqueo');
          }
          continue;
        }

        // Skip events without dates
        if (!event.start?.date && !event.start?.dateTime) continue;
        if (!event.end?.date && !event.end?.dateTime) continue;

        const startDate = event.start.date
          ? new Date(event.start.date + 'T00:00:00Z')
          : new Date(event.start.dateTime!);
        const endDate = event.end.date
          ? new Date(event.end.date + 'T00:00:00Z')
          : new Date(event.end.dateTime!);

        // Try to match complejo by name in the event summary
        const summary = event.summary ?? '';
        const complejo = await matchComplejoFromSummary(summary);
        if (!complejo) continue;

        // Check if we already have this bloqueo
        const existingBloqueo = await prisma.bloqueo.findFirst({
          where: { googleCalEventId: event.id, origenGoogle: true },
        });

        if (existingBloqueo) {
          // Update dates if changed
          const existStart = existingBloqueo.fechaInicio.getTime();
          const existEnd = existingBloqueo.fechaFin.getTime();
          if (existStart !== startDate.getTime() || existEnd !== endDate.getTime()) {
            await prisma.bloqueo.update({
              where: { id: existingBloqueo.id },
              data: { fechaInicio: startDate, fechaFin: endDate },
            });
            affectedComplejos.add(complejo.id);
          }
        } else {
          // Create new bloqueo from GCal event
          await prisma.bloqueo.create({
            data: {
              complejoId: complejo.id,
              fechaInicio: startDate,
              fechaFin: endDate,
              motivo: summary || 'Google Calendar',
              origenGoogle: true,
              googleCalEventId: event.id,
            },
          });
          affectedComplejos.add(complejo.id);
          created++;
          logger.info({ gcalEventId: event.id, complejoId: complejo.id }, 'Created bloqueo from GCal event');
        }
      }

      pageToken = response.data.nextPageToken ?? undefined;
      if (!pageToken && response.data.nextSyncToken) {
        syncToken = response.data.nextSyncToken;
      }
    } while (pageToken);

    // Recalc inventory for affected complejos
    for (const complejoId of affectedComplejos) {
      const c = await prisma.complejo.findUnique({
        where: { id: complejoId },
        select: { nombre: true },
      });
      if (c) {
        // Recalc for a broad date range
        const start = new Date();
        start.setDate(start.getDate() - 7);
        const end = new Date();
        end.setDate(end.getDate() + 365);
        const dates = dateRange(start, end);
        await recalcDisponible(c.nombre, dates);
      }
    }
  } catch (err) {
    logger.error({ err }, 'Error syncing from Google Calendar');
    throw err;
  }

  if (created || deleted) {
    logger.info({ created, deleted }, 'GCal sync completed');
  }

  return { created, deleted };
}

/**
 * Try to match a complejo by looking for its name in the event summary.
 * Falls back to the first active complejo if no match is found.
 */
async function matchComplejoFromSummary(summary: string): Promise<{ id: string; nombre: string } | null> {
  const complejos = await prisma.complejo.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, aliases: true },
    orderBy: { creadoEn: 'asc' },
  });

  if (complejos.length === 0) return null;

  const lowerSummary = summary.toLowerCase();

  // Try matching by name or alias
  for (const c of complejos) {
    if (lowerSummary.includes(c.nombre.toLowerCase())) {
      return { id: c.id, nombre: c.nombre };
    }
    for (const alias of c.aliases) {
      if (lowerSummary.includes(alias.toLowerCase())) {
        return { id: c.id, nombre: c.nombre };
      }
    }
  }

  // Fallback: first active complejo
  return { id: complejos[0].id, nombre: complejos[0].nombre };
}
