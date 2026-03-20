-- AlterTable
ALTER TABLE "emails_procesados" ADD COLUMN     "body_original" TEXT,
ADD COLUMN     "es_formulario" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "respuesta_enviada" TEXT;
