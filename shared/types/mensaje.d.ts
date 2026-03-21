export type MensajeTipo = 'text' | 'image' | 'audio' | 'document' | 'location' | 'template' | 'system';
export type MensajeDireccion = 'entrante' | 'saliente';
export type MensajeOrigen = 'huesped' | 'bot' | 'agente' | 'sistema';
export interface Mensaje {
  id: string;
  conversacionId: string;
  tipo: MensajeTipo;
  direccion: MensajeDireccion;
  origen: MensajeOrigen;
  contenido: string;
  metadata: Record<string, unknown> | null;
  waMessageId: string | null;
  creadoEn: string;
}
//# sourceMappingURL=mensaje.d.ts.map
