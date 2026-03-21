import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Calendar, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConversaciones } from '../../hooks/useConversaciones';
import { useUnread } from '../../hooks/useUnread';
import { deleteConversaciones } from '../../api/conversacionApi';
import { notify } from '../../utils/notify';
import ChatListItem from './ChatListItem';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { Conversacion } from '@shared/types/conversacion';
import type { SearchConversacionesParams } from '../../api/conversacionApi';

type Filter = 'all' | 'espera_humano' | 'humano_activo' | 'bot' | 'cerrado';

interface ChatListProps {
  selectedId: string | null;
  onSelect: (conv: Conversacion) => void;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'espera_humano', label: 'En espera' },
  { key: 'humano_activo', label: 'Mis chats' },
  { key: 'bot', label: 'Bot' },
  { key: 'cerrado', label: 'Cerradas' },
];

export default function ChatList({ selectedId, onSelect }: ChatListProps) {
  const { markAsRead, isUnread } = useUnread();
  const [filter, setFilter] = useState<Filter>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteConversaciones(ids),
    onSuccess: (data) => {
      notify.success(`${data.deletedCount} conversacion${data.deletedCount === 1 ? '' : 'es'} eliminada${data.deletedCount === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] });
      setShowDeleteConfirm(false);
      setSelectMode(false);
      setSelectedIds(new Set());
    },
    onError: () => {
      notify.error('Error al eliminar conversaciones');
    },
  });

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    if (!conversaciones) return;
    if (selectedIds.size === conversaciones.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversaciones.map((c) => c.id)));
    }
  }

  function handleDelete() {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  }

  function handleCancelSelect() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  // Debounce text input
  const handleTextChange = useCallback((value: string) => {
    setSearchText(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedText(value), 400);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const hasActiveSearch = debouncedText.length >= 2 || dateFrom || dateTo;

  const queryParams: SearchConversacionesParams = {
    ...(filter !== 'all' ? { estado: filter } : {}),
    ...(debouncedText.length >= 2 ? { search: debouncedText } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  };

  const { data: conversaciones, isLoading, isSearchActive } = useConversaciones(queryParams);

  function handleCloseSearch() {
    setSearchOpen(false);
    setSearchText('');
    setDebouncedText('');
    setDateFrom('');
    setDateTo('');
    clearTimeout(debounceRef.current);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-1 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`px-2 py-1 text-xs rounded-full ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Selection bar */}
      {selectMode && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
          <input
            type="checkbox"
            checked={conversaciones != null && conversaciones.length > 0 && selectedIds.size === conversaciones.length}
            onChange={handleSelectAll}
            className="accent-red-600"
          />
          <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
            {selectedIds.size > 0
              ? `${selectedIds.size} seleccionada${selectedIds.size === 1 ? '' : 's'}`
              : 'Seleccionar conversaciones'}
          </span>
          <button
            onClick={handleDelete}
            disabled={selectedIds.size === 0 || deleteMutation.isPending}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
          <button
            onClick={handleCancelSelect}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Search toggle / panel */}
      {!searchOpen ? (
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex-1"
          >
            <Search size={14} />
            Buscar en conversaciones
          </button>
          {!selectMode && (
            <button
              onClick={() => setSelectMode(true)}
              className="px-3 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
              title="Seleccionar para eliminar"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Buscar texto (min 2 chars)..."
              className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
              autoFocus
            />
            <button onClick={handleCloseSearch} className="text-gray-400 hover:text-gray-600" title="Cerrar busqueda">
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            />
            <span className="text-gray-400">a</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          {hasActiveSearch && (
            <p className="text-xs text-gray-500">
              {isLoading
                ? 'Buscando...'
                : conversaciones?.length === 0
                  ? 'Sin resultados'
                  : `${conversaciones?.length} conversacion${conversaciones?.length === 1 ? '' : 'es'} encontrada${conversaciones?.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Cargando...</p>}
        {!isLoading && conversaciones?.length === 0 && (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            {isSearchActive ? 'No hay conversaciones que coincidan' : 'No hay conversaciones'}
          </p>
        )}
        {conversaciones?.map((conv) => (
          <ChatListItem
            key={conv.id}
            conversacion={conv}
            selected={conv.id === selectedId}
            unread={isUnread(conv.id, conv.ultimoMensajeEn)}
            onClick={() => { markAsRead(conv.id); onSelect(conv); }}
            selectMode={selectMode}
            isChecked={selectedIds.has(conv.id)}
            onToggleSelect={() => handleToggleSelect(conv.id)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Eliminar conversaciones"
        message={`Se eliminaran ${selectedIds.size} conversacion${selectedIds.size === 1 ? '' : 'es'} y todos sus mensajes. Las reservas asociadas no se eliminan. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate([...selectedIds])}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
