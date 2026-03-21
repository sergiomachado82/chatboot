import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '../../utils/notify';
import { Save, AlertTriangle, Upload, Trash2, Building2, Plus, X, ChevronDown, History } from 'lucide-react';
import { getBotConfig, updateBotConfig, uploadLogo, deleteLogo, getBotConfigHistory } from '../../api/botConfigApi';
import type { BotConfigUpdate, BotConfigAuditEntry } from '../../api/botConfigApi';

type BotTab = 'identidad' | 'comportamiento' | 'reglas' | 'mensajes';

const BOT_TAB_KEYS: { key: BotTab; labelKey: string }[] = [
  { key: 'identidad', labelKey: 'bot.tabIdentity' },
  { key: 'comportamiento', labelKey: 'bot.tabBehavior' },
  { key: 'reglas', labelKey: 'bot.tabRules' },
  { key: 'mensajes', labelKey: 'bot.tabMessages' },
];

export default function BotConfigPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bot-config'],
    queryFn: getBotConfig,
  });

  const [nombreAgente, setNombreAgente] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [tono, setTono] = useState('');
  const [idioma, setIdioma] = useState('es_AR');
  const [usarEmojis, setUsarEmojis] = useState(false);
  const [longitudRespuesta, setLongitudRespuesta] = useState('corta');
  const [autoPreReserva, setAutoPreReserva] = useState(true);
  const [modoEnvioFotos, setModoEnvioFotos] = useState('auto');
  const [escalarSiQueja, setEscalarSiQueja] = useState(true);
  const [escalarSiPago, setEscalarSiPago] = useState(true);
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  const [mensajeDespedida, setMensajeDespedida] = useState('');
  const [mensajeFueraHorario, setMensajeFueraHorario] = useState('');
  const [mensajeEsperaHumano, setMensajeEsperaHumano] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFin, setHorarioFin] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [titularesVerificados, setTitularesVerificados] = useState<string[]>([]);
  const [nuevoTitular, setNuevoTitular] = useState('');
  const [reglasPersonalizadas, setReglasPersonalizadas] = useState<string[]>([]);
  const [nuevaRegla, setNuevaRegla] = useState('');
  const [mostrarReglasBase, setMostrarReglasBase] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BotTab>('identidad');
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (config) {
      setNombreAgente(config.nombreAgente);
      setUbicacion(config.ubicacion);
      setTono(config.tono);
      setIdioma(config.idioma);
      setUsarEmojis(config.usarEmojis);
      setLongitudRespuesta(config.longitudRespuesta);
      setAutoPreReserva(config.autoPreReserva);
      setModoEnvioFotos(config.modoEnvioFotos);
      setEscalarSiQueja(config.escalarSiQueja);
      setEscalarSiPago(config.escalarSiPago);
      setMensajeBienvenida(config.mensajeBienvenida);
      setMensajeDespedida(config.mensajeDespedida);
      setMensajeFueraHorario(config.mensajeFueraHorario);
      setMensajeEsperaHumano(config.mensajeEsperaHumano);
      setHorarioInicio(config.horarioInicio ?? '');
      setHorarioFin(config.horarioFin ?? '');
      setTelefonoContacto(config.telefonoContacto);
      setTitularesVerificados(config.titularesVerificados ?? []);
      setReglasPersonalizadas(config.reglasPersonalizadas ?? []);
      setLogoPreview((config as Record<string, unknown>).logo as string | null);
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: (data: BotConfigUpdate) => updateBotConfig(data),
    onSuccess: () => {
      notify.success(t('bot.successUpdate'));
      queryClient.invalidateQueries({ queryKey: ['bot-config'] });
    },
    onError: (err: Error) => {
      notify.error(err.message || t('bot.errorUpdate'));
    },
  });

  const logoUploadMutation = useMutation({
    mutationFn: (base64: string) => uploadLogo(base64),
    onSuccess: () => {
      notify.success(t('bot.logoUpdated'));
      queryClient.invalidateQueries({ queryKey: ['bot-config'] });
    },
    onError: (err: Error) => notify.error(err.message || t('bot.errorLogoUpload')),
  });

  const logoDeleteMutation = useMutation({
    mutationFn: () => deleteLogo(),
    onSuccess: () => {
      notify.success(t('bot.logoDeletedSuccess'));
      setLogoPreview(null);
      queryClient.invalidateQueries({ queryKey: ['bot-config'] });
    },
    onError: (err: Error) => notify.error(err.message || t('bot.errorLogoDelete')),
  });

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error(t('bot.errorFileType'));
      return;
    }
    if (file.size > 500 * 1024) {
      notify.error(t('bot.errorFileSize'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      logoUploadMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function handleSave() {
    mutation.mutate({
      nombreAgente,
      ubicacion,
      tono,
      idioma,
      usarEmojis,
      longitudRespuesta,
      autoPreReserva,
      modoEnvioFotos,
      escalarSiQueja,
      escalarSiPago,
      mensajeBienvenida,
      mensajeDespedida,
      mensajeFueraHorario,
      mensajeEsperaHumano,
      horarioInicio: horarioInicio || null,
      horarioFin: horarioFin || null,
      telefonoContacto,
      titularesVerificados,
      reglasPersonalizadas,
    });
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-2 text-red-500" size={32} />
          <p className="text-red-600">{t('bot.errorLoading')}</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('bot.title')}</h1>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
          {BOT_TAB_KEYS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-700 dark:text-blue-300'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {activeTab === 'identidad' && (
          <>
            {/* Logo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t('bot.panelLogo')}
              </h3>
              <p className="text-xs text-gray-500">{t('bot.logoInfo')}</p>

              <div className="flex items-center gap-5">
                <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Building2 className="text-gray-300" size={32} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoUploadMutation.isPending}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {logoUploadMutation.isPending ? t('bot.logoUploading') : t('bot.logoUpload')}
                  </button>
                  {logoPreview && (
                    <button
                      onClick={() => logoDeleteMutation.mutate()}
                      disabled={logoDeleteMutation.isPending}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {logoDeleteMutation.isPending ? t('bot.logoDeleting') : t('bot.logoDelete')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Identity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t('bot.identityPanel')}
              </h3>

              <div>
                <label
                  htmlFor="bot-nombreAgente"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('bot.agentName')} <span className="text-gray-500 font-normal">({nombreAgente.length}/200)</span>
                </label>
                <input
                  id="bot-nombreAgente"
                  type="text"
                  value={nombreAgente}
                  onChange={(e) => setNombreAgente(e.target.value.slice(0, 200))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="bot-ubicacion"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('bot.location')} <span className="text-gray-500 font-normal">({ubicacion.length}/300)</span>
                </label>
                <input
                  id="bot-ubicacion"
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value.slice(0, 300))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="bot-tono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('bot.tone')} <span className="text-gray-500 font-normal">({tono.length}/200)</span>
                </label>
                <input
                  id="bot-tono"
                  type="text"
                  value={tono}
                  onChange={(e) => setTono(e.target.value.slice(0, 200))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                  placeholder={t('bot.tonePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="bot-idioma" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('bot.language')}
                </label>
                <select
                  id="bot-idioma"
                  value={idioma}
                  onChange={(e) => setIdioma(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="es_AR">{t('bot.langSpanishAr')}</option>
                  <option value="es">{t('bot.langSpanishNeutral')}</option>
                  <option value="en">{t('bot.langEnglish')}</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="usarEmojis"
                  checked={usarEmojis}
                  onChange={(e) => setUsarEmojis(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="usarEmojis" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('bot.useEmojis')}
                </label>
              </div>

              <div>
                <label
                  htmlFor="bot-longitudRespuesta"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('bot.responseLength')}
                </label>
                <select
                  id="bot-longitudRespuesta"
                  value={longitudRespuesta}
                  onChange={(e) => setLongitudRespuesta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="corta">{t('bot.responseLengthShort')}</option>
                  <option value="media">{t('bot.responseLengthMedium')}</option>
                  <option value="detallada">{t('bot.responseLengthDetailed')}</option>
                </select>
              </div>
            </div>
          </>
        )}

        {activeTab === 'comportamiento' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bot.autoPreReservation')}</p>
                <p className="text-xs text-gray-500">{t('bot.autoPreReservationInfo')}</p>
              </div>
              <Toggle checked={autoPreReserva} onChange={setAutoPreReserva} />
            </div>

            <div>
              <label
                htmlFor="bot-modoEnvioFotos"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('bot.photoSend')}
              </label>
              <select
                id="bot-modoEnvioFotos"
                value={modoEnvioFotos}
                onChange={(e) => setModoEnvioFotos(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="auto">{t('bot.photoSendAuto')}</option>
                <option value="on_request">{t('bot.photoSendOnRequest')}</option>
                <option value="off">{t('bot.photoSendOff')}</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bot.escalateComplaints')}</p>
                <p className="text-xs text-gray-500">{t('bot.escalateComplaintsInfo')}</p>
              </div>
              <Toggle checked={escalarSiQueja} onChange={setEscalarSiQueja} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bot.escalatePayments')}</p>
                <p className="text-xs text-gray-500">{t('bot.escalatePaymentsInfo')}</p>
              </div>
              <Toggle checked={escalarSiPago} onChange={setEscalarSiPago} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('bot.verifiedAccountHolders')}
              </label>
              <p className="text-xs text-gray-500 mb-2">{t('bot.verifiedAccountHoldersInfo')}</p>
              <div className="space-y-2">
                {titularesVerificados.map((titular, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                      {titular}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTitularesVerificados((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 text-red-400 hover:text-red-600"
                      title={t('bot.accountHolderDelete')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    id="bot-nuevoTitular"
                    type="text"
                    value={nuevoTitular}
                    onChange={(e) => setNuevoTitular(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nuevoTitular.trim()) {
                        e.preventDefault();
                        setTitularesVerificados((prev) => [...prev, nuevoTitular.trim()]);
                        setNuevoTitular('');
                      }
                    }}
                    placeholder={t('bot.accountHolderPlaceholder')}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (nuevoTitular.trim()) {
                        setTitularesVerificados((prev) => [...prev, nuevoTitular.trim()]);
                        setNuevoTitular('');
                      }
                    }}
                    className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    title={t('common.add')}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="bot-telefonoContacto"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('bot.contactPhone')}
              </label>
              <input
                id="bot-telefonoContacto"
                type="text"
                value={telefonoContacto}
                onChange={(e) => setTelefonoContacto(e.target.value.slice(0, 50))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {activeTab === 'reglas' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t('bot.rulesPanel')}
            </h3>

            {/* Reglas base R1-R10 (solo lectura, colapsable) */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarReglasBase(!mostrarReglasBase)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {t('bot.baseRulesLabel')}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                    {t('bot.baseRulesReadOnly')}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${mostrarReglasBase ? 'rotate-180' : ''}`}
                />
              </button>
              {mostrarReglasBase && (
                <div className="px-4 py-3 space-y-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <div key={n} className="flex gap-2">
                      <span className="flex-shrink-0 w-6 text-right font-mono text-gray-400">{n}.</span>
                      <span>{t(`bot.baseRule${n}`)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reglas personalizadas (editables) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('bot.customRulesLabel')}</p>
                <span className="text-xs text-gray-400">
                  {reglasPersonalizadas.length}/20 {t('bot.customRulesCount')}
                </span>
              </div>

              {reglasPersonalizadas.length > 0 && (
                <div className="space-y-2 mb-3">
                  {reglasPersonalizadas.map((regla, i) => (
                    <div key={i} className="flex items-start gap-2 group">
                      <span className="flex-shrink-0 w-6 text-right text-xs font-mono text-gray-400 mt-2">
                        {11 + i}.
                      </span>
                      <span className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200">
                        {regla}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReglasPersonalizadas((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1 text-red-400 hover:text-red-600 opacity-50 group-hover:opacity-100 transition-opacity"
                        title={t('bot.customRuleDelete')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {reglasPersonalizadas.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">{t('bot.customRulesNone')}</p>
              )}

              {reglasPersonalizadas.length < 20 && (
                <div className="flex items-start gap-2">
                  <input
                    id="bot-nuevaRegla"
                    type="text"
                    value={nuevaRegla}
                    onChange={(e) => setNuevaRegla(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nuevaRegla.trim()) {
                        e.preventDefault();
                        setReglasPersonalizadas((prev) => [...prev, nuevaRegla.trim()]);
                        setNuevaRegla('');
                      }
                    }}
                    placeholder={t('bot.customRulePlaceholder')}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (nuevaRegla.trim()) {
                        setReglasPersonalizadas((prev) => [...prev, nuevaRegla.trim()]);
                        setNuevaRegla('');
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex-shrink-0"
                  >
                    <Plus size={14} />
                    {t('bot.customRuleAdd')}
                  </button>
                </div>
              )}

              {nuevaRegla.length > 0 && (
                <p className="text-xs text-gray-400 text-right mt-1">{nuevaRegla.length}/500 caracteres</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mensajes' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              {t('bot.messagesPanel')}
            </h3>

            <div>
              <label
                htmlFor="bot-mensajeBienvenida"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('bot.welcomeMessage')}{' '}
                <span className="text-gray-500 font-normal">({mensajeBienvenida.length}/1000)</span>
              </label>
              <textarea
                id="bot-mensajeBienvenida"
                value={mensajeBienvenida}
                onChange={(e) => setMensajeBienvenida(e.target.value.slice(0, 1000))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="bot-mensajeDespedida"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('bot.goodbyeMessage')}{' '}
                <span className="text-gray-500 font-normal">({mensajeDespedida.length}/1000)</span>
              </label>
              <textarea
                id="bot-mensajeDespedida"
                value={mensajeDespedida}
                onChange={(e) => setMensajeDespedida(e.target.value.slice(0, 1000))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="bot-mensajeFueraHorario"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('bot.offHoursMessage')}{' '}
                <span className="text-gray-500 font-normal">({mensajeFueraHorario.length}/1000)</span>
              </label>
              <textarea
                id="bot-mensajeFueraHorario"
                value={mensajeFueraHorario}
                onChange={(e) => setMensajeFueraHorario(e.target.value.slice(0, 1000))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="bot-mensajeEsperaHumano"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('bot.waitingMessage')}{' '}
                <span className="text-gray-500 font-normal">({mensajeEsperaHumano.length}/1000)</span>
              </label>
              <textarea
                id="bot-mensajeEsperaHumano"
                value={mensajeEsperaHumano}
                onChange={(e) => setMensajeEsperaHumano(e.target.value.slice(0, 1000))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3 pb-6">
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            {mutation.isPending ? t('common.saving') : t('bot.saveChanges')}
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <History size={16} />
            {t('bot.historyButton')}
          </button>
        </div>

        {showHistory && <ConfigHistory />}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

const FIELD_LABEL_KEYS: Record<string, string> = {
  nombreAgente: 'bot.historyFieldAgentName',
  ubicacion: 'bot.historyFieldLocation',
  tono: 'bot.historyFieldTone',
  idioma: 'bot.historyFieldLanguage',
  usarEmojis: 'bot.historyFieldEmojis',
  longitudRespuesta: 'bot.historyFieldResponseLength',
  autoPreReserva: 'bot.historyFieldAutoPreReservation',
  modoEnvioFotos: 'bot.historyFieldPhotoSend',
  escalarSiQueja: 'bot.historyFieldEscalateComplaints',
  escalarSiPago: 'bot.historyFieldEscalatePayments',
  mensajeBienvenida: 'bot.historyFieldWelcome',
  mensajeDespedida: 'bot.historyFieldGoodbye',
  mensajeFueraHorario: 'bot.historyFieldOffHours',
  mensajeEsperaHumano: 'bot.historyFieldWaiting',
  telefonoContacto: 'bot.historyFieldContactPhone',
  titularesVerificados: 'bot.historyFieldVerifiedHolders',
  reglasPersonalizadas: 'bot.historyFieldCustomRules',
  logo: 'bot.historyFieldLogo',
};

function ConfigHistory() {
  const { t } = useTranslation();
  const { data: history, isLoading } = useQuery({
    queryKey: ['bot-config-history'],
    queryFn: () => getBotConfigHistory(30),
  });

  if (isLoading) return <p className="text-sm text-gray-500 py-4">{t('bot.historyLoading')}</p>;
  if (!history || history.length === 0)
    return <p className="text-sm text-gray-500 py-4">{t('bot.historyNoChanges')}</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
        {t('bot.historyTitle')}
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.map((entry: BotConfigAuditEntry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 text-xs border-b border-gray-100 dark:border-gray-700 pb-2"
          >
            <span className="text-gray-400 whitespace-nowrap flex-shrink-0">
              {new Date(entry.creadoEn).toLocaleString('es', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="min-w-0">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {FIELD_LABEL_KEYS[entry.campo] ? t(FIELD_LABEL_KEYS[entry.campo]) : entry.campo}
              </span>
              {entry.valorAnterior != null && entry.valorAnterior.length < 80 && (
                <span className="text-gray-400 ml-1">
                  <span className="line-through">{entry.valorAnterior}</span>
                  {' → '}
                  <span className="text-gray-600 dark:text-gray-200">{entry.valorNuevo}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
