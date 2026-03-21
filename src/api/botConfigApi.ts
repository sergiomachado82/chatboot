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
  titularesVerificados: string[];
  reglasPersonalizadas: string[];
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

export interface BotConfigAuditEntry {
  id: string;
  agenteId: string | null;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  creadoEn: string;
}

export function getBotConfigHistory(limit = 50) {
  return apiFetch<BotConfigAuditEntry[]>(`/bot/config/history?limit=${limit}`);
}

export interface IntegrationLogEntry {
  id: string;
  servicio: string;
  nivel: string;
  mensaje: string;
  detalle: string | null;
  creadoEn: string;
}

export function getIntegrationLogs(servicio?: string, limit = 100) {
  const params = new URLSearchParams();
  if (servicio) params.set('servicio', servicio);
  params.set('limit', String(limit));
  return apiFetch<IntegrationLogEntry[]>(`/integration-logs?${params}`);
}
