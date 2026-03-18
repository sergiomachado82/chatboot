-- AlterTable
ALTER TABLE "bot_config" ADD COLUMN     "titulares_verificados" TEXT[] DEFAULT ARRAY[]::TEXT[];
