import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getConversaciones } from '../api/conversacionApi';
import type { SearchConversacionesParams } from '../api/conversacionApi';
import { useSocket } from './useSocket';
import type { Conversacion } from '@shared/types/conversacion';

export function useConversaciones(params?: SearchConversacionesParams) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const isSearchActive = !!(params?.search || params?.dateFrom || params?.dateTo);

  const query = useQuery({
    queryKey: ['conversaciones', params ?? null],
    queryFn: () => getConversaciones(params),
    refetchInterval: isSearchActive ? false : 30_000,
  });

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (_conv: Conversacion) => {
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] });
    };
    const handleNew = (_conv: Conversacion) => {
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] });
    };

    socket.on('conversacion:actualizada', handleUpdate);
    socket.on('conversacion:nueva', handleNew);

    return () => {
      socket.off('conversacion:actualizada', handleUpdate);
      socket.off('conversacion:nueva', handleNew);
    };
  }, [socket, queryClient]);

  return { ...query, isSearchActive };
}
