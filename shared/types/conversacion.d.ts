export type ConversacionEstado = 'bot' | 'espera_humano' | 'humano_activo' | 'cerrado';
export interface Conversacion {
  id: string;
  huespedId: string;
  agenteId: string | null;
  estado: ConversacionEstado;
  ultimoMensaje: string | null;
  ultimoMensajeEn: string | null;
  creadoEn: string;
  actualizadoEn: string;
  huesped?: {
    id: string;
    nombre: string | null;
    waId: string;
    telefono: string | null;
  };
  agente?: {
    id: string;
    nombre: string;
  } | null;
  _count?: {
    mensajes: number;
  };
}
//# sourceMappingURL=conversacion.d.ts.map
