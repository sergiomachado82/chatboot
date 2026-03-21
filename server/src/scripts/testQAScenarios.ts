/**
 * 34 QA scenario tests — automated conversation testing.
 * Covers 18 areas to detect logical bugs in the bot.
 *
 * Run:     npx tsx server/src/scripts/testQAScenarios.ts
 * Cleanup: npx tsx server/src/scripts/testQAScenarios.ts --cleanup
 * Requires: server on localhost:5050 with SIMULATOR_MODE=true
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5050';
const WAIT_MS = 14000;

// Unique phone range: 549110004XXXX (no collision with other test suites)
const PHONES: Record<string, string> = {};
for (let i = 1; i <= 34; i++) {
  PHONES[`QA_S${String(i).padStart(2, '0')}`] = `549110004${String(i).padStart(4, '0')}`;
}

// Setup phones for test reservations (QA-S16/17/18)
const SETUP_PHONES = {
  SETUP_16: '5491100049016',
  SETUP_17: '5491100049017',
  SETUP_18: '5491100049018',
};

// ─── Helpers ─────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function send(from: string, body: string, name: string): Promise<void> {
  await fetch(`${BASE_URL}/api/simulator/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, body, name }),
  });
  await sleep(WAIT_MS);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getLastBotMsg(waId: string): Promise<{ contenido: string; metadata: any } | null> {
  const huesped = await prisma.huesped.findFirst({ where: { waId } });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAllBotMsgs(waId: string): Promise<{ contenido: string; metadata: any }[]> {
  const huesped = await prisma.huesped.findFirst({ where: { waId } });
  if (!huesped) return [];
  const conv = await prisma.conversacion.findFirst({
    where: { huespedId: huesped.id },
    orderBy: { ultimoMensajeEn: 'desc' },
  });
  if (!conv) return [];
  const msgs = await prisma.mensaje.findMany({
    where: { conversacionId: conv.id, origen: 'bot' },
    orderBy: { creadoEn: 'asc' },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return msgs.map((m) => ({ contenido: m.contenido, metadata: m.metadata as any }));
}

async function getConvEstado(waId: string): Promise<string | null> {
  const huesped = await prisma.huesped.findFirst({ where: { waId } });
  if (!huesped) return null;
  const conv = await prisma.conversacion.findFirst({
    where: { huespedId: huesped.id },
    orderBy: { ultimoMensajeEn: 'desc' },
  });
  return conv?.estado ?? null;
}

// ─── Test framework ──────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;
let apiAvailable = true;
const failures: string[] = [];
const skippedTests: string[] = [];

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

function assertRequiresAPI(testName: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  \x1b[32mPASS\x1b[0m: ${testName}`);
    passed++;
  } else if (!apiAvailable) {
    const msg = `${testName} [requiere Claude API]`;
    console.log(`  \x1b[33mSKIP\x1b[0m: ${msg}`);
    skipped++;
    skippedTests.push(msg);
  } else {
    const msg = `${testName}${details ? ' — ' + details : ''}`;
    console.log(`  \x1b[31mFAIL\x1b[0m: ${msg}`);
    failed++;
    failures.push(msg);
  }
}

function section(title: string) {
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(65));
}

// ─── Date helpers ────────────────────────────────────────────

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  // Use local time (not UTC) to match futureDateHuman
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function futureDateHuman(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

// ─── Setup test reservations (Phase 0) ───────────────────────

async function setupTestReservations() {
  console.log('\n  Creando reservas de test para QA-S16/17/18...');

  // QA-S16: pre_reserva in LG → blocks availability
  const h16 = await prisma.huesped.create({
    data: { waId: SETUP_PHONES.SETUP_16, nombre: 'Setup QA-S16' },
  });
  const c16 = await prisma.conversacion.create({
    data: { huespedId: h16.id, estado: 'cerrado' },
  });
  await prisma.reserva.create({
    data: {
      huespedId: h16.id,
      conversacionId: c16.id,
      habitacion: 'LG',
      fechaEntrada: new Date(futureDate(40)),
      fechaSalida: new Date(futureDate(43)),
      estado: 'pre_reserva',
      numHuespedes: 2,
      nombreHuesped: 'Setup QA-S16',
      precioTotal: 0,
    },
  });
  console.log(`    LG pre_reserva: ${futureDate(40)} → ${futureDate(43)}`);

  // QA-S17: completada in Luminar 2Amb → should NOT block
  const h17 = await prisma.huesped.create({
    data: { waId: SETUP_PHONES.SETUP_17, nombre: 'Setup QA-S17' },
  });
  const c17 = await prisma.conversacion.create({
    data: { huespedId: h17.id, estado: 'cerrado' },
  });
  await prisma.reserva.create({
    data: {
      huespedId: h17.id,
      conversacionId: c17.id,
      habitacion: 'Luminar 2Amb',
      fechaEntrada: new Date(futureDate(50)),
      fechaSalida: new Date(futureDate(53)),
      estado: 'completada',
      numHuespedes: 2,
      nombreHuesped: 'Setup QA-S17',
      precioTotal: 0,
    },
  });
  console.log(`    Luminar 2Amb completada: ${futureDate(50)} → ${futureDate(53)}`);

  // QA-S18: cancelada in Pewmafe → should NOT block
  const h18 = await prisma.huesped.create({
    data: { waId: SETUP_PHONES.SETUP_18, nombre: 'Setup QA-S18' },
  });
  const c18 = await prisma.conversacion.create({
    data: { huespedId: h18.id, estado: 'cerrado' },
  });
  await prisma.reserva.create({
    data: {
      huespedId: h18.id,
      conversacionId: c18.id,
      habitacion: 'Pewmafe',
      fechaEntrada: new Date(futureDate(55)),
      fechaSalida: new Date(futureDate(58)),
      estado: 'cancelada',
      numHuespedes: 2,
      nombreHuesped: 'Setup QA-S18',
      precioTotal: 0,
    },
  });
  console.log(`    Pewmafe cancelada: ${futureDate(55)} → ${futureDate(58)}`);
}

// ─── Cleanup ─────────────────────────────────────────────────

async function cleanupQAData() {
  const allPhones = [...Object.values(PHONES), ...Object.values(SETUP_PHONES)];
  for (const phone of allPhones) {
    const huesped = await prisma.huesped.findFirst({ where: { waId: phone } });
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
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 1: Greeting Flows
// ═══════════════════════════════════════════════════════════════

async function qa_s01() {
  section('QA-S01: Saludo coloquial ("Buenas, como andan?")');
  const phone = PHONES.QA_S01!;
  await send(phone, 'Buenas, como andan?', 'QA-S01');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Should respond with welcome, NOT list departments or min stay
    assert(
      'NO lista todos los departamentos proactivamente',
      !(text.includes('pewmafe') && text.includes('luminar') && text.includes('lg')),
    );
    assert('NO menciona estadia minima', !text.includes('mínima') && !text.includes('minima'));
    assertRequiresAPI(
      'responde con bienvenida',
      text.includes('bienvenid') || text.includes('hola') || text.includes('ayudar'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

async function qa_s02() {
  section('QA-S02: Saludo con intent embebido ("Hola, cuanto sale LG?")');
  const phone = PHONES.QA_S02!;
  await send(phone, 'Hola, cuanto sale LG?', 'QA-S02');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const intent = msg.metadata?.intent;
    const entities = msg.metadata?.entities ?? {};
    // Intent should NOT be "saludo" — it has an embedded price query
    assertRequiresAPI('intent NO es saludo', intent !== 'saludo', `intent: ${intent}`);
    // Should extract habitacion=LG
    assertRequiresAPI(
      'entities.habitacion incluye LG',
      entities.habitacion?.toUpperCase() === 'LG',
      `entities: ${JSON.stringify(entities)}`,
    );
    // Should ask for dates (since price requires dates)
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI(
      'pide fechas para dar precio',
      text.includes('fecha') || text.includes('cuando') || text.includes('cuándo') || text.includes('noche'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 2: Missing Data Flows
// ═══════════════════════════════════════════════════════════════

async function qa_s03() {
  section('QA-S03: Solo un mes ("reservar para abril")');
  const phone = PHONES.QA_S03!;
  await send(phone, 'Quiero reservar para abril', 'QA-S03');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    // Should NOT invent specific days
    assert(
      'NO inventa fecha_entrada con dia especifico',
      !entities.fecha_entrada || !entities.fecha_entrada.match(/^\d{4}-04-\d{2}$/),
      `fecha_entrada: ${entities.fecha_entrada}`,
    );
    const text = msg.contenido.toLowerCase();
    // Bot may ask for dates OR personas first (both valid progressive questions)
    assertRequiresAPI(
      'pide dato faltante (fechas o personas)',
      text.includes('fecha') ||
        text.includes('dia') ||
        text.includes('día') ||
        text.includes('cuando') ||
        text.includes('cuándo') ||
        text.includes('persona') ||
        text.includes('cuántas') ||
        text.includes('cuantas'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

async function qa_s04() {
  section('QA-S04: Personas ambiguas ("somos una familia")');
  const phone = PHONES.QA_S04!;
  await send(phone, 'Hola, somos una familia y queremos alquilar', 'QA-S04');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    // Should NOT assume a number
    assert('NO asume num_personas', !entities.num_personas, `num_personas: ${entities.num_personas}`);
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI(
      'pregunta cuantas personas',
      text.includes('persona') ||
        text.includes('cuántos') ||
        text.includes('cuantos') ||
        text.includes('cuántas') ||
        text.includes('cuantas') ||
        text.includes('integrantes'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 3: Entity Accumulation
// ═══════════════════════════════════════════════════════════════

async function qa_s05() {
  section('QA-S05: Agregar depto despues de personas+fechas');
  const phone = PHONES.QA_S05!;
  await send(phone, `Somos 2 personas, del ${futureDateHuman(20)} al ${futureDateHuman(23)}`, 'QA-S05');
  await send(phone, 'Dame el Pewmafe', 'QA-S05');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    assertRequiresAPI(
      'habitacion acumulada = Pewmafe',
      entities.habitacion?.toLowerCase().includes('pewmafe'),
      `habitacion: ${entities.habitacion}`,
    );
    assertRequiresAPI(
      'num_personas retenido = 2',
      entities.num_personas === '2',
      `num_personas: ${entities.num_personas}`,
    );
    assertRequiresAPI('fecha_entrada retenida', !!entities.fecha_entrada, `fecha_entrada: ${entities.fecha_entrada}`);
    const text = msg.contenido.toLowerCase();
    assert('NO re-pregunta personas', !text.includes('cuántas personas') && !text.includes('cuantas personas'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

async function qa_s06() {
  section('QA-S06: Cambiar fechas mid-conversacion');
  const phone = PHONES.QA_S06!;
  await send(phone, `Somos 3 para Pewmafe del ${futureDateHuman(25)} al ${futureDateHuman(28)}`, 'QA-S06');
  await send(phone, `Mejor del ${futureDateHuman(30)} al ${futureDateHuman(33)}`, 'QA-S06');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    assertRequiresAPI(
      'fecha_entrada actualizada',
      entities.fecha_entrada === futureDate(30),
      `esperado: ${futureDate(30)}, got: ${entities.fecha_entrada}`,
    );
    assertRequiresAPI(
      'num_personas retenido = 3',
      entities.num_personas === '3',
      `num_personas: ${entities.num_personas}`,
    );
    assertRequiresAPI(
      'habitacion retenida = Pewmafe',
      entities.habitacion?.toLowerCase().includes('pewmafe'),
      `habitacion: ${entities.habitacion}`,
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 4: Availability Queries
// ═══════════════════════════════════════════════════════════════

async function qa_s07() {
  section('QA-S07: Rango cross-season (mayo→junio)');
  const phone = PHONES.QA_S07!;
  await send(phone, 'Disponibilidad del 30 de mayo al 3 de junio para 2 personas en LG?', 'QA-S07');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Should show price or availability, not crash
    assert('respuesta coherente (no error)', !text.includes('error') && text.length > 20);
    assertRequiresAPI(
      'menciona precio o disponibilidad',
      text.includes('$') || text.includes('disponib') || text.includes('noche'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

async function qa_s08() {
  section('QA-S08: Check-in hoy ("tienen algo para hoy?")');
  const phone = PHONES.QA_S08!;
  await send(phone, 'Tienen algo disponible para hoy? Somos 2', 'QA-S08');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    // "hoy" should resolve to a valid YYYY-MM-DD date (not text "hoy")
    // Note: classifier may use UTC date while local time differs — accept either
    const todayLocal = futureDate(0);
    const todayUTC = new Date().toISOString().slice(0, 10);
    assertRequiresAPI(
      '"hoy" resuelto a YYYY-MM-DD',
      entities.fecha_entrada === todayLocal || entities.fecha_entrada === todayUTC,
      `esperado: ${todayLocal} o ${todayUTC}, got: ${entities.fecha_entrada}`,
    );
    const text = msg.contenido.toLowerCase();
    assert('respuesta coherente', !text.includes('error') && text.length > 20);
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 5: Specific Apartment Requests
// ═══════════════════════════════════════════════════════════════

async function qa_s09() {
  section('QA-S09: Request por alias ("el monoambiente")');
  const phone = PHONES.QA_S09!;
  await send(phone, 'Hola, me interesa el monoambiente', 'QA-S09');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    assertRequiresAPI(
      'resuelve a Luminar Mono',
      entities.habitacion?.toLowerCase().includes('luminar') || entities.habitacion?.toLowerCase().includes('mono'),
      `habitacion: ${entities.habitacion}`,
    );
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI(
      'responde sobre Luminar Mono',
      text.includes('luminar') || text.includes('monoambiente') || text.includes('mono'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

async function qa_s10() {
  section('QA-S10: Dos deptos en un mensaje ("Pewmafe o LG")');
  const phone = PHONES.QA_S10!;
  await send(
    phone,
    `Hay disponibilidad en Pewmafe o LG del ${futureDateHuman(35)} al ${futureDateHuman(38)} para 2 personas?`,
    'QA-S10',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('no crasheo (respuesta coherente)', text.length > 20);
    // Should mention at least one of the requested departments
    assertRequiresAPI('menciona al menos un depto solicitado', text.includes('pewmafe') || text.includes('lg'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 6: Incorrect Entity Extraction
// ═══════════════════════════════════════════════════════════════

async function qa_s11() {
  section('QA-S11: Fecha irresolvible ("la semana que viene")');
  const phone = PHONES.QA_S11!;
  await send(phone, 'Quiero reservar para la semana que viene', 'QA-S11');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('no crasheo', text.length > 20);
    // Claude may resolve "la semana que viene" to actual dates and ask for next missing data,
    // OR ask for specific dates if it couldn't resolve. Both are valid.
    assertRequiresAPI(
      'pide dato faltante o resolvio fechas',
      text.includes('fecha') ||
        text.includes('dia') ||
        text.includes('día') ||
        text.includes('cuando') ||
        text.includes('cuándo') ||
        text.includes('persona') ||
        text.includes('cuántas') ||
        text.includes('cuantas') ||
        text.includes('noche') ||
        text.includes('marzo') ||
        text.includes('abril'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

async function qa_s12() {
  section('QA-S12: Info contradictoria ("2 adultos y 3 ninos, total 4")');
  const phone = PHONES.QA_S12!;
  await send(phone, 'Hola, somos 2 adultos y 3 ninos, total 4 personas', 'QA-S12');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('no crasheo', text.length > 20);
    const entities = msg.metadata?.entities ?? {};
    // num_personas should be a reasonable number, not an impossible value
    if (entities.num_personas) {
      const n = parseInt(entities.num_personas, 10);
      assert('num_personas razonable (entre 2 y 5)', n >= 2 && n <= 5, `num_personas: ${entities.num_personas}`);
    }
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 7: Capacity Violations
// ═══════════════════════════════════════════════════════════════

async function qa_s13() {
  section('QA-S13: Exacto en limite (4 pers + Luminar 2Amb cap=4)');
  const phone = PHONES.QA_S13!;
  await send(
    phone,
    `Somos 4 personas, quiero Luminar 2Amb del ${futureDateHuman(45)} al ${futureDateHuman(48)}`,
    'QA-S13',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // 4 personas = exact capacity for Luminar 2Amb (cap 4). Should ACCEPT, not say "excede"
    assert(
      'NO dice que excede capacidad',
      !text.includes('excede') && !text.includes('supera') && !text.includes('no apto'),
    );
    assertRequiresAPI(
      'menciona Luminar 2Amb o disponibilidad',
      text.includes('luminar') || text.includes('2 amb') || text.includes('disponib') || text.includes('$'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

async function qa_s14() {
  section('QA-S14: 1 persona sola');
  const phone = PHONES.QA_S14!;
  await send(phone, `Soy 1 persona, que tienen del ${futureDateHuman(60)} al ${futureDateHuman(63)}?`, 'QA-S14');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // All departments accept 1 person — should offer options
    assert('NO dice que no hay capacidad', !text.includes('no apto') && !text.includes('excede'));
    assertRequiresAPI(
      'ofrece al menos un depto',
      text.includes('pewmafe') || text.includes('luminar') || text.includes('lg') || text.includes('disponib'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 8: Minimum Stay Violations
// ═══════════════════════════════════════════════════════════════

async function qa_s15() {
  section('QA-S15: Pewmafe exacto al minimo (3 noches temp alta)');
  const phone = PHONES.QA_S15!;
  // December = alta season, Pewmafe min stay alta = 3
  await send(phone, 'Quiero Pewmafe del 15 al 18 de diciembre para 2 personas', 'QA-S15');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // 3 noches >= 3 (minimum) → should NOT warn about min stay
    assert(
      'NO advierte sobre estadia minima (3 >= 3)',
      !text.includes('mínima') && !text.includes('minima') && !text.includes('mínimo') && !text.includes('minimo'),
    );
    assertRequiresAPI(
      'menciona Pewmafe o disponibilidad',
      text.includes('pewmafe') || text.includes('disponib') || text.includes('$'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 9: Overlapping Reservations
// ═══════════════════════════════════════════════════════════════

async function qa_s16() {
  section('QA-S16: Pre-reserva bloquea disponibilidad');
  const phone = PHONES.QA_S16!;
  // LG has a pre_reserva for futureDate(40)→futureDate(43) from setup
  await send(
    phone,
    `Hay disponibilidad en LG del ${futureDateHuman(40)} al ${futureDateHuman(43)} para 2 personas?`,
    'QA-S16',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // LG should NOT be available (pre_reserva blocks it)
    assertRequiresAPI(
      'indica que LG NO esta disponible',
      text.includes('no hay') ||
        text.includes('no está') ||
        text.includes('no esta') ||
        text.includes('no disponib') ||
        text.includes('no tenemos disponib') ||
        text.includes('ocupad') ||
        text.includes('alternativ') ||
        text.includes('otras fecha') ||
        text.includes('lamentablemente'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 10: Completed/Cancelled Reservations NOT Blocking
// ═══════════════════════════════════════════════════════════════

async function qa_s17() {
  section('QA-S17: Completada NO bloquea disponibilidad (CRITICO)');
  const phone = PHONES.QA_S17!;
  // Luminar 2Amb has a "completada" reservation for futureDate(50)→futureDate(53)
  await send(
    phone,
    `Hay disponibilidad en Luminar 2Amb del ${futureDateHuman(50)} al ${futureDateHuman(53)} para 2 personas?`,
    'QA-S17',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Completada should NOT block — department should be available
    assertRequiresAPI(
      'indica que SI hay disponibilidad (completada no bloquea)',
      text.includes('disponib') || text.includes('$') || text.includes('precio') || text.includes('noche'),
      `respuesta: ${msg.contenido.substring(0, 200)}`,
    );
    assert(
      'NO dice que esta ocupado',
      !text.includes('no disponib') && !text.includes('no hay disponib') && !text.includes('ocupad'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

async function qa_s18() {
  section('QA-S18: Cancelada NO bloquea disponibilidad');
  const phone = PHONES.QA_S18!;
  // Pewmafe has a "cancelada" reservation for futureDate(55)→futureDate(58)
  await send(
    phone,
    `Hay disponibilidad en Pewmafe del ${futureDateHuman(55)} al ${futureDateHuman(58)} para 2 personas?`,
    'QA-S18',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI(
      'indica que SI hay disponibilidad (cancelada no bloquea)',
      text.includes('disponib') || text.includes('$') || text.includes('precio') || text.includes('noche'),
      `respuesta: ${msg.contenido.substring(0, 200)}`,
    );
    assert(
      'NO dice que esta ocupado',
      !text.includes('no disponib') && !text.includes('no hay disponib') && !text.includes('ocupad'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 11: Asking for Human
// ═══════════════════════════════════════════════════════════════

async function qa_s19() {
  section('QA-S19: Pedido educado ("puedo hablar con alguien?")');
  const phone = PHONES.QA_S19!;
  await send(phone, 'Disculpa, puedo hablar con alguien de atencion al cliente?', 'QA-S19');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI(
      'menciona agente o atencion',
      text.includes('agente') || text.includes('atender') || text.includes('contactar') || text.includes('breve'),
    );
  }
  const estado = await getConvEstado(phone);
  assert('estado = espera_humano', estado === 'espera_humano', `estado: ${estado}`);
}

async function qa_s20() {
  section('QA-S20: Escalacion mid-reserva ("mejor un agente")');
  const phone = PHONES.QA_S20!;
  await send(
    phone,
    `Quiero reservar LG del ${futureDateHuman(35)} al ${futureDateHuman(38)} para 2 personas`,
    'QA-S20',
  );
  await send(phone, 'Sabes que, mejor comunicame con un agente humano', 'QA-S20');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI(
      'menciona agente o comunicacion humana',
      text.includes('agente') ||
        text.includes('atender') ||
        text.includes('contactar') ||
        text.includes('breve') ||
        text.includes('persona') ||
        text.includes('equipo') ||
        text.includes('comunic'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
  const estado = await getConvEstado(phone);
  assert('estado = espera_humano', estado === 'espera_humano', `estado: ${estado}`);
}

// ═══════════════════════════════════════════════════════════════
// AREA 12: Reservation Flow (PASO 1-4)
// ═══════════════════════════════════════════════════════════════

async function qa_s21() {
  section('QA-S21: Flujo completo PASO 1-4');
  const phone = PHONES.QA_S21!;

  // PASO 1: Give all data → bot should summarize and ask to proceed
  await send(
    phone,
    `Quiero reservar Pewmafe del ${futureDateHuman(65)} al ${futureDateHuman(68)} para 2 personas`,
    'QA-S21',
  );
  const msg1 = await getLastBotMsg(phone);
  assert('PASO1: bot respondio', !!msg1);
  if (msg1) {
    const text = msg1.contenido.toLowerCase();
    assert(
      'PASO1: NO dice "reserva confirmada"',
      !text.includes('reserva confirmada') && !text.includes('queda confirmada'),
    );
    // Should NOT use "pre-reserva" (internal term)
    assert(
      'PASO1: NO dice "pre-reserva" (termino interno)',
      !text.includes('pre-reserva') && !text.includes('pre reserva') && !text.includes('prereserva'),
    );
    assertRequiresAPI(
      'PASO1: resume datos o pregunta si proceder',
      text.includes('reserva') ||
        text.includes('proceder') ||
        text.includes('confirmar') ||
        text.includes('resumen') ||
        text.includes('pewmafe'),
    );
    console.log(`  [PASO1]: ${msg1.contenido.substring(0, 300)}`);
  }

  // PASO 2: Accept → bot should show bank data (Pewmafe has trusted holder)
  await send(phone, 'Si, quiero proceder con la reserva', 'QA-S21');
  const msg2 = await getLastBotMsg(phone);
  assert('PASO2: bot respondio', !!msg2);
  if (msg2) {
    const text = msg2.contenido.toLowerCase();
    assertRequiresAPI('PASO2: menciona transferencia', text.includes('transferencia'));
    assertRequiresAPI('PASO2: muestra alias o CBU', text.includes('alias') || text.includes('cbu'));
    console.log(`  [PASO2]: ${msg2.contenido.substring(0, 300)}`);
  }

  // PASO 3: User says payment done → bot should ask for comprobante + DNI
  await send(phone, 'Ya realice la transferencia', 'QA-S21');
  const msg3 = await getLastBotMsg(phone);
  assert('PASO3: bot respondio', !!msg3);
  if (msg3) {
    const text = msg3.contenido.toLowerCase();
    assertRequiresAPI(
      'PASO3: pide comprobante o DNI',
      text.includes('comprobante') || text.includes('dni') || text.includes('documento'),
    );
    console.log(`  [PASO3]: ${msg3.contenido.substring(0, 300)}`);
  }

  // PASO 4: User sends DNI → bot should say agent will verify
  await send(phone, 'Mi DNI es 30123456, adjunto el comprobante', 'QA-S21');
  const msg4 = await getLastBotMsg(phone);
  assert('PASO4: bot respondio', !!msg4);
  if (msg4) {
    const text = msg4.contenido.toLowerCase();
    assertRequiresAPI(
      'PASO4: menciona agente verificara o factura',
      text.includes('agente') || text.includes('verificar') || text.includes('factura') || text.includes('confirmar'),
    );
    console.log(`  [PASO4]: ${msg4.contenido.substring(0, 300)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 13: Payment Flow
// ═══════════════════════════════════════════════════════════════

async function qa_s22() {
  section('QA-S22: Usuario pregunta tarjeta explicitamente');
  const phone = PHONES.QA_S22!;
  await send(
    phone,
    `Quiero reservar Pewmafe del ${futureDateHuman(70)} al ${futureDateHuman(73)} para 2 personas`,
    'QA-S22',
  );
  await send(phone, 'Puedo pagar con tarjeta de credito?', 'QA-S22');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // When user ASKS about tarjeta, bot should NOW mention MercadoPago + 8%
    assertRequiresAPI(
      'menciona MercadoPago o tarjeta',
      text.includes('mercadopago') || text.includes('mercado pago') || text.includes('tarjeta'),
    );
    assertRequiresAPI('menciona recargo 8%', text.includes('8%'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 14: Partial Information
// ═══════════════════════════════════════════════════════════════

async function qa_s23() {
  section('QA-S23: Solo noches sin fecha ("5 noches en Pewmafe")');
  const phone = PHONES.QA_S23!;
  await send(phone, 'Quiero 5 noches en Pewmafe para 2 personas', 'QA-S23');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Should ask for check-in date, not invent one
    assertRequiresAPI(
      'pide fecha de entrada',
      text.includes('fecha') ||
        text.includes('cuando') ||
        text.includes('cuándo') ||
        text.includes('qué día') ||
        text.includes('que dia') ||
        text.includes('ingreso') ||
        text.includes('llegada'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

async function qa_s24() {
  section('QA-S24: Solo fecha fin ("hasta el 20 de mayo")');
  const phone = PHONES.QA_S24!;
  await send(phone, 'Quiero reservar hasta el 20 de mayo para 2 personas', 'QA-S24');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI(
      'pide fecha de entrada',
      text.includes('fecha') ||
        text.includes('cuando') ||
        text.includes('cuándo') ||
        text.includes('ingreso') ||
        text.includes('entrada') ||
        text.includes('llegada') ||
        text.includes('check'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 15: Changing Data Mid-Conversation
// ═══════════════════════════════════════════════════════════════

async function qa_s25() {
  section('QA-S25: Cambiar depto ("mejor dame el LG")');
  const phone = PHONES.QA_S25!;
  await send(phone, `Quiero Pewmafe del ${futureDateHuman(75)} al ${futureDateHuman(78)} para 2 personas`, 'QA-S25');
  await send(phone, 'Mejor dame el LG', 'QA-S25');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    assertRequiresAPI(
      'habitacion actualizada a LG',
      entities.habitacion?.toUpperCase() === 'LG',
      `habitacion: ${entities.habitacion}`,
    );
    assertRequiresAPI('fechas retenidas', !!entities.fecha_entrada, `fecha_entrada: ${entities.fecha_entrada}`);
    assertRequiresAPI('personas retenidas', entities.num_personas === '2', `num_personas: ${entities.num_personas}`);
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

async function qa_s26() {
  section('QA-S26: Cambiar fechas Y personas a la vez');
  const phone = PHONES.QA_S26!;
  await send(phone, `Somos 2 para LG del ${futureDateHuman(80)} al ${futureDateHuman(83)}`, 'QA-S26');
  await send(
    phone,
    `Cambio: ahora somos 4 personas, y las fechas del ${futureDateHuman(85)} al ${futureDateHuman(89)}`,
    'QA-S26',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    assertRequiresAPI(
      'num_personas actualizado a 4',
      entities.num_personas === '4',
      `num_personas: ${entities.num_personas}`,
    );
    assertRequiresAPI(
      'fecha_entrada actualizada',
      entities.fecha_entrada === futureDate(85),
      `esperado: ${futureDate(85)}, got: ${entities.fecha_entrada}`,
    );
    assertRequiresAPI(
      'habitacion retenida = LG',
      entities.habitacion?.toUpperCase() === 'LG',
      `habitacion: ${entities.habitacion}`,
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 16: Asking for Photos
// ═══════════════════════════════════════════════════════════════

async function qa_s27() {
  section('QA-S27: Fotos sin especificar depto');
  const phone = PHONES.QA_S27!;
  await send(phone, 'Me podrias mandar fotos?', 'QA-S27');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('no crasheo', text.length > 20);
    // Bot may ask which department OR ask for personas/dates first (both valid)
    assertRequiresAPI(
      'responde coherentemente (pregunta depto, personas o fechas)',
      text.includes('cuál') ||
        text.includes('cual') ||
        text.includes('departamento') ||
        text.includes('depto') ||
        text.includes('pewmafe') ||
        text.includes('luminar') ||
        text.includes('lg') ||
        text.includes('persona') ||
        text.includes('cuántas') ||
        text.includes('cuantas') ||
        text.includes('fecha') ||
        text.includes('cuando') ||
        text.includes('cuándo'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 17: Asking About the Area
// ═══════════════════════════════════════════════════════════════

async function qa_s28() {
  section('QA-S28: Direcciones ("como llego desde Buenos Aires?")');
  const phone = PHONES.QA_S28!;
  await send(phone, 'Hola, como llego desde Buenos Aires a Las Grutas?', 'QA-S28');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('no crasheo', text.length > 20);
    assertRequiresAPI(
      'da info sobre como llegar',
      text.includes('ruta') ||
        text.includes('auto') ||
        text.includes('avion') ||
        text.includes('avión') ||
        text.includes('micro') ||
        text.includes('colectivo') ||
        text.includes('km') ||
        text.includes('viedma') ||
        text.includes('grutas') ||
        text.includes('buenos aires'),
    );
    // Should NOT invent fake data
    assert('NO inventa datos de vuelo', !text.includes('vuelo directo a las grutas'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

async function qa_s29() {
  section('QA-S29: Gastronomia ("hay restaurantes cerca?")');
  const phone = PHONES.QA_S29!;
  await send(phone, 'Hay restaurantes o lugares para comer cerca?', 'QA-S29');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('no crasheo', text.length > 20);
    assertRequiresAPI(
      'menciona gastronomia o restaurantes',
      text.includes('restaurant') ||
        text.includes('gastronom') ||
        text.includes('comer') ||
        text.includes('cocina') ||
        text.includes('playa') ||
        text.includes('mariscos') ||
        text.includes('bar'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// AREA 18: Long Conversations (10+ messages)
// ═══════════════════════════════════════════════════════════════

async function qa_s30() {
  section('QA-S30: Conversacion extendida (10 mensajes) con cambio de tema');
  const phone = PHONES.QA_S30!;

  // Msg 1: Greeting
  await send(phone, 'Buenas tardes', 'QA-S30');
  // Msg 2: Give persons
  await send(phone, 'Quiero averiguar para unas vacaciones, somos 3 personas', 'QA-S30');
  // Msg 3: Ask about options
  await send(phone, 'Que departamentos tienen?', 'QA-S30');
  // Msg 4: Select depto + dates
  await send(phone, `Me interesa el Pewmafe, tienen del ${futureDateHuman(95)} al ${futureDateHuman(100)}?`, 'QA-S30');
  // Msg 5: Ask price
  await send(phone, 'Cuanto saldria en total?', 'QA-S30');
  // Msg 6: Change nights
  await send(phone, `Y si fueran del ${futureDateHuman(95)} al ${futureDateHuman(99)}, 4 noches?`, 'QA-S30');
  // Msg 7: Amenity question (topic change)
  await send(phone, 'Tiene parrilla el Pewmafe?', 'QA-S30');
  // Msg 8: Back to reservation
  await send(phone, 'Ok me interesa reservar', 'QA-S30');
  // Msg 9: Confirm
  await send(phone, 'Si, quiero proceder', 'QA-S30');
  // Msg 10: Farewell-ish
  await send(phone, 'Gracias por la info, lo pienso y te aviso', 'QA-S30');

  const allMsgs = await getAllBotMsgs(phone);
  assert('bot respondio a los 10 mensajes (>= 10 respuestas)', allMsgs.length >= 10, `mensajes bot: ${allMsgs.length}`);

  if (allMsgs.length >= 10) {
    // Check context retention: after msg2 said "3 personas", no later message should re-ask
    const msgsAfterPersonas = allMsgs
      .slice(2)
      .map((m) => m.contenido.toLowerCase())
      .join(' ');
    assert(
      'NO re-pregunta cuantas personas despues de msg2',
      !msgsAfterPersonas.includes('cuántas personas') && !msgsAfterPersonas.includes('cuantas personas'),
    );

    // Last message should be coherent
    const lastMsg = allMsgs[allMsgs.length - 1]!;
    assert(
      'ultimo mensaje coherente (no error)',
      lastMsg.contenido.length > 20 && !lastMsg.contenido.toLowerCase().includes('error'),
    );
  }

  const estado = await getConvEstado(phone);
  assert(
    'estado valido (bot o cerrado)',
    estado === 'bot' || estado === 'cerrado' || estado === 'espera_humano',
    `estado: ${estado}`,
  );

  // Print last 3 messages for inspection
  const last3 = allMsgs.slice(-3);
  for (let i = 0; i < last3.length; i++) {
    console.log(`  [MSG${allMsgs.length - 2 + i}]: ${last3[i]!.contenido.substring(0, 200)}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// Edge Cases Adicionales
// ═══════════════════════════════════════════════════════════════

async function qa_s31() {
  section('QA-S31: Espanol informal con typos ("kiero el lg pa 2")');
  const phone = PHONES.QA_S31!;
  await send(phone, 'kiero el lg pa 2 personas', 'QA-S31');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('no crasheo', text.length > 20);
    const entities = msg.metadata?.entities ?? {};
    // Classifier should understand "kiero" = quiero, "lg" = LG, "pa 2" = 2 personas
    assertRequiresAPI(
      'entiende habitacion LG',
      entities.habitacion?.toUpperCase() === 'LG',
      `habitacion: ${entities.habitacion}`,
    );
    assertRequiresAPI('entiende 2 personas', entities.num_personas === '2', `num_personas: ${entities.num_personas}`);
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

async function qa_s32() {
  section('QA-S32: Mensaje minimo ("ok")');
  const phone = PHONES.QA_S32!;
  await send(phone, 'Quiero reservar', 'QA-S32');
  await send(phone, 'ok', 'QA-S32');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('no crasheo (respuesta coherente)', text.length > 10);
    // Should continue the conversation (ask for data or acknowledge)
    assert('respuesta NO es error', !text.includes('error') && !text.includes('fallo'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

async function qa_s33() {
  section('QA-S33: Multiples preguntas en 1 mensaje');
  const phone = PHONES.QA_S33!;
  await send(phone, 'Tienen wifi? Aceptan mascotas? Y hay parrilla?', 'QA-S33');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('respuesta sustancial (> 50 chars)', text.length > 50);
    // Must clearly state NO to mascotas
    assertRequiresAPI(
      'dice NO a mascotas',
      text.includes('no') && (text.includes('mascota') || text.includes('perro') || text.includes('animal')),
    );
    // Should address at least 2 of 3 questions
    let answered = 0;
    if (text.includes('wi-fi') || text.includes('wifi') || text.includes('internet')) answered++;
    if (text.includes('mascota') || text.includes('perro') || text.includes('animal')) answered++;
    if (text.includes('parrilla') || text.includes('asado') || text.includes('barbacoa')) answered++;
    assertRequiresAPI('responde al menos 2 de 3 preguntas', answered >= 2, `respondidas: ${answered}/3`);
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

async function qa_s34() {
  section('QA-S34: Bot silencioso post-escalacion');
  const phone = PHONES.QA_S34!;

  // Msg 1: Escalate to human
  await send(phone, 'Quiero hablar con un agente por favor', 'QA-S34');
  const msgsAfter1 = await getAllBotMsgs(phone);
  const count1 = msgsAfter1.length;
  assert('bot respondio a escalacion', count1 >= 1);

  const estado1 = await getConvEstado(phone);
  assert('estado = espera_humano', estado1 === 'espera_humano', `estado: ${estado1}`);

  // Msg 2: Send another message while in espera_humano
  await send(phone, 'Hola? Hay alguien?', 'QA-S34');
  const msgsAfter2 = await getAllBotMsgs(phone);
  const count2 = msgsAfter2.length;

  // Bot should NOT respond when conversation is in espera_humano
  assert(
    'bot NO respondio en espera_humano (mismo # de msgs)',
    count2 === count1,
    `antes: ${count1}, despues: ${count2}`,
  );

  console.log(`  [Msgs bot antes/despues de msg2]: ${count1}/${count2}`);
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║   34 QA SCENARIOS — TEST DE CONVERSACIONES AUTOMATIZADOS   ║');
  console.log('║   18 areas de testing | ~54 envios | ~15 min               ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  // Preflight: check server
  const backend = await fetch(`${BASE_URL}/api/health`).catch(() => null);
  if (!backend || backend.status !== 200) {
    console.error('\x1b[31mFATAL: Backend no disponible en puerto 5050\x1b[0m');
    console.error('Ejecutar: npm run dev (desde raiz del proyecto)');
    process.exit(1);
  }

  // Check Claude API availability
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { env } = await import('../config/env.js');
    if (env.ANTHROPIC_API_KEY) {
      const c = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      await c.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'OK' }],
      });
      apiAvailable = true;
      console.log('\n  Claude API: \x1b[32mDISPONIBLE\x1b[0m — todos los tests se ejecutan');
    } else {
      apiAvailable = false;
    }
  } catch {
    apiAvailable = false;
    console.log('\n  Claude API: \x1b[33mNO DISPONIBLE\x1b[0m — tests que requieren IA se marcan SKIP');
  }

  // Cleanup previous data
  console.log('\nLimpiando datos anteriores de QA scenarios...');
  await cleanupQAData();
  await sleep(2000);

  // Phase 0: Setup test reservations
  console.log('\n--- Phase 0: Setup de reservas de test ---');
  await setupTestReservations();
  await sleep(2000);

  try {
    // Phase 1: Single-message scenarios
    console.log('\n--- Phase 1: Escenarios de 1 mensaje (24 tests) ---');
    await qa_s01();
    await qa_s02();
    await qa_s03();
    await qa_s04();
    await qa_s07();
    await qa_s08();
    await qa_s09();
    await qa_s10();
    await qa_s11();
    await qa_s12();
    await qa_s13();
    await qa_s14();
    await qa_s15();
    await qa_s16();
    await qa_s17();
    await qa_s18();
    await qa_s19();
    await qa_s23();
    await qa_s24();
    await qa_s27();
    await qa_s28();
    await qa_s29();
    await qa_s31();
    await qa_s33();

    // Phase 2: Two-message scenarios
    console.log('\n--- Phase 2: Escenarios de 2 mensajes (8 tests) ---');
    await qa_s05();
    await qa_s06();
    await qa_s20();
    await qa_s22();
    await qa_s25();
    await qa_s26();
    await qa_s32();
    await qa_s34();

    // Phase 3: Four-message scenario
    console.log('\n--- Phase 3: Flujo de reserva completo (4 mensajes) ---');
    await qa_s21();

    // Phase 4: Long conversation
    console.log('\n--- Phase 4: Conversacion extendida (10 mensajes) ---');
    await qa_s30();
  } catch (err) {
    console.error('\n  FATAL ERROR:', err);
    failed++;
  }

  // Phase 5: Summary
  console.log(`\n${'═'.repeat(65)}`);
  const summary = `${passed} passed, ${failed} failed${skipped > 0 ? `, ${skipped} skipped` : ''}`;
  console.log(`\n╔═════════════════════════════════════════════════════════════╗`);
  console.log(`║   RESULTADOS: ${summary}${' '.repeat(Math.max(0, 44 - summary.length))}║`);
  console.log(`╚═════════════════════════════════════════════════════════════╝`);

  if (failures.length > 0) {
    console.log('\n  FAILURES (bugs reales):');
    for (const f of failures) {
      console.log(`  \x1b[31m✗\x1b[0m ${f}`);
    }
  }

  if (skippedTests.length > 0) {
    console.log('\n  SKIPPED (requieren Claude API con credito):');
    for (const s of skippedTests) {
      console.log(`  \x1b[33m⊘\x1b[0m ${s}`);
    }
  }

  // SYSTEM WEAKNESSES DISCOVERED
  console.log(`\n${'═'.repeat(65)}`);
  console.log('  SYSTEM WEAKNESSES DISCOVERED (analisis arquitectonico)');
  console.log('═'.repeat(65));
  console.log(`
  1. CLASSIFIER FALLBACK SIN ENTITY EXTRACTION
     El fallback regex no extrae entidades (habitacion, fechas, personas).
     Impacto: Sin Claude API, el bot pierde toda capacidad de acumulacion.

  2. GENERIC INTENTS DESCARTAN ENTITIES ACUMULADOS
     hablar_humano, queja, despedida, saludo, consulta_zona no propagan
     entities acumulados. Si un huesped escala mid-reserva, los datos
     se pierden para futuro agente.

  3. resolveRelativeDate LIMITADO
     Solo resuelve "hoy", "manana", "pasado manana".
     "La semana que viene", "este finde", "en 15 dias" son irresolvibles
     server-side. Depende 100% de que Claude los resuelva.

  4. SIN TRACKING EXPLICITO DE PASO DE RESERVA
     El bot no almacena en que PASO esta (1/2/3/4). Depende de que
     Claude infiera el paso del historial de conversacion. En
     conversaciones largas, puede perder el hilo.

  5. CROSS-SEASON PRICING SIN DESGLOSE CLARO
     Cuando un rango cruza temporadas (ej: mayo→junio), el bot da
     precios por noche pero no explica explicitamente que temporada
     aplica a cada noche. Puede confundir al huesped.

  6. MULTI-DEPTO EN UN MENSAJE NO SOPORTADO
     El classifier solo extrae UNA habitacion. "Pewmafe o LG" puede
     perder uno de los dos. No hay mecanismo para queries multi-depto.
`);

  console.log('  Las 34 conversaciones de QA quedaron visibles en la vista.');
  console.log('  Para limpiarlas: npx tsx server/src/scripts/testQAScenarios.ts --cleanup\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

// ─── Cleanup mode ────────────────────────────────────────────

if (process.argv.includes('--cleanup')) {
  console.log('Limpiando datos de QA scenarios...');
  cleanupQAData()
    .then(() => {
      console.log('Datos limpiados.');
      return prisma.$disconnect();
    })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Error:', e);
      process.exit(1);
    });
} else {
  main().catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
}
