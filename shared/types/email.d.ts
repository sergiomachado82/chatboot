export interface EmailProcesado {
  id: string;
  messageId: string;
  fromEmail: string;
  subject: string | null;
  complejoId: string | null;
  respondido: boolean;
  error: string | null;
  bodyOriginal: string | null;
  respuestaEnviada: string | null;
  esFormulario: boolean;
  creadoEn: string;
}
export interface EmailPage {
  emails: EmailProcesado[];
  total: number;
  page: number;
  totalPages: number;
}
export interface EmailStats {
  hoy: number;
  respondidos: number;
  errores: number;
  formularios: number;
}
//# sourceMappingURL=email.d.ts.map
