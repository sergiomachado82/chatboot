import type { Conversacion } from '@shared/types/conversacion';
import Badge, { estadoColor, estadoLabel } from '../ui/Badge';
import Avatar from '../ui/Avatar';

interface ChatListItemProps {
  conversacion: Conversacion;
  selected: boolean;
  onClick: () => void;
}

export default function ChatListItem({ conversacion, selected, onClick }: ChatListItemProps) {
  const nombre = conversacion.huesped?.nombre ?? conversacion.huesped?.waId ?? 'Sin nombre';
  const time = conversacion.ultimoMensajeEn
    ? new Date(conversacion.ultimoMensajeEn).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        selected ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={nombre} identifier={conversacion.huesped?.waId ?? conversacion.id} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{nombre}</span>
            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{time}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 mr-2">
              {conversacion.ultimoMensaje ?? 'Sin mensajes'}
            </p>
            <Badge color={estadoColor(conversacion.estado)}>{estadoLabel(conversacion.estado)}</Badge>
          </div>
        </div>
      </div>
    </button>
  );
}
