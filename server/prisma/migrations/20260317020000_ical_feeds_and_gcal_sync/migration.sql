-- CreateTable: IcalFeed
CREATE TABLE "ical_feeds" (
    "id" TEXT NOT NULL,
    "complejo_id" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "etiqueta" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_sync" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ical_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ical_feeds_complejo_id_url_key" ON "ical_feeds"("complejo_id", "url");

-- AddForeignKey
ALTER TABLE "ical_feeds" ADD CONSTRAINT "ical_feeds_complejo_id_fkey" FOREIGN KEY ("complejo_id") REFERENCES "complejos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: copy existing ical_url values into ical_feeds
INSERT INTO "ical_feeds" ("id", "complejo_id", "plataforma", "url", "creado_en")
SELECT
    gen_random_uuid()::text,
    "id",
    'booking',
    "ical_url",
    NOW()
FROM "complejos"
WHERE "ical_url" IS NOT NULL AND "ical_url" != '';

-- Drop the ical_url column from complejos
ALTER TABLE "complejos" DROP COLUMN "ical_url";

-- Add googleCalEventId to reservas
ALTER TABLE "reservas" ADD COLUMN "google_cal_event_id" TEXT;

-- Add googleCalEventId and origenGoogle to bloqueos
ALTER TABLE "bloqueos" ADD COLUMN "google_cal_event_id" TEXT;
ALTER TABLE "bloqueos" ADD COLUMN "origen_google" BOOLEAN NOT NULL DEFAULT false;
