import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    conversacion: {
      count: vi.fn(),
    },
    reserva: {
      count: vi.fn(),
    },
    mensaje: {
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { calculateFunnel } from '../services/funnelService.js';
import { prisma } from '../lib/prisma.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('calculateFunnel', () => {
  const from = new Date('2026-01-01');
  const to = new Date('2026-01-31');

  it('returns all 6 stages with correct labels', async () => {
    // iniciadas
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(100);
    // $queryRaw for conMasDe1Msg
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ cnt: BigInt(80) }]);
    // escaladas
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(30);
    // resueltasPorBot
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(50);
    // reservaCreada
    vi.mocked(prisma.reserva.count).mockResolvedValueOnce(20);
    // reservaConfirmada
    vi.mocked(prisma.reserva.count).mockResolvedValueOnce(10);

    const result = await calculateFunnel(from, to);

    expect(result).toHaveLength(6);
    expect(result.map((s) => s.label)).toEqual([
      'Conversaciones iniciadas',
      'Conv. con +1 mensaje',
      'Resueltas por bot',
      'Escaladas a humano',
      'Reserva creada',
      'Reserva confirmada',
    ]);
  });

  it('returns rate 100 for first stage (Conversaciones iniciadas)', async () => {
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(50);
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ cnt: BigInt(40) }]);
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(10);
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(20);
    vi.mocked(prisma.reserva.count).mockResolvedValueOnce(5);
    vi.mocked(prisma.reserva.count).mockResolvedValueOnce(2);

    const result = await calculateFunnel(from, to);

    expect(result[0].rate).toBe(100);
    expect(result[0].label).toBe('Conversaciones iniciadas');
    expect(result[0].count).toBe(50);
  });

  it('calculates dropoff between stages correctly', async () => {
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(100);
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ cnt: BigInt(80) }]);
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(30);
    vi.mocked(prisma.conversacion.count).mockResolvedValueOnce(50);
    vi.mocked(prisma.reserva.count).mockResolvedValueOnce(20);
    vi.mocked(prisma.reserva.count).mockResolvedValueOnce(10);

    const result = await calculateFunnel(from, to);

    // First stage: dropoff = prev - count = 100 - 100 = 0
    expect(result[0].dropoff).toBe(0);
    expect(result[0].dropoffPct).toBe(0);

    // Second stage: dropoff = 100 - 80 = 20
    expect(result[1].dropoff).toBe(20);
    expect(result[1].dropoffPct).toBe(20);

    // Third stage: dropoff = 80 - 50 = 30
    expect(result[2].dropoff).toBe(30);
    expect(result[2].dropoffPct).toBe(37.5);

    // Fifth stage: dropoff = 30 - 20 = 10
    expect(result[4].dropoff).toBe(10);
    // Sixth stage: dropoff = 20 - 10 = 10
    expect(result[5].dropoff).toBe(10);
    expect(result[5].dropoffPct).toBe(50);
  });

  it('returns all zeros when no data', async () => {
    vi.mocked(prisma.conversacion.count).mockResolvedValue(0);
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
    vi.mocked(prisma.reserva.count).mockResolvedValue(0);

    const result = await calculateFunnel(from, to);

    expect(result).toHaveLength(6);
    for (const stage of result) {
      expect(stage.count).toBe(0);
      expect(stage.dropoff).toBe(0);
      expect(stage.dropoffPct).toBe(0);
    }
    // rate should be 0 for all stages when iniciadas is 0 (except first which is 100, but count is 0)
    // Actually, first stage rate is always 100 per the code
    expect(result[0].rate).toBe(100);
    // All others should be 0 since iniciadas=0
    expect(result[1].rate).toBe(0);
    expect(result[2].rate).toBe(0);
    expect(result[3].rate).toBe(0);
    expect(result[4].rate).toBe(0);
    expect(result[5].rate).toBe(0);
  });
});
