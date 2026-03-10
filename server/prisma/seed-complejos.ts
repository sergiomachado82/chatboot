import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedComplejo {
  nombre: string;
  aliases: string[];
  direccion: string;
  ubicacion: string;
  tipo: string;
  superficie?: string;
  capacidad: number;
  cantidadUnidades: number;
  dormitorios: number;
  banos: number;
  amenities: string[];
  checkIn: string;
  checkOut: string;
  estadiaMinima?: number;
  mascotas: boolean;
  ninos: boolean;
  fumar: boolean;
  fiestas: boolean;
  videoTour?: string;
  tarifas: { temporada: string; precioNoche: number }[];
  media: { url: string; caption?: string; orden: number }[];
}

const COMPLEJOS_DATA: SeedComplejo[] = [
  {
    nombre: 'Pewmafe',
    aliases: ['pewmafe', 'pew', 'pewma'],
    direccion: 'Punta Perdices 370, Las Grutas',
    ubicacion: 'a 2 cuadras de la playa (bajada La Rinconada)',
    tipo: 'Departamento 2 ambientes',
    capacidad: 4,
    cantidadUnidades: 3,
    dormitorios: 1,
    banos: 1,
    amenities: [
      'aire acondicionado', 'Smart TV', 'Wi-Fi',
      'cocina totalmente equipada', 'patio individual',
      'estacionamiento (cochera)', 'parrilla individual',
      'ropa de cama incluida (toallas NO incluidas)',
    ],
    checkIn: '14:00',
    checkOut: '10:00',
    mascotas: false,
    ninos: true,
    fumar: false,
    fiestas: false,
    videoTour: 'https://www.youtube.com/watch?v=tz8rK2PkjjQ',
    tarifas: [
      { temporada: 'baja', precioNoche: 70000 },
      { temporada: 'media', precioNoche: 90000 },
      { temporada: 'alta', precioNoche: 120000 },
    ],
    media: [
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/frente-1-805x453.jpg', caption: 'Frente', orden: 0 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/living-805x453.jpg', caption: 'Living', orden: 1 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/cocina-805x453.jpg', caption: 'Cocina', orden: 2 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/doritorio-805x453.jpg', caption: 'Dormitorio', orden: 3 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/patio-parri-805x453.jpg', caption: 'Patio/Parrilla', orden: 4 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2019/09/20221015_185828-805x453.jpg', caption: 'Exterior', orden: 5 },
    ],
  },
  {
    nombre: 'Luminar Mono',
    aliases: ['luminar mono', 'luminar monoambiente', 'monoambiente', 'mono'],
    direccion: 'Golfo San Jorge 560, Las Grutas',
    ubicacion: 'a 2-3 cuadras de la playa (bajada Los Acantilados)',
    tipo: 'Monoambiente',
    superficie: '35-40 m2',
    capacidad: 3,
    cantidadUnidades: 1,
    dormitorios: 0,
    banos: 1,
    amenities: [
      'aire acondicionado', 'TV con cable', 'Wi-Fi',
      'cocina completa (heladera, microondas, vajilla)',
      'barra desayunador', 'placard',
      'ventanal amplio con solarium',
      'estacionamiento cubierto dentro del complejo',
      'ropa de cama incluida (toallas NO incluidas)',
    ],
    checkIn: '13:00',
    checkOut: '24:00',
    estadiaMinima: 4,
    mascotas: false,
    ninos: true,
    fumar: false,
    fiestas: false,
    videoTour: 'https://www.youtube.com/watch?v=sIBaRPlJYQk',
    tarifas: [
      { temporada: 'baja', precioNoche: 65000 },
      { temporada: 'media', precioNoche: 85000 },
      { temporada: 'alta', precioNoche: 100000 },
    ],
    media: [
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0011-805x453.jpg', caption: 'Interior 1', orden: 0 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0010-805x453.jpg', caption: 'Interior 2', orden: 1 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0012-805x453.jpg', caption: 'Interior 3', orden: 2 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/IMG-20151207-WA0013-805x453.jpg', caption: 'Interior 4', orden: 3 },
    ],
  },
  {
    nombre: 'Luminar 2Amb',
    aliases: ['luminar 2amb', 'luminar 2 ambientes', 'luminar 2 amb', '2 ambientes', '2amb'],
    direccion: 'Golfo San Jorge 560, Las Grutas',
    ubicacion: 'a 2 cuadras de la playa (bajada Los Acantilados)',
    tipo: 'Departamento 2 ambientes',
    superficie: '45-50 m2',
    capacidad: 4,
    cantidadUnidades: 1,
    dormitorios: 1,
    banos: 1,
    amenities: [
      'aire acondicionado', 'Smart TV con cable', 'Wi-Fi',
      'cocina completa (heladera, microondas, vajilla)',
      'barra desayunador', 'placard',
      'patio cubierto/solarium con parrilla',
      'estacionamiento cubierto dentro del complejo',
      'ropa de cama incluida (toallas NO incluidas)',
    ],
    checkIn: '10:00',
    checkOut: '14:00',
    estadiaMinima: 4,
    mascotas: false,
    ninos: true,
    fumar: false,
    fiestas: false,
    tarifas: [
      { temporada: 'baja', precioNoche: 70000 },
      { temporada: 'media', precioNoche: 90000 },
      { temporada: 'alta', precioNoche: 120000 },
    ],
    media: [
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/2AMB_B_LIVING2-725x453.jpg', caption: 'Living', orden: 0 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/01a_frente_jpg-750x453.jpg', caption: 'Frente', orden: 1 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/cochera_complejo_luminar-725x453.jpg', caption: 'Cochera', orden: 2 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/2AMB_B_HABITACION2-725x453.jpg', caption: 'Habitacion', orden: 3 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/2AMB_B_TOILET212-1-483x453.jpg', caption: 'Bano', orden: 4 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/parrilla-2-amb-luminar-805x453.jpg', caption: 'Parrilla', orden: 5 },
    ],
  },
  {
    nombre: 'LG',
    aliases: ['lg', 'departamentos lg', 'depto lg'],
    direccion: 'Golfo San Jorge 560, Las Grutas',
    ubicacion: 'a 2 cuadras del mar (bajada Los Acantilados)',
    tipo: 'Departamento 2 ambientes',
    superficie: '50 m2',
    capacidad: 4,
    cantidadUnidades: 5,
    dormitorios: 1,
    banos: 1,
    amenities: [
      'aire acondicionado', 'TV LED', 'Wi-Fi', 'cable TV',
      'cocina con heladera y microondas',
      'solarium con ventanales amplios',
      'estacionamiento cubierto dentro del complejo',
      'parrilla', 'ropa de cama incluida (toallas NO incluidas)',
    ],
    checkIn: '13:00',
    checkOut: '24:00',
    estadiaMinima: 5,
    mascotas: false,
    ninos: true,
    fumar: false,
    fiestas: false,
    tarifas: [
      { temporada: 'baja', precioNoche: 80000 },
      { temporada: 'media', precioNoche: 95000 },
      { temporada: 'alta', precioNoche: 130000 },
    ],
    media: [
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/frente-lg-805x453.jpg', caption: 'Frente', orden: 0 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa-1-living2-805x453.jpg', caption: 'Living 1', orden: 1 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa-1-parrilla-balcon-lg-805x453.jpg', caption: 'Parrilla/Balcon', orden: 2 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa-1-dormitorio-LG-805x453.jpg', caption: 'Dormitorio', orden: 3 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/depa2-bano-lg-805x453.jpg', caption: 'Bano', orden: 4 },
      { url: 'https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/living-lcd-805x453.jpg', caption: 'Living LCD', orden: 5 },
    ],
  },
];

async function main() {
  console.log('Seeding complejos...');

  for (const data of COMPLEJOS_DATA) {
    const complejo = await prisma.complejo.upsert({
      where: { nombre: data.nombre },
      update: {},
      create: {
        nombre: data.nombre,
        aliases: data.aliases,
        direccion: data.direccion,
        ubicacion: data.ubicacion,
        tipo: data.tipo,
        superficie: data.superficie ?? null,
        capacidad: data.capacidad,
        cantidadUnidades: data.cantidadUnidades,
        dormitorios: data.dormitorios,
        banos: data.banos,
        amenities: data.amenities,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        estadiaMinima: data.estadiaMinima ?? null,
        mascotas: data.mascotas,
        ninos: data.ninos,
        fumar: data.fumar,
        fiestas: data.fiestas,
        videoTour: data.videoTour ?? null,
        tarifas: {
          create: data.tarifas.map((t) => ({
            temporada: t.temporada,
            precioNoche: t.precioNoche,
          })),
        },
        media: {
          create: data.media.map((m) => ({
            url: m.url,
            caption: m.caption ?? null,
            orden: m.orden,
          })),
        },
      },
    });

    console.log(`  Created/found: ${complejo.nombre} (${complejo.id})`);
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
