/**
 * PROFESSIONAL QA TEST SUITE
 * Tests business logic, bot behavior, data integrity, and edge cases.
 * Goes beyond HTTP status codes — validates CONTENT of responses.
 *
 * Run: npx tsx server/src/scripts/testQA.ts
 * Requires: server on localhost:5050 with SIMULATOR_MODE=true
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5050';
const ADMIN_EMAIL = 'admin@chatboot.com';
const ADMIN_PASS = 'admin123';
const FROM = '5491177770000';

let passed = 0;
let failed = 0;
let skipped = 0;
let token = '';
const failures: string[] = [];

// ─── Helpers ──────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function api(method: string, path: string, body?: unknown, authToken?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken !== null) headers['Authorization'] = `Bearer ${authToken ?? token}`;
  const opts: RequestInit = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, data: data as any };
}

function assert(testName: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  \x1b[32mPASS\x1b[0m: ${testName}`);
    passed++;
  } else {
    const msg = `${testName}${details ? ' — ' + details : ''}`;
    console.log(`  \x1b[31mFAIL\x1b[0m: ${msg}`);
    failed++;
    failures.push(msg);
  }
}

function skip(testName: string, reason: string) {
  console.log(`  \x1b[33mSKIP\x1b[0m: ${testName} — ${reason}`);
  skipped++;
}

function section(title: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

async function sendSim(body: string): Promise<void> {
  await api('POST', '/api/simulator/send', { body, from: FROM, name: 'QA_Tester' }, null);
  await sleep(12000);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getLastBotMsg(): Promise<{ contenido: string; metadata: any } | null> {
  const huesped = await prisma.huesped.findFirst({ where: { waId: FROM } });
  if (!huesped) return null;
  const conv = await prisma.conversacion.findFirst({
    where: { huespedId: huesped.id },
    orderBy: { ultimoMensajeEn: 'desc' },
  });
  if (!conv) return null;
  const msg = await prisma.mensaje.findFirst({
    where: { conversacionId: conv.id, origen: 'bot' },
    orderBy: { creadoEn: 'desc' },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return msg ? { contenido: msg.contenido, metadata: msg.metadata as any } : null;
}

async function cleanupSimData() {
  const huesped = await prisma.huesped.findFirst({ where: { waId: FROM } });
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
  await sleep(2000);
}

// ─── QA-01: Data Integrity ───────────────────────────────────

async function qa01_DataIntegrity() {
  section('QA-01: DATA INTEGRITY — Verificar datos de complejos en DB');

  const complejos = await prisma.complejo.findMany({
    where: { activo: true },
    include: { tarifas: true, tarifasEspeciales: true },
  });

  assert('hay complejos activos', complejos.length > 0, `found: ${complejos.length}`);

  for (const c of complejos) {
    // Cada complejo debe tener capacidad > 0
    assert(`${c.nombre}: capacidad > 0`, c.capacidad > 0, `capacidad: ${c.capacidad}`);

    // Cada complejo debe tener tarifas para las 3 temporadas
    const temporadas = c.tarifas.map((t) => t.temporada);
    assert(`${c.nombre}: tiene tarifa baja`, temporadas.includes('baja'), `temporadas: ${temporadas.join(', ')}`);
    assert(`${c.nombre}: tiene tarifa media`, temporadas.includes('media'), `temporadas: ${temporadas.join(', ')}`);
    assert(`${c.nombre}: tiene tarifa alta`, temporadas.includes('alta'), `temporadas: ${temporadas.join(', ')}`);

    // Tarifas deben tener precios > 0
    for (const t of c.tarifas) {
      assert(`${c.nombre} tarifa ${t.temporada}: precio > 0`, Number(t.precioNoche) > 0, `precio: ${t.precioNoche}`);
    }

    // Si tiene estadiaMinima en complejo, debe ser razonable (1-30)
    if (c.estadiaMinima !== null) {
      assert(
        `${c.nombre}: estadiaMinima razonable`,
        c.estadiaMinima >= 1 && c.estadiaMinima <= 30,
        `got: ${c.estadiaMinima}`,
      );
    }
  }

  // Verificar que solo Pewmafe tiene estadiaMinima configurada

  // Pewmafe puede tener estadiaMinima en tarifas, los demás NO deben tener en complejo
  for (const c of complejos) {
    if (c.nombre !== 'Pewmafe') {
      assert(`${c.nombre}: NO tiene estadiaMinima en complejo`, c.estadiaMinima === null, `got: ${c.estadiaMinima}`);
      const tarifasConMin = c.tarifas.filter((t) => t.estadiaMinima !== null);
      assert(
        `${c.nombre}: NO tiene estadiaMinima en tarifas`,
        tarifasConMin.length === 0,
        `found ${tarifasConMin.length} tarifas con estadiaMinima`,
      );
    }
  }
}

// ─── QA-02: Inventory Integrity ──────────────────────────────

async function qa02_InventoryIntegrity() {
  section('QA-02: INVENTORY INTEGRITY — Inventario coherente');

  const habitaciones = ['Pewmafe', 'Luminar Mono', 'Luminar 2Amb', 'LG'];
  const today = new Date();
  const mes = today.getMonth() + 1;
  const anio = today.getFullYear();

  for (const hab of habitaciones) {
    const { status, data } = await api(
      'GET',
      `/api/inventario?habitacion=${encodeURIComponent(hab)}&mes=${mes}&anio=${anio}`,
    );
    assert(`${hab}: inventario mes actual → 200`, status === 200, `status: ${status}`);
    assert(`${hab}: tiene entries`, Array.isArray(data) && data.length > 0, `count: ${data?.length}`);

    if (Array.isArray(data) && data.length > 0) {
      // Precios deben ser > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sinPrecio = data.filter((e: any) => Number(e.precio) <= 0);
      assert(`${hab}: todos los precios > 0`, sinPrecio.length === 0, `${sinPrecio.length} entries con precio <= 0`);
    }
  }
}

// ─── QA-03: Context Generation ───────────────────────────────

async function qa03_ContextGeneration() {
  section('QA-03: CONTEXT GENERATION — Contexto para Claude correcto');

  // Import dynamically
  const { getFullContext, getFilteredContext } = await import('../data/accommodationContext.js');

  const fullCtx = await getFullContext();

  // Full context should mention all active complejos
  assert('fullContext menciona Pewmafe', fullCtx.includes('Pewmafe'));
  assert('fullContext menciona Luminar Mono', fullCtx.includes('Luminar Mono'));
  assert('fullContext menciona LG', fullCtx.includes('LG'));

  // Only Pewmafe should show estadiaMinima
  assert(
    'fullContext: Pewmafe tiene estadia minima',
    fullCtx.includes('Estadia minima') && fullCtx.includes('Pewmafe'),
  );

  // Check that Luminar Mono/2Amb/LG do NOT have estadia minima lines
  const lines = fullCtx.split('\n');
  let currentDepto = '';
  for (const line of lines) {
    if (line.startsWith('### ')) currentDepto = line.replace('### ', '');
    if (line.includes('Estadia minima') && currentDepto !== 'Pewmafe') {
      assert(`${currentDepto}: NO debe tener estadia minima en contexto`, false, `found: ${line.trim()}`);
    }
  }
  // If we got here without failing, explicitly pass
  const nonPewmafaEstadia = lines.filter((l) => {
    return l.includes('Estadia minima');
  });
  // Should only be 1 line (Pewmafe's)
  assert(
    'solo 1 linea de estadia minima en contexto (Pewmafe)',
    nonPewmafaEstadia.length === 1,
    `found ${nonPewmafaEstadia.length} lines`,
  );

  // Filtered context should ONLY show the requested depto
  const filteredCtx = await getFilteredContext('Pewmafe');
  assert('filteredContext: incluye Pewmafe', filteredCtx.includes('Pewmafe'));
  assert('filteredContext: NO menciona Luminar Mono como depto disponible', !filteredCtx.includes('### Luminar Mono'));

  // Tarifas should have actual prices, not zeros
  assert('fullContext: incluye tabla de tarifas', fullCtx.includes('Temp. Baja'));
  assert('fullContext: tiene precios con $', (fullCtx.match(/\$\d/g) || []).length > 0);
}

// ─── QA-04: Bot Minimum Stay (THE REPORTED BUG) ─────────────

async function qa04_BotMinimumStay() {
  section('QA-04: BOT MINIMUM STAY — No inventar estadia minima');

  await cleanupSimData();

  // Test: 1 noche para 2 personas — only Pewmafe should reject
  await sendSim('hola');
  await sendSim('quiero ver disponibilidad para 2 personas, 1 noche, para el 20 de marzo');

  const msg = await getLastBotMsg();
  assert('bot responded', !!msg);

  if (msg) {
    const text = msg.contenido.toLowerCase();

    // Bot should NOT say ALL departments have minimum stay
    assert(
      'NO dice "todos nuestros departamentos tienen estadía mínima"',
      !text.includes('todos nuestros departamentos tienen') || !text.includes('mínima'),
      `response: ${text.substring(0, 200)}`,
    );

    // Bot should NOT invent minimum for Luminar
    assert(
      'NO inventa minimo para Luminar Mono',
      !text.includes('luminar mono') || !text.includes('mínimo 4'),
      `response: ${text.substring(0, 300)}`,
    );

    assert(
      'NO inventa minimo para Luminar 2Amb',
      !text.includes('luminar 2amb') || !text.includes('mínimo 4'),
      `response: ${text.substring(0, 300)}`,
    );

    assert(
      'NO inventa minimo para LG',
      !text.includes('lg') || !text.includes('mínimo 5'),
      `response: ${text.substring(0, 300)}`,
    );

    // Pewmafe CAN have minimum stay mentioned (it's real: 2 noches in baja)
    // But the bot should offer the other departments as available
    console.log(`  [INFO] Bot response:\n    ${msg.contenido.replace(/\n/g, '\n    ')}`);
  }
}

// ─── QA-05: Bot Capacity Logic ───────────────────────────────

async function qa05_BotCapacity() {
  section('QA-05: BOT CAPACITY — No ofrecer deptos inadecuados');

  await cleanupSimData();

  // Test: 5 persons — NO department has capacity for 5 per unit
  // (Pewmafe max 6, Luminar Mono max 3, Luminar 2Amb max 4, LG max 4)
  await sendSim('hola');
  await sendSim('somos 5 personas, del 20 al 25 de marzo');

  const msg = await getLastBotMsg();
  assert('bot responded', !!msg);

  if (msg) {
    const text = msg.contenido.toLowerCase();

    // Should NOT offer Luminar Mono as SOLE option for 5 personas (max 3)
    // Bot may correctly mention it as part of a combination — that's valid behavior
    const offersMonoAlone =
      text.includes('luminar mono') &&
      !text.includes('combin') &&
      !text.includes('2 departamento') &&
      !text.includes('no apto') &&
      !text.includes('no tiene capacidad') &&
      !text.includes('no alcanza') &&
      !text.includes('pewmafe');
    assert('NO ofrece Luminar Mono SOLO para 5 personas', !offersMonoAlone, `response: ${text.substring(0, 300)}`);

    console.log(`  [INFO] Bot response:\n    ${msg.contenido.replace(/\n/g, '\n    ')}`);
  }
}

// ─── QA-06: Bot Entity Retention ─────────────────────────────

async function qa06_EntityRetention() {
  section('QA-06: BOT ENTITY RETENTION — Acumulacion correcta');

  await cleanupSimData();

  // Step 1: Give partial info
  await sendSim('hola');
  await sendSim('quiero consultar disponibilidad para 3 personas');

  let msg = await getLastBotMsg();
  let entities = msg?.metadata?.entities ?? {};
  assert('retiene num_personas=3', entities.num_personas === '3', `got: ${entities.num_personas}`);

  // Step 2: Give dates
  await sendSim('del 15 al 20 de abril');

  msg = await getLastBotMsg();
  entities = msg?.metadata?.entities ?? {};
  assert('retiene num_personas after dates', entities.num_personas === '3', `got: ${entities.num_personas}`);
  assert('tiene fecha_entrada', !!entities.fecha_entrada, `got: ${entities.fecha_entrada}`);
  assert('tiene fecha_salida', !!entities.fecha_salida, `got: ${entities.fecha_salida}`);

  // Bot should NOT re-ask for personas
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert(
      'NO re-pregunta cuántas personas',
      !text.includes('cuántas personas') && !text.includes('cuantas personas'),
      `response: ${text.substring(0, 200)}`,
    );
  }

  // Step 3: "hola" resets
  await sendSim('hola');
  msg = await getLastBotMsg();
  entities = msg?.metadata?.entities ?? {};
  assert('entities vacias despues de "hola"', Object.keys(entities).length === 0, `got: ${JSON.stringify(entities)}`);
}

// ─── QA-07: Reservation Business Rules ───────────────────────

async function qa07_ReservationRules() {
  section('QA-07: RESERVATION BUSINESS RULES');

  // Create manual reservation
  const { status: s1, data: d1 } = await api('POST', '/api/reservas/manual', {
    nombreHuesped: 'QA_Test_Huesped',
    telefonoHuesped: '5491100000000',
    fechaEntrada: '2026-09-01',
    fechaSalida: '2026-09-05',
    numHuespedes: 2,
    habitacion: 'Pewmafe',
    precioTotal: 280000,
  });
  assert('crear reserva manual → 201', s1 === 201, `status: ${s1}`);
  assert('estado inicial = pre_reserva', d1?.estado === 'pre_reserva', `got: ${d1?.estado}`);
  const rId = d1?.id;

  // Cannot jump to completada from pre_reserva (should still work - no restriction in code)
  // But business rule: pre_reserva → confirmada → completada
  const { status: s2, data: d2 } = await api('PATCH', `/api/reservas/${rId}/estado`, { estado: 'confirmada' });
  assert('pre_reserva → confirmada OK', s2 === 200 && d2?.estado === 'confirmada');

  const { status: s3, data: d3 } = await api('PATCH', `/api/reservas/${rId}/estado`, { estado: 'completada' });
  assert('confirmada → completada OK', s3 === 200 && d3?.estado === 'completada');

  // Test cancelación
  const { data: d4 } = await api('POST', '/api/reservas/manual', {
    nombreHuesped: 'QA_Cancel_Test',
    fechaEntrada: '2026-09-10',
    fechaSalida: '2026-09-15',
    numHuespedes: 1,
  });
  if (d4?.id) {
    const { data: d5 } = await api('PATCH', `/api/reservas/${d4.id}/estado`, { estado: 'cancelada' });
    assert('cancelar reserva OK', d5?.estado === 'cancelada');
  }

  // Cleanup
  await prisma.reserva.deleteMany({ where: { nombreHuesped: { in: ['QA_Test_Huesped', 'QA_Cancel_Test'] } } });
}

// ─── QA-08: Auth & Authorization ─────────────────────────────

async function qa08_AuthRules() {
  section('QA-08: AUTH & AUTHORIZATION');

  // Login
  const { data: loginData } = await api('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS }, null);
  token = loginData?.token ?? '';

  // Non-admin cannot create agents
  // First create a non-admin agent
  const { data: agentData } = await api('POST', '/api/agentes', {
    nombre: 'QA Non-Admin',
    email: 'qa_nonadmin@test.com',
    password: 'test123456',
    rol: 'agente',
  });

  if (agentData?.id) {
    // Login as non-admin
    const { data: nonAdminLogin } = await api(
      'POST',
      '/api/auth/login',
      {
        email: 'qa_nonadmin@test.com',
        password: 'test123456',
      },
      null,
    );

    if (nonAdminLogin?.token) {
      // Try to create agent as non-admin
      const { status } = await api(
        'POST',
        '/api/agentes',
        {
          nombre: 'Should Fail',
          email: 'shouldfail@test.com',
          password: 'test123456',
          rol: 'agente',
        },
        nonAdminLogin.token,
      );
      assert('non-admin cannot create agents → 403', status === 403, `status: ${status}`);
    }

    // Cleanup
    await prisma.agente.deleteMany({ where: { email: { in: ['qa_nonadmin@test.com', 'shouldfail@test.com'] } } });
  }

  // Expired/invalid token
  const { status: s1 } = await api('GET', '/api/agentes', undefined, 'invalid.token.here');
  assert('invalid token → 401', s1 === 401, `status: ${s1}`);
}

// ─── QA-09: Conversation State Machine ───────────────────────

async function qa09_ConversationStateMachine() {
  section('QA-09: CONVERSATION STATE MACHINE');

  await cleanupSimData();

  // Create conversation via simulator
  await sendSim('hola');

  const huesped = await prisma.huesped.findFirst({ where: { waId: FROM } });
  if (!huesped) {
    skip('state machine tests', 'no huesped created');
    return;
  }

  const conv = await prisma.conversacion.findFirst({
    where: { huespedId: huesped.id },
    orderBy: { ultimoMensajeEn: 'desc' },
  });
  if (!conv) {
    skip('state machine tests', 'no conversation found');
    return;
  }

  assert('initial estado = bot', conv.estado === 'bot');

  // Tomar control
  const { data: d1 } = await api('POST', `/api/conversaciones/${conv.id}/tomar-control`);
  assert('tomar-control → humano_activo', d1?.estado === 'humano_activo');

  // Agent sends message
  const { status: s2, data: d2 } = await api('POST', `/api/conversaciones/${conv.id}/mensajes`, {
    contenido: 'Hola, soy un agente de QA',
  });
  assert('agent send message → 200', s2 === 200, `status: ${s2}`);
  assert('message origin = agente', d2?.origen === 'agente', `got: ${d2?.origen}`);

  // Devolver al bot
  const { data: d3 } = await api('POST', `/api/conversaciones/${conv.id}/devolver-bot`);
  assert('devolver-bot → bot', d3?.estado === 'bot');

  // Cerrar
  const { data: d4 } = await api('POST', `/api/conversaciones/${conv.id}/cerrar`);
  assert('cerrar → cerrado', d4?.estado === 'cerrado');

  // System messages should have been created
  const msgs = await prisma.mensaje.findMany({
    where: { conversacionId: conv.id, origen: 'sistema' },
  });
  assert('system messages created for state changes', msgs.length >= 3, `count: ${msgs.length}`);
}

// ─── QA-10: Bloqueo + Availability ──────────────────────────

async function qa10_BloqueoAvailability() {
  section('QA-10: BLOQUEO + AVAILABILITY');

  // Get a real complejo
  const complejo = await prisma.complejo.findFirst({ where: { nombre: 'Pewmafe', activo: true } });
  if (!complejo) {
    skip('bloqueo tests', 'no Pewmafe found');
    return;
  }

  // Create bloqueo for a future date range
  const { status: s1, data: bloqueo } = await api('POST', `/api/complejos/${complejo.id}/bloqueos`, {
    fechaInicio: '2026-10-01',
    fechaFin: '2026-10-05',
    motivo: 'QA test block',
  });
  assert('crear bloqueo → 201', s1 === 201, `status: ${s1}`);

  // Check availability — Pewmafe should NOT be available for those dates
  const { data: avail } = await api(
    'GET',
    '/api/inventario/disponibilidad?fechaEntrada=2026-10-01&fechaSalida=2026-10-05&habitacion=Pewmafe',
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pewmafeAvail = Array.isArray(avail) ? avail.find((a: any) => a.habitacion === 'Pewmafe') : null;
  assert('Pewmafe NOT available during block', !pewmafeAvail, `found: ${JSON.stringify(pewmafeAvail)}`);

  // Delete bloqueo
  if (bloqueo?.id) {
    await api('DELETE', `/api/complejos/${complejo.id}/bloqueos/${bloqueo.id}`);

    // After deleting, should be available again
    const { data: avail2 } = await api(
      'GET',
      '/api/inventario/disponibilidad?fechaEntrada=2026-10-01&fechaSalida=2026-10-05&habitacion=Pewmafe',
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pewmafeAvail2 = Array.isArray(avail2) ? avail2.find((a: any) => a.habitacion === 'Pewmafe') : null;
    assert('Pewmafe available after unblock', !!pewmafeAvail2, `result: ${JSON.stringify(avail2)}`);
  }
}

// ─── QA-11: Tarifa Especial Sync ─────────────────────────────

async function qa11_TarifaEspecialSync() {
  section('QA-11: TARIFA ESPECIAL SYNC TO INVENTORY');

  const complejo = await prisma.complejo.findFirst({ where: { nombre: 'Pewmafe', activo: true } });
  if (!complejo) {
    skip('tarifa especial tests', 'no Pewmafe');
    return;
  }

  // Create tarifa especial
  const { data: te } = await api('POST', `/api/complejos/${complejo.id}/tarifas-especiales`, {
    fechaInicio: '2026-11-01',
    fechaFin: '2026-11-05',
    precioNoche: 99999,
    motivo: 'QA tarifa test',
  });
  assert('crear tarifa especial', !!te?.id);

  // Check inventory — should have the special price
  // Use UTC components to construct local midnight (matches how seedInventory stores dates)
  const d1 = new Date('2026-11-01');
  const checkDate1 = new Date(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
  const inv = await prisma.inventario.findFirst({
    where: { habitacion: 'Pewmafe', fecha: checkDate1 },
  });
  assert(
    'inventario synced with tarifa especial price',
    inv !== null && Number(inv.precio) === 99999,
    `got: ${inv?.precio}`,
  );

  // Delete tarifa especial — should restore seasonal price
  if (te?.id) {
    await api('DELETE', `/api/complejos/${complejo.id}/tarifas-especiales/${te.id}`);

    const d2 = new Date('2026-11-01');
    const checkDate2 = new Date(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate());
    const inv2 = await prisma.inventario.findFirst({
      where: { habitacion: 'Pewmafe', fecha: checkDate2 },
    });
    assert(
      'inventario restored after delete tarifa especial',
      inv2 !== null && Number(inv2.precio) !== 99999,
      `got: ${inv2?.precio}`,
    );
  }
}

// ─── QA-12: Bot no debe inventar datos ───────────────────────

async function qa12_BotNoInventar() {
  section('QA-12: BOT NO DEBE INVENTAR — Validation de respuestas');

  await cleanupSimData();

  // Test: Ask about zone — bot should not invent activities
  await sendSim('hola');
  await sendSim('que actividades hay para hacer en la zona?');

  let msg = await getLastBotMsg();
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Should mention real activities from context (buceo, kayak, pinguinera)
    const realActivities = ['buceo', 'kayak', 'playa', 'pesca', 'pinguinera'].filter((a) => text.includes(a));
    assert('menciona actividades reales de la zona', realActivities.length >= 2, `found: ${realActivities.join(', ')}`);
  }

  // Test: Ask for non-existent department
  await sendSim('hola');
  await sendSim('tienen disponibilidad en el departamento XYZ?');

  msg = await getLastBotMsg();
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert(
      'NO inventa depto XYZ',
      !text.includes('xyz está disponible') && !text.includes('xyz tiene'),
      `response: ${text.substring(0, 200)}`,
    );
  }
}

// ─── QA-13: Validation Errors ────────────────────────────────

async function qa13_ValidationErrors() {
  section('QA-13: VALIDATION ERRORS — Zod protege los endpoints');

  // Complejo without nombre
  const { status: s1 } = await api('POST', '/api/complejos', { capacidad: 2 });
  assert('crear complejo sin nombre → 400', s1 === 400, `status: ${s1}`);

  // Reserva manual without fechas
  const { status: s2 } = await api('POST', '/api/reservas/manual', { nombreHuesped: 'Test' });
  assert('reserva manual sin fechas → 400', s2 === 400, `status: ${s2}`);

  // Login sin password
  const { status: s3 } = await api('POST', '/api/auth/login', { email: 'test@test.com' }, null);
  assert('login sin password → 400', s3 === 400, `status: ${s3}`);

  // Estado invalido
  const reserva = await prisma.reserva.findFirst();
  if (reserva) {
    const { status: s4 } = await api('PATCH', `/api/reservas/${reserva.id}/estado`, { estado: 'invalido' });
    assert('estado invalido → 400', s4 === 400, `status: ${s4}`);
  }
}

// ─── QA-14: Bot escalado a humano ────────────────────────────

async function qa14_BotEscalation() {
  section('QA-14: BOT ESCALATION — Queja y hablar_humano');

  await cleanupSimData();

  // Test queja
  await sendSim('hola');
  await sendSim('esto es inaceptable, me tienen esperando hace horas y nadie me responde');

  const huesped = await prisma.huesped.findFirst({ where: { waId: FROM } });
  if (huesped) {
    const conv = await prisma.conversacion.findFirst({
      where: { huespedId: huesped.id },
      orderBy: { ultimoMensajeEn: 'desc' },
    });
    if (conv) {
      assert('queja escala a espera_humano', conv.estado === 'espera_humano', `got: ${conv.estado}`);

      const sysMsg = await prisma.mensaje.findFirst({
        where: { conversacionId: conv.id, origen: 'sistema' },
        orderBy: { creadoEn: 'desc' },
      });
      assert('sistema crea mensaje de escalacion', !!sysMsg);
    }
  }
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
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   PROFESSIONAL QA TEST SUITE                              ║');
  console.log('║   Validates business logic, bot behavior, data integrity  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Preflight: verify both services are running
  await preflight();

  // Auth
  const { data } = await api('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS }, null);
  token = data?.token ?? '';
  if (!token) {
    console.error('FATAL: Cannot login');
    process.exit(1);
  }

  console.log('\nCleaning up previous QA data...');
  await cleanupSimData();

  try {
    // Data integrity (no bot interaction needed)
    await qa01_DataIntegrity();
    await qa02_InventoryIntegrity();
    await qa03_ContextGeneration();

    // API validation
    await qa07_ReservationRules();
    await qa08_AuthRules();
    await qa13_ValidationErrors();

    // Bloqueo + Tarifa Especial sync
    await qa10_BloqueoAvailability();
    await qa11_TarifaEspecialSync();

    // Bot behavior (requires simulator, slow)
    await qa04_BotMinimumStay();
    await qa05_BotCapacity();
    await qa06_EntityRetention();
    await qa09_ConversationStateMachine();
    await qa12_BotNoInventar();
    await qa14_BotEscalation();
  } catch (err) {
    console.error('\n  FATAL ERROR:', err);
    failed++;
  }

  // Final cleanup
  console.log('\nCleaning up QA data...');
  await cleanupSimData();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║   RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('╚════════════════════════════════════════════════════════════╝');

  if (failures.length > 0) {
    console.log('\n  FAILURES:');
    for (const f of failures) {
      console.log(`  \x1b[31m✗\x1b[0m ${f}`);
    }
  }

  console.log('');
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('QA suite error:', e);
  process.exit(1);
});
