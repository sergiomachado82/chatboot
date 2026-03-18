import { prisma } from '../lib/prisma.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

const GENERAL_INFO = `
# Informacion del Alojamiento

## Datos generales
- Nombre: Las Grutas Departamentos
- Ubicacion: Las Grutas, Rio Negro, Patagonia Argentina
- Direccion oficina: Nahuel Huapi 75, Las Grutas, Rio Negro
- Telefono: +54 2920 561033
- Email: lasgrutasdepartamentos@gmail.com
- Web: https://www.lasgrutasdepartamentos.com
- Redes: Facebook e Instagram @lasgrutasdepartamentos
- Habilitados por la Secretaria de Turismo de Las Grutas
- Atencion personalizada, operados por los duenos (empresa familiar, +10 anos de experiencia)
`;

const POLICIES = `
## Politicas generales (todos los departamentos)
- Mascotas: NO se admiten en ninguno
- No se permite fumar en los departamentos
- No se permiten fiestas ni eventos
- Ninos: permitidos en todos
- Formas de pago de la sena: transferencia bancaria o tarjeta de credito via MercadoPago (con recargo del 8% por costo del servicio)
- Saldo restante: se abona por transferencia bancaria al momento del ingreso (check-in)
- El porcentaje de sena varia por departamento (ver ficha de cada departamento)
`;

const ZONA = `
## Zona y actividades en Las Grutas
- Playas: Playa Principal (bajada central), La Rinconada, Los Acantilados, Piedras Coloradas, La Conchilla
- Las famosas grutas/cuevas naturales en los acantilados
- Buceo y snorkel: aguas cristalinas, pulpos, estrellas de mar, nudibranquios
- Pesca: embarcado y desde costa (pejerrey, salmon de mar, gatuso)
- Kayak y stand up paddle: alquiler en bajadas principales
- Mountain bike: senderos costeros y meseta
- Avistaje de fauna marina: lobos marinos, toninas, ballenas (jun-dic)
- Pinguinera de El Condor: la mas grande de Sudamerica continental (a 100 km)
- Viedma y Carmen de Patagones: ciudades historicas a 15 km
- Gastronomia: rabas, pulpo, mejillones, cordero patagonico
- Vida nocturna en verano: bares y restaurantes sobre la costanera, feria artesanal
`;

const CONTACTO = `
## Contacto
- Telefono/WhatsApp: +54 2920 561033
- Email: lasgrutasdepartamentos@gmail.com
- Web: https://www.lasgrutasdepartamentos.com
`;

const TARIFA_HEADER = `
## Tarifas por noche (en pesos argentinos ARS)

| Departamento   | Temp. Baja (Mar-Jun, Ago-Nov) | Temp. Media (Jul, 1-14 Dic) | Temp. Alta (15 Dic - Feb) |`;

interface ComplejoWithRelations {
  nombre: string;
  aliases: string[];
  direccion: string | null;
  ubicacion: string | null;
  tipo: string | null;
  superficie: string | null;
  capacidad: number;
  cantidadUnidades: number;
  dormitorios: number;
  banos: number;
  amenities: string[];
  checkIn: string | null;
  checkOut: string | null;
  estadiaMinima: number | null;
  mascotas: boolean;
  ninos: boolean;
  fumar: boolean;
  fiestas: boolean;
  videoTour: string | null;
  titularCuenta: string | null;
  banco: string | null;
  cbu: string | null;
  aliasCbu: string | null;
  cuit: string | null;
  linkMercadoPago: string | null;
  porcentajeReserva: number;
  tarifas: { temporada: string; precioNoche: any; estadiaMinima: number | null }[];
  tarifasEspeciales: {
    fechaInicio: Date;
    fechaFin: Date;
    precioNoche: any;
    estadiaMinima: number | null;
    motivo: string | null;
    activo: boolean;
  }[];
  media: { url: string; caption: string | null; orden: number }[];
}

// --- In-memory cache for DB queries (5-min TTL) ---
let complejosCache: { data: ComplejoWithRelations[]; expiry: number } | null = null;

