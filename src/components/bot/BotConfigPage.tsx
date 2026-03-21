import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '../../utils/notify';
import { Save, AlertTriangle, Info, Upload, Trash2, Building2, Plus, X } from 'lucide-react';
import { getBotConfig, updateBotConfig, uploadLogo, deleteLogo } from '../../api/botConfigApi';
import type { BotConfigUpdate } from '../../api/botConfigApi';

export default function BotConfigPage() {
  const queryClient = useQueryClient();
  const { data: config, isLoading, error } = useQuery({
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
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
      notify.success('Configuracion del bot actualizada');
      queryClient.invalidateQueries({ queryKey: ['bot-config'] });
    },
    onError: (err: Error) => {
      notify.error(err.message || 'Error al actualizar la configuracion');
    },
  });

  const logoUploadMutation = useMutation({
    mutationFn: (base64: string) => uploadLogo(base64),
    onSuccess: () => {
      notify.success('Logo actualizado');
      queryClient.invalidateQueries({ queryKey: ['bot-config'] });
    },
    onError: (err: Error) => notify.error(err.message || 'Error al subir el logo'),
  });

  const logoDeleteMutation = useMutation({
    mutationFn: () => deleteLogo(),
    onSuccess: () => {
      notify.success('Logo eliminado');
      setLogoPreview(null);
      queryClient.invalidateQueries({ queryKey: ['bot-config'] });
    },
    onError: (err: Error) => notify.error(err.message || 'Error al eliminar el logo'),
  });

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Solo se permiten archivos de imagen');
      return;
    }
    if (file.size > 500 * 1024) {
      notify.error('El archivo es demasiado grande (max 500KB)');
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
          <p className="text-red-600">Error al cargar la configuracion del bot</p>
          <p className="text-sm text-gray-500 mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Configuracion del Agente IA</h2>

        {/* Section 0: Logo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Logo del panel</h3>
          <p className="text-xs text-gray-500">Se muestra en la pantalla de login y recuperacion de contraseña. Max 500KB, formato PNG/JPG/SVG.</p>

          <div className="flex items-center gap-5">
            {/* Preview */}
            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <Building2 className="text-gray-300" size={32} />
              )}
            </div>

            {/* Actions */}
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
                {logoUploadMutation.isPending ? 'Subiendo...' : 'Subir logo'}
              </button>
              {logoPreview && (
                <button
                  onClick={() => logoDeleteMutation.mutate()}
                  disabled={logoDeleteMutation.isPending}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {logoDeleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Identity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Identidad del agente</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del agente <span className="text-gray-400 font-normal">({nombreAgente.length}/200)</span>
            </label>
            <input
              type="text"
              value={nombreAgente}
              onChange={(e) => setNombreAgente(e.target.value.slice(0, 200))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ubicacion <span className="text-gray-400 font-normal">({ubicacion.length}/300)</span>
            </label>
            <input
              type="text"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value.slice(0, 300))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tono <span className="text-gray-400 font-normal">({tono.length}/200)</span>
            </label>
            <input
              type="text"
              value={tono}
              onChange={(e) => setTono(e.target.value.slice(0, 200))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder="amable, profesional y cercano"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Idioma</label>
            <select
              value={idioma}
              onChange={(e) => setIdioma(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="es_AR">Espanol Argentina (voseo)</option>
              <option value="es">Espanol neutro</option>
              <option value="en">English</option>
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
            <label htmlFor="usarEmojis" className="text-sm text-gray-700 dark:text-gray-300">Usar emojis en las respuestas</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitud de respuesta</label>
            <select
              value={longitudRespuesta}
              onChange={(e) => setLongitudRespuesta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="corta">Corta (3-4 frases)</option>
              <option value="media">Media (5-7 frases)</option>
              <option value="detallada">Detallada (8-10 frases)</option>
            </select>
          </div>
        </div>

        {/* Section 2: Behavior */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Comportamiento</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto pre-reserva</p>
              <p className="text-xs text-gray-500">Crear pre-reserva automaticamente cuando el huesped confirma</p>
            </div>
            <Toggle checked={autoPreReserva} onChange={setAutoPreReserva} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Envio de fotos</label>
            <select
              value={modoEnvioFotos}
              onChange={(e) => setModoEnvioFotos(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="auto">Automatico (cuando el huesped pide fotos)</option>
              <option value="on_request">Solo cuando se solicita explicitamente</option>
              <option value="off">Desactivado</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Escalar quejas a agente</p>
              <p className="text-xs text-gray-500">Derivar automaticamente cuando se detecta una queja</p>
            </div>
            <Toggle checked={escalarSiQueja} onChange={setEscalarSiQueja} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Escalar pagos a agente</p>
              <p className="text-xs text-gray-500">Derivar cuando hay problemas con datos bancarios</p>
            </div>
            <Toggle checked={escalarSiPago} onChange={setEscalarSiPago} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titulares de cuenta verificados</label>
            <p className="text-xs text-gray-500 mb-2">
              Nombres de titulares bancarios autorizados. Si un departamento tiene datos bancarios con un titular que no esta en esta lista, el bot NO mostrara los datos y escalara a un agente.
            </p>
            <div className="space-y-2">
              {titularesVerificados.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">{t}</span>
                  <button
                    type="button"
                    onClick={() => setTitularesVerificados(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Eliminar"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nuevoTitular}
                  onChange={(e) => setNuevoTitular(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nuevoTitular.trim()) {
                      e.preventDefault();
                      setTitularesVerificados(prev => [...prev, nuevoTitular.trim()]);
                      setNuevoTitular('');
                    }
                  }}
                  placeholder="Nombre del titular..."
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (nuevoTitular.trim()) {
                      setTitularesVerificados(prev => [...prev, nuevoTitular.trim()]);
                      setNuevoTitular('');
                    }
                  }}
                  className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  title="Agregar"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefono de contacto</label>
            <input
              type="text"
              value={telefonoContacto}
              onChange={(e) => setTelefonoContacto(e.target.value.slice(0, 50))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Section: Reglas Personalizadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Reglas personalizadas</h3>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
            <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Las 10 reglas base del bot (precios, capacidad, flujo de reservas, datos bancarios, etc.) estan integradas en el sistema y no se pueden modificar. Aca podes agregar reglas adicionales que el bot va a seguir.
            </p>
          </div>

          {reglasPersonalizadas.length > 0 && (
            <div className="space-y-2">
              {reglasPersonalizadas.map((regla, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <span className="flex-shrink-0 w-6 text-right text-xs font-mono text-gray-400 mt-2">{i + 1}.</span>
                  <span className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200">{regla}</span>
                  <button
                    type="button"
                    onClick={() => setReglasPersonalizadas(prev => prev.filter((_, idx) => idx !== i))}
                    className="p-1 text-red-400 hover:text-red-600 opacity-50 group-hover:opacity-100 transition-opacity"
                    title="Eliminar regla"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {reglasPersonalizadas.length < 20 && (
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={nuevaRegla}
                onChange={(e) => setNuevaRegla(e.target.value.slice(0, 500))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nuevaRegla.trim()) {
                    e.preventDefault();
                    setReglasPersonalizadas(prev => [...prev, nuevaRegla.trim()]);
                    setNuevaRegla('');
                  }
                }}
                placeholder="Ej: No ofrecer descuentos sin autorizacion de un agente humano"
                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={() => {
                  if (nuevaRegla.trim()) {
                    setReglasPersonalizadas(prev => [...prev, nuevaRegla.trim()]);
                    setNuevaRegla('');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex-shrink-0"
              >
                <Plus size={14} />
                Agregar
              </button>
            </div>
          )}

          {nuevaRegla.length > 0 && (
            <p className="text-xs text-gray-400 text-right">{nuevaRegla.length}/500 caracteres</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div>
              <p className="font-medium mb-1">Ejemplos:</p>
              <ul className="space-y-0.5 text-gray-400">
                <li>"No ofrecer descuentos sin autorizacion de un agente humano"</li>
                <li>"El check-in es a las 14hs y el check-out a las 10hs"</li>
                <li>"Recomendar el depto Arrayanes para familias de 5+ personas"</li>
              </ul>
            </div>
            <span className="flex-shrink-0 ml-4">{reglasPersonalizadas.length}/20 reglas</span>
          </div>
        </div>

        {/* Section 3: Custom Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Mensajes personalizados</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje de bienvenida <span className="text-gray-400 font-normal">({mensajeBienvenida.length}/1000)</span>
            </label>
            <textarea
              value={mensajeBienvenida}
              onChange={(e) => setMensajeBienvenida(e.target.value.slice(0, 1000))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje de despedida <span className="text-gray-400 font-normal">({mensajeDespedida.length}/1000)</span>
            </label>
            <textarea
              value={mensajeDespedida}
              onChange={(e) => setMensajeDespedida(e.target.value.slice(0, 1000))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje fuera de horario <span className="text-gray-400 font-normal">({mensajeFueraHorario.length}/1000)</span>
            </label>
            <textarea
              value={mensajeFueraHorario}
              onChange={(e) => setMensajeFueraHorario(e.target.value.slice(0, 1000))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensaje espera humano <span className="text-gray-400 font-normal">({mensajeEsperaHumano.length}/1000)</span>
            </label>
            <textarea
              value={mensajeEsperaHumano}
              onChange={(e) => setMensajeEsperaHumano(e.target.value.slice(0, 1000))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Section 4: Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Horario de atencion</h3>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Estos campos se almacenan para uso futuro. Actualmente el bot responde las 24 horas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora inicio</label>
              <input
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora fin</label>
              <input
                type="time"
                value={horarioFin}
                onChange={(e) => setHorarioFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pb-6">
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
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
