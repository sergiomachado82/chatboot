import { prisma } from '../lib/prisma.js';
import type { MensajeTipo, MensajeDireccion, MensajeOrigen } from '@shared/types/mensaje.js';
import { emitToConversacion } from './socketManager.js';
import { updateUltimoMensaje } from './conversacionService.js';

interface CreateMensajeParams {
  conversacionId: string;
  tipo?: MensajeTipo;
  direccion: MensajeDireccion;
  origen: MensajeOrigen;
  contenido: string;
  metadata?: Record<string, unknown>;
  waMessageId?: string;
}

export async function createMensaje(params: CreateMensajeParams) {
  const mensaje = await prisma.mensaje.create({
    data: {
      conversacionId: params.conversacionId,
      tipo: params.tipo ?? 'text',
      direccion: params.direccion,
      origen: params.origen,
      contenido: params.contenido,
      metadata: params.metadata ?? undefined,
      waMessageId: params.waMessageId ?? undefined,
    },
  });

  // Update conversation's last message
  await updateUltimoMensaje(params.conversacionId, params.contenido);

  // Emit to connected agents
  emitToConversacion(params.conversacionId, 'mensaje:nuevo', mensaje);

  return mensaje;
}

interface GetByConversacionParams {
  limit?: number;
  before?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getByConversacion(conversacionId: string, params: GetByConversacionParams = {}) {
  const { limit = 50, before, search, dateFrom, dateTo } = params;

  const creadoEn: Record<string, Date> = {};
  if (before) creadoEn.lt = new Date(before);
  if (dateFrom) creadoEn.gte = new Date(dateFrom);
  if (dateTo) {
    const nextDay = new Date(dateTo);
    nextDay.setDate(nextDay.getDate() + 1);
    // If `before` cursor is earlier, keep it; otherwise use end-of-dateTo
    if (!creadoEn.lt || nextDay < creadoEn.lt) creadoEn.lt = nextDay;
  }

  const mensajes = await prisma.mensaje.findMany({
    where: {
      conversacionId,
      ...(Object.keys(creadoEn).length > 0 ? { creadoEn } : {}),
      ...(search ? { contenido: { contains: search, mode: 'insensitive' as const } } : {}),
    },
    orderBy: { creadoEn: 'desc' },
    take: limit + 1,
  });

  const hasMore = mensajes.length > limit;
  const data = hasMore ? mensajes.slice(0, limit) : mensajes;
  data.reverse(); // return in chronological order

  return {
    mensajes: data,
    nextCursor: hasMore && data.length > 0 ? data[0].creadoEn.toISOString() : null,
    hasMore,
  };
}
