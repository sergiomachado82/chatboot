import type { Mensaje } from './mensaje.js';
import type { Conversacion } from './conversacion.js';

export interface ServerToClientEvents {
  'mensaje:nuevo': (mensaje: Mensaje) => void;
  'conversacion:actualizada': (conversacion: Conversacion) => void;
  'conversacion:nueva': (conversacion: Conversacion) => void;
  'agente:online': (agenteId: string) => void;
  'agente:offline': (agenteId: string) => void;
  'simulator:mensaje': (mensaje: { from: string; body: string; timestamp: string }) => void;
}

export interface ClientToServerEvents {
  'join:conversacion': (conversacionId: string) => void;
  'leave:conversacion': (conversacionId: string) => void;
  'agente:status': (online: boolean) => void;
}
