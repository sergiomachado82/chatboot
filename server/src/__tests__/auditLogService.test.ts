import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { logAudit, getAuditLogs } from '../services/auditLogService.js';
import { prisma } from '../lib/prisma.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('logAudit', () => {
  it('creates an audit entry', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    await logAudit({ accion: 'login', entidad: 'agente' });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        agenteId: null,
        accion: 'login',
        entidad: 'agente',
        entidadId: null,
        detalle: undefined,
        ip: null,
      },
    });
  });

  it('creates an audit entry with all fields', async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);

    await logAudit({
      agenteId: 'agent-1',
      accion: 'update',
      entidad: 'reserva',
      entidadId: 'res-123',
      detalle: { campo: 'estado', valor: 'confirmada' },
      ip: '192.168.1.1',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        agenteId: 'agent-1',
        accion: 'update',
        entidad: 'reserva',
        entidadId: 'res-123',
        detalle: { campo: 'estado', valor: 'confirmada' },
        ip: '192.168.1.1',
      },
    });
  });

  it('does not throw on prisma error', async () => {
    vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('DB error'));

    // Should not throw
    await expect(logAudit({ accion: 'test', entidad: 'test' })).resolves.toBeUndefined();
  });
});

describe('getAuditLogs', () => {
  it('returns entries', async () => {
    const mockLogs = [
      { id: '1', accion: 'login', entidad: 'agente', creadoEn: new Date() },
      { id: '2', accion: 'update', entidad: 'reserva', creadoEn: new Date() },
    ];
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never);

    const result = await getAuditLogs();

    expect(result).toEqual(mockLogs);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { creadoEn: 'desc' },
      take: 50,
      skip: 0,
    });
  });

  it('returns entries with filters', async () => {
    const mockLogs = [{ id: '1', accion: 'login', entidad: 'agente', creadoEn: new Date() }];
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as never);

    const result = await getAuditLogs({ entidad: 'agente', agenteId: 'agent-1', limit: 10, offset: 5 });

    expect(result).toEqual(mockLogs);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: { entidad: 'agente', agenteId: 'agent-1' },
      orderBy: { creadoEn: 'desc' },
      take: 10,
      skip: 5,
    });
  });
});
