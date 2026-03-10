import type { Huesped } from '@shared/types/huesped';
import { apiFetch } from './apiClient';

export async function getHuespedes(): Promise<Huesped[]> {
  return apiFetch<Huesped[]>('/huespedes');
}

export async function getHuesped(id: string) {
  return apiFetch<Huesped & { reservas: unknown[] }>(`/huespedes/${id}`);
}
