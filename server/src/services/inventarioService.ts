import { prisma } from '../lib/prisma.js';
import type { DisponibilidadResult } from '@shared/types/inventario.js';

/** Get all active complejo names from DB */
async function getActiveHabitaciones(): Promise<string[]> {
  const complejos = await prisma.complejo.findMany({
    where: { activo: true },
    select: { nombre: true },
    orderBy: { creadoEn: 'asc' },
  });
  return complejos.map((c) => c.nombre);
}

/** Converts a Date (possibly UTC midnight) to local midnight for the same calendar date.
 *  e.g. 2026-10-01T00:00:00Z → local Oct 1 00:00 → 2026-10-01T03:00:00Z in UTC-3 */
function toLocalMidnight(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Generates an array of dates from start (inclusive) to end (exclusive), one per calendar day.
 * @param start - The start date of the range
 * @param end - The end date of the range (exclusive)
 * @returns An array of Date objects representing each day in the range
 */
export function dateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = toLocalMidnight(start);
  const endDate = toLocalMidnight(end);
  while (current < endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * Get cantidadUnidades for a habitacion (complejo name).
 * Returns 1 if complejo not found (safe default).
 */
async function getCantidadUnidades(habitacion: string): Promise<number> {
  const complejo = await prisma.complejo.findFirst({
    where: { nombre: habitacion, activo: true },
    select: { cantidadUnidades: true },
  });
  return complejo?.cantidadUnidades ?? 1;
}

/**
 * Count how many units are occupied on a specific date for a habitacion.
 * Returns { reservas, bloqueadas, total, cantidadUnidades }
 */
async function countOccupiedUnits(
  habitacion: string,
  date: Date,
  cantidadUnidades: number,
  excludeBloqueoId?: string,
): Promise<{ reservas: number; bloqueadas: number; total: number }> {
  const reservas = await prisma.reserva.count({
    where: {
      habitacion,
      estado: { notIn: ['cancelada', 'cancelado', 'completada'] },
      fechaEntrada: { lte: date },
      fechaSalida: { gt: date },
    },
  });

  const bloqueos = await prisma.bloqueo.findMany({
    where: {
      complejo: { nombre: habitacion },
      fechaInicio: { lte: date },
      fechaFin: { gt: date },
      ...(excludeBloqueoId ? { id: { not: excludeBloqueoId } } : {}),
    },
    select: { unidades: true },
  });

  let bloqueadas = 0;
  for (const b of bloqueos) {
    bloqueadas += b.unidades === 0 ? cantidadUnidades : b.unidades;
  }

  return { reservas, bloqueadas, total: reservas + bloqueadas };
}

/**
 * Recalculates the availability flag in the inventory for a room on the given dates based on reservation and block counts.
 * @param habitacion - The room/department name
 * @param dates - The array of dates to recalculate availability for
 * @param excludeBloqueoId - Optional block ID to exclude from the occupied count
 */
export async function recalcDisponible(habitacion: string, dates: Date[], excludeBloqueoId?: string) {
  if (dates.length === 0) return;
  const cantidadUnidades = await getCantidadUnidades(habitacion);

  for (const date of dates) {
    const { total } = await countOccupiedUnits(habitacion, date, cantidadUnidades, excludeBloqueoId);
    const disponible = total < cantidadUnidades;
    await prisma.inventario.updateMany({
      where: { habitacion, fecha: date },
      data: { disponible },
    });
  }
}

/**
 * Checks room availability for a date range, returning pricing details for each available room.
 * @param fechaEntrada - The check-in date
 * @param fechaSalida - The check-out date
 * @param habitacion - Optional specific room name to check; if omitted, checks all active rooms
 * @returns An array of availability results with per-night and total pricing for each available room
 */
export async function checkAvailability(
  fechaEntrada: Date,
  fechaSalida: Date,
  habitacion?: string,
): Promise<DisponibilidadResult[]> {
  const habitaciones = habitacion ? [habitacion] : await getActiveHabitaciones();
  const results: DisponibilidadResult[] = [];
  const noches = Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60 * 24));
  const dates = dateRange(fechaEntrada, fechaSalida);

  for (const hab of habitaciones) {
    const cantidadUnidades = await getCantidadUnidades(hab);

    // Per-date check: for each date, count reservas + bloqueadas < cantidadUnidades
    let allAvailable = true;
    for (const date of dates) {
      const { total } = await countOccupiedUnits(hab, date, cantidadUnidades);
      if (total >= cantidadUnidades) {
        allAvailable = false;
        break;
      }
    }

    if (!allAvailable) continue;

    // All dates have at least 1 free unit — check inventory prices
    const dias = await prisma.inventario.findMany({
      where: {
        habitacion: hab,
        fecha: { gte: fechaEntrada, lt: fechaSalida },
        disponible: true,
      },
      orderBy: { fecha: 'asc' },
    });

    if (dias.length === noches) {
      const precios = dias.map((d) => Number(d.precio));
      results.push({
        disponible: true,
        fechaEntrada: fechaEntrada.toISOString().split('T')[0]!,
        fechaSalida: fechaSalida.toISOString().split('T')[0]!,
        habitacion: hab,
        precioTotal: precios.reduce((a, b) => a + b, 0),
        precioPorNoche: precios,
        noches,
      });
    }
  }

  return results;
}

