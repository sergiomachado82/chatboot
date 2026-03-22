import { prisma } from '../lib/prisma.js';
import type { BotConfig } from '@prisma/client';
import { cache } from './cacheService.js';

const CACHE_KEY = 'bot:config';
const CACHE_TTL = 300; // 5 minutes

/** Retrieves the current bot configuration, using a 5-minute Redis cache. @returns The active BotConfig record */
export async function getBotConfig(): Promise<BotConfig> {
  const cached = await cache.get<BotConfig>(CACHE_KEY);
  if (cached) return cached;

  let config = await prisma.botConfig.findFirst();
  if (!config) {
    config = await prisma.botConfig.create({ data: {} });
  }

  await cache.set(CACHE_KEY, config, CACHE_TTL);
  return config;
}

/**
 * Updates the bot configuration and records audit entries for changed fields.
 * @param data - Partial config fields to update
 * @param agenteId - Optional ID of the agent making the change (for audit trail)
 * @returns The updated BotConfig record
 */
export async function updateBotConfig(
  data: Partial<Omit<BotConfig, 'id' | 'creadoEn' | 'actualizadoEn'>>,
  agenteId?: string,
): Promise<BotConfig> {
  const current = await getBotConfig();

  // Build audit entries for changed fields
  const auditEntries: {
    agenteId: string | null;
    campo: string;
    valorAnterior: string | null;
    valorNuevo: string | null;
  }[] = [];
  for (const [key, newVal] of Object.entries(data)) {
    const oldVal = (current as Record<string, unknown>)[key];
    const oldStr = oldVal == null ? null : typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal);
    const newStr = newVal == null ? null : typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal);
    if (oldStr !== newStr) {
      auditEntries.push({ agenteId: agenteId ?? null, campo: key, valorAnterior: oldStr, valorNuevo: newStr });
    }
  }

  const updated = await prisma.botConfig.update({
    where: { id: current.id },
    data,
  });

  // Save audit entries (non-blocking, defensive)
  if (auditEntries.length > 0) {
    try {
      prisma.botConfigAudit.createMany({ data: auditEntries }).catch(() => {});
    } catch {
      // Model may not exist if prisma client wasn't regenerated
    }
  }

  await cache.del(CACHE_KEY);
  return updated;
}

/**
 * Retrieves the most recent bot configuration audit history entries.
 * @param limit - Maximum number of audit entries to return (default 50)
 * @returns An array of audit records ordered by most recent first, or an empty array on failure
 */
export async function getBotConfigHistory(limit = 50) {
  try {
    return await prisma.botConfigAudit.findMany({
      orderBy: { creadoEn: 'desc' },
      take: limit,
    });
  } catch {
    return [];
  }
}

/** Invalidates the Redis bot configuration cache, forcing a fresh DB read on next access. */
export async function invalidateBotConfigCache(): Promise<void> {
  await cache.del(CACHE_KEY);
}
