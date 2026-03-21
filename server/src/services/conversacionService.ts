import { prisma } from '../lib/prisma.js';
import type { ConversacionEstado } from '@shared/types/conversacion.js';
import { emitToAll } from './socketManager.js';

/**
 * Finds an existing open conversation for the guest or creates a new one.
 * @param huespedId - The unique identifier of the guest
 * @returns The existing or newly created conversation record with related guest and agent data
 */
export async function findOrCreateConversacion(huespedId: string) {
  // Find an open conversation for this guest
  let conv = await prisma.conversacion.findFirst({
    where: {
      huespedId,
      estado: { not: 'cerrado' },
    },
    include: {
      huesped: { select: { id: true, nombre: true, waId: true, telefono: true } },
      agente: { select: { id: true, nombre: true } },
    },
  });

  if (!conv) {
    conv = await prisma.conversacion.create({
      data: { huespedId, estado: 'bot' },
      include: {
        huesped: { select: { id: true, nombre: true, waId: true, telefono: true } },
        agente: { select: { id: true, nombre: true } },
      },
    });
    emitToAll('conversacion:nueva', conv);
  }

  return conv;
}

/**
 * Updates the state of a conversation and optionally assigns an agent.
 * @param id - The conversation ID
 * @param estado - The new conversation state (e.g., 'bot', 'espera_humano', 'cerrado')
 * @param agenteId - Optional agent ID to assign or unassign from the conversation
 * @returns The updated conversation record with related guest and agent data
 */
export async function updateConversacionEstado(id: string, estado: ConversacionEstado, agenteId?: string | null) {
  const conv = await prisma.conversacion.update({
    where: { id },
    data: {
      estado,
      ...(agenteId !== undefined ? { agenteId } : {}),
      ...(estado === 'cerrado' ? { cerradaEn: new Date() } : {}),
    },
    include: {
      huesped: { select: { id: true, nombre: true, waId: true, telefono: true } },
      agente: { select: { id: true, nombre: true } },
    },
  });
  emitToAll('conversacion:actualizada', conv);
  return conv;
}

/**
 * Updates the last message preview and timestamp on a conversation.
 * @param id - The conversation ID
 * @param contenido - The content of the latest message
 * @returns The updated conversation record
 */
export async function updateUltimoMensaje(id: string, contenido: string) {
  return prisma.conversacion.update({
    where: { id },
    data: { ultimoMensaje: contenido, ultimoMensajeEn: new Date() },
  });
}

/**
 * Retrieves a single conversation by its ID, including guest, agent, and message count.
 * @param id - The conversation ID
 * @returns The conversation record with related data, or null if not found
 */
export async function getConversacionById(id: string) {
  return prisma.conversacion.findUnique({
    where: { id },
    include: {
      huesped: { select: { id: true, nombre: true, waId: true, telefono: true } },
      agente: { select: { id: true, nombre: true } },
      _count: { select: { mensajes: true } },
    },
  });
}

interface ListConversacionesParams {
  estado?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Deletes conversations and their associated messages, unlinking any related reservations.
 * @param ids - Array of conversation IDs to delete
 * @returns The number of conversations deleted
 */
export async function deleteConversaciones(ids: string[]) {
  // 1. Delete messages belonging to these conversations
  await prisma.mensaje.deleteMany({ where: { conversacionId: { in: ids } } });
  // 2. Unlink reservations (keep them, just remove the reference)
  await prisma.reserva.updateMany({ where: { conversacionId: { in: ids } }, data: { conversacionId: null } });
  // 3. Delete the conversations themselves
  const result = await prisma.conversacion.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}

/**
 * Lists conversations with optional filtering by state, search text, and date range.
 * @param params - Filter parameters including estado, search text, dateFrom, and dateTo
 * @returns An array of conversation records matching the filters, ordered by most recently updated
 */
export async function listConversaciones(params: ListConversacionesParams = {}) {
  const { estado, search, dateFrom, dateTo } = params;

  const where: Record<string, unknown> = {};
  if (estado) where.estado = estado;

  // Filter conversations that have at least one message matching criteria
  const mensajesFilter: Record<string, unknown>[] = [];
  if (search) {
    mensajesFilter.push({ contenido: { contains: search, mode: 'insensitive' } });
  }
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const nextDay = new Date(dateTo);
      nextDay.setDate(nextDay.getDate() + 1);
      dateFilter.lt = nextDay;
    }
    mensajesFilter.push({ creadoEn: dateFilter });
  }
  if (mensajesFilter.length > 0) {
    where.mensajes = { some: { AND: mensajesFilter } };
  }

  return prisma.conversacion.findMany({
    where,
    include: {
      huesped: { select: { id: true, nombre: true, waId: true, telefono: true } },
      agente: { select: { id: true, nombre: true } },
      _count: { select: { mensajes: true } },
    },
    orderBy: { actualizadoEn: 'desc' },
  });
}
