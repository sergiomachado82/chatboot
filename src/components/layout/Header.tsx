import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getStoredAgente } from '../../api/authApi';
import { useSocketStatus } from '../../hooks/useSocket';
import { useHealth } from '../../hooks/useHealth';
import { MessageCircle, Calendar, Building2, Smartphone, Bot, Mail, LayoutDashboard, Moon, Sun, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
}

const NAV_ITEMS: { path: string; icon: typeof MessageCircle; label: string }[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/reservas', icon: Calendar, label: 'Reservas' },
  { path: '/propiedades', icon: Building2, label: 'Propiedades' },
  { path: '/emails', icon: Mail, label: 'Emails' },
  { path: '/whatsapp', icon: Smartphone, label: 'WhatsApp' },
  { path: '/bot', icon: Bot, label: 'Bot' },
];

export default function Header({ isDark, onToggleDark }: HeaderProps) {
  const agente = getStoredAgente();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  function handleNav(path: string) {
    navigate(path);
    setMenuOpen(false);
  }

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-2 flex items-center justify-between relative">
      <div className="flex items-center gap-3 md:gap-6">
        <h1 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Chatbot</h1>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              aria-current={isActive(path) ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium ${
                isActive(path) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Mobile: icon buttons for all */}
        <nav className="flex md:hidden gap-0.5">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              aria-current={isActive(path) ? 'page' : undefined}
              className={`p-2 rounded-md ${
                isActive(path) ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
              title={label}
              aria-label={label}
            >
              <Icon size={18} />
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <SocketIndicator />
        <button
          onClick={onToggleDark}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <HealthIndicator />
        <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{agente?.nombre ?? agente?.email}</span>
        <button onClick={logout} className="text-sm text-red-600 dark:text-red-400 hover:underline whitespace-nowrap">
          Salir
        </button>
      </div>
    </header>
  );
}

const SERVICE_LABELS: Record<string, string> = {
  database: 'BD',
  redis: 'Redis',
  claude: 'Claude',
  whatsapp: 'WhatsApp',
  sheets: 'Sheets',
};

function HealthIndicator() {
  const health = useHealth();
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(false);

  const dotColor = !health
    ? 'bg-gray-400'
    : health.status === 'ok'
      ? 'bg-green-500'
      : 'bg-yellow-500';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Estado de servicios"
        aria-expanded={showDetail}
      >
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="hidden sm:inline">Estado</span>
      </button>

      {showDetail && health && (
        <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 min-w-48">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Estado: {health.status === 'ok' ? 'OK' : 'Degradado'}
          </p>
          <div className="space-y-1">
            {Object.entries(health.services).map(([key, svc]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-300">{SERVICE_LABELS[key] ?? key}</span>
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
          <button
            onClick={() => { setShowDetail(false); navigate('/logs'); }}
            className="mt-2 w-full text-xs text-blue-600 dark:text-blue-400 hover:underline text-left"
          >
            Ver logs de integracion
          </button>
        </div>
      )}
    </div>
  );
}

function SocketIndicator() {
  const status = useSocketStatus();

  const config = {
    connected: { icon: Wifi, color: 'text-green-500', label: 'Tiempo real: conectado' },
    connecting: { icon: Wifi, color: 'text-amber-500 animate-pulse', label: 'Tiempo real: conectando...' },
    disconnected: { icon: WifiOff, color: 'text-red-500', label: 'Tiempo real: desconectado' },
  }[status];

  const { icon: Icon, color, label } = config;

  return (
    <div className={`p-1.5 rounded-md ${color}`} title={label} aria-label={label}>
      <Icon size={14} />
    </div>
  );
}
