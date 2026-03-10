import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/websocket.js';
import { verifyToken } from './authService.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initSocketIO(server: HttpServer) {
  const origins = env.ALLOWED_ORIGINS;
  io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: origins === '*' ? true : origins.split(',').map(o => o.trim()),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    const result = verifyToken(token);
    if (!result.valid) {
      next(new Error(result.reason === 'expired' ? 'Token expired' : 'Invalid token'));
      return;
    }
    socket.data.user = result.payload;
    next();
  });

  io.on('connection', (socket) => {
    logger.info({ agenteId: socket.data.user?.id }, 'Agent connected via WebSocket');

    socket.on('join:conversacion', (conversacionId) => {
      socket.join(`conv:${conversacionId}`);
    });

    socket.on('leave:conversacion', (conversacionId) => {
      socket.leave(`conv:${conversacionId}`);
    });

    socket.on('disconnect', () => {
      logger.info({ agenteId: socket.data.user?.id }, 'Agent disconnected');
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitToConversacion(conversacionId: string, event: string, data: unknown) {
  io?.to(`conv:${conversacionId}`).emit(event as keyof ServerToClientEvents, data as never);
}

export function emitToAll(event: string, data: unknown) {
  io?.emit(event as keyof ServerToClientEvents, data as never);
}
