export type ReservaEstado = 'pre_reserva' | 'confirmada' | 'cancelada' | 'completada';

export interface Reserva {
  id: string;
  huespedId: string | null;
  conversacionId: string | null;
  nombreHuesped: string | null;
  telefonoHuesped: string | null;
  fechaEntrada: string;
  fechaSalida: string;
  numHuespedes: number;
  habitacion: string | null;
  tarifaNoche: number | null;
  precioTotal: number;
  montoReserva: number | null;
  saldo: number | null;
  estado: ReservaEstado;
  origenReserva: string | null;
  nroFactura: string | null;
  importeUsd: number | null;
  notas: string | null;
  creadoEn: string;
  actualizadoEn: string;
  huesped?: {
    id: string;
    nombre: string | null;
    waId: string;
    telefono: string | null;
  };
}

export interface CrearReservaRequest {
  huespedId: string;
  conversacionId?: string;
  fechaEntrada: string;
  fechaSalida: string;
  numHuespedes: number;
  habitacion?: string;
  notas?: string;
}

export interface CrearReservaManualRequest {
  nombreHuesped: string;
  telefonoHuesped?: string;
  fechaEntrada: string;
  fechaSalida: string;
  numHuespedes: number;
  habitacion?: string;
  tarifaNoche?: number;
  precioTotal?: number;
  montoReserva?: number;
  saldo?: number;
  estado?: ReservaEstado;
  origenReserva?: string;
  nroFactura?: string;
  importeUsd?: number;
  notas?: string;
}

export interface UpdateReservaRequest {
  nombreHuesped?: string;
  telefonoHuesped?: string;
  fechaEntrada?: string;
  fechaSalida?: string;
  numHuespedes?: number;
  habitacion?: string;
  tarifaNoche?: number | null;
  precioTotal?: number;
  montoReserva?: number | null;
  saldo?: number | null;
  estado?: ReservaEstado;
  origenReserva?: string | null;
  nroFactura?: string | null;
  importeUsd?: number | null;
  notas?: string | null;
}
