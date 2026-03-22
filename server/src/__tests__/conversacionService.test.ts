import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    conversacion: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    mensaje: {
      deleteMany: vi.fn(),
    },
    reserva: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('../services/socketManager.js', () => ({
  emitToAll: vi.fn(),
}));

import {
  findOrCreateConversacion,
  updateConversacionEstado,
  deleteConversaciones,
  listConversaciones,
  getConversacionById,
} from '../services/conversacionService.js';
import { prisma } from '../lib/prisma.js';
import { emitToAll } from '../services/socketManager.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const fakeConversacion = {
  id: 'conv-1',
  huespedId: 'huesped-1',
  estado: 'bot',
  agenteId: null,
  cerradaEn: null,
  ultimoMensaje: null,
  ultimoMensajeEn: null,
  creadoEn: new Date('2026-03-20'),
  actualizadoEn: new Date('2026-03-20'),
  escaladaEn: null,
  razonEscalacion: null,
  huesped: { id: 'huesped-1', nombre: 'Juan', waId: '5491100000000', telefono: '+5491100000000' },
  agente: null,
};

describe('findOrCreateConversacion', () => {
  it('returns existing open conversation', async () => {
    vi.mocked(prisma.conversacion.findFirst).mockResolvedValue(fakeConversacion as never);

    const result = await findOrCreateConversacion('huesped-1');

    expect(result).toEqual(fakeConversacion);
    expect(prisma.conversacion.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { huespedId: 'huesped-1', estado: { not: 'cerrado' } },
      }),
    );
    expect(prisma.conversacion.create).not.toHaveBeenCalled();
    expect(emitToAll).not.toHaveBeenCalled();
  });

  it('creates new if none found', async () => {
    vi.mocked(prisma.conversacion.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.conversacion.create).mockResolvedValue(fakeConversacion as never);

    const result = await findOrCreateConversacion('huesped-1');

    expect(result).toEqual(fakeConversacion);
    expect(prisma.conversacion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { huespedId: 'huesped-1', estado: 'bot' },
      }),
    );
    expect(emitToAll).toHaveBeenCalledWith('conversacion:nueva', fakeConversacion);
  });
});

describe('updateConversacionEstado', () => {
  it('updates and emits event', async () => {
    const updated = { ...fakeConversacion, estado: 'espera_humano' };
    vi.mocked(prisma.conversacion.update).mockResolvedValue(updated as never);

    const result = await updateConversacionEstado('conv-1', 'espera_humano' as never);

    expect(prisma.conversacion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'conv-1' },
        data: expect.objectContaining({ estado: 'espera_humano' }),
      }),
    );
    expect(emitToAll).toHaveBeenCalledWith('conversacion:actualizada', updated);
    expect(result.estado).toBe('espera_humano');
  });

  it('sets cerradaEn when cerrado', async () => {
    const closed = { ...fakeConversacion, estado: 'cerrado', cerradaEn: new Date() };
    vi.mocked(prisma.conversacion.update).mockResolvedValue(closed as never);

    await updateConversacionEstado('conv-1', 'cerrado' as never);

    expect(prisma.conversacion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'cerrado',
          cerradaEn: expect.any(Date),
        }),
      }),
    );
  });
});

describe('deleteConversaciones', () => {
  it('deletes messages, unlinks reservas, deletes convs', async () => {
    vi.mocked(prisma.mensaje.deleteMany).mockResolvedValue({ count: 5 } as never);
    vi.mocked(prisma.reserva.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.conversacion.deleteMany).mockResolvedValue({ count: 2 });

    const result = await deleteConversaciones(['conv-1', 'conv-2']);

    expect(result).toBe(2);
    expect(prisma.mensaje.deleteMany).toHaveBeenCalledWith({
      where: { conversacionId: { in: ['conv-1', 'conv-2'] } },
    });
    expect(prisma.reserva.updateMany).toHaveBeenCalledWith({
      where: { conversacionId: { in: ['conv-1', 'conv-2'] } },
      data: { conversacionId: null },
    });
    expect(prisma.conversacion.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['conv-1', 'conv-2'] } },
    });
  });
});

describe('listConversaciones', () => {
  it('returns filtered results', async () => {
    vi.mocked(prisma.conversacion.findMany).mockResolvedValue([fakeConversacion] as never);

    const result = await listConversaciones({ estado: 'bot' });

    expect(result).toHaveLength(1);
    expect(prisma.conversacion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estado: 'bot' }),
        orderBy: { actualizadoEn: 'desc' },
      }),
    );
  });
});

describe('getConversacionById', () => {
  it('returns null for missing id', async () => {
    vi.mocked(prisma.conversacion.findUnique).mockResolvedValue(null);

    const result = await getConversacionById('non-existent');

    expect(result).toBeNull();
    expect(prisma.conversacion.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'non-existent' },
      }),
    );
  });
});
