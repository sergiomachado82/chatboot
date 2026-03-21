import { prisma } from '../lib/prisma.js';
import type { BotConfig } from '@prisma/client';

let cachedConfig: BotConfig | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getBotConfig(): Promise<BotConfig> {
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  let config = await prisma.botConfig.findFirst();
  if (!config) {
    config = await prisma.botConfig.create({ data: {} });
  }

  cachedConfig = config;
  cacheTime = Date.now();
  return config;
}

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

  cachedConfig = updated;
  cacheTime = Date.now();
  return updated;
}

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

export function invalidateBotConfigCache(): void {
  cachedConfig = null;
  cacheTime = 0;
}
