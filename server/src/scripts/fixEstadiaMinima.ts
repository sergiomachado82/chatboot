/**
 * Fix: Remove incorrect estadiaMinima from Luminar Mono, Luminar 2Amb, and LG.
 * Only Pewmafe should have estadiaMinima (configured at the tarifa level, not complejo level).
 */
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const targets = ['Luminar Mono', 'Luminar 2Amb', 'LG'];

  for (const nombre of targets) {
    const before = await p.complejo.findFirst({ where: { nombre }, select: { nombre: true, estadiaMinima: true } });
    console.log(`BEFORE: ${nombre} → estadiaMinima: ${before?.estadiaMinima}`);

    await p.complejo.updateMany({
      where: { nombre },
      data: { estadiaMinima: null },
    });

    const after = await p.complejo.findFirst({ where: { nombre }, select: { nombre: true, estadiaMinima: true } });
    console.log(`AFTER:  ${nombre} → estadiaMinima: ${after?.estadiaMinima}`);
  }

  // Verify Pewmafe is untouched
  const pewmafe = await p.complejo.findFirst({
    where: { nombre: 'Pewmafe' },
    select: { nombre: true, estadiaMinima: true, tarifas: { select: { temporada: true, estadiaMinima: true } } },
  });
  console.log('\nPewmafe (no change):');
  console.log(`  complejo.estadiaMinima: ${pewmafe?.estadiaMinima}`);
  for (const t of pewmafe?.tarifas ?? []) {
    console.log(`  tarifa ${t.temporada}: estadiaMinima = ${t.estadiaMinima}`);
  }

  await p.$disconnect();
  console.log('\nDone.');
}
main();
