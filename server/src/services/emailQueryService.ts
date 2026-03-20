import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

interface EmailFilters {
  respondido?: boolean;
  complejoId?: string;
  esFormulario?: boolean;
  search?: string;
  hasError?: boolean;
}

export async function listEmails(filters: EmailFilters, page: number, pageSize: number) {
  const where: Prisma.EmailProcesadoWhereInput = {};

  if (filters.respondido !== undefined) {
    where.respondido = filters.respondido;
  }
  if (filters.complejoId) {
    where.complejoId = filters.complejoId;
  }
  if (filters.esFormulario !== undefined) {
    where.esFormulario = filters.esFormulario;
  }
  if (filters.hasError) {
    where.error = { not: null };
  }
  if (filters.search) {
    where.OR = [
      { fromEmail: { contains: filters.search, mode: 'insensitive' } },
      { subject: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [emails, total] = await Promise.all([
    prisma.emailProcesado.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.emailProcesado.count({ where }),
  ]);

  return {
    emails,
    total,
    page,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export async function getEmailStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [hoy, respondidos, errores, formularios] = await Promise.all([
    prisma.emailProcesado.count({ where: { creadoEn: { gte: startOfDay } } }),
    prisma.emailProcesado.count({ where: { respondido: true } }),
    prisma.emailProcesado.count({ where: { error: { not: null } } }),
    prisma.emailProcesado.count({ where: { esFormulario: true } }),
  ]);

  return { hoy, respondidos, errores, formularios };
}

export async function getEmailById(id: string) {
  return prisma.emailProcesado.findUnique({ where: { id } });
}
