-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'agente');

-- AlterTable: convert rol column from text to Role enum
-- Must drop the old text default before changing type
ALTER TABLE "agentes" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "agentes" ALTER COLUMN "rol" TYPE "Role" USING "rol"::"Role";
ALTER TABLE "agentes" ALTER COLUMN "rol" SET DEFAULT 'agente'::"Role";
