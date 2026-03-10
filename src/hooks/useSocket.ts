import { useEffect, useRef, useSyncExternalStore } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/websocket';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let sharedSocket: TypedSocket | null = null;
let socketStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function setStatus(status: typeof socketStatus) {
  socketStatus = status;
  notifyListeners();
}

export function useSocket(): TypedSocket | null {
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    if (sharedSocket?.connected) {
      socketRef.current = sharedSocket;
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket: TypedSocket = io({
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    sharedSocket = socket;
    socketRef.current = socket;

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('reconnect' as any, () => setStatus('connected'));
    socket.on('connect_error', (err) => {
      setStatus('disconnected');
      if (err.message === 'Invalid token' || err.message === 'Token expired') {
        localStorage.removeItem('token');
        localStorage.removeItem('agente');
        window.location.reload();
      }
    });

    return () => {
      // Don't disconnect shared socket on unmount
    };
  }, []);

  return socketRef.current;
}

export function useSocketStatus(): typeof socketStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => socketStatus,
  );
}

export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
    setStatus('disconnected');
  }
}

export function getSocket(): TypedSocket | null {
  return sharedSocket;
}
