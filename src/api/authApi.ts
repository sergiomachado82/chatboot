import type { LoginResponse } from '@shared/types/agente';
import { apiFetch } from './apiClient';
import { disconnectSocket } from '../hooks/useSocket';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('token', data.token);
  localStorage.setItem('agente', JSON.stringify(data.agente));
  return data;
}

export function logout(): void {
  disconnectSocket();
  localStorage.removeItem('token');
  localStorage.removeItem('agente');
  window.location.reload();
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}

export function getStoredAgente() {
  const raw = localStorage.getItem('agente');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
