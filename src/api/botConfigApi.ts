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
