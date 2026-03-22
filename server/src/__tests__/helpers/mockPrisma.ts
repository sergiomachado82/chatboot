import { vi } from 'vitest';

export const mockPrisma = {
  agente: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
  },
  huesped: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  conversacion: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
    groupBy: vi.fn(),
  },
  mensaje: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
    groupBy: vi.fn(),
  },
  reserva: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  inventario: { findMany: vi.fn(), updateMany: vi.fn(), upsert: vi.fn(), findFirst: vi.fn() },
  complejo: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  tarifa: { upsert: vi.fn() },
  tarifaEspecial: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  mediaFile: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn(), update: vi.fn() },
  bloqueo: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
  icalFeed: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
  botConfig: { findFirst: vi.fn(), update: vi.fn() },
  botConfigAudit: { findMany: vi.fn(), create: vi.fn() },
  csatRating: { findMany: vi.fn(), upsert: vi.fn() },
  auditLog: { create: vi.fn(), findMany: vi.fn() },
  emailProcesado: { count: vi.fn() },
  integrationLog: { create: vi.fn() },
  $transaction: vi.fn((fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma)),
  $queryRaw: vi.fn(),
};

vi.mock('../../lib/prisma.js', () => ({ prisma: mockPrisma }));

export function resetMocks() {
  const resetObj = (obj: Record<string, unknown>) => {
    for (const val of Object.values(obj)) {
      if (typeof val?.mockReset === 'function') val.mockReset();
      else if (typeof val === 'object' && val !== null && !Array.isArray(val)) resetObj(val);
    }
  };
  resetObj(mockPrisma);
  mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma));
}
