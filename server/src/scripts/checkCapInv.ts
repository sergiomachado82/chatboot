import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const cs = await p.complejo.findMany({
    where: { activo: true },
    select: { nombre: true, capacidad: true, cantidadUnidades: true },
  });
  console.log('CAPACIDADES:');
  for (const c of cs) console.log(`  ${c.nombre}: capacidad=${c.capacidad}, unidades=${c.cantidadUnidades}`);
  const maxDate = await p.inventario.aggregate({ _max: { fecha: true } });
  const minDate = await p.inventario.aggregate({ _min: { fecha: true } });
  console.log(
    '\nINVENTARIO RANGO:',
    minDate._min?.fecha?.toISOString().split('T')[0],
    '->',
    maxDate._max?.fecha?.toISOString().split('T')[0],
  );
  await p.$disconnect();
}
main();
