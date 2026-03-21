import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReservasCalendar } from '../../hooks/useReservas';
import { useComplejos } from '../../hooks/useComplejos';
import type { Reserva } from '@shared/types/reserva';
import type { Complejo } from '@shared/types/complejo';

const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  pre_reserva: { bg: 'bg-orange-300', text: 'text-orange-900' },
  confirmada: { bg: 'bg-green-400', text: 'text-green-900' },
  completada: { bg: 'bg-blue-300', text: 'text-blue-900' },
};

const COMPLEJO_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-orange-600',
];

const COMPLEJO_BORDER_COLORS = [
  'border-l-blue-600',
  'border-l-emerald-600',
  'border-l-purple-600',
  'border-l-amber-600',
  'border-l-rose-600',
  'border-l-cyan-600',
  'border-l-indigo-600',
  'border-l-orange-600',
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isWeekend(year: number, month: number, day: number): boolean {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}

interface CalendarRow {
  label: string;
  habitacion: string;
  unitIndex: number;
  complejoIndex: number;
}

interface ReservaSpan {
  reserva: Reserva;
  startDay: number;
  endDay: number;
}

function buildRows(complejos: Complejo[]): CalendarRow[] {
  const rows: CalendarRow[] = [];
  complejos.forEach((c, ci) => {
    if (c.cantidadUnidades > 1) {
      for (let i = 1; i <= c.cantidadUnidades; i++) {
        rows.push({ label: `${c.nombre} dpto.${i}`, habitacion: c.nombre, unitIndex: i, complejoIndex: ci });
      }
    } else {
      rows.push({ label: c.nombre, habitacion: c.nombre, unitIndex: 1, complejoIndex: ci });
    }
  });
  return rows;
}

// Distribute reservas across units using greedy assignment
function distributeReservas(spans: ReservaSpan[], numUnits: number): Map<number, ReservaSpan[]> {
  const units = new Map<number, ReservaSpan[]>();
  for (let i = 1; i <= numUnits; i++) units.set(i, []);

  const sorted = [...spans].sort((a, b) => a.startDay - b.startDay);

  for (const span of sorted) {
    let assigned = false;
    for (let i = 1; i <= numUnits; i++) {
      const existing = units.get(i)!;
      const overlaps = existing.some((e) => span.startDay <= e.endDay && span.endDay >= e.startDay);
      if (!overlaps) {
        existing.push(span);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      units.get(1)!.push(span);
    }
  }

  return units;
}

export default function ReservaCalendar() {
  const { t } = useTranslation();
  const monthNames = t('calendar.months', { returnObjects: true }) as string[];
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const numDays = daysInMonth(year, month);
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(numDays).padStart(2, '0')}`;

  const { data: reservas, isLoading } = useReservasCalendar(from, to);
  const { data: complejos } = useComplejos();

  const activeComplejos = useMemo(() => complejos?.filter((c) => c.activo) ?? [], [complejos]);

  const rows = useMemo(() => buildRows(activeComplejos), [activeComplejos]);

  // Build spans per habitacion
  const spansByHabitacion = useMemo(() => {
    const map = new Map<string, ReservaSpan[]>();
    if (!reservas) return map;

    for (const r of reservas) {
      if (!r.habitacion) continue;
      const [ey, em, ed] = r.fechaEntrada.slice(0, 10).split('-').map(Number);
      const [sy, sm, sd] = r.fechaSalida.slice(0, 10).split('-').map(Number);
      const entrada = new Date(ey, em - 1, ed);
      const salida = new Date(sy, sm - 1, sd);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month, numDays + 1);

      const effectiveStart = entrada < monthStart ? monthStart : entrada;
      const effectiveEnd = salida > monthEnd ? monthEnd : salida;

      const startDay = effectiveStart.getDate();
      const displayEnd = salida > monthEnd ? numDays : Math.max(startDay, effectiveEnd.getDate() - 1);

      if (!map.has(r.habitacion)) map.set(r.habitacion, []);
      map.get(r.habitacion)!.push({ reserva: r, startDay, endDay: displayEnd });
    }
    return map;
  }, [reservas, year, month, numDays]);

  // Distribute reservas across units per complejo
  const unitAssignments = useMemo(() => {
    const result = new Map<string, Map<number, ReservaSpan[]>>();
    for (const c of activeComplejos) {
      const spans = spansByHabitacion.get(c.nombre) ?? [];
      result.set(c.nombre, distributeReservas(spans, c.cantidadUnidades));
    }
    return result;
  }, [activeComplejos, spansByHabitacion]);

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  }

  function getReservaForCell(habitacion: string, unitIndex: number, day: number): Reserva | null {
    const units = unitAssignments.get(habitacion);
    if (!units) return null;
    const spans = units.get(unitIndex);
    if (!spans) return null;
    for (const s of spans) {
      if (day >= s.startDay && day <= s.endDay) return s.reserva;
    }
    return null;
  }

  const days = Array.from({ length: numDays }, (_, i) => i + 1);
  const showComplejoLegend = activeComplejos.length > 1;

  return (
    <div className="p-6">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 min-w-[200px] text-center">
          {monthNames[month]} {year}
        </h2>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Estado Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-300" /> {t('calendar.legendPreReserva')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-400" /> {t('calendar.legendConfirmed')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-300" /> {t('calendar.legendCompleted')}
        </span>
      </div>

      {/* Complejo color legend */}
      {showComplejoLegend && (
        <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600 dark:text-gray-300">
          {activeComplejos.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${COMPLEJO_COLORS[i % COMPLEJO_COLORS.length]}`} />
              {c.nombre}
            </span>
          ))}
        </div>
      )}

      {isLoading && <p className="text-gray-400 text-sm mb-2">{t('common.loading')}</p>}

      {/* Grid */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-left text-gray-600 dark:text-gray-300 font-medium border-r dark:border-gray-600 min-w-[160px]">
                {t('calendar.headerDepartment')}
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  className={`px-1 py-2 text-center font-medium min-w-[28px] ${
                    isWeekend(year, month, d)
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.habitacion}-${row.unitIndex}`} className="border-b dark:border-gray-700">
                <td
                  className={`sticky left-0 z-10 bg-white dark:bg-gray-800 px-3 py-2 font-medium text-gray-700 dark:text-gray-200 border-r dark:border-gray-600 whitespace-nowrap border-l-3 ${COMPLEJO_BORDER_COLORS[row.complejoIndex % COMPLEJO_BORDER_COLORS.length]}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${COMPLEJO_COLORS[row.complejoIndex % COMPLEJO_COLORS.length]}`}
                    />
                    {row.label}
                  </span>
                </td>
                {days.map((d) => {
                  const r = getReservaForCell(row.habitacion, row.unitIndex, d);
                  const colors = r ? ESTADO_COLORS[r.estado] : null;
                  const nombre = r ? (r.nombreHuesped ?? r.huesped?.nombre ?? '') : '';
                  const tooltip = r
                    ? `${nombre}\n${new Date(r.fechaEntrada).toLocaleDateString('es-AR')} - ${new Date(r.fechaSalida).toLocaleDateString('es-AR')}`
                    : '';
                  return (
                    <td
                      key={d}
                      className={`px-0 py-0 text-center border-l dark:border-gray-700 ${
                        isWeekend(year, month, d) ? 'bg-gray-50 dark:bg-gray-750' : ''
                      }`}
                    >
                      {r ? (
                        <div
                          className={`w-full h-7 ${colors!.bg} ${colors!.text} flex items-center justify-center cursor-default`}
                          title={tooltip}
                        />
                      ) : (
                        <div className="w-full h-7" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={numDays + 1} className="px-4 py-8 text-center text-gray-400">
                  {t('calendar.noDepartments')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
