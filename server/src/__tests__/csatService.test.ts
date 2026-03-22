import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    csatRating: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { saveCsatRating, getCsatMetrics } from '../services/csatService.js';
import { prisma } from '../lib/prisma.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('saveCsatRating', () => {
  it('upserts a rating', async () => {
    vi.mocked(prisma.csatRating.upsert).mockResolvedValue({} as never);

    await saveCsatRating('conv-1', 4);

    expect(prisma.csatRating.upsert).toHaveBeenCalledWith({
      where: { conversacionId: 'conv-1' },
      create: { conversacionId: 'conv-1', puntuacion: 4, comentario: undefined },
      update: { puntuacion: 4, comentario: undefined },
    });
  });

  it('upserts with comentario', async () => {
    vi.mocked(prisma.csatRating.upsert).mockResolvedValue({} as never);

    await saveCsatRating('conv-1', 5, 'Excelente servicio');

    expect(prisma.csatRating.upsert).toHaveBeenCalledWith({
      where: { conversacionId: 'conv-1' },
      create: { conversacionId: 'conv-1', puntuacion: 5, comentario: 'Excelente servicio' },
      update: { puntuacion: 5, comentario: 'Excelente servicio' },
    });
  });
});

describe('getCsatMetrics', () => {
  const from = new Date('2026-03-01');
  const to = new Date('2026-03-31');

  it('returns zeros when no ratings', async () => {
    vi.mocked(prisma.csatRating.findMany).mockResolvedValue([]);

    const result = await getCsatMetrics(from, to);

    expect(result.avgScore).toBe(0);
    expect(result.totalRatings).toBe(0);
    expect(result.nps).toBe(0);
    expect(result.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  it('calculates correct average and distribution', async () => {
    vi.mocked(prisma.csatRating.findMany).mockResolvedValue([
      { puntuacion: 5 },
      { puntuacion: 4 },
      { puntuacion: 3 },
      { puntuacion: 5 },
    ] as never);

    const result = await getCsatMetrics(from, to);

    // (5 + 4 + 3 + 5) / 4 = 4.25
    expect(result.avgScore).toBe(4.25);
    expect(result.totalRatings).toBe(4);
    expect(result.distribution[5]).toBe(2);
    expect(result.distribution[4]).toBe(1);
    expect(result.distribution[3]).toBe(1);
    expect(result.distribution[2]).toBe(0);
    expect(result.distribution[1]).toBe(0);
  });

  it('calculates NPS correctly (promoters 4-5, detractors 1-2)', async () => {
    // 3 promoters (4, 5, 5), 1 detractor (1), 1 passive (3) = 5 total
    // NPS = ((3 - 1) / 5) * 100 = 40
    vi.mocked(prisma.csatRating.findMany).mockResolvedValue([
      { puntuacion: 5 },
      { puntuacion: 5 },
      { puntuacion: 4 },
      { puntuacion: 1 },
      { puntuacion: 3 },
    ] as never);

    const result = await getCsatMetrics(from, to);

    expect(result.nps).toBe(40);
    expect(result.totalRatings).toBe(5);
  });
});
