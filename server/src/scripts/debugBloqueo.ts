import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  // Check inventory for Pewmafe October 1-5
  const entries = await p.inventario.findMany({
    where: {
      habitacion: 'Pewmafe',
      fecha: { gte: new Date('2026-10-01'), lt: new Date('2026-10-05') },
    },
    orderBy: { fecha: 'asc' },
  });

  console.log('Inventory entries for Pewmafe Oct 1-5:');
  for (const e of entries) {
    console.log(`  ${e.fecha.toISOString().split('T')[0]} disponible=${e.disponible} precio=${e.precio}`);
  }
  console.log(`  Total entries: ${entries.length}`);

  // Check inventory for Pewmafe Nov 1-5
  const entries2 = await p.inventario.findMany({
    where: {
      habitacion: 'Pewmafe',
      fecha: { gte: new Date('2026-11-01'), lt: new Date('2026-11-05') },
    },
    orderBy: { fecha: 'asc' },
  });
  console.log('\nInventory entries for Pewmafe Nov 1-5:');
  for (const e of entries2) {
    console.log(`  ${e.fecha.toISOString().split('T')[0]} disponible=${e.disponible} precio=${e.precio}`);
  }
  console.log(`  Total entries: ${entries2.length}`);

  await p.$disconnect();
}
main();
