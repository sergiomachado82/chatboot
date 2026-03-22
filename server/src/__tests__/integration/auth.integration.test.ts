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

import { generateToken } from '../../services/authService.js';
import express from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';

// Simple test app with a protected route
function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/api/test-protected', authMiddleware, rateLimiter, (_req, res) => {
    res.json({ ok: true, user: _req.user });
  });
  return app;
}

beforeEach(() => vi.clearAllMocks());

describe('Auth Integration', () => {
  it('returns 401 without token', async () => {
    const app = createApp();
    const res = await request(app).get('/api/test-protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
    expect(res.body.message).toBe('Token required');
  });

  it('returns 401 with invalid token', async () => {
    const app = createApp();
    const res = await request(app).get('/api/test-protected').set('Authorization', 'Bearer totally-invalid-jwt-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
    expect(res.body.message).toBe('Invalid token');
  });

  it('returns 200 with valid admin token', async () => {
    const app = createApp();
    const token = generateToken({ id: 'admin-1', email: 'admin@test.com', rol: 'admin' });
    const res = await request(app).get('/api/test-protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.rol).toBe('admin');
  });

  it('returns 200 with valid agente token', async () => {
    const app = createApp();
    const token = generateToken({ id: 'agente-1', email: 'agente@test.com', rol: 'agente' });
    const res = await request(app).get('/api/test-protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.rol).toBe('agente');
  });

  it('includes user info in request', async () => {
    const app = createApp();
    const token = generateToken({ id: 'admin-42', email: 'boss@hotel.com', rol: 'admin' });
    const res = await request(app).get('/api/test-protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: 'admin-42',
      email: 'boss@hotel.com',
      rol: 'admin',
    });
  });
});
