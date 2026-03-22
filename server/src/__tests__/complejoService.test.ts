import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    complejo: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../data/accommodationContext.js', () => ({
  invalidateContextCache: vi.fn(),
}));

vi.mock('../services/cacheService.js', () => ({
  cache: {
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
    del: vi.fn(() => Promise.resolve()),
    invalidatePattern: vi.fn(() => Promise.resolve()),
  },
}));

import {
  listComplejos,
  getComplejoById,
  createComplejo,
  updateComplejo,
  deleteComplejo,
} from '../services/complejoService.js';
import { prisma } from '../lib/prisma.js';
import { invalidateContextCache } from '../data/accommodationContext.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const mockComplejo = {
  id: 'c1',
  nombre: 'Test Complejo',
  aliases: [],
  direccion: 'Calle 1',
  ubicacion: null,
  tipo: 'cabana',
  superficie: '100m2',
  capacidad: 4,
  cantidadUnidades: 1,
  dormitorios: 2,
  banos: 1,
  amenities: ['wifi'],
  checkIn: '14:00',
  checkOut: '10:00',
  estadiaMinima: 2,
  mascotas: false,
  ninos: true,
  fumar: false,
  fiestas: false,
  videoTour: null,
  titularCuenta: null,
  banco: null,
  cbu: null,
  aliasCbu: null,
  cuit: null,
  linkMercadoPago: null,
  activo: true,
  autoResponderEmail: false,
  creadoEn: new Date(),
  actualizadoEn: new Date(),
  tarifas: [{ id: 't1', temporada: 'alta', precioNoche: 15000 }],
  tarifasEspeciales: [{ id: 'te1', motivo: 'feriado', precioNoche: 20000 }],
  media: [],
  bloqueos: [],
  icalFeeds: [],
};

describe('listComplejos', () => {
  it('returns serialized complejos', async () => {
    vi.mocked(prisma.complejo.findMany).mockResolvedValue([mockComplejo] as never);

    const result = await listComplejos();

    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Test Complejo');
    expect(result[0].tarifas[0].precioNoche).toBe(15000);
    expect(result[0].tarifasEspeciales[0].precioNoche).toBe(20000);
    expect(prisma.complejo.findMany).toHaveBeenCalledOnce();
  });
});

describe('getComplejoById', () => {
  it('returns null for missing id', async () => {
    vi.mocked(prisma.complejo.findUnique).mockResolvedValue(null);

    const result = await getComplejoById('nonexistent');

    expect(result).toBeNull();
    expect(prisma.complejo.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'nonexistent' } }));
  });
});

describe('createComplejo', () => {
  it('creates and invalidates cache', async () => {
    vi.mocked(prisma.complejo.create).mockResolvedValue(mockComplejo as never);

    const result = await createComplejo({ nombre: 'Test Complejo' });

    expect(result.nombre).toBe('Test Complejo');
    expect(result.tarifas[0].precioNoche).toBe(15000);
    expect(prisma.complejo.create).toHaveBeenCalledOnce();
    expect(invalidateContextCache).toHaveBeenCalledOnce();
  });
});

describe('updateComplejo', () => {
  it('updates and invalidates cache', async () => {
    const updated = { ...mockComplejo, nombre: 'Updated Complejo' };
    vi.mocked(prisma.complejo.update).mockResolvedValue(updated as never);

    const result = await updateComplejo('c1', { nombre: 'Updated Complejo' });

    expect(result.nombre).toBe('Updated Complejo');
    expect(prisma.complejo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: { nombre: 'Updated Complejo' },
      }),
    );
    expect(invalidateContextCache).toHaveBeenCalledOnce();
  });
});

describe('deleteComplejo', () => {
  it('soft-deletes (sets activo: false) and invalidates cache', async () => {
    const deactivated = { ...mockComplejo, activo: false };
    vi.mocked(prisma.complejo.update).mockResolvedValue(deactivated as never);

    const result = await deleteComplejo('c1');

    expect(result.activo).toBe(false);
    expect(prisma.complejo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'c1' },
        data: { activo: false },
      }),
    );
    expect(invalidateContextCache).toHaveBeenCalledOnce();
  });
});
