import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { notify } from '../../utils/notify';
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
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useState<SearchMensajesParams | undefined>();
  const { data: mensajes, isLoading, isSearchActive } = useChat(conversacion.id, searchParams);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [sending, setSending] = useState(false);

  // Reset search when switching conversations
  const prevConvId = useRef(conversacion.id);
  useEffect(() => {
    if (prevConvId.current !== conversacion.id) {
      setSearchParams(undefined);
      prevConvId.current = conversacion.id;
    }
  }, [conversacion.id]);

  const handleSearch = useCallback((params: SearchMensajesParams | undefined) => {
    setSearchParams(params);
  }, []);

  const canSend = conversacion.estado === 'humano_activo';

  async function handleSend(contenido: string) {
    setSending(true);
    try {
      await enviarMensajeAgente(conversacion.id, contenido);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('chat.errorSendMessage'));
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

      <div className="flex-1 bg-gray-50 dark:bg-gray-900" aria-live="polite">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">{isSearchActive ? t('chat.searching') : t('chat.loadingMessages')}</p>
          </div>
        )}
        {!isLoading && mensajes?.length === 0 && (
          <EmptyState title={isSearchActive ? t('chat.noResultsTitle') : t('chat.noMessagesTitle')} />
        )}
        {!isLoading && mensajes && mensajes.length > 0 && (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            className="p-4"
            data={mensajes}
            followOutput="smooth"
            initialTopMostItemIndex={mensajes.length - 1}
            itemContent={(_index, msg) => (
              <MessageBubble
                key={msg.id}
                mensaje={msg}
                highlightText={searchParams?.search}
                senderName={conversacion.huesped?.nombre ?? conversacion.huesped?.waId}
                senderIdentifier={conversacion.huesped?.waId ?? conversacion.id}
              />
            )}
          />
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        disabled={!canSend || sending}
        placeholder={
          sending ? t('chat.sending') : canSend ? t('chat.inputPlaceholder') : t('chat.takeControlPlaceholder')
        }
      />
    </div>
  );
}
