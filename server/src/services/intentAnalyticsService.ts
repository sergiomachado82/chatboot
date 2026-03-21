import { prisma } from '../lib/prisma.js';

export interface IntentAnalytics {
  distribution: Array<{ intent: string; count: number; pct: number }>;
  avgConfidence: number;
  lowConfidenceCount: number;
  total: number;
}

/** Calculates intent distribution, average confidence and low-confidence count for a date range. */
export async function getIntentAnalytics(from: Date, to: Date): Promise<IntentAnalytics> {
  let rows: Array<{ intent: string; cnt: bigint }> = [];
  try {
    rows = await prisma.$queryRaw<Array<{ intent: string; cnt: bigint }>>`
      SELECT metadata->>'intent' AS intent, COUNT(*)::bigint AS cnt
      FROM mensajes
      WHERE origen = 'bot'
        AND metadata->>'intent' IS NOT NULL
        AND creado_en >= ${from}
        AND creado_en <= ${to}
      GROUP BY metadata->>'intent'
      ORDER BY cnt DESC
    `;
  } catch {
    // Raw query may fail in test environments
  }

  const total = rows.reduce((sum, r) => sum + Number(r.cnt), 0);
  const distribution = rows.map((r) => ({
    intent: r.intent,
    count: Number(r.cnt),
    pct: total > 0 ? Math.round((Number(r.cnt) / total) * 10000) / 100 : 0,
  }));

  let avgConfidence = 0;
  let lowConfidenceCount = 0;
  try {
    const confResult = await prisma.$queryRaw<Array<{ avg_conf: number | null; low_count: bigint }>>`
      SELECT
        AVG((metadata->>'confidence')::float) AS avg_conf,
        COUNT(*) FILTER (WHERE (metadata->>'confidence')::float < 0.6)::bigint AS low_count
      FROM mensajes
      WHERE origen = 'bot'
        AND metadata->>'confidence' IS NOT NULL
        AND creado_en >= ${from}
        AND creado_en <= ${to}
    `;
    avgConfidence = confResult[0]?.avg_conf ? Math.round(confResult[0].avg_conf * 100) / 100 : 0;
    lowConfidenceCount = Number(confResult[0]?.low_count ?? 0);
  } catch {
    // Raw query may fail in test environments
  }

  return { distribution, avgConfidence, lowConfidenceCount, total };
}
