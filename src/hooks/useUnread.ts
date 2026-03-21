import { useState, useCallback, useEffect } from 'react';
import { useSocket } from './useSocket';

const STORAGE_KEY = 'chatbot_read_timestamps';

function getReadTimestamps(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveReadTimestamps(data: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useUnread() {
  const [readTimestamps, setReadTimestamps] = useState(getReadTimestamps);
  const socket = useSocket();

  // Listen for new messages to trigger re-render
  useEffect(() => {
    if (!socket) return;
    const refresh = () => setReadTimestamps({ ...getReadTimestamps() });
    socket.on('mensaje:nuevo', refresh);
    socket.on('conversacion:actualizada', refresh);
    return () => {
      socket.off('mensaje:nuevo', refresh);
      socket.off('conversacion:actualizada', refresh);
    };
  }, [socket]);

  const markAsRead = useCallback((conversacionId: string) => {
    const updated = { ...getReadTimestamps(), [conversacionId]: new Date().toISOString() };
    saveReadTimestamps(updated);
    setReadTimestamps(updated);
  }, []);

  const isUnread = useCallback((conversacionId: string, ultimoMensajeEn: string | null | undefined) => {
    if (!ultimoMensajeEn) return false;
    const lastRead = readTimestamps[conversacionId];
    if (!lastRead) return true; // never opened = unread
    return new Date(ultimoMensajeEn) > new Date(lastRead);
  }, [readTimestamps]);

  return { markAsRead, isUnread };
}
