import { prisma } from '../lib/prisma.js';
import type { ConversacionEstado } from '@shared/types/conversacion.js';
import { emitToAll } from './socketManager.js';

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

export async function updateConversacionEstado(id: string, estado: ConversacionEstado, agenteId?: string | null) {
  const conv = await prisma.conversacion.update({
    where: { id },
    data: {
      estado,
      ...(agenteId !== undefined ? { agenteId } : {}),
    },
    include: {
      huesped: { select: { id: true, nombre: true, waId: true, telefono: true } },
      agente: { select: { id: true, nombre: true } },
    },
  });
  emitToAll('conversacion:actualizada', conv);
  return conv;
}

export async function updateUltimoMensaje(id: string, contenido: string) {
  return prisma.conversacion.update({
    where: { id },
    data: { ultimoMensaje: contenido, ultimoMensajeEn: new Date() },
  });
}

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

export async function deleteConversaciones(ids: string[]) {
  // 1. Delete messages belonging to these conversations
  await prisma.mensaje.deleteMany({ where: { conversacionId: { in: ids } } });
  // 2. Unlink reservations (keep them, just remove the reference)
  await prisma.reserva.updateMany({ where: { conversacionId: { in: ids } }, data: { conversacionId: null } });
  // 3. Delete the conversations themselves
  const result = await prisma.conversacion.deleteMany({ where: { id: { in: ids } } });
  return result.count;
}

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
