/**
 * 10 conversaciones simuladas para validar funcionalidades del bot.
 * Cada conversacion usa un telefono unico para aparecer como conversacion separada.
 *
 * Run: npx tsx server/src/scripts/testSimulaciones.ts
 * Requires: server on localhost:5050 with SIMULATOR_MODE=true
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5050';

const WAIT_MS = 14000; // wait for bot processing

// Unique phone numbers for each conversation
const PHONES = {
  SIM_01: '5491100010001',
  SIM_02: '5491100010002',
  SIM_03: '5491100010003',
  SIM_04: '5491100010004',
  SIM_05: '5491100010005',
  SIM_11: '5491100010011',
  SIM_06: '5491100010006',
  SIM_07: '5491100010007',
  SIM_08: '5491100010008',
  SIM_09: '5491100010009',
  SIM_10: '5491100010010',
};

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function send(from: string, body: string, name: string): Promise<void> {
  await fetch(`${BASE_URL}/api/simulator/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, body, name }),
  });
  await sleep(WAIT_MS);
}

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
  return msg ? { contenido: msg.contenido, metadata: msg.metadata as any } : null;
}

async function cleanupSimData() {
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
const failures: string[] = [];

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

function section(title: string) {
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(65));
}

// ─── Conversacion 1: Saludo simple ─────────────────────────────
async function conv01_Saludo() {
  section('CONV-01: SALUDO SIMPLE');
  const phone = PHONES.SIM_01;
  await send(phone, 'Hola, buenos dias!', 'Maria Lopez');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('respuesta contiene bienvenida', text.includes('bienvenid') || text.includes('hola') || text.includes('ayudar'));
    assert('NO menciona estadia minima en saludo', !text.includes('estadía mínima') && !text.includes('estadia minima'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 200)}`);
  }
}

// ─── Conversacion 2: 1 noche, 2 personas — NO debe inventar minimo ───
async function conv02_UnaNocheSinMinimo() {
  section('CONV-02: 1 NOCHE / 2 PERSONAS — No inventar estadia minima');
  const phone = PHONES.SIM_02;

  // Compute tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

  await send(phone, 'Hola!', 'Carlos Diaz');
  await send(phone, `Quiero alojarme 1 noche para manana ${tomorrowStr}, somos 2 personas`, 'Carlos Diaz');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    const lines = text.split('\n');
    // CRITICAL: should NOT say all departments require minimum stay
    assert('NO dice "todos nuestros departamentos requieren estadia minima"',
      !text.includes('todos nuestros departamentos') || !text.includes('mínima'));
    // Check per LINE: a line mentioning a depto should NOT also mention "mínimo" on the same line
    const monoLineHasMin = lines.some(l => l.includes('luminar mono') && (l.includes('mínimo') || l.includes('minimo') || l.includes('mínima') || l.includes('minima')));
    assert('NO inventa minimo para Luminar Mono (en su linea)', !monoLineHasMin);
    const dosAmbLineHasMin = lines.some(l => l.includes('luminar 2amb') && (l.includes('mínimo') || l.includes('minimo') || l.includes('mínima') || l.includes('minima')));
    assert('NO inventa minimo para Luminar 2Amb (en su linea)', !dosAmbLineHasMin);
    const lgLineHasMin = lines.some(l => l.includes(' lg') && (l.includes('mínimo') || l.includes('minimo') || l.includes('mínima') || l.includes('minima')));
    assert('NO inventa minimo para LG (en su linea)', !lgLineHasMin);
    // Should NOT mention estadia minima generically (it wasn't asked)
    assert('NO menciona estadia minima proactivamente',
      !text.includes('estadía mínima') && !text.includes('estadia minima'));
    // Should offer at least some departments
    assert('ofrece opciones de alojamiento',
      text.includes('luminar') || text.includes('pewmafe') || text.includes(' lg') || text.includes('departamento'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 500)}`);
  }
}

// ─── Conversacion 3: 10 personas, 1 noche (el bug reportado) ──
async function conv03_DiezPersonasUnaNoche() {
  section('CONV-03: 10 PERSONAS / 1 NOCHE — Bug reportado');
  const phone = PHONES.SIM_03;
  await send(phone, 'Hola buenas tardes', 'Pedro Martinez');
  await send(phone, 'Consulta por alojamiento, somos 10 personas, es para la noche de manana solamente', 'Pedro Martinez');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // CRITICAL BUG TEST: should NOT generalize minimum stay
    assert('NO dice "todos nuestros departamentos requieren estadia minima"',
      !text.includes('todos nuestros departamentos') || !text.includes('mínima'));
    assert('NO dice "entre 2 y 5 noches"',
      !text.includes('entre 2 y 5'));
    // Should explain that no single dept fits 10 people, suggest combining
    assert('menciona la necesidad de combinar departamentos o capacidad',
      text.includes('combin') || text.includes('capacidad') || text.includes('no contamos') || text.includes('varios') || text.includes('múltiples') || text.includes('telefono') || text.includes('contactar'));
    // BUG FIX: Bot must NOT invent wrong dates. "mañana" should resolve to tomorrow, not a random date
    assert('NO inventa fecha de enero (huesped dijo "mañana", no enero)',
      !text.includes('enero'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 500)}`);
  }
}

// ─── Conversacion 4: Consulta precio ────────────────────────────
async function conv04_ConsultaPrecio() {
  section('CONV-04: CONSULTA PRECIO');
  const phone = PHONES.SIM_04;
  await send(phone, 'Hola, cuanto sale por noche el departamento LG?', 'Ana Garcia');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    // Bot should NOT list all seasonal tariffs — instead should ask for dates first
    assert('NO lista tarifas por temporada baja/media/alta',
      !(text.includes('temporada baja') && text.includes('temporada media') && text.includes('temporada alta'))
      && !(text.includes('baja') && text.includes('media') && text.includes('alta')));
    assert('pregunta fechas', text.includes('fecha') || text.includes('cuando') || text.includes('cuándo') || text.includes('qué fecha') || text.includes('que fecha'));
    assert('menciona LG', text.includes('lg'));
    assert('NO inventa estadia minima para LG',
      !text.includes('estadía mínima') && !text.includes('estadia minima') && !text.includes('mínimo'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ─── Conversacion 5: Consulta zona ──────────────────────────────
async function conv05_ConsultaZona() {
  section('CONV-05: CONSULTA ZONA');
  const phone = PHONES.SIM_05;
  await send(phone, 'Hola! que actividades se pueden hacer en Las Grutas?', 'Laura Fernandez');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    const realActivities = ['buceo', 'kayak', 'playa', 'pesca', 'pinguinera', 'snorkel', 'mountain bike'].filter(a => text.includes(a));
    assert('menciona actividades reales (>= 2)', realActivities.length >= 2, `found: ${realActivities.join(', ')}`);
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ─── Conversacion 6: Pewmafe 1 noche — DEBE mencionar minimo real ──
async function conv06_PewmafeUnaNoche() {
  section('CONV-06: PEWMAFE 1 NOCHE — Debe mencionar estadia minima REAL');
  const phone = PHONES.SIM_06;
  await send(phone, 'Hola, quiero el Pewmafe para 1 noche, manana', 'Roberto Sosa');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('menciona Pewmafe', text.includes('pewmafe'));
    // Pewmafe HAS a real minimum stay — bot SHOULD mention it OR say not available
    // If Pewmafe is not available for those dates, bot may say "no disponible" instead of mentioning min stay
    assert('menciona estadia minima o no disponible para Pewmafe',
      text.includes('mínima') || text.includes('minima') || text.includes('mínimo') || text.includes('minimo') ||
      text.includes('no disponible') || text.includes('no tenemos disponibilidad') || text.includes('noches'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ─── Conversacion 7: Consulta departamento especifico LG ────────
async function conv07_ConsultaAlojamientoLG() {
  section('CONV-07: CONSULTA ALOJAMIENTO LG');
  const phone = PHONES.SIM_07;
  await send(phone, 'Hola, me podrias contar sobre el departamento LG? que amenities tiene?', 'Sofia Ruiz');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('menciona LG', text.includes('lg'));
    assert('menciona amenities', text.includes('wifi') || text.includes('cocina') || text.includes('aire') || text.includes('amenities'));
    assert('NO inventa estadia minima para LG',
      !text.includes('estadía mínima') && !text.includes('estadia minima'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 300)}`);
  }
}

// ─── Conversacion 8: Reserva paso a paso (acumulacion entidades) ──
async function conv08_ReservaPasoAPaso() {
  section('CONV-08: RESERVA PASO A PASO — Acumulacion de entidades');
  const phone = PHONES.SIM_08;
  await send(phone, 'Hola, quiero hacer una reserva', 'Diego Morales');
  await send(phone, 'Somos 3 personas', 'Diego Morales');

  let msg = await getLastBotMsg(phone);
  assert('bot respondio despues de personas', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    assert('retiene num_personas=3', entities.num_personas === '3', `got: ${entities.num_personas}`);
    // Should ask for dates since they are missing
    const text = msg.contenido.toLowerCase();
    assert('pide fechas', text.includes('fecha') || text.includes('cuando') || text.includes('días') || text.includes('noches'));
  }

  await send(phone, 'Del 20 al 25 de abril', 'Diego Morales');

  msg = await getLastBotMsg(phone);
  assert('bot respondio despues de fechas', !!msg);
  if (msg) {
    const entities = msg.metadata?.entities ?? {};
    assert('retiene num_personas despues de dar fechas', entities.num_personas === '3', `got: ${entities.num_personas}`);
    assert('tiene fecha_entrada', !!entities.fecha_entrada, `got: ${entities.fecha_entrada}`);
    assert('tiene fecha_salida', !!entities.fecha_salida, `got: ${entities.fecha_salida}`);
    // Should NOT re-ask for personas
    const text = msg.contenido.toLowerCase();
    assert('NO re-pregunta cuantas personas', !text.includes('cuántas personas') && !text.includes('cuantas personas'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 400)}`);
  }
}

// ─── Conversacion 9: Queja y escalacion a humano ────────────────
async function conv09_QuejaEscalacion() {
  section('CONV-09: QUEJA — Escalacion a humano');
  const phone = PHONES.SIM_09;
  await send(phone, 'Hola', 'Marta Gimenez');
  await send(phone, 'Estoy muy molesta, hace horas que espero una respuesta y nadie me atiende. Es inaceptable.', 'Marta Gimenez');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('pide disculpas', text.includes('disculp') || text.includes('lament') || text.includes('perdón'));
    assert('menciona agente o persona', text.includes('agente') || text.includes('persona') || text.includes('atender'));
  }

  // Verify conversation was escalated
  const huesped = await prisma.huesped.findFirst({ where: { waId: phone } });
  if (huesped) {
    const conv = await prisma.conversacion.findFirst({
      where: { huespedId: huesped.id },
      orderBy: { ultimoMensajeEn: 'desc' },
    });
    assert('conversacion escalada a espera_humano', conv?.estado === 'espera_humano', `got: ${conv?.estado}`);
  }
}

// ─── Conversacion 10: Despedida ─────────────────────────────────
async function conv10_Despedida() {
  section('CONV-10: DESPEDIDA');
  const phone = PHONES.SIM_10;
  await send(phone, 'Hola, solo queria agradecer por la informacion. Muchas gracias, adios!', 'Juan Perez');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('se despide amablemente',
      text.includes('gracias') || text.includes('saludos') || text.includes('buen') || text.includes('suerte') ||
      text.includes('placer') || text.includes('excelente'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 200)}`);
  }

  // Verify conversation was closed
  const huesped = await prisma.huesped.findFirst({ where: { waId: phone } });
  if (huesped) {
    const conv = await prisma.conversacion.findFirst({
      where: { huespedId: huesped.id },
      orderBy: { ultimoMensajeEn: 'desc' },
    });
    assert('conversacion cerrada', conv?.estado === 'cerrado', `got: ${conv?.estado}`);
  }
}

// ─── Conversacion 11: Reserva — NO mencionar tarjeta proactivamente ──
async function conv11_ReservaSinTarjeta() {
  section('CONV-11: RESERVA — No mencionar tarjeta de credito proactivamente');
  const phone = PHONES.SIM_11;
  await send(phone, 'Hola, quiero reservar el Luminar Mono del 10 al 15 de mayo para 2 personas', 'Lucia Torres');

  const msg = await getLastBotMsg(phone);
  assert('bot respondio', !!msg);
  if (msg) {
    const text = msg.contenido.toLowerCase();
    assert('menciona Luminar', text.includes('luminar'));
    // Should NOT proactively mention credit card / MercadoPago
    assert('NO menciona MercadoPago proactivamente', !text.includes('mercadopago') && !text.includes('mercado pago'));
    assert('NO menciona tarjeta de credito proactivamente', !text.includes('tarjeta de crédito') && !text.includes('tarjeta de credito'));
    // Should mention transfer as payment method
    assert('menciona transferencia como medio de pago',
      text.includes('transferencia') || text.includes('datos') || text.includes('reserva'));
    // Should NOT confirm reservation (but "te confirmo que está disponible" is ok — that's confirming availability, not reservation)
    assert('NO confirma la reserva', !text.includes('reserva confirmada') && !text.includes('te confirmo la reserva'));
    console.log(`  [BOT]: ${msg.contenido.substring(0, 500)}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║   11 CONVERSACIONES SIMULADAS — VALIDACION DE BOT          ║');
  console.log('║   Las conversaciones quedaran visibles en la vista          ║');
  console.log('╚═════════════════════════════════════════════════════════════╝');

  // Preflight
  const backend = await fetch(`${BASE_URL}/api/health`).catch(() => null);
  if (!backend || backend.status !== 200) {
    console.error('\x1b[31mFATAL: Backend no disponible en puerto 5050\x1b[0m');
    console.error('Ejecutar: npm run dev:test (desde raiz del proyecto)');
    process.exit(1);
  }

  console.log('\nLimpiando datos anteriores de simulacion...');
  await cleanupSimData();
  await sleep(2000);

  try {
    // Run all 10 conversations sequentially
    await conv01_Saludo();
    await conv02_UnaNocheSinMinimo();
    await conv03_DiezPersonasUnaNoche();
    await conv04_ConsultaPrecio();
    await conv05_ConsultaZona();
    await conv06_PewmafeUnaNoche();
    await conv07_ConsultaAlojamientoLG();
    await conv08_ReservaPasoAPaso();
    await conv09_QuejaEscalacion();
    await conv10_Despedida();
    await conv11_ReservaSinTarjeta();
  } catch (err) {
    console.error('\n  FATAL ERROR:', err);
    failed++;
  }

  // Summary
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`\n╔═════════════════════════════════════════════════════════════╗`);
  console.log(`║   RESULTADOS: ${passed} passed, ${failed} failed${' '.repeat(Math.max(0, 40 - String(passed).length - String(failed).length))}║`);
  console.log(`╚═════════════════════════════════════════════════════════════╝`);

  if (failures.length > 0) {
    console.log('\n  FAILURES:');
    for (const f of failures) {
      console.log(`  \x1b[31m✗\x1b[0m ${f}`);
    }
  }

  console.log('\n  Las 10 conversaciones quedaron visibles en la vista de conversaciones.');
  console.log('  Para limpiarlas, ejecutar: npx tsx server/src/scripts/testSimulaciones.ts --cleanup\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

// Cleanup mode
if (process.argv.includes('--cleanup')) {
  console.log('Limpiando datos de simulacion...');
  cleanupSimData()
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
  main().catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
}
