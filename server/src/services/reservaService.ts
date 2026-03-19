import { prisma } from '../lib/prisma.js';
import { recalcDisponible, dateRange } from './inventarioService.js';
import { syncReservaToSheet } from './sheetsService.js';
import { pushReservaToGCal } from './googleCalendarService.js';
import { logger } from '../utils/logger.js';
import type { ReservaEstado } from '@shared/types/reserva.js';

const includeHuesped = {
  huesped: { select: { id: true, nombre: true, waId: true, telefono: true } },
};

function serializeReserva(r: any) {
  return {
    ...r,
    precioTotal: Number(r.precioTotal),
    tarifaNoche: r.tarifaNoche != null ? Number(r.tarifaNoche) : null,
    montoReserva: r.montoReserva != null ? Number(r.montoReserva) : null,
    saldo: r.saldo != null ? Number(r.saldo) : null,
    importeUsd: r.importeUsd != null ? Number(r.importeUsd) : null,
  };
}

interface CreateReservaParams {
  huespedId: string;
  conversacionId?: string;
  nombreHuesped?: string;
  telefonoHuesped?: string;
  dni?: string;
  fechaEntrada: Date;
  fechaSalida: Date;
  numHuespedes: number;
  habitacion: string;
  precioTotal: number;
  tarifaNoche?: number;
  montoReserva?: number;
  saldo?: number;
  origenReserva?: string;
  notas?: string;
}

export async function createReserva(params: CreateReservaParams) {
  const dates = dateRange(params.fechaEntrada, params.fechaSalida);

  // Transaction: create reserva + block dates atomically
  const reserva = await prisma.$transaction(async (tx) => {
    const created = await tx.reserva.create({
      data: {
        huespedId: params.huespedId,
        conversacionId: params.conversacionId ?? null,
        nombreHuesped: params.nombreHuesped ?? null,
        telefonoHuesped: params.telefonoHuesped ?? null,
        dni: params.dni ?? null,
        fechaEntrada: params.fechaEntrada,
        fechaSalida: params.fechaSalida,
        numHuespedes: params.numHuespedes,
        habitacion: params.habitacion,
        precioTotal: params.precioTotal,
        tarifaNoche: params.tarifaNoche ?? null,
        montoReserva: params.montoReserva ?? null,
        saldo: params.saldo ?? null,
        estado: 'pre_reserva',
        origenReserva: params.origenReserva ?? null,
        notas: params.notas ?? null,
      },
      include: includeHuesped,
    });

    if (dates.length > 0) {
      await tx.inventario.updateMany({
        where: { habitacion: params.habitacion, fecha: { in: dates } },
        data: { disponible: false },
      });
    }

    return created;
  });

  // Recalc disponible for multi-unit correctness (outside transaction)
  await recalcDisponible(params.habitacion, dates).catch((err) =>
    logger.error({ err }, 'recalcDisponible failed on create')
  );

  // Sync to Google Sheets (fire-and-forget, outside transaction)
  syncReservaToSheet({
    id: reserva.id,
    huespedNombre: reserva.huesped?.nombre ?? '',
    huespedWaId: reserva.huesped?.waId ?? '',
    huespedTelefono: reserva.huesped?.telefono ?? '',
    habitacion: reserva.habitacion ?? '',
    fechaEntrada: reserva.fechaEntrada.toISOString().split('T')[0]!,
    fechaSalida: reserva.fechaSalida.toISOString().split('T')[0]!,
    numHuespedes: reserva.numHuespedes,
    precioTotal: Number(reserva.precioTotal),
    estado: reserva.estado,
    notas: reserva.notas ?? '',
    creadoEn: reserva.creadoEn.toISOString(),
  }).catch((err) => logger.error({ err }, 'Sheets sync failed on create'));

  // Sync to Google Calendar (fire-and-forget)
  pushReservaToGCal(reserva.id).catch((err) =>
    logger.error({ err }, 'GCal push failed on create')
  );

  return serializeReserva(reserva);
}

interface CreateReservaManualParams {
  nombreHuesped: string;
  telefonoHuesped?: string;
  dni?: string;
  fechaEntrada: Date;
  fechaSalida: Date;
  numHuespedes: number;
  habitacion?: string;
  tarifaNoche?: number;
  precioTotal?: number;
  montoReserva?: number;
  saldo?: number;
  estado?: string;
  origenReserva?: string;
  nroFactura?: string;
  importeUsd?: number;
  notas?: string;
}

