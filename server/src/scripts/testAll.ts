/**
 * Comprehensive integration test suite for all API endpoints.
 * Run with: npx tsx server/src/scripts/testAll.ts
 *
 * Requires: server running on localhost:5050 with SIMULATOR_MODE=true
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5050';
const ADMIN_EMAIL = 'admin@chatboot.com';
const ADMIN_PASS = 'admin123';
const SIM_FROM = '5491188880000'; // unique phone for test isolation

let passed = 0;
let failed = 0;
let token = '';

// ─── Helpers ──────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function api(
  method: string,
  path: string,
  body?: any,
  authToken?: string | null,
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken !== null) {
    headers['Authorization'] = `Bearer ${authToken ?? token}`;
  }

  const opts: RequestInit = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data: any;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function assert(testName: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  \x1b[32mPASS\x1b[0m: ${testName}`);
    passed++;
  } else {
    console.log(`  \x1b[31mFAIL\x1b[0m: ${testName}${details ? ' — ' + details : ''}`);
    failed++;
  }
}

function section(title: string) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(50));
}

// ─── Cleanup ──────────────────────────────────────────────────

async function cleanupTestData() {
  // Delete test huesped + cascading data created by simulator
  const huesped = await prisma.huesped.findFirst({ where: { waId: SIM_FROM } });
  if (huesped) {
    const convs = await prisma.conversacion.findMany({ where: { huespedId: huesped.id } });
    for (const c of convs) {
      await prisma.mensaje.deleteMany({ where: { conversacionId: c.id } });
      await prisma.reserva.deleteMany({ where: { conversacionId: c.id } });
    }
    await prisma.conversacion.deleteMany({ where: { huespedId: huesped.id } });
    await prisma.reserva.deleteMany({ where: { huespedId: huesped.id } });
    await prisma.huesped.delete({ where: { id: huesped.id } });
  }

  // Delete test complejo (by name)
  const testComplejo = await prisma.complejo.findFirst({ where: { nombre: 'TEST_COMPLEJO_AUTO' } });
  if (testComplejo) {
    await prisma.tarifa.deleteMany({ where: { complejoId: testComplejo.id } });
    await prisma.tarifaEspecial.deleteMany({ where: { complejoId: testComplejo.id } });
    await prisma.mediaFile.deleteMany({ where: { complejoId: testComplejo.id } });
    await prisma.bloqueo.deleteMany({ where: { complejoId: testComplejo.id } });
    await prisma.complejo.delete({ where: { id: testComplejo.id } });
  }

  // Delete test agente
  await prisma.agente.deleteMany({ where: { email: 'test_agent@testall.com' } });

  // Delete manual test reserva by nombre
  await prisma.reserva.deleteMany({ where: { nombreHuesped: 'TEST_HUESPED_AUTO' } });
}

// ─── Test Suites ──────────────────────────────────────────────

async function testHealth() {
  section('1. HEALTH CHECK');
  const { status, data } = await api('GET', '/api/health', undefined, null);
  assert('GET /api/health → 200', status === 200, `status: ${status}`);
  assert('status = ok', data?.status === 'ok', `got: ${data?.status}`);
  assert('services.database is boolean', typeof data?.services?.database === 'boolean');
  assert('services.redis is boolean', typeof data?.services?.redis === 'boolean');
}

async function testAuth(): Promise<void> {
  section('2. AUTHENTICATION');

  // Valid login
  const { status: s1, data: d1 } = await api('POST', '/api/auth/login', {
    email: ADMIN_EMAIL, password: ADMIN_PASS,
  }, null);
  assert('valid login → 200', s1 === 200, `status: ${s1}`);
  assert('returns token', typeof d1?.token === 'string' && d1.token.length > 0);
  assert('returns agente', !!d1?.agente?.id);
  token = d1?.token ?? '';

  // Invalid login
  const { status: s2 } = await api('POST', '/api/auth/login', {
    email: ADMIN_EMAIL, password: 'wrong',
  }, null);
  assert('invalid login → 401', s2 === 401, `status: ${s2}`);

  // Protected endpoint without token
  const { status: s3 } = await api('GET', '/api/agentes', undefined, null);
  assert('protected without token → 401', s3 === 401, `status: ${s3}`);

  // Protected endpoint with token
  const { status: s4 } = await api('GET', '/api/agentes');
  assert('protected with token → 200', s4 === 200, `status: ${s4}`);
}

async function testComplejosCrud(): Promise<string> {
  section('3. COMPLEJOS CRUD');

  // List
  const { status: s1, data: d1 } = await api('GET', '/api/complejos');
  assert('GET /api/complejos → 200', s1 === 200, `status: ${s1}`);
  assert('returns array', Array.isArray(d1), `type: ${typeof d1}`);

  // Create
  const { status: s2, data: d2 } = await api('POST', '/api/complejos', {
    nombre: 'TEST_COMPLEJO_AUTO',
    capacidad: 4,
    cantidadUnidades: 1,
    dormitorios: 2,
    banos: 1,
    amenities: ['wifi', 'pileta'],
  });
  assert('POST /api/complejos → 201', s2 === 201, `status: ${s2}`);
  assert('returns id', !!d2?.id);
  const complejoId = d2?.id ?? '';

  // Get by id
  const { status: s3, data: d3 } = await api('GET', `/api/complejos/${complejoId}`);
  assert('GET /api/complejos/:id → 200', s3 === 200, `status: ${s3}`);
  assert('nombre matches', d3?.nombre === 'TEST_COMPLEJO_AUTO', `got: ${d3?.nombre}`);

  // Update
  const { status: s4, data: d4 } = await api('PATCH', `/api/complejos/${complejoId}`, {
    nombre: 'TEST_COMPLEJO_AUTO', // keep same name for cleanup
    direccion: 'Calle Test 123',
  });
  assert('PATCH /api/complejos/:id → 200', s4 === 200, `status: ${s4}`);
  assert('direccion updated', d4?.direccion === 'Calle Test 123', `got: ${d4?.direccion}`);

  return complejoId;
}

async function testTarifas(complejoId: string) {
  section('4. TARIFAS ESTANDAR');

  // Upsert tarifa alta
  const { status: s1, data: d1 } = await api('PUT', `/api/complejos/${complejoId}/tarifas`, {
    temporada: 'alta', precioNoche: 50000, estadiaMinima: 3,
  });
  assert('PUT tarifa alta → 200', s1 === 200, `status: ${s1}`);
  assert('temporada = alta', d1?.temporada === 'alta');

  // Upsert same season (should update, not duplicate)
  const { status: s2, data: d2 } = await api('PUT', `/api/complejos/${complejoId}/tarifas`, {
    temporada: 'alta', precioNoche: 55000, estadiaMinima: 3,
  });
  assert('PUT same temporada → 200 (upsert)', s2 === 200, `status: ${s2}`);
  assert('precioNoche updated to 55000', d2?.precioNoche === 55000, `got: ${d2?.precioNoche}`);

  // Verify in complejo detail
  const { data: d3 } = await api('GET', `/api/complejos/${complejoId}`);
  const tarifas = d3?.tarifas ?? [];
  assert('complejo has 1 tarifa (not duplicated)', tarifas.length === 1, `count: ${tarifas.length}`);
}

async function testTarifasEspeciales(complejoId: string) {
  section('5. TARIFAS ESPECIALES');

  // Create
  const { status: s1, data: d1 } = await api('POST', `/api/complejos/${complejoId}/tarifas-especiales`, {
    fechaInicio: '2026-06-01', fechaFin: '2026-06-15',
    precioNoche: 70000, motivo: 'Test especial',
  });
  assert('POST tarifa especial → 201', s1 === 201, `status: ${s1}`);
  assert('returns id', !!d1?.id);
  const teId = d1?.id ?? '';

  // List
  const { status: s2, data: d2 } = await api('GET', `/api/complejos/${complejoId}/tarifas-especiales`);
  assert('GET tarifas-especiales → 200', s2 === 200, `status: ${s2}`);
  assert('list has entry', Array.isArray(d2) && d2.length >= 1, `count: ${d2?.length}`);

  // Update
  const { status: s3, data: d3 } = await api('PATCH', `/api/complejos/${complejoId}/tarifas-especiales/${teId}`, {
    precioNoche: 75000,
  });
  assert('PATCH tarifa especial → 200', s3 === 200, `status: ${s3}`);
  assert('precioNoche updated to 75000', d3?.precioNoche === 75000, `got: ${d3?.precioNoche}`);

  // Delete
  const { status: s4 } = await api('DELETE', `/api/complejos/${complejoId}/tarifas-especiales/${teId}`);
  assert('DELETE tarifa especial → 200', s4 === 200, `status: ${s4}`);
}

async function testBloqueos(complejoId: string) {
  section('6. BLOQUEOS DE DISPONIBILIDAD');

  // Create bloqueo
  const { status: s1, data: d1 } = await api('POST', `/api/complejos/${complejoId}/bloqueos`, {
    fechaInicio: '2026-07-01', fechaFin: '2026-07-05', motivo: 'Test block',
  });
  assert('POST bloqueo → 201', s1 === 201, `status: ${s1}`);
  assert('returns id', !!d1?.id);
  const bloqueoId = d1?.id ?? '';

  // List bloqueos
  const { status: s2, data: d2 } = await api('GET', `/api/complejos/${complejoId}/bloqueos`);
  assert('GET bloqueos → 200', s2 === 200, `status: ${s2}`);
  assert('list has entry', Array.isArray(d2) && d2.length >= 1, `count: ${d2?.length}`);

  // Check inventory blocked — use a real habitacion with seeded inventory
  // blockDates only updates existing rows, so test complejo won't have inventory
  // Instead, verify the block API worked by checking the bloqueo is in the list
  const { status: s3, data: d3 } = await api('GET', `/api/complejos/${complejoId}/bloqueos`);
  assert('bloqueo still in list before delete', Array.isArray(d3) && d3.some((b: any) => b.id === bloqueoId));

  // Delete bloqueo
  const { status: s4 } = await api('DELETE', `/api/complejos/${complejoId}/bloqueos/${bloqueoId}`);
  assert('DELETE bloqueo → 200', s4 === 200, `status: ${s4}`);
}

async function testInventario() {
  section('7. INVENTARIO');

  // Get inventory (use first real habitacion from DB)
  const firstInv = await prisma.inventario.findFirst();
  if (!firstInv) {
    assert('inventario has data', false, 'no inventory rows found');
    return;
  }

  const hab = firstInv.habitacion;
  const fecha = firstInv.fecha;
  const mes = fecha.getMonth() + 1;
  const anio = fecha.getFullYear();

  const { status: s1, data: d1 } = await api('GET', `/api/inventario?habitacion=${encodeURIComponent(hab)}&mes=${mes}&anio=${anio}`);
  assert('GET /api/inventario → 200', s1 === 200, `status: ${s1}`);
  assert('returns array', Array.isArray(d1), `type: ${typeof d1}`);

  // Check availability
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const fe = tomorrow.toISOString().split('T')[0];
  const fs = nextWeek.toISOString().split('T')[0];

  const { status: s2, data: d2 } = await api('GET',
    `/api/inventario/disponibilidad?fechaEntrada=${fe}&fechaSalida=${fs}`);
  assert('GET /api/inventario/disponibilidad → 200', s2 === 200, `status: ${s2}`);
  assert('returns data', d2 !== null && d2 !== undefined);

  // Update single entry
  const { status: s3, data: d3 } = await api('PUT', `/api/inventario/${firstInv.id}`, {
    disponible: firstInv.disponible,
    precio: firstInv.precio,
    notas: 'test_nota_auto',
  });
  assert('PUT /api/inventario/:id → 200', s3 === 200, `status: ${s3}`);
  assert('notas updated', d3?.notas === 'test_nota_auto', `got: ${d3?.notas}`);

  // Restore original
  await api('PUT', `/api/inventario/${firstInv.id}`, {
    disponible: firstInv.disponible,
    precio: firstInv.precio,
    notas: firstInv.notas ?? null,
  });
}

async function testReservas(): Promise<string> {
  section('8. RESERVAS CRUD + ESTADOS');

  // Create manual reservation
  const { status: s1, data: d1 } = await api('POST', '/api/reservas/manual', {
    nombreHuesped: 'TEST_HUESPED_AUTO',
    telefonoHuesped: '5491100000000',
    fechaEntrada: '2026-08-01',
    fechaSalida: '2026-08-05',
    numHuespedes: 2,
    habitacion: 'Pewmafe',
    tarifaNoche: 40000,
    precioTotal: 160000,
    notas: 'Test reservation',
  });
  assert('POST /api/reservas/manual → 201', s1 === 201, `status: ${s1}`);
  assert('returns id', !!d1?.id);
  assert('estado = pre_reserva', d1?.estado === 'pre_reserva', `got: ${d1?.estado}`);
  const reservaId = d1?.id ?? '';

  // List reservas
  const { status: s2, data: d2 } = await api('GET', '/api/reservas');
  assert('GET /api/reservas → 200', s2 === 200, `status: ${s2}`);
  assert('list includes new reserva', Array.isArray(d2) && d2.some((r: any) => r.id === reservaId));

  // Get by id
  const { status: s3, data: d3 } = await api('GET', `/api/reservas/${reservaId}`);
  assert('GET /api/reservas/:id → 200', s3 === 200, `status: ${s3}`);
  assert('nombreHuesped matches', d3?.nombreHuesped === 'TEST_HUESPED_AUTO');

  // Filter by date range
  const { status: s4, data: d4 } = await api('GET', '/api/reservas?from=2026-08-01&to=2026-08-31');
  assert('GET /api/reservas?from&to → 200', s4 === 200, `status: ${s4}`);
  assert('date range includes reservation', Array.isArray(d4) && d4.some((r: any) => r.id === reservaId));

  // Update datos
  const { status: s5, data: d5 } = await api('PATCH', `/api/reservas/${reservaId}`, {
    notas: 'Updated test note',
  });
  assert('PATCH /api/reservas/:id → 200', s5 === 200, `status: ${s5}`);
  assert('notas updated', d5?.notas === 'Updated test note', `got: ${d5?.notas}`);

  // Estado: pre_reserva → confirmada
  const { status: s6, data: d6 } = await api('PATCH', `/api/reservas/${reservaId}/estado`, {
    estado: 'confirmada',
  });
  assert('estado → confirmada (200)', s6 === 200, `status: ${s6}`);
  assert('estado = confirmada', d6?.estado === 'confirmada', `got: ${d6?.estado}`);

  // Estado: confirmada → completada
  const { status: s7, data: d7 } = await api('PATCH', `/api/reservas/${reservaId}/estado`, {
    estado: 'completada',
  });
  assert('estado → completada (200)', s7 === 200, `status: ${s7}`);
  assert('estado = completada', d7?.estado === 'completada', `got: ${d7?.estado}`);

  // Estado: completada → cancelada
  const { status: s8, data: d8 } = await api('PATCH', `/api/reservas/${reservaId}/estado`, {
    estado: 'cancelada',
  });
  assert('estado → cancelada (200)', s8 === 200, `status: ${s8}`);
  assert('estado = cancelada', d8?.estado === 'cancelada', `got: ${d8?.estado}`);

  return reservaId;
}

async function testHuespedes() {
  section('9. HUESPEDES');

  const { status: s1, data: d1 } = await api('GET', '/api/huespedes');
  assert('GET /api/huespedes → 200', s1 === 200, `status: ${s1}`);
  assert('returns array', Array.isArray(d1));

  if (Array.isArray(d1) && d1.length > 0) {
    const hId = d1[0].id;

    const { status: s2, data: d2 } = await api('GET', `/api/huespedes/${hId}`);
    assert('GET /api/huespedes/:id → 200', s2 === 200, `status: ${s2}`);
    assert('has reservas field', 'reservas' in (d2 ?? {}));

    // Update (save original name to restore)
    const originalNombre = d2?.nombre;
    const { status: s3, data: d3 } = await api('PATCH', `/api/huespedes/${hId}`, {
      nombre: 'TEST_NOMBRE_TEMP',
    });
    assert('PATCH /api/huespedes/:id → 200', s3 === 200, `status: ${s3}`);
    assert('nombre updated', d3?.nombre === 'TEST_NOMBRE_TEMP', `got: ${d3?.nombre}`);

    // Restore
    await api('PATCH', `/api/huespedes/${hId}`, { nombre: originalNombre });
  } else {
    console.log('  SKIP: no huespedes to test detail/update');
  }
}

async function testAgentes() {
  section('10. AGENTES');

  // List
  const { status: s1, data: d1 } = await api('GET', '/api/agentes');
  assert('GET /api/agentes → 200', s1 === 200, `status: ${s1}`);
  assert('returns array', Array.isArray(d1));

  // Create agent (admin only)
  const { status: s2, data: d2 } = await api('POST', '/api/agentes', {
    nombre: 'Test Agent Auto',
    email: 'test_agent@testall.com',
    password: 'test123456',
    rol: 'agente',
  });
  assert('POST /api/agentes → 201', s2 === 201, `status: ${s2}`);
  assert('returns agent id', !!d2?.id);
  assert('rol = agente', d2?.rol === 'agente', `got: ${d2?.rol}`);

  // Verify agent appears in list
  const { data: d3 } = await api('GET', '/api/agentes');
  const found = Array.isArray(d3) && d3.some((a: any) => a.email === 'test_agent@testall.com');
  assert('new agent in list', found);
}

async function testConversaciones() {
  section('11. CONVERSACIONES');

  // List
  const { status: s1, data: d1 } = await api('GET', '/api/conversaciones');
  assert('GET /api/conversaciones → 200', s1 === 200, `status: ${s1}`);
  assert('returns array', Array.isArray(d1));

  // Create conversation via simulator
  const { status: s2 } = await api('POST', '/api/simulator/send', {
    from: SIM_FROM, body: 'hola', name: 'TestAll',
  }, null);
  assert('POST /api/simulator/send → 200', s2 === 200, `status: ${s2}`);

  // Wait for bot processing
  console.log('  ... waiting 12s for bot processing ...');
  await sleep(12000);

  // Find the conversation created
  const huesped = await prisma.huesped.findFirst({ where: { waId: SIM_FROM } });
  assert('simulator created huesped', !!huesped);
  if (!huesped) return;

  const conv = await prisma.conversacion.findFirst({
    where: { huespedId: huesped.id },
    orderBy: { ultimoMensajeEn: 'desc' },
  });
  assert('simulator created conversacion', !!conv);
  if (!conv) return;

  // Get mensajes
  const { status: s3, data: d3 } = await api('GET', `/api/conversaciones/${conv.id}/mensajes`);
  assert('GET /api/conversaciones/:id/mensajes → 200', s3 === 200, `status: ${s3}`);
  assert('has messages', Array.isArray(d3) && d3.length >= 1, `count: ${d3?.length}`);

  // Agent takes control
  const { status: s4, data: d4 } = await api('POST', `/api/conversaciones/${conv.id}/tomar-control`);
  assert('POST tomar-control → 200', s4 === 200, `status: ${s4}`);
  assert('estado = humano_activo', d4?.estado === 'humano_activo', `got: ${d4?.estado}`);

  // Return to bot
  const { status: s5, data: d5 } = await api('POST', `/api/conversaciones/${conv.id}/devolver-bot`);
  assert('POST devolver-bot → 200', s5 === 200, `status: ${s5}`);
  assert('estado = bot', d5?.estado === 'bot', `got: ${d5?.estado}`);

  // Close
  const { status: s6, data: d6 } = await api('POST', `/api/conversaciones/${conv.id}/cerrar`);
  assert('POST cerrar → 200', s6 === 200, `status: ${s6}`);
  assert('estado = cerrado', d6?.estado === 'cerrado', `got: ${d6?.estado}`);
}

async function testSimulatorBot() {
  section('12. SIMULATOR + BOT ENGINE');

  // Clean previous sim data
  const oldHuesped = await prisma.huesped.findFirst({ where: { waId: SIM_FROM } });
  if (oldHuesped) {
    const convs = await prisma.conversacion.findMany({ where: { huespedId: oldHuesped.id } });
    for (const c of convs) {
      await prisma.mensaje.deleteMany({ where: { conversacionId: c.id } });
      await prisma.reserva.deleteMany({ where: { conversacionId: c.id } });
    }
    await prisma.conversacion.deleteMany({ where: { huespedId: oldHuesped.id } });
    await prisma.huesped.delete({ where: { id: oldHuesped.id } });
  }
  await sleep(2000);

  // Send a greeting
  const { status: s1 } = await api('POST', '/api/simulator/send', {
    from: SIM_FROM, body: 'hola buenas tardes', name: 'TestAll',
  }, null);
  assert('simulator send greeting → 200', s1 === 200, `status: ${s1}`);
  console.log('  ... waiting 12s for bot to process ...');
  await sleep(12000);

  // Verify huesped created
  const huesped = await prisma.huesped.findFirst({ where: { waId: SIM_FROM } });
  assert('huesped created in DB', !!huesped);

  // Verify conversacion created
  const conv = huesped ? await prisma.conversacion.findFirst({
    where: { huespedId: huesped.id },
    orderBy: { ultimoMensajeEn: 'desc' },
  }) : null;
  assert('conversacion created in DB', !!conv);

  // Verify bot responded with messages
  if (conv) {
    const botMsg = await prisma.mensaje.findFirst({
      where: { conversacionId: conv.id, origen: 'bot' },
      orderBy: { creadoEn: 'desc' },
    });
    assert('bot responded with message', !!botMsg);
    assert('message has metadata', !!botMsg?.metadata);

    const meta = botMsg?.metadata as any;
    if (meta?.intent) {
      assert('intent classified (saludo expected)', meta.intent === 'saludo', `got: ${meta.intent}`);
    } else {
      assert('intent in metadata', !!meta?.intent, 'no intent found');
    }
  }

  // Send a message with entities and verify retention
  await api('POST', '/api/simulator/send', {
    from: SIM_FROM, body: 'quiero consultar disponibilidad para 2 personas del 15 al 20 de abril', name: 'TestAll',
  }, null);
  console.log('  ... waiting 12s for bot ...');
  await sleep(12000);

  if (conv) {
    const botMsg2 = await prisma.mensaje.findFirst({
      where: { conversacionId: conv.id, origen: 'bot' },
      orderBy: { creadoEn: 'desc' },
    });
    const entities = (botMsg2?.metadata as any)?.entities ?? {};
    assert('entities retained (fecha_entrada)', !!entities.fecha_entrada, `got: ${JSON.stringify(entities)}`);
    assert('entities retained (num_personas)', !!entities.num_personas, `got: ${JSON.stringify(entities)}`);
  }

  // Reset with "hola"
  await api('POST', '/api/simulator/send', {
    from: SIM_FROM, body: 'hola', name: 'TestAll',
  }, null);
  console.log('  ... waiting 12s for reset ...');
  await sleep(12000);

  if (conv) {
    const botMsg3 = await prisma.mensaje.findFirst({
      where: { conversacionId: conv.id, origen: 'bot' },
      orderBy: { creadoEn: 'desc' },
    });
    const entities3 = (botMsg3?.metadata as any)?.entities ?? {};
    assert('entities reset after "hola"', Object.keys(entities3).length === 0, `got: ${JSON.stringify(entities3)}`);
  }
}

async function testComplejoSoftDelete(complejoId: string) {
  section('3b. COMPLEJO SOFT DELETE');

  // Soft delete
  const { status: s1, data: d1 } = await api('DELETE', `/api/complejos/${complejoId}`);
  assert('DELETE /api/complejos/:id → 200', s1 === 200, `status: ${s1}`);
  assert('activo = false after delete', d1?.activo === false, `got: ${d1?.activo}`);

  // Verify still fetchable but inactive
  const { status: s2, data: d2 } = await api('GET', `/api/complejos/${complejoId}`);
  assert('GET still returns soft-deleted complejo', s2 === 200, `status: ${s2}`);
  assert('complejo is inactive', d2?.activo === false, `got: ${d2?.activo}`);
}

// ─── Preflight ────────────────────────────────────────────────

async function preflight() {
  const backend = await fetch('http://localhost:5050/api/health').catch(() => null);
  if (!backend || backend.status !== 200) {
    console.error('\x1b[31mFATAL: Backend no disponible en puerto 5050\x1b[0m');
    console.error('Ejecutar: npm run dev:test (desde raíz del proyecto)');
    process.exit(1);
  }
  const frontend = await fetch('http://localhost:5173/').catch(() => null);
  if (!frontend || frontend.status !== 200) {
    console.error('\x1b[31mFATAL: Frontend no disponible en puerto 5173\x1b[0m');
    console.error('Ejecutar: npm run dev:test (desde raíz del proyecto)');
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE INTEGRATION TEST SUITE             ║');
  console.log('║   Target: http://localhost:5050                    ║');
  console.log('╚════════════════════════════════════════════════════╝');

  // Preflight: verify both services are running
  await preflight();

  // Pre-cleanup
  console.log('\nCleaning up previous test data...');
  await cleanupTestData();

  try {
    // 1. Health
    await testHealth();

    // 2. Auth (sets global token)
    await testAuth();

    // 3. Complejos CRUD (returns complejoId)
    const complejoId = await testComplejosCrud();

    // 4. Tarifas
    await testTarifas(complejoId);

    // 5. Tarifas Especiales
    await testTarifasEspeciales(complejoId);

    // 6. Bloqueos
    await testBloqueos(complejoId);

    // 7. Inventario
    await testInventario();

    // 8. Reservas
    await testReservas();

    // 9. Huespedes
    await testHuespedes();

    // 10. Agentes
    await testAgentes();

    // 11. Conversaciones (uses simulator)
    await testConversaciones();

    // 12. Simulator + Bot Engine
    await testSimulatorBot();

    // 3b. Soft delete complejo at the end
    await testComplejoSoftDelete(complejoId);

  } catch (err) {
    console.error('\n  FATAL ERROR:', err);
    failed++;
  }

  // Final cleanup
  console.log('\nCleaning up test data...');
  await cleanupTestData();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log(`║   RESULTS: ${passed} passed, ${failed} failed${' '.repeat(Math.max(0, 28 - String(passed).length - String(failed).length))}║`);
  console.log('╚════════════════════════════════════════════════════╝\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Test suite error:', e);
  process.exit(1);
});
