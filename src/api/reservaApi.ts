import type { Reserva, CrearReservaManualRequest, UpdateReservaRequest } from '@shared/types/reserva';
import { apiFetch } from './apiClient';

export interface ReservaPage {
  reservas: Reserva[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getReservas(estado?: string, page = 1, pageSize = 20): Promise<ReservaPage> {
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return apiFetch<ReservaPage>(`/reservas?${params}`);
}

export async function getReserva(id: string): Promise<Reserva> {
  return apiFetch<Reserva>(`/reservas/${id}`);
}

export async function createReservaManual(data: CrearReservaManualRequest): Promise<Reserva> {
  return apiFetch<Reserva>('/reservas/manual', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReserva(id: string, data: UpdateReservaRequest): Promise<Reserva> {
  return apiFetch<Reserva>(`/reservas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateReservaEstado(id: string, estado: string): Promise<Reserva> {
  return apiFetch<Reserva>(`/reservas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

export async function deleteReserva(id: string): Promise<void> {
  await apiFetch(`/reservas/${id}`, { method: 'DELETE' });
}

export async function getReservasByDateRange(from: string, to: string): Promise<Reserva[]> {
  return apiFetch<Reserva[]>(`/reservas?from=${from}&to=${to}`);
}
