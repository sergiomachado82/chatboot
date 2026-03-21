import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send();
  }

  function send() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? 'Escribe un mensaje... (Shift+Enter para nueva linea)'}
        rows={1}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 dark:text-gray-100 resize-none"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed self-end"
        aria-label="Enviar mensaje"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
