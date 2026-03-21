import { prisma } from '../lib/prisma.js';

export interface FunnelStage {
  label: string;
  count: number;
  rate: number;
}

export async function calculateFunnel(from: Date, to: Date): Promise<FunnelStage[]> {
  const where = { creadoEn: { gte: from, lte: to } };

  const iniciadas = await prisma.conversacion.count({ where });
  const escaladas = await prisma.conversacion.count({ where: { ...where, escaladaEn: { not: null } } });
  const resueltasPorBot = await prisma.conversacion.count({
    where: { ...where, estado: 'cerrado', escaladaEn: null },
  });

  const reservaCreada = await prisma.reserva.count({ where });
  const reservaConfirmada = await prisma.reserva.count({
    where: { ...where, estado: 'confirmada' },
  });

  const rate = (count: number) => (iniciadas > 0 ? Math.round((count / iniciadas) * 10000) / 100 : 0);

  return [
    { label: 'Conversaciones iniciadas', count: iniciadas, rate: 100 },
    { label: 'Resueltas por bot', count: resueltasPorBot, rate: rate(resueltasPorBot) },
    { label: 'Escaladas a humano', count: escaladas, rate: rate(escaladas) },
    { label: 'Reserva creada', count: reservaCreada, rate: rate(reservaCreada) },
    { label: 'Reserva confirmada', count: reservaConfirmada, rate: rate(reservaConfirmada) },
  ];
}
