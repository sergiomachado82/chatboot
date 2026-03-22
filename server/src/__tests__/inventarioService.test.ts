import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma (required for module to load, but dateRange tests are pure)
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    complejo: { findMany: vi.fn(), findFirst: vi.fn() },
    inventario: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    reserva: { count: vi.fn() },
    bloqueo: { findMany: vi.fn() },
  },
}));

import { dateRange } from '../services/inventarioService.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dateRange', () => {
  it('returns empty array when start equals end', () => {
    const date = new Date('2026-04-01T00:00:00Z');
    const result = dateRange(date, new Date(date));
    expect(result).toEqual([]);
  });

  it('returns 1 date for 1-day range', () => {
    const start = new Date('2026-04-01T00:00:00Z');
    const end = new Date('2026-04-02T00:00:00Z');
    const result = dateRange(start, end);
    expect(result).toHaveLength(1);
    expect(result[0]!.getDate()).toBe(1);
    expect(result[0]!.getMonth()).toBe(3); // April = 3
  });

  it('returns 7 dates for 1-week range', () => {
    const start = new Date('2026-04-01T00:00:00Z');
    const end = new Date('2026-04-08T00:00:00Z');
    const result = dateRange(start, end);
    expect(result).toHaveLength(7);
  });

  it('handles month boundaries correctly', () => {
    const start = new Date('2026-03-30T00:00:00Z');
    const end = new Date('2026-04-02T00:00:00Z');
    const result = dateRange(start, end);
    expect(result).toHaveLength(3);
    // Should include March 30, 31, and April 1
    expect(result[0]!.getMonth()).toBe(2); // March
    expect(result[0]!.getDate()).toBe(30);
    expect(result[1]!.getMonth()).toBe(2); // March
    expect(result[1]!.getDate()).toBe(31);
    expect(result[2]!.getMonth()).toBe(3); // April
    expect(result[2]!.getDate()).toBe(1);
  });

  it('returns dates starting from start (not end)', () => {
    const start = new Date('2026-05-10T00:00:00Z');
    const end = new Date('2026-05-13T00:00:00Z');
    const result = dateRange(start, end);
    expect(result).toHaveLength(3);
    expect(result[0]!.getDate()).toBe(10);
    expect(result[1]!.getDate()).toBe(11);
    expect(result[2]!.getDate()).toBe(12);
  });

  it('handles year boundaries', () => {
    const start = new Date('2026-12-30T00:00:00Z');
    const end = new Date('2027-01-02T00:00:00Z');
    const result = dateRange(start, end);
    expect(result).toHaveLength(3);
    expect(result[0]!.getFullYear()).toBe(2026);
    expect(result[0]!.getMonth()).toBe(11); // December
    expect(result[0]!.getDate()).toBe(30);
    expect(result[2]!.getFullYear()).toBe(2027);
    expect(result[2]!.getMonth()).toBe(0); // January
    expect(result[2]!.getDate()).toBe(1);
  });
});
