import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

// Mock env with no API key (forces fallback)
vi.mock('../config/env.js', () => ({
  env: {
    ANTHROPIC_API_KEY: '',
    CLAUDE_CLASSIFIER_MODEL: 'claude-haiku-4-5-20251001',
    CLAUDE_RESPONSE_MODEL: 'claude-sonnet-4-5-20250929',
    CLAUDE_TIMEOUT_MS: 30000,
  },
}));

// Mock accommodation context
vi.mock('../data/accommodationContext.js', () => ({
  getFullContext: vi.fn(() => 'Full accommodation context'),
  getFilteredContext: vi.fn(() => 'Filtered context for department'),
}));

// Mock dateUtils
vi.mock('../utils/dateUtils.js', () => ({
  getArgentinaToday: vi.fn(() => '2026-03-21'),
}));

// Mock botConfigService
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

// Mock integrationLogService
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

import { classifyIntent } from '../services/claudeService.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('classifyIntent (fallback, no API key)', () => {
  it('returns fallback when no API key', async () => {
    const result = await classifyIntent('hello');
    // Without API key, it should use the fallback classifier
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('entities');
  });

  it('fallback detects "hola" as saludo', async () => {
    const result = await classifyIntent('hola');
    expect(result.intent).toBe('saludo');
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('fallback detects "disponibilidad" as consulta_disponibilidad', async () => {
    const result = await classifyIntent('hay disponibilidad para marzo?');
    expect(result.intent).toBe('consulta_disponibilidad');
  });

  it('fallback detects "precio" as consulta_precio', async () => {
    const result = await classifyIntent('cuanto sale por noche? quiero saber el precio');
    expect(result.intent).toBe('consulta_precio');
  });

  it('fallback detects "reservar" as reservar', async () => {
    const result = await classifyIntent('quiero reservar un departamento');
    expect(result.intent).toBe('reservar');
  });

  it('fallback detects "hablar con alguien" as hablar_humano', async () => {
    const result = await classifyIntent('quiero hablar con una persona real');
    expect(result.intent).toBe('hablar_humano');
  });

  it('fallback detects "chau" as despedida', async () => {
    const result = await classifyIntent('chao, hasta luego');
    expect(result.intent).toBe('despedida');
  });

  it('fallback returns "otro" for unknown', async () => {
    const result = await classifyIntent('xyzzy foobar random text');
    expect(result.intent).toBe('otro');
    expect(result.confidence).toBe(0.5);
  });
});
