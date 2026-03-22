import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    conversacion: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    reserva: {
      groupBy: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    emailProcesado: {
      count: vi.fn(),
    },
    complejo: {
      findMany: vi.fn(),
    },
  },
}));

import { getDashboardStats } from '../services/dashboardService.js';
import { prisma } from '../lib/prisma.js';

beforeEach(() => {
  vi.clearAllMocks();
});

function setupDefaultMocks() {
  vi.mocked(prisma.conversacion.groupBy).mockResolvedValue([
    { estado: 'bot', _count: { id: 5 } },
    { estado: 'espera_humano', _count: { id: 3 } },
    { estado: 'cerrado', _count: { id: 10 } },
  ] as never);

  vi.mocked(prisma.reserva.groupBy).mockResolvedValue([
    { estado: 'confirmada', _count: { id: 4 } },
    { estado: 'pre_reserva', _count: { id: 2 } },
  ] as never);

  vi.mocked(prisma.reserva.count).mockResolvedValue(6 as never);

  // emailProcesado.count is called 4 times: hoy, respondidos, errores, formularios
  vi.mocked(prisma.emailProcesado.count)
    .mockResolvedValueOnce(12) // hoy
    .mockResolvedValueOnce(50) // respondidos
    .mockResolvedValueOnce(3) // errores
    .mockResolvedValueOnce(8); // formularios

  // recentConvs
  vi.mocked(prisma.conversacion.findMany).mockResolvedValue([
    {
      id: 'conv1',
      estado: 'bot',
      ultimoMensajeEn: new Date(),
      huesped: { nombre: 'Juan', waId: '123' },
      agente: null,
    },
  ] as never);

  // upcomingReservas (first call) and reservasNext7Days (second call)
  vi.mocked(prisma.reserva.findMany)
    .mockResolvedValueOnce([
      {
        id: 'r1',
        fechaEntrada: new Date(),
        estado: 'confirmada',
        huesped: { nombre: 'Maria' },
      },
    ] as never)
    .mockResolvedValueOnce([
      {
        habitacion: 'Cabana 1',
        fechaEntrada: new Date(),
        fechaSalida: new Date(Date.now() + 3 * 86400000),
      },
    ] as never);

  // complejos
  vi.mocked(prisma.complejo.findMany).mockResolvedValue([{ nombre: 'Cabanas del Lago', cantidadUnidades: 5 }] as never);
}

function setupEmptyMocks() {
  vi.mocked(prisma.conversacion.groupBy).mockResolvedValue([] as never);
  vi.mocked(prisma.reserva.groupBy).mockResolvedValue([] as never);
  vi.mocked(prisma.reserva.count).mockResolvedValue(0 as never);
  vi.mocked(prisma.emailProcesado.count).mockResolvedValue(0);
  vi.mocked(prisma.conversacion.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.reserva.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.complejo.findMany).mockResolvedValue([] as never);
}

describe('getDashboardStats', () => {
  it('returns all stat sections', async () => {
    setupDefaultMocks();

    const result = await getDashboardStats();

    expect(result).toHaveProperty('conversaciones');
    expect(result).toHaveProperty('reservas');
    expect(result).toHaveProperty('emails');
    expect(result).toHaveProperty('ocupacion');
    expect(result).toHaveProperty('recientes');

    expect(result.conversaciones.bot).toBe(5);
    expect(result.conversaciones.espera_humano).toBe(3);
    expect(result.conversaciones.cerrado).toBe(10);
    expect(result.reservas.total).toBe(6);
    expect(result.reservas.confirmada).toBe(4);
    expect(result.emails.hoy).toBe(12);
    expect(result.emails.respondidos).toBe(50);
    expect(result.emails.errores).toBe(3);
    expect(result.emails.formularios).toBe(8);
    expect(result.recientes.conversaciones).toHaveLength(1);
    expect(result.recientes.reservas).toHaveLength(1);
  });

  it('returns empty stats when no data', async () => {
    setupEmptyMocks();

    const result = await getDashboardStats();

    expect(result.conversaciones).toEqual({});
    expect(result.reservas).toEqual({ total: 0 });
    expect(result.emails).toEqual({ hoy: 0, respondidos: 0, errores: 0, formularios: 0 });
    expect(result.recientes.conversaciones).toEqual([]);
    expect(result.recientes.reservas).toEqual([]);
  });

  it('calculates occupancy for 7 days', async () => {
    setupDefaultMocks();

    const result = await getDashboardStats();

    expect(result.ocupacion).toHaveLength(7);
    for (const day of result.ocupacion) {
      expect(day).toHaveProperty('fecha');
      expect(day).toHaveProperty('reservas');
      expect(day).toHaveProperty('capacidad');
      expect(day.capacidad).toBe(5);
      expect(typeof day.fecha).toBe('string');
      // fecha should be YYYY-MM-DD format
      expect(day.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('handles prisma errors gracefully', async () => {
    // The service uses .catch(() => []) and .catch(() => 0) patterns
    vi.mocked(prisma.conversacion.groupBy).mockRejectedValue(new Error('DB error'));
    vi.mocked(prisma.reserva.groupBy).mockRejectedValue(new Error('DB error'));
    vi.mocked(prisma.reserva.count).mockRejectedValue(new Error('DB error'));
    vi.mocked(prisma.emailProcesado.count).mockRejectedValue(new Error('DB error'));
    vi.mocked(prisma.conversacion.findMany).mockRejectedValue(new Error('DB error'));
    vi.mocked(prisma.reserva.findMany).mockRejectedValue(new Error('DB error'));
    vi.mocked(prisma.complejo.findMany).mockRejectedValue(new Error('DB error'));

    const result = await getDashboardStats();

    // Should not throw - all queries have .catch fallbacks
    expect(result.conversaciones).toEqual({});
    expect(result.reservas).toEqual({ total: 0 });
    expect(result.emails).toEqual({ hoy: 0, respondidos: 0, errores: 0, formularios: 0 });
    expect(result.ocupacion).toHaveLength(7);
    expect(result.recientes.conversaciones).toEqual([]);
    expect(result.recientes.reservas).toEqual([]);
  });
});
