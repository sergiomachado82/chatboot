import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'e2e-test-secret',
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
    conversacion: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
    mensaje: { findMany: vi.fn(), create: vi.fn(), count: vi.fn(), deleteMany: vi.fn() },
    reserva: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), delete: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

import bcrypt from 'bcrypt';
vi.mock('bcrypt', () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));

import express from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/requireRole.js';
import { generateToken } from '../../services/authService.js';
import { prisma } from '../../lib/prisma.js';

beforeEach(() => vi.clearAllMocks());

function createE2EApp() {
  const app = express();
  app.use(express.json());

  // Public login route
  app.post('/api/auth/login', async (req, res) => {
    const { verifyCredentials, generateToken: genToken } = await import('../../services/authService.js');
    const agent = await verifyCredentials(req.body.email, req.body.password);
    if (!agent) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = genToken({ id: agent.id, email: agent.email, rol: agent.rol as 'admin' | 'agente' });
    res.json({ token, agente: agent });
  });

  // Protected routes
  app.get('/api/profile', authMiddleware, (req, res) => {
    res.json({ user: req.user });
  });

  app.get('/api/admin-only', authMiddleware, requireRole('admin'), (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

describe('E2E Auth Flow', () => {
  const app = createE2EApp();

  it('login → get token → access protected route → RBAC check', async () => {
    // Step 1: Login
    vi.mocked(prisma.agente.findUnique).mockResolvedValue({
      id: 'a1',
      nombre: 'Admin',
      email: 'admin@test.com',
      passwordHash: 'hashed',
      rol: 'admin',
      activo: true,
      online: false,
      creadoEn: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const loginRes = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'test' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    // Step 2: Access protected route with token
    const profileRes = await request(app).get('/api/profile').set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.user.email).toBe('admin@test.com');

    // Step 3: Access admin-only route (should succeed for admin)
    const adminRes = await request(app).get('/api/admin-only').set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(adminRes.status).toBe(200);
  });

  it('agente cannot access admin-only routes', async () => {
    const token = generateToken({ id: 'ag1', email: 'agente@test.com', rol: 'agente' });

    const res = await request(app).get('/api/admin-only').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('expired/invalid token is rejected', async () => {
    const res = await request(app).get('/api/profile').set('Authorization', 'Bearer invalid-token-here');

    expect(res.status).toBe(401);
  });

  it('missing token returns 401', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });
});
