-- AlterTable
ALTER TABLE "tarifas" ADD COLUMN     "estadia_minima" INTEGER;

-- CreateTable
CREATE TABLE "tarifas_especiales" (
    "id" TEXT NOT NULL,
    "complejo_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "precio_noche" DECIMAL(65,30) NOT NULL,
    "estadia_minima" INTEGER,
    "motivo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_especiales_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tarifas_especiales" ADD CONSTRAINT "tarifas_especiales_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "complejos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
