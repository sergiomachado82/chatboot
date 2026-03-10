import { useQuery } from '@tanstack/react-query';
import { getComplejos, getComplejo } from '../api/complejoApi';

export function useComplejos() {
  return useQuery({
    queryKey: ['complejos'],
    queryFn: getComplejos,
    refetchInterval: 60_000,
  });
}

export function useComplejo(id: string | null) {
  return useQuery({
    queryKey: ['complejos', id],
    queryFn: () => getComplejo(id!),
    enabled: !!id,
  });
}
