import { prisma } from '../lib/prisma.js';

interface AuditEntry {
  agenteId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: Record<string, unknown>;
  ip?: string | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        agenteId: entry.agenteId ?? null,
        accion: entry.accion,
        entidad: entry.entidad,
        entidadId: entry.entidadId ?? null,
        detalle: entry.detalle ?? undefined,
        ip: entry.ip ?? null,
      },
    });
  } catch {
    // Audit logging should never break the main flow
  }
}

interface GetAuditLogsOptions {
  entidad?: string;
  agenteId?: string;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(options: GetAuditLogsOptions = {}) {
  const { entidad, agenteId, limit = 50, offset = 0 } = options;
  const where: Record<string, unknown> = {};
  if (entidad) where.entidad = entidad;
  if (agenteId) where.agenteId = agenteId;

  return prisma.auditLog.findMany({
    where,
    orderBy: { creadoEn: 'desc' },
    take: limit,
    skip: offset,
  });
}
