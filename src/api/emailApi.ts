import type { EmailPage, EmailStats, EmailProcesado } from '@shared/types/email';
import { apiFetch } from './apiClient';

interface EmailFilters {
  respondido?: boolean;
  complejoId?: string;
  esFormulario?: boolean;
  hasError?: boolean;
  search?: string;
}

export async function getEmails(page = 1, pageSize = 20, filters: EmailFilters = {}): Promise<EmailPage> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (filters.respondido !== undefined) params.set('respondido', String(filters.respondido));
  if (filters.complejoId) params.set('complejoId', filters.complejoId);
  if (filters.esFormulario !== undefined) params.set('esFormulario', String(filters.esFormulario));
  if (filters.hasError) params.set('hasError', 'true');
  if (filters.search) params.set('search', filters.search);
  return apiFetch<EmailPage>(`/emails?${params}`);
}

export async function getEmailStats(): Promise<EmailStats> {
  return apiFetch<EmailStats>('/emails/stats');
}

export async function getEmail(id: string): Promise<EmailProcesado> {
  return apiFetch<EmailProcesado>(`/emails/${id}`);
}
