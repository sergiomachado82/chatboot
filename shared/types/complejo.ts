export interface IcalFeed {
  id: string;
  complejoId: string;
  plataforma: string;
  url: string;
  etiqueta: string | null;
  activo: boolean;
  ultimoSync: string | null;
  creadoEn: string;
}

export interface Complejo {
  id: string;
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
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  tarifas: Tarifa[];
  tarifasEspeciales: TarifaEspecial[];
  media: MediaFile[];
  bloqueos: Bloqueo[];
  icalFeeds: IcalFeed[];
}

export interface Tarifa {
  id: string;
  temporada: string;
  precioNoche: number;
  estadiaMinima: number | null;
}

export interface TarifaEspecial {
  id: string;
  complejoId: string;
  fechaInicio: string;
  fechaFin: string;
  precioNoche: number;
  estadiaMinima: number | null;
  motivo: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CrearTarifaEspecialRequest {
  fechaInicio: string;
  fechaFin: string;
  precioNoche: number;
  estadiaMinima?: number | null;
  motivo?: string | null;
}

export interface UpdateTarifaEspecialRequest {
  fechaInicio?: string;
  fechaFin?: string;
  precioNoche?: number;
  estadiaMinima?: number | null;
  motivo?: string | null;
  activo?: boolean;
}

export interface MediaFile {
  id: string;
  tipo: string;
  url: string;
  caption: string | null;
  orden: number;
}

export interface Bloqueo {
  id: string;
  complejoId: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string | null;
  unidades: number;
  creadoEn: string;
}

export interface CrearBloqueoRequest {
  fechaInicio: string;
  fechaFin: string;
  motivo?: string | null;
  unidades?: number;
}

export interface CrearComplejoRequest {
  nombre: string;
  aliases?: string[];
  direccion?: string;
  ubicacion?: string;
  tipo?: string;
  superficie?: string;
  capacidad?: number;
  cantidadUnidades?: number;
  dormitorios?: number;
  banos?: number;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  estadiaMinima?: number;
  mascotas?: boolean;
  ninos?: boolean;
  fumar?: boolean;
  fiestas?: boolean;
  videoTour?: string;
  titularCuenta?: string;
  banco?: string;
  cbu?: string;
  aliasCbu?: string;
  cuit?: string;
  linkMercadoPago?: string;
  porcentajeReserva?: number;
}

export interface UpdateComplejoRequest extends Partial<CrearComplejoRequest> {}

export interface UpsertTarifaRequest {
  temporada: string;
  precioNoche: number;
  estadiaMinima?: number | null;
}

export interface AddMediaRequest {
  url: string;
  tipo?: string;
  caption?: string;
  orden?: number;
}

export interface CrearIcalFeedRequest {
  plataforma: string;
  url: string;
  etiqueta?: string;
}
