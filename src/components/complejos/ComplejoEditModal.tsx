import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createComplejo, updateComplejo, deleteComplejo } from '../../api/complejoApi';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Complejo, CrearComplejoRequest } from '@shared/types/complejo';
import TarifaSection from './TarifaSection';
import MediaGallery from './MediaGallery';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';

type Tab = 'datos' | 'amenities' | 'politicas' | 'tarifas' | 'media' | 'reserva';

interface ComplejoEditModalProps {
  complejo: Complejo | null; // null = creating new
  onClose: () => void;
}

export default function ComplejoEditModal({ complejo, onClose }: ComplejoEditModalProps) {
  const queryClient = useQueryClient();
  const isNew = !complejo;
  const [tab, setTab] = useState<Tab>('datos');
  const initialFormRef = useRef<string>('');
  const initialAmenitiesRef = useRef<string>('[]');

  const [form, setForm] = useState({
    nombre: '',
    aliases: [] as string[],
    direccion: '',
    ubicacion: '',
    tipo: '',
    superficie: '',
    capacidad: 4,
    cantidadUnidades: 1,
    dormitorios: 1,
    banos: 1,
    checkIn: '14:00',
    checkOut: '10:00',
    estadiaMinima: 0,
    videoTour: '',
    icalUrl: '',
    mascotas: false,
    ninos: true,
    fumar: false,
    fiestas: false,
    titularCuenta: '',
    banco: '',
    cbu: '',
    aliasCbu: '',
    cuit: '',
    linkMercadoPago: '',
    porcentajeReserva: 30,
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (complejo) {
      const newForm = {
        nombre: complejo.nombre,
        aliases: complejo.aliases,
        direccion: complejo.direccion ?? '',
        ubicacion: complejo.ubicacion ?? '',
        tipo: complejo.tipo ?? '',
        superficie: complejo.superficie ?? '',
        capacidad: complejo.capacidad,
        cantidadUnidades: complejo.cantidadUnidades,
        dormitorios: complejo.dormitorios,
        banos: complejo.banos,
        checkIn: complejo.checkIn ?? '14:00',
        checkOut: complejo.checkOut ?? '10:00',
        estadiaMinima: complejo.estadiaMinima ?? 0,
        videoTour: complejo.videoTour ?? '',
        icalUrl: complejo.icalUrl ?? '',
        mascotas: complejo.mascotas,
        ninos: complejo.ninos,
        fumar: complejo.fumar,
        fiestas: complejo.fiestas,
        titularCuenta: complejo.titularCuenta ?? '',
        banco: complejo.banco ?? '',
        cbu: complejo.cbu ?? '',
        aliasCbu: complejo.aliasCbu ?? '',
        cuit: complejo.cuit ?? '',
        linkMercadoPago: complejo.linkMercadoPago ?? '',
        porcentajeReserva: complejo.porcentajeReserva ?? 30,
      };
      setForm(newForm);
      initialFormRef.current = JSON.stringify(newForm);
      setAmenities(complejo.amenities);
      initialAmenitiesRef.current = JSON.stringify(complejo.amenities);
    } else {
      initialFormRef.current = JSON.stringify(form);
      initialAmenitiesRef.current = JSON.stringify(amenities);
    }
  }, [complejo]);

  const isDirty = JSON.stringify(form) !== initialFormRef.current ||
    JSON.stringify(amenities) !== initialAmenitiesRef.current;

  function handleCloseWithDirtyCheck() {
    if (isDirty && !window.confirm('Hay cambios sin guardar. Seguro que queres cerrar?')) return;
    onClose();
  }

  const modalRef = useModalKeyboard(handleCloseWithDirtyCheck);

  const saveMutation = useMutation({
    mutationFn: () => {
      const data: CrearComplejoRequest = {
        nombre: form.nombre,
        aliases: form.aliases,
        direccion: form.direccion || undefined,
        ubicacion: form.ubicacion || undefined,
        tipo: form.tipo || undefined,
        superficie: form.superficie || undefined,
        capacidad: form.capacidad,
        cantidadUnidades: form.cantidadUnidades,
        dormitorios: form.dormitorios,
        banos: form.banos,
        amenities,
        checkIn: form.checkIn || undefined,
        checkOut: form.checkOut || undefined,
        estadiaMinima: form.estadiaMinima || undefined,
        mascotas: form.mascotas,
        ninos: form.ninos,
        fumar: form.fumar,
        fiestas: form.fiestas,
        videoTour: form.videoTour || undefined,
        icalUrl: form.icalUrl || undefined,
        titularCuenta: form.titularCuenta || undefined,
        banco: form.banco || undefined,
        cbu: form.cbu || undefined,
        aliasCbu: form.aliasCbu || undefined,
        cuit: form.cuit || undefined,
        linkMercadoPago: form.linkMercadoPago || undefined,
        porcentajeReserva: form.porcentajeReserva,
      };
      return isNew ? createComplejo(data) : updateComplejo(complejo.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complejos'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteComplejo(complejo!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complejos'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al desactivar'),
  });

  function handleDelete() {
    if (confirm('Desactivar este departamento?')) {
      deleteMutation.mutate();
    }
  }

  function addAmenity() {
    const trimmed = newAmenity.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
      setNewAmenity('');
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'datos', label: 'Datos' },
    { key: 'amenities', label: 'Amenities' },
    { key: 'politicas', label: 'Politicas' },
    { key: 'tarifas', label: 'Tarifas' },
    { key: 'reserva', label: 'Datos Reserva' },
    { key: 'media', label: 'Multimedia' },
  ];

  return (
    <div ref={modalRef} tabIndex={-1} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 outline-none">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            {isNew ? 'Nuevo Departamento' : `Editar: ${complejo.nombre}`}
          </h3>
          <button onClick={handleCloseWithDirtyCheck} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
                tab === t.key ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'datos' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <input
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  placeholder="Ej: Monoambiente, 2 ambientes"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Superficie</label>
                <input
                  value={form.superficie}
                  onChange={(e) => setForm({ ...form, superficie: e.target.value })}
                  placeholder="Ej: 35-40 m2"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Direccion</label>
                <input
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Ubicacion</label>
                <input
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  placeholder="Ej: a 2 cuadras de la playa"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Capacidad</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacidad}
                  onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cant. unidades</label>
                <input
                  type="number"
                  min={1}
                  value={form.cantidadUnidades}
                  onChange={(e) => setForm({ ...form, cantidadUnidades: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dormitorios</label>
                <input
                  type="number"
                  min={0}
                  value={form.dormitorios}
                  onChange={(e) => setForm({ ...form, dormitorios: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Banos</label>
                <input
                  type="number"
                  min={0}
                  value={form.banos}
                  onChange={(e) => setForm({ ...form, banos: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estadia minima (noches)</label>
                <input
                  type="number"
                  min={0}
                  value={form.estadiaMinima}
                  onChange={(e) => setForm({ ...form, estadiaMinima: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
                <input
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                  placeholder="14:00"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
                <input
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                  placeholder="10:00"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Video tour (URL)</label>
                <input
                  value={form.videoTour}
                  onChange={(e) => setForm({ ...form, videoTour: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Sincronizar Reservas - URL iCal Booking</label>
                <input
                  value={form.icalUrl}
                  onChange={(e) => setForm({ ...form, icalUrl: e.target.value })}
                  placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?t=..."
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                />
              </div>
            </div>
          )}

          {tab === 'amenities' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAmenity()}
                  placeholder="Nuevo amenity..."
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5"
                />
                <button
                  onClick={addAmenity}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus size={14} />
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded">
                    {a}
                    <button
                      onClick={() => setAmenities(amenities.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {amenities.length === 0 && (
                  <p className="text-sm text-gray-400">Sin amenities agregados</p>
                )}
              </div>
            </div>
          )}

          {tab === 'politicas' && (
            <div className="space-y-3">
              {([
                { key: 'mascotas', label: 'Mascotas permitidas' },
                { key: 'ninos', label: 'Ninos permitidos' },
                { key: 'fumar', label: 'Se permite fumar' },
                { key: 'fiestas', label: 'Fiestas permitidas' },
              ] as const).map((p) => (
                <label key={p.key} className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      form[p.key] ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    onClick={() => setForm({ ...form, [p.key]: !form[p.key] })}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form[p.key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-700">{p.label}</span>
                </label>
              ))}
            </div>
          )}

          {tab === 'tarifas' && !isNew && (
            <TarifaSection complejoId={complejo.id} tarifas={complejo.tarifas} tarifasEspeciales={complejo.tarifasEspeciales} bloqueos={complejo.bloqueos ?? []} cantidadUnidades={complejo.cantidadUnidades} />
          )}
          {tab === 'tarifas' && isNew && (
            <p className="text-sm text-gray-400">Guarda el departamento primero para agregar tarifas.</p>
          )}

          {tab === 'reserva' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Porcentaje para reserva (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={5}
                    value={form.porcentajeReserva}
                    onChange={(e) => setForm({ ...form, porcentajeReserva: Number(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.porcentajeReserva}
                    onChange={(e) => setForm({ ...form, porcentajeReserva: Math.min(60, Math.max(0, Number(e.target.value))) })}
                    className="w-16 text-sm text-center border border-gray-300 rounded px-2 py-1.5"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {form.porcentajeReserva === 0
                    ? '0% = reserva de palabra (sin deposito)'
                    : `El huesped debera abonar el ${form.porcentajeReserva}% del total como sena`}
                </p>
              </div>
              <div className="border-t pt-3"></div>
              <p className="text-xs text-gray-500">Datos bancarios para el pago de la sena. El bot los compartira con el huesped cuando confirme la reserva.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Titular de la cuenta</label>
                  <input
                    value={form.titularCuenta}
                    onChange={(e) => setForm({ ...form, titularCuenta: e.target.value })}
                    placeholder="Nombre completo del titular"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
                  <input
                    value={form.banco}
                    onChange={(e) => setForm({ ...form, banco: e.target.value })}
                    placeholder="Ej: Banco Nacion"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">CUIT/CUIL</label>
                  <input
                    value={form.cuit}
                    onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                    placeholder="XX-XXXXXXXX-X"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">CBU</label>
                  <input
                    value={form.cbu}
                    onChange={(e) => setForm({ ...form, cbu: e.target.value })}
                    placeholder="22 digitos"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alias CBU</label>
                  <input
                    value={form.aliasCbu}
                    onChange={(e) => setForm({ ...form, aliasCbu: e.target.value })}
                    placeholder="Ej: MI.ALIAS.MP"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                  />
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Pago con tarjeta (MercadoPago)</h4>
                <p className="text-xs text-gray-500 mb-2">Link de pago para sena con tarjeta de credito (recargo 8%).</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Link de MercadoPago</label>
                  <input
                    value={form.linkMercadoPago}
                    onChange={(e) => setForm({ ...form, linkMercadoPago: e.target.value })}
                    placeholder="https://www.mercadopago.com.ar/..."
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'media' && !isNew && (
            <MediaGallery complejoId={complejo.id} media={complejo.media} />
          )}
          {tab === 'media' && isNew && (
            <p className="text-sm text-gray-400">Guarda el departamento primero para agregar multimedia.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50">
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
              >
                <Trash2 size={14} />
                Desactivar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCloseWithDirtyCheck}
              className="text-sm px-4 py-1.5 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!form.nombre || saveMutation.isPending}
              className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
