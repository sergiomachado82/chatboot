import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
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

const FILTER_KEYS: { key: Filter; i18nKey: string }[] = [
  { key: 'all', i18nKey: 'chat.filterAll' },
  { key: 'espera_humano', i18nKey: 'chat.filterWaiting' },
  { key: 'humano_activo', i18nKey: 'chat.filterMyChats' },
  { key: 'bot', i18nKey: 'chat.filterBot' },
  { key: 'cerrado', i18nKey: 'chat.filterClosed' },
];

export default function ChatList({ selectedId, onSelect }: ChatListProps) {
  const { t } = useTranslation();
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
      notify.success(t('chat.deletedCount', { count: data.deletedCount }));
      queryClient.invalidateQueries({ queryKey: ['conversaciones'] });
      setShowDeleteConfirm(false);
      setSelectMode(false);
      setSelectedIds(new Set());
    },
    onError: () => {
      notify.error(t('chat.errorDeleteConversations'));
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
        {FILTER_KEYS.map((f) => (
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
            {t(f.i18nKey)}
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
            {selectedIds.size > 0 ? t('chat.selected', { count: selectedIds.size }) : t('chat.cancelSelection')}
          </span>
          <button
            onClick={handleDelete}
            disabled={selectedIds.size === 0 || deleteMutation.isPending}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteMutation.isPending ? t('chat.deleting') : t('common.delete')}
          </button>
          <button
            onClick={handleCancelSelect}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
            aria-label={t('chat.cancelSelection')}
          >
            {t('common.cancel')}
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
            {t('chat.searchInConversation')}
          </button>
          {!selectMode && (
            <button
              onClick={() => setSelectMode(true)}
              className="px-3 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
              title={t('chat.selectTooltip')}
              aria-label={t('chat.deleteSelected')}
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
              placeholder={t('chat.searchPlaceholder')}
              className="flex-1 text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-400"
              autoFocus
            />
            <button
              onClick={handleCloseSearch}
              className="text-gray-400 hover:text-gray-600"
              title={t('chat.closeSearch')}
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            />
            <span className="text-gray-400">a</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          {hasActiveSearch && (
            <p className="text-xs text-gray-500">
              {isLoading
                ? t('chat.searching')
                : conversaciones?.length === 0
                  ? t('chat.noResults')
                  : t('chat.conversationFound', { count: conversaciones?.length ?? 0 })}
            </p>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1">
        {isLoading && <p className="p-4 text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>}
        {!isLoading && conversaciones?.length === 0 && (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            {isSearchActive ? t('chat.noMatching') : t('chat.noConversations')}
          </p>
        )}
        {!isLoading && conversaciones && conversaciones.length > 0 && (
          <Virtuoso
            style={{ height: '100%' }}
            data={conversaciones}
            itemContent={(_index, conv) => (
              <ChatListItem
                key={conv.id}
                conversacion={conv}
                selected={conv.id === selectedId}
                unread={isUnread(conv.id, conv.ultimoMensajeEn)}
                onClick={() => {
                  markAsRead(conv.id);
                  onSelect(conv);
                }}
                selectMode={selectMode}
                isChecked={selectedIds.has(conv.id)}
                onToggleSelect={() => handleToggleSelect(conv.id)}
              />
            )}
          />
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('chat.deleteConversations')}
        message={t('chat.deleteConversationsMessage', { count: selectedIds.size })}
        confirmLabel={t('common.delete')}
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate([...selectedIds])}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
