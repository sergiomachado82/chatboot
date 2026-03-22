import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    mensaje: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../services/huespedService.js', () => ({
  findOrCreateHuesped: vi.fn(),
}));

vi.mock('../services/conversacionService.js', () => ({
  findOrCreateConversacion: vi.fn(),
  updateConversacionEstado: vi.fn(),
}));

vi.mock('../services/mensajeService.js', () => ({
  createMensaje: vi.fn(),
}));

vi.mock('../services/botEngine.js', () => ({
  handleBotMessage: vi.fn(),
}));

vi.mock('../services/whatsappService.js', () => ({
  downloadMedia: vi.fn(),
  sendWhatsAppMessage: vi.fn(),
}));

vi.mock('../services/claudeService.js', () => ({
  transcribeAudio: vi.fn(),
}));

vi.mock('../middleware/rateLimitWhatsApp.js', () => ({
  isRateLimited: vi.fn().mockResolvedValue(false),
}));

vi.mock('../services/csatService.js', () => ({
  saveCsatRating: vi.fn(),
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { processIncomingMessage } from '../services/webhookProcessor.js';
import { prisma } from '../lib/prisma.js';
import { findOrCreateHuesped } from '../services/huespedService.js';
import { findOrCreateConversacion } from '../services/conversacionService.js';
import { createMensaje } from '../services/mensajeService.js';
import { handleBotMessage } from '../services/botEngine.js';
import { isRateLimited } from '../middleware/rateLimitWhatsApp.js';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: not rate limited
  vi.mocked(isRateLimited).mockResolvedValue(false);
});

const baseMessage = {
  from: '5491112345678',
  id: 'wamid.abc123',
  timestamp: '1679000000',
  type: 'text' as const,
  text: { body: 'Hola, quiero reservar' },
};

function setupNewMessageMocks(overrides?: { estado?: string }) {
  vi.mocked(prisma.mensaje.findFirst).mockResolvedValue(null);
  vi.mocked(findOrCreateHuesped).mockResolvedValue({
    id: 'h1',
    waId: '5491112345678',
    nombre: 'Test',
    telefono: null,
    email: null,
    notas: null,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  } as never);
  vi.mocked(findOrCreateConversacion).mockResolvedValue({
    id: 'c1',
    estado: overrides?.estado ?? 'bot',
    huespedId: 'h1',
    agenteId: null,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
    ultimoMensajeEn: new Date(),
    escaladaEn: null,
    cerradaEn: null,
    canalOrigen: 'whatsapp',
    metadata: null,
  } as never);
  vi.mocked(handleBotMessage).mockResolvedValue(undefined as never);
  vi.mocked(createMensaje).mockResolvedValue({} as never);
}

describe('processIncomingMessage', () => {
  it('skips duplicate messages', async () => {
    vi.mocked(prisma.mensaje.findFirst).mockResolvedValue({
      id: 'existing',
      waMessageId: 'wamid.abc123',
    } as never);

    await processIncomingMessage(baseMessage);

    expect(findOrCreateHuesped).not.toHaveBeenCalled();
    expect(createMensaje).not.toHaveBeenCalled();
  });

  it('processes new text message through bot', async () => {
    setupNewMessageMocks();

    await processIncomingMessage(baseMessage, 'Test Contact');

    expect(findOrCreateHuesped).toHaveBeenCalledWith('5491112345678', 'Test Contact');
    expect(findOrCreateConversacion).toHaveBeenCalledWith('h1');
    expect(createMensaje).toHaveBeenCalledWith(
      expect.objectContaining({
        conversacionId: 'c1',
        tipo: 'text',
        direccion: 'entrante',
        origen: 'huesped',
        contenido: 'Hola, quiero reservar',
        waMessageId: 'wamid.abc123',
      }),
    );
    expect(handleBotMessage).toHaveBeenCalledWith({
      conversacionId: 'c1',
      huespedId: 'h1',
      huespedWaId: '5491112345678',
      mensaje: 'Hola, quiero reservar',
    });
  });

  it('skips rate-limited messages', async () => {
    vi.mocked(prisma.mensaje.findFirst).mockResolvedValue(null);
    vi.mocked(isRateLimited).mockResolvedValue(true);

    await processIncomingMessage(baseMessage);

    expect(findOrCreateHuesped).not.toHaveBeenCalled();
    expect(createMensaje).not.toHaveBeenCalled();
  });

  it('creates huesped and conversacion for new message', async () => {
    setupNewMessageMocks();

    await processIncomingMessage(baseMessage, 'Juan');

    expect(findOrCreateHuesped).toHaveBeenCalledWith('5491112345678', 'Juan');
    expect(findOrCreateConversacion).toHaveBeenCalledWith('h1');
  });

  it('handles bot state routing', async () => {
    setupNewMessageMocks({ estado: 'bot' });

    await processIncomingMessage(baseMessage);

    expect(handleBotMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversacionId: 'c1',
        huespedId: 'h1',
        huespedWaId: '5491112345678',
        mensaje: 'Hola, quiero reservar',
      }),
    );

    // When estado is espera_humano, bot should NOT be called
    vi.clearAllMocks();
    setupNewMessageMocks({ estado: 'espera_humano' });

    await processIncomingMessage({ ...baseMessage, id: 'wamid.def456' });

    expect(handleBotMessage).not.toHaveBeenCalled();
  });

  it('saves text message content correctly', async () => {
    setupNewMessageMocks();
    const customMessage = {
      ...baseMessage,
      id: 'wamid.xyz789',
      text: { body: 'Precio por noche?' },
    };

    await processIncomingMessage(customMessage);

    expect(createMensaje).toHaveBeenCalledWith(
      expect.objectContaining({
        conversacionId: 'c1',
        tipo: 'text',
        direccion: 'entrante',
        origen: 'huesped',
        contenido: 'Precio por noche?',
        waMessageId: 'wamid.xyz789',
      }),
    );
  });
});
