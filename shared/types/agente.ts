export type AgenteRol = 'admin' | 'agente';

export interface Agente {
  id: string;
  nombre: string;
  email: string;
  rol: AgenteRol;
  activo: boolean;
  online: boolean;
  creadoEn: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  agente: Agente;
}
