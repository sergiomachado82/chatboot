import { prisma } from '../lib/prisma.js';

export async function findOrCreateHuesped(waId: string, nombre?: string) {
  let huesped = await prisma.huesped.findUnique({ where: { waId } });

  if (!huesped) {
    huesped = await prisma.huesped.create({
      data: { waId, nombre: nombre ?? null },
    });
  }

  return huesped;
}

export async function getHuespedById(id: string) {
  return prisma.huesped.findUnique({ where: { id } });
}

export async function listHuespedes() {
  return prisma.huesped.findMany({ orderBy: { creadoEn: 'desc' } });
}

export async function updateHuesped(
  id: string,
  data: { nombre?: string; telefono?: string; email?: string; notas?: string },
) {
  return prisma.huesped.update({ where: { id }, data });
}
