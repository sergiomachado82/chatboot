import { prisma } from '../lib/prisma.js';

export interface FunnelStage {
  label: string;
  count: number;
  rate: number;
  dropoff: number;
  dropoffPct: number;
}

/** Calculates the conversion funnel with dropoff between consecutive stages. */
export async function calculateFunnel(from: Date, to: Date): Promise<FunnelStage[]> {
  const where = { creadoEn: { gte: from, lte: to } };

  const iniciadas = await prisma.conversacion.count({ where });

  // Intermediate stage: conversations with more than 1 message (engagement)
  let conMasDe1Msg = 0;
  try {
    const result = await prisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(DISTINCT c.id)::bigint AS cnt
      FROM conversaciones c
      JOIN mensajes m ON m.conversacion_id = c.id
      WHERE c.creado_en >= ${from} AND c.creado_en <= ${to}
      GROUP BY c.id
      HAVING COUNT(m.id) > 1
    `;
    conMasDe1Msg = result.reduce((sum, r) => sum + Number(r.cnt), 0);
  } catch {
    // Fallback: use Prisma groupBy
    try {
      const grouped = await prisma.mensaje.groupBy({
        by: ['conversacionId'],
        where: { conversacion: { creadoEn: { gte: from, lte: to } } },
        _count: { id: true },
        having: { id: { _count: { gt: 1 } } },
      });
      conMasDe1Msg = grouped.length;
    } catch {
      conMasDe1Msg = iniciadas; // fallback
    }
  }

  const escaladas = await prisma.conversacion.count({ where: { ...where, escaladaEn: { not: null } } });
  const resueltasPorBot = await prisma.conversacion.count({
    where: { ...where, estado: 'cerrado', escaladaEn: null },
  });

  const reservaCreada = await prisma.reserva.count({ where });
  const reservaConfirmada = await prisma.reserva.count({
    where: { ...where, estado: 'confirmada' },
  });

  const rate = (count: number) => (iniciadas > 0 ? Math.round((count / iniciadas) * 10000) / 100 : 0);

  const rawStages = [
    { label: 'Conversaciones iniciadas', count: iniciadas, rate: 100 },
    { label: 'Conv. con +1 mensaje', count: conMasDe1Msg, rate: rate(conMasDe1Msg) },
    { label: 'Resueltas por bot', count: resueltasPorBot, rate: rate(resueltasPorBot) },
    { label: 'Escaladas a humano', count: escaladas, rate: rate(escaladas) },
    { label: 'Reserva creada', count: reservaCreada, rate: rate(reservaCreada) },
    { label: 'Reserva confirmada', count: reservaConfirmada, rate: rate(reservaConfirmada) },
  ];

  // Calculate dropoff between consecutive stages
  return rawStages.map((stage, i) => {
    const prev = i > 0 ? rawStages[i - 1].count : stage.count;
    const dropoff = prev - stage.count;
    const dropoffPct = prev > 0 ? Math.round((dropoff / prev) * 10000) / 100 : 0;
    return { ...stage, dropoff: Math.max(dropoff, 0), dropoffPct: Math.max(dropoffPct, 0) };
  });
}
