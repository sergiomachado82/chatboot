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

export async function updateBotConfig(data: Partial<Omit<BotConfig, 'id' | 'creadoEn' | 'actualizadoEn'>>): Promise<BotConfig> {
  const current = await getBotConfig();
  const updated = await prisma.botConfig.update({
    where: { id: current.id },
    data,
  });

  cachedConfig = updated;
  cacheTime = Date.now();
  return updated;
}

export function invalidateBotConfigCache(): void {
  cachedConfig = null;
  cacheTime = 0;
}
