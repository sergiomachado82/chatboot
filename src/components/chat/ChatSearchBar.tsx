import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Calendar } from 'lucide-react';
import type { SearchMensajesParams } from '../../api/conversacionApi';

interface ChatSearchBarProps {
  onSearch: (params: SearchMensajesParams | undefined) => void;
  resultCount?: number;
  isLoading?: boolean;
}

export default function ChatSearchBar({ onSearch, resultCount, isLoading }: ChatSearchBarProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const emitSearch = useCallback(
    (search: string, from: string, to: string) => {
      const hasFilter = search.length >= 2 || from || to;
      onSearch(
        hasFilter
          ? {
              search: search.length >= 2 ? search : undefined,
              dateFrom: from || undefined,
              dateTo: to || undefined,
            }
          : undefined,
      );
    },
    [onSearch],
  );

  function handleTextChange(value: string) {
    setText(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => emitSearch(value, dateFrom, dateTo), 400);
  }

  function handleDateFromChange(value: string) {
    setDateFrom(value);
    emitSearch(text, value, dateTo);
  }

  function handleDateToChange(value: string) {
    setDateTo(value);
    emitSearch(text, dateFrom, value);
  }

  function handleClose() {
    setOpen(false);
    setText('');
    setDateFrom('');
    setDateTo('');
    clearTimeout(debounceRef.current);
    onSearch(undefined);
  }

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const hasActiveFilter = text.length >= 2 || dateFrom || dateTo;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border-b border-gray-200 w-full dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 dark:border-gray-700"
      >
        <Search size={14} />
        {t('chat.searchInConversation')}
      </button>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-white px-3 py-2 space-y-2 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={t('chat.searchPlaceholder')}
          className="flex-1 text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
          autoFocus
        />
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
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
          onChange={(e) => handleDateFromChange(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
        <span className="text-gray-400 dark:text-gray-500">a</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => handleDateToChange(e.target.value)}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
      {hasActiveFilter && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isLoading
            ? t('chat.searching')
            : resultCount === 0
              ? t('chat.noResults')
              : t('chat.conversationFound', { count: resultCount ?? 0 })}
        </p>
      )}
    </div>
  );
}
