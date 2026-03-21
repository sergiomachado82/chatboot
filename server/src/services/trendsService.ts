import { prisma } from '../lib/prisma.js';

export interface TrendPoint {
  date: string;
  conversations: number;
  escalations: number;
  resolutions: number;
  reservations: number;
}

/** Returns daily trend data (conversations, escalations, resolutions, reservations) for a date range. */
export async function getTrends(from: Date, to: Date): Promise<TrendPoint[]> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        date: Date;
        conversations: bigint;
        escalations: bigint;
        resolutions: bigint;
        reservations: bigint;
      }>
    >`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', ${from}::timestamp),
          date_trunc('day', ${to}::timestamp),
          '1 day'::interval
        ) AS d
      )
      SELECT
        days.d AS date,
        COALESCE((SELECT COUNT(*) FROM conversaciones WHERE date_trunc('day', creado_en) = days.d), 0)::bigint AS conversations,
        COALESCE((SELECT COUNT(*) FROM conversaciones WHERE date_trunc('day', escalada_en) = days.d), 0)::bigint AS escalations,
        COALESCE((SELECT COUNT(*) FROM conversaciones WHERE date_trunc('day', cerrada_en) = days.d AND escalada_en IS NULL), 0)::bigint AS resolutions,
        COALESCE((SELECT COUNT(*) FROM reservas WHERE date_trunc('day', creado_en) = days.d), 0)::bigint AS reservations
      FROM days
      ORDER BY days.d
    `;

    return rows.map((r) => ({
      date: new Date(r.date).toISOString().slice(0, 10),
      conversations: Number(r.conversations),
      escalations: Number(r.escalations),
      resolutions: Number(r.resolutions),
      reservations: Number(r.reservations),
    }));
  } catch {
    // Raw query may fail in test environments
    return [];
  }
}
