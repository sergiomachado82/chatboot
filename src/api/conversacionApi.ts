import type { Conversacion } from '@shared/types/conversacion';
import type { Mensaje } from '@shared/types/mensaje';
import { apiFetch } from './apiClient';

export interface SearchConversacionesParams {
  estado?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getConversaciones(params?: SearchConversacionesParams): Promise<Conversacion[]> {
  const qs = new URLSearchParams();
  if (params?.estado) qs.set('estado', params.estado);
  if (params?.search) qs.set('search', params.search);
  if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params?.dateTo) qs.set('dateTo', params.dateTo);
  const str = qs.toString();
  return apiFetch<Conversacion[]>(`/conversaciones${str ? `?${str}` : ''}`);
}

export async function getConversacion(id: string): Promise<Conversacion> {
  return apiFetch<Conversacion>(`/conversaciones/${id}`);
}

interface MensajesResponse {
  mensajes: Mensaje[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SearchMensajesParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getMensajes(
  conversacionId: string,
  searchParams?: SearchMensajesParams,
): Promise<MensajesResponse> {
  const params = new URLSearchParams();
  if (searchParams?.search) {
    params.set('search', searchParams.search);
    params.set('limit', '200');
  }
  if (searchParams?.dateFrom) {
    params.set('dateFrom', searchParams.dateFrom);
    if (!searchParams.search) params.set('limit', '200');
  }
  if (searchParams?.dateTo) {
    params.set('dateTo', searchParams.dateTo);
    if (!searchParams.search) params.set('limit', '200');
  }
  const qs = params.toString();
  const url = `/conversaciones/${conversacionId}/mensajes${qs ? `?${qs}` : ''}`;
  return apiFetch<MensajesResponse>(url);
}

export async function tomarControl(conversacionId: string): Promise<Conversacion> {
  return apiFetch<Conversacion>(`/conversaciones/${conversacionId}/tomar-control`, { method: 'POST' });
}

export async function devolverBot(conversacionId: string): Promise<Conversacion> {
  return apiFetch<Conversacion>(`/conversaciones/${conversacionId}/devolver-bot`, { method: 'POST' });
}

export async function cerrarConversacion(conversacionId: string): Promise<Conversacion> {
  return apiFetch<Conversacion>(`/conversaciones/${conversacionId}/cerrar`, { method: 'POST' });
}

export async function deleteConversaciones(ids: string[]): Promise<{ deletedCount: number }> {
  return apiFetch<{ deletedCount: number }>('/conversaciones/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function enviarMensajeAgente(conversacionId: string, contenido: string): Promise<Mensaje> {
  return apiFetch<Mensaje>(`/conversaciones/${conversacionId}/mensajes`, {
    method: 'POST',
    body: JSON.stringify({ contenido }),
  });
}
