import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

interface Departamento {
  nombre: string;
  precioBaja: number;
  precioMedia: number;
  precioAlta: number;
}

const DEPARTAMENTOS: Departamento[] = [
  { nombre: 'Pewmafe', precioBaja: 70000, precioMedia: 90000, precioAlta: 120000 },
  { nombre: 'Luminar Mono', precioBaja: 65000, precioMedia: 85000, precioAlta: 100000 },
  { nombre: 'Luminar 2Amb', precioBaja: 70000, precioMedia: 90000, precioAlta: 120000 },
  { nombre: 'LG', precioBaja: 80000, precioMedia: 95000, precioAlta: 130000 },
];

function getSeason(date: Date): 'baja' | 'media' | 'alta' {
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  // Alta: segunda quincena dic (15-31), enero (0), febrero (1)
  if ((month === 11 && day >= 15) || month === 0 || month === 1) return 'alta';
  // Media: julio (6), primera quincena dic (11, day < 15)
  if (month === 6 || (month === 11 && day < 15)) return 'media';
  // Baja: marzo-junio (2-5), agosto-noviembre (7-10)
  return 'baja';
}

function getPrecio(dept: Departamento, date: Date): number {
  const season = getSeason(date);
  switch (season) {
    case 'alta':
      return dept.precioAlta;
    case 'media':
      return dept.precioMedia;
    case 'baja':
      return dept.precioBaja;
  }
}

async function main() {
  // Clear existing inventory
  await prisma.inventario.deleteMany();

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const daysToSeed = 365; // 1 year

  let count = 0;
  for (const dept of DEPARTAMENTOS) {
    for (let i = 0; i < daysToSeed; i++) {
      const fecha = new Date(startDate);
      fecha.setDate(fecha.getDate() + i);

      const precio = getPrecio(dept, fecha);

      // Simulate some dates as unavailable (roughly 20% in high season)
      const season = getSeason(fecha);
      const disponible = season === 'alta' ? Math.random() > 0.2 : true;

      await prisma.inventario.create({
        data: { fecha, habitacion: dept.nombre, precio, disponible },
      });
      count++;
    }
  }

  console.log(`Seeded ${count} inventory entries (${DEPARTAMENTOS.length} departamentos x ${daysToSeed} days)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
