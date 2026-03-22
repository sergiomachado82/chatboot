import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../lib/prisma.js', () => ({
  prisma: {
    mensaje: { findMany: vi.fn() },
    conversacion: { update: vi.fn() },
    complejo: { findMany: vi.fn(), findFirst: vi.fn() },
    reserva: { findFirst: vi.fn() },
    huesped: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../services/claudeService.js', () => ({
  classifyIntent: vi.fn(),
  generateResponse: vi.fn(),
}));

vi.mock('../services/mensajeService.js', () => ({
  createMensaje: vi.fn(),
  getByConversacion: vi.fn(),
}));

vi.mock('../services/conversacionService.js', () => ({
  updateConversacionEstado: vi.fn(),
}));

vi.mock('../services/whatsappService.js', () => ({
  sendWhatsAppMessage: vi.fn(),
  sendImage: vi.fn(),
}));

vi.mock('../services/inventarioService.js', () => ({
  checkAvailability: vi.fn(),
}));

vi.mock('../services/reservaService.js', () => ({
  createReserva: vi.fn(),
}));

vi.mock('../data/accommodationContext.js', () => ({
  getDepartmentImages: vi.fn(),
}));

vi.mock('../services/inventarioSyncService.js', () => ({
  getSeason: vi.fn(),
}));

vi.mock('../utils/dateUtils.js', () => ({
  getArgentinaToday: vi.fn(() => '2026-03-21'),
  formatLocalDate: vi.fn((d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }),
}));

vi.mock('../services/botConfigService.js', () => ({
  getBotConfig: vi.fn(() =>
    Promise.resolve({
      id: '1',
      nombreAgente: 'Test Bot',
      ubicacion: 'Las Grutas',
      tono: 'amigable',
      idioma: 'es_AR',
      longitudRespuesta: 'corta',
      usarEmojis: false,
      mensajeBienvenida: 'Hola!',
      mensajeDespedida: 'Chau!',
      mensajeEsperaHumano: 'Te comunico con un agente.',
      modoEnvioFotos: 'auto',
      escalarSiQueja: true,
      escalarSiPago: true,
      autoPreReserva: false,
      telefonoContacto: '2920000000',
      reglasPersonalizadas: [],
      titularesVerificados: [],
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    }),
  ),
}));

vi.mock('../services/integrationLogService.js', () => ({
  logIntegrationError: vi.fn(() => Promise.resolve()),
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { sanitizeEntities, resolveRelativeDate } from '../services/botEngine.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sanitizeEntities', () => {
  it('keeps valid entity keys only', () => {
    const result = sanitizeEntities({
      num_personas: '2',
      fecha_entrada: '2026-04-01',
      invalid_key: 'foo',
      random: 'bar',
    });

    expect(result).toHaveProperty('num_personas', '2');
    expect(result).toHaveProperty('fecha_entrada', '2026-04-01');
    expect(result).not.toHaveProperty('invalid_key');
    expect(result).not.toHaveProperty('random');
  });

  it('removes null/undefined/"null"/empty values', () => {
    const result = sanitizeEntities({
      num_personas: null,
      fecha_entrada: undefined,
      fecha_salida: 'null',
      habitacion: '',
      nombre_huesped: 'Juan',
    });

    expect(result).not.toHaveProperty('num_personas');
    expect(result).not.toHaveProperty('fecha_entrada');
    expect(result).not.toHaveProperty('fecha_salida');
    expect(result).not.toHaveProperty('habitacion');
    expect(result).toHaveProperty('nombre_huesped', 'Juan');
  });

  it('resolves "manana" to next day date', () => {
    // getArgentinaToday returns '2026-03-21', so manana = 2026-03-22
    const result = sanitizeEntities({
      fecha_entrada: 'mañana',
    });

    expect(result.fecha_entrada).toBe('2026-03-22');
  });

  it('resolves "hoy" to today', () => {
    // getArgentinaToday returns '2026-03-21'
    const result = sanitizeEntities({
      fecha_entrada: 'hoy',
    });

    expect(result.fecha_entrada).toBe('2026-03-21');
  });

  it('removes unresolvable date strings', () => {
    const result = sanitizeEntities({
      fecha_entrada: 'next week sometime',
    });

    expect(result).not.toHaveProperty('fecha_entrada');
  });

  it('validates DNI range (removes DNI < 5M)', () => {
    const result = sanitizeEntities({
      dni: '1234567',
    });

    expect(result).not.toHaveProperty('dni');
  });

  it('normalizes DNI (removes dots)', () => {
    const result = sanitizeEntities({
      dni: '35.123.456',
    });

    expect(result.dni).toBe('35123456');
  });

  it('computes fecha_salida from fecha_entrada + num_noches', () => {
    const result = sanitizeEntities({
      fecha_entrada: '2026-04-01',
      num_noches: '3',
    });

    expect(result.fecha_entrada).toBe('2026-04-01');
    expect(result.fecha_salida).toBe('2026-04-04');
  });

  it('removes DNI > 99.999.999', () => {
    const result = sanitizeEntities({
      dni: '100000000',
    });

    expect(result).not.toHaveProperty('dni');
  });
});

describe('resolveRelativeDate', () => {
  it('returns today\'s date for "hoy"', () => {
    const result = resolveRelativeDate('hoy');
    expect(result).toBe('2026-03-21');
  });

  it('returns tomorrow for "manana"', () => {
    const result = resolveRelativeDate('mañana');
    expect(result).toBe('2026-03-22');
  });

  it('returns null for unknown string', () => {
    const result = resolveRelativeDate('next friday');
    expect(result).toBeNull();
  });
});
