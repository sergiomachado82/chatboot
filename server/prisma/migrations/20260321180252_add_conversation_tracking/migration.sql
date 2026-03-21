-- AlterTable
ALTER TABLE "conversaciones" ADD COLUMN     "cerrada_en" TIMESTAMP(3),
ADD COLUMN     "escalada_en" TIMESTAMP(3),
ADD COLUMN     "razon_escalacion" TEXT;
