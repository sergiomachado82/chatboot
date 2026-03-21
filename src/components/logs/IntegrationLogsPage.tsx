import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getIntegrationLogs } from '../../api/botConfigApi';
import type { IntegrationLogEntry } from '../../api/botConfigApi';

const SERVICES = ['all', 'whatsapp', 'claude', 'reservas', 'sheets'] as const;
const SERVICE_LABELS: Record<string, string> = {
  all: 'Todos',
  whatsapp: 'WhatsApp',
  claude: 'Claude IA',
  reservas: 'Reservas',
  sheets: 'Sheets',
};

export default function IntegrationLogsPage() {
  const [serviceFilter, setServiceFilter] = useState('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['integration-logs', serviceFilter],
    queryFn: () => getIntegrationLogs(serviceFilter === 'all' ? undefined : serviceFilter, 100),
    refetchInterval: 30_000,
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Logs de integracion</h2>

        <div className="flex gap-1 mb-4 flex-wrap">
          {SERVICES.map((s) => (
            <button
              key={s}
              onClick={() => setServiceFilter(s)}
              aria-pressed={serviceFilter === s}
              className={`px-3 py-1.5 text-xs rounded-full ${
                serviceFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {SERVICE_LABELS[s] ?? s}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-sm text-gray-500">Cargando logs...</p>}

        {!isLoading && (!logs || logs.length === 0) && (
          <p className="text-sm text-gray-500 text-center py-8">No hay logs de error registrados.</p>
        )}

        <div className="space-y-2">
          {logs?.map((log: IntegrationLogEntry) => (
            <div
              key={log.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 border-l-4 ${
                log.nivel === 'error' ? 'border-l-red-500' : 'border-l-yellow-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    log.nivel === 'error'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {log.nivel.toUpperCase()}
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {SERVICE_LABELS[log.servicio] ?? log.servicio}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(log.creadoEn).toLocaleString('es', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">{log.mensaje}</p>
              {log.detalle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={log.detalle}>
                  {log.detalle}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
