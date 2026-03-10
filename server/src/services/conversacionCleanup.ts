import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { emitToAll } from './socketManager.js';

const INACTIVITY_HOURS = 48;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Close conversations that have been inactive for more than 48 hours.
 * Only affects conversations in 'bot' or 'espera_humano' state.
 */
export async function closeInactiveConversations(): Promise<number> {
  const cutoff = new Date(Date.now() - INACTIVITY_HOURS * 60 * 60 * 1000);

  const stale = await prisma.conversacion.findMany({
    where: {
      estado: { in: ['bot', 'espera_humano'] },
      OR: [
        { ultimoMensajeEn: { lt: cutoff } },
        { ultimoMensajeEn: null, actualizadoEn: { lt: cutoff } },
      ],
    },
    select: { id: true, estado: true },
  });

  if (stale.length === 0) return 0;

  for (const conv of stale) {
    await prisma.mensaje.create({
      data: {
        conversacionId: conv.id,
        tipo: 'system',
        direccion: 'saliente',
        origen: 'sistema',
        contenido: 'Conversacion cerrada automaticamente por inactividad (48h)',
      },
    });

    const updated = await prisma.conversacion.update({
      where: { id: conv.id },
      data: { estado: 'cerrado' },
      include: {
        huesped: { select: { id: true, nombre: true, waId: true, telefono: true } },
        agente: { select: { id: true, nombre: true } },
      },
    });

    emitToAll('conversacion:actualizada', updated);
  }

  logger.info({ count: stale.length }, 'Closed inactive conversations');
  return stale.length;
}

export function startCleanupJob() {
  // Run once on startup
  closeInactiveConversations().catch((err) => {
    logger.error({ err }, 'Error in conversation cleanup');
  });

  // Then run periodically
  intervalId = setInterval(() => {
    closeInactiveConversations().catch((err) => {
      logger.error({ err }, 'Error in conversation cleanup');
    });
  }, CHECK_INTERVAL_MS);

  logger.info(`Conversation cleanup job started (every ${CHECK_INTERVAL_MS / 1000 / 60} min, threshold: ${INACTIVITY_HOURS}h)`);
}

export function stopCleanupJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
