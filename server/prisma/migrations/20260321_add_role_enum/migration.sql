-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'agente');

-- AlterTable: convert rol column from text to Role enum
ALTER TABLE "agentes" ALTER COLUMN "rol" TYPE "Role" USING "rol"::"Role";
ALTER TABLE "agentes" ALTER COLUMN "rol" SET DEFAULT 'agente'::"Role";
