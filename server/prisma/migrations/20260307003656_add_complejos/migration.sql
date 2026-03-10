-- CreateTable
CREATE TABLE "complejos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "direccion" TEXT,
    "ubicacion" TEXT,
    "tipo" TEXT,
    "superficie" TEXT,
    "capacidad" INTEGER NOT NULL DEFAULT 4,
    "dormitorios" INTEGER NOT NULL DEFAULT 1,
    "banos" INTEGER NOT NULL DEFAULT 1,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "check_in" TEXT,
    "check_out" TEXT,
    "estadia_minima" INTEGER,
    "mascotas" BOOLEAN NOT NULL DEFAULT false,
    "ninos" BOOLEAN NOT NULL DEFAULT true,
    "fumar" BOOLEAN NOT NULL DEFAULT false,
    "fiestas" BOOLEAN NOT NULL DEFAULT false,
    "video_tour" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complejos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas" (
    "id" TEXT NOT NULL,
    "complejo_id" TEXT NOT NULL,
    "temporada" TEXT NOT NULL,
    "precio_noche" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" TEXT NOT NULL,
    "complejo_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complejos_nombre_key" ON "complejos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tarifas_complejo_id_temporada_key" ON "tarifas"("complejo_id", "temporada");

-- AddForeignKey
ALTER TABLE "tarifas" ADD CONSTRAINT "tarifas_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "complejos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "complejos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
