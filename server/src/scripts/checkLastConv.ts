import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const conv = await p.conversacion.findFirst({ orderBy: { ultimoMensajeEn: 'desc' } });
  if (!conv) {
    console.log('No conversations');
    return;
  }
  console.log('Conv:', conv.id, 'Estado:', conv.estado);

  const msgs = await p.mensaje.findMany({
    where: { conversacionId: conv.id },
    orderBy: { creadoEn: 'desc' },
    take: 8,
  });

  for (const m of msgs.reverse()) {
    console.log(`\n--- ${m.origen} (${m.creadoEn.toISOString()}) ---`);
    console.log(m.contenido.substring(0, 800));
    if (m.metadata) console.log('META:', JSON.stringify(m.metadata));
  }

  await p.$disconnect();
}
main();
