-- CreateIndex
CREATE INDEX "bloqueos_complejo_id_fecha_inicio_fecha_fin_idx" ON "bloqueos"("complejo_id", "fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "conversaciones_estado_idx" ON "conversaciones"("estado");

-- CreateIndex
CREATE INDEX "reservas_habitacion_estado_idx" ON "reservas"("habitacion", "estado");

-- CreateIndex
CREATE INDEX "reservas_fecha_entrada_fecha_salida_idx" ON "reservas"("fecha_entrada", "fecha_salida");
