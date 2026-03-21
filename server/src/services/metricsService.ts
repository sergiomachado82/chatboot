import { prisma } from '../lib/prisma.js';

/** Bot performance metrics for a given date range. */
export interface BotMetrics {
  tasaResolucionBot: number;
  tasaEscalacion: number;
  tiempoRespuestaPromMs: number | null;
  duracionPromedioMs: number | null;
  mensajesPorConversacion: number;
  razonesEscalacion: Record<string, number>;
}

/** Computes bot performance metrics for the specified date range.
 * @param from - Start of the date range (inclusive).
 * @param to - End of the date range (inclusive).
 * @returns Aggregated bot metrics including resolution rate, escalation rate, response time, and more.
 */
export async function getMetrics(from: Date, to: Date): Promise<BotMetrics> {
  const where = { creadoEn: { gte: from, lte: to } };

  const total = await prisma.conversacion.count({ where });
  const cerradas = await prisma.conversacion.count({ where: { ...where, estado: 'cerrado' } });
  const escaladas = await prisma.conversacion.count({ where: { ...where, escaladaEn: { not: null } } });

  const tasaResolucionBot = total > 0 ? Math.round(((cerradas - escaladas) / total) * 100) / 100 : 0;
  const tasaEscalacion = total > 0 ? Math.round((escaladas / total) * 100) / 100 : 0;

  // Average response time: pairs of consecutive guest→bot messages
  let tiempoRespuestaPromMs: number | null = null;
  try {
    const result = await prisma.$queryRaw<{ avg_ms: number | null }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (bot.creado_en - guest.creado_en)) * 1000) AS avg_ms
      FROM mensajes guest
      JOIN LATERAL (
        SELECT creado_en FROM mensajes
        WHERE conversacion_id = guest.conversacion_id
          AND origen = 'bot'
          AND creado_en > guest.creado_en
        ORDER BY creado_en ASC
        LIMIT 1
      ) bot ON true
      WHERE guest.origen = 'huesped'
        AND guest.creado_en >= ${from}
        AND guest.creado_en <= ${to}
    `;
    tiempoRespuestaPromMs = result[0]?.avg_ms ? Math.round(result[0].avg_ms) : null;
  } catch {
    // Query might fail in test environments
  }

  // Average conversation duration
  let duracionPromedioMs: number | null = null;
  try {
    const durResult = await prisma.$queryRaw<{ avg_ms: number | null }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (cerrada_en - creado_en)) * 1000) AS avg_ms
      FROM conversaciones
      WHERE cerrada_en IS NOT NULL
        AND creado_en >= ${from}
        AND creado_en <= ${to}
    `;
    duracionPromedioMs = durResult[0]?.avg_ms ? Math.round(durResult[0].avg_ms) : null;
  } catch {
    // Query might fail in test environments
  }

  // Messages per conversation
  const msgCount = await prisma.mensaje.count({
    where: { conversacion: { creadoEn: { gte: from, lte: to } } },
  });
  const mensajesPorConversacion = total > 0 ? Math.round((msgCount / total) * 10) / 10 : 0;

  // Escalation reasons breakdown
  const escalaciones = await prisma.conversacion.groupBy({
    by: ['razonEscalacion'],
    where: { ...where, razonEscalacion: { not: null } },
    _count: true,
  });

  const razonesEscalacion: Record<string, number> = {};
  for (const e of escalaciones) {
    if (e.razonEscalacion) {
      razonesEscalacion[e.razonEscalacion] = e._count;
    }
  }

  return {
    tasaResolucionBot,
    tasaEscalacion,
    tiempoRespuestaPromMs,
    duracionPromedioMs,
    mensajesPorConversacion,
    razonesEscalacion,
  };
}
