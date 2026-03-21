import { prisma } from '../lib/prisma.js';

export async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [
    convByEstado,
    reservasByEstado,
    reservasMonthTotal,
    emailsToday,
    emailsRespondidos,
    emailsErrors,
    emailsFormularios,
    recentConvs,
    upcomingReservas,
    reservasNext7Days,
    complejos,
  ] = await Promise.all([
    // Conversations by estado
    prisma.conversacion.groupBy({
      by: ['estado'],
      _count: { id: true },
    }).catch(() => []),
    // Reservas this month by estado
    prisma.reserva.groupBy({
      by: ['estado'],
      where: {
        fechaEntrada: { lte: monthEnd },
        fechaSalida: { gte: monthStart },
      },
      _count: { id: true },
    }).catch(() => []),
    // Total reservas this month
    prisma.reserva.count({
      where: {
        fechaEntrada: { lte: monthEnd },
        fechaSalida: { gte: monthStart },
      },
    }).catch(() => 0),
    // Emails today
    prisma.emailProcesado.count({
      where: { creadoEn: { gte: todayStart } },
    }).catch(() => 0),
    // Emails respondidos (all time)
    prisma.emailProcesado.count({
      where: { respondido: true },
    }).catch(() => 0),
    // Emails with errors
    prisma.emailProcesado.count({
      where: { error: { not: null } },
    }).catch(() => 0),
    // Emails formularios
    prisma.emailProcesado.count({
      where: { esFormulario: true },
    }).catch(() => 0),
    // Recent active conversations
    prisma.conversacion.findMany({
      where: { estado: { in: ['espera_humano', 'humano_activo', 'bot'] } },
      orderBy: { ultimoMensajeEn: 'desc' },
      take: 5,
      include: {
        huesped: { select: { nombre: true, waId: true } },
        agente: { select: { nombre: true } },
      },
    }).catch(() => []),
    // Upcoming reservas
    prisma.reserva.findMany({
      where: {
        fechaEntrada: { gte: now },
        estado: { in: ['pre_reserva', 'confirmada'] },
      },
      orderBy: { fechaEntrada: 'asc' },
      take: 5,
      include: {
        huesped: { select: { nombre: true } },
      },
    }).catch(() => []),
    // Reservas in next 7 days (for occupancy)
    prisma.reserva.findMany({
      where: {
        estado: { in: ['confirmada', 'pre_reserva'] },
        fechaEntrada: { lte: weekFromNow },
        fechaSalida: { gte: now },
      },
      select: {
        habitacion: true,
        fechaEntrada: true,
        fechaSalida: true,
      },
    }).catch(() => []),
    // Active complejos with capacity
    prisma.complejo.findMany({
      where: { activo: true },
      select: { nombre: true, cantidadUnidades: true },
    }).catch(() => []),
  ]);

  // Build conversation stats
  const conversaciones: Record<string, number> = {};
  for (const row of convByEstado) {
    conversaciones[row.estado] = row._count.id;
  }

  // Build reservas stats
  const reservas: Record<string, number> = { total: reservasMonthTotal };
  for (const row of reservasByEstado) {
    reservas[row.estado] = row._count.id;
  }

  // Build emails stats
  const emails = {
    hoy: emailsToday,
    respondidos: emailsRespondidos,
    errores: emailsErrors,
    formularios: emailsFormularios,
  };

  // Build occupancy for next 7 days
  const totalUnits = complejos.reduce((sum, c) => sum + c.cantidadUnidades, 0);
  const ocupacion: { fecha: string; reservas: number; capacidad: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() + i);
    const dayStr = day.toISOString().slice(0, 10);

    let count = 0;
    for (const r of reservasNext7Days) {
      const entrada = new Date(r.fechaEntrada);
      const salida = new Date(r.fechaSalida);
      if (day >= entrada && day < salida) count++;
    }

    ocupacion.push({
      fecha: dayStr,
      reservas: count,
      capacidad: totalUnits,
    });
  }

  return {
    conversaciones,
    reservas,
    emails,
    ocupacion,
    recientes: {
      conversaciones: recentConvs,
      reservas: upcomingReservas,
    },
  };
}
