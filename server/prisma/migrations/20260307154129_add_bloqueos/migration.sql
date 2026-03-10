-- CreateTable
CREATE TABLE "bloqueos" (
    "id" TEXT NOT NULL,
    "complejo_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bloqueos" ADD CONSTRAINT "bloqueos_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "complejos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
