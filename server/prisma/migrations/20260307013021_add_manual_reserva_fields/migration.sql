-- DropForeignKey
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_huesped_id_fkey";

-- AlterTable
ALTER TABLE "reservas" ADD COLUMN     "importe_usd" DECIMAL(65,30),
ADD COLUMN     "monto_reserva" DECIMAL(65,30),
ADD COLUMN     "nombre_huesped" TEXT,
ADD COLUMN     "nro_factura" TEXT,
ADD COLUMN     "origen_reserva" TEXT,
ADD COLUMN     "saldo" DECIMAL(65,30),
ADD COLUMN     "tarifa_noche" DECIMAL(65,30),
ADD COLUMN     "telefono_huesped" TEXT,
ALTER COLUMN "huesped_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_huesped_id_fkey" FOREIGN KEY ("huesped_id") REFERENCES "huespedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
