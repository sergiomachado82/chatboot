import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 12);

  const agente = await prisma.agente.upsert({
    where: { email: 'admin@chatboot.com' },
    update: {},
    create: {
      nombre: 'Admin',
      email: 'admin@chatboot.com',
      passwordHash: hash,
      rol: 'admin',
      activo: true,
    },
  });

  console.log('Agente seed created:', agente.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
