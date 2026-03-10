import { prisma } from '../lib/prisma.js';

export function getSeason(date: Date): 'baja' | 'media' | 'alta' {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  // Alta: segunda quincena dic (15-31), enero (0), febrero (1)
  if ((month === 11 && day >= 15) || month === 0 || month === 1) return 'alta';
  // Media: julio (6), primera quincena dic (11, day < 15)
  if (month === 6 || (month === 11 && day < 15)) return 'media';
  // Baja: marzo-junio (2-5), agosto-noviembre (7-10)
  return 'baja';
}

export async function getSeasonalPrice(complejoId: string, date: Date): Promise<number | null> {
  const season = getSeason(date);
  const tarifa = await prisma.tarifa.findUnique({
    where: { complejoId_temporada: { complejoId, temporada: season } },
  });
  return tarifa ? Number(tarifa.precioNoche) : null;
}

/** Converts a Date (possibly UTC midnight) to local midnight for the same calendar date */
function toLocalMidnight(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function dateRange(start: Date, end: Date): Date[] {
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
 * Syncs a TarifaEspecial price to Inventario entries for all units of a complejo.
 */
export async function syncTarifaEspecialToInventario(
  complejoId: string,
  fechaInicio: Date,
  fechaFin: Date,
  precio: number
) {
  const complejo = await prisma.complejo.findUnique({
    where: { id: complejoId },
    select: { nombre: true },
  });
  if (!complejo) return;

  const dates = dateRange(fechaInicio, fechaFin);
  if (dates.length === 0) return;

  await prisma.inventario.updateMany({
    where: {
      habitacion: complejo.nombre,
      fecha: { in: dates },
    },
    data: { precio },
  });
}

/**
 * Restores seasonal prices for a date range, respecting other active TarifaEspecial overrides.
 */
export async function restoreSeasonalPrices(
  complejoId: string,
  fechaInicio: Date,
  fechaFin: Date
) {
  const complejo = await prisma.complejo.findUnique({
    where: { id: complejoId },
    select: { nombre: true },
  });
  if (!complejo) return;

  // Get other active overrides that might cover dates in this range
  const otherOverrides = await prisma.tarifaEspecial.findMany({
    where: {
      complejoId,
      activo: true,
      fechaInicio: { lt: fechaFin },
      fechaFin: { gt: fechaInicio },
    },
  });

  const dates = dateRange(fechaInicio, fechaFin);

  for (const date of dates) {
    // Check if another active override covers this date
    const coveringOverride = otherOverrides.find(
      (o) => date >= new Date(o.fechaInicio) && date < new Date(o.fechaFin)
    );

    let precio: number;
    if (coveringOverride) {
      precio = Number(coveringOverride.precioNoche);
    } else {
      const seasonalPrice = await getSeasonalPrice(complejoId, date);
      precio = seasonalPrice ?? 0;
    }

    await prisma.inventario.updateMany({
      where: {
        habitacion: complejo.nombre,
        fecha: date,
      },
      data: { precio },
    });
  }
}
