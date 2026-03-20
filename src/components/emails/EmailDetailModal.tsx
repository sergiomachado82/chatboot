import { useQuery } from '@tanstack/react-query';
import { getEmail } from '../../api/emailApi';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import Badge from '../ui/Badge';
import { X } from 'lucide-react';

interface Props {
  emailId: string;
  onClose: () => void;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tryParseFormFields(body: string | null): Record<string, string> | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // not JSON
  }
  return null;
}

const FORM_FIELD_LABELS: Record<string, string> = {
  nombre: 'Nombre',
  email: 'Email',
  telefono: 'Telefono',
  complejo: 'Complejo',
  huespedes: 'Huespedes',
  fechaIngreso: 'Fecha ingreso',
  fechaSalida: 'Fecha salida',
  mensaje: 'Mensaje',
};

export default function EmailDetailModal({ emailId, onClose }: Props) {
  const { data: email, isLoading } = useQuery({
    queryKey: ['emails', emailId],
    queryFn: () => getEmail(emailId),
  });

  const modalRef = useModalKeyboard(onClose);

  const formFields = email?.esFormulario ? tryParseFormFields(email.bodyOriginal) : null;

  return (
    <div ref={modalRef} tabIndex={-1} className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 outline-none">
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {isLoading ? 'Cargando...' : email?.subject || 'Sin asunto'}
            </h3>
            {email && (
              <Badge color={email.error ? 'red' : email.respondido ? 'green' : 'gray'}>
                {email.error ? 'Error' : email.respondido ? 'Respondido' : 'Pendiente'}
              </Badge>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : email ? (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs">De</span>
                <p className="text-gray-800">{email.fromEmail}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Fecha</span>
                <p className="text-gray-800">{fmtDateTime(email.creadoEn)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Tipo</span>
                <p className="text-gray-800">{email.esFormulario ? 'Formulario web' : 'Email directo'}</p>
              </div>
              {email.complejoId && (
                <div>
                  <span className="text-gray-400 text-xs">Complejo ID</span>
                  <p className="text-gray-800 text-xs break-all">{email.complejoId}</p>
                </div>
              )}
            </div>

            {/* Error */}
            {email.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-xs font-medium text-red-700">Error</span>
                <p className="text-sm text-red-600 mt-1">{email.error}</p>
              </div>
            )}

            {/* Email original */}
            {email.bodyOriginal && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Email original</h4>
                {formFields ? (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    {Object.entries(formFields).map(([key, value]) => (
                      value ? (
                        <div key={key} className="text-sm">
                          <span className="text-gray-500">{FORM_FIELD_LABELS[key] || key}: </span>
                          <span className="text-gray-800">{value}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-sans">{email.bodyOriginal}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Respuesta enviada */}
            {email.respuestaEnviada && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Respuesta enviada</h4>
                <div className="bg-blue-50 rounded-lg p-3">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words font-sans">{email.respuestaEnviada}</pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400">Email no encontrado</div>
        )}
      </div>
    </div>
  );
}
