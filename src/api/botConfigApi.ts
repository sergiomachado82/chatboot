import { apiFetch } from './apiClient';

export interface BotConfig {
  id: string;
  nombreAgente: string;
  ubicacion: string;
  tono: string;
  idioma: string;
  usarEmojis: boolean;
  longitudRespuesta: string;
  autoPreReserva: boolean;
  modoEnvioFotos: string;
  escalarSiQueja: boolean;
  escalarSiPago: boolean;
  mensajeBienvenida: string;
  mensajeDespedida: string;
  mensajeFueraHorario: string;
  mensajeEsperaHumano: string;
  horarioInicio: string | null;
  horarioFin: string | null;
  telefonoContacto: string;
}

export type BotConfigUpdate = Partial<Omit<BotConfig, 'id'>>;

export function getBotConfig() {
  return apiFetch<BotConfig>('/bot/config');
}

export function updateBotConfig(data: BotConfigUpdate) {
  return apiFetch<BotConfig>('/bot/config', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getPublicLogo(): Promise<string | null> {
  const res = await fetch('/api/public/logo');
  const data = await res.json();
  return data.logo ?? null;
}

export function uploadLogo(logo: string) {
  return apiFetch<{ message: string }>('/bot/logo', {
    method: 'POST',
    body: JSON.stringify({ logo }),
  });
}

export function deleteLogo() {
  return apiFetch<{ message: string }>('/bot/logo', {
    method: 'DELETE',
  });
}
