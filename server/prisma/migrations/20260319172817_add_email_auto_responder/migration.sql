-- AlterTable
ALTER TABLE "complejos" ADD COLUMN     "auto_responder_email" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "emails_procesados" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "from_email" TEXT NOT NULL,
    "subject" TEXT,
    "complejo_id" TEXT,
    "respondido" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_procesados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emails_procesados_message_id_key" ON "emails_procesados"("message_id");

-- CreateIndex
CREATE INDEX "emails_procesados_from_email_creado_en_idx" ON "emails_procesados"("from_email", "creado_en");
