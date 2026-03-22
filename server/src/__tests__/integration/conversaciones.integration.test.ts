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
    botConfig: { findFirst: vi.fn() },
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

// Mock service dependencies used by the conversaciones router
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
import conversacionesRouter from '../../routes/conversaciones.js';
import { listConversaciones, getConversacionById, deleteConversaciones } from '../../services/conversacionService.js';

const mockedListConversaciones = listConversaciones as ReturnType<typeof vi.fn>;
const mockedGetConversacionById = getConversacionById as ReturnType<typeof vi.fn>;
const mockedDeleteConversaciones = deleteConversaciones as ReturnType<typeof vi.fn>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.use('/api', conversacionesRouter);
  return app;
}

function adminToken() {
  return 'Bearer ' + generateToken({ id: 'admin-1', email: 'admin@test.com', rol: 'admin' });
}

function agenteToken() {
  return 'Bearer ' + generateToken({ id: 'agente-1', email: 'agente@test.com', rol: 'agente' });
}

beforeEach(() => vi.clearAllMocks());

describe('Conversaciones Integration', () => {
  it('GET /api/conversaciones returns 200 with list', async () => {
    const mockConversaciones = [
      {
        id: 'conv-1',
        huespedId: 'h-1',
        estado: 'bot',
        ultimoMensaje: 'Hola, necesito info',
        creadaEn: '2026-03-20T10:00:00.000Z',
        huesped: { id: 'h-1', nombre: 'Carlos Garcia', waId: '5491100001111', telefono: '+5491100001111' },
        agente: null,
      },
      {
        id: 'conv-2',
        huespedId: 'h-2',
        estado: 'humano_activo',
        ultimoMensaje: 'Quiero reservar',
        creadaEn: '2026-03-19T14:00:00.000Z',
        huesped: { id: 'h-2', nombre: 'Ana Torres', waId: '5491100002222', telefono: '+5491100002222' },
        agente: { id: 'agente-1', nombre: 'Soporte' },
      },
    ];
    mockedListConversaciones.mockResolvedValue(mockConversaciones);

    const app = createApp();
    const res = await request(app).get('/api/conversaciones').set('Authorization', adminToken());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe('conv-1');
    expect(res.body[1].estado).toBe('humano_activo');
    expect(mockedListConversaciones).toHaveBeenCalledTimes(1);
  });

  it('GET /api/conversaciones/:id returns 404 for missing conversacion', async () => {
    mockedGetConversacionById.mockResolvedValue(null);

    const app = createApp();
    const res = await request(app).get('/api/conversaciones/nonexistent-id').set('Authorization', adminToken());

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
    expect(mockedGetConversacionById).toHaveBeenCalledWith('nonexistent-id');
  });

  it('POST /api/conversaciones/bulk-delete returns 403 for agente', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/conversaciones/bulk-delete')
      .set('Authorization', agenteToken())
      .send({ ids: ['conv-1', 'conv-2'] });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
    expect(mockedDeleteConversaciones).not.toHaveBeenCalled();
  });

  it('POST /api/conversaciones/bulk-delete returns 200 for admin', async () => {
    mockedDeleteConversaciones.mockResolvedValue(3);

    const app = createApp();
    const res = await request(app)
      .post('/api/conversaciones/bulk-delete')
      .set('Authorization', adminToken())
      .send({ ids: ['conv-1', 'conv-2', 'conv-3'] });

    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(3);
    expect(mockedDeleteConversaciones).toHaveBeenCalledWith(['conv-1', 'conv-2', 'conv-3']);
  });
});
