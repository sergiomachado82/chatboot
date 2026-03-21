export interface Inventario {
  id: string;
  fecha: string;
  habitacion: string;
  disponible: boolean;
  precio: number;
  notas: string | null;
}
export interface DisponibilidadResult {
  disponible: boolean;
  fechaEntrada: string;
  fechaSalida: string;
  habitacion: string;
  precioTotal: number;
  precioPorNoche: number[];
  noches: number;
}
export interface ConsultaDisponibilidad {
  fechaEntrada: string;
  fechaSalida: string;
  habitacion?: string;
}
//# sourceMappingURL=inventario.d.ts.map
