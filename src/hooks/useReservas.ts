import { useQuery } from '@tanstack/react-query';
import { getReservas, getReservasByDateRange } from '../api/reservaApi';

export function useReservas(estado?: string, page = 1) {
  return useQuery({
    queryKey: ['reservas', estado, page],
    queryFn: () => getReservas(estado, page),
    refetchInterval: 60_000,
  });
}

export function useReservasCalendar(from: string, to: string) {
  return useQuery({
    queryKey: ['reservas', 'calendar', from, to],
    queryFn: () => getReservasByDateRange(from, to),
    refetchInterval: 60_000,
  });
}
