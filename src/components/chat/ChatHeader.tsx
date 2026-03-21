import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, AlertCircle } from 'lucide-react';
import type { Conversacion } from '@shared/types/conversacion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notify } from '../../utils/notify';
import { tomarControl, devolverBot, cerrarConversacion } from '../../api/conversacionApi';
import { useHealth } from '../../hooks/useHealth';
import Badge, { estadoColor, estadoLabel } from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';

interface ChatHeaderProps {
  conversacion: Conversacion;
  onConversacionUpdate?: (conv: Conversacion) => void;
}

export default function ChatHeader({ conversacion, onConversacionUpdate }: ChatHeaderProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const health = useHealth();
  const nombre = conversacion.huesped?.nombre ?? conversacion.huesped?.waId ?? t('chat.noName');
  const waStatus = health?.services?.whatsapp?.status;
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);

  const invalidate = (updated: Conversacion) => {
    queryClient.invalidateQueries({ queryKey: ['conversaciones'] });
    onConversacionUpdate?.(updated);
  };

  const onError = (err: Error) => notify.error(err.message || t('common.errorGeneric'));
  const tomar = useMutation({ mutationFn: () => tomarControl(conversacion.id), onSuccess: invalidate, onError });
  const devolver = useMutation({ mutationFn: () => devolverBot(conversacion.id), onSuccess: invalidate, onError });
  const cerrar = useMutation({
    mutationFn: () => cerrarConversacion(conversacion.id),
    onSuccess: (updated) => {
      setShowConfirmCerrar(false);
      invalidate(updated);
    },
    onError,
  });

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
      <div>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{nombre}</h2>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge color={estadoColor(conversacion.estado)}>{estadoLabel(conversacion.estado)}</Badge>
          {conversacion.agente && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('chat.agentLabel')} {conversacion.agente.nombre}
            </span>
          )}
          {waStatus === 'error' ? (
            <span className="flex items-center gap-1 text-xs text-red-500" title="WhatsApp desconectado">
              <AlertCircle size={12} /> {t('chat.waOffline')}
            </span>
          ) : waStatus === 'ok' ? (
            <span className="flex items-center gap-1 text-xs text-green-500" title="WhatsApp conectado">
              <Smartphone size={12} /> {t('chat.waOnline')}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2">
        {(conversacion.estado === 'espera_humano' || conversacion.estado === 'bot') && (
          <button
            onClick={() => tomar.mutate()}
            disabled={tomar.isPending}
            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            aria-label={t('chat.takeControlAria')}
          >
            {t('chat.takeControl')}
          </button>
        )}
        {conversacion.estado === 'humano_activo' && (
          <button
            onClick={() => devolver.mutate()}
            disabled={devolver.isPending}
            className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {t('chat.returnToBot')}
          </button>
        )}
        {conversacion.estado !== 'cerrado' && (
          <button
            onClick={() => setShowConfirmCerrar(true)}
            disabled={cerrar.isPending}
            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {t('chat.closeConversation')}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={showConfirmCerrar}
        title={t('chat.closeConversationTitle')}
        message={t('chat.closeConversationMessage')}
        confirmLabel={t('chat.closeConversation')}
        variant="danger"
        loading={cerrar.isPending}
        onConfirm={() => cerrar.mutate()}
        onCancel={() => setShowConfirmCerrar(false)}
      />
    </div>
  );
}
