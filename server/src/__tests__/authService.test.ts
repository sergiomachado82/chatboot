import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    agente: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

import { verifyCredentials, generateToken, verifyToken, resetPassword } from '../services/authService.js';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('verifyCredentials', () => {
  it('returns null when agent not found', async () => {
    vi.mocked(prisma.agente.findUnique).mockResolvedValue(null);
    const result = await verifyCredentials('no@exist.com', 'pass');
    expect(result).toBeNull();
  });

  it('returns null when agent is inactive', async () => {
    vi.mocked(prisma.agente.findUnique).mockResolvedValue({
      id: '1',
      nombre: 'Test',
      email: 'test@test.com',
      passwordHash: 'hash',
      rol: 'agente',
      activo: false,
      online: false,
      creadoEn: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
    });
    const result = await verifyCredentials('test@test.com', 'pass');
    expect(result).toBeNull();
  });

  it('returns null when password is wrong', async () => {
    vi.mocked(prisma.agente.findUnique).mockResolvedValue({
      id: '1',
      nombre: 'Test',
      email: 'test@test.com',
      passwordHash: 'hash',
      rol: 'agente',
      activo: true,
      online: false,
      creadoEn: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const result = await verifyCredentials('test@test.com', 'wrong');
    expect(result).toBeNull();
  });

  it('returns agent data when credentials are valid', async () => {
    const now = new Date();
    vi.mocked(prisma.agente.findUnique).mockResolvedValue({
      id: '1',
      nombre: 'Test',
      email: 'test@test.com',
      passwordHash: 'hash',
      rol: 'agente',
      activo: true,
      online: true,
      creadoEn: now,
      resetToken: null,
      resetTokenExpiry: null,
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const result = await verifyCredentials('test@test.com', 'correct');
    expect(result).toEqual({
      id: '1',
      nombre: 'Test',
      email: 'test@test.com',
      rol: 'agente',
      activo: true,
      online: true,
      creadoEn: now.toISOString(),
    });
  });
});

describe('generateToken / verifyToken roundtrip', () => {
  it('generates a token that can be verified', () => {
    const payload = { id: '1', email: 'test@test.com', rol: 'admin' };
    const token = generateToken(payload);
    expect(typeof token).toBe('string');

    const result = verifyToken(token);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.payload.id).toBe('1');
      expect(result.payload.email).toBe('test@test.com');
      expect(result.payload.rol).toBe('admin');
    }
  });

  it('rejects an invalid token', () => {
    const result = verifyToken('not-a-valid-token');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('invalid');
    }
  });
});

describe('resetPassword', () => {
  it('returns false when token is invalid', async () => {
    vi.mocked(prisma.agente.findFirst).mockResolvedValue(null);
    const result = await resetPassword('bad-token', 'NewPass1');
    expect(result).toBe(false);
  });

  it('resets password when token is valid', async () => {
    vi.mocked(prisma.agente.findFirst).mockResolvedValue({
      id: '1',
      nombre: 'Test',
      email: 'test@test.com',
      passwordHash: 'old',
      rol: 'agente',
      activo: true,
      online: false,
      creadoEn: new Date(),
      resetToken: 'valid-token',
      resetTokenExpiry: new Date(Date.now() + 3600000),
    });
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);
    vi.mocked(prisma.agente.update).mockResolvedValue({} as never);

    const result = await resetPassword('valid-token', 'NewPass1');
    expect(result).toBe(true);
    expect(prisma.agente.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { passwordHash: 'new-hash', resetToken: null, resetTokenExpiry: null },
    });
  });
});
