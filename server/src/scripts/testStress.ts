/**
 * 12 conversaciones de stress-test para detectar bugs del bot.
 * Cada escenario ataca un vector de falla diferente.
 *
 * Run: npx tsx server/src/scripts/testStress.ts
 * Requires: server on localhost:5050 with SIMULATOR_MODE=true
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5050';
const WAIT_MS = 14000;

// Unique phone range: 54911000300XX (separate from testSimulaciones)
const PHONES = {
  ST_01: '5491100030001',
  ST_02: '5491100030002',
  ST_03: '5491100030003',
  ST_04: '5491100030004',
  ST_05: '5491100030005',
  ST_06: '5491100030006',
  ST_07: '5491100030007',
  ST_08: '5491100030008',
  ST_09: '5491100030009',
  ST_10: '5491100030010',
  ST_11: '5491100030011',
  ST_12: '5491100030012',
  ST_13: '5491100030013',
  ST_14: '5491100030014',
};

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
async function _getAllBotMsgs(waId: string): Promise<{ contenido: string; metadata: any }[]> {
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

async function cleanupStressData() {
  for (const phone of Object.values(PHONES)) {
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

/** Use for assertions that REQUIRE Claude API to work (entity extraction, contextual responses) */
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

// Helper: compute date strings
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function futureDateHuman(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

// ════════════════════════════════════════════════════════════════
// ST-01: Ofrecer Monoambiente a 4 personas (excede capacidad max 3)
// ════════════════════════════════════════════════════════════════
async function st01_CapacidadExcedida() {
  section('ST-01: NO ofrecer Luminar Mono a 4 personas (cap max 3)');
  const phone = PHONES.ST_01;
  await send(
    phone,
    `Hola, somos 4 personas, que tienen disponible del ${futureDateHuman(30)} por 3 noches?`,
    'Test Capacidad',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Luminar Mono max 3 pers — should NOT be offered for 4
    assert('NO ofrece Luminar Mono para 4 personas', !text.includes('luminar mono') && !text.includes('monoambiente'));
    // Should offer Pewmafe/Luminar 2Amb/LG (cap 4) — requires Claude for contextual response
    assertRequiresAPI(
      'ofrece al menos un depto valido (cap >= 4)',
      text.includes('pewmafe') || text.includes('luminar 2') || text.includes('lg'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-02: Inventar departamento que no existe
// ════════════════════════════════════════════════════════════════
async function st02_DeptoInexistente() {
  section('ST-02: Preguntar por departamento que NO existe');
  const phone = PHONES.ST_02;
  await send(phone, 'Hola, tienen disponibilidad en el departamento Premium Suite?', 'Test Inexistente');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Bot should NOT pretend "Premium Suite" exists
    assert(
      'NO confirma que existe "Premium Suite"',
      !text.includes('premium suite disponible') && !text.includes('el premium suite'),
    );
    // Should list real departments or say it doesn't exist — requires Claude for contextual response
    assertRequiresAPI(
      'menciona departamentos reales o indica que no existe',
      text.includes('pewmafe') ||
        text.includes('luminar') ||
        text.includes('lg') ||
        text.includes('no contamos') ||
        text.includes('no tenemos'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-03: Confundir noches con personas ("3 noches" != "3 personas")
// ════════════════════════════════════════════════════════════════
async function st03_NochesNoSonPersonas() {
  section('ST-03: "3 noches" NO debe confundirse con "3 personas"');
  const phone = PHONES.ST_03;
  await send(phone, 'Hola quiero 3 noches en LG', 'Test Noches');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    // num_personas should NOT be 3 (that's noches, not personas)
    assert(
      'NO confunde noches con personas (num_personas != 3)',
      entities.num_personas !== '3',
      `entities: ${JSON.stringify(entities)}`,
    );
    // Should ask for personas since it's unknown — requires Claude for contextual response
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI(
      'pregunta cuantas personas son',
      text.includes('persona') || text.includes('cuántos') || text.includes('cuantos'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-04: Pedir mascotas (prohibido en todos)
// ════════════════════════════════════════════════════════════════
async function st04_Mascotas() {
  section('ST-04: Consultar mascotas (prohibidas en todos)');
  const phone = PHONES.ST_04;
  await send(phone, 'Hola, puedo llevar mi perro?', 'Test Mascotas');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Should clearly say NO to pets — requires Claude for contextual response
    assertRequiresAPI(
      'indica que NO se admiten mascotas',
      text.includes('no') && (text.includes('mascota') || text.includes('perro')),
    );
    // Should NOT say "some departments allow pets"
    assert('NO dice que algunos deptos aceptan mascotas', !text.includes('algunos') || !text.includes('mascota'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-05: Fechas invertidas (salida antes de entrada)
// ════════════════════════════════════════════════════════════════
async function st05_FechasInvertidas() {
  section('ST-05: Fechas invertidas (salida < entrada)');
  const phone = PHONES.ST_05;
  // Say "del 20 al 15 de mayo" — inverted
  await send(phone, 'Hola quiero reservar LG del 20 al 15 de mayo para 2 personas', 'Test Invertidas');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Bot should NOT crash or give error — should handle gracefully
    assert('respuesta es coherente (no error)', !text.includes('error') && !text.includes('fallo') && text.length > 20);
    // Should either swap dates and show availability, or ask to clarify
    assert(
      'maneja las fechas (muestra disponibilidad o pide corregir)',
      text.includes('disponib') ||
        text.includes('precio') ||
        text.includes('$') ||
        text.includes('fecha') ||
        text.includes('noche'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-06: Pedir precio CON fechas — debe dar UNA sola temporada
// ════════════════════════════════════════════════════════════════
async function st06_PrecioConFechas() {
  section('ST-06: Precio con fechas exactas — solo UNA temporada');
  const phone = PHONES.ST_06;
  // April = baja season
  await send(phone, 'Hola, cuanto cuesta LG del 10 al 13 de abril para 2 personas?', 'Test PrecioFechas');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI('menciona precio con $', text.includes('$'));
    // Should NOT list multiple seasons (only "baja" applies for April)
    assert('NO lista multiples temporadas', !(text.includes('temporada baja') && text.includes('temporada alta')));
    assert(
      'NO lista "temporada media" y "temporada alta" juntas',
      !(text.includes('media') && text.includes('alta') && text.includes('baja')),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-07: URLs/links — bot NO debe incluir URLs en respuesta de texto
// ════════════════════════════════════════════════════════════════
async function st07_NoURLs() {
  section('ST-07: Bot NO debe incluir URLs en respuesta de texto');
  const phone = PHONES.ST_07;
  await send(phone, 'Hola, me gustaria ver fotos del Pewmafe', 'Test URLs');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido;
    // Should NOT contain http:// or https:// URLs
    assert('NO incluye URLs http/https', !text.includes('http://') && !text.includes('https://'));
    // Should NOT contain YouTube links
    assert(
      'NO incluye links de YouTube',
      !text.toLowerCase().includes('youtube') && !text.toLowerCase().includes('youtu.be'),
    );
    // Should NOT say "fotos se envian automaticamente"
    assert(
      'NO dice "se envian automaticamente"',
      !text.toLowerCase().includes('automáticamente') && !text.toLowerCase().includes('automaticamente'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-08: Bot confirma reserva (PROHIBIDO — solo agente humano puede)
// ════════════════════════════════════════════════════════════════
async function st08_NoConfirmarReserva() {
  section('ST-08: Bot NO debe confirmar reserva (solo agente puede)');
  const phone = PHONES.ST_08;
  // Give all data for a reservation
  await send(
    phone,
    `Quiero reservar Luminar 2Amb del ${futureDateHuman(20)} al ${futureDateHuman(23)} para 3 personas`,
    'Test Confirma',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // CRITICAL: should NOT say "reserva confirmada" or "te confirmo la reserva"
    assert('NO dice "reserva confirmada"', !text.includes('reserva confirmada'));
    assert('NO dice "te confirmo la reserva"', !text.includes('te confirmo la reserva'));
    assert('NO dice "queda confirmada"', !text.includes('queda confirmada'));
    // Should NOT use "pre-reserva" (internal term) — must say "reserva"
    assert(
      'NO dice "pre-reserva" (termino interno)',
      !text.includes('pre-reserva') && !text.includes('pre reserva') && !text.includes('prereserva'),
    );
    // Should mention "reserva" or ask to proceed
    assert(
      'usa "reserva" o pregunta si desea proceder',
      text.includes('reserva') || text.includes('proceder') || text.includes('confirmar') || text.includes('desea'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 500)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-09: Ofrecer mas unidades de las que existen
// Luminar Mono tiene 1 sola unidad, Luminar 2Amb tiene 1 sola unidad
// ════════════════════════════════════════════════════════════════
async function st09_UnidadesLimite() {
  section('ST-09: NO ofrecer mas unidades de las que existen');
  const phone = PHONES.ST_09;
  // 6 personas: should NOT offer "2 Luminar Mono" (only 1 exists)
  await send(
    phone,
    `Hola, somos 6 personas, que opciones hay del ${futureDateHuman(15)} al ${futureDateHuman(18)}?`,
    'Test Unidades',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Should NOT offer "2 Luminar Mono" or "2 Luminar 2Amb" (only 1 unit each)
    assert(
      'NO ofrece 2 Luminar Mono (solo existe 1)',
      !text.includes('2 luminar mono') && !text.includes('dos luminar mono') && !text.includes('2 monoambiente'),
    );
    assert(
      'NO ofrece 2 Luminar 2Amb (solo existe 1)',
      !text.includes('2 luminar 2') && !text.includes('dos luminar 2'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 500)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-10: Mencionar tarjeta/MercadoPago proactivamente (PROHIBIDO)
// ════════════════════════════════════════════════════════════════
async function st10_MercadoPagoProactivo() {
  section('ST-10: NO mencionar MercadoPago/tarjeta proactivamente');
  const phone = PHONES.ST_10;
  await send(
    phone,
    `Quiero reservar LG del ${futureDateHuman(25)} al ${futureDateHuman(28)} para 2 personas`,
    'Test MercadoPago',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('NO menciona MercadoPago', !text.includes('mercadopago') && !text.includes('mercado pago'));
    assert(
      'NO menciona tarjeta de credito',
      !text.includes('tarjeta de crédito') && !text.includes('tarjeta de credito'),
    );
    assert('NO menciona 8% recargo', !text.includes('8%'));
    // PASO 1: Bot should summarize (depto, fechas, precio) and ask to proceed.
    // Transferencia goes in PASO 2 (after user accepts), so it's OK if not mentioned here.
    assertRequiresAPI(
      'resume datos o pregunta si quiere proceder',
      text.includes('reserva') || text.includes('proceder') || text.includes('confirmar'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 500)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-11: Datos acumulados — cambiar num_personas a mitad de conversacion
// ════════════════════════════════════════════════════════════════
async function st11_CambioPersonas() {
  section('ST-11: Cambio de personas a mitad de conversacion');
  const phone = PHONES.ST_11;
  await send(phone, 'Hola, somos 2 personas, queremos reservar', 'Test CambioPersonas');
  await send(phone, 'Perdona, en realidad somos 4 personas', 'Test CambioPersonas');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    // Should have updated to 4, not retained 2 — requires Claude for entity extraction
    assertRequiresAPI(
      'actualizo num_personas a 4 (no retuvo 2)',
      entities.num_personas === '4',
      `entities: ${JSON.stringify(entities)}`,
    );
    const text = msg.contenido.toLowerCase();
    // Should NOT offer Luminar Mono (cap 3) now that we're 4
    assert('NO ofrece Luminar Mono para 4 personas', !text.includes('luminar mono') && !text.includes('monoambiente'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-12: Pewmafe estadia minima — pedir 1 noche en temporada alta (min 3)
// ════════════════════════════════════════════════════════════════
async function st12_EstadiaMinimaPewmafe() {
  section('ST-12: Pewmafe 1 noche temp alta (min 3) — DEBE advertir');
  const phone = PHONES.ST_12;
  // January = alta, Pewmafe min stay alta = 3
  await send(phone, 'Hola, quiero Pewmafe para 1 noche el 15 de enero, somos 2', 'Test MinStay');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assertRequiresAPI('menciona Pewmafe', text.includes('pewmafe'));
    // Should mention minimum stay for Pewmafe since 1 < 3 — requires Claude for contextual validation
    assertRequiresAPI(
      'advierte sobre estadia minima o noches insuficientes',
      text.includes('mínima') ||
        text.includes('minima') ||
        text.includes('mínimo') ||
        text.includes('minimo') ||
        text.includes('3 noches') ||
        text.includes('mas noches') ||
        text.includes('extender'),
    );
    // Should NOT generalize to other departments
    assert(
      'NO generaliza estadia minima a todos los deptos',
      !text.includes('todos nuestros') || !text.includes('mínima'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ════════════════════════════════════════════════════════════════
// ST-13: Reservar depto SIN datos bancarios — NO debe inventar CBU/banco
// ════════════════════════════════════════════════════════════════
async function st13_NoBankDataInvented() {
  section('ST-13: NO inventar datos bancarios para depto sin cuenta cargada');
  const phone = PHONES.ST_13;
  // Luminar Mono has NO bank data loaded in DB
  await send(
    phone,
    `Quiero reservar Luminar Mono del ${futureDateHuman(3)} al ${futureDateHuman(8)} para 2 personas`,
    'Test BankData',
  );

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // CRITICAL: Must NOT contain invented bank data
    assert('NO inventa CBU', !text.includes('cbu'));
    assert('NO inventa alias bancario', !text.includes('alias:') && !text.includes('alias bancario'));
    assert(
      'NO inventa nombre de banco',
      !text.includes('banco nación') && !text.includes('banco nacion') && !text.includes('banco galicia'),
    );
    assert('NO inventa titular de cuenta', !text.includes('titular:'));
    // Should mention that an agent will contact them for payment info
    assertRequiresAPI(
      'menciona que un agente contactara para pago',
      text.includes('agente') || text.includes('contactar') || text.includes('breve') || text.includes('proceder'),
    );
    console.log(`  [BOT]: ${msg.contenido.substring(0, 500)}`);
  }
  // Conversation should be escalated to espera_humano
  const estado13 = await getConvEstado(phone);
  assert('conversacion escalada a espera_humano', estado13 === 'espera_humano', `estado: ${estado13}`);
}

// ════════════════════════════════════════════════════════════════
// ST-14: Reservar depto CON datos bancarios + titular verificado → DEBE mostrar datos
// ════════════════════════════════════════════════════════════════
async function st14_BankDataTrustedHolder() {
  section('ST-14: Depto con datos bancarios verificados — DEBE informar datos de pago');
  const phone = PHONES.ST_14;
  // Pewmafe HAS bank data with titular "Sergio Machado" (trusted)
  // Need 2 messages: first reserve, then accept to get PASO 2 with bank data
  await send(
    phone,
    `Quiero reservar Pewmafe del ${futureDateHuman(10)} al ${futureDateHuman(14)} para 2 personas`,
    'Test BankTrusted',
  );
  await send(phone, 'Si, quiero proceder con la reserva', 'Test BankTrusted');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // PASO 2: Should show bank data since Pewmafe has verified holder
    assertRequiresAPI('menciona transferencia', text.includes('transferencia'));
    assertRequiresAPI('muestra alias o CBU', text.includes('alias') || text.includes('cbu'));
    // Should NOT be escalated (trusted holder = bot handles it)
    const estado14 = await getConvEstado(phone);
    assert('conversacion NO escalada (titular verificado)', estado14 !== 'espera_humano', `estado: ${estado14}`);
    console.log(`  [BOT]: ${msg.contenido.substring(0, 500)}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║   14 STRESS TESTS — DETECCION DE BUGS DEL BOT             ║');
  console.log('║   Las conversaciones quedan visibles en la vista           ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  // Preflight
  const backend = await fetch(`${BASE_URL}/api/health`).catch(() => null);
  if (!backend || backend.status !== 200) {
    console.error('\x1b[31mFATAL: Backend no disponible en puerto 5050\x1b[0m');
    console.error('Ejecutar: npm run dev (desde raiz del proyecto)');
    process.exit(1);
  }

  // Check if Claude API is actually working (not just configured)
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const { env } = await import('../config/env.js');
    if (env.ANTHROPIC_API_KEY) {
      const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
      await client.messages.create({
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
    console.log('  (los tests de reglas de negocio sobre fallbacks SI se ejecutan)\n');
  }

  console.log('\nLimpiando datos anteriores de stress test...');
  await cleanupStressData();
  await sleep(2000);

  try {
    await st01_CapacidadExcedida();
    await st02_DeptoInexistente();
    await st03_NochesNoSonPersonas();
    await st04_Mascotas();
    await st05_FechasInvertidas();
    await st06_PrecioConFechas();
    await st07_NoURLs();
    await st08_NoConfirmarReserva();
    await st09_UnidadesLimite();
    await st10_MercadoPagoProactivo();
    await st11_CambioPersonas();
    await st12_EstadiaMinimaPewmafe();
    await st13_NoBankDataInvented();
    await st14_BankDataTrustedHolder();
  } catch (err) {
    console.error('\n  FATAL ERROR:', err);
    failed++;
  }

  // Summary
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

  console.log('\n  Las 14 conversaciones de stress quedaron visibles en la vista.');
  console.log('  Para limpiarlas: npx tsx server/src/scripts/testStress.ts --cleanup\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

// Cleanup mode
if (process.argv.includes('--cleanup')) {
  console.log('Limpiando datos de stress test...');
  cleanupStressData()
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
