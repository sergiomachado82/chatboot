import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { recalcDisponible, dateRange } from './inventarioService.js';
import { pushReservaToGCal } from './googleCalendarService.js';

// node-ical has no @types — lazy-load via dynamic import
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let icalModule: any = null;
async function getIcal() {
  if (!icalModule) {
    icalModule = await import('node-ical');
  }
  return icalModule;
}

const DOMAIN = 'chatboot.app';

/** Format a Date as YYYYMMDD for iCal VALUE=DATE fields */
function formatDateIcal(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** Format a Date as iCal DTSTAMP (UTC) */
function formatDtstamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

/** Converts a Date (possibly UTC midnight) to local midnight for the same calendar date */
function toLocalMidnight(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generate an iCal VCALENDAR string for a complejo.
 * Includes active reservations and bloqueos as all-day VEVENTs.
 */
export async function generateIcal(complejoId: string): Promise<string> {
  const complejo = await prisma.complejo.findUnique({
    where: { id: complejoId },
    select: { id: true, nombre: true },
  });
  if (!complejo) throw new Error(`Complejo ${complejoId} not found`);

  // Active reservations for this complejo
  const reservas = await prisma.reserva.findMany({
    where: {
      habitacion: complejo.nombre,
      estado: { in: ['pre_reserva', 'confirmada'] },
    },
    select: { id: true, fechaEntrada: true, fechaSalida: true, creadoEn: true },
  });

  // Bloqueos for this complejo
  const bloqueos = await prisma.bloqueo.findMany({
    where: { complejoId: complejo.id },
    select: { id: true, fechaInicio: true, fechaFin: true, motivo: true, creadoEn: true },
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${DOMAIN}//Chatboot//ES`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const r of reservas) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:reserva-${r.id}@${DOMAIN}`,
      `DTSTAMP:${formatDtstamp(r.creadoEn)}`,
      `DTSTART;VALUE=DATE:${formatDateIcal(r.fechaEntrada)}`,
      `DTEND;VALUE=DATE:${formatDateIcal(r.fechaSalida)}`,
      'SUMMARY:Reservado',
      'END:VEVENT',
    );
  }

  for (const b of bloqueos) {
    const summary = b.motivo ? `Bloqueado - ${b.motivo}` : 'Bloqueado';
    lines.push(
      'BEGIN:VEVENT',
      `UID:bloqueo-${b.id}@${DOMAIN}`,
      `DTSTAMP:${formatDtstamp(b.creadoEn)}`,
      `DTSTART;VALUE=DATE:${formatDateIcal(b.fechaInicio)}`,
      `DTEND;VALUE=DATE:${formatDateIcal(b.fechaFin)}`,
      `SUMMARY:${summary}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

interface IcalEvent {
  type: string;
  uid?: string;
  start?: Date;
  end?: Date;
  summary?: string;
}

/**
 * Sync reservations from an iCal feed for a complejo.
 * Creates new reservas for unknown UIDs, updates changed dates, cancels removed ones.
 */
export async function syncFromIcalFeed(
  complejoId: string,
  icalUrl: string,
  plataforma: string,
): Promise<{
  created: number;
  updated: number;
  cancelled: number;
}> {
  const complejo = await prisma.complejo.findUnique({
    where: { id: complejoId },
    select: { id: true, nombre: true },
  });
  if (!complejo) throw new Error(`Complejo ${complejoId} not found`);

  // Fetch and parse iCal
  let data: Record<string, IcalEvent>;
  try {
    const ical = await getIcal();
    data = await ical.async.fromURL(icalUrl);
  } catch (err) {
    logger.error({ err, complejoId, icalUrl, plataforma }, 'Failed to fetch iCal feed');
    throw err;
  }

  // Extract VEVENTs with valid dates
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7); // include events up to 7 days in the past

  const feedEvents: { uid: string; start: Date; end: Date; summary: string }[] = [];
  for (const [, entry] of Object.entries(data)) {
    if (entry.type !== 'VEVENT' || !entry.uid || !entry.start || !entry.end) continue;
    const end = new Date(entry.end);
    if (end < cutoff) continue; // skip old events
    feedEvents.push({
      uid: entry.uid,
      start: new Date(entry.start),
      end: new Date(entry.end),
      summary: entry.summary ?? '',
    });
  }

  const feedUids = new Set(feedEvents.map((e) => e.uid));

  // Get existing reservas for this complejo from this platform
  const existingReservas = await prisma.reserva.findMany({
    where: {
      habitacion: complejo.nombre,
      origenReserva: plataforma,
      estado: { notIn: ['cancelada', 'cancelado'] },
    },
    select: { id: true, notas: true, fechaEntrada: true, fechaSalida: true },
  });

  // Build map: uid -> existing reserva
  const uidToReserva = new Map<string, (typeof existingReservas)[0]>();
  for (const r of existingReservas) {
    if (r.notas) {
      // notas stores the UID like "ical-uid:abc123"
      const match = r.notas.match(/^ical-uid:(.+)$/);
      if (match) uidToReserva.set(match[1], r);
    }
  }

  let created = 0;
  let updated = 0;
  let cancelled = 0;

  const affectedDates: Date[] = [];

  // Process feed events
  for (const evt of feedEvents) {
    const existing = uidToReserva.get(evt.uid);
    const fechaEntrada = toLocalMidnight(evt.start);
    const fechaSalida = toLocalMidnight(evt.end);

    if (!existing) {
      // Create new reserva
      const newReserva = await prisma.reserva.create({
        data: {
          nombreHuesped: `Reserva ${capitalize(plataforma)}`,
          habitacion: complejo.nombre,
          fechaEntrada,
          fechaSalida,
          estado: 'confirmada',
          origenReserva: plataforma,
          notas: `ical-uid:${evt.uid}`,
        },
      });
      affectedDates.push(...dateRange(fechaEntrada, fechaSalida));
      created++;

      // Push to Google Calendar (fire-and-forget)
      pushReservaToGCal(newReserva.id).catch((err) =>
        logger.error({ err, reservaId: newReserva.id }, 'GCal push failed for iCal-imported reserva'),
      );
    } else {
      // Check if dates changed
      const existStart = toLocalMidnight(existing.fechaEntrada);
      const existEnd = toLocalMidnight(existing.fechaSalida);

      if (existStart.getTime() !== fechaEntrada.getTime() || existEnd.getTime() !== fechaSalida.getTime()) {
        // Release old dates first
        affectedDates.push(...dateRange(existStart, existEnd));
        // Update
        await prisma.reserva.update({
          where: { id: existing.id },
          data: { fechaEntrada, fechaSalida },
        });
        affectedDates.push(...dateRange(fechaEntrada, fechaSalida));
        updated++;
      }
      // else: dates match, skip
    }
  }

  // Cancel reservas whose UID is no longer in the feed (guest cancelled)
  for (const [uid, reserva] of uidToReserva) {
    if (!feedUids.has(uid)) {
      await prisma.reserva.update({
        where: { id: reserva.id },
        data: { estado: 'cancelada' },
      });
      const start = toLocalMidnight(reserva.fechaEntrada);
      const end = toLocalMidnight(reserva.fechaSalida);
      affectedDates.push(...dateRange(start, end));
      cancelled++;
    }
  }

  // Recalc disponibilidad for all affected dates
  if (affectedDates.length > 0) {
    // Deduplicate dates by timestamp
    const uniqueDates = [...new Map(affectedDates.map((d) => [d.getTime(), d])).values()];
    await recalcDisponible(complejo.nombre, uniqueDates);
  }

  logger.info(
    { complejoId, complejo: complejo.nombre, plataforma, created, updated, cancelled },
    'iCal sync completed',
  );

  return { created, updated, cancelled };
}
