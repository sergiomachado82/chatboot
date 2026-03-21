import { apiFetch } from './apiClient';

export interface DashboardStats {
  conversaciones: Record<string, number>;
  reservas: Record<string, number>;
  emails: {
    hoy: number;
    respondidos: number;
    errores: number;
    formularios: number;
  };
  ocupacion: { fecha: string; reservas: number; capacidad: number }[];
  recientes: {
    conversaciones: {
      id: string;
      estado: string;
      ultimoMensaje: string | null;
      ultimoMensajeEn: string | null;
      huesped: { nombre: string | null; waId: string } | null;
      agente: { nombre: string } | null;
    }[];
    reservas: {
      id: string;
      nombreHuesped: string | null;
      habitacion: string | null;
      fechaEntrada: string;
      fechaSalida: string;
      estado: string;
      huesped: { nombre: string | null } | null;
    }[];
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/dashboard/stats');
}