export function invalidateContextCache(): void {
  complejosCache = null;
}

function formatNumber(n: number): string {
  return n.toLocaleString('es-AR');
}

function buildDetalle(c: ComplejoWithRelations): string {
  const lines: string[] = [];
  lines.push(`### ${c.nombre}`);
  if (c.direccion) lines.push(`- Direccion: ${c.direccion}`);
  if (c.ubicacion) lines.push(`- Ubicacion: ${c.ubicacion}`);
  if (c.tipo) lines.push(`- Tipo: ${c.tipo}`);
  if (c.superficie) lines.push(`- Superficie: ${c.superficie}`);
  lines.push(`- Cantidad de unidades: ${c.cantidadUnidades}`);
  lines.push(`- Capacidad: hasta ${c.capacidad} personas`);
  lines.push(`- Dormitorios: ${c.dormitorios}`);
  lines.push(`- Banos: ${c.banos}`);
  if (c.amenities.length > 0) lines.push(`- Amenities: ${c.amenities.join(', ')}`);
  // Estadía mínima por temporada (con fallback al global del Complejo)
  const minStayParts: string[] = [];
  for (const t of c.tarifas) {
    const min = t.estadiaMinima ?? c.estadiaMinima;
    if (min) minStayParts.push(`${t.temporada}: ${min} noches`);
  }
  if (minStayParts.length > 0) {
    lines.push(`- Estadia minima por temporada: ${minStayParts.join(', ')}`);
  } else if (c.estadiaMinima) {
    lines.push(`- Estadia minima: ${c.estadiaMinima} noches`);
  } else {
    lines.push(`- Estadia minima: SIN RESTRICCION (desde 1 noche)`);
  }

  // Tarifas especiales vigentes
  const now = new Date();
  const activeTe = c.tarifasEspeciales.filter(
    (te) => te.activo && new Date(te.fechaFin) > now
  );
  if (activeTe.length > 0) {
    lines.push(`- Tarifas especiales vigentes:`);
    for (const te of activeTe) {
      const desde = new Date(te.fechaInicio).toLocaleDateString('es-AR');
      const hasta = new Date(te.fechaFin).toLocaleDateString('es-AR');
      let desc = `  * ${desde} a ${hasta}: $${formatNumber(Number(te.precioNoche))}/noche`;
      if (te.estadiaMinima) desc += ` (min ${te.estadiaMinima} noches)`;
      if (te.motivo) desc += ` - ${te.motivo}`;
      lines.push(desc);
    }
  }
  lines.push(`- Ninos: ${c.ninos ? 'permitidos' : 'NO permitidos'}`);
  lines.push(`- Mascotas: ${c.mascotas ? 'permitidas' : 'NO permitidas'}`);
  lines.push(`- Fumar: ${c.fumar ? 'permitido' : 'NO permitido'}`);
  lines.push(`- Fiestas: ${c.fiestas ? 'permitidas' : 'NO permitidas'}`);
  if (c.checkIn) lines.push(`- Check-in: ${c.checkIn} hs`);
  if (c.checkOut) lines.push(`- Check-out: ${c.checkOut} hs`);
  if (c.videoTour) lines.push(`- Video tour: ${c.videoTour}`);
  if (c.titularCuenta || c.cbu || c.aliasCbu) {
    lines.push(`- Datos bancarios para sena por transferencia:`);
    if (c.titularCuenta) lines.push(`  * Titular: ${c.titularCuenta}`);
    if (c.cuit) lines.push(`  * CUIT: ${c.cuit}`);
    if (c.banco) lines.push(`  * Banco: ${c.banco}`);
    if (c.cbu) lines.push(`  * CBU: ${c.cbu}`);
    if (c.aliasCbu) lines.push(`  * Alias: ${c.aliasCbu}`);
  }
  if (c.porcentajeReserva > 0) {
    lines.push(`- Sena para reserva: ${c.porcentajeReserva}% del total`);
  } else {
    lines.push(`- Reserva: No requiere sena, se agenda de palabra`);
  }
  if (c.linkMercadoPago) {
    lines.push(`- Link de pago MercadoPago (tarjeta, recargo 8%): ${c.linkMercadoPago}`);
  }
  if (c.direccion) {
    const mapsQuery = encodeURIComponent(`${c.direccion}, Rio Negro, Argentina`);
    lines.push(`- Google Maps: https://www.google.com/maps/search/?api=1&query=${mapsQuery}`);
  }
  if (c.media.length > 0) {
    lines.push(`- Imagenes principales:`);
    for (const m of c.media) {
      lines.push(`  * ${m.caption ?? 'Imagen'}: ${m.url}`);
    }
  }
  return lines.join('\n');
}

