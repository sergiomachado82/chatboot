import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    huesped: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { findOrCreateHuesped, getHuespedById, updateHuesped } from '../services/huespedService.js';
import { prisma } from '../lib/prisma.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const mockHuesped = {
  id: 'h1',
  waId: '5491112345678',
  nombre: 'Juan',
  telefono: null,
  email: null,
  notas: null,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
};

describe('findOrCreateHuesped', () => {
  it('returns existing huesped', async () => {
    vi.mocked(prisma.huesped.findUnique).mockResolvedValue(mockHuesped as never);

    const result = await findOrCreateHuesped('5491112345678', 'Juan');

    expect(result).toEqual(mockHuesped);
    expect(prisma.huesped.findUnique).toHaveBeenCalledWith({
      where: { waId: '5491112345678' },
    });
    expect(prisma.huesped.create).not.toHaveBeenCalled();
  });

  it('creates new huesped when not found', async () => {
    vi.mocked(prisma.huesped.findUnique).mockResolvedValue(null);
    const newHuesped = { ...mockHuesped, id: 'h2', waId: '5491199999999', nombre: 'Maria' };
    vi.mocked(prisma.huesped.create).mockResolvedValue(newHuesped as never);

    const result = await findOrCreateHuesped('5491199999999', 'Maria');

    expect(result).toEqual(newHuesped);
    expect(prisma.huesped.findUnique).toHaveBeenCalledWith({
      where: { waId: '5491199999999' },
    });
    expect(prisma.huesped.create).toHaveBeenCalledWith({
      data: { waId: '5491199999999', nombre: 'Maria' },
    });
  });
});

describe('getHuespedById', () => {
  it('returns null when not found', async () => {
    vi.mocked(prisma.huesped.findUnique).mockResolvedValue(null);

    const result = await getHuespedById('nonexistent');

    expect(result).toBeNull();
    expect(prisma.huesped.findUnique).toHaveBeenCalledWith({
      where: { id: 'nonexistent' },
    });
  });
});

describe('updateHuesped', () => {
  it('updates huesped fields', async () => {
    const updated = { ...mockHuesped, nombre: 'Juan Carlos', email: 'juan@test.com' };
    vi.mocked(prisma.huesped.update).mockResolvedValue(updated as never);

    const result = await updateHuesped('h1', { nombre: 'Juan Carlos', email: 'juan@test.com' });

    expect(result.nombre).toBe('Juan Carlos');
    expect(result.email).toBe('juan@test.com');
    expect(prisma.huesped.update).toHaveBeenCalledWith({
      where: { id: 'h1' },
      data: { nombre: 'Juan Carlos', email: 'juan@test.com' },
    });
  });
});
