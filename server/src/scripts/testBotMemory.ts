/**
 * Automated test: validates bot entity retention across conversation turns.
 * Sends messages via the simulator endpoint and checks that the bot:
 * 1. Retains dates when user provides them
 * 2. Retains num_personas across turns
 * 3. Computes fecha_salida from fecha_entrada + noches
 * 4. Does NOT carry entities across "hola" resets
 * 5. Does NOT re-ask information already provided
 * 6. Only keeps recognized entity keys (no junk)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5050';
const FROM = '5491199999999';

let passed = 0;
let failed = 0;

async function sendMessage(body: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/simulator/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body, from: FROM, name: 'TestBot' }),
  });
  if (!res.ok) throw new Error(`Simulator returned ${res.status}`);
  // Wait for bot to process (classifier + response generation + DB save)
  await sleep(10000);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getConversacionId(): Promise<string | null> {
  const huesped = await prisma.huesped.findFirst({ where: { waId: FROM } });
  if (!huesped) return null;
  const conv = await prisma.conversacion.findFirst({
    where: { huespedId: huesped.id },
    orderBy: { ultimoMensajeEn: 'desc' },
  });
  return conv?.id ?? null;
}

async function getLastBotMessage(): Promise<{ contenido: string; metadata: Record<string, unknown> } | null> {
  const convId = await getConversacionId();
  if (!convId) return null;
  const msg = await prisma.mensaje.findFirst({
    where: { conversacionId: convId, origen: 'bot' },
    orderBy: { creadoEn: 'desc' },
  });
  return msg ? { contenido: msg.contenido, metadata: msg.metadata as Record<string, unknown> } : null;
}

async function getLastBotEntities(): Promise<Record<string, string>> {
  const msg = await getLastBotMessage();
  return (msg?.metadata?.entities as Record<string, string>) ?? {};
}

function assert(testName: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  FAIL: ${testName}${details ? ' — ' + details : ''}`);
    failed++;
  }
}

async function clearAll() {
  const huesped = await prisma.huesped.findFirst({ where: { waId: FROM } });
  if (huesped) {
    const convs = await prisma.conversacion.findMany({ where: { huespedId: huesped.id } });
    for (const c of convs) {
      await prisma.mensaje.deleteMany({ where: { conversacionId: c.id } });
      await prisma.conversacion.delete({ where: { id: c.id } });
    }
    await prisma.huesped.delete({ where: { id: huesped.id } });
  }
  // Wait a bit for any in-flight processing to complete
  await sleep(2000);
}

async function runTests() {
  console.log('\n========================================');
  console.log('  BOT ENTITY RETENTION TEST SUITE');
  console.log('========================================\n');

  await clearAll();

  // =========================================
  // TEST 1: All info in one message
  // =========================================
  console.log('TEST 1: All data in one message (no greeting)');
  await sendMessage('quiero consultar disponibilidad para 2 personas del 10 al 15 de marzo');

  let entities = await getLastBotEntities();
  console.log('  > entities:', JSON.stringify(entities));
  assert('fecha_entrada = 2026-03-10', entities.fecha_entrada === '2026-03-10', `got: ${entities.fecha_entrada}`);
  assert('fecha_salida = 2026-03-15', entities.fecha_salida === '2026-03-15', `got: ${entities.fecha_salida}`);
  assert('num_personas = 2', entities.num_personas === '2', `got: ${entities.num_personas}`);

  // =========================================
  // TEST 2: Follow-up retains entities
  // =========================================
  console.log('\nTEST 2: Follow-up retains entities');
  await sendMessage('cuanto sale?');

  entities = await getLastBotEntities();
  console.log('  > entities:', JSON.stringify(entities));
  assert('fecha_entrada retained', !!entities.fecha_entrada, `got: ${entities.fecha_entrada}`);
  assert('fecha_salida retained', !!entities.fecha_salida, `got: ${entities.fecha_salida}`);
  assert('num_personas retained', !!entities.num_personas, `got: ${entities.num_personas}`);

  // =========================================
  // TEST 3: "Hola" resets state
  // =========================================
  console.log('\nTEST 3: "Hola" resets accumulated entities');
  await sendMessage('hola');

  entities = await getLastBotEntities();
  console.log('  > entities:', JSON.stringify(entities));
  assert('entities empty after saludo', Object.keys(entities).length === 0, `got: ${JSON.stringify(entities)}`);

  // =========================================
  // TEST 4: Incremental - personas then dates
  // =========================================
  console.log('\nTEST 4: Incremental - personas first, then dates');
  await sendMessage('consulta de disponibilidad somos 4 personas');

  entities = await getLastBotEntities();
  console.log('  > entities after personas:', JSON.stringify(entities));
  assert('num_personas = 4', entities.num_personas === '4', `got: ${entities.num_personas}`);

  await sendMessage('del 20 al 25 de marzo');

  entities = await getLastBotEntities();
  console.log('  > entities after dates:', JSON.stringify(entities));
  assert('num_personas carried forward', entities.num_personas === '4', `got: ${entities.num_personas}`);
  assert('fecha_entrada = 2026-03-20', entities.fecha_entrada === '2026-03-20', `got: ${entities.fecha_entrada}`);
  assert('fecha_salida = 2026-03-25', entities.fecha_salida === '2026-03-25', `got: ${entities.fecha_salida}`);

  // Check bot doesn't re-ask for data it already has
  const msg4 = await getLastBotMessage();
  const text4 = msg4?.contenido?.toLowerCase() ?? '';
  assert(
    'bot does NOT re-ask personas',
    !text4.includes('cuántas personas') && !text4.includes('cuantas personas'),
    `response: ${text4.substring(0, 120)}`,
  );

  // =========================================
  // TEST 5: Noches computation in same message
  // =========================================
  console.log('\nTEST 5: "desde el 10 de marzo 4 noches para 3 personas"');
  await sendMessage('hola');
  await sendMessage('disponibilidad desde el 10 de marzo 4 noches para 3 personas');

  entities = await getLastBotEntities();
  console.log('  > entities:', JSON.stringify(entities));
  assert('fecha_entrada = 2026-03-10', entities.fecha_entrada === '2026-03-10', `got: ${entities.fecha_entrada}`);
  assert('fecha_salida computed = 2026-03-14', entities.fecha_salida === '2026-03-14', `got: ${entities.fecha_salida}`);
  assert('num_personas = 3', entities.num_personas === '3', `got: ${entities.num_personas}`);

  // =========================================
  // TEST 6: Noches in separate message
  // =========================================
  console.log('\nTEST 6: fecha_entrada first, then "5 noches" separately');
  await sendMessage('hola');
  await sendMessage('disponibilidad desde el 10 de marzo para 2 personas');

  entities = await getLastBotEntities();
  console.log('  > entities after first msg:', JSON.stringify(entities));
  assert('fecha_entrada = 2026-03-10', entities.fecha_entrada === '2026-03-10', `got: ${entities.fecha_entrada}`);
  assert('num_personas = 2', entities.num_personas === '2', `got: ${entities.num_personas}`);

  await sendMessage('serian 5 noches');

  entities = await getLastBotEntities();
  console.log('  > entities after noches:', JSON.stringify(entities));
  assert('fecha_entrada carried forward', entities.fecha_entrada === '2026-03-10', `got: ${entities.fecha_entrada}`);
  assert('num_personas carried forward', entities.num_personas === '2', `got: ${entities.num_personas}`);
  // The classifier or our code should compute fecha_salida = 2026-03-15
  assert('fecha_salida present', !!entities.fecha_salida, `got: ${entities.fecha_salida}`);

  // Check bot actually provides availability (doesn't re-ask)
  const msg6 = await getLastBotMessage();
  const text6 = msg6?.contenido?.toLowerCase() ?? '';
  assert(
    'bot provides info (no re-ask)',
    !text6.includes('cuántas noches') && !text6.includes('cuantas noches') && !text6.includes('cuántas personas'),
    `response: ${text6.substring(0, 120)}`,
  );

  // =========================================
  // TEST 7: No junk entity keys
  // =========================================
  console.log('\nTEST 7: Only valid entity keys in output');
  entities = await getLastBotEntities();
  const validKeys = new Set(['num_personas', 'fecha_entrada', 'fecha_salida', 'habitacion']);
  const invalidKeys = Object.keys(entities).filter((k) => !validKeys.has(k));
  assert('no junk entity keys', invalidKeys.length === 0, `invalid keys: ${invalidKeys.join(', ')}`);

  // =========================================
  // TEST 8: "mañana + 2 personas" then "5 noches" — must NOT re-ask (error-grave-resolver.txt)
  // =========================================
  console.log('\nTEST 8: "mañana somos 2 personas" + "5 noches" — NO re-ask (caso error grave)');
  await sendMessage('hola');
  await sendMessage('quiero consultar para mañana somos 2 personas buscamos cerca de la playa');

  entities = await getLastBotEntities();
  console.log('  > entities after first msg:', JSON.stringify(entities));
  assert('num_personas = 2', entities.num_personas === '2', `got: ${entities.num_personas}`);
  assert(
    'fecha_entrada is valid YYYY-MM-DD',
    !!entities.fecha_entrada && /^\d{4}-\d{2}-\d{2}$/.test(entities.fecha_entrada),
    `got: ${entities.fecha_entrada}`,
  );

  await sendMessage('5 noches');

  entities = await getLastBotEntities();
  const msg8 = await getLastBotMessage();
  const text8 = msg8?.contenido?.toLowerCase() ?? '';
  console.log('  > entities after "5 noches":', JSON.stringify(entities));
  console.log('  > bot response:', text8.substring(0, 200));
  assert('num_personas retained = 2', entities.num_personas === '2', `got: ${entities.num_personas}`);
  assert('fecha_entrada retained', !!entities.fecha_entrada, `got: ${entities.fecha_entrada}`);
  assert('fecha_salida computed', !!entities.fecha_salida, `got: ${entities.fecha_salida}`);
  assert(
    'bot NOT re-ask personas',
    !text8.includes('cuántas personas') &&
      !text8.includes('cuantas personas') &&
      !text8.includes('para cuántas') &&
      !text8.includes('para cuantas'),
    `response contains re-ask`,
  );
  assert(
    'bot NOT re-ask fechas',
    !text8.includes('qué fechas') && !text8.includes('que fechas') && !text8.includes('fecha de entrada'),
    `response contains re-ask`,
  );
  assert('bot NOT use "somos" (grammar)', !text8.includes('somos'), `bot used 1st person plural`);

  // =========================================
  // SUMMARY
  // =========================================
  console.log('\n========================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  await clearAll();
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error('Test suite error:', e);
  process.exit(1);
});