/**
 * Returns the names of all departments that are fully occupied for any day within the given date range.
 * @param fechaEntrada - The start date of the range
 * @param fechaSalida - The end date of the range
 * @returns An array of department names that have no available units on at least one day
 */
export async function getOccupiedDepartments(fechaEntrada: Date, fechaSalida: Date): Promise<string[]> {
  const occupied: string[] = [];
  const dates = dateRange(fechaEntrada, fechaSalida);

  const habitaciones = await getActiveHabitaciones();
  for (const hab of habitaciones) {
    const cantidadUnidades = await getCantidadUnidades(hab);
    let fullyOccupied = false;

    for (const date of dates) {
      const { total } = await countOccupiedUnits(hab, date, cantidadUnidades);
      if (total >= cantidadUnidades) {
        fullyOccupied = true;
        break;
      }
    }

    if (fullyOccupied) occupied.push(hab);
  }

  return occupied;
}

/**
 * Blocks inventory dates for a room by recalculating availability across the given date range.
 * @param habitacion - The room/department name
 * @param fechaEntrada - The start date to block
 * @param fechaSalida - The end date to block (exclusive)
 */
export async function blockDates(habitacion: string, fechaEntrada: Date, fechaSalida: Date) {
  const dates = dateRange(fechaEntrada, fechaSalida);
  if (dates.length === 0) return;
  await recalcDisponible(habitacion, dates);
}

/**
 * Releases previously blocked inventory dates for a room by recalculating availability.
 * @param habitacion - The room/department name
 * @param fechaEntrada - The start date to release
 * @param fechaSalida - The end date to release (exclusive)
 */
export async function releaseDates(habitacion: string, fechaEntrada: Date, fechaSalida: Date) {
  const dates = dateRange(fechaEntrada, fechaSalida);
  if (dates.length === 0) return;
  await recalcDisponible(habitacion, dates);
}

/**
 * Retrieves inventory records for a given month and optional room, ordered by room and date.
 * @param habitacion - Optional room name to filter by
 * @param mes - The month number (0-indexed); defaults to the current month
 * @param anio - The year; defaults to the current year
 * @returns An array of inventory records for the specified period
 */
export async function getInventario(habitacion?: string, mes?: number, anio?: number) {
  const now = new Date();
  const year = anio ?? now.getFullYear();
  const month = mes ?? now.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return prisma.inventario.findMany({
    where: {
      ...(habitacion ? { habitacion } : {}),
      fecha: { gte: startDate, lte: endDate },
    },
    orderBy: [{ habitacion: 'asc' }, { fecha: 'asc' }],
  });
}

/**
 * Updates a single inventory entry's availability, price, or notes.
 * @param id - The inventory entry ID
 * @param data - The fields to update (disponible, precio, notas)
 * @returns The updated inventory record
 */
export async function updateInventarioEntry(
  id: string,
  data: { disponible?: boolean; precio?: number; notas?: string },
) {
  return prisma.inventario.update({ where: { id }, data });
}

/**
 * Releases blocked dates by recalculating availability, optionally excluding a specific block.
 * @param habitacion - The room/department name
 * @param fechaInicio - The start date of the range to release
 * @param fechaFin - The end date of the range to release (exclusive)
 * @param excludeBloqueoId - Optional block ID to exclude from the occupied count during recalculation
 */
export async function releaseDatesIfNotReserved(
  habitacion: string,
  fechaInicio: Date,
  fechaFin: Date,
  excludeBloqueoId?: string,
) {
  const dates = dateRange(fechaInicio, fechaFin);
  await recalcDisponible(habitacion, dates, excludeBloqueoId);
}
