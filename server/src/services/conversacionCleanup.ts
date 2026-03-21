import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { emitToAll } from './socketManager.js';
import { createQueue } from '../lib/queue.js';
import type Bull from 'bull';

const INACTIVITY_HOURS = 48;

let queue: Bull.Queue | null = null;

/**
 * Close conversations that have been inactive for more than 48 hours.
 * Only affects conversations in 'bot' or 'espera_humano' state.
 */
export async function closeInactiveConversations(): Promise<number> {
  const cutoff = new Date(Date.now() - INACTIVITY_HOURS * 60 * 60 * 1000);

  const stale = await prisma.conversacion.findMany({
    where: {
      estado: { in: ['bot', 'espera_humano'] },
      OR: [{ ultimoMensajeEn: { lt: cutoff } }, { ultimoMensajeEn: null, actualizadoEn: { lt: cutoff } }],
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
      data: { estado: 'cerrado', cerradaEn: new Date() },
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
  queue = createQueue('conversation-cleanup');

  queue.process(async () => {
    await closeInactiveConversations();
  });

  queue.add({}, { repeat: { every: 3_600_000 } }); // every hour

  logger.info(`Conversation cleanup job started (Bull queue, every 60 min, threshold: ${INACTIVITY_HOURS}h)`);
}

export function stopCleanupJob() {
  // Queue is closed via closeAllQueues()
  queue = null;
}
