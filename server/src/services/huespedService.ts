import { prisma } from '../lib/prisma.js';

/**
 * Finds an existing guest by WhatsApp ID or creates a new one if not found.
 * @param waId - The guest's WhatsApp identifier
 * @param nombre - Optional guest name used when creating a new record
 * @returns The existing or newly created guest record
 */
export async function findOrCreateHuesped(waId: string, nombre?: string) {
  let huesped = await prisma.huesped.findUnique({ where: { waId } });

  if (!huesped) {
    huesped = await prisma.huesped.create({
      data: { waId, nombre: nombre ?? null },
    });
  }

  return huesped;
}

/**
 * Retrieves a single guest by their unique ID.
 * @param id - The guest's unique identifier
 * @returns The guest record, or null if not found
 */
export async function getHuespedById(id: string) {
  return prisma.huesped.findUnique({ where: { id } });
}

/**
 * Lists all guests ordered by creation date descending.
 * @returns An array of all guest records
 */
export async function listHuespedes() {
  return prisma.huesped.findMany({ orderBy: { creadoEn: 'desc' } });
}

/**
 * Updates a guest's profile fields.
 * @param id - The guest's unique identifier
 * @param data - The fields to update (nombre, telefono, email, notas)
 * @returns The updated guest record
 */
export async function updateHuesped(
  id: string,
  data: { nombre?: string; telefono?: string; email?: string; notas?: string },
) {
  return prisma.huesped.update({ where: { id }, data });
}