function buildTarifaRow(c: ComplejoWithRelations): string {
  const baja = c.tarifas.find((t) => t.temporada === 'baja');
  const media = c.tarifas.find((t) => t.temporada === 'media');
  const alta = c.tarifas.find((t) => t.temporada === 'alta');
  const pad = (s: string, len: number) => s.padEnd(len);
  return `| ${pad(c.nombre, 14)} | $${pad(baja ? formatNumber(Number(baja.precioNoche)) : '-', 29)} | $${pad(media ? formatNumber(Number(media.precioNoche)) : '-', 27)} | $${pad(alta ? formatNumber(Number(alta.precioNoche)) : '-', 25)} |`;
}

async function getActiveComplejos(): Promise<ComplejoWithRelations[]> {
  const now = Date.now();
  if (complejosCache && complejosCache.expiry > now) {
    return complejosCache.data;
  }

  const data = await prisma.complejo.findMany({
    where: { activo: true },
    include: {
      tarifas: true,
      tarifasEspeciales: { orderBy: { fechaInicio: 'asc' } },
      media: { orderBy: { orden: 'asc' } },
    },
    orderBy: { creadoEn: 'asc' },
  });

  complejosCache = { data, expiry: now + CACHE_TTL_MS };
  return data;
}

/**
 * Returns the full accommodation context (all departments) from DB.
 */
export async function getFullContext(): Promise<string> {
  const complejos = await getActiveComplejos();
  const allDeptos = complejos.map(buildDetalle).join('\n\n');
  const allTarifas = complejos.map(buildTarifaRow).join('\n');

  return `${GENERAL_INFO}
## Departamentos disponibles

${allDeptos}

${TARIFA_HEADER}
${allTarifas}

IMPORTANTE: Siempre usa estas tarifas al informar precios. Nunca inventes precios.
${POLICIES}${ZONA}${CONTACTO}`;
}

/**
 * Returns a FILTERED context containing ONLY information about the specified department from DB.
 */
export async function getFilteredContext(departamentoActivo: string): Promise<string> {
  const complejos = await getActiveComplejos();
  const lower = departamentoActivo.toLowerCase();
  const depto = complejos.find(
    (c) => c.nombre.toLowerCase() === lower || c.aliases.some((a) => lower.includes(a))
  );

  if (!depto) {
    return getFullContext();
  }

  return `${GENERAL_INFO}
## Departamento consultado: ${depto.nombre}

${buildDetalle(depto)}

${TARIFA_HEADER}
${buildTarifaRow(depto)}

IMPORTANTE: Siempre usa estas tarifas al informar precios. Nunca inventes precios.

NOTA: El usuario esta consultando UNICAMENTE sobre "${depto.nombre}". Solo responde con informacion de este departamento.
${POLICIES}${ZONA}${CONTACTO}`;
}

/**
 * Get image URLs for a department from DB. Returns up to `max` images.
 * Returns null if department not found.
 */
export async function getDepartmentImages(departamento: string, max = 6): Promise<{ url: string; caption: string | null }[] | null> {
  const complejos = await getActiveComplejos();
  const lower = departamento.toLowerCase();
  const depto = complejos.find(
    (c) => c.nombre.toLowerCase() === lower || c.aliases.some((a) => lower.includes(a))
  );

  if (!depto || depto.media.length === 0) return null;
  return depto.media.slice(0, max).map((m) => ({ url: m.url, caption: m.caption }));
}
