import { Smartphone, Globe } from 'lucide-react';
import type { Conversacion } from '@shared/types/conversacion';
import Badge, { estadoColor, estadoLabel } from '../ui/Badge';
import Avatar from '../ui/Avatar';

function isWhatsApp(waId?: string): boolean {
  return !!waId && /^\d{7,}$/.test(waId);
}

interface ChatListItemProps {
  conversacion: Conversacion;
  selected: boolean;
  unread?: boolean;
  onClick: () => void;
  selectMode?: boolean;
  isChecked?: boolean;
  onToggleSelect?: () => void;
}

export default function ChatListItem({ conversacion, selected, unread, onClick, selectMode, isChecked, onToggleSelect }: ChatListItemProps) {
  const nombre = conversacion.huesped?.nombre ?? conversacion.huesped?.waId ?? 'Sin nombre';
  const time = conversacion.ultimoMensajeEn
    ? new Date(conversacion.ultimoMensajeEn).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    : '';

  const handleClick = () => {
    if (selectMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        selected && !selectMode ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500' : ''
      } ${selectMode && isChecked ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
    >
      <div className="flex items-start gap-3">
        {selectMode && (
          <input
            type="checkbox"
            checked={isChecked ?? false}
            onChange={() => onToggleSelect?.()}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 shrink-0 accent-red-600"
          />
        )}
        <div className="relative">
          <Avatar name={nombre} identifier={conversacion.huesped?.waId ?? conversacion.id} />
          {unread && !selectMode && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm truncate flex items-center gap-1 ${unread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-800 dark:text-gray-100'}`}>
              {isWhatsApp(conversacion.huesped?.waId) ? (
                <Smartphone size={12} className="text-green-500 flex-shrink-0" />
              ) : (
                <Globe size={12} className="text-blue-400 flex-shrink-0" />
              )}
              {nombre}
            </span>
            <span className={`text-xs ml-2 flex-shrink-0 ${unread ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{time}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-xs truncate flex-1 mr-2 ${unread ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {conversacion.ultimoMensaje ?? 'Sin mensajes'}
            </p>
            <Badge color={estadoColor(conversacion.estado)}>{estadoLabel(conversacion.estado)}</Badge>
          </div>
        </div>
      </div>
    </button>
  );
}
