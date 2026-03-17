import type {
  Complejo,
  Tarifa,
  TarifaEspecial,
  Bloqueo,
  MediaFile,
  IcalFeed,
  CrearComplejoRequest,
  UpdateComplejoRequest,
  UpsertTarifaRequest,
  CrearTarifaEspecialRequest,
  UpdateTarifaEspecialRequest,
  CrearBloqueoRequest,
  AddMediaRequest,
  CrearIcalFeedRequest,
} from '@shared/types/complejo';
import { apiFetch } from './apiClient';

export async function getComplejos(): Promise<Complejo[]> {
  return apiFetch<Complejo[]>('/complejos');
}

export async function getComplejo(id: string): Promise<Complejo> {
  return apiFetch<Complejo>(`/complejos/${id}`);
}

export async function createComplejo(data: CrearComplejoRequest): Promise<Complejo> {
  return apiFetch<Complejo>('/complejos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateComplejo(id: string, data: UpdateComplejoRequest): Promise<Complejo> {
  return apiFetch<Complejo>(`/complejos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteComplejo(id: string): Promise<Complejo> {
  return apiFetch<Complejo>(`/complejos/${id}`, { method: 'DELETE' });
}

export async function upsertTarifa(complejoId: string, data: UpsertTarifaRequest): Promise<Tarifa> {
  return apiFetch<Tarifa>(`/complejos/${complejoId}/tarifas`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Tarifas Especiales
export async function getTarifasEspeciales(complejoId: string): Promise<TarifaEspecial[]> {
  return apiFetch<TarifaEspecial[]>(`/complejos/${complejoId}/tarifas-especiales`);
}

export async function createTarifaEspecial(complejoId: string, data: CrearTarifaEspecialRequest): Promise<TarifaEspecial> {
  return apiFetch<TarifaEspecial>(`/complejos/${complejoId}/tarifas-especiales`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTarifaEspecialApi(complejoId: string, teId: string, data: UpdateTarifaEspecialRequest): Promise<TarifaEspecial> {
  return apiFetch<TarifaEspecial>(`/complejos/${complejoId}/tarifas-especiales/${teId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTarifaEspecialApi(complejoId: string, teId: string): Promise<void> {
  await apiFetch(`/complejos/${complejoId}/tarifas-especiales/${teId}`, { method: 'DELETE' });
}

export async function addMedia(complejoId: string, data: AddMediaRequest): Promise<MediaFile> {
  return apiFetch<MediaFile>(`/complejos/${complejoId}/media`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeMedia(complejoId: string, mediaId: string): Promise<void> {
  await apiFetch(`/complejos/${complejoId}/media/${mediaId}`, { method: 'DELETE' });
}

export async function reorderMedia(complejoId: string, orderedIds: string[]): Promise<MediaFile[]> {
  return apiFetch<MediaFile[]>(`/complejos/${complejoId}/media/orden`, {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  });
}

// Bloqueos
export async function createBloqueoApi(complejoId: string, data: CrearBloqueoRequest): Promise<Bloqueo> {
  return apiFetch<Bloqueo>(`/complejos/${complejoId}/bloqueos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteBloqueoApi(complejoId: string, bloqueoId: string): Promise<void> {
  await apiFetch(`/complejos/${complejoId}/bloqueos/${bloqueoId}`, { method: 'DELETE' });
}

// iCal Feeds
export async function createIcalFeed(complejoId: string, data: CrearIcalFeedRequest): Promise<IcalFeed> {
  return apiFetch<IcalFeed>(`/complejos/${complejoId}/ical-feeds`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteIcalFeed(complejoId: string, feedId: string): Promise<void> {
  await apiFetch(`/complejos/${complejoId}/ical-feeds/${feedId}`, { method: 'DELETE' });
}
