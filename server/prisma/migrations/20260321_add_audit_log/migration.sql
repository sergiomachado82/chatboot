-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "agente_id" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "detalle" JSONB,
    "ip" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entidad_creado_en_idx" ON "audit_logs"("entidad", "creado_en");
CREATE INDEX "audit_logs_agente_id_creado_en_idx" ON "audit_logs"("agente_id", "creado_en");
