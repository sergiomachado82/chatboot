import type { Mensaje } from '@shared/types/mensaje';

interface MessageBubbleProps {
  mensaje: Mensaje;
  highlightText?: string;
}

function highlightContent(text: string, highlight?: string): React.ReactNode {
  if (!highlight) return text;
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded-sm">{part}</mark>
      : part
  );
}

export default function MessageBubble({ mensaje, highlightText }: MessageBubbleProps) {
  const time = new Date(mensaje.creadoEn).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  // System messages
  if (mensaje.origen === 'sistema' || mensaje.tipo === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
          {highlightContent(mensaje.contenido, highlightText)}
        </span>
      </div>
    );
  }

  const isIncoming = mensaje.direccion === 'entrante';
  const originColors: Record<string, string> = {
    huesped: 'bg-green-100 text-gray-800',
    bot: 'bg-gray-100 text-gray-800',
    agente: 'bg-blue-500 text-white',
  };

  const colorClass = originColors[mensaje.origen] ?? 'bg-gray-100 text-gray-800';
  const align = isIncoming ? 'justify-start' : 'justify-end';

  const originLabel: Record<string, string> = {
    huesped: '',
    bot: 'Bot',
    agente: 'Agente',
  };

  return (
    <div className={`flex ${align} mb-2`}>
      <div className={`max-w-[75%] px-3 py-2 rounded-lg ${colorClass}`}>
        {originLabel[mensaje.origen] && (
          <p className={`text-[10px] font-semibold mb-0.5 ${mensaje.origen === 'agente' ? 'text-blue-100' : 'text-gray-400'}`}>
            {originLabel[mensaje.origen]}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{highlightContent(mensaje.contenido, highlightText)}</p>
        <p className={`text-[10px] text-right mt-1 ${mensaje.origen === 'agente' ? 'text-blue-200' : 'text-gray-400'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}
