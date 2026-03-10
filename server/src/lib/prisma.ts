import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const url = new URL(env.DATABASE_URL);
  url.searchParams.set('connection_limit', String(env.PRISMA_POOL_SIZE));
  return new PrismaClient({
    datasourceUrl: url.toString(),
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
