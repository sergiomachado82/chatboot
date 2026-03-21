import { useEffect } from 'react';
import { useConversaciones } from './useConversaciones';

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  chat: 'Chat',
  reservas: 'Reservas',
  complejos: 'Complejos',
  whatsapp: 'WhatsApp',
  bot: 'Bot',
  emails: 'Emails',
};

export function useDocumentTitle(view: string) {
  const { data: conversaciones } = useConversaciones();

  useEffect(() => {
    const pendientes = conversaciones?.filter((c) => c.estado === 'espera_humano').length ?? 0;
    const label = VIEW_LABELS[view] ?? view;
    const prefix = pendientes > 0 ? `(${pendientes}) ` : '';
    document.title = `${prefix}${label} - Panel de Agentes`;
  }, [view, conversaciones]);
}
