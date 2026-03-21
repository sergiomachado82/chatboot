-- CreateTable
CREATE TABLE "csat_ratings" (
    "id" TEXT NOT NULL,
    "conversacion_id" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "comentario" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "csat_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "csat_ratings_conversacion_id_key" ON "csat_ratings"("conversacion_id");

-- AddForeignKey
ALTER TABLE "csat_ratings" ADD CONSTRAINT "csat_ratings_conversacion_id_fkey" FOREIGN KEY ("conversacion_id") REFERENCES "conversaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
