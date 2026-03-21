import { apiFetch } from './apiClient';

export interface BotMetrics {
  tasaResolucionBot: number;
  tasaEscalacion: number;
  tiempoRespuestaPromMs: number | null;
  duracionPromedioMs: number | null;
  mensajesPorConversacion: number;
  razonesEscalacion: Record<string, number>;
}

export interface FunnelStage {
  label: string;
  count: number;
  rate: number;
}

export async function getMetrics(from: string, to: string): Promise<BotMetrics> {
  return apiFetch<BotMetrics>(`/dashboard/metrics?from=${from}&to=${to}`);
}

export async function getFunnel(from: string, to: string): Promise<FunnelStage[]> {
  return apiFetch<FunnelStage[]>(`/dashboard/funnel?from=${from}&to=${to}`);
}
