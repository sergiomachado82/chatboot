-- CreateTable
CREATE TABLE "bot_config" (
    "id" TEXT NOT NULL,
    "nombre_agente" TEXT NOT NULL DEFAULT 'Las Grutas Departamentos',
    "ubicacion" TEXT NOT NULL DEFAULT 'Las Grutas, Rio Negro, Patagonia Argentina',
    "tono" TEXT NOT NULL DEFAULT 'amable, profesional y cercano',
    "idioma" TEXT NOT NULL DEFAULT 'es_AR',
    "usar_emojis" BOOLEAN NOT NULL DEFAULT false,
    "longitud_respuesta" TEXT NOT NULL DEFAULT 'corta',
    "auto_pre_reserva" BOOLEAN NOT NULL DEFAULT true,
    "modo_envio_fotos" TEXT NOT NULL DEFAULT 'auto',
    "escalar_si_queja" BOOLEAN NOT NULL DEFAULT true,
    "escalar_si_pago" BOOLEAN NOT NULL DEFAULT true,
    "mensaje_bienvenida" TEXT NOT NULL DEFAULT 'Hola! Bienvenido a Las Grutas Departamentos. Tenemos departamentos a pocas cuadras de la playa en Las Grutas, Rio Negro. En que puedo ayudarte? Puedo informarte sobre disponibilidad, precios, departamentos o actividades en la zona.',
    "mensaje_despedida" TEXT NOT NULL DEFAULT 'Gracias por contactarnos! Si necesitas algo mas, no dudes en escribirnos. Que tengas un excelente dia!',
    "mensaje_fuera_horario" TEXT NOT NULL DEFAULT 'Gracias por tu mensaje. En este momento estamos fuera de horario. Te responderemos a la brevedad.',
    "mensaje_espera_humano" TEXT NOT NULL DEFAULT 'Entendido, te voy a comunicar con uno de nuestros agentes. Te va a atender en breve. Gracias por tu paciencia.',
    "horario_inicio" TEXT,
    "horario_fin" TEXT,
    "telefono_contacto" TEXT NOT NULL DEFAULT '+54 2920 561033',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_config_pkey" PRIMARY KEY ("id")
);
