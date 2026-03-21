import { prisma } from '../lib/prisma.js';

export async function logIntegrationError(servicio: string, mensaje: string, detalle?: string) {
  try {
    await prisma.integrationLog.create({
      data: { servicio, nivel: 'error', mensaje, detalle },
    });
  } catch {
    // Silently fail — logging should not crash the app
  }
}

export async function logIntegrationWarning(servicio: string, mensaje: string, detalle?: string) {
  try {
    await prisma.integrationLog.create({
      data: { servicio, nivel: 'warning', mensaje, detalle },
    });
  } catch {
    // Silently fail
  }
}

export async function getIntegrationLogs(options?: { servicio?: string; limit?: number }) {
  const limit = Math.min(options?.limit ?? 100, 500);
  return prisma.integrationLog.findMany({
    where: options?.servicio ? { servicio: options.servicio } : undefined,
    orderBy: { creadoEn: 'desc' },
    take: limit,
  });
}

export async function clearOldLogs(daysToKeep = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  return prisma.integrationLog.deleteMany({
    where: { creadoEn: { lt: cutoff } },
  });
}
