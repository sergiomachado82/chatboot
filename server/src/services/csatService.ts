import { prisma } from '../lib/prisma.js';

export interface CsatMetrics {
  avgScore: number;
  totalRatings: number;
  distribution: Record<number, number>;
  nps: number;
}

/** Saves a CSAT rating for a conversation (1-5 scale). */
export async function saveCsatRating(conversacionId: string, puntuacion: number, comentario?: string): Promise<void> {
  await prisma.csatRating.upsert({
    where: { conversacionId },
    create: { conversacionId, puntuacion, comentario },
    update: { puntuacion, comentario },
  });
}

/** Calculates CSAT metrics (avg, distribution, NPS) for a date range. */
export async function getCsatMetrics(from: Date, to: Date): Promise<CsatMetrics> {
  const ratings = await prisma.csatRating.findMany({
    where: { creadoEn: { gte: from, lte: to } },
    select: { puntuacion: true },
  });

  const totalRatings = ratings.length;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const r of ratings) {
    sum += r.puntuacion;
    distribution[r.puntuacion] = (distribution[r.puntuacion] ?? 0) + 1;
  }

  const avgScore = totalRatings > 0 ? Math.round((sum / totalRatings) * 100) / 100 : 0;

  // NPS: promoters (4-5) minus detractors (1-2) as percentage
  const promoters = (distribution[4] ?? 0) + (distribution[5] ?? 0);
  const detractors = (distribution[1] ?? 0) + (distribution[2] ?? 0);
  const nps = totalRatings > 0 ? Math.round(((promoters - detractors) / totalRatings) * 100) : 0;

  return { avgScore, totalRatings, distribution, nps };
}
