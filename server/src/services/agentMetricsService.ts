import { prisma } from '../lib/prisma.js';

export interface AgentMetric {
  agenteId: string;
  nombre: string;
  conversaciones: number;
  resueltas: number;
  tiempoRespuestaPromMs: number | null;
}

/** Calculates per-agent metrics: conversations handled, resolved, and avg response time. */
export async function getAgentMetrics(from: Date, to: Date): Promise<AgentMetric[]> {
  const agentes = await prisma.agente.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
  });

  const results: AgentMetric[] = [];

  for (const agente of agentes) {
    const where = {
      agenteId: agente.id,
      creadoEn: { gte: from, lte: to },
    };

    const conversaciones = await prisma.conversacion.count({ where });
    const resueltas = await prisma.conversacion.count({
      where: { ...where, estado: 'cerrado' },
    });

    let tiempoRespuestaPromMs: number | null = null;
    try {
      const result = await prisma.$queryRaw<{ avg_ms: number | null }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM (agent.creado_en - guest.creado_en)) * 1000) AS avg_ms
        FROM mensajes guest
        JOIN LATERAL (
          SELECT creado_en FROM mensajes
          WHERE conversacion_id = guest.conversacion_id
            AND origen = 'agente'
            AND creado_en > guest.creado_en
          ORDER BY creado_en ASC
          LIMIT 1
        ) agent ON true
        JOIN conversaciones c ON c.id = guest.conversacion_id
        WHERE guest.origen = 'huesped'
          AND c.agente_id = ${agente.id}
          AND guest.creado_en >= ${from}
          AND guest.creado_en <= ${to}
      `;
      tiempoRespuestaPromMs = result[0]?.avg_ms ? Math.round(result[0].avg_ms) : null;
    } catch {
      // Raw query may fail in test environments
    }

    if (conversaciones > 0) {
      results.push({
        agenteId: agente.id,
        nombre: agente.nombre,
        conversaciones,
        resueltas,
        tiempoRespuestaPromMs,
      });
    }
  }

  return results;
}
