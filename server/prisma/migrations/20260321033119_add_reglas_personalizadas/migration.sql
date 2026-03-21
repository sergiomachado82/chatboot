-- AlterTable
ALTER TABLE "bot_config" ADD COLUMN     "reglas_personalizadas" TEXT[] DEFAULT ARRAY[]::TEXT[];