export async function createReservaManual(params: CreateReservaManualParams) {
  const reserva = await prisma.reserva.create({
    data: {
      nombreHuesped: params.nombreHuesped,
      telefonoHuesped: params.telefonoHuesped ?? null,
      dni: params.dni ?? null,
      fechaEntrada: params.fechaEntrada,
      fechaSalida: params.fechaSalida,
      numHuespedes: params.numHuespedes,
      habitacion: params.habitacion ?? null,
      tarifaNoche: params.tarifaNoche ?? null,
      precioTotal: params.precioTotal ?? 0,
      montoReserva: params.montoReserva ?? null,
      saldo: params.saldo ?? null,
      estado: params.estado ?? 'pre_reserva',
      origenReserva: params.origenReserva ?? null,
      nroFactura: params.nroFactura ?? null,
      importeUsd: params.importeUsd ?? null,
      notas: params.notas ?? null,
    },
    include: includeHuesped,
  });

  // Recalc inventory if habitacion is set (handles multi-unit correctly)
  if (params.habitacion) {
    const dates = dateRange(params.fechaEntrada, params.fechaSalida);
    await recalcDisponible(params.habitacion, dates).catch((err) =>
      logger.error({ err }, 'recalcDisponible failed on manual create')
    );
  }

  return serializeReserva(reserva);
}

interface UpdateReservaParams {
  nombreHuesped?: string;
  telefonoHuesped?: string | null;
  dni?: string | null;
  fechaEntrada?: Date;
  fechaSalida?: Date;
  numHuespedes?: number;
  habitacion?: string | null;
  tarifaNoche?: number | null;
  precioTotal?: number;
  montoReserva?: number | null;
  saldo?: number | null;
  estado?: string;
  origenReserva?: string | null;
  nroFactura?: string | null;
  importeUsd?: number | null;
  notas?: string | null;
}

export async function updateReserva(id: string, params: UpdateReservaParams) {
  const existing = await prisma.reserva.findUnique({ where: { id } });
  if (!existing) return null;

  // If cancelling, recalc availability
  if (params.estado === 'cancelada' && existing.habitacion) {
    const dates = dateRange(existing.fechaEntrada, existing.fechaSalida);
    await recalcDisponible(existing.habitacion, dates);
  }

  const reserva = await prisma.reserva.update({
    where: { id },
    data: params,
    include: includeHuesped,
  });

  // Sync to Google Calendar (fire-and-forget)
  pushReservaToGCal(id).catch((err) =>
    logger.error({ err }, 'GCal push failed on update')
  );

  return serializeReserva(reserva);
}

export async function updateReservaEstado(id: string, estado: ReservaEstado) {
  const reserva = await prisma.reserva.findUnique({ where: { id } });
  if (!reserva) return null;

  const updated = await prisma.reserva.update({
    where: { id },
    data: { estado },
    include: includeHuesped,
  });

  // Recalc inventory after state change (handles multi-unit correctly)
  if (estado === 'cancelada' && reserva.habitacion) {
    const dates = dateRange(reserva.fechaEntrada, reserva.fechaSalida);
    if (dates.length > 0) {
      await recalcDisponible(reserva.habitacion, dates).catch((err) =>
        logger.error({ err }, 'recalcDisponible failed on cancel')
      );
    }
  }

  // Sync to Google Sheets (fire-and-forget, outside transaction)
  syncReservaToSheet({
    id: updated.id,
    huespedNombre: updated.huesped?.nombre ?? updated.nombreHuesped ?? '',
    huespedWaId: updated.huesped?.waId ?? '',
    huespedTelefono: updated.huesped?.telefono ?? updated.telefonoHuesped ?? '',
    habitacion: updated.habitacion ?? '',
    fechaEntrada: updated.fechaEntrada.toISOString().split('T')[0]!,
    fechaSalida: updated.fechaSalida.toISOString().split('T')[0]!,
    numHuespedes: updated.numHuespedes,
    precioTotal: Number(updated.precioTotal),
    estado: updated.estado,
    notas: updated.notas ?? '',
    creadoEn: updated.creadoEn.toISOString(),
  }).catch((err) => logger.error({ err }, 'Sheets sync failed on update'));

  // Sync to Google Calendar (fire-and-forget)
  pushReservaToGCal(updated.id).catch((err) =>
    logger.error({ err }, 'GCal push failed on estado update')
  );

  return serializeReserva(updated);
}

export async function getReservaById(id: string) {
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: includeHuesped,
  });
  return reserva ? serializeReserva(reserva) : null;
}

export async function getReservasByHuesped(huespedId: string) {
  const reservas = await prisma.reserva.findMany({
    where: { huespedId },
    orderBy: { creadoEn: 'desc' },
    include: includeHuesped,
  });
  return reservas.map(serializeReserva);
}

export async function getReservasByDateRange(from: Date, to: Date) {
  const reservas = await prisma.reserva.findMany({
    where: {
      fechaEntrada: { lte: to },
      fechaSalida: { gte: from },
      estado: { not: 'cancelada' },
    },
    orderBy: { fechaEntrada: 'asc' },
    include: includeHuesped,
  });
  return reservas.map(serializeReserva);
}

export async function listReservas(estado?: string, page = 1, pageSize = 20) {
  const where = estado ? { estado } : undefined;
  const [reservas, total] = await Promise.all([
    prisma.reserva.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      include: includeHuesped,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.reserva.count({ where }),
  ]);
  return {
    reservas: reservas.map(serializeReserva),
    total,
    page,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
