import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertTarifa, createTarifaEspecial, deleteTarifaEspecialApi, createBloqueoApi, deleteBloqueoApi } from '../../api/complejoApi';
import { Trash2 } from 'lucide-react';
import type { Tarifa, TarifaEspecial, Bloqueo } from '@shared/types/complejo';

const TEMPORADAS = [
  { key: 'baja', label: 'Temp. Baja', desc: 'Mar-Jun, Ago-Nov' },
  { key: 'media', label: 'Temp. Media', desc: 'Jul, 1-14 Dic' },
  { key: 'alta', label: 'Temp. Alta', desc: '15 Dic - Feb' },
];

interface TarifaSectionProps {
  complejoId: string;
  tarifas: Tarifa[];
  tarifasEspeciales: TarifaEspecial[];
  bloqueos: Bloqueo[];
  cantidadUnidades: number;
}

export default function TarifaSection({ complejoId, tarifas, tarifasEspeciales, bloqueos, cantidadUnidades }: TarifaSectionProps) {
  const queryClient = useQueryClient();
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of tarifas) {
      map[t.temporada] = String(t.precioNoche);
    }
    return map;
  });
  const [minNights, setMinNights] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const t of tarifas) {
      map[t.temporada] = t.estadiaMinima ? String(t.estadiaMinima) : '';
    }
    return map;
  });

  // Special rate form
  const [teForm, setTeForm] = useState({
    fechaInicio: '',
    fechaFin: '',
    precioNoche: '',
    estadiaMinima: '',
    motivo: '',
  });

  const tarifaMutation = useMutation({
    mutationFn: (data: { temporada: string; precioNoche: number; estadiaMinima?: number | null }) =>
      upsertTarifa(complejoId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complejos'] }),
  });

  const createTeMutation = useMutation({
    mutationFn: (data: { fechaInicio: string; fechaFin: string; precioNoche: number; estadiaMinima?: number | null; motivo?: string | null }) =>
      createTarifaEspecial(complejoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complejos'] });
      setTeForm({ fechaInicio: '', fechaFin: '', precioNoche: '', estadiaMinima: '', motivo: '' });
    },
  });

  const deleteTeMutation = useMutation({
    mutationFn: (teId: string) => deleteTarifaEspecialApi(complejoId, teId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complejos'] }),
  });

  // Bloqueo form + mutations
  const [bloqueoForm, setBloqueoForm] = useState({ fechaInicio: '', fechaFin: '', motivo: '', unidades: '0' });

  const createBloqueoMutation = useMutation({
    mutationFn: (data: { fechaInicio: string; fechaFin: string; motivo?: string | null; unidades?: number }) =>
      createBloqueoApi(complejoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complejos'] });
      setBloqueoForm({ fechaInicio: '', fechaFin: '', motivo: '', unidades: '0' });
    },
  });

  const deleteBloqueoMutation = useMutation({
    mutationFn: (bloqueoId: string) => deleteBloqueoApi(complejoId, bloqueoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complejos'] }),
  });

  function handleCreateBloqueo() {
    if (!bloqueoForm.fechaInicio || !bloqueoForm.fechaFin) return;
    const unidades = Number(bloqueoForm.unidades) || 0;
    createBloqueoMutation.mutate({
      fechaInicio: bloqueoForm.fechaInicio,
      fechaFin: bloqueoForm.fechaFin,
      motivo: bloqueoForm.motivo || null,
      unidades,
    });
  }

  function handleDeleteBloqueo(bloqueoId: string) {
    if (confirm('Eliminar este bloqueo? Las fechas se liberaran si no hay reservas activas.')) {
      deleteBloqueoMutation.mutate(bloqueoId);
    }
  }

  function handleSave(temporada: string) {
    const val = Number(prices[temporada]);
    if (isNaN(val) || val < 0) return;
    const minVal = minNights[temporada] ? Number(minNights[temporada]) : null;
    if (minVal !== null && (isNaN(minVal) || minVal < 1)) return;
    tarifaMutation.mutate({ temporada, precioNoche: val, estadiaMinima: minVal });
  }

  function handleCreateTe() {
    const precio = Number(teForm.precioNoche);
    if (!teForm.fechaInicio || !teForm.fechaFin || isNaN(precio) || precio < 0) return;
    const minVal = teForm.estadiaMinima ? Number(teForm.estadiaMinima) : null;
    createTeMutation.mutate({
      fechaInicio: teForm.fechaInicio,
      fechaFin: teForm.fechaFin,
      precioNoche: precio,
      estadiaMinima: minVal,
      motivo: teForm.motivo || null,
    });
  }

  function handleDeleteTe(teId: string) {
    if (confirm('Eliminar esta tarifa especial? Los precios del inventario se restauraran a los estacionales.')) {
      deleteTeMutation.mutate(teId);
    }
  }

  return (
    <div className="space-y-6">
      {/* Seasonal rates */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tarifas por noche (ARS)</h4>
        <div className="space-y-2">
          {TEMPORADAS.map((t) => (
            <div key={t.key} className="flex items-center gap-3">
              <div className="w-36">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.label}</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500">{t.desc}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="number"
                  min={0}
                  value={prices[t.key] ?? ''}
                  onChange={(e) => setPrices({ ...prices, [t.key]: e.target.value })}
                  className="w-28 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Min noches</span>
                <input
                  type="number"
                  min={1}
                  value={minNights[t.key] ?? ''}
                  onChange={(e) => setMinNights({ ...minNights, [t.key]: e.target.value })}
                  className="w-16 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
                  placeholder="-"
                />
              </div>
              <button
                onClick={() => handleSave(t.key)}
                disabled={tarifaMutation.isPending}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Special rates */}
      <div className="space-y-3 border-t dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tarifas Especiales (overrides por fechas)</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">Precios custom que sobreescriben la tarifa estacional para un rango de fechas. Se sincronizan al inventario automaticamente.</p>

        {/* Existing special rates list */}
        {tarifasEspeciales.length > 0 && (
          <div className="space-y-1">
            {tarifasEspeciales.map((te) => (
              <div key={te.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded px-3 py-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(te.fechaInicio).toLocaleDateString('es-AR')} - {new Date(te.fechaFin).toLocaleDateString('es-AR')}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">${te.precioNoche.toLocaleString('es-AR')}/noche</span>
                {te.estadiaMinima && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">min {te.estadiaMinima}n</span>
                )}
                {te.motivo && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">{te.motivo}</span>
                )}
                <button
                  onClick={() => handleDeleteTe(te.id)}
                  disabled={deleteTeMutation.isPending}
                  className="ml-auto text-red-400 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        {tarifasEspeciales.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">Sin tarifas especiales</p>
        )}

        {/* Add new special rate form */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-3 space-y-2">
          <span className="text-xs font-medium text-blue-700">Agregar tarifa especial</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Fecha inicio</label>
              <input
                type="date"
                value={teForm.fechaInicio}
                onChange={(e) => setTeForm({ ...teForm, fechaInicio: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Fecha fin</label>
              <input
                type="date"
                value={teForm.fechaFin}
                onChange={(e) => setTeForm({ ...teForm, fechaFin: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Precio/noche</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">$</span>
                <input
                  type="number"
                  min={0}
                  value={teForm.precioNoche}
                  onChange={(e) => setTeForm({ ...teForm, precioNoche: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Min noches (opc.)</label>
              <input
                type="number"
                min={1}
                value={teForm.estadiaMinima}
                onChange={(e) => setTeForm({ ...teForm, estadiaMinima: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
                placeholder="-"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Motivo (opc.)</label>
              <input
                value={teForm.motivo}
                onChange={(e) => setTeForm({ ...teForm, motivo: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
                placeholder="Ej: Semana Santa, Fin de semana largo..."
              />
            </div>
          </div>
          <button
            onClick={handleCreateTe}
            disabled={createTeMutation.isPending || !teForm.fechaInicio || !teForm.fechaFin || !teForm.precioNoche}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createTeMutation.isPending ? 'Creando...' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* Bloqueos de Disponibilidad */}
      <div className="space-y-3 border-t dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-red-700">Bloqueos de Disponibilidad</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">Cerrar la disponibilidad para un rango de fechas (reparaciones, uso personal, etc). El bot no ofrecera el depto en esas fechas.</p>

        {bloqueos.length > 0 && (
          <div className="space-y-1">
            {bloqueos.map((b) => (
              <div key={b.id} className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 rounded px-3 py-2 text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(b.fechaInicio).toLocaleDateString('es-AR')} - {new Date(b.fechaFin).toLocaleDateString('es-AR')}
                </span>
                {cantidadUnidades > 1 && (
                  <span className="text-xs font-medium text-red-600">
                    {b.unidades === 0 ? `Todas (${cantidadUnidades})` : `${b.unidades} unidad${b.unidades > 1 ? 'es' : ''}`}
                  </span>
                )}
                {b.motivo && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">{b.motivo}</span>
                )}
                <button
                  onClick={() => handleDeleteBloqueo(b.id)}
                  disabled={deleteBloqueoMutation.isPending}
                  className="ml-auto text-red-400 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        {bloqueos.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">Sin bloqueos activos</p>
        )}

        <div className="bg-red-50 dark:bg-red-900/30 rounded p-3 space-y-2">
          <span className="text-xs font-medium text-red-700">Bloquear fechas</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Fecha inicio</label>
              <input
                type="date"
                value={bloqueoForm.fechaInicio}
                onChange={(e) => setBloqueoForm({ ...bloqueoForm, fechaInicio: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Fecha fin</label>
              <input
                type="date"
                value={bloqueoForm.fechaFin}
                onChange={(e) => setBloqueoForm({ ...bloqueoForm, fechaFin: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Motivo (opc.)</label>
              <input
                value={bloqueoForm.motivo}
                onChange={(e) => setBloqueoForm({ ...bloqueoForm, motivo: e.target.value })}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
                placeholder="Ej: Reparacion, uso personal..."
              />
            </div>
            {cantidadUnidades > 1 && (
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-0.5">Unidades a bloquear</label>
                <select
                  value={bloqueoForm.unidades}
                  onChange={(e) => setBloqueoForm({ ...bloqueoForm, unidades: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded px-2 py-1"
                >
                  <option value="0">Todas ({cantidadUnidades})</option>
                  {Array.from({ length: cantidadUnidades }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={String(n)}>{n} unidad{n > 1 ? 'es' : ''}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            onClick={handleCreateBloqueo}
            disabled={createBloqueoMutation.isPending || !bloqueoForm.fechaInicio || !bloqueoForm.fechaFin}
            className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {createBloqueoMutation.isPending ? 'Bloqueando...' : 'Bloquear fechas'}
          </button>
        </div>
      </div>
    </div>
  );
}
