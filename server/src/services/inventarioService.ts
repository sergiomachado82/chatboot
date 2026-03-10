import { prisma } from '../lib/prisma.js';
import type { DisponibilidadResult } from '@shared/types/inventario.js';

const HABITACIONES = ['Pewmafe', 'Luminar Mono', 'Luminar 2Amb', 'LG'];

/** Converts a Date (possibly UTC midnight) to local midnight for the same calendar date.
 *  e.g. 2026-10-01T00:00:00Z → local Oct 1 00:00 → 2026-10-01T03:00:00Z in UTC-3 */
function toLocalMidnight(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

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
  excludeBloqueoId?: string
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
 * Recalculate `disponible` in Inventario for a habitacion on given dates.
 * disponible = (reservas + bloqueadas) < cantidadUnidades
 */
export async function recalcDisponible(
  habitacion: string,
  dates: Date[],
  excludeBloqueoId?: string
) {
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

export async function checkAvailability(
  fechaEntrada: Date,
  fechaSalida: Date,
  habitacion?: string
): Promise<DisponibilidadResult[]> {
  const habitaciones = habitacion ? [habitacion] : HABITACIONES;
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

export async function getOccupiedDepartments(fechaEntrada: Date, fechaSalida: Date): Promise<string[]> {
  const occupied: string[] = [];
  const dates = dateRange(fechaEntrada, fechaSalida);

  for (const hab of HABITACIONES) {
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

export async function blockDates(habitacion: string, fechaEntrada: Date, fechaSalida: Date) {
  const dates = dateRange(fechaEntrada, fechaSalida);
  if (dates.length === 0) return;
  await recalcDisponible(habitacion, dates);
}

export async function releaseDates(habitacion: string, fechaEntrada: Date, fechaSalida: Date) {
  const dates = dateRange(fechaEntrada, fechaSalida);
  if (dates.length === 0) return;
  await recalcDisponible(habitacion, dates);
}

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

export async function updateInventarioEntry(id: string, data: { disponible?: boolean; precio?: number; notas?: string }) {
  return prisma.inventario.update({ where: { id }, data });
}

export async function releaseDatesIfNotReserved(
  habitacion: string,
  fechaInicio: Date,
  fechaFin: Date,
  excludeBloqueoId?: string
) {
  const dates = dateRange(fechaInicio, fechaFin);
  await recalcDisponible(habitacion, dates, excludeBloqueoId);
}
