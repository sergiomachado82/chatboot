import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/websocket.js';
import { verifyToken } from './authService.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

/**
 * Initializes the Socket.IO server with CORS, Redis adapter, and JWT authentication middleware.
 * @param server - The HTTP server instance to attach Socket.IO to
 * @returns The configured Socket.IO server instance
 */
export function initSocketIO(server: HttpServer) {
  const origins = env.ALLOWED_ORIGINS;
  io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: origins === '*' ? true : origins.split(',').map((o) => o.trim()),
      credentials: true,
    },
  });

  // Attach Redis adapter for multi-instance support
  pubClient = new Redis(env.REDIS_URL, { lazyConnect: true });
  subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io!.adapter(createAdapter(pubClient!, subClient!));
      logger.info('Socket.IO Redis adapter attached');
    })
    .catch((err) => {
      logger.warn({ err }, 'Socket.IO Redis adapter failed, running in standalone mode');
      pubClient = null;
      subClient = null;
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

/** Returns the current Socket.IO server instance, or null if not yet initialized. @returns The Socket.IO server instance or null */
export function getIO() {
  return io;
}

/**
 * Emits a WebSocket event to all clients in a specific conversation room.
 * @param conversacionId - The conversation ID to target
 * @param event - The event name to emit
 * @param data - The payload to send with the event
 */
export function emitToConversacion(conversacionId: string, event: string, data: unknown) {
  io?.to(`conv:${conversacionId}`).emit(event as keyof ServerToClientEvents, data as never);
}

/**
 * Emits a WebSocket event to all connected clients.
 * @param event - The event name to emit
 * @param data - The payload to send with the event
 */
export function emitToAll(event: string, data: unknown) {
  io?.emit(event as keyof ServerToClientEvents, data as never);
}

/** Disconnects the Redis pub/sub clients used by the Socket.IO adapter. */
export async function closeSocketAdapter() {
  if (pubClient) {
    pubClient.disconnect();
    pubClient = null;
  }
  if (subClient) {
    subClient.disconnect();
    subClient = null;
  }
}
