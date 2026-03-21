-- CreateTable
CREATE TABLE "bot_config_audit" (
    "id" TEXT NOT NULL,
    "agente_id" TEXT,
    "campo" TEXT NOT NULL,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_config_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "nivel" TEXT NOT NULL DEFAULT 'error',
    "mensaje" TEXT NOT NULL,
    "detalle" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bot_config_audit_creado_en_idx" ON "bot_config_audit"("creado_en");

-- CreateIndex
CREATE INDEX "integration_logs_servicio_creado_en_idx" ON "integration_logs"("servicio", "creado_en");
