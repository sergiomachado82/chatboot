import type { Inventario, DisponibilidadResult } from '@shared/types/inventario';
import { apiFetch } from './apiClient';

export async function getInventario(habitacion?: string, mes?: number, anio?: number): Promise<Inventario[]> {
  const params = new URLSearchParams();
  if (habitacion) params.set('habitacion', habitacion);
  if (mes !== undefined) params.set('mes', String(mes));
  if (anio !== undefined) params.set('anio', String(anio));
  const q = params.toString();
  return apiFetch<Inventario[]>(`/inventario${q ? `?${q}` : ''}`);
}

export async function checkDisponibilidad(
  fechaEntrada: string,
  fechaSalida: string,
  habitacion?: string,
): Promise<DisponibilidadResult[]> {
  const params = new URLSearchParams({ fechaEntrada, fechaSalida });
  if (habitacion) params.set('habitacion', habitacion);
  return apiFetch<DisponibilidadResult[]>(`/inventario/disponibilidad?${params}`);
}
