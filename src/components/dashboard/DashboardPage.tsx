import { useDashboard } from '../../hooks/useDashboard';
import { MessageCircle, Calendar, Mail, Users, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import Badge, { estadoColor, estadoLabel } from '../ui/Badge';

function StatCard({ label, value, icon: Icon, color, detail }: {
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
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Ocupacion proximos 7 dias</h3>
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
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className={`w-full ${barColor} rounded-t transition-all`}
                  style={{ height: `${barHeight}%` }}
                  title={`${day.reservas}/${day.capacidad} unidades`}
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

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();

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
          <p className="text-red-600 dark:text-red-400">Error al cargar el dashboard</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error)?.message ?? 'No se pudo obtener los datos'}</p>
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
      <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Esperando agente"
          value={convEspera}
          icon={AlertCircle}
          color="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
          detail={`${convActivo} activas, ${convBot} con bot`}
        />
        <StatCard
          label="Reservas del mes"
          value={reservasTotal}
          icon={Calendar}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
          detail={`${reservasConfirmadas} confirmadas, ${reservasPre} pendientes`}
        />
        <StatCard
          label="Emails hoy"
          value={data.emails.hoy}
          icon={Mail}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
          detail={`${data.emails.respondidos} respondidos total`}
        />
        <StatCard
          label="Conv. activas"
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
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Emails resumen</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Respondidos</span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{data.emails.respondidos}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Con errores</span>
              <span className="font-medium text-red-600 dark:text-red-400">{data.emails.errores}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Formularios</span>
              <span className="font-medium text-gray-800 dark:text-gray-100">{data.emails.formularios}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent conversations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <MessageCircle size={16} />
            Conversaciones recientes
          </h3>
          {data.recientes.conversaciones.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin conversaciones activas</p>
          ) : (
            <div className="space-y-2">
              {data.recientes.conversaciones.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {c.huesped?.nombre ?? c.huesped?.waId ?? 'Sin nombre'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{c.ultimoMensaje ?? 'Sin mensajes'}</p>
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
            Proximas reservas
          </h3>
          {data.recientes.reservas.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin reservas proximas</p>
          ) : (
            <div className="space-y-2">
              {data.recientes.reservas.map((r) => {
                const nombre = r.nombreHuesped ?? r.huesped?.nombre ?? 'Sin nombre';
                const entrada = new Date(r.fechaEntrada).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                const salida = new Date(r.fechaSalida).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{nombre}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {r.habitacion ?? 'Sin asignar'} &middot; {entrada} - {salida}
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
