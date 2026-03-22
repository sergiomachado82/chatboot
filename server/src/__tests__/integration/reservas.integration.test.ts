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

// Mock service dependencies used by the reservas router
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
vi.mock('../../services/auditLogService.js', () => ({
  logAudit: vi.fn(),
  getAuditLogs: vi.fn(),
}));

import express from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { generateToken } from '../../services/authService.js';
import reservasRouter from '../../routes/reservas.js';
import { listReservas, getReservaById, createReserva } from '../../services/reservaService.js';

const mockedListReservas = listReservas as ReturnType<typeof vi.fn>;
const mockedGetReservaById = getReservaById as ReturnType<typeof vi.fn>;
const mockedCreateReserva = createReserva as ReturnType<typeof vi.fn>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.use('/api', reservasRouter);
  return app;
}

function adminToken() {
  return 'Bearer ' + generateToken({ id: 'admin-1', email: 'admin@test.com', rol: 'admin' });
}

beforeEach(() => vi.clearAllMocks());

describe('Reservas Integration', () => {
  it('GET /api/reservas returns 200 with list', async () => {
    const mockData = {
      data: [
        {
          id: 'res-1',
          nombreHuesped: 'Juan Perez',
          fechaEntrada: '2026-04-01',
          fechaSalida: '2026-04-05',
          estado: 'confirmada',
          numHuespedes: 2,
          precioTotal: 500,
        },
        {
          id: 'res-2',
          nombreHuesped: 'Maria Lopez',
          fechaEntrada: '2026-04-10',
          fechaSalida: '2026-04-12',
          estado: 'pre_reserva',
          numHuespedes: 1,
          precioTotal: 200,
        },
      ],
      total: 2,
      page: 1,
      pageSize: 20,
    };
    mockedListReservas.mockResolvedValue(mockData);

    const app = createApp();
    const res = await request(app).get('/api/reservas').set('Authorization', adminToken());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].id).toBe('res-1');
    expect(res.body.total).toBe(2);
    expect(mockedListReservas).toHaveBeenCalledTimes(1);
  });

  it('GET /api/reservas/:id returns 200 for existing reserva', async () => {
    const mockReserva = {
      id: 'res-1',
      nombreHuesped: 'Juan Perez',
      fechaEntrada: '2026-04-01',
      fechaSalida: '2026-04-05',
      estado: 'confirmada',
      numHuespedes: 2,
      habitacion: 'Suite A',
      precioTotal: 500,
      huesped: { id: 'h-1', nombre: 'Juan Perez', waId: '5491112345678', telefono: '+5491112345678' },
    };
    mockedGetReservaById.mockResolvedValue(mockReserva);

    const app = createApp();
    const res = await request(app).get('/api/reservas/res-1').set('Authorization', adminToken());

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('res-1');
    expect(res.body.nombreHuesped).toBe('Juan Perez');
    expect(mockedGetReservaById).toHaveBeenCalledWith('res-1');
  });

  it('GET /api/reservas/:id returns 404 for missing reserva', async () => {
    mockedGetReservaById.mockResolvedValue(null);

    const app = createApp();
    const res = await request(app).get('/api/reservas/nonexistent-id').set('Authorization', adminToken());

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
    expect(mockedGetReservaById).toHaveBeenCalledWith('nonexistent-id');
  });

  it('POST /api/reservas returns 201 for valid body', async () => {
    const newReserva = {
      id: 'res-new',
      huespedId: 'huesped-1',
      fechaEntrada: '2026-05-01',
      fechaSalida: '2026-05-05',
      numHuespedes: 3,
      habitacion: 'Cabin B',
      precioTotal: 800,
      estado: 'pre_reserva',
    };
    mockedCreateReserva.mockResolvedValue(newReserva);

    const app = createApp();
    const res = await request(app).post('/api/reservas').set('Authorization', adminToken()).send({
      huespedId: 'huesped-1',
      fechaEntrada: '2026-05-01',
      fechaSalida: '2026-05-05',
      numHuespedes: 3,
      habitacion: 'Cabin B',
      precioTotal: 800,
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('res-new');
    expect(res.body.habitacion).toBe('Cabin B');
    expect(mockedCreateReserva).toHaveBeenCalledTimes(1);
  });

  it('POST /api/reservas returns 400 for invalid body', async () => {
    const app = createApp();
    const res = await request(app).post('/api/reservas').set('Authorization', adminToken()).send({
      // Missing required fields: huespedId, fechaEntrada, fechaSalida, numHuespedes, habitacion, precioTotal
      notas: 'incomplete reservation',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
    expect(res.body.details).toBeDefined();
    expect(mockedCreateReserva).not.toHaveBeenCalled();
  });
});
