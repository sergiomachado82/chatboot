-- CreateTable
CREATE TABLE "huespedes" (
    "id" TEXT NOT NULL,
    "wa_id" TEXT NOT NULL,
    "nombre" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "huespedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agentes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'agente',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversaciones" (
    "id" TEXT NOT NULL,
    "huesped_id" TEXT NOT NULL,
    "agente_id" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'bot',
    "ultimo_mensaje" TEXT,
    "ultimo_mensaje_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes" (
    "id" TEXT NOT NULL,
    "conversacion_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "direccion" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "metadata" JSONB,
    "wa_message_id" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "huesped_id" TEXT NOT NULL,
    "conversacion_id" TEXT,
    "fecha_entrada" TIMESTAMP(3) NOT NULL,
    "fecha_salida" TIMESTAMP(3) NOT NULL,
    "num_huespedes" INTEGER NOT NULL DEFAULT 1,
    "habitacion" TEXT,
    "precio_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'pre_reserva',
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "habitacion" TEXT NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "precio" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notas" TEXT,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_templates" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "contenido" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "huespedes_wa_id_key" ON "huespedes"("wa_id");

-- CreateIndex
CREATE UNIQUE INDEX "agentes_email_key" ON "agentes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mensajes_wa_message_id_key" ON "mensajes"("wa_message_id");

-- CreateIndex
CREATE INDEX "mensajes_conversacion_id_creado_en_idx" ON "mensajes"("conversacion_id", "creado_en");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_fecha_habitacion_key" ON "inventario"("fecha", "habitacion");

-- CreateIndex
CREATE UNIQUE INDEX "wa_templates_nombre_key" ON "wa_templates"("nombre");

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_huesped_id_fkey" FOREIGN KEY ("huesped_id") REFERENCES "huespedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversaciones" ADD CONSTRAINT "conversaciones_agente_id_fkey" FOREIGN KEY ("agente_id") REFERENCES "agentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_huesped_id_fkey" FOREIGN KEY ("huesped_id") REFERENCES "huespedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
