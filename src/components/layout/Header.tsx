import { useState, useEffect } from 'react';
import { logout, getStoredAgente } from '../../api/authApi';
import { MessageCircle, Calendar, Building2, Smartphone, Bot } from 'lucide-react';

type View = 'chat' | 'reservas' | 'complejos' | 'whatsapp' | 'bot';

interface HeaderProps {
  view: View;
  onViewChange: (view: View) => void;
}

export default function Header({ view, onViewChange }: HeaderProps) {
  const agente = getStoredAgente();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-gray-800">Chatbot Alojamiento</h1>
        <nav className="flex gap-1">
          <button
            onClick={() => onViewChange('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
              view === 'chat' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageCircle size={16} />
            Chat
          </button>
          <button
            onClick={() => onViewChange('reservas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
              view === 'reservas' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar size={16} />
            Reservas
          </button>
          <button
            onClick={() => onViewChange('complejos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
              view === 'complejos' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Building2 size={16} />
            Complejos
          </button>
          <button
            onClick={() => onViewChange('whatsapp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
              view === 'whatsapp' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Smartphone size={16} />
            WhatsApp
          </button>
          <button
            onClick={() => onViewChange('bot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
              view === 'bot' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bot size={16} />
            Bot
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <HealthIndicator />
        <span className="text-sm text-gray-500">{agente?.nombre ?? agente?.email}</span>
        <button onClick={logout} className="text-sm text-red-600 hover:underline">
          Salir
        </button>
      </div>
    </header>
  );
}

interface HealthData {
  status: 'ok' | 'degraded';
  services: Record<string, { status: 'ok' | 'error' | 'not_configured'; latencyMs?: number }>;
}

const SERVICE_LABELS: Record<string, string> = {
  database: 'BD',
  redis: 'Redis',
  claude: 'Claude',
  whatsapp: 'WhatsApp',
  sheets: 'Sheets',
};

function HealthIndicator() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    async function fetchHealthWithRetry() {
      for (let i = 0; i < 3; i++) {
        try {
          const r = await fetch('/api/health');
          const data = await r.json();
          setHealth(data);
          return;
        } catch {
          if (i < 2) await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** i, 5000)));
        }
      }
      setHealth(null);
    }
    fetchHealthWithRetry();
    const id = setInterval(fetchHealthWithRetry, 30_000);
    return () => clearInterval(id);
  }, []);

  const dotColor = !health
    ? 'bg-gray-400'
    : health.status === 'ok'
      ? 'bg-green-500'
      : 'bg-yellow-500';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
        aria-label="Estado de servicios"
        aria-expanded={showDetail}
      >
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        Estado
      </button>

      {showDetail && health && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-48">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Estado: {health.status === 'ok' ? 'OK' : 'Degradado'}
          </p>
          <div className="space-y-1">
            {Object.entries(health.services).map(([key, svc]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{SERVICE_LABELS[key] ?? key}</span>
                <span className="flex items-center gap-1">
                  {svc.latencyMs != null && (
                    <span className="text-gray-400">{svc.latencyMs}ms</span>
                  )}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      svc.status === 'ok'
                        ? 'bg-green-500'
                        : svc.status === 'not_configured'
                          ? 'bg-gray-400'
                          : 'bg-red-500'
                    }`}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
