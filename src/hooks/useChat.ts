import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getMensajes } from '../api/conversacionApi';
import type { SearchMensajesParams } from '../api/conversacionApi';
import { useSocket } from './useSocket';
import type { Mensaje } from '@shared/types/mensaje';

const MAX_DEDUP_SIZE = 500;

export function useChat(conversacionId: string | null, searchParams?: SearchMensajesParams) {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const processedIds = useRef(new Set<string>());

  const isSearchActive = !!(searchParams?.search || searchParams?.dateFrom || searchParams?.dateTo);

  const query = useQuery({
    queryKey: ['mensajes', conversacionId, isSearchActive ? searchParams : null],
    queryFn: async () => {
      const result = await getMensajes(conversacionId!, isSearchActive ? searchParams : undefined);
      return result.mensajes;
    },
    enabled: !!conversacionId,
  });

  const isInitialLoadDone = !query.isLoading && query.data !== undefined;

  useEffect(() => {
    // Don't subscribe to real-time when search is active
    if (!socket || !conversacionId || !isInitialLoadDone || isSearchActive) return;

    socket.emit('join:conversacion', conversacionId);

    const handleNewMessage = (mensaje: Mensaje) => {
      if (mensaje.conversacionId !== conversacionId) return;

      // Dedup with Set
      if (processedIds.current.has(mensaje.id)) return;
      processedIds.current.add(mensaje.id);

      // Cap Set size
      if (processedIds.current.size > MAX_DEDUP_SIZE) {
        const ids = [...processedIds.current];
        processedIds.current = new Set(ids.slice(ids.length - MAX_DEDUP_SIZE));
      }

      // Only add real-time messages to the unfiltered cache
      queryClient.setQueryData<Mensaje[]>(['mensajes', conversacionId, null], (old) => {
        if (!old) return [mensaje];
        if (old.some((m) => m.id === mensaje.id)) return old;
        return [...old, mensaje];
      });
    };

    socket.on('mensaje:nuevo', handleNewMessage);

    return () => {
      socket.emit('leave:conversacion', conversacionId);
      socket.off('mensaje:nuevo', handleNewMessage);
    };
  }, [socket, conversacionId, queryClient, isInitialLoadDone, isSearchActive]);

  return { ...query, isSearchActive };
}
