import { prisma } from '../lib/prisma.js';
import { invalidateContextCache } from '../data/accommodationContext.js';

const includeRelations = {
  tarifas: true,
  tarifasEspeciales: { orderBy: { fechaInicio: 'asc' as const } },
  media: { orderBy: { orden: 'asc' as const } },
  bloqueos: { orderBy: { fechaInicio: 'asc' as const } },
};

function serializeComplejo(c: any) {
  return {
    ...c,
    tarifas: c.tarifas?.map((t: any) => ({
      ...t,
      precioNoche: Number(t.precioNoche),
    })),
    tarifasEspeciales: c.tarifasEspeciales?.map((te: any) => ({
      ...te,
      precioNoche: Number(te.precioNoche),
    })),
  };
}

export async function listComplejos() {
  const complejos = await prisma.complejo.findMany({
    include: includeRelations,
    orderBy: { creadoEn: 'asc' },
  });
  return complejos.map(serializeComplejo);
}

export async function getComplejoById(id: string) {
  const complejo = await prisma.complejo.findUnique({
    where: { id },
    include: includeRelations,
  });
  return complejo ? serializeComplejo(complejo) : null;
}

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
  icalUrl?: string;
  titularCuenta?: string;
  banco?: string;
  cbu?: string;
  aliasCbu?: string;
  cuit?: string;
  linkMercadoPago?: string;
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
      icalUrl: data.icalUrl,
      titularCuenta: data.titularCuenta,
      banco: data.banco,
      cbu: data.cbu,
      aliasCbu: data.aliasCbu,
      cuit: data.cuit,
      linkMercadoPago: data.linkMercadoPago,
    },
    include: includeRelations,
  });
  invalidateContextCache();
  return serializeComplejo(complejo);
}

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
    icalUrl?: string;
    titularCuenta?: string;
    banco?: string;
    cbu?: string;
    aliasCbu?: string;
    cuit?: string;
    linkMercadoPago?: string;
    activo?: boolean;
  }
) {
  const complejo = await prisma.complejo.update({
    where: { id },
    data,
    include: includeRelations,
  });
  invalidateContextCache();
  return serializeComplejo(complejo);
}

export async function deleteComplejo(id: string) {
  const complejo = await prisma.complejo.update({
    where: { id },
    data: { activo: false },
    include: includeRelations,
  });
  invalidateContextCache();
  return serializeComplejo(complejo);
}

export async function upsertTarifa(
  complejoId: string,
  temporada: string,
  precioNoche: number,
  estadiaMinima?: number | null
) {
  const tarifa = await prisma.tarifa.upsert({
    where: { complejoId_temporada: { complejoId, temporada } },
    update: { precioNoche, estadiaMinima: estadiaMinima ?? null },
    create: { complejoId, temporada, precioNoche, estadiaMinima: estadiaMinima ?? null },
  });
  invalidateContextCache();
  return { ...tarifa, precioNoche: Number(tarifa.precioNoche) };
}

// --- TarifaEspecial CRUD ---

export async function listTarifasEspeciales(complejoId: string) {
  const items = await prisma.tarifaEspecial.findMany({
    where: { complejoId },
    orderBy: { fechaInicio: 'asc' },
  });
  return items.map((te) => ({ ...te, precioNoche: Number(te.precioNoche) }));
}

export async function createTarifaEspecial(
  complejoId: string,
  data: {
    fechaInicio: Date;
    fechaFin: Date;
    precioNoche: number;
    estadiaMinima?: number | null;
    motivo?: string | null;
  }
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
  invalidateContextCache();
  return { ...te, precioNoche: Number(te.precioNoche) };
}

export async function updateTarifaEspecial(
  id: string,
  data: {
    fechaInicio?: Date;
    fechaFin?: Date;
    precioNoche?: number;
    estadiaMinima?: number | null;
    motivo?: string | null;
    activo?: boolean;
  }
) {
  const te = await prisma.tarifaEspecial.update({
    where: { id },
    data,
  });
  invalidateContextCache();
  return { ...te, precioNoche: Number(te.precioNoche) };
}

export async function deleteTarifaEspecial(id: string) {
  const result = await prisma.tarifaEspecial.delete({ where: { id } });
  invalidateContextCache();
  return result;
}

export async function addMedia(
  complejoId: string,
  url: string,
  tipo = 'image',
  caption?: string,
  orden?: number
) {
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
  invalidateContextCache();
  return media;
}

export async function removeMedia(mediaId: string) {
  const result = await prisma.mediaFile.delete({ where: { id: mediaId } });
  invalidateContextCache();
  return result;
}

export async function reorderMedia(complejoId: string, orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    prisma.mediaFile.update({ where: { id }, data: { orden: index } })
  );
  await prisma.$transaction(updates);
  invalidateContextCache();
  return prisma.mediaFile.findMany({
    where: { complejoId },
    orderBy: { orden: 'asc' },
  });
}

// --- Bloqueo CRUD ---

export async function listBloqueos(complejoId: string) {
  return prisma.bloqueo.findMany({
    where: { complejoId },
    orderBy: { fechaInicio: 'asc' },
  });
}

export async function createBloqueo(
  complejoId: string,
  data: { fechaInicio: Date; fechaFin: Date; motivo?: string | null }
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

export async function deleteBloqueo(id: string) {
  return prisma.bloqueo.delete({ where: { id } });
}
