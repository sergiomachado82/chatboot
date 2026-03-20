import { useQuery } from '@tanstack/react-query';
import { getEmails, getEmailStats } from '../api/emailApi';

interface EmailFilters {
  respondido?: boolean;
  complejoId?: string;
  esFormulario?: boolean;
  hasError?: boolean;
  search?: string;
}

export function useEmails(page = 1, filters: EmailFilters = {}) {
  return useQuery({
    queryKey: ['emails', page, filters],
    queryFn: () => getEmails(page, 20, filters),
    refetchInterval: 60_000,
  });
}

export function useEmailStats() {
  return useQuery({
    queryKey: ['emails', 'stats'],
    queryFn: () => getEmailStats(),
    refetchInterval: 60_000,
  });
}
