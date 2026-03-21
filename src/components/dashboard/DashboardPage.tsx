import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useDashboard } from '../../hooks/useDashboard';
import { getMetrics, getFunnel } from '../../api/metricsApi';
import type { BotMetrics, FunnelStage } from '../../api/metricsApi';
import {
  MessageCircle,
  Calendar,
  Mail,
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import Badge, { estadoColor, estadoLabel } from '../ui/Badge';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  detail,
}: {
  label: string;
  value: number;
  icon: typeof MessageCircle;
  color: string;
  detail?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {detail && <p className="text-[10px] text-gray-400 dark:text-gray-500">{detail}</p>}
      </div>
    </div>
  );
}

function OccupancyBar({ ocupacion }: { ocupacion: { fecha: string; reservas: number; capacidad: number }[] }) {
  const { t } = useTranslation();
  const dayLabels = t('dashboard.dayNames', { returnObjects: true }) as string[];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{t('dashboard.occupancyTitle')}</h3>
      <div className="flex gap-2 items-end h-32">
        {ocupacion.map((day) => {
          const pct = day.capacidad > 0 ? Math.round((day.reservas / day.capacidad) * 100) : 0;
          const barHeight = Math.max(pct, 4);
          const d = new Date(day.fecha + 'T12:00:00');
          const dayName = dayLabels[d.getDay()];
          const dayNum = d.getDate();
          const barColor = pct >= 80 ? 'bg-red-400' : pct >= 50 ? 'bg-amber-400' : 'bg-emerald-400';

          return (
            <div key={day.fecha} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{pct}%</span>
              <div
                className="w-full bg-gray-100 dark:bg-gray-700 rounded-t flex flex-col justify-end"
                style={{ height: '80px' }}
              >
                <div
                  className={`w-full ${barColor} rounded-t transition-all`}
                  style={{ height: `${barHeight}%` }}
                  title={t('dashboard.occupancyUnits', { reservas: day.reservas, capacidad: day.capacidad })}
                />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{dayName}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{dayNum}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricsSection({ metrics }: { metrics: BotMetrics }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
        <BarChart3 size={16} />
        {t('dashboard.metricsTitle')}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <p className="text-lg font-bold text-emerald-600">{(metrics.tasaResolucionBot * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-500">{t('dashboard.metricResolutionBot')}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-600">{(metrics.tasaEscalacion * 100).toFixed(0)}%</p>
          <p className="text-xs text-gray-500">{t('dashboard.metricEscalation')}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-blue-600">
            {metrics.tiempoRespuestaPromMs != null ? `${(metrics.tiempoRespuestaPromMs / 1000).toFixed(1)}s` : '-'}
          </p>
          <p className="text-xs text-gray-500">{t('dashboard.metricResponseTime')}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-purple-600">
            {metrics.duracionPromedioMs != null ? `${Math.round(metrics.duracionPromedioMs / 60000)}min` : '-'}
          </p>
          <p className="text-xs text-gray-500">{t('dashboard.metricDuration')}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{metrics.mensajesPorConversacion}</p>
          <p className="text-xs text-gray-500">{t('dashboard.metricMsgsPerConv')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('dashboard.metricEscalationReasons')}</p>
          {Object.entries(metrics.razonesEscalacion).length === 0 ? (
            <p className="text-xs text-gray-400">-</p>
          ) : (
            Object.entries(metrics.razonesEscalacion).map(([k, v]) => (
              <p key={k} className="text-xs text-gray-600 dark:text-gray-400">
                {k}: {v}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FunnelSection({ funnel }: { funnel: FunnelStage[] }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
        <TrendingUp size={16} />
        {t('dashboard.funnelTitle')}
      </h3>
      <div className="space-y-2">
        {funnel.map((stage) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-300">{stage.label}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {stage.count} ({stage.rate}%)
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded h-3">
              <div
                className="bg-blue-500 h-3 rounded transition-all"
                style={{ width: `${Math.max(stage.rate, 1)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useDashboard();
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultTo = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  const { data: metrics } = useQuery({
    queryKey: ['metrics', dateFrom, dateTo],
    queryFn: () => getMetrics(dateFrom, dateTo),
    refetchInterval: 120_000,
  });

  const { data: funnel } = useQuery({
    queryKey: ['funnel', dateFrom, dateTo],
    queryFn: () => getFunnel(dateFrom, dateTo),
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
          <p className="text-red-600 dark:text-red-400">{t('dashboard.errorLoading')}</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error)?.message ?? t('dashboard.errorDefault')}</p>
        </div>
      </div>
    );
  }

  const convEspera = data.conversaciones['espera_humano'] ?? 0;
  const convActivo = data.conversaciones['humano_activo'] ?? 0;
  const convBot = data.conversaciones['bot'] ?? 0;
  const reservasTotal = data.reservas['total'] ?? 0;
  const reservasConfirmadas = data.reservas['confirmada'] ?? 0;
  const reservasPre = data.reservas['pre_reserva'] ?? 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('dashboard.title')}</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label={t('dashboard.waitingAgent')}
          value={convEspera}
          icon={AlertCircle}
          color="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
          detail={t('dashboard.activeConvs', { count: convActivo, botCount: convBot })}
        />
        <StatCard
          label={t('dashboard.monthReservations')}
          value={reservasTotal}
          icon={Calendar}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
          detail={t('dashboard.confirmedPending', { confirmed: reservasConfirmadas, pending: reservasPre })}
        />
        <StatCard
          label={t('dashboard.emailsToday')}
          value={data.emails.hoy}
          icon={Mail}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
          detail={t('dashboard.respondedTotal', { count: data.emails.respondidos })}
        />
        <StatCard
          label={t('dashboard.activeConversations')}
          value={convEspera + convActivo + convBot}
          icon={Users}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
        />
      </div>

      {/* Occupancy + Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <OccupancyBar ocupacion={data.ocupacion} />
        </div>

        {/* Email summary card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            {t('dashboard.emailsSummary')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('dashboard.emailsResponded')}</span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{data.emails.respondidos}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('dashboard.emailsErrors')}</span>
              <span className="font-medium text-red-600 dark:text-red-400">{data.emails.errores}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('dashboard.emailsForms')}</span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{data.emails.formularios}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics date range + sections */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.dateRange')}</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-400"
        />
        <span className="text-xs text-gray-400">{t('dashboard.dateRangeTo')}</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {metrics && <MetricsSection metrics={metrics} />}
        {funnel && <FunnelSection funnel={funnel} />}
      </div>

      {/* Recent sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent conversations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <MessageCircle size={16} />
            {t('dashboard.recentConversations')}
          </h3>
          {data.recientes.conversaciones.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('dashboard.noActiveConversations')}</p>
          ) : (
            <div className="space-y-2">
              {data.recientes.conversaciones.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {c.huesped?.nombre ?? c.huesped?.waId ?? t('dashboard.noName')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {c.ultimoMensaje ?? t('dashboard.noMessages')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <Badge color={estadoColor(c.estado)}>{estadoLabel(c.estado)}</Badge>
                    {c.ultimoMensajeEn && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock size={10} />
                        {new Date(c.ultimoMensajeEn).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming reservas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Calendar size={16} />
            {t('dashboard.upcomingReservations')}
          </h3>
          {data.recientes.reservas.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('dashboard.noUpcomingReservations')}</p>
          ) : (
            <div className="space-y-2">
              {data.recientes.reservas.map((r) => {
                const nombre = r.nombreHuesped ?? r.huesped?.nombre ?? t('dashboard.noName');
                const entrada = new Date(r.fechaEntrada).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                });
                const salida = new Date(r.fechaSalida).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                });
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{nombre}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {r.habitacion ?? t('dashboard.noRoom')} &middot; {entrada} - {salida}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <Badge color={estadoColor(r.estado)}>{estadoLabel(r.estado)}</Badge>
                      {r.estado === 'confirmada' && <CheckCircle size={14} className="text-green-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
