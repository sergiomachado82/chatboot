import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock env BEFORE anything else
vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-secret-key-for-integration-tests',
    JWT_EXPIRY: '1h',
    NODE_ENV: 'test',
    ALLOWED_ORIGINS: '*',
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 1000,
    ANTHROPIC_API_KEY: '',
  },
}));
vi.mock('../../lib/redis.js', () => ({ getRedis: () => null, initRedis: vi.fn() }));
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    agente: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    botConfig: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    botConfigAudit: { createMany: vi.fn(), findMany: vi.fn() },
    conversacion: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    mensaje: { findMany: vi.fn(), create: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
    reserva: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((fn: () => unknown) => fn()),
  },
}));

// Mock service dependencies used by routers
vi.mock('../../services/botConfigService.js', () => ({
  getBotConfig: vi.fn(),
  updateBotConfig: vi.fn(),
  getBotConfigHistory: vi.fn(),
  invalidateBotConfigCache: vi.fn(),
}));
vi.mock('../../services/reservaService.js', () => ({
  listReservas: vi.fn(),
  getReservaById: vi.fn(),
  getReservasByDateRange: vi.fn(),
  createReserva: vi.fn(),
  createReservaManual: vi.fn(),
  updateReserva: vi.fn(),
  updateReservaEstado: vi.fn(),
  deleteReserva: vi.fn(),
}));
vi.mock('../../services/conversacionService.js', () => ({
  listConversaciones: vi.fn(),
  getConversacionById: vi.fn(),
  updateConversacionEstado: vi.fn(),
  deleteConversaciones: vi.fn(),
  findOrCreateConversacion: vi.fn(),
  updateUltimoMensaje: vi.fn(),
}));
vi.mock('../../services/mensajeService.js', () => ({
  createMensaje: vi.fn(),
  getByConversacion: vi.fn(),
}));
vi.mock('../../services/whatsappService.js', () => ({
  sendWhatsAppMessage: vi.fn(),
  sendImage: vi.fn(),
  downloadMedia: vi.fn(),
}));
vi.mock('../../services/auditLogService.js', () => ({
  logAudit: vi.fn(),
  getAuditLogs: vi.fn(),
}));

import express from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { generateToken } from '../../services/authService.js';
import botConfigRouter from '../../routes/botConfig.js';
import agentesRouter from '../../routes/agentes.js';
import reservasRouter from '../../routes/reservas.js';
import conversacionesRouter from '../../routes/conversaciones.js';
import { updateBotConfig } from '../../services/botConfigService.js';
import { deleteReserva } from '../../services/reservaService.js';
import { deleteConversaciones } from '../../services/conversacionService.js';

const mockedUpdateBotConfig = updateBotConfig as ReturnType<typeof vi.fn>;
const mockedDeleteReserva = deleteReserva as ReturnType<typeof vi.fn>;
const mockedDeleteConversaciones = deleteConversaciones as ReturnType<typeof vi.fn>;

function createApp(router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.use('/api', router);
  return app;
}

function adminToken() {
  return 'Bearer ' + generateToken({ id: 'admin-1', email: 'admin@test.com', rol: 'admin' });
}

function agenteToken() {
  return 'Bearer ' + generateToken({ id: 'agente-1', email: 'agente@test.com', rol: 'agente' });
}

beforeEach(() => vi.clearAllMocks());

describe('RBAC Integration', () => {
  // --- botConfig routes ---
  describe('PATCH /api/bot/config', () => {
    it('returns 403 for agente', async () => {
      const app = createApp(botConfigRouter);
      const res = await request(app)
        .patch('/api/bot/config')
        .set('Authorization', agenteToken())
        .send({ tono: 'formal' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('returns 200 for admin', async () => {
      mockedUpdateBotConfig.mockResolvedValue({
        id: 'cfg-1',
        tono: 'formal',
        nombreAgente: 'Bot',
        actualizadoEn: new Date().toISOString(),
      });

      const app = createApp(botConfigRouter);
      const res = await request(app)
        .patch('/api/bot/config')
        .set('Authorization', adminToken())
        .send({ tono: 'formal' });

      expect(res.status).toBe(200);
      expect(res.body.tono).toBe('formal');
      expect(mockedUpdateBotConfig).toHaveBeenCalledTimes(1);
    });
  });

  // --- agentes routes ---
  describe('GET /api/agentes', () => {
    it('returns 403 for agente', async () => {
      const app = createApp(agentesRouter);
      const res = await request(app).get('/api/agentes').set('Authorization', agenteToken());

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  describe('POST /api/agentes', () => {
    it('returns 403 for agente', async () => {
      const app = createApp(agentesRouter);
      const res = await request(app).post('/api/agentes').set('Authorization', agenteToken()).send({
        nombre: 'Nuevo Agente',
        email: 'nuevo@test.com',
        password: 'Secure1Pass',
        rol: 'agente',
      });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  // --- reservas routes ---
  describe('DELETE /api/reservas/:id', () => {
    it('returns 403 for agente', async () => {
      const app = createApp(reservasRouter);
      const res = await request(app).delete('/api/reservas/reserva-123').set('Authorization', agenteToken());

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('returns 204 for admin', async () => {
      mockedDeleteReserva.mockResolvedValue(true);

      const app = createApp(reservasRouter);
      const res = await request(app).delete('/api/reservas/reserva-123').set('Authorization', adminToken());

      expect(res.status).toBe(204);
      expect(mockedDeleteReserva).toHaveBeenCalledWith('reserva-123');
    });
  });

  // --- conversaciones routes ---
  describe('POST /api/conversaciones/bulk-delete', () => {
    it('returns 403 for agente', async () => {
      const app = createApp(conversacionesRouter);
      const res = await request(app)
        .post('/api/conversaciones/bulk-delete')
        .set('Authorization', agenteToken())
        .send({ ids: ['conv-1', 'conv-2'] });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('returns 200 for admin', async () => {
      mockedDeleteConversaciones.mockResolvedValue(2);

      const app = createApp(conversacionesRouter);
      const res = await request(app)
        .post('/api/conversaciones/bulk-delete')
        .set('Authorization', adminToken())
        .send({ ids: ['conv-1', 'conv-2'] });

      expect(res.status).toBe(200);
      expect(res.body.deletedCount).toBe(2);
      expect(mockedDeleteConversaciones).toHaveBeenCalledWith(['conv-1', 'conv-2']);
    });
  });
});
