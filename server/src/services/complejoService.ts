import { prisma } from '../lib/prisma.js';
import { invalidateContextCache } from '../data/accommodationContext.js';
import { cache } from './cacheService.js';

const CACHE_LIST_KEY = 'complejos:list';
const CACHE_ID_PREFIX = 'complejos:';
const CACHE_TTL = 60; // 60 seconds

const includeRelations = {
  tarifas: true,
  tarifasEspeciales: { orderBy: { fechaInicio: 'asc' as const } },
  media: { orderBy: { orden: 'asc' as const } },
  bloqueos: { orderBy: { fechaInicio: 'asc' as const } },
  icalFeeds: { orderBy: { creadoEn: 'asc' as const } },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeComplejo(c: any) {
  return {
    ...c,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tarifas: c.tarifas?.map((t: any) => ({
      ...t,
      precioNoche: Number(t.precioNoche),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tarifasEspeciales: c.tarifasEspeciales?.map((te: any) => ({
      ...te,
      precioNoche: Number(te.precioNoche),
    })),
  };
}

async function invalidateComplejoCache(): Promise<void> {
  await cache.invalidatePattern('complejos:*');
  await invalidateContextCache();
}

/**
 * Lists all complejos with their related tarifas, media, bloqueos, and iCal feeds.
 * @returns An array of serialized complejo records ordered by creation date
 */
export async function listComplejos() {
  const cached = await cache.get<ReturnType<typeof serializeComplejo>[]>(CACHE_LIST_KEY);
  if (cached) return cached;

  const complejos = await prisma.complejo.findMany({
    include: includeRelations,
    orderBy: { creadoEn: 'asc' },
  });
  const result = complejos.map(serializeComplejo);
  await cache.set(CACHE_LIST_KEY, result, CACHE_TTL);
  return result;
}

/**
 * Retrieves a single complejo by its ID with all related data.
 * @param id - The complejo's unique identifier
 * @returns The serialized complejo record, or null if not found
 */
export async function getComplejoById(id: string) {
  const cacheKey = `${CACHE_ID_PREFIX}${id}`;
  const cached = await cache.get<ReturnType<typeof serializeComplejo>>(cacheKey);
  if (cached) return cached;

  const complejo = await prisma.complejo.findUnique({
    where: { id },
    include: includeRelations,
  });
  if (!complejo) return null;
  const result = serializeComplejo(complejo);
  await cache.set(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Creates a new complejo with the provided configuration and invalidates the context cache.
 * @param data - The complejo properties including nombre, capacity, amenities, and payment details
 * @returns The newly created serialized complejo record
 */
export async function createComplejo(data: {
  nombre: string;
  aliases?: string[];
  direccion?: string;
  ubicacion?: string;
  tipo?: string;
  superficie?: string;
  capacidad?: number;
  cantidadUnidades?: number;
  dormitorios?: number;
  banos?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  estadiaMinima?: number;
  mascotas?: boolean;
  ninos?: boolean;
  fumar?: boolean;
  fiestas?: boolean;
  videoTour?: string;
  titularCuenta?: string;
  banco?: string;
  cbu?: string;
  aliasCbu?: string;
  cuit?: string;
  linkMercadoPago?: string;
  autoResponderEmail?: boolean;
}) {
  const complejo = await prisma.complejo.create({
    data: {
      nombre: data.nombre,
      aliases: data.aliases ?? [],
      direccion: data.direccion,
      ubicacion: data.ubicacion,
      tipo: data.tipo,
      superficie: data.superficie,
      capacidad: data.capacidad ?? 4,
      cantidadUnidades: data.cantidadUnidades ?? 1,
      dormitorios: data.dormitorios ?? 1,
      banos: data.banos ?? 1,
      amenities: data.amenities ?? [],
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      estadiaMinima: data.estadiaMinima,
      mascotas: data.mascotas ?? false,
      ninos: data.ninos ?? true,
      fumar: data.fumar ?? false,
      fiestas: data.fiestas ?? false,
      videoTour: data.videoTour,
      titularCuenta: data.titularCuenta,
      banco: data.banco,
      cbu: data.cbu,
      aliasCbu: data.aliasCbu,
      cuit: data.cuit,
      linkMercadoPago: data.linkMercadoPago,
      autoResponderEmail: data.autoResponderEmail ?? false,
    },
    include: includeRelations,
  });
  await invalidateComplejoCache();
  return serializeComplejo(complejo);
}

/**
 * Updates an existing complejo's fields and invalidates the context cache.
 * @param id - The complejo's unique identifier
 * @param data - The fields to update on the complejo
 * @returns The updated serialized complejo record
 */
export async function updateComplejo(
  id: string,
  data: {
    nombre?: string;
    aliases?: string[];
    direccion?: string;
    ubicacion?: string;
    tipo?: string;
    superficie?: string;
    capacidad?: number;
    cantidadUnidades?: number;
    dormitorios?: number;
    banos?: number;
    amenities?: string[];
    checkIn?: string;
    checkOut?: string;
    estadiaMinima?: number;
    mascotas?: boolean;
    ninos?: boolean;
    fumar?: boolean;
    fiestas?: boolean;
    videoTour?: string;
    titularCuenta?: string;
    banco?: string;
    cbu?: string;
    aliasCbu?: string;
    cuit?: string;
    linkMercadoPago?: string;
    activo?: boolean;
    autoResponderEmail?: boolean;
  },
) {
  const complejo = await prisma.complejo.update({
    where: { id },
    data,
    include: includeRelations,
  });
  await invalidateComplejoCache();
  return serializeComplejo(complejo);
}

/**
 * Soft-deletes a complejo by setting it as inactive and invalidates the context cache.
 * @param id - The complejo's unique identifier
 * @returns The deactivated serialized complejo record
 */
export async function deleteComplejo(id: string) {
  const complejo = await prisma.complejo.update({
    where: { id },
    data: { activo: false },
    include: includeRelations,
  });
  await invalidateComplejoCache();
  return serializeComplejo(complejo);
}

/**
 * Creates or updates a seasonal rate for a complejo and invalidates the context cache.
 * @param complejoId - The complejo's unique identifier
 * @param temporada - The season name (e.g., 'alta', 'baja')
 * @param precioNoche - The nightly price for the season
 * @param estadiaMinima - Optional minimum stay requirement in nights
 * @returns The upserted tarifa record with serialized price
 */
export async function upsertTarifa(
  complejoId: string,
  temporada: string,
  precioNoche: number,
  estadiaMinima?: number | null,
) {
  const tarifa = await prisma.tarifa.upsert({
    where: { complejoId_temporada: { complejoId, temporada } },
    update: { precioNoche, estadiaMinima: estadiaMinima ?? null },
    create: { complejoId, temporada, precioNoche, estadiaMinima: estadiaMinima ?? null },
  });
  await invalidateComplejoCache();
  return { ...tarifa, precioNoche: Number(tarifa.precioNoche) };
}

// --- TarifaEspecial CRUD ---

/**
 * Lists all special rates for a complejo ordered by start date.
 * @param complejoId - The complejo's unique identifier
 * @returns An array of special rate records with serialized prices
 */
export async function listTarifasEspeciales(complejoId: string) {
  const items = await prisma.tarifaEspecial.findMany({
    where: { complejoId },
    orderBy: { fechaInicio: 'asc' },
  });
  return items.map((te) => ({ ...te, precioNoche: Number(te.precioNoche) }));
}

/**
 * Creates a new special rate for a complejo within a date range and invalidates the context cache.
 * @param complejoId - The complejo's unique identifier
 * @param data - The special rate details including date range, price, and optional reason
 * @returns The created special rate record with serialized price
 */
export async function createTarifaEspecial(
  complejoId: string,
  data: {
    fechaInicio: Date;
    fechaFin: Date;
    precioNoche: number;
    estadiaMinima?: number | null;
    motivo?: string | null;
  },
) {
  const te = await prisma.tarifaEspecial.create({
    data: {
      complejoId,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      precioNoche: data.precioNoche,
      estadiaMinima: data.estadiaMinima ?? null,
      motivo: data.motivo ?? null,
    },
  });
  await invalidateComplejoCache();
  return { ...te, precioNoche: Number(te.precioNoche) };
}

/**
 * Updates an existing special rate's fields and invalidates the context cache.
 * @param id - The special rate's unique identifier
 * @param data - The fields to update on the special rate
 * @returns The updated special rate record with serialized price
 */
export async function updateTarifaEspecial(
  id: string,
  data: {
    fechaInicio?: Date;
    fechaFin?: Date;
    precioNoche?: number;
    estadiaMinima?: number | null;
    motivo?: string | null;
    activo?: boolean;
  },
) {
  const te = await prisma.tarifaEspecial.update({
    where: { id },
    data,
  });
  await invalidateComplejoCache();
  return { ...te, precioNoche: Number(te.precioNoche) };
}

/**
 * Deletes a special rate by ID and invalidates the context cache.
 * @param id - The special rate's unique identifier
 * @returns The deleted special rate record
 */
export async function deleteTarifaEspecial(id: string) {
  const result = await prisma.tarifaEspecial.delete({ where: { id } });
  await invalidateComplejoCache();
  return result;
}

/**
 * Adds a media file to a complejo, auto-assigning order if not specified, and invalidates the context cache.
 * @param complejoId - The complejo's unique identifier
 * @param url - The media file URL
 * @param tipo - The media type (defaults to 'image')
 * @param caption - Optional caption for the media
 * @param orden - Optional display order; auto-increments if omitted
 * @returns The created media record
 */
export async function addMedia(complejoId: string, url: string, tipo = 'image', caption?: string, orden?: number) {
  if (orden === undefined) {
    const last = await prisma.mediaFile.findFirst({
      where: { complejoId },
      orderBy: { orden: 'desc' },
    });
    orden = (last?.orden ?? -1) + 1;
  }
  const media = await prisma.mediaFile.create({
    data: { complejoId, url, tipo, caption, orden },
  });
  await invalidateComplejoCache();
  return media;
}

/**
 * Removes a media file by ID and invalidates the context cache.
 * @param mediaId - The media file's unique identifier
 * @returns The deleted media record
 */
export async function removeMedia(mediaId: string) {
  const result = await prisma.mediaFile.delete({ where: { id: mediaId } });
  await invalidateComplejoCache();
  return result;
}

/**
 * Reorders media files for a complejo by assigning sequential order values and invalidates the context cache.
 * @param complejoId - The complejo's unique identifier
 * @param orderedIds - An array of media IDs in the desired display order
 * @returns The reordered array of media records
 */
export async function reorderMedia(complejoId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) => prisma.mediaFile.update({ where: { id }, data: { orden: index } }));
  await prisma.$transaction(updates);
  await invalidateComplejoCache();
  return prisma.mediaFile.findMany({
    where: { complejoId },
    orderBy: { orden: 'asc' },
  });
}

// --- Bloqueo CRUD ---

/**
 * Lists all date blocks for a complejo ordered by start date.
 * @param complejoId - The complejo's unique identifier
 * @returns An array of bloqueo records
 */
export async function listBloqueos(complejoId: string) {
  return prisma.bloqueo.findMany({
    where: { complejoId },
    orderBy: { fechaInicio: 'asc' },
  });
}

/**
 * Creates a new date block for a complejo within the specified date range.
 * @param complejoId - The complejo's unique identifier
 * @param data - The block details including start date, end date, and optional reason
 * @returns The created bloqueo record
 */
export async function createBloqueo(
  complejoId: string,
  data: { fechaInicio: Date; fechaFin: Date; motivo?: string | null },
) {
  return prisma.bloqueo.create({
    data: {
      complejoId,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      motivo: data.motivo ?? null,
    },
  });
}

/**
 * Deletes a date block by ID.
 * @param id - The bloqueo's unique identifier
 * @returns The deleted bloqueo record
 */
export async function deleteBloqueo(id: string) {
  return prisma.bloqueo.delete({ where: { id } });
}
