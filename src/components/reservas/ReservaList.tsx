import { useState } from 'react';
import { useReservas } from '../../hooks/useReservas';
import { useComplejos } from '../../hooks/useComplejos';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '../../utils/notify';
import { createReservaManual, deleteReserva, updateReserva, updateReservaEstado } from '../../api/reservaApi';
import Badge, { estadoColor, estadoLabel } from '../ui/Badge';
import type { Reserva, CrearReservaManualRequest, UpdateReservaRequest } from '@shared/types/reserva';
import { Plus, Pencil, Trash2, X, List, CalendarDays } from 'lucide-react';
import ReservaCalendar from './ReservaCalendar';
import { TableSkeleton } from '../ui/Skeleton';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';

function calcDias(entrada: string, salida: string): number {
  const d1 = new Date(entrada);
  const d2 = new Date(salida);
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function parseUTCDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(iso: string): string {
  return parseUTCDate(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '-';
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
}

const EMPTY_FORM = {
  nombreHuesped: '',
  telefonoHuesped: '',
  dni: '',
  fechaEntrada: '',
  fechaSalida: '',
  numHuespedes: 1,
  habitacion: '',
  tarifaNoche: '',
  precioTotal: '',
  montoReserva: '',
  saldo: '',
  estado: 'pre_reserva' as string,
  origenReserva: '',
  nroFactura: '',
  importeUsd: '',
  notas: '',
};

type FormData = typeof EMPTY_FORM;

function reservaToForm(r: Reserva): FormData {
  return {
    nombreHuesped: r.nombreHuesped ?? r.huesped?.nombre ?? '',
    telefonoHuesped: r.telefonoHuesped ?? r.huesped?.telefono ?? '',
    dni: r.dni ?? '',
    fechaEntrada: r.fechaEntrada ? r.fechaEntrada.slice(0, 10) : '',
    fechaSalida: r.fechaSalida ? r.fechaSalida.slice(0, 10) : '',
    numHuespedes: r.numHuespedes,
    habitacion: r.habitacion ?? '',
    tarifaNoche: r.tarifaNoche != null ? String(r.tarifaNoche) : '',
    precioTotal: r.precioTotal != null ? String(r.precioTotal) : '',
    montoReserva: r.montoReserva != null ? String(r.montoReserva) : '',
    saldo: r.saldo != null ? String(r.saldo) : '',
    estado: r.estado,
    origenReserva: r.origenReserva ?? '',
    nroFactura: r.nroFactura ?? '',
    importeUsd: r.importeUsd != null ? String(r.importeUsd) : '',
    notas: r.notas ?? '',
  };
}

/* ─── Mobile card for a single reserva ─── */
function ReservaCard({
  r,
  onEdit,
  onDelete,
  onEstadoChange,
  isPending,
}: {
  r: Reserva;
  onEdit: () => void;
  onDelete: () => void;
  onEstadoChange: (id: string, estado: string) => void;
  isPending: boolean;
}) {
  const nombre = r.nombreHuesped ?? r.huesped?.nombre ?? r.huesped?.waId ?? '-';
  const dias = calcDias(r.fechaEntrada, r.fechaSalida);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{nombre}</p>
          <p className="text-xs text-gray-500">{r.habitacion ?? 'Sin asignar'}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge color={estadoColor(r.estado)}>{estadoLabel(r.estado)}</Badge>
          <button
            onClick={onEdit}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-400">IN</span>
          <p className="text-gray-700">{fmtDate(r.fechaEntrada)}</p>
        </div>
        <div>
          <span className="text-gray-400">OUT</span>
          <p className="text-gray-700">{fmtDate(r.fechaSalida)}</p>
        </div>
        <div>
          <span className="text-gray-400">Dias</span>
          <p className="text-gray-700">{dias}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-400">Total</span>
          <p className="text-gray-700 font-medium">{fmtMoney(r.precioTotal)}</p>
        </div>
        <div>
          <span className="text-gray-400">Sena</span>
          <p className="text-gray-700">{fmtMoney(r.montoReserva)}</p>
        </div>
        <div>
          <span className="text-gray-400">Saldo</span>
          <p className="text-gray-700">{fmtMoney(r.saldo)}</p>
        </div>
      </div>

      {/* Action buttons */}
      {r.estado === 'pre_reserva' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onEstadoChange(r.id, 'confirmada')}
            disabled={isPending}
            className="flex-1 text-xs py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
          >
            Confirmar
          </button>
          <button
            onClick={() => {
              if (window.confirm('Seguro que queres cancelar esta reserva?')) {
                onEstadoChange(r.id, 'cancelada');
              }
            }}
            disabled={isPending}
            className="flex-1 text-xs py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      )}
      {r.estado === 'confirmada' && (
        <div className="pt-1">
          <button
            onClick={() => onEstadoChange(r.id, 'completada')}
            disabled={isPending}
            className="w-full text-xs py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            Completar
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReservaList() {
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [filtro, setFiltro] = useState<string>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useReservas(filtro || undefined, page);
  const reservas = data?.reservas;
  const totalPages = data?.totalPages ?? 1;
  const { data: complejos } = useComplejos();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormData>(EMPTY_FORM);
  const [modalError, setModalError] = useState('');

  const createMut = useMutation({
    mutationFn: (data: CrearReservaManualRequest) => createReservaManual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      closeModal();
    },
    onError: (err: Error) => setModalError(err.message || 'Error al crear reserva'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReservaRequest }) => updateReserva(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      closeModal();
    },
    onError: (err: Error) => setModalError(err.message || 'Error al actualizar reserva'),
  });

  const updateEstadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => updateReservaEstado(id, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas'] }),
    onError: (err: Error) => notify.error(err.message || 'Error al cambiar estado'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteReserva(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservas'] }),
    onError: (err: Error) => notify.error(err.message || 'Error al eliminar reserva'),
  });

  function handleDelete(id: string) {
    if (window.confirm('Seguro que queres eliminar esta reserva?')) {
      deleteMut.mutate(id);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setModalError('');
    setModalOpen(true);
  }

  function openEdit(r: Reserva) {
    const formData = reservaToForm(r);
    setEditingId(r.id);
    setForm(formData);
    setInitialForm(formData);
    setModalError('');
    setModalOpen(true);
  }

  function closeModal() {
    const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
    if (isDirty && !window.confirm('Hay cambios sin guardar. Seguro que queres cerrar?')) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalError('');
  }

  const modalRef = useModalKeyboard(() => { if (modalOpen) closeModal(); });

  function handleChange(field: keyof FormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.nombreHuesped.trim()) errors.nombreHuesped = 'Nombre es requerido';
    if (!form.fechaEntrada) errors.fechaEntrada = 'Fecha entrada es requerida';
    if (!form.fechaSalida) errors.fechaSalida = 'Fecha salida es requerida';
    if (form.fechaEntrada && form.fechaSalida && form.fechaEntrada >= form.fechaSalida) {
      errors.fechaSalida = 'Fecha salida debe ser posterior a la entrada';
    }
    if (Object.keys(errors).length > 0) {
      setModalError(Object.values(errors).join('. '));
      return;
    }
    setModalError('');

    const base = {
      nombreHuesped: form.nombreHuesped.trim(),
      telefonoHuesped: form.telefonoHuesped.trim() || undefined,
      dni: form.dni.trim() || undefined,
      fechaEntrada: form.fechaEntrada,
      fechaSalida: form.fechaSalida,
      numHuespedes: Number(form.numHuespedes) || 1,
      habitacion: form.habitacion || undefined,
      tarifaNoche: form.tarifaNoche ? Number(form.tarifaNoche) : undefined,
      precioTotal: form.precioTotal ? Number(form.precioTotal) : undefined,
      montoReserva: form.montoReserva ? Number(form.montoReserva) : undefined,
      saldo: form.saldo ? Number(form.saldo) : undefined,
      origenReserva: form.origenReserva.trim() || undefined,
      nroFactura: form.nroFactura.trim() || undefined,
      importeUsd: form.importeUsd ? Number(form.importeUsd) : undefined,
      notas: form.notas.trim() || undefined,
    };

    if (editingId) {
      updateMut.mutate({
        id: editingId,
        data: {
          ...base,
          estado: form.estado as any,
          telefonoHuesped: form.telefonoHuesped.trim() || null,
          dni: form.dni.trim() || null,
          tarifaNoche: form.tarifaNoche ? Number(form.tarifaNoche) : null,
          montoReserva: form.montoReserva ? Number(form.montoReserva) : null,
          saldo: form.saldo ? Number(form.saldo) : null,
          origenReserva: form.origenReserva.trim() || null,
          nroFactura: form.nroFactura.trim() || null,
          importeUsd: form.importeUsd ? Number(form.importeUsd) : null,
          notas: form.notas.trim() || null,
        },
      });
    } else {
      createMut.mutate({
        ...base,
        estado: form.estado as any,
      });
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  if (viewMode === 'calendar') {
    return (
      <div>
        <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Reservas</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Vista tabla"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className="p-1.5 rounded bg-blue-100 text-blue-700"
              title="Vista calendario"
            >
              <CalendarDays size={18} />
            </button>
          </div>
        </div>
        <ReservaCalendar />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Reservas</h2>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className="p-1.5 rounded bg-blue-100 text-blue-700"
              title="Vista tabla"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="Vista calendario"
            >
              <CalendarDays size={18} />
            </button>
          </div>
          <select
            value={filtro}
            onChange={(e) => { setFiltro(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Todas</option>
            <option value="pre_reserva">Validar transferencia</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
            <option value="completada">Completada</option>
          </select>
          <button
            onClick={openCreate}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nueva</span> Reserva
          </button>
        </div>
      </div>

      {isLoading && <TableSkeleton rows={5} cols={8} />}

      {/* Mobile: Card view */}
      <div className="md:hidden space-y-3">
        {reservas?.map((r) => (
          <ReservaCard
            key={r.id}
            r={r}
            onEdit={() => openEdit(r)}
            onDelete={() => handleDelete(r.id)}
            onEstadoChange={(id, estado) => updateEstadoMut.mutate({ id, estado })}
            isPending={updateEstadoMut.isPending}
          />
        ))}
        {reservas?.length === 0 && (
          <div className="text-center text-gray-400 py-8">No hay reservas</div>
        )}
      </div>

      {/* Desktop: Table view */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
            <tr>
              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Nombre</th>
              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">DTO</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Pers</th>
              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">IN</th>
              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">OUT</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Dias</th>
              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Telefono</th>
              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">DNI</th>
              <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Tarifa</th>
              <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Total</th>
              <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Reserva</th>
              <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Saldo</th>
              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Origen</th>
              <th className="text-left px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Nro Fact.</th>
              <th className="text-right px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">USD</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Estado</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas?.map((r) => {
              const nombre = r.nombreHuesped ?? r.huesped?.nombre ?? r.huesped?.waId ?? '-';
              const telefono = r.telefonoHuesped ?? r.huesped?.telefono ?? '-';
              const dias = calcDias(r.fechaEntrada, r.fechaSalida);
              return (
                <tr key={r.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 whitespace-nowrap">{nombre}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.habitacion ?? '-'}</td>
                  <td className="px-3 py-2 text-center">{r.numHuespedes}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.fechaEntrada)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(r.fechaSalida)}</td>
                  <td className="px-3 py-2 text-center">{dias}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{telefono}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.dni ?? '-'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{fmtMoney(r.tarifaNoche)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap font-medium">{fmtMoney(r.precioTotal)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{fmtMoney(r.montoReserva)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{fmtMoney(r.saldo)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.origenReserva ?? '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.nroFactura ?? '-'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{r.importeUsd != null ? `US$${r.importeUsd}` : '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge color={estadoColor(r.estado)}>{estadoLabel(r.estado)}</Badge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center items-center">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                        aria-label="Editar reserva"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                        aria-label="Eliminar reserva"
                      >
                        <Trash2 size={14} />
                      </button>
                      {r.estado === 'pre_reserva' && (
                        <>
                          <button
                            onClick={() => updateEstadoMut.mutate({ id: r.id, estado: 'confirmada' })}
                            disabled={updateEstadoMut.isPending}
                            className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Seguro que queres cancelar esta reserva?')) {
                                updateEstadoMut.mutate({ id: r.id, estado: 'cancelada' });
                              }
                            }}
                            disabled={updateEstadoMut.isPending}
                            className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {r.estado === 'confirmada' && (
                        <button
                          onClick={() => updateEstadoMut.mutate({ id: r.id, estado: 'completada' })}
                          disabled={updateEstadoMut.isPending}
                          className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          Completar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {reservas?.length === 0 && (
              <tr>
                <td colSpan={17} className="px-4 py-8 text-center text-gray-400">
                  No hay reservas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700 rounded-b-lg mt-0 md:mt-0">
          <span className="text-xs text-gray-500">
            Pag {page}/{totalPages} ({data?.total ?? 0})
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 dark:text-gray-300"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal crear/editar — responsive */}
      {modalOpen && (
        <div ref={modalRef} tabIndex={-1} className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 outline-none">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                {editingId ? 'Editar Reserva' : 'Nueva Reserva'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Fila 1: Nombre + Telefono + DNI */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.nombreHuesped}
                    onChange={(e) => handleChange('nombreHuesped', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telefono</label>
                  <input
                    type="text"
                    value={form.telefonoHuesped}
                    onChange={(e) => handleChange('telefonoHuesped', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">DNI</label>
                  <input
                    type="text"
                    value={form.dni}
                    onChange={(e) => handleChange('dni', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    placeholder="Ej: 35123456"
                  />
                </div>
              </div>

              {/* Fila 2: DTO + Personas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
                  <select
                    value={form.habitacion}
                    onChange={(e) => handleChange('habitacion', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  >
                    <option value="">-- Seleccionar --</option>
                    {complejos
                      ?.filter((c) => c.activo)
                      .map((c) => (
                        <option key={c.id} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Personas</label>
                  <input
                    type="number"
                    min={1}
                    value={form.numHuespedes}
                    onChange={(e) => handleChange('numHuespedes', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              {/* Fila 3: IN + OUT + Dias */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Entrada *</label>
                  <input
                    type="date"
                    value={form.fechaEntrada}
                    onChange={(e) => handleChange('fechaEntrada', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Salida *</label>
                  <input
                    type="date"
                    value={form.fechaSalida}
                    onChange={(e) => handleChange('fechaSalida', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    required
                  />
                </div>
                <div className="hidden sm:block">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Dias</label>
                  <input
                    type="text"
                    value={form.fechaEntrada && form.fechaSalida ? calcDias(form.fechaEntrada, form.fechaSalida) : ''}
                    readOnly
                    className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* Fila 4: Tarifa + Total + Reserva + Saldo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tarifa/Noche</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.tarifaNoche}
                    onChange={(e) => handleChange('tarifaNoche', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    placeholder="$"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.precioTotal}
                    onChange={(e) => handleChange('precioTotal', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    placeholder="$"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sena</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.montoReserva}
                    onChange={(e) => handleChange('montoReserva', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    placeholder="$"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Saldo</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.saldo}
                    onChange={(e) => handleChange('saldo', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    placeholder="$"
                  />
                </div>
              </div>

              {/* Fila 5: Origen + Nro Factura + Importe USD + Estado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Origen</label>
                  <input
                    type="text"
                    value={form.origenReserva}
                    onChange={(e) => handleChange('origenReserva', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    placeholder="Booking..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nro Fact.</label>
                  <input
                    type="text"
                    value={form.nroFactura}
                    onChange={(e) => handleChange('nroFactura', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">USD</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.importeUsd}
                    onChange={(e) => handleChange('importeUsd', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    placeholder="US$"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => handleChange('estado', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  >
                    <option value="pre_reserva">Validar transferencia</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
              </div>

              {/* Fila 6: Notas */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                <textarea
                  value={form.notas}
                  onChange={(e) => handleChange('notas', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  rows={2}
                />
              </div>

              {modalError && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{modalError}</p>
              )}

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
