import { useState } from 'react';
import { useEmails, useEmailStats } from '../../hooks/useEmails';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { deleteEmail } from '../../api/emailApi';
import Badge from '../ui/Badge';
import { TableSkeleton } from '../ui/Skeleton';
import EmailDetailModal from './EmailDetailModal';
import { Mail, CheckCircle, AlertTriangle, FileText, Search, Trash2 } from 'lucide-react';
import type { EmailProcesado } from '@shared/types/email';

type Filtro = 'todos' | 'respondidos' | 'errores' | 'formularios';

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number | undefined;
  icon: typeof Mail;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-bold text-gray-800">{value ?? '-'}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function EmailCard({ email, onClick, onDelete }: { email: EmailProcesado; onClick: () => void; onDelete: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{email.fromEmail}</p>
          <p className="text-xs text-gray-500 truncate">{email.subject || 'Sin asunto'}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge color={email.error ? 'red' : email.respondido ? 'green' : 'gray'}>
            {email.error ? 'Error' : email.respondido ? 'Respondido' : 'Pendiente'}
          </Badge>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{email.esFormulario ? 'Formulario' : 'Email directo'}</span>
        <span>{fmtDateTime(email.creadoEn)}</span>
      </div>
    </div>
  );
}

export default function EmailList() {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = {
    ...(filtro === 'respondidos' ? { respondido: true } : {}),
    ...(filtro === 'errores' ? { hasError: true } : {}),
    ...(filtro === 'formularios' ? { esFormulario: true } : {}),
    ...(search ? { search } : {}),
  };

  const queryClient = useQueryClient();
  const { data, isLoading } = useEmails(page, filters);
  const { data: stats } = useEmailStats();

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['emailStats'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Error al eliminar email'),
  });

  function handleDelete(id: string) {
    if (window.confirm('Seguro que queres eliminar este email?')) {
      deleteMut.mutate(id);
    }
  }

  const emails = data?.emails;
  const totalPages = data?.totalPages ?? 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleFiltroChange(f: Filtro) {
    setFiltro(f);
    setPage(1);
  }

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'respondidos', label: 'Respondidos' },
    { key: 'errores', label: 'Con error' },
    { key: 'formularios', label: 'Formularios' },
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Hoy" value={stats?.hoy} icon={Mail} color="bg-blue-100 text-blue-600" />
        <StatCard label="Respondidos" value={stats?.respondidos} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <StatCard label="Errores" value={stats?.errores} icon={AlertTriangle} color="bg-red-100 text-red-600" />
        <StatCard label="Formularios" value={stats?.formularios} icon={FileText} color="bg-purple-100 text-purple-600" />
      </div>

      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-800">Emails</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtros */}
          <div className="flex gap-1">
            {FILTROS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleFiltroChange(key)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                  filtro === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Busqueda */}
          <form onSubmit={handleSearch} className="flex gap-1">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Email o asunto..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="text-sm border border-gray-300 rounded-md pl-8 pr-3 py-1.5 w-48"
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="text-xs text-gray-500 hover:text-gray-700 px-2"
              >
                Limpiar
              </button>
            )}
          </form>
        </div>
      </div>

      {isLoading && <TableSkeleton rows={5} cols={5} />}

      {/* Mobile: Card view */}
      <div className="md:hidden space-y-3">
        {emails?.map((e) => (
          <EmailCard key={e.id} email={e} onClick={() => setSelectedId(e.id)} onDelete={() => handleDelete(e.id)} />
        ))}
        {emails?.length === 0 && (
          <div className="text-center text-gray-400 py-8">No hay emails</div>
        )}
      </div>

      {/* Desktop: Table view */}
      {!isLoading && (
        <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">De</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Asunto</th>
                <th className="text-center px-3 py-2 text-gray-600 font-medium">Tipo</th>
                <th className="text-center px-3 py-2 text-gray-600 font-medium">Estado</th>
                <th className="text-left px-3 py-2 text-gray-600 font-medium">Fecha</th>
                <th className="text-center px-3 py-2 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {emails?.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">{e.fromEmail}</td>
                  <td className="px-3 py-2 whitespace-nowrap max-w-[250px] truncate">{e.subject || 'Sin asunto'}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge color={e.esFormulario ? 'blue' : 'gray'}>
                      {e.esFormulario ? 'Formulario' : 'Email'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge color={e.error ? 'red' : e.respondido ? 'green' : 'gray'}>
                      {e.error ? 'Error' : e.respondido ? 'Respondido' : 'Pendiente'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDateTime(e.creadoEn)}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id); }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar"
                      aria-label="Eliminar email"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {emails?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No hay emails
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t rounded-b-lg">
          <span className="text-xs text-gray-500">
            Pag {page}/{totalPages} ({data?.total ?? 0})
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedId && (
        <EmailDetailModal
          emailId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
