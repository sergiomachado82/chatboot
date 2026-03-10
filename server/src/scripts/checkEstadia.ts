import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const complejos = await p.complejo.findMany({
    where: { activo: true },
    select: {
      nombre: true,
      estadiaMinima: true,
      tarifas: { select: { temporada: true, precioNoche: true, estadiaMinima: true } },
      tarifasEspeciales: { where: { activo: true }, select: { fechaInicio: true, fechaFin: true, estadiaMinima: true, motivo: true } },
    },
  });
  for (const c of complejos) {
    console.log(JSON.stringify(c, null, 2));
  }
  await p.$disconnect();
}
main();
