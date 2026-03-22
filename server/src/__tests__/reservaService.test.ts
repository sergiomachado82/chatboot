import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => {
  const p = {
    reserva: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    inventario: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: typeof p) => unknown) => fn(p)),
  };
  return { prisma: p };
});

vi.mock('../services/inventarioService.js', () => ({
  recalcDisponible: vi.fn().mockResolvedValue(undefined),
  dateRange: vi.fn().mockReturnValue([new Date('2026-04-01'), new Date('2026-04-02'), new Date('2026-04-03')]),
}));

vi.mock('../services/sheetsService.js', () => ({
  syncReservaToSheet: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/googleCalendarService.js', () => ({
  pushReservaToGCal: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { createReserva, updateReserva, deleteReserva, listReservas } from '../services/reservaService.js';
import { prisma } from '../lib/prisma.js';
import { recalcDisponible } from '../services/inventarioService.js';

beforeEach(() => {
  vi.clearAllMocks();
  // Re-set $transaction to execute the callback with prisma
  vi.mocked(prisma.$transaction).mockImplementation((fn: unknown) =>
    (fn as (tx: typeof prisma) => Promise<unknown>)(prisma),
  );
});

const fakeReserva = {
  id: 'res-1',
  huespedId: 'huesped-1',
  conversacionId: null,
  nombreHuesped: 'Juan Perez',
  telefonoHuesped: '+5491100000000',
  dni: '12345678',
  fechaEntrada: new Date('2026-04-01'),
  fechaSalida: new Date('2026-04-04'),
  numHuespedes: 2,
  habitacion: 'Suite A',
  precioTotal: 300,
  tarifaNoche: 100,
  montoReserva: 150,
  saldo: 150,
  importeUsd: null,
  estado: 'pre_reserva',
  origenReserva: null,
  nroFactura: null,
  notas: null,
  creadoEn: new Date('2026-03-20'),
  actualizadoEn: new Date('2026-03-20'),
  huesped: { id: 'huesped-1', nombre: 'Juan Perez', waId: '5491100000000', telefono: '+5491100000000' },
};

describe('createReserva', () => {
  it('creates reservation in transaction', async () => {
    vi.mocked(prisma.reserva.create).mockResolvedValue(fakeReserva as never);

    const result = await createReserva({
      huespedId: 'huesped-1',
      fechaEntrada: new Date('2026-04-01'),
      fechaSalida: new Date('2026-04-04'),
      numHuespedes: 2,
      habitacion: 'Suite A',
      precioTotal: 300,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.reserva.create).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('res-1');
    expect(result.precioTotal).toBe(300);
    expect(typeof result.precioTotal).toBe('number');
  });

  it('calls recalcDisponible after creation', async () => {
    vi.mocked(prisma.reserva.create).mockResolvedValue(fakeReserva as never);

    await createReserva({
      huespedId: 'huesped-1',
      fechaEntrada: new Date('2026-04-01'),
      fechaSalida: new Date('2026-04-04'),
      numHuespedes: 2,
      habitacion: 'Suite A',
      precioTotal: 300,
    });

    expect(recalcDisponible).toHaveBeenCalledWith('Suite A', expect.any(Array));
  });
});

describe('updateReserva', () => {
  it('returns null for non-existent id', async () => {
    vi.mocked(prisma.reserva.findUnique).mockResolvedValue(null);

    const result = await updateReserva('non-existent', { estado: 'confirmada' });
    expect(result).toBeNull();
  });

  it('updates existing reservation', async () => {
    vi.mocked(prisma.reserva.findUnique).mockResolvedValue(fakeReserva as never);
    const updatedReserva = { ...fakeReserva, estado: 'confirmada' };
    vi.mocked(prisma.reserva.update).mockResolvedValue(updatedReserva as never);

    const result = await updateReserva('res-1', { estado: 'confirmada' });

    expect(prisma.reserva.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { estado: 'confirmada' },
      include: { huesped: { select: { id: true, nombre: true, waId: true, telefono: true } } },
    });
    expect(result).not.toBeNull();
    expect(result!.estado).toBe('confirmada');
  });

  it('recalcs inventory when cancelling', async () => {
    vi.mocked(prisma.reserva.findUnique).mockResolvedValue(fakeReserva as never);
    const cancelledReserva = { ...fakeReserva, estado: 'cancelada' };
    vi.mocked(prisma.reserva.update).mockResolvedValue(cancelledReserva as never);

    await updateReserva('res-1', { estado: 'cancelada' });

    expect(recalcDisponible).toHaveBeenCalledWith('Suite A', expect.any(Array));
  });
});

describe('deleteReserva', () => {
  it('returns false for non-existent id', async () => {
    vi.mocked(prisma.reserva.findUnique).mockResolvedValue(null);

    const result = await deleteReserva('non-existent');
    expect(result).toBe(false);
  });

  it('deletes and recalcs inventory', async () => {
    vi.mocked(prisma.reserva.findUnique).mockResolvedValue(fakeReserva as never);
    vi.mocked(prisma.reserva.delete).mockResolvedValue(fakeReserva as never);

    const result = await deleteReserva('res-1');

    expect(result).toBe(true);
    expect(prisma.reserva.delete).toHaveBeenCalledWith({ where: { id: 'res-1' } });
    expect(recalcDisponible).toHaveBeenCalledWith('Suite A', expect.any(Array));
  });
});

describe('listReservas', () => {
  it('returns paginated results', async () => {
    vi.mocked(prisma.reserva.findMany).mockResolvedValue([fakeReserva, fakeReserva] as never);
    vi.mocked(prisma.reserva.count).mockResolvedValue(2);

    const result = await listReservas(undefined, 1, 20);

    expect(result.reservas).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(prisma.reserva.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      }),
    );
  });
});
