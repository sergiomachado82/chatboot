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
  dropoff: number;
  dropoffPct: number;
}

export interface IntentAnalytics {
  distribution: Array<{ intent: string; count: number; pct: number }>;
  avgConfidence: number;
  lowConfidenceCount: number;
  total: number;
}

export interface CsatMetrics {
  avgScore: number;
  totalRatings: number;
  distribution: Record<number, number>;
  nps: number;
}

export interface TrendPoint {
  date: string;
  conversations: number;
  escalations: number;
  resolutions: number;
  reservations: number;
}

export interface AgentMetric {
  agenteId: string;
  nombre: string;
  conversaciones: number;
  resueltas: number;
  tiempoRespuestaPromMs: number | null;
}

export async function getMetrics(from: string, to: string): Promise<BotMetrics> {
  return apiFetch<BotMetrics>(`/dashboard/metrics?from=${from}&to=${to}`);
}

export async function getFunnel(from: string, to: string): Promise<FunnelStage[]> {
  return apiFetch<FunnelStage[]>(`/dashboard/funnel?from=${from}&to=${to}`);
}

export async function getIntentAnalytics(from: string, to: string): Promise<IntentAnalytics> {
  return apiFetch<IntentAnalytics>(`/dashboard/intents?from=${from}&to=${to}`);
}

export async function getCsatMetrics(from: string, to: string): Promise<CsatMetrics> {
  return apiFetch<CsatMetrics>(`/dashboard/csat?from=${from}&to=${to}`);
}

export async function getTrends(from: string, to: string): Promise<TrendPoint[]> {
  return apiFetch<TrendPoint[]>(`/dashboard/trends?from=${from}&to=${to}`);
}

export async function getAgentMetrics(from: string, to: string): Promise<AgentMetric[]> {
  return apiFetch<AgentMetric[]>(`/dashboard/agent-metrics?from=${from}&to=${to}`);
}
