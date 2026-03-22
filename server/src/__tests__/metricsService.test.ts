import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    conversacion: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    mensaje: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { getMetrics } from '../services/metricsService.js';
import { prisma } from '../lib/prisma.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const from = new Date('2026-03-01');
const to = new Date('2026-03-31');

describe('getMetrics', () => {
  it('returns zeros when no conversations', async () => {
    vi.mocked(prisma.conversacion.count).mockResolvedValue(0);
    vi.mocked(prisma.mensaje.count).mockResolvedValue(0);
    vi.mocked(prisma.conversacion.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ avg_ms: null }]);

    const result = await getMetrics(from, to);

    expect(result.tasaResolucionBot).toBe(0);
    expect(result.tasaEscalacion).toBe(0);
    expect(result.mensajesPorConversacion).toBe(0);
    expect(result.razonesEscalacion).toEqual({});
  });

  it('calculates tasaResolucionBot correctly', async () => {
    // total=10, cerradas=8, escaladas=2 => (8-2)/10 = 0.6
    vi.mocked(prisma.conversacion.count)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(8) // cerradas
      .mockResolvedValueOnce(2); // escaladas
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ avg_ms: null }]);
    vi.mocked(prisma.mensaje.count).mockResolvedValue(50);
    vi.mocked(prisma.conversacion.groupBy).mockResolvedValue([] as never);

    const result = await getMetrics(from, to);

    expect(result.tasaResolucionBot).toBe(0.6);
  });

  it('calculates tasaEscalacion correctly', async () => {
    // total=10, cerradas=7, escaladas=3 => 3/10 = 0.3
    vi.mocked(prisma.conversacion.count)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(7) // cerradas
      .mockResolvedValueOnce(3); // escaladas
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ avg_ms: null }]);
    vi.mocked(prisma.mensaje.count).mockResolvedValue(40);
    vi.mocked(prisma.conversacion.groupBy).mockResolvedValue([] as never);

    const result = await getMetrics(from, to);

    expect(result.tasaEscalacion).toBe(0.3);
  });

  it('calculates mensajesPorConversacion', async () => {
    // total=4, msgCount=20 => 20/4 = 5.0
    vi.mocked(prisma.conversacion.count)
      .mockResolvedValueOnce(4) // total
      .mockResolvedValueOnce(3) // cerradas
      .mockResolvedValueOnce(1); // escaladas
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ avg_ms: null }]);
    vi.mocked(prisma.mensaje.count).mockResolvedValue(20);
    vi.mocked(prisma.conversacion.groupBy).mockResolvedValue([] as never);

    const result = await getMetrics(from, to);

    expect(result.mensajesPorConversacion).toBe(5.0);
  });

  it('returns razonesEscalacion breakdown', async () => {
    vi.mocked(prisma.conversacion.count)
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(6) // cerradas
      .mockResolvedValueOnce(4); // escaladas
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ avg_ms: null }]);
    vi.mocked(prisma.mensaje.count).mockResolvedValue(30);
    vi.mocked(prisma.conversacion.groupBy).mockResolvedValue([
      { razonEscalacion: 'precio', _count: 2 },
      { razonEscalacion: 'disponibilidad', _count: 1 },
      { razonEscalacion: 'otro', _count: 1 },
    ] as never);

    const result = await getMetrics(from, to);

    expect(result.razonesEscalacion).toEqual({
      precio: 2,
      disponibilidad: 1,
      otro: 1,
    });
  });
});
