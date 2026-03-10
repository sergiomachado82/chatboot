import { useRef, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useChat } from '../../hooks/useChat';
import { enviarMensajeAgente } from '../../api/conversacionApi';
import type { SearchMensajesParams } from '../../api/conversacionApi';
import type { Conversacion } from '@shared/types/conversacion';
import ChatHeader from './ChatHeader';
import ChatSearchBar from './ChatSearchBar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import EmptyState from '../ui/EmptyState';

interface ChatWindowProps {
  conversacion: Conversacion;
  onConversacionUpdate?: (conv: Conversacion) => void;
}

export default function ChatWindow({ conversacion, onConversacionUpdate }: ChatWindowProps) {
  const [searchParams, setSearchParams] = useState<SearchMensajesParams | undefined>();
  const { data: mensajes, isLoading, isSearchActive } = useChat(conversacion.id, searchParams);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

  // Reset search when switching conversations
  const prevConvId = useRef(conversacion.id);
  useEffect(() => {
    if (prevConvId.current !== conversacion.id) {
      setSearchParams(undefined);
      prevConvId.current = conversacion.id;
    }
  }, [conversacion.id]);

  // Auto-scroll only when not searching
  useEffect(() => {
    if (!isSearchActive) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, isSearchActive]);

  const handleSearch = useCallback((params: SearchMensajesParams | undefined) => {
    setSearchParams(params);
  }, []);

  const canSend = conversacion.estado === 'humano_activo';

  async function handleSend(contenido: string) {
    setSending(true);
    try {
      await enviarMensajeAgente(conversacion.id, contenido);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversacion={conversacion} onConversacionUpdate={onConversacionUpdate} />
      <ChatSearchBar
        onSearch={handleSearch}
        resultCount={isSearchActive ? (mensajes?.length ?? 0) : undefined}
        isLoading={isSearchActive && isLoading}
      />

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">{isSearchActive ? 'Buscando...' : 'Cargando mensajes...'}</p>
          </div>
        )}
        {!isLoading && mensajes?.length === 0 && (
          <EmptyState title={isSearchActive ? 'Sin resultados' : 'Sin mensajes'} />
        )}
        {mensajes?.map((msg) => (
          <MessageBubble key={msg.id} mensaje={msg} highlightText={searchParams?.search} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={!canSend || sending}
        placeholder={sending ? 'Enviando...' : canSend ? 'Escribe un mensaje...' : 'Toma el control para responder'}
      />
    </div>
  );
}
