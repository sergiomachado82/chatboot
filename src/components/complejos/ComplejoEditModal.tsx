import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '../../utils/notify';
import { createComplejo, updateComplejo, deleteComplejo, createIcalFeed, deleteIcalFeed } from '../../api/complejoApi';
import { X, Plus, Trash2, Copy, Check } from 'lucide-react';
import type { Complejo, CrearComplejoRequest, IcalFeed } from '@shared/types/complejo';
import TarifaSection from './TarifaSection';
import MediaGallery from './MediaGallery';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';

type Tab = 'datos' | 'amenities' | 'politicas' | 'tarifas' | 'media' | 'reserva' | 'sync';

interface ComplejoEditModalProps {
  complejo: Complejo | null; // null = creating new
  onClose: () => void;
}

export default function ComplejoEditModal({ complejo, onClose }: ComplejoEditModalProps) {
  const { t } = useTranslation();
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
    mascotas: false,
    fumar: false,
    fiestas: false,
    autoResponderEmail: false,
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

  // iCal feeds state
  const [feeds, setFeeds] = useState<IcalFeed[]>([]);
  const [newFeedPlataforma, setNewFeedPlataforma] = useState('booking');
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
        mascotas: complejo.mascotas,
        fumar: complejo.fumar,
        fiestas: complejo.fiestas,
        autoResponderEmail: complejo.autoResponderEmail ?? false,
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
      setFeeds(complejo.icalFeeds ?? []);
    } else {
      initialFormRef.current = JSON.stringify(form);
      initialAmenitiesRef.current = JSON.stringify(amenities);
    }
  }, [complejo]);

  const isDirty =
    JSON.stringify(form) !== initialFormRef.current || JSON.stringify(amenities) !== initialAmenitiesRef.current;

  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);

  function handleCloseWithDirtyCheck() {
    if (isDirty) {
      setShowDirtyConfirm(true);
      return;
    }
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
        fumar: form.fumar,
        fiestas: form.fiestas,
        autoResponderEmail: form.autoResponderEmail,
        videoTour: form.videoTour || undefined,
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
    onError: (err: Error) => notify.error(err.message || t('common.errorGeneric')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteComplejo(complejo!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complejos'] });
      onClose();
    },
    onError: (err: Error) => notify.error(err.message || t('common.errorGeneric')),
  });

  function handleDelete() {
    if (confirm(t('complejos.deactivateConfirm'))) {
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

  async function handleAddFeed() {
    if (!complejo || !newFeedUrl.trim()) return;
    setFeedLoading(true);
    try {
      const feed = await createIcalFeed(complejo.id, {
        plataforma: newFeedPlataforma,
        url: newFeedUrl.trim(),
      });
      setFeeds([...feeds, feed]);
      setNewFeedUrl('');
      queryClient.invalidateQueries({ queryKey: ['complejos'] });
    } catch (err: unknown) {
      notify.error((err instanceof Error ? err.message : '') || t('complejos.errorAddFeed'));
    } finally {
      setFeedLoading(false);
    }
  }

  async function handleDeleteFeed(feedId: string) {
    if (!complejo) return;
    try {
      await deleteIcalFeed(complejo.id, feedId);
      setFeeds(feeds.filter((f) => f.id !== feedId));
      queryClient.invalidateQueries({ queryKey: ['complejos'] });
    } catch (err: unknown) {
      notify.error((err instanceof Error ? err.message : '') || t('complejos.errorDeleteFeed'));
    }
  }

  function handleCopyIcalUrl() {
    if (!complejo) return;
    const url = `${window.location.origin}/api/ical/${complejo.id}.ics`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'datos', label: t('complejos.tabDatos') },
    { key: 'amenities', label: t('complejos.tabAmenities') },
    { key: 'politicas', label: t('complejos.tabPoliticas') },
    { key: 'tarifas', label: t('complejos.tabTarifas') },
    { key: 'reserva', label: t('complejos.tabReservation') },
    { key: 'media', label: t('complejos.tabMedia') },
    { key: 'sync', label: t('complejos.tabSync') },
  ];

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complejo-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700">
          <h2 id="complejo-modal-title" className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {isNew ? t('complejos.titleNew') : `${t('complejos.titleEdit')} ${complejo.nombre}`}
          </h2>
          <button
            onClick={handleCloseWithDirtyCheck}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b dark:border-gray-700">
          {tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-t-md ${
                tab === tabItem.key
                  ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'datos' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label
                  htmlFor="complejo-nombre"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formName')}
                </label>
                <input
                  id="complejo-nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-tipo"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formType')}
                </label>
                <input
                  id="complejo-tipo"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  placeholder={t('complejos.formTypePlaceholder')}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-superficie"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formSurface')}
                </label>
                <input
                  id="complejo-superficie"
                  value={form.superficie}
                  onChange={(e) => setForm({ ...form, superficie: e.target.value })}
                  placeholder={t('complejos.formSurfacePlaceholder')}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="complejo-direccion"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formAddress')}
                </label>
                <input
                  id="complejo-direccion"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="complejo-ubicacion"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formLocation')}
                </label>
                <input
                  id="complejo-ubicacion"
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  placeholder={t('complejos.formLocationPlaceholder')}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-capacidad"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formCapacity')}
                </label>
                <input
                  id="complejo-capacidad"
                  type="number"
                  min={1}
                  value={form.capacidad}
                  onChange={(e) => setForm({ ...form, capacidad: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-cantidadUnidades"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formUnits')}
                </label>
                <input
                  id="complejo-cantidadUnidades"
                  type="number"
                  min={1}
                  value={form.cantidadUnidades}
                  onChange={(e) => setForm({ ...form, cantidadUnidades: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-dormitorios"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formBedrooms')}
                </label>
                <input
                  id="complejo-dormitorios"
                  type="number"
                  min={0}
                  value={form.dormitorios}
                  onChange={(e) => setForm({ ...form, dormitorios: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-banos"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formBathrooms')}
                </label>
                <input
                  id="complejo-banos"
                  type="number"
                  min={0}
                  value={form.banos}
                  onChange={(e) => setForm({ ...form, banos: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-estadiaMinima"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formMinStay')}
                </label>
                <input
                  id="complejo-estadiaMinima"
                  type="number"
                  min={0}
                  value={form.estadiaMinima}
                  onChange={(e) => setForm({ ...form, estadiaMinima: Number(e.target.value) })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-checkIn"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formCheckin')}
                </label>
                <input
                  id="complejo-checkIn"
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                  placeholder={t('complejos.formCheckinPlaceholder')}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="complejo-checkOut"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formCheckout')}
                </label>
                <input
                  id="complejo-checkOut"
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                  placeholder={t('complejos.formCheckoutPlaceholder')}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="complejo-videoTour"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.formVideoTour')}
                </label>
                <input
                  id="complejo-videoTour"
                  value={form.videoTour}
                  onChange={(e) => setForm({ ...form, videoTour: e.target.value })}
                  placeholder={t('complejos.formVideoTourPlaceholder')}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
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
                  placeholder={t('complejos.amenitiesPlaceholder')}
                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
                <button
                  onClick={addAmenity}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus size={14} />
                  {t('complejos.amenitiesAdd')}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded-full"
                  >
                    {a}
                    <button
                      onClick={() => setAmenities(amenities.filter((_, idx) => idx !== i))}
                      className="text-gray-400 hover:text-red-500"
                      aria-label={t('common.delete')}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {amenities.length === 0 && <p className="text-sm text-gray-400">{t('complejos.amenitiesNone')}</p>}
              </div>
            </div>
          )}

          {tab === 'politicas' && (
            <div className="space-y-3">
              {(
                [
                  { key: 'mascotas', label: t('complejos.policiesPets') },
                  { key: 'fumar', label: t('complejos.policiesSmoking') },
                  { key: 'fiestas', label: t('complejos.policiesParties') },
                  { key: 'autoResponderEmail', label: t('complejos.policiesAutoEmail') },
                ] as const
              ).map((p) => (
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">{p.label}</span>
                </label>
              ))}
            </div>
          )}

          {tab === 'tarifas' && !isNew && (
            <TarifaSection
              complejoId={complejo.id}
              tarifas={complejo.tarifas}
              tarifasEspeciales={complejo.tarifasEspeciales}
              bloqueos={complejo.bloqueos ?? []}
              cantidadUnidades={complejo.cantidadUnidades}
            />
          )}
          {tab === 'tarifas' && isNew && <p className="text-sm text-gray-400">{t('complejos.tarifasSaveFirst')}</p>}

          {tab === 'reserva' && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="complejo-porcentajeReserva"
                  className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                >
                  {t('complejos.reservationPercentage')}
                </label>
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
                    id="complejo-porcentajeReserva"
                    type="number"
                    min={0}
                    max={60}
                    value={form.porcentajeReserva}
                    onChange={(e) =>
                      setForm({ ...form, porcentajeReserva: Math.min(60, Math.max(0, Number(e.target.value))) })
                    }
                    className="w-16 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {form.porcentajeReserva === 0
                    ? t('complejos.reservationPercentageZero')
                    : t('complejos.reservationPercentageInfo', { pct: form.porcentajeReserva })}
                </p>
              </div>
              <div className="border-t dark:border-gray-700 pt-3"></div>
              <p className="text-xs text-gray-500">{t('complejos.bankDataInfo')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label
                    htmlFor="complejo-titularCuenta"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    {t('complejos.formAccountHolder')}
                  </label>
                  <input
                    id="complejo-titularCuenta"
                    value={form.titularCuenta}
                    onChange={(e) => setForm({ ...form, titularCuenta: e.target.value })}
                    placeholder={t('complejos.formAccountHolderPlaceholder')}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="complejo-banco"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    {t('complejos.formBank')}
                  </label>
                  <input
                    id="complejo-banco"
                    value={form.banco}
                    onChange={(e) => setForm({ ...form, banco: e.target.value })}
                    placeholder={t('complejos.formBankPlaceholder')}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="complejo-cuit"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    {t('complejos.formCuit')}
                  </label>
                  <input
                    id="complejo-cuit"
                    value={form.cuit}
                    onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                    placeholder={t('complejos.formCuitPlaceholder')}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="complejo-cbu"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    {t('complejos.formCbu')}
                  </label>
                  <input
                    id="complejo-cbu"
                    value={form.cbu}
                    onChange={(e) => setForm({ ...form, cbu: e.target.value })}
                    placeholder={t('complejos.formCbuPlaceholder')}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div className="col-span-2">
                  <label
                    htmlFor="complejo-aliasCbu"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    {t('complejos.formCbuAlias')}
                  </label>
                  <input
                    id="complejo-aliasCbu"
                    value={form.aliasCbu}
                    onChange={(e) => setForm({ ...form, aliasCbu: e.target.value })}
                    placeholder={t('complejos.formCbuAliasPlaceholder')}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('complejos.mercadoPagoTitle')}
                </h4>
                <p className="text-xs text-gray-500 mb-2">{t('complejos.mercadoPagoInfo')}</p>
                <div>
                  <label
                    htmlFor="complejo-linkMercadoPago"
                    className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1"
                  >
                    {t('complejos.mercadoPagoLink')}
                  </label>
                  <input
                    id="complejo-linkMercadoPago"
                    value={form.linkMercadoPago}
                    onChange={(e) => setForm({ ...form, linkMercadoPago: e.target.value })}
                    placeholder={t('complejos.mercadoPagoPlaceholder')}
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}

          {tab === 'media' && !isNew && <MediaGallery complejoId={complejo.id} media={complejo.media} />}
          {tab === 'media' && isNew && <p className="text-sm text-gray-400">{t('complejos.mediaSaveFirst')}</p>}

          {tab === 'sync' && !isNew && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('complejos.syncIcalTitle')}
                </h4>
                <p className="text-xs text-gray-500 mb-3">{t('complejos.syncIcalInfo')}</p>

                {/* Existing feeds */}
                {feeds.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {feeds.map((feed) => (
                      <div key={feed.id} className="flex items-center gap-2 bg-gray-50 rounded-md px-3 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {feed.plataforma}
                        </span>
                        <span className="flex-1 text-xs text-gray-600 truncate" title={feed.url}>
                          {feed.url}
                        </span>
                        {feed.ultimoSync && (
                          <span
                            className="text-xs text-gray-400"
                            title={`Ultimo sync: ${new Date(feed.ultimoSync).toLocaleString()}`}
                          >
                            {new Date(feed.ultimoSync).toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteFeed(feed.id)}
                          className="text-gray-400 hover:text-red-500"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new feed */}
                <div className="flex gap-2">
                  <select
                    value={newFeedPlataforma}
                    onChange={(e) => setNewFeedPlataforma(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="booking">Booking</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="vrbo">VRBO</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input
                    value={newFeedUrl}
                    onChange={(e) => setNewFeedUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFeed()}
                    placeholder="https://..."
                    className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    onClick={handleAddFeed}
                    disabled={!newFeedUrl.trim() || feedLoading}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Plus size={14} />
                    {t('common.add')}
                  </button>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('complejos.syncExportTitle')}
                </h4>
                <p className="text-xs text-gray-500 mb-2">{t('complejos.syncExportInfo')}</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/api/ical/${complejo.id}.ics`}
                    className="flex-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-gray-600 dark:text-gray-300"
                  />
                  <button
                    onClick={handleCopyIcalUrl}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
                  >
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {tab === 'sync' && isNew && <p className="text-sm text-gray-400">{t('complejos.syncSaveFirst')}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
              >
                <Trash2 size={14} />
                {t('common.deactivate')}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCloseWithDirtyCheck}
              className="text-sm px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!form.nombre || saveMutation.isPending}
              className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saveMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDirtyConfirm}
        title={t('common.unsavedTitle')}
        message={t('common.unsavedMessage')}
        confirmLabel={t('common.discard')}
        variant="warning"
        onConfirm={() => {
          setShowDirtyConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDirtyConfirm(false)}
      />
    </div>
  );
}
