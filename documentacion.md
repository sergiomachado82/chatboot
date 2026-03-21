# Chatbot de Alojamientos — Documentacion Tecnica

## 1. Descripcion General

Sistema de chatbot para alojamiento turistico que automatiza la atencion al huesped via WhatsApp Business, con panel web de agentes en tiempo real y sincronizacion con Google Sheets.

**Funcionalidades principales:**

- Atencion automatica de huespedes via WhatsApp (disponibilidad, precios, zona, actividades)
- Clasificacion de intenciones mediante IA (Claude API) con fallback por regex
- Flujo completo de reservas: consulta de disponibilidad, cotizacion y pre-reserva
- Flujo de pago con validacion humana (transferencia o MercadoPago)
- Escalado automatico a agente humano (por queja, solicitud, cancelacion o modificacion de reserva)
- Panel web para que agentes vean, intervengan y gestionen conversaciones en tiempo real
- Gestion de complejos/departamentos con tarifas estacionales y especiales
- Bloqueos de disponibilidad (mantenimiento, uso personal)
- Calendario mensual visual de reservas (grilla con filas por departamento/unidad)
- Simulador de WhatsApp para desarrollo local sin cuenta Meta Business
- Sincronizacion de reservas con Google Sheets
- Sincronizacion multi-plataforma via iCal (Booking, Airbnb, VRBO, otros) — multiples feeds por complejo
- Sincronizacion bidireccional con Google Calendar (push reservas/bloqueos, pull eventos externos como bloqueos)
- Recuperacion de contrasena via email (SMTP)
- Logo personalizable del bot
- Recepcion y escalado de imagenes de WhatsApp (comprobantes, DNI)
- Transcripcion de audios via Claude API
- Endpoint webchat para integracion con landing page (bot sin WhatsApp)
- Formato optimizado para burbujas de WhatsApp (datos bancarios, listas, ubicacion)
- Envio de fotos con caption descriptivo (nombre de la imagen o fallback al depto)
- Compartir ubicacion via Google Maps con vista previa automatica en WhatsApp
- Recoleccion progresiva de datos del huesped durante reserva (nombre, celular, DNI)
- Validacion de DNI server-side (rango 5.000.000 - 99.999.999)
- Persistencia automatica de datos del huesped entre reservas (nombre, telefono, DNI se guardan en el perfil)

**Stack tecnologico:**

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19, TypeScript 5.7, Vite 6, TailwindCSS 4, TanStack Query 5 |
| Backend | Express 5, TypeScript, Prisma 6, Pino, Zod |
| Base de datos | PostgreSQL 16 |
| Cache/Colas | Redis 7, Bull (preparado, no activo aun) |
| Tiempo real | Socket.io 4 |
| IA | Claude API (Haiku para clasificacion/audio, Sonnet para respuestas) |
| Integraciones | WhatsApp Cloud API (Meta), Google Sheets API, Google Calendar API, iCal multi-plataforma (Booking, Airbnb, VRBO) |

---

## 2. Arquitectura

### 2.1 Estructura del Proyecto

```
chatboot/
├── .env                          # Variables de entorno (root)
├── docker-compose.yml            # PostgreSQL (5433) + Redis (6380)
├── package.json                  # Monorepo root (concurrently)
├── vite.config.ts                # Proxy /api→:5050, /socket.io→ws
├── index.html                    # Entry HTML
├── tsconfig.json                 # References app + node configs
├── tsconfig.app.json             # Frontend TS config
├── tsconfig.node.json            # Vite TS config
│
├── shared/types/                 # Tipos compartidos client/server
│   ├── api.ts                    # HealthResponse, ApiError, PaginatedResponse
│   ├── agente.ts                 # Agente, AgenteRol, LoginRequest/Response
│   ├── huesped.ts                # Huesped
│   ├── conversacion.ts           # Conversacion, ConversacionEstado
│   ├── mensaje.ts                # Mensaje, MensajeTipo, MensajeDireccion, MensajeOrigen
│   ├── reserva.ts                # Reserva, ReservaEstado, CrearReservaRequest
│   ├── complejo.ts               # Complejo, Tarifa, TarifaEspecial, Bloqueo, MediaFile
│   ├── inventario.ts             # Inventario, DisponibilidadResult
│   └── websocket.ts              # ServerToClientEvents, ClientToServerEvents
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                      # DATABASE_URL (requerido por Prisma CLI)
│   ├── prisma/
│   │   └── schema.prisma         # 14 Modelos: Huesped, Agente, Conversacion, Mensaje, Reserva, Inventario, WaTemplate, Complejo, Tarifa, TarifaEspecial, MediaFile, Bloqueo, IcalFeed, BotConfig
│   └── src/
│       ├── index.ts              # Entry: HTTP server + Socket.io + graceful shutdown
│       ├── app.ts                # Express app: middleware chain + rutas
│       ├── config/env.ts         # Validacion Zod de variables de entorno
│       ├── lib/
│       │   ├── prisma.ts         # Singleton PrismaClient
│       │   └── redis.ts          # Conexion Redis con retry + fallback
│       ├── utils/
│       │   ├── logger.ts         # Pino logger (pretty en dev, JSON en prod)
│       │   ├── errors.ts         # Clases de error custom (AppError, ValidationError, NotFoundError, UnauthorizedError)
│       │   ├── asyncHandler.ts   # Wrapper para async route handlers (catch → next)
│       │   └── dateUtils.ts      # Utilidades de fecha Argentina timezone (getArgentinaToday, getArgentinaTime, formatLocalDate)
│       ├── types/express.d.ts    # Augment Request con req.user
│       ├── middleware/
│       │   ├── authMiddleware.ts    # JWT Bearer validation
│       │   ├── errorHandler.ts      # Global error handler
│       │   ├── rateLimiter.ts       # Rate limiting con Redis + fallback in-memory. Factory createRateLimiter() + limiters por ruta (login 5/min, webchat 30/min, API 100/min)
│       │   ├── rateLimitWhatsApp.ts # Rate limit por numero WhatsApp (10 msg/min, Redis)
│       │   ├── requestId.ts         # Genera X-Request-ID unico por request
│       │   ├── requestLogger.ts     # Log method, url, status, duration
│       │   └── webhookSignature.ts  # HMAC SHA256 para webhook Meta
│       ├── routes/
│       │   ├── health.ts         # GET /api/health
│       │   ├── auth.ts           # POST /api/auth/login, forgot-password, reset-password
│       │   ├── webhook.ts        # GET + POST /api/webhook
│       │   ├── simulator.ts      # POST /api/simulator/send
│       │   ├── conversaciones.ts # CRUD + acciones de control
│       │   ├── complejos.ts      # CRUD + tarifas + tarifas especiales + bloqueos + media + iCal feeds
│       │   ├── botConfig.ts     # GET/PATCH /api/bot/config + POST/DELETE /api/bot/logo
│       │   ├── reservas.ts       # CRUD + cambio de estado + query por rango de fechas
│       │   ├── inventario.ts     # Consulta + disponibilidad
│       │   ├── huespedes.ts      # Lista + detalle + edicion
│       │   ├── agentes.ts        # CRUD (admin only para crear)
│       │   ├── ical.ts           # GET /api/ical/:complejoId.ics (publico, export iCal)
│       │   ├── webchat.ts        # POST /api/webchat/send (publico, bot para landing page)
│       │   └── whatsappProfile.ts # GET/PATCH /api/whatsapp/profile (perfil WA Business)
│       ├── services/
│       │   ├── authService.ts         # Login, JWT, password reset tokens
│       │   ├── emailService.ts        # Envio de emails SMTP (recuperacion de contrasena)
│       │   ├── claudeService.ts       # Clasificacion de intents + generacion de respuestas + transcripcion audio
│       │   ├── botEngine.ts           # Orquestador del bot (acumulacion de entidades, contexto adicional)
│       │   ├── webhookProcessor.ts    # Procesamiento de mensajes entrantes
│       │   ├── whatsappService.ts     # Envio de mensajes y fotos (WA o simulador)
│       │   ├── conversacionService.ts # State machine de conversaciones
│       │   ├── mensajeService.ts      # CRUD mensajes + emit socket
│       │   ├── huespedService.ts      # findOrCreate huespedes
│       │   ├── complejoService.ts     # CRUD complejos + tarifas + tarifas especiales + bloqueos + media
│       │   ├── inventarioService.ts   # Disponibilidad + bloqueo/liberacion de fechas
│       │   ├── inventarioSyncService.ts # Sincronizacion de tarifas con inventario + temporadas
│       │   ├── reservaService.ts      # CRUD reservas + sync Sheets
│       │   ├── sheetsService.ts       # Sync con Google Sheets
│       │   ├── socketManager.ts       # Socket.io init + emit helpers
│       │   ├── conversacionCleanup.ts  # Cron job: cierra conversaciones inactivas >48h
│       │   ├── icalService.ts         # Export iCal + Import/sync multi-plataforma (Booking, Airbnb, VRBO, etc.)
│       │   ├── icalSyncJob.ts         # Cron job iCal sync cada 30 min (itera IcalFeed activos)
│       │   ├── googleCalendarService.ts # Push/pull bidireccional con Google Calendar
│       │   ├── gcalSyncJob.ts         # Cron job Google Calendar sync cada 5 min
│       │   ├── botConfigService.ts    # getBotConfig() con cache 5 min, updateBotConfig()
│       │   └── whatsappProfileService.ts # Get/update WhatsApp Business profile (Meta API o simulador)
│       ├── scripts/
│       │   ├── seedAgente.ts          # Crea admin inicial
│       │   ├── seedInventory.ts       # Seed de inventario (3 anios x departamentos)
│       │   ├── hashPassword.ts        # Utilidad para hashear passwords
│       │   ├── testAll.ts             # 97 tests de endpoints HTTP (12 grupos)
│       │   ├── testQA.ts              # 97 tests de logica de negocio (14 modulos QA)
│       │   ├── testBotMemory.ts       # 30 tests de retencion de entidades (8 escenarios)
│       │   ├── testQAScenarios.ts     # 34 tests de conversaciones QA (18 areas)
│       │   ├── testStress.ts          # 14 stress tests (capacidad, reglas, fallbacks)
│       │   ├── testSimulaciones.ts    # 11 conversaciones simuladas (visibles en UI)
│       │   ├── checkCapInv.ts         # Debug: capacidad de inventario
│       │   ├── checkContext.ts        # Debug: contexto del bot
│       │   ├── checkEstadia.ts        # Debug: reglas de estadia minima
│       │   ├── checkLastConv.ts       # Debug: ultima conversacion
│       │   ├── debugBlockDates.ts     # Debug: bloqueo de fechas
│       │   ├── debugBloqueo.ts        # Debug: bloqueos de disponibilidad
│       │   └── fixEstadiaMinima.ts    # Utilidad: correccion de estadia minima
│       └── data/
│           └── accommodationContext.ts # Info del alojamiento para Claude (desde DB)
│
└── src/                          # Frontend React
    ├── main.tsx                  # QueryClientProvider + mount
    ├── index.css                 # TailwindCSS imports
    ├── App.tsx                   # Auth gate + layout principal
    ├── api/
    │   ├── apiClient.ts          # apiFetch con Bearer + 401 handling
    │   ├── authApi.ts            # login, logout, isAuthenticated, forgotPassword, resetPassword
    │   ├── botConfigApi.ts       # GET/PATCH bot config + logo upload
    │   ├── whatsappProfileApi.ts # GET/PATCH perfil WhatsApp Business
    │   ├── conversacionApi.ts    # CRUD conversaciones + acciones
    │   ├── complejoApi.ts        # CRUD complejos + tarifas + bloqueos + media + iCal feeds
    │   ├── reservaApi.ts         # CRUD reservas + query por rango de fechas
    │   ├── inventarioApi.ts      # Consulta inventario + disponibilidad
    │   ├── huespedApi.ts         # Lista + detalle huespedes
    │   └── simulatorApi.ts       # Enviar mensaje simulado
    ├── hooks/
    │   ├── useSocket.ts          # Singleton Socket.io con auth
    │   ├── useConversaciones.ts  # React Query + real-time updates
    │   ├── useChat.ts            # Mensajes con push real-time
    │   ├── useReservas.ts        # React Query para reservas + calendario
    │   └── useComplejos.ts       # React Query para complejos
    └── components/
        ├── auth/
        │   ├── LoginPage.tsx         # Login + link a recuperar contrasena
        │   ├── AuthLayout.tsx        # Layout compartido para paginas de auth
        │   └── ResetPasswordPage.tsx # Flujo de recuperacion de contrasena
        ├── bot/BotConfigPage.tsx     # Configuracion del bot (nombre, tono, mensajes, logo, titulares verificados)
        ├── layout/Header.tsx
        ├── chat/
        │   ├── ChatList.tsx       # Lista con filtros
        │   ├── ChatListItem.tsx   # Preview de conversacion
        │   ├── ChatWindow.tsx     # Ventana de chat completa
        │   ├── ChatHeader.tsx     # Acciones: tomar/devolver/cerrar
        │   ├── ChatInput.tsx      # Input de mensaje
        │   ├── ChatSearchBar.tsx  # Busqueda dentro de conversacion (texto + rango fechas)
        │   └── MessageBubble.tsx  # Burbuja por tipo de origen (highlight de busqueda)
        ├── guests/GuestCard.tsx   # Sidebar con info del huesped
        ├── complejos/
        │   ├── ComplejoList.tsx   # Lista/grilla de complejos
        │   ├── ComplejoCard.tsx   # Card individual de complejo
        │   ├── ComplejoEditModal.tsx # Modal de edicion (7 tabs: Datos, Amenities, Politicas, Tarifas, Reserva, Media, Sync)
        │   ├── TarifaSection.tsx  # Tarifas estacionales + especiales + bloqueos
        │   ├── MediaGallery.tsx   # Galeria de fotos del complejo
        │   ├── MediaUploadForm.tsx # Formulario de subida de media
        │   └── ResumenPanel.tsx   # Panel resumen del complejo
        ├── reservas/
        │   ├── ReservaList.tsx    # Tabla de reservas con toggle calendario
        │   └── ReservaCalendar.tsx # Calendario mensual visual (grilla)
        ├── simulator/WhatsAppSimulator.tsx
        ├── whatsapp/WhatsAppProfilePage.tsx # Edicion del perfil WA Business
        └── ui/
            ├── Badge.tsx          # Badge con colores por estado
            ├── EmptyState.tsx     # Placeholder vacio
            ├── ErrorBoundary.tsx  # Error boundary React
            └── Skeleton.tsx       # Placeholder de carga
```

### 2.2 Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌──────────┐  ┌─────────────┐  ┌───────────┐  ┌────────────┐  │
│  │ LoginPage│  │  ChatList    │  │ChatWindow │  │ GuestCard  │  │
│  │          │  │  (filtros)   │  │ (mensajes)│  │ (sidebar)  │  │
│  └────┬─────┘  └──────┬──────┘  └─────┬─────┘  └─────┬──────┘  │
│       │               │               │               │         │
│  ┌────┴───────────────┴───────────────┴───────────────┴──────┐  │
│  │                    API Layer (apiFetch)                     │  │
│  │              + React Query + Socket.io Client              │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTP + WebSocket
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND (Express 5)                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Middleware: helmet → cors → json → logger → auth → rate   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────┐  ┌─────────────┐  ┌────────────┐               │
│  │   Routes   │  │  Services   │  │  Bot Engine │               │
│  │ /api/*     │──│ CRUD + logic│──│ Claude API  │               │
│  └──────┬─────┘  └──────┬──────┘  └──────┬─────┘               │
│         │               │               │                       │
│  ┌──────┴───────────────┴───────────────┴──────────────────┐   │
│  │              Socket.io (real-time)                        │   │
│  └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
    ┌────────────┐    ┌────────────┐    ┌────────────────┐
    │ PostgreSQL │    │   Redis    │    │ Google Sheets  │
    │  (5433)    │    │  (6380)    │    │ (fire & forget)│
    └────────────┘    └────────────┘    └────────────────┘
```

### 2.3 Cadena de Middleware (app.ts)

```
Peticion HTTP
  │
  ├── helmet()                    # Headers de seguridad
  ├── cors()                      # CORS habilitado
  ├── express.json()              # Parseo de body JSON
  ├── requestLogger               # Log de cada peticion
  │
  ├── RUTAS PUBLICAS (sin auth):
  │   ├── GET/POST /api/health
  │   ├── POST /api/auth/login         ← loginRateLimiter (5 req/min/IP)
  │   ├── POST /api/auth/forgot-password ← loginRateLimiter (5 req/min/IP)
  │   ├── POST /api/auth/reset-password
  │   ├── GET/POST /api/webhook
  │   ├── POST /api/simulator/send
  │   ├── GET /api/ical/:complejoId.ics
  │   └── POST /api/webchat/send       ← webchatRateLimiter (30 req/min/IP)
  │
  ├── RUTAS PROTEGIDAS (Router separado):
  │   ├── authMiddleware           # Valida JWT Bearer
  │   ├── rateLimiter              # 100 req/min/IP
  │   ├── /api/conversaciones/*
  │   ├── /api/complejos/*
  │   ├── /api/inventario/*
  │   ├── /api/reservas/*
  │   ├── /api/huespedes/*
  │   ├── /api/agentes/*
  │   ├── /api/bot/config          # GET/PATCH config del bot + POST/DELETE logo
  │   └── /api/whatsapp/profile    # GET/PATCH perfil WhatsApp Business
  │
  └── errorHandler                # Catch-all de errores
```

---

## 3. Modelo de Datos

### 3.1 Diagrama Entidad-Relacion

```
┌───────────┐       ┌──────────────┐       ┌──────────┐
│  Agente   │       │ Conversacion │       │ Huesped  │
│───────────│       │──────────────│       │──────────│
│ id (PK)   │◄──┐   │ id (PK)      │   ┌──►│ id (PK)  │
│ nombre    │   └───│ agenteId(FK) │   │   │ waId (U) │
│ email (U) │       │ huespedId(FK)│───┘   │ nombre   │
│ passwordH │       │ estado       │       │ telefono │
│ rol       │       │ ultimoMsg    │       │ dni      │
│ activo    │       │ ultimoMsgEn  │       │ email    │
│ online    │       └──────┬───────┘       │ notas    │
└───────────┘              │               └─────┬────┘
                           │                     │
                    ┌──────┴───────┐       ┌─────┴────┐
                    │   Mensaje    │       │ Reserva  │
                    │──────────────│       │──────────│
                    │ id (PK)      │       │ id (PK)  │
                    │ conversId(FK)│       │ huespId  │
                    │ tipo         │       │ convId   │
                    │ direccion    │       │ nombreH  │
                    │ origen       │       │ telefonoH│
                    │ contenido    │       │ dni      │
                    │ metadata     │       │ fechaEnt │
                    │ waMessageId  │       │ fechaSal │
                    └──────────────┘       │ numHuesp │
                                           │ habitac  │
                                           │ tarifaN  │
                                           │ precioT  │
                                           │ montoRes │
                                           │ saldo    │
                                           │ estado   │
                                           │ origenR  │
                                           │ nroFact  │
                                           │ importeU │
                                           └──────────┘

┌────────────┐       ┌────────────┐       ┌─────────────────┐
│  Complejo  │       │  Tarifa    │       │ TarifaEspecial  │
│────────────│       │────────────│       │─────────────────│
│ id (PK)    │──┐    │ id (PK)    │       │ id (PK)         │
│ nombre (U) │  ├───►│ complejoId │       │ complejoId      │
│ aliases[]  │  │    │ temporada  │       │ fechaInicio     │
│ capacidad  │  │    │ precioNoche│       │ fechaFin        │
│ cantidadUn   │  │    │ estadiaMin │       │ precioNoche     │
│ tipo       │  │    └────────────┘       │ estadiaMinima   │
│ superficie │  │    (U: complejoId+temp) │ motivo          │
│ dormitorios│  │                         │ activo          │
│ banos      │  │    ┌────────────┐       └─────────────────┘
│ amenities[]│  ├───►│  Bloqueo   │
│ checkIn/Out│  │    │────────────│       ┌────────────┐
│ estadiaMin │  │    │ id (PK)    │       │ Inventario │
│ mascotas   │  │    │ complejoId │       │────────────│
│ ninos      │  │    │ fechaInicio│       │ id (PK)    │
│ fumar      │  │    │ fechaFin   │       │ fecha      │
│ fiestas    │  │    │ motivo     │       │ habitacion │
│ banco/cbu  │  │    └────────────┘       │ disponible │
│ linkMP     │  │                         │ precio     │
│ activo     │  │    ┌────────────┐       │ notas      │
└────────────┘  └───►│   Media    │       └────────────┘
                     │────────────│       (U: fecha+habitacion)
                     │ id (PK)    │
                     │ complejoId │
                     │ tipo       │
                     │ url        │       ┌────────────┐
                     │ caption    │       │  IcalFeed  │
                     │ orden      │       │────────────│
                     └────────────┘       │ id (PK)    │
                                    ┌────►│ complejoId │
┌────────────┐                      │     │ plataforma │
│ BotConfig  │    Complejo.id ──────┘     │ url        │
│────────────│                            │ etiqueta   │
│ id (PK)    │                            │ activo     │
│ nombreAgte │                            │ ultimoSync │
│ ubicacion  │                            └────────────┘
│ tono       │
│ idioma     │
│ logo       │
│ ...config  │
└────────────┘
(singleton)
```

### 3.2 Modelos Prisma

**Complejo** (`complejos`): Departamento/unidad de alojamiento. Campos principales: `nombre` (unico), `aliases` (nombres alternativos), `capacidad` (por unidad), `cantidadUnidades`, `dormitorios`, `banos`, `superficie`, `tipo`, `amenities[]`, `checkIn/checkOut`, `estadiaMinima`, politicas (`mascotas`, `ninos`, `fumar`, `fiestas`), datos bancarios (`titularCuenta`, `banco`, `cbu`, `aliasCbu`, `cuit`, `linkMercadoPago`), `videoTour`, `activo`. Relaciones: tarifas, tarifasEspeciales, media, bloqueos, icalFeeds.

**IcalFeed** (`ical_feeds`): Feed iCal de una plataforma externa asociado a un complejo. Campos: `complejoId`, `plataforma` (booking, airbnb, vrbo, otro), `url`, `etiqueta` (opcional), `activo`, `ultimoSync`. Constraint unico `[complejoId, url]`. Relacion N:1 con Complejo (cascade delete).

**Tarifa** (`tarifas`): Precio por temporada (baja/media/alta) para un complejo. Constraint unico `[complejoId, temporada]`. Campos: `precioNoche`, `estadiaMinima` (opcional).

**TarifaEspecial** (`tarifas_especiales`): Override de precio para un rango de fechas especifico. Tiene prioridad sobre la tarifa estacional. Campos: `fechaInicio`, `fechaFin`, `precioNoche`, `estadiaMinima`, `motivo`, `activo`.

**Bloqueo** (`bloqueos`): Bloqueo de disponibilidad para un complejo (reparaciones, uso personal). Campos: `complejoId`, `fechaInicio`, `fechaFin`, `motivo`, `unidades`, `googleCalEventId` (ID del evento en Google Calendar), `origenGoogle` (true si fue importado desde GCal). Al crear, marca las fechas como no disponibles en Inventario y push a Google Calendar. Al eliminar, libera las fechas solo si no hay reservas ni otros bloqueos, y elimina el evento de GCal.

**Huesped** (`huespedes`): Persona que contacta por WhatsApp. Se identifica por `waId` (numero de telefono WA, unico). Campos: `nombre`, `telefono`, `dni`, `email`, `notas`. El bot actualiza automaticamente nombre, telefono y DNI del huesped cuando los recolecta durante una reserva (solo si el campo estaba vacio, no sobreescribe). Tiene relacion 1:N con conversaciones y reservas.

**Agente** (`agentes`): Operador del panel web. Autenticacion por email+password (bcrypt). Roles: `admin` o `agente`. Campo `online` para estado de presencia.

**Conversacion** (`conversaciones`): Hilo de chat entre huesped y sistema. Tiene un estado (`ConversacionEstado`) y opcionalmente un agente asignado. Relacion 1:N con mensajes y reservas.

**Mensaje** (`mensajes`): Mensaje individual dentro de una conversacion. Campos clave:
- `tipo`: text, image, audio, document, location, template, system
- `direccion`: entrante (del huesped) o saliente (del sistema)
- `origen`: huesped, bot, agente, sistema
- `waMessageId`: ID del mensaje en WhatsApp (unico, para deduplicacion)
- `metadata`: JSON con intent, confidence, entities del bot
- Indice compuesto en `[conversacionId, creadoEn]` para consultas eficientes

**Reserva** (`reservas`): Reserva de alojamiento. Campos principales:
- `huespedId` (nullable — puede ser manual), `conversacionId` (nullable)
- `nombreHuesped`, `telefonoHuesped`, `dni` (datos del huesped, recolectados por el bot o ingresados manualmente)
- `fechaEntrada`, `fechaSalida`, `numHuespedes`, `habitacion`
- `tarifaNoche`, `precioTotal` (Decimal), `montoReserva` (sena), `saldo`
- `estado`: pre_reserva | confirmada | cancelada | completada
- `origenReserva`: whatsapp | manual | web | booking | airbnb | vrbo | otro
- `googleCalEventId`: ID del evento en Google Calendar (para sync bidireccional)
- `nroFactura`, `importeUsd`, `notas`

**Inventario** (`inventario`): Disponibilidad diaria por habitacion. Constraint unico `[fecha, habitacion]` para evitar duplicados. Campos: `fecha`, `habitacion`, `disponible`, `precio`, `notas`.

**BotConfig** (`bot_config`): Configuracion global del bot (singleton, un solo registro). Campos: `nombreAgente`, `ubicacion`, `tono`, `idioma` (es_AR/es/en), `usarEmojis`, `longitudRespuesta` (corta/media/detallada), `autoPreReserva`, `modoEnvioFotos` (auto/off), `escalarSiQueja`, `escalarSiPago`, `mensajeBienvenida`, `mensajeDespedida`, `mensajeFueraHorario`, `mensajeEsperaHumano`, `horarioInicio/Fin`, `telefonoContacto`, `logo` (URL). Cache en memoria de 5 min. Editable desde el panel admin (`/api/bot/config`).

**WaTemplate** (`wa_templates`): Templates de WhatsApp pre-aprobados por Meta (para mensajes fuera de ventana de 24h). Preparado pero no implementado aun.

### 3.3 Enumeraciones de Estado

**ConversacionEstado** — Maquina de estados:

```
    ┌─────────────────────────────────────────┐
    │                                         │
    ▼                                         │
  [bot] ──────► [espera_humano] ──────► [humano_activo]
    │                                         │
    │                                         │
    └──────────────► [cerrado] ◄──────────────┘
```

| Estado | Descripcion | Quien responde |
|--------|-------------|----------------|
| `bot` | El bot maneja la conversacion | Bot (Claude API) |
| `espera_humano` | Huesped solicito agente o se escalo por queja | Nadie (en espera) |
| `humano_activo` | Un agente tomo el control | Agente humano |
| `cerrado` | Conversacion finalizada | Nadie |

**ReservaEstado**:

```
[pre_reserva] ──► [confirmada] ──► [completada]
      │                 │
      └──► [cancelada] ◄┘
```

| Estado | Descripcion |
|--------|-------------|
| `pre_reserva` | Creada por el bot o manualmente, pendiente de confirmacion por agente humano |
| `confirmada` | Confirmada por agente humano tras validar pago y enviar factura |
| `cancelada` | Cancelada (libera fechas en inventario automaticamente) |
| `completada` | Estancia finalizada |

**Temporadas** (definidas en `inventarioSyncService.ts`):

| Temporada | Meses |
|-----------|-------|
| Alta | 15 dic - 31 dic, Enero, Febrero |
| Media | Julio, 1 dic - 14 dic |
| Baja | Marzo - Junio, Agosto - Noviembre |

---

## 4. API REST — Referencia de Endpoints

### 4.1 Rutas Publicas (sin autenticacion)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/health` | Estado del servicio, uptime, conectividad DB y Redis |
| `POST` | `/api/auth/login` | Autenticacion de agentes |
| `POST` | `/api/auth/forgot-password` | Solicitar email de recuperacion de contrasena |
| `POST` | `/api/auth/reset-password` | Resetear contrasena con token |
| `GET` | `/api/webhook` | Verificacion de webhook de Meta |
| `POST` | `/api/webhook` | Recepcion de mensajes de WhatsApp |
| `POST` | `/api/simulator/send` | Enviar mensaje simulado (solo en `SIMULATOR_MODE`) |
| `POST` | `/api/simulator/send-audio` | Enviar audio simulado — transcribe con Claude y procesa como texto (solo en `SIMULATOR_MODE`) |
| `GET` | `/api/ical/:complejoId.ics` | Export calendario iCal (Booking.com lee esta URL para ver disponibilidad) |
| `POST` | `/api/webchat/send` | Envia mensaje al bot desde la landing page y recibe respuesta JSON |

#### POST /api/auth/login

```json
// Request
{ "email": "admin@chatboot.com", "password": "admin123" }

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "agente": {
    "id": "clx...", "nombre": "Admin", "email": "admin@chatboot.com",
    "rol": "admin", "activo": true, "online": false, "creadoEn": "2026-..."
  }
}

// Response 401
{ "error": "Unauthorized", "message": "Invalid credentials" }
```

#### POST /api/simulator/send

```json
// Request
{
  "body": "Hola, tienen disponibilidad?",
  "from": "5491155550000",   // opcional, default: 5491155550000
  "name": "Juan"             // opcional, default: Simulador
}

// Response 200
{ "ok": true }
```

#### POST /api/simulator/send-audio

```json
// Request
{
  "audio": "base64-encoded-audio-data",
  "mimeType": "audio/ogg",              // o "audio/webm", etc.
  "from": "5491155550000",               // opcional
  "name": "Juan"                         // opcional
}

// Response 200
{ "ok": true, "transcripcion": "Hola, quiero consultar disponibilidad" }

// Response 500
{ "error": "Transcription failed" }
```

#### POST /api/webchat/send

```json
// Request
{
  "sessionId": "abc12345",   // ID sesion del visitante web (8-64 chars, requerido)
  "message": "Hola, tienen disponibilidad para febrero?",
  "name": "Maria"            // opcional, default: "Visitante Web"
}

// Response 200
{
  "response": "Hola Maria! Bienvenido a Las Grutas Departamentos..."
}

// Response 400
{ "error": "Validation error", "details": { ... } }
```

### 4.2 Rutas Protegidas (requieren `Authorization: Bearer <token>`)

#### Conversaciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/conversaciones?estado=` | Listar conversaciones (filtro opcional) |
| `GET` | `/api/conversaciones/:id` | Detalle de conversacion |
| `GET` | `/api/conversaciones/:id/mensajes?limit=50&before=` | Mensajes de una conversacion |
| `POST` | `/api/conversaciones/:id/tomar-control` | Agente toma el control → `humano_activo` |
| `POST` | `/api/conversaciones/:id/devolver-bot` | Devuelve al bot → `bot` |
| `POST` | `/api/conversaciones/:id/cerrar` | Cierra la conversacion → `cerrado` |
| `POST` | `/api/conversaciones/:id/mensajes` | Agente envia mensaje al huesped |

#### Complejos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/complejos` | Listar todos (incluye tarifas, tarifas especiales, media, bloqueos) |
| `GET` | `/api/complejos/:id` | Detalle con relaciones completas |
| `POST` | `/api/complejos` | Crear complejo (validacion Zod) |
| `PATCH` | `/api/complejos/:id` | Actualizar complejo |
| `DELETE` | `/api/complejos/:id` | Soft delete (activo=false) |
| `PUT` | `/api/complejos/:id/tarifas` | Upsert tarifa estacional |
| `GET` | `/api/complejos/:id/tarifas-especiales` | Listar tarifas especiales |
| `POST` | `/api/complejos/:id/tarifas-especiales` | Crear tarifa especial (auto-sync a Inventario) |
| `PATCH` | `/api/complejos/:id/tarifas-especiales/:teId` | Actualizar tarifa especial (re-sync) |
| `DELETE` | `/api/complejos/:id/tarifas-especiales/:teId` | Eliminar (restaura precios estacionales) |
| `GET` | `/api/complejos/:id/bloqueos` | Listar bloqueos de disponibilidad |
| `POST` | `/api/complejos/:id/bloqueos` | Crear bloqueo (marca fechas no disponibles) |
| `DELETE` | `/api/complejos/:id/bloqueos/:bloqueoId` | Eliminar bloqueo (libera fechas si es seguro) |
| `GET` | `/api/complejos/:id/ical-feeds` | Listar feeds iCal del complejo |
| `POST` | `/api/complejos/:id/ical-feeds` | Crear feed iCal (plataforma, url, etiqueta) |
| `DELETE` | `/api/complejos/:id/ical-feeds/:feedId` | Eliminar feed iCal |
| `POST` | `/api/complejos/:id/media` | Agregar archivo multimedia |
| `DELETE` | `/api/complejos/:id/media/:mediaId` | Eliminar archivo multimedia |
| `PATCH` | `/api/complejos/:id/media/orden` | Reordenar archivos multimedia |

#### Reservas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/reservas?estado=` | Listar reservas (filtro por estado) |
| `GET` | `/api/reservas?from=&to=` | Listar reservas por rango de fechas (para calendario) |
| `GET` | `/api/reservas/:id` | Detalle de reserva |
| `POST` | `/api/reservas` | Crear reserva desde bot (requiere huespedId) |
| `POST` | `/api/reservas/manual` | Crear reserva manual (requiere nombreHuesped) |
| `PATCH` | `/api/reservas/:id` | Actualizar reserva |
| `PATCH` | `/api/reservas/:id/estado` | Cambiar estado de reserva |
| `DELETE` | `/api/reservas/:id` | Eliminar reserva (recalcula inventario si tenia habitacion). Retorna 204 |

```json
// POST /api/reservas/manual
{
  "nombreHuesped": "Juan Perez",
  "telefonoHuesped": "+5492920123456",
  "dni": "35123456",
  "fechaEntrada": "2026-03-20",
  "fechaSalida": "2026-03-25",
  "numHuespedes": 2,
  "habitacion": "Pewmafe",
  "tarifaNoche": 45000,
  "precioTotal": 225000,
  "montoReserva": 67500,
  "estado": "pre_reserva",
  "origenReserva": "manual"
}

// PATCH /api/reservas/:id/estado
{ "estado": "confirmada" }
```

#### Emails Procesados

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/emails?page=&pageSize=&respondido=&complejoId=&esFormulario=&hasError=&search=` | Listar emails procesados (paginados, con filtros) |
| `GET` | `/api/emails/stats` | Estadisticas: emails hoy, respondidos, errores, formularios |
| `GET` | `/api/emails/:id` | Detalle de un email procesado |
| `DELETE` | `/api/emails/:id` | Eliminar email procesado. Retorna 204 |

#### Inventario

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/inventario?habitacion=&mes=&anio=` | Inventario mensual |
| `GET` | `/api/inventario/disponibilidad?fechaEntrada=&fechaSalida=&habitacion=` | Consulta disponibilidad |
| `PUT` | `/api/inventario/:id` | Actualizar precio/disponibilidad |

#### Huespedes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/huespedes` | Listar huespedes |
| `GET` | `/api/huespedes/:id` | Detalle (incluye reservas) |
| `PATCH` | `/api/huespedes/:id` | Actualizar datos |

#### Agentes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/agentes` | Listar agentes |
| `POST` | `/api/agentes` | Crear agente (solo admin) |

#### Configuracion del Bot

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/bot/config` | Obtener configuracion actual del bot (auto-create con defaults) |
| `PATCH` | `/api/bot/config` | Actualizar configuracion parcialmente (Zod validation) |
| `POST` | `/api/bot/logo` | Subir logo del bot (base64 en body, max 500KB) |
| `DELETE` | `/api/bot/logo` | Eliminar logo del bot |

#### Perfil WhatsApp Business

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/whatsapp/profile` | Obtener perfil del negocio (about, description, address, email, websites, vertical) |
| `PATCH` | `/api/whatsapp/profile` | Actualizar perfil (Zod: about max 139, description max 512, address max 256, websites max 2) |

---

## 5. Eventos WebSocket (Socket.io)

### 5.1 Autenticacion

El cliente se conecta con el token JWT en el handshake:

```typescript
const socket = io({ auth: { token: localStorage.getItem('token') } });
```

El servidor valida el token en el middleware de Socket.io y rechaza conexiones sin token valido.

### 5.2 Eventos Server → Client

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `mensaje:nuevo` | `Mensaje` | Nuevo mensaje en una conversacion |
| `conversacion:actualizada` | `Conversacion` | Cambio de estado, agente asignado, etc. |
| `conversacion:nueva` | `Conversacion` | Nueva conversacion creada |
| `agente:online` | `agenteId: string` | Agente se conecto (definido en types, no implementado aun) |
| `agente:offline` | `agenteId: string` | Agente se desconecto (definido en types, no implementado aun) |
| `simulator:mensaje` | `{ from, type, body, timestamp, imageUrl? }` | Respuesta del bot (solo simulador). `type` es `"text"` o `"image"` |

### 5.3 Eventos Client → Server

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `join:conversacion` | `conversacionId: string` | Suscribirse a updates de una conversacion |
| `leave:conversacion` | `conversacionId: string` | Desuscribirse |
| `agente:status` | `online: boolean` | Cambiar estado de presencia (definido en types, no implementado aun) |

### 5.4 Rooms

Cada conversacion tiene un room `conv:{conversacionId}`. Cuando un agente abre un chat, se une al room y recibe los mensajes nuevos en tiempo real. Al salir, se desuscribe.

---

## 6. Motor del Bot (Bot Engine)

### 6.1 Flujo de Procesamiento de Mensajes

```
Mensaje de WhatsApp (o simulador)
  │
  ▼
webhookProcessor.processIncomingMessage()
  │
  ├── 1. findOrCreateHuesped(waId, nombre)
  ├── 2. findOrCreateConversacion(huespedId)
  ├── 3. createMensaje(entrante, huesped)
  │
  ├── if estado == 'bot':
  │     └── botEngine.handleBotMessage()
  │           │
  │           ├── 4. Construir historial de conversacion (ultimos 20 msgs)
  │           │
  │           ├── 5. classifyIntent(mensaje, historial) ──► Claude Haiku / fallback regex
  │           │       └── returns: { intent, confidence, entities }
  │           │
  │           ├── 6. Acumular entidades de TODA la conversacion
  │           │       └── getAccumulatedEntities(conversacionId)
  │           │       └── Merge: entidades actuales + acumuladas (actual tiene prioridad)
  │           │
  │           ├── 7. Segun intent:
  │           │     ├── fotos? → enviar imagenes directamente (bypass Claude)
  │           │     ├── hablar_humano / queja → estado='espera_humano'
  │           │     ├── despedida → estado='cerrado'
  │           │     └── otros → construir contexto adicional y generar respuesta
  │           │
  │           ├── 8. Construir contexto adicional:
  │           │     ├── Datos ya conocidos (NO volver a preguntar)
  │           │     ├── Analisis de capacidad por num_personas
  │           │     ├── Datos faltantes (solo preguntar estos)
  │           │     ├── Departamentos ocupados en las fechas
  │           │     ├── Resultados de disponibilidad con precios
  │           │     └── Validacion de estadia minima
  │           │
  │           ├── 9. generateResponse(intent, entities, historial, contexto) ──► Claude Sonnet
  │           │
  │           ├── 10. Si allPresent (7 campos) y usuario confirma:
  │           │     ├── createReserva(datos + nombre + telefono + dni)
  │           │     └── updateHuesped(nombre, telefono, dni) si estaban vacios
  │           │
  │           ├── 11. createMensaje(saliente, bot, metadata={intent,entities})
  │           └── 12. sendWhatsAppMessage(to, respuesta)
  │
  └── if estado == 'espera_humano' / 'humano_activo':
        └── (sin respuesta automatica — agentes ven mensaje via Socket.io)
```

### 6.2 Acumulacion de Entidades

El bot mantiene memoria de toda la conversacion mediante `getAccumulatedEntities()`:

1. Lee TODOS los mensajes del bot en la conversacion (ordenados por fecha)
2. Extrae las entidades guardadas en `metadata.entities` de cada mensaje
3. Construye un mapa acumulado donde el valor mas reciente gana
4. Al procesar un nuevo mensaje:
   - Las entidades extraidas del mensaje actual tienen **prioridad**
   - Las entidades acumuladas **rellenan** los datos faltantes
   - Para intenciones genericas (saludo, despedida, queja, zona) NO se acumulan

**Ejemplo**: Si en el mensaje 1 el huesped dijo "somos 2 personas" y en el mensaje 3 dice "del 15 al 20 de marzo", el bot recuerda ambos datos sin volver a preguntar.

### 6.3 Clasificacion de Intenciones

El sistema clasifica cada mensaje en una de 10 intenciones. Usa Claude Haiku (rapido y barato) con fallback a regex si la API key no esta configurada.

| Intent | Descripcion | Accion del bot |
|--------|-------------|----------------|
| `saludo` | "Hola", "Buenos dias" | Bienvenida + oferta de ayuda |
| `consulta_disponibilidad` | "Hay lugar para el 15 de marzo?" | Consulta inventario real, responde con precios |
| `consulta_precio` | "Cuanto cuesta una noche?" | Informa tarifas por departamento y temporada |
| `consulta_alojamiento` | "Tienen parrilla?", "Check-in?" | Responde con info del departamento |
| `consulta_zona` | "Que hacer en la zona?" | Recomienda actividades, restaurantes |
| `reservar` | "Quiero reservar" | Inicia flujo: pide fechas, personas, departamento |
| `hablar_humano` | "Quiero hablar con una persona" | Escala a `espera_humano` |
| `queja` | "Esto es inaceptable" | Auto-escala a `espera_humano` |
| `despedida` | "Adios, gracias" | Despedida + cierra conversacion |
| `otro` | Mensajes no clasificados | Respuesta generica amable |

### 6.4 Extraccion de Entidades

El clasificador extrae entidades del mensaje cuando es posible:

```json
{
  "intent": "consulta_disponibilidad",
  "confidence": 0.92,
  "entities": {
    "fecha_entrada": "2026-03-20",
    "fecha_salida": "2026-03-25",
    "num_personas": "2",
    "habitacion": "Pewmafe",
    "nombre_huesped": "Juan Perez",
    "telefono": "2920412345",
    "dni": "35123456"
  }
}
```

**Entidades validas** (`VALID_ENTITY_KEYS`): `num_personas`, `fecha_entrada`, `fecha_salida`, `habitacion`, `nombre_huesped`, `telefono`, `dni`

**Reglas estrictas de extraccion:**
- NUNCA inventar entidades que el usuario no dijo explicitamente
- `num_personas`: Solo si dice explicitamente cuantas personas ("somos 3"). NUNCA confundir noches con personas
- `fecha_entrada/fecha_salida`: Solo si menciona fechas concretas. Formato YYYY-MM-DD. Ano actual = 2026
- `habitacion`: Si menciona departamento o se infiere del contexto conversacional
- `nombre_huesped`: Solo si el usuario dice su nombre ("soy Juan", "me llamo Maria Perez")
- `telefono`: Solo si da un numero de celular ("mi celular es 2920412345")
- `dni`: Solo si da su numero de documento ("mi DNI es 35123456", "documento 28.456.789"). Se valida server-side: rango 5.000.000-99.999.999, se eliminan puntos
- NO copiar entidades de mensajes anteriores del bot

### 6.5 Contexto del Alojamiento

El archivo `accommodationContext.ts` construye dinamicamente el contexto desde la base de datos:

- **getFullContext()**: Genera markdown con TODOS los departamentos activos, sus amenities, tarifas por temporada, politicas, datos de pago y zona
- **getFilteredContext(departamento)**: Genera markdown solo para UN departamento especifico (por nombre o alias). Se usa cuando el huesped ya eligio un departamento para evitar que Claude mencione otros
- **getDepartmentImages(departamento, max?)**: Retorna objetos `{ url, caption }` de imagenes del departamento desde la tabla Media (max 6 por defecto)

**Cache in-memory (5 min TTL)**: Las consultas a la DB para construir el contexto se cachean en memoria durante 5 minutos. La funcion `invalidateContextCache()` borra el cache inmediatamente cuando se modifican complejos, tarifas, tarifas especiales, media o bloqueos (llamada desde `complejoService.ts`). Esto evita queries repetidos a la DB en cada mensaje del bot sin perder consistencia ante cambios del admin.

**Informacion del alojamiento (Las Grutas Departamentos):**
- Ubicacion: Las Grutas, Rio Negro, Patagonia Argentina
- Departamentos: Pewmafe, Luminar Mono, Luminar 2Amb, LG (nombres configurables)
- Cada departamento tiene: capacidad, unidades, amenities, check-in/out, politicas
- Precios en pesos argentinos (ARS), varian segun temporada

### 6.6 Uso de Modelos Claude

| Tarea | Modelo | Max tokens | Motivo |
|-------|--------|-----------|--------|
| Clasificacion de intent | `claude-haiku-4-5-20251001` | 200 | Rapido, barato, suficiente para clasificacion |
| Generacion de respuesta | `claude-sonnet-4-5-20250929` | 500 | Mas capaz para respuestas naturales y contextuales |
| Transcripcion de audio | `claude-haiku-4-5-20251001` | 1000 | Transcripcion rapida de audios de WhatsApp |

Ambos tienen fallback local: si `ANTHROPIC_API_KEY` no esta configurada, se usan respuestas predefinidas y regex para clasificacion.

### 6.7 Contexto Adicional Dinamico

El botEngine construye un `additionalContext` que se inyecta al prompt de Claude con informacion calculada en tiempo real:

| Dato | Cuando se agrega | Ejemplo |
|------|-----------------|---------|
| Departamento activo | Cuando hay `habitacion` en entidades | "Responde SOLO sobre este departamento" |
| Datos ya conocidos | Cuando hay entidades acumuladas | "Departamento: Pewmafe, Personas: 2, Nombre: Juan, Tel: 2920412345, DNI: 35123456" |
| Analisis de capacidad | Cuando se conoce `num_personas` | "Pewmafe: APTO (4 pers/unidad), Luminar Mono: NO APTO" |
| Datos faltantes | Cuando faltan entidades clave | "Datos que FALTAN: nombre del huesped, numero de celular, DNI" |
| Deptos no disponibles | Cuando hay fechas y hay reservas | "Pewmafe NO DISPONIBLE para esas fechas" |
| Disponibilidad + precios | Cuando hay fechas completas | "Luminar Mono: 5 noches, $175.000 ARS total" |
| Estadia minima | Cuando se valida disponibilidad | "ADVERTENCIA: minimo 3 noches" o "SIN RESTRICCION" |
| Fotos no disponibles | Si fallo el envio de fotos | "No menciones fotos, describe con palabras" |
| Excede capacidad total | Si personas > capacidad combinada | "Sugeri contactar por telefono" |

---

## 7. Directivas del Bot para Responder Mensajes

### 7.1 System Prompt — Reglas de Comportamiento

El bot opera bajo un conjunto estricto de directivas inyectadas en el system prompt de Claude Sonnet:

**Identidad y tono:**
- Asistente virtual de Las Grutas Departamentos
- Tono amable, profesional y cercano
- Espanol de Argentina (voseo: "vos", "podes", "decile")
- Respuestas concisas: maximo 3-4 frases
- Texto plano para WhatsApp (sin markdown, sin emojis excesivos)
- Precios siempre en pesos argentinos (ARS)

**Formato WhatsApp (obligatorio):**
- Mensajes cortos y bien espaciados para burbujas de WhatsApp
- Datos bancarios (CBU, alias, titular, CUIT, banco): cada dato en su propia linea, nunca en medio de un parrafo
- Listas con saltos de linea simples (sin guiones largos)
- Parrafos de maximo 3 lineas antes de un salto
- Links de Google Maps en su propia linea (para que WhatsApp genere preview del mapa)

### 7.2 Reglas Estrictas del Bot

| # | Regla | Detalle |
|---|-------|---------|
| 1 | **FOTOS** | NUNCA incluir URLs de imagenes, links a web, YouTube ni video tours en texto. Las fotos se envian automaticamente como imagenes adjuntas via `sendImage()` con caption (nombre del depto + descripcion de la imagen). Si el usuario pide fotos, responder brevemente ("Aca te muestro fotos de X") y el sistema envia las imagenes. NUNCA generar URLs de fotos en el texto |
| 2 | **PRECIOS** | Usar EXCLUSIVAMENTE las tarifas de la tabla del contexto. NUNCA inventar ni estimar precios |
| 3 | **CAPACIDAD** | La capacidad es POR UNIDAD (por depto individual). NUNCA sugerir un depto si personas > capacidad maxima por unidad. NUNCA ofrecer mas unidades de las que existen. Para grupos que exceden capacidad total, sugerir contactar por telefono |
| 4 | **NO INVENTAR** | NUNCA inventar ni asumir datos que el usuario no dijo. NUNCA inventar restricciones de estadia minima que no aparezcan en el contexto adicional |
| 5 | **INFORMACION** | Solo mencionar departamentos cuya info aparece en el contexto. NUNCA inventar datos |
| 6 | **NO REPETIR PREGUNTAS** | Leer "DATOS YA CONOCIDOS" del contexto adicional. NUNCA volver a preguntar algo ya sabido. Solo preguntar lo que aparece en "Datos que FALTAN" |
| 7 | **FLUJO** | Si no hay datos conocidos, preguntar progresivamente (uno a la vez): personas, fechas, departamento, nombre, celular, DNI. Si ya hay algunos, solo preguntar los faltantes. El DNI debe estar entre 5.000.000 y 99.999.999 |
| 8 | **RESERVAS** | Ver seccion 7.3 — Flujo completo de reservas |
| 9 | **TERMINOLOGIA** | JAMAS usar "pre-reserva", "prereserva", "reserva preliminar" ni "reserva tentativa" con el huesped (son terminos internos). Siempre usar "reserva" |
| 10 | **DATOS BANCARIOS** | JAMAS inventar datos bancarios (CBU, alias, banco, titular, CUIT). Si el contexto adicional contiene "ADVERTENCIA DATOS BANCARIOS", NO mostrar datos de pago bajo ninguna circunstancia |

### 7.3 Flujo Completo de Reservas (Regla 8)

**CRITICO: El bot NUNCA puede decir "te confirmo la reserva" ni nada que implique que la reserva esta confirmada. Solo un agente humano puede confirmar.**

```
PASO 0: Recoleccion progresiva de datos (ANTES de PASO 1)
  └── Bot pregunta uno a la vez hasta tener los 7 campos:
      ├── num_personas, fecha_entrada, fecha_salida, habitacion
      ├── nombre_huesped, telefono, dni
      └── DNI se valida entre 5.000.000 y 99.999.999

PASO 1: Todos los datos completos → Bot resume:
  └── Departamento, fechas, personas, nombre, telefono, DNI, precio total
  └── Consulta el porcentaje de sena del depto
  │   ├── Si es 0% → la reserva queda agendada de palabra, un agente contactara (salta a PASO 4)
  │   └── Si es >0% → informa el porcentaje y pregunta si quiere proceder
  └── Pregunta: "¿Queres proceder con la reserva?"
  └── El sistema auto-crea la reserva en pre_reserva y guarda nombre/telefono/dni en el huesped

PASO 2: Huesped acepta → Bot indica que la sena se abona por transferencia
  └── Pasa datos de la cuenta (titular, CBU, alias, banco) del contexto
  └── El saldo restante se abona por transferencia al momento del check-in
  └── IMPORTANTE: NO mencionar tarjeta/MercadoPago a menos que el huesped PREGUNTE explicitamente

PASO 3: Huesped dice que ya pago
  └── Bot pide comprobante de la transferencia (foto)

PASO 4: Huesped envia comprobante y DNI (o reserva sin sena)
  └── Bot dice: "Un agente va a verificar el pago y te va a enviar la factura por este medio"
  └── "Recien cuando recibas la factura, la reserva queda confirmada"
  └── NUNCA el bot confirma la reserva por si mismo
```

**Proteccion de datos bancarios (3 escenarios)**:

El PASO 2 tiene un guardrail de seguridad en `botEngine.ts` que valida los datos bancarios antes de pasarlos a Claude:

| Escenario | Condicion | Accion del bot |
|-----------|-----------|----------------|
| 1. Titular de confianza | Datos bancarios cargados + titular en lista de `titularesVerificados` (configurable en BotConfig) | Muestra datos bancarios normalmente |
| 2. Sin datos bancarios | Complejo no tiene titular/CBU/banco configurados | Bot dice "un agente te va a contactar" + conversacion pasa a `espera_humano` |
| 3. Titular desconocido | Datos bancarios cargados pero titular NO esta en whitelist | Bot NO muestra datos (riesgo de fraude) + conversacion pasa a `espera_humano` |

Si se detecta el escenario 2 o 3, Claude recibe una "ADVERTENCIA DATOS BANCARIOS" en el contexto adicional con instruccion de NUNCA mostrar datos de cuenta, y la conversacion se escala automaticamente.

**Lo que hace el agente humano (fuera del bot):**
1. Verifica el comprobante de pago
2. Genera la factura digital
3. Envia la factura al huesped por WhatsApp
4. Cambia el estado de la reserva a "confirmada" en el panel

### 7.4 Instrucciones por Intencion

| Intent | Comportamiento del bot |
|--------|----------------------|
| `saludo` | Da la bienvenida y pregunta en que puede ayudar |
| `consulta_disponibilidad` | Si tiene fechas completas, informa disponibilidad real del inventario. Si faltan datos, pide SOLO los que faltan |
| `consulta_precio` | Informa precios usando la tabla de tarifas. Filtra por capacidad si se conoce num_personas |
| `consulta_alojamiento` | Responde sobre el departamento activo o presenta opciones filtradas por capacidad |
| `consulta_zona` | Recomienda actividades y lugares cercanos (buceo, kayak, pinguinera, etc.) |
| `reservar` | Pide SOLO los datos que faltan (personas, fechas, depto, nombre, celular, DNI). Cuando tiene los 7 campos y el usuario confirma, se auto-crea la reserva y se guardan los datos en el huesped. Sigue el flujo de la regla 8 (NUNCA confirmar) |
| `cancelar_reserva` | Informa al huesped que un agente gestionara la cancelacion. Escala a `espera_humano` con mensaje de sistema |
| `cambiar_reserva` | Informa al huesped que un agente gestionara la modificacion. Escala a `espera_humano` con mensaje de sistema |
| `hablar_humano` | Indica que un agente se pondra en contacto pronto. Escala conversacion |
| `queja` | Pide disculpas y escala automaticamente a un agente humano |
| `despedida` | Se despide amablemente y cierra la conversacion |
| `otro` | Responde de forma generica y ofrece ayuda |

### 7.5 Reglas de Extraccion de Entidades (Clasificador)

El clasificador Claude Haiku opera con estas reglas para extraer entidades del ultimo mensaje:

1. NUNCA inventar ni asumir entidades no dichas explicitamente
2. `num_personas`: SOLO si dice explicitamente cuantas personas. "3 noches" NO es "3 personas"
3. `fecha_entrada/fecha_salida`: SOLO si menciona fechas concretas. Si dice "3 noches desde el 15 de abril" → calcula ambas fechas
4. `habitacion`: Incluir si menciona departamento o se infiere del contexto conversacional
5. Fechas en formato YYYY-MM-DD, ano 2026
6. Si dice solo un mes ("para abril"), NO inventar dias
7. NO copiar entidades de mensajes anteriores del bot — solo extraer del mensaje actual
8. `nombre_huesped`: SOLO si el usuario dice su nombre ("soy Juan", "me llamo Maria Perez"). NO inventar
9. `telefono`: SOLO si da un numero de celular argentino. NO inventar
10. `dni`: SOLO si da su numero de documento de identidad. Se aceptan puntos separadores ("28.456.789")

### 7.6 Validacion de Estadia Minima

El bot valida la estadia minima con la siguiente prioridad:

```
1. TarifaEspecial activa que cubra la fecha de entrada → usa su estadiaMinima
2. Tarifa de la temporada correspondiente → usa su estadiaMinima
3. Complejo.estadiaMinima (global) → usa este valor
4. Si ninguno tiene estadiaMinima configurada → NO hay restriccion
   └── El bot dice explicitamente "SIN RESTRICCION DE ESTADIA MINIMA"
   └── NUNCA inventa una restriccion que no existe
```

### 7.7 Manejo de Fotos

Las fotos se envian directamente por codigo, sin pasar por Claude:

1. Bot detecta patron de foto en el mensaje (`/fotos?|imagene?s?|pictures?|mostrame/`)
2. Si hay `habitacion` en entidades → busca imagenes en la tabla Media via `getDepartmentImages()`
3. `getDepartmentImages()` retorna objetos `{ url, caption }` (no solo URLs)
4. Si hay imagenes:
   - **WhatsApp**: envia cada imagen via `sendImage(to, url, caption)` con su caption original (ej: "Living comedor") o fallback `"NombreDepto - Foto N"`
   - **Web chat**: guarda las URLs en `metadata.imageUrls` del mensaje para que el frontend las renderice como galeria
5. Si NO hay imagenes → pasa a Claude con instruccion `photosFailed` de describir el depto con palabras (sin mencionar fotos ni dar excusas tecnicas)

---

## 8. Servicios Backend — Referencia Detallada

### 8.1 inventarioService.ts

La lista de habitaciones se obtiene dinamicamente de la tabla `complejos` (activos) via `getActiveHabitaciones()`, no esta hardcodeada.

| Funcion | Parametros | Descripcion |
|---------|-----------|-------------|
| `getActiveHabitaciones` | — | Retorna nombres de complejos activos desde la DB (reemplaza array hardcoded) |
| `checkAvailability` | `fechaEntrada, fechaSalida, habitacion?` | Consulta disponibilidad real contra Inventario y Reservas. Retorna `DisponibilidadResult[]` con precios por noche |
| `getOccupiedDepartments` | `fechaEntrada, fechaSalida` | Retorna lista de nombres de deptos que tienen reserva activa (no cancelada) en ese rango |
| `blockDates` | `habitacion, fechaEntrada, fechaSalida` | Marca fechas como `disponible=false` en Inventario |
| `releaseDates` | `habitacion, fechaEntrada, fechaSalida` | Marca fechas como `disponible=true` (al cancelar reserva) |
| `releaseDatesIfNotReserved` | `habitacion, fechaInicio, fechaFin, excludeBloqueoId?` | Libera fechas SOLO si no hay reservas activas ni otros bloqueos. Usado al eliminar un Bloqueo |
| `getInventario` | `habitacion?, mes?, anio?` | Retorna registros de inventario filtrados |
| `updateInventarioEntry` | `id, {disponible?, precio?, notas?}` | Actualiza un registro individual |

### 8.2 inventarioSyncService.ts

| Funcion | Descripcion |
|---------|-------------|
| `getSeason(date)` | Determina temporada (baja/media/alta) segun fecha |
| `getSeasonalPrice(complejoId, date)` | Obtiene precio de Tarifa para la temporada de esa fecha |
| `syncTarifaEspecialToInventario(complejoId, desde, hasta, precio)` | Actualiza precios en Inventario para el rango de fechas |
| `restoreSeasonalPrices(complejoId, desde, hasta)` | Restaura precios estacionales tras eliminar TarifaEspecial |

### 8.3 complejoService.ts

| Funcion | Descripcion |
|---------|-------------|
| `listComplejos()` | Lista todos con tarifas, tarifas especiales, media y bloqueos |
| `getComplejoById(id)` | Detalle con relaciones completas |
| `createComplejo(data)` | Crear nuevo departamento |
| `updateComplejo(id, data)` | Actualizar parcialmente |
| `deleteComplejo(id)` | Soft delete (activo=false) |
| `upsertTarifa(complejoId, temporada, precio, minNoches?)` | Crear o actualizar tarifa estacional |
| `listTarifasEspeciales(complejoId)` | Listar tarifas especiales |
| `createTarifaEspecial(complejoId, data)` | Crear tarifa especial |
| `updateTarifaEspecial(id, data)` | Actualizar tarifa especial |
| `deleteTarifaEspecial(id)` | Eliminar tarifa especial |
| `addMedia(complejoId, url, tipo?, caption?, orden?)` | Agregar foto/video |
| `removeMedia(mediaId)` | Eliminar archivo multimedia |
| `reorderMedia(complejoId, orderedIds)` | Reordenar galeria |
| `listBloqueos(complejoId)` | Listar bloqueos ordenados por fechaInicio |
| `createBloqueo(complejoId, data)` | Crear bloqueo de disponibilidad |
| `deleteBloqueo(id)` | Eliminar bloqueo |

### 8.4 reservaService.ts

| Funcion | Descripcion |
|---------|-------------|
| `createReserva(params)` | Desde bot/conversacion. Crea en `pre_reserva`, bloquea fechas, sync Sheets. Params incluyen `nombreHuesped`, `telefonoHuesped`, `dni` |
| `createReservaManual(params)` | Entrada manual (requiere nombreHuesped). Bloquea fechas si hay habitacion. Acepta `dni` opcional |
| `updateReserva(id, params)` | Actualiza campos. Si cancela, libera fechas |
| `updateReservaEstado(id, estado)` | Cambia estado. Si cancela, libera fechas. Sync Sheets |
| `getReservaById(id)` | Detalle con relacion huesped |
| `getReservasByHuesped(huespedId)` | Reservas de un huesped |
| `getReservasByDateRange(from, to)` | Reservas no canceladas que se solapan con el rango. Usado por calendario |
| `deleteReserva(id)` | Elimina reserva de la DB. Si tenia habitacion asignada, recalcula disponibilidad del inventario |
| `listReservas(estado?)` | Lista filtrada por estado |

**Atomicidad**: `createReserva` y `createReservaManual` usan `prisma.$transaction()` para crear la reserva y bloquear las fechas en el inventario de forma atomica. Si alguna operacion falla, se revierte todo. Nota: no usa `SERIALIZABLE` isolation porque el riesgo de concurrencia es bajo en este dominio (alquiler turistico, no ticketing masivo) y todas las reservas son `pre_reserva` que requieren confirmacion humana.

### 8.5 claudeService.ts

| Funcion | Descripcion |
|---------|-------------|
| `classifyIntent(message, history?)` | Clasifica intent con Claude Haiku. 12 intents: saludo, consulta_disponibilidad, consulta_precio, consulta_alojamiento, consulta_zona, reservar, cancelar_reserva, cambiar_reserva, hablar_humano, queja, despedida, otro. Retorna {intent, confidence, entities}. Timeout configurable via `CLAUDE_TIMEOUT_MS` (default 30s) |
| `generateResponse(intent, entities, history, additionalContext?)` | Genera respuesta con Claude Sonnet. Timeout configurable via `CLAUDE_TIMEOUT_MS` |
| `transcribeAudio(audioBuffer, mimeType)` | Transcribe audio a texto con Claude Haiku |

**Timeout y fallback**: Todas las llamadas a Claude tienen timeout configurable (`CLAUDE_TIMEOUT_MS`, default 30000ms). Si Claude no responde a tiempo o la API falla, el sistema usa fallback local: regex para clasificacion y respuestas predefinidas para generacion. Esto garantiza que el bot nunca queda colgado esperando a la API.

### 8.6 sheetsService.ts

Sincronizacion fire-and-forget con Google Sheets. Si falla, loguea error pero no bloquea la operacion. Columnas: ID, Nombre, WA ID, Telefono, Habitacion, Entrada, Salida, Personas, Precio, Estado, Notas, Creado, Actualizado.

### 8.7 authService.ts

| Funcion | Descripcion |
|---------|-------------|
| `verifyCredentials(email, password)` | Busca agente por email, compara password con bcrypt. Retorna datos del agente o null |
| `generateToken(payload)` | Firma JWT con `{id, email, rol}`, expira en 24h |
| `verifyToken(token)` | Verifica JWT y retorna payload o null |

### 8.8 huespedService.ts

| Funcion | Descripcion |
|---------|-------------|
| `findOrCreateHuesped(waId, nombre?)` | Busca huesped por waId, si no existe lo crea |
| `getHuespedById(id)` | Retorna huesped por ID |
| `listHuespedes()` | Lista todos los huespedes ordenados por fecha de creacion |
| `updateHuesped(id, data)` | Actualiza nombre, telefono, dni, email o notas |

### 8.9 conversacionService.ts

| Funcion | Descripcion |
|---------|-------------|
| `findOrCreateConversacion(huespedId)` | Busca conversacion abierta (no cerrada) para el huesped, si no existe crea una nueva en estado `bot`. Emite `conversacion:nueva` |
| `updateConversacionEstado(id, estado, agenteId?)` | Cambia estado y opcionalmente asigna agente. Emite `conversacion:actualizada` |
| `updateUltimoMensaje(id, contenido)` | Actualiza el campo `ultimoMensaje` y `ultimoMensajeEn` |
| `getConversacionById(id)` | Detalle con huesped, agente y conteo de mensajes |
| `listConversaciones(estado?)` | Lista con filtro opcional por estado |

### 8.10 mensajeService.ts

| Funcion | Descripcion |
|---------|-------------|
| `createMensaje(params)` | Crea mensaje en DB, actualiza `ultimoMensaje` de la conversacion, emite `mensaje:nuevo` via Socket.io |
| `getByConversacion(conversacionId, limit?, before?)` | Mensajes paginados de una conversacion, ordenados por fecha |

### 8.11 whatsappService.ts

| Funcion | Descripcion |
|---------|-------------|
| `sendWhatsAppMessage(to, body)` | Envia mensaje de texto. Extrae URLs de imagenes del body y las envia por separado. En modo simulador emite via Socket.io. Para usuarios web (`web_*`) no envia por WhatsApp (la respuesta se guarda en DB) |
| `sendImage(to, imageUrl, caption?)` | Envia imagen al huesped con caption opcional. En modo simulador emite `simulator:mensaje` con `type: 'image'`. Para usuarios web (`web_*`) se omite el envio (imagenes en `metadata.imageUrls`) |
| `downloadMedia(mediaId)` | Descarga archivo multimedia de WhatsApp Cloud API. Retorna Buffer o null |
| `extractImages(body)` | (interna) Extrae URLs de imagenes (jpg/jpeg/png/gif/webp) del texto y las separa. Retorna `{ text, imageUrls }` |

### 8.12 webhookProcessor.ts

Orquesta el procesamiento de mensajes entrantes (WhatsApp o simulador). Flujo: `findOrCreateHuesped` → `findOrCreateConversacion` → `createMensaje` → si estado es `bot`, delega a `botEngine.handleBotMessage()`.

**Tipos de mensajes soportados:**

| Tipo | Procesamiento |
|------|--------------|
| `text` | Se procesa normalmente por el bot |
| `audio` | Se transcribe via Claude Haiku, se procesa como texto |
| `image` | Se guarda con metadata (`mediaId`, `mimeType`) + caption del usuario. Escala a `espera_humano` con mensaje "Un agente la va a revisar". El bot no interpreta imagenes (ej: comprobantes de pago, DNI) |
| otros (`document`, `sticker`, etc.) | Se loguea warning, se guarda como texto plano |

**Deduplicacion por waMessageId**: Antes de procesar un mensaje, verifica si ya existe un registro con el mismo `waMessageId` en la DB. Si existe, hace `return` sin procesar. Esto protege contra los reintentos frecuentes del webhook de WhatsApp, evitando mensajes duplicados, respuestas dobles del bot y reservas duplicadas.

### 8.13 conversacionCleanup.ts

| Funcion | Descripcion |
|---------|-------------|
| `closeInactiveConversations()` | Busca conversaciones en estado `bot` o `espera_humano` sin actividad en las ultimas 48h, agrega mensaje de sistema y cambia estado a `cerrado`. Emite evento socket para actualizar el panel. |
| `startCleanupJob()` | Inicia cron job: ejecucion al startup + cada 60 minutos. |
| `stopCleanupJob()` | Detiene el cron job (llamado en graceful shutdown). |

### 8.14 icalService.ts

| Funcion | Descripcion |
|---------|-------------|
| `generateIcal(complejoId)` | Genera string VCALENDAR (RFC 5545) con VEVENTs para reservas activas (pre_reserva, confirmada) y bloqueos del complejo. Formato VALUE=DATE (all-day). No expone datos del huesped. |
| `syncFromIcalFeed(complejoId, icalUrl, plataforma)` | Fetch URL iCal de cualquier plataforma, parsea con node-ical. Crea reservas nuevas con `origenReserva=plataforma` y `nombreHuesped='Reserva {Plataforma}'`, actualiza fechas modificadas, cancela reservas cuyo UID desaparecio del feed. Recalcula disponibilidad. Push a Google Calendar para reservas nuevas (fire-and-forget). |

**UID tracking**: Cada reserva importada por iCal se identifica por `notas: 'ical-uid:<uid>'`. Esto permite detectar cambios y cancelaciones en syncs posteriores. Las reservas existentes se filtran por `origenReserva: plataforma`, lo que permite feeds de multiples plataformas sin interferencia.

### 8.15 icalSyncJob.ts

| Funcion | Descripcion |
|---------|-------------|
| `startIcalSyncJob()` | Inicia cron job: primera ejecucion 10s despues del startup, luego cada 30 minutos. Consulta `IcalFeed` activos con complejo activo y ejecuta `syncFromIcalFeed()` para cada uno. Actualiza `ultimoSync` despues de cada sync exitoso. |
| `stopIcalSyncJob()` | Detiene el cron job (llamado en graceful shutdown). |

### 8.16 googleCalendarService.ts

Servicio de sincronizacion bidireccional con Google Calendar. Usa la misma Service Account que Google Sheets pero con scope `https://www.googleapis.com/auth/calendar`. Si `GOOGLE_CALENDAR_ID` no esta configurado, todas las funciones retornan silenciosamente sin hacer nada.

**Push (Sistema → Google Calendar):**

| Funcion | Descripcion |
|---------|-------------|
| `pushReservaToGCal(reservaId)` | Crea/actualiza/elimina evento en GCal segun estado de la reserva. Summary: `Reserva: {habitacion} - {nombreHuesped}`. Guarda `googleCalEventId` en la reserva. Si la reserva esta cancelada, elimina el evento. Marca eventos con `extendedProperties.private.chatbootManaged = 'true'`. |
| `pushBloqueoToGCal(bloqueoId)` | Crea evento en GCal para un bloqueo. Skip si `origenGoogle=true` (evita loops). Summary: `Bloqueado: {complejo} - {motivo}`. Guarda `googleCalEventId` en el bloqueo. |
| `deleteBloqueoFromGCal(googleCalEventId)` | Elimina evento de GCal por su ID. Ignora errores 404/410 (evento ya eliminado). |

**Pull (Google Calendar → Sistema):**

| Funcion | Descripcion |
|---------|-------------|
| `syncFromGoogleCalendar()` | Poll incremental con `syncToken` (full sync al restart del server). Solo importa eventos SIN `chatbootManaged` (evita loops). Eventos cancelados → elimina bloqueo correspondiente. Eventos nuevos → crea `Bloqueo` con `origenGoogle: true`. Matchea complejo por nombre/alias en el summary del evento, fallback al primer complejo activo. Recalcula inventario para complejos afectados. |

**Proteccion anti-loop**: Los eventos creados por el sistema llevan `extendedProperties.private.chatbootManaged = 'true'`. Al importar, se ignoran eventos con esta propiedad. Los bloqueos importados desde GCal tienen `origenGoogle: true`, lo que previene que se re-pusheen a GCal.

### 8.17 gcalSyncJob.ts

| Funcion | Descripcion |
|---------|-------------|
| `startGCalSyncJob()` | Inicia cron job: primera ejecucion 15s despues del startup, luego cada 5 minutos. Si `GOOGLE_CALENDAR_ID` no esta configurado, no inicia. |
| `stopGCalSyncJob()` | Detiene el cron job (llamado en graceful shutdown). |

### 8.18 emailQueryService.ts

| Funcion | Descripcion |
|---------|-------------|
| `listEmails(filters, page, pageSize)` | Lista emails procesados con filtros (respondido, complejoId, esFormulario, hasError, search). Paginado |
| `getEmailStats()` | Estadisticas: emails de hoy, respondidos, con error, formularios |
| `getEmailById(id)` | Detalle de un email procesado |
| `deleteEmail(id)` | Elimina un email procesado de la DB |

### 8.19 emailService.ts (SMTP)

| Funcion | Descripcion |
|---------|-------------|
| `sendResetPasswordEmail(email, token)` | Envia email con link de recuperacion de contrasena via SMTP (Gmail). Requiere `SMTP_USER` y `SMTP_PASS` configurados. |

### 8.20 botConfigService.ts

| Funcion | Descripcion |
|---------|-------------|
| `getBotConfig()` | Retorna config del bot. Cache in-memory 5 min TTL. Si no existe registro, lo crea con defaults |
| `updateBotConfig(data)` | Actualiza config en DB e invalida cache inmediatamente |
| `invalidateBotConfigCache()` | Limpia cache manualmente (para tests) |

### 8.21 whatsappProfileService.ts

| Funcion | Descripcion |
|---------|-------------|
| `getBusinessProfile()` | Obtiene perfil WA Business via Meta Graph API (v20.0+). En modo simulador retorna datos dummy |
| `updateBusinessProfile(data)` | Actualiza perfil via Meta API POST. En modo simulador retorna success sin persistir |
| `isSimulatorMode()` | Verifica si esta en modo simulador (sin credenciales WA configuradas) |

### 8.22 Utilidades (utils/)

**errors.ts** — Clases de error custom para respuestas HTTP consistentes:

| Clase | Status | Code |
|-------|--------|------|
| `AppError` | configurable | configurable |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |

**asyncHandler.ts** — HOF que wrappea handlers async para capturar Promise rejections y pasarlas a `next()` de Express, previniendo errores no manejados.

---

## 9. Bloqueos de Disponibilidad

### 9.1 Concepto

El admin puede bloquear la disponibilidad de un departamento para un rango de fechas (reparaciones, uso personal, limpieza profunda). El bot no ofrecera ese departamento en esas fechas.

### 9.2 Flujo de Creacion

```
Admin crea bloqueo (POST /complejos/:id/bloqueos)
  │
  ├── 1. Se crea registro en tabla Bloqueo
  ├── 2. Se obtiene el nombre del complejo
  └── 3. blockDates(nombre, fechaInicio, fechaFin)
        └── Marca disponible=false en Inventario para cada fecha del rango
```

### 9.3 Flujo de Eliminacion (Seguro)

```
Admin elimina bloqueo (DELETE /complejos/:id/bloqueos/:bloqueoId)
  │
  ├── 1. Se obtiene el bloqueo con su complejo
  ├── 2. Se elimina el registro de la tabla Bloqueo
  └── 3. releaseDatesIfNotReserved(nombre, fechaInicio, fechaFin, bloqueoId)
        │
        └── Para CADA fecha del rango:
              ├── ¿Hay reserva activa (no cancelada) en esa fecha? → NO liberar
              ├── ¿Hay OTRO bloqueo que cubra esa fecha? → NO liberar
              └── Ambas verificaciones pasan → disponible=true
```

### 9.4 UI de Bloqueos

Seccion en el tab "Tarifas" del modal de edicion de complejo, con fondo rojo-50:
- Lista de bloqueos existentes con rango de fechas y motivo
- Formulario inline: fecha inicio, fecha fin, motivo (opcional)
- Boton "Bloquear fechas" para crear
- Boton eliminar (X) con confirmacion

---

## 10. Calendario Mensual de Reservas

### 10.1 Concepto

Vista de grilla donde filas = departamentos/unidades, columnas = dias del mes, celdas coloreadas segun estado de la reserva.

### 10.2 Estructura

- **Navegacion**: Flechas izquierda/derecha para cambiar de mes
- **Filas**: Un departamento por fila. Si `cantidadUnidades > 1`, se expande en multiples filas (ej: "LG dpto.1", "LG dpto.2", ..., "LG dpto.5")
- **Columnas**: Dias 1 a N del mes
- **Celdas**: Coloreadas si hay reserva en ese dia

### 10.3 Colores

| Estado | Color |
|--------|-------|
| `pre_reserva` | Naranja (`bg-orange-300`) |
| `confirmada` | Verde (`bg-green-400`) |
| `completada` | Azul (`bg-blue-300`) |

### 10.4 Algoritmo de Distribucion

Para departamentos con multiples unidades, las reservas se distribuyen visualmente usando un algoritmo greedy:

1. Ordenar reservas por dia de inicio
2. Para cada reserva, buscar la primera unidad sin solapamiento
3. Asignar a esa unidad
4. Si todas las unidades estan ocupadas, asignar a la primera (caso anomalo)

### 10.5 Toggle en ReservaList

La vista de reservas tiene un toggle tabla/calendario:
- Icono `List` → vista de tabla con filtros y acciones
- Icono `CalendarDays` → vista de calendario mensual
- Filtro de estado y boton "Nueva Reserva" solo se muestran en modo tabla

---

## 11. Panel de Agentes (Frontend)

### 11.1 Layout Principal

```
┌──────────────────────────────────────────────────────────────┐
│  Header: [Chatbot]  [Chat] [Reservas] [Complejos]    [Salir]│
├──────────┬────────────────────────────────────┬──────────────┤
│          │                                    │              │
│  ChatList│       ChatWindow                   │  GuestCard   │
│  (w-80)  │       (flex-1)                     │  (w-72)      │
│          │                                    │              │
│ [Filtros]│  ┌─ ChatHeader ─────────────────┐  │ Nombre: ...  │
│ Todas    │  │ Nombre  [Tomar] [Cerrar]     │  │ WA: ...      │
│ En espera│  └──────────────────────────────┘  │ Tel: ...     │
│ Mis chats│                                    │ DNI: ...     │
│ Bot      │  ┌─ Mensajes ──────────────────┐  │ Reservas:    │
│ Cerradas │  │ [huesped]  Hola...           │  │  - Pewmafe   │
│          │  │         Bienvenido!  [bot]   │  │    20-25 mar │
│ ┌──────┐ │  │ [huesped]  Precio?           │  │              │
│ │Item 1│ │  │   45.000 ARS...     [bot]   │  │              │
│ │Item 2│ │  └──────────────────────────────┘  │              │
│ │Item 3│ │                                    │              │
│ └──────┘ │  ┌─ ChatInput ─────────────────┐  │              │
│          │  │ [Escribe un mensaje...]  [▶] │  │              │
│          │  └──────────────────────────────┘  │              │
├──────────┴────────────────────────────────────┴──────────────┤
│                                         [Simulador WA] (fab)│
└──────────────────────────────────────────────────────────────┘
```

### 11.2 Colores de Mensajes

| Origen | Color de fondo | Posicion |
|--------|---------------|----------|
| Huesped | Verde claro (`bg-green-100`) | Izquierda |
| Bot | Gris claro (`bg-gray-100`) | Izquierda |
| Agente | Azul (`bg-blue-500`, texto blanco) | Derecha |
| Sistema | Gris centrado, texto pequeno | Centro |

### 11.3 Flujo de Intervencion del Agente

1. Agente ve conversacion en estado `espera_humano` (filtro "En espera")
2. Click "Tomar control" → estado cambia a `humano_activo`, se asigna agente
3. Agente puede escribir mensajes que llegan al huesped por WhatsApp
4. Click "Devolver al bot" → estado vuelve a `bot`, agente desasignado
5. Click "Cerrar" → estado cambia a `cerrado`

Todas las acciones son en tiempo real: otros agentes conectados ven los cambios al instante via Socket.io.

### 11.4 Gestion de Complejos

Modal de edicion con 7 tabs:

| Tab | Contenido |
|-----|-----------|
| **Datos** | Nombre, tipo, superficie, direccion, ubicacion, capacidad, unidades, dormitorios, banos, estadia minima, check-in/out, video tour |
| **Amenities** | Agregar/eliminar tags de amenities (WiFi, A/C, parrilla, etc.) |
| **Politicas** | Toggles: mascotas, ninos, fumar, fiestas |
| **Tarifas** | Tarifas estacionales (baja/media/alta) + Tarifas especiales (rango de fechas) + Bloqueos de disponibilidad |
| **Reserva** | Datos bancarios: titular cuenta, CUIT, banco, CBU, alias CBU, link MercadoPago |
| **Media** | Galeria de fotos/videos: agregar, eliminar, reordenar por drag |
| **Sync** | Feeds iCal multi-plataforma (agregar/eliminar Booking, Airbnb, VRBO, otro) + URL de exportacion iCal con boton copiar |

### 11.5 Gestion de Reservas

**Vista tabla:**
- Columnas: Nombre, Depto, Personas, Entrada, Salida, Dias, Telefono, DNI, Tarifa/noche, Total, Monto reserva, Saldo, Origen, Nro Factura, USD, Estado, Acciones
- Filtro por estado: Todas, pre_reserva, confirmada, cancelada, completada
- Boton "Nueva Reserva" abre modal de creacion manual
- Acciones por estado:
  - `pre_reserva`: Confirmar / Cancelar
  - `confirmada`: Completar
- Boton Eliminar (Trash2 rojo) en todas las reservas, con `window.confirm` antes de ejecutar. Disponible en tabla desktop y cards mobile

**Vista calendario:**
- Grilla mensual con departamentos como filas y dias como columnas
- Colores por estado, hover muestra tooltip con nombre de huesped y fechas

---

## 12. Integracion con Google Sheets

### 12.1 Configuracion

Requiere una Service Account de Google Cloud con acceso a Google Sheets API. Variables de entorno:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=bot@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

La hoja debe tener una pestana llamada `Reservas`.

### 12.2 Estructura de la Hoja

| Columna | Campo |
|---------|-------|
| A | ID de reserva |
| B | Nombre del huesped |
| C | WhatsApp ID |
| D | Telefono |
| E | Habitacion |
| F | Fecha de entrada |
| G | Fecha de salida |
| H | Numero de personas |
| I | Precio total |
| J | Estado |
| K | Notas |
| L | Fecha de creacion |
| M | Ultima actualizacion |

### 12.3 Comportamiento

- **Fire-and-forget**: La sincronizacion no bloquea la operacion principal. Si falla, se loguea el error pero la reserva se mantiene en la base de datos.
- **Append o Update**: Busca por ID en columna A. Si existe, actualiza la fila. Si no, agrega una nueva.
- **Headers automaticos**: Si la hoja esta vacia, crea la fila de encabezados automaticamente.
- **Graceful skip**: Si las credenciales de Google no estan configuradas, simplemente no sincroniza (sin errores).

---

## 13. Integracion con WhatsApp

### 13.1 Modos de Operacion

| Modo | Variable | Comportamiento |
|------|----------|----------------|
| Simulador | `SIMULATOR_MODE=true` | Mensajes via Socket.io, sin Meta API |
| Produccion | `SIMULATOR_MODE=false` | Mensajes via WhatsApp Cloud API v21.0 |

### 13.2 Webhook de Meta

**Verificacion (GET /api/webhook)**:
- Meta envia `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`
- El servidor verifica el token y devuelve el challenge

**Recepcion (POST /api/webhook)**:
- Meta envia payload con mensajes
- Se valida firma HMAC SHA256 (`x-hub-signature-256`) contra `WA_APP_SECRET`
- Se responde 200 inmediatamente (requisito de Meta)
- Procesamiento asincrono de cada mensaje

### 13.3 Envio de Mensajes

```typescript
// WhatsApp Cloud API v21.0
POST https://graph.facebook.com/v21.0/{WA_PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "to": "5491155550000",
  "type": "text",
  "text": { "body": "Hola, bienvenido!" }
}
```

### 13.4 Envio de Imagenes

```typescript
// sendImage(to, imageUrl, caption?) — envia imagen con caption opcional
POST https://graph.facebook.com/v21.0/{WA_PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "to": "5491155550000",
  "type": "image",
  "image": {
    "link": "https://...",
    "caption": "Pewmafe - Living comedor"  // opcional
  }
}
```

El caption se obtiene del campo `caption` de la tabla `MediaFile`. Si no tiene caption, se usa `"NombreDepto - Foto N"` como fallback.

### 13.5 Consideraciones de Produccion

- **Ventana de 24h**: Despues de 24h sin mensaje del huesped, solo se pueden enviar templates pre-aprobados por Meta.
- **HTTPS requerido**: El webhook de Meta requiere SSL. Para desarrollo usar ngrok o cloudflare tunnel.
- **Rate limits**: Meta permite ~80 mensajes/segundo. La cola Bull esta preparada para manejar esto.

---

## 14. Variables de Entorno

| Variable | Requerida | Default | Descripcion |
|----------|-----------|---------|-------------|
| `PORT` | No | `5050` | Puerto del servidor |
| `NODE_ENV` | No | `development` | Entorno de ejecucion |
| `DATABASE_URL` | Si | — | URL de conexion PostgreSQL |
| `REDIS_URL` | No | `redis://localhost:6380` | URL de conexion Redis |
| `JWT_SECRET` | Si | — | Secreto para firmar JWT (min 10 chars) |
| `JWT_EXPIRY` | No | `24h` | Duracion del token JWT |
| `WA_PHONE_NUMBER_ID` | No | `""` | ID del numero de telefono en Meta |
| `WA_ACCESS_TOKEN` | No | `""` | Token de acceso de Meta |
| `WA_VERIFY_TOKEN` | No | `chatboot-verify-token` | Token de verificacion del webhook |
| `WA_APP_SECRET` | No | `""` | Secret de la app para validar firmas |
| `WA_API_VERSION` | No | `v21.0` | Version de la WhatsApp Cloud API |
| `ANTHROPIC_API_KEY` | No | `""` | API key de Claude (sin ella usa fallback) |
| `CLAUDE_CLASSIFIER_MODEL` | No | `claude-haiku-4-5-20251001` | Modelo para clasificacion de intents |
| `CLAUDE_RESPONSE_MODEL` | No | `claude-sonnet-4-5-20250929` | Modelo para generacion de respuestas |
| `CLAUDE_TIMEOUT_MS` | No | `30000` | Timeout para llamadas a Claude API (ms) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | No | `""` | Email de la service account de Google |
| `GOOGLE_PRIVATE_KEY` | No | `""` | Private key de la service account |
| `GOOGLE_SHEET_ID` | No | `""` | ID de la hoja de Google Sheets |
| `GOOGLE_CALENDAR_ID` | No | `""` | ID del calendario de Google (para sync bidireccional) |
| `SMTP_HOST` | No | `""` | Host SMTP. Usar `host.docker.internal` en produccion (Postfix local) o servidor SMTP externo |
| `SMTP_PORT` | No | `25` | Puerto SMTP |
| `SMTP_USER` | No | `""` | Email SMTP para envio de correos. Vacio si se usa Postfix local |
| `SMTP_PASS` | No | `""` | Contrasena de aplicacion SMTP. Vacio si se usa Postfix local |
| `FRONTEND_URL` | No | `http://localhost:5173` | URL del frontend (para links en emails) |
| `SIMULATOR_MODE` | No | `true` | Habilita simulador local |
| `ALLOWED_ORIGINS` | No | `*` | Origenes CORS permitidos (separados por coma) |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Ventana del rate limiter general (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests por ventana por IP |

---

## 15. Setup y Ejecucion

### 15.1 Requisitos

- Node.js 22+
- Docker y Docker Compose
- (Opcional) API key de Anthropic para IA real
- (Opcional) Service Account de Google para sync con Sheets

### 15.2 Instalacion

```bash
# 1. Clonar el proyecto
cd C:\Users\sergi\OneDrive\Desktop\chatboot

# 2. Levantar infraestructura
docker-compose up -d
# PostgreSQL en localhost:5433
# Redis en localhost:6380

# 3. Instalar dependencias
npm install
cd server && npm install && cd ..

# 4. Configurar variables de entorno
# Editar .env con tus valores

# 5. Ejecutar migraciones
cd server && npx prisma migrate dev && cd ..

# 6. Seed de datos iniciales
cd server
npx tsx src/scripts/seedAgente.ts      # Crea admin@chatboot.com / admin123
npx tsx src/scripts/seedInventory.ts   # 180 dias x departamentos
cd ..

# 7. Ejecutar en modo desarrollo
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:5050
```

### 15.3 Scripts Disponibles

**Root (`package.json`):**

| Script | Comando | Descripcion |
|--------|---------|-------------|
| `dev` | `concurrently vite + server dev` | Ejecuta frontend y backend |
| `dev:client` | `vite` | Solo frontend |
| `dev:server` | `npm run dev --prefix server` | Solo backend |
| `build` | `tsc -b && vite build` | Build de produccion |
| `preview` | `vite preview` | Preview del build de produccion |

**Server (`server/package.json`):**

| Script | Comando | Descripcion |
|--------|---------|-------------|
| `dev` | `tsx watch src/index.ts` | Backend con hot reload |
| `build` | `tsc` | Compilar TypeScript a JavaScript |
| `start` | `node dist/index.js` | Ejecutar build de produccion |
| `db:migrate` | `prisma migrate dev` | Ejecutar migraciones |
| `db:push` | `prisma db push` | Push schema sin migracion |
| `db:seed` | `tsx src/scripts/seedAgente.ts` | Seed de agente admin |
| `db:seed-inventory` | `tsx src/scripts/seedInventory.ts` | Seed de inventario |

### 15.4 Puertos

| Servicio | Puerto | Notas |
|----------|--------|-------|
| Frontend (Vite dev) | 5173 | Proxy a backend |
| Backend (Express) | 5050 | API + Socket.io |
| PostgreSQL | 5433 | No-default para evitar conflicto |
| Redis | 6380 | No-default para evitar conflicto |

---

## 16. Seguridad

### 16.1 Autenticacion y Gestion de Usuarios

**Tecnologia:**
- Passwords hasheados con **bcrypt** (12 rounds de salt)
- **JWT** (JSON Web Token) con expiracion configurable (`JWT_EXPIRY`, default 24h)
- Token firmado con `JWT_SECRET` (variable de entorno)
- Payload del token: `{ id, email, rol }`
- Token invalidado en frontend automaticamente al recibir HTTP 401
- Socket.io requiere token JWT valido en el handshake para conectar

**Roles de usuario:**

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total: crear/editar agentes, gestionar complejos, reservas, configuracion del bot, ver todas las conversaciones |
| `agente` | Gestionar conversaciones (tomar, responder, cerrar), ver reservas y complejos. NO puede crear otros agentes |

**Creacion del primer administrador (seed):**

El sistema requiere al menos un agente admin para funcionar. Se crea ejecutando el script de seed:

```bash
npx tsx server/src/scripts/seedAgente.ts
```

Este script crea (o actualiza si ya existe) un agente admin con:
- Email: `admin@chatboot.com`
- Password: `admin123` (hasheado con bcrypt 12 rounds)
- Rol: `admin`
- Usa `upsert` por email — seguro de ejecutar multiples veces

**Creacion de agentes adicionales:**

Solo un admin puede crear nuevos agentes, via API:

```
POST /api/agentes
Authorization: Bearer <token-admin>
{
  "nombre": "Maria Lopez",
  "email": "maria@empresa.com",
  "password": "contraseña-segura",   // min 6 caracteres
  "rol": "agente"                    // o "admin"
}
```

- Requiere token JWT con `rol: admin` — si el rol no es admin, retorna 403 Forbidden
- Password se hashea con bcrypt (12 rounds) antes de guardar
- Email debe ser unico (constraint en DB)
- Validacion con Zod: nombre requerido, email valido, password min 6 chars

**Recuperacion de contrasena:**

1. `POST /api/auth/forgot-password { email }` — genera token aleatorio (32 bytes hex), expira en 1 hora, se envia por email SMTP
2. `POST /api/auth/reset-password { token, newPassword }` — valida token + expiry, hashea nueva password, limpia el token (single-use)
3. Si el email no existe o el agente esta inactivo, retorna 200 igualmente (no revela si el email existe)

### 16.2 Middleware de Seguridad

| Middleware | Ubicacion | Descripcion |
|-----------|-----------|-------------|
| **helmet** | Global | Headers HTTP de seguridad: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **cors** | Global | CORS habilitado para el origin del frontend. Configurable via variable de entorno |
| **express.json()** | Global | Parseo de body JSON con limite de tamano |
| **requestId** | Global | Genera `X-Request-ID` unico (UUID) por cada request para trazabilidad |
| **requestLogger** | Global | Log de cada peticion: method, url, status, duracion en ms |
| **authMiddleware** | Rutas protegidas | Extrae token del header `Authorization: Bearer <token>`, verifica firma y expiracion JWT. Inyecta `req.user = { id, email, rol }`. Retorna 401 si el token falta, es invalido o expiro |
| **rateLimiter** | Rutas protegidas | Limite de requests por IP (ver 16.4) |
| **webhookSignature** | POST /api/webhook | Validacion HMAC SHA256 de payloads de Meta (ver 16.3) |

### 16.3 Seguridad del Webhook de WhatsApp

Meta firma cada payload del webhook con HMAC SHA256 usando el `WA_APP_SECRET`:

1. Se extrae el header `X-Hub-Signature-256` del request
2. Se calcula `sha256=HMAC(WA_APP_SECRET, rawBody)` sobre el body crudo
3. Se compara con `crypto.timingSafeEqual()` (resistente a timing attacks)
4. Si la firma no coincide → 401 Unauthorized
5. En `SIMULATOR_MODE` se omite la validacion (desarrollo local)

### 16.4 Rate Limiting (2 niveles)

**Nivel 1 — API por IP** (`rateLimiter.ts`):
- Limite: 100 requests/minuto por IP (configurable via `RATE_LIMIT_MAX_REQUESTS` y `RATE_LIMIT_WINDOW_MS`)
- Implementacion: Redis (`INCR` + `EXPIRE`) con fallback in-memory si Redis no esta disponible
- Aplica a todas las rutas protegidas (panel de agentes)
- Respuesta si excede: `429 Too Many Requests`

**Nivel 2 — WhatsApp por numero** (`rateLimitWhatsApp.ts`):
- Limite: 10 mensajes/minuto por numero de WhatsApp (`waId`)
- Implementacion: Redis sliding window counter
- Aplica en `webhookProcessor.ts` antes de procesar el mensaje
- Si Redis no esta disponible → permite todos los mensajes (fail-open)
- Protege contra spam/flood de un mismo numero

### 16.5 Validacion de Datos

- **Zod** para validacion de inputs en todas las rutas (schemas tipados)
- **Prisma** para queries parametrizadas (prevencion de SQL injection)
- **express.json()** con limite de tamano de body
- **Sanitizacion de entidades del bot** (`botEngine.ts`): `sanitizeEntities()` filtra claves invalidas, valores nulos/vacios, resuelve fechas relativas y valida formato YYYY-MM-DD
- **Deduplicacion de mensajes**: `waMessageId` unico previene procesamiento duplicado de webhooks

### 16.6 Seguridad del Bot — Proteccion de Datos Bancarios

El bot tiene un guardrail de seguridad en `botEngine.ts` para proteger datos bancarios contra fraude:

**Titulares verificados (configurable desde BotConfig):**

La lista de titulares de confianza se almacena en el campo `titularesVerificados` del modelo `BotConfig` (array de strings). Se gestiona desde el panel admin en la seccion "Comportamiento" de la configuracion del bot. La comparacion es case-insensitive.

```typescript
// botEngine.ts — lee de la DB en vez de hardcoded
const trustedHolders = (botConfig.titularesVerificados ?? []).map(h => h.toLowerCase().trim());
```

| Escenario | Condicion | Accion |
|-----------|-----------|--------|
| Titular verificado | CBU/alias cargados + titular en `titularesVerificados` | Bot muestra datos bancarios normalmente |
| Sin datos bancarios | Complejo no tiene CBU/alias configurados | Bot dice "un agente te contactara" + escala a `espera_humano` |
| Titular desconocido | CBU/alias cargados pero titular NO en `titularesVerificados` | Bot NO muestra datos (riesgo fraude) + escala a `espera_humano` |

Si se detecta escenario 2 o 3:
- Claude recibe `ADVERTENCIA DATOS BANCARIOS` en contexto adicional con prohibicion absoluta de mostrar datos
- La conversacion se escala automaticamente a `espera_humano`
- Se crea mensaje de sistema: "Conversacion escalada: datos bancarios no disponibles o no verificados"

**Regla de oro:** El bot JAMAS puede inventar datos bancarios. Inventar un CBU o alias se considera fraude. Si no tiene datos verificados, siempre escala a un humano.

### 16.7 Seguridad del Bot — Terminologia y Estado de Reservas

- El bot NUNCA puede confirmar una reserva — solo un agente humano puede hacerlo
- PROHIBIDO usar terminos como "pre-reserva", "reserva preliminar", "reserva tentativa" con el huesped (son terminos internos del sistema)
- El bot siempre dice "reserva" y aclara que un agente verificara el pago y enviara la factura

---

## 17. Observabilidad

### 17.1 Logging

Logger: **Pino** con formato pretty en desarrollo y JSON en produccion.

```
[23:03:45] INFO: Database connected
[23:03:45] INFO: Redis connected
[23:03:45] INFO: Server running on port 5050 (development)
[23:03:47] INFO: request { method: "POST", url: "/api/simulator/send", status: 200, duration: 11 }
[23:03:47] INFO: Processing incoming message { from: "5491155550000", type: "text", body: "Hola" }
[23:03:47] INFO: Intent classified { intent: "saludo", confidence: 0.95, entities: {} }
```

### 17.2 Health Check

`GET /api/health` devuelve:
- Estado general del servicio
- Tiempo de actividad (uptime)
- Conectividad con PostgreSQL
- Conectividad con Redis

---

## 18. Guia de Configuracion de Servicios Externos

Esta seccion detalla los requisitos, pasos y credenciales necesarios para configurar cada servicio externo que utiliza la aplicacion. El orden recomendado de configuracion es: Meta Developer → WhatsApp Business → Anthropic Claude → Google Cloud.

---

### 18.1 Meta Developer Account y Meta Business Account

#### Requisitos previos

- Una cuenta personal de **Facebook** (obligatoria como base)
- Email para notificaciones
- Numero de telefono para autenticacion de dos factores

#### Paso 1: Crear cuenta de desarrollador en Meta

1. Ir a `https://developers.facebook.com/`
2. Click en **"Get Started"** o **"Log In"**
3. Iniciar sesion con la cuenta de Facebook
4. Aceptar los terminos de la plataforma Meta y las politicas de desarrollador
5. Verificar la cuenta (email, opcionalmente telefono)

Dashboard de apps: `https://developers.facebook.com/apps/`

#### Paso 2: Crear cuenta de Meta Business (Meta Business Suite)

Requisitos de informacion de la empresa:

- Nombre legal de la empresa
- Direccion de la empresa
- Telefono de la empresa
- Sitio web (recomendado)
- Email de la empresa

Pasos:

1. Ir a `https://business.facebook.com/`
2. Click en **"Create Account"**
3. Ingresar: nombre de la empresa, tu nombre, email de empresa
4. Completar los datos del negocio (direccion, telefono, sitio web)
5. Click en **"Submit"**

#### Paso 3: Verificacion de la empresa (obligatorio para produccion)

Sin verificacion, el limite es de 250 conversaciones iniciadas por el negocio cada 24 horas.

1. Ir a `https://business.facebook.com/settings/`
2. Navegar a **Security Center** (barra lateral izquierda)
3. Click en **"Start Verification"**
4. Proporcionar:
   - Nombre legal de la empresa (debe coincidir exactamente con los documentos)
   - Direccion de la empresa
   - Telefono de la empresa
   - Sitio web
5. Subir **uno** de estos documentos oficiales:
   - Licencia comercial / registro de empresa
   - Escritura de constitucion
   - Certificado de registro fiscal (CIF, NIF, etc.)
   - Factura de servicios publicos a nombre de la empresa
6. Meta revisa la solicitud (tipicamente **1-5 dias habiles**)
7. Puede llegar un codigo de verificacion por telefono o email
8. Resultado: **Verificada** (puedes continuar) o **Rechazada** (con motivos, puedes reintentar)

**Impacto de no estar verificada:**

| Aspecto | Sin verificar | Verificada |
|---------|--------------|-----------|
| Conversaciones iniciadas/24h | 250 | 1,000 → 10,000 → 100,000 → ilimitadas |
| Numeros de telefono adicionales | Maximo 2 | Sin limite |
| Nombre mostrado | "No verificado" | Nombre de la empresa |
| Templates | Limitados | Sin restricciones |

---

### 18.2 WhatsApp Business Platform (Cloud API)

#### Requisitos previos

- Cuenta de Meta Developer (seccion 18.1)
- Cuenta de Meta Business verificada (seccion 18.1)
- Un numero de telefono que:
  - Pueda recibir SMS o llamadas de voz para verificacion
  - **NO** este registrado actualmente en WhatsApp o WhatsApp Business App
  - Sea un numero valido (fijo o movil)
- Un servidor con endpoint HTTPS para webhooks (o ngrok/cloudflare para desarrollo)

#### Paso 1: Crear una app en Meta

1. Ir a `https://developers.facebook.com/apps/`
2. Click en **"Create App"**
3. En "What do you want your app to do?", seleccionar **"Other"**
4. Tipo de app: **"Business"**
5. Completar:
   - **App name**: nombre visible de la app
   - **App contact email**: email de contacto
   - **Business Account**: seleccionar la cuenta de Meta Business
6. Click en **"Create App"**

#### Paso 2: Agregar WhatsApp a la app

1. En el Dashboard de la app, buscar "Add products to your app"
2. Encontrar **"WhatsApp"** y click en **"Set Up"**
3. Seleccionar o crear una cuenta de Meta Business para asociar

#### Paso 3: Obtener credenciales de test (modo desarrollo)

Una vez agregado WhatsApp, Meta provee un entorno de prueba gratuito con:

- **Numero de test** (provisto por Meta, e.g. `+1 555 XXX XXXX`)
- **Phone Number ID** (visible en WhatsApp > Getting Started)
- **WhatsApp Business Account ID** (WABA ID)
- **Token de acceso temporal** (expira en ~24 horas)

#### Paso 4: Obtener un token de acceso permanente (System User Token)

Los tokens temporales expiran. Para produccion:

1. Ir a `https://business.facebook.com/settings/`
2. Navegar a **Users > System Users**
3. Click en **"Add"** para crear un nuevo System User
4. Establecer rol como **Admin**
5. Click en **"Generate New Token"**
6. Seleccionar la app de WhatsApp
7. Asignar estos permisos:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
8. Click en **"Generate Token"**
9. **Copiar y guardar el token de forma segura** — solo se muestra una vez

Este token **NO expira** (a menos que se revoque manualmente).

#### Paso 5: Obtener el App Secret

1. En el Dashboard de la app, ir a **Settings > Basic**
2. El **App Secret** se muestra (click "Show" para revelarlo)
3. Copiar y guardar de forma segura
4. Se usa para la **verificacion de firma de webhooks** (header `X-Hub-Signature-256`)

#### Paso 6: Configurar webhooks

1. En el Dashboard de la app, ir a **WhatsApp > Configuration**
2. En **Webhook**, click en **"Edit"**
3. Completar:
   - **Callback URL**: endpoint HTTPS (e.g. `https://tudominio.com/api/webhook`)
   - **Verify Token**: string personalizado que tu defines (debe coincidir con `WA_VERIFY_TOKEN` en tu `.env`)
4. Click en **"Verify and Save"**
5. Suscribirse a los **Webhook fields** necesarios:
   - `messages` — mensajes entrantes de usuarios

#### Correspondencia con variables de entorno del proyecto

| Credencial obtenida | Variable en `.env` |
|---------------------|-------------------|
| System User Access Token | `WA_ACCESS_TOKEN` |
| Phone Number ID | `WA_PHONE_NUMBER_ID` |
| App Secret | `WA_APP_SECRET` |
| Tu verify token elegido | `WA_VERIFY_TOKEN` |
| (desactivar simulador) | `SIMULATOR_MODE=false` |

#### Precios de WhatsApp Business (por conversacion)

| Categoria | Quien la inicia | Costo aprox. |
|-----------|----------------|-------------------------------|
| **Service** | Usuario | ~$0.005 - $0.015 |
| **Utility** | Negocio | ~$0.005 - $0.015 |
| **Marketing** | Negocio | ~$0.025 - $0.080 |

- **1,000 conversaciones de servicio (user-initiated) por mes son GRATIS** por WABA
- Cada conversacion abre una **ventana de 24 horas** con mensajes ilimitados

---

### 18.3 Tunel HTTPS para Desarrollo Local

El webhook de Meta requiere una URL HTTPS publica. En desarrollo local, se necesita un tunel.

#### Opcion A: ngrok

```bash
ngrok http 5050
# Forwarding  https://a1b2c3d4.ngrok-free.app -> http://localhost:5050
```

Usar `https://a1b2c3d4.ngrok-free.app/api/webhook` como Callback URL en Meta.

#### Opcion B: Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:5050
# https://random-words.trycloudflare.com
```

---

### 18.4 Anthropic Claude API

1. Crear cuenta en `https://console.anthropic.com/`
2. Agregar creditos ($5 minimo para Tier 1) en **Settings > Billing**
3. Generar API Key en `https://console.anthropic.com/settings/keys`
4. Copiar la key (formato: `sk-ant-api03-...`)

| Tarea | Modelo | Costo input | Costo output |
|-------|--------|-------------|-------------|
| Clasificacion | `claude-haiku-4-5-20251001` | $1/MTok | $5/MTok |
| Respuesta | `claude-sonnet-4-5-20250929` | $3/MTok | $15/MTok |

Estimacion: ~$0.004 por intercambio. 100 conversaciones/dia ≈ **$36/mes**.

**Sin API key**: Funciona con respuestas predefinidas y clasificacion por regex (gratis).

---

### 18.5 Google Cloud — Service Account para Google Sheets y Calendar API

1. Crear proyecto en `https://console.cloud.google.com/`
2. Habilitar **Google Sheets API** y **Google Calendar API**
3. Crear Service Account en IAM
4. Descargar key JSON
5. **Compartir la hoja de Google Sheets con el email de la service account como Editor**
6. **Para Google Calendar**: Compartir el calendario con el email de la service account con permisos de **"Make changes to events"** (escritura)
7. Copiar `client_email` y `private_key` del JSON al `.env`
8. Obtener el Calendar ID: Google Calendar > Settings del calendario > "Integrate calendar" > Calendar ID → ponerlo en `GOOGLE_CALENDAR_ID`

---

### 18.6 Resumen de Credenciales

| Servicio | Variable `.env` | Donde obtenerla |
|----------|----------------|-----------------|
| WhatsApp | `WA_ACCESS_TOKEN` | Meta Business Settings > System Users |
| WhatsApp | `WA_PHONE_NUMBER_ID` | App Dashboard > WhatsApp > API Setup |
| WhatsApp | `WA_APP_SECRET` | App Dashboard > Settings > Basic |
| WhatsApp | `WA_VERIFY_TOKEN` | Lo defines tu mismo |
| Claude | `ANTHROPIC_API_KEY` | console.anthropic.com/settings/keys |
| Google | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Campo `client_email` del JSON |
| Google | `GOOGLE_PRIVATE_KEY` | Campo `private_key` del JSON |
| Google | `GOOGLE_SHEET_ID` | URL de la hoja de Google Sheets |
| Google | `GOOGLE_CALENDAR_ID` | Settings del calendario > "Integrate calendar" |
| SMTP | `SMTP_USER` | Email de Gmail para envio de correos |
| SMTP | `SMTP_PASS` | Contrasena de aplicacion de Gmail |

---

## 19. Glosario

| Termino | Definicion |
|---------|-----------|
| **Huesped** | Persona que contacta al alojamiento por WhatsApp |
| **Agente** | Operador humano del panel web |
| **Conversacion** | Hilo de chat entre huesped y sistema (bot o agente) |
| **Bot** | Asistente automatico basado en Claude AI |
| **Complejo** | Departamento o unidad de alojamiento (Pewmafe, Luminar, LG, etc.) |
| **Escalado** | Transicion de conversacion de bot a agente humano |
| **Pre-reserva** | Reserva creada pero pendiente de confirmacion por agente humano |
| **Bloqueo** | Cierre de disponibilidad de un departamento para un rango de fechas |
| **Inventario** | Registro diario de disponibilidad y precios por departamento |
| **Tarifa** | Precio por noche por temporada (baja/media/alta) |
| **Tarifa Especial** | Override de precio para un rango de fechas especifico |
| **waId** | Identificador unico del huesped en WhatsApp (numero de telefono) |
| **Simulador** | Interfaz de prueba que emula WhatsApp para desarrollo local |
| **Fire-and-forget** | Patron donde la operacion secundaria no bloquea la principal |
| **Sena** | Pago parcial (porcentaje variable por departamento, configurado en `porcentajeReserva`) para confirmar la reserva. Si es 0%, la reserva queda de palabra |
| **WABA** | WhatsApp Business Account — cuenta de negocio en WhatsApp |
| **System User** | Usuario de servicio en Meta Business para tokens permanentes |
| **Cloud API** | API de WhatsApp alojada por Meta |
| **Template** | Mensaje pre-aprobado por Meta, requerido fuera de la ventana de 24h |
| **IcalFeed** | Feed iCal de una plataforma externa (Booking, Airbnb, VRBO) vinculado a un complejo |
| **syncToken** | Token de Google Calendar API para sincronizacion incremental (solo eventos nuevos/modificados) |
| **chatbootManaged** | Extended property en eventos GCal que marca eventos creados por el sistema (evita re-importacion) |
| **origenGoogle** | Flag en Bloqueo que indica que fue importado desde Google Calendar |
| **Service Account** | Cuenta de servicio de Google Cloud para autenticacion maquina-a-maquina |
| **MTok** | Millon de tokens — unidad de facturacion de la API de Claude |
| **Sanitizacion de entidades** | Proceso de filtrar solo las claves reconocidas por el bot (num_personas, fecha_entrada, fecha_salida, habitacion) y descartar las no estandar |

---

## 20. Bugs Conocidos y Soluciones

### 20.1 Bug: Bot repite preguntas sobre datos ya proporcionados

**Sintoma**: El huesped dice "somos 12 personas desde el 10 de marzo" y en el siguiente mensaje el bot vuelve a preguntar "cuantas personas son?" o "que fechas tienen?".

**Causas raiz (3 problemas combinados)**:

1. **Entidades no estandar del clasificador**: Claude Haiku a veces devuelve claves como `num_noches`, `noches`, `cantidad_noches`, `num_departamentos` que el bot no reconoce. Al no encontrar `fecha_salida` en las entidades, el bot asume que falta.

2. **Acumulacion sin limites**: Las entidades se acumulaban desde el PRIMER mensaje de toda la conversacion, incluso cruzando saludos ("hola") que conceptualmente reinician la consulta. Datos obsoletos como `habitacion: LG` de una consulta anterior contaminaban la nueva.

3. **No se computaba fecha_salida desde noches**: Cuando el usuario dice "4 noches desde el 10 de marzo", el clasificador devuelve `num_noches: 4` y `fecha_entrada: 2026-03-10` pero a veces no calcula `fecha_salida`. El bot veia que faltaba `fecha_salida` y re-preguntaba.

**Solucion implementada** (`botEngine.ts`):

1. **Sanitizacion de entidades**: Funcion `sanitizeEntities()` que solo conserva las 4 claves validas (`num_personas`, `fecha_entrada`, `fecha_salida`, `habitacion`) y descarta el resto. Filtra valores nulos, "null", y vacios.

2. **Calculo automatico de fecha_salida**: Si el clasificador devuelve `num_noches`/`noches`/`cantidad_noches` junto con `fecha_entrada`, el bot calcula `fecha_salida = fecha_entrada + N dias` automaticamente.

3. **Reset por saludo**: `getAccumulatedEntities()` ahora busca el ultimo mensaje con `intent: 'saludo'` y solo acumula entidades POSTERIORES a ese punto. Un "hola" efectivamente limpia el estado acumulado.

4. **Post-merge computation**: Despues de fusionar entidades actuales + acumuladas, si hay `fecha_entrada` pero no `fecha_salida`, se intenta computarla desde las entidades raw del clasificador.

**Test automatizado**: `server/src/scripts/testBotMemory.ts` — 7 escenarios, 22 assertions validando retencion de entidades, reset por saludo, calculo de noches, y ausencia de re-preguntas.

---

## 21. Suite de Pruebas Integrales

### 21.1 Descripcion

Script automatizado que prueba TODOS los endpoints HTTP del sistema de forma secuencial. Crea datos de test, ejecuta operaciones CRUD completas, verifica respuestas y limpia los datos al finalizar.

**Archivo**: `server/src/scripts/testAll.ts`
**Ejecucion**: `npx tsx server/src/scripts/testAll.ts`
**Requisitos**: Servidor corriendo en `localhost:5050` con `SIMULATOR_MODE=true`

### 21.2 Modulos de Prueba (12 grupos, 97 assertions)

| # | Modulo | Tests | Que prueba |
|---|--------|-------|------------|
| 1 | Health Check | 4 | `GET /api/health` — status ok, servicios database y redis |
| 2 | Autenticacion | 6 | Login valido/invalido, proteccion JWT, acceso con/sin token |
| 3 | Complejos CRUD | 8 | Crear, leer, actualizar, listar complejos |
| 4 | Tarifas Estandar | 5 | Upsert tarifa estacional, verificar no duplicacion |
| 5 | Tarifas Especiales | 7 | CRUD completo de tarifas especiales con sync a inventario |
| 6 | Bloqueos | 6 | Crear/listar/eliminar bloqueos de disponibilidad |
| 7 | Inventario | 6 | Consulta mensual, disponibilidad, actualizacion de entries |
| 8 | Reservas CRUD + Estados | 16 | Crear manual, listar, filtrar por rango, actualizar, transiciones de estado (pre_reserva → confirmada → completada → cancelada) |
| 9 | Huespedes | 6 | Listar, detalle con reservas, actualizar nombre |
| 10 | Agentes | 6 | Listar, crear agente (admin only), verificar en lista |
| 11 | Conversaciones | 12 | Listar, crear via simulador, mensajes, tomar-control, devolver-bot, cerrar |
| 12 | Simulator + Bot Engine | 11 | Envio de mensajes, creacion de huesped/conversacion, clasificacion de intent, retencion de entidades, reset con "hola" |
| 3b | Soft Delete Complejo | 4 | Soft delete y verificacion de activo=false |

### 21.3 Estructura del Script

```
Pre-cleanup → Ejecuta 12 modulos secuencialmente → Post-cleanup → Resumen
```

**Helpers principales:**
- `api(method, path, body?, token?)` — Wrapper de fetch con auth JWT automatico
- `assert(name, condition, details?)` — Assertion con contadores PASS/FAIL y colores
- `cleanupTestData()` — Limpia datos de test (complejo, agente, reserva, huesped simulado)

**Datos de test** (se crean y eliminan automaticamente):
- Complejo: `TEST_COMPLEJO_AUTO`
- Agente: `test_agent@testall.com`
- Reserva: huesped `TEST_HUESPED_AUTO`
- Huesped simulador: waId `5491188880000`

### 21.4 Resultados de la Ultima Ejecucion (2026-03-08)

```
╔════════════════════════════════════════════════════╗
║   RESULTS: 97 passed, 0 failed                    ║
╚════════════════════════════════════════════════════╝
```

Todos los 97 tests pasaron exitosamente, cubriendo:
- Todas las rutas publicas y protegidas
- CRUD completo de cada entidad
- Transiciones de estado de reservas y conversaciones
- Integracion con el bot engine (clasificacion, entidades, reset)
- Autenticacion y autorizacion JWT

### 21.5 Suite de Pruebas QA (Logica de Negocio)

**Archivo**: `server/src/scripts/testQA.ts`
**Ejecucion**: `npx tsx server/src/scripts/testQA.ts`
**Assertions**: 97

| # | Modulo | Tests | Que prueba |
|---|--------|-------|------------|
| QA-01 | Data Integrity | 35 | Capacidades > 0, tarifas 3 temporadas, precios > 0, estadiaMinima solo donde corresponde |
| QA-02 | Inventory Integrity | 12 | Inventario mensual existe, precios > 0 para todas las habitaciones |
| QA-03 | Context Generation | 9 | Contexto para Claude correcto: menciona todos los deptos, solo Pewmafe con estadia minima, tabla de tarifas con precios |
| QA-04 | Bot Minimum Stay | 5 | Bot NO inventa estadia minima para deptos sin configuracion |
| QA-05 | Bot Capacity | 2 | Bot NO ofrece departamento individual si excede capacidad |
| QA-06 | Entity Retention | 6 | Acumulacion de entidades, reset con "hola" |
| QA-07 | Reservation Rules | 5 | Estado inicial pre_reserva, transiciones correctas, cancelacion |
| QA-08 | Auth & Authorization | 2 | Non-admin no puede crear agentes (403), token invalido (401) |
| QA-09 | Conversation State Machine | 7 | bot → humano_activo → bot → cerrado, mensajes de sistema |
| QA-10 | Bloqueo + Availability | 3 | Crear bloqueo marca inventario como no disponible, eliminar bloqueo restaura |
| QA-11 | Tarifa Especial Sync | 3 | Precio especial sincroniza a inventario, eliminar restaura precio estacional |
| QA-12 | Bot No Inventa | 2 | Menciona actividades reales de la zona, no inventa departamentos |
| QA-13 | Validation Errors | 4 | Zod rechaza datos incompletos (400) en complejos, reservas, login, estados |
| QA-14 | Bot Escalation | 2 | Queja escala a espera_humano con mensaje de sistema |

### 21.6 Bugs Encontrados y Corregidos (2026-03-08)

#### BUG-1: Bot inventaba estadia minima para departamentos sin configuracion (CRITICO)
- **Sintoma**: Bot informaba "Luminar Mono: minimo 4 noches, LG: minimo 5 noches" cuando solo Pewmafe tiene estadia minima
- **Causa raiz**: Datos incorrectos en DB — Luminar Mono tenia `estadiaMinima=4`, Luminar 2Amb `=4`, LG `=5` a nivel complejo
- **Propagacion**: `accommodationContext.ts` linea 113 usa `t.estadiaMinima ?? c.estadiaMinima` como fallback, propagando el valor del complejo a todas las temporadas
- **Fix**: Limpieza de datos — `estadiaMinima` de esos 3 complejos se puso en `null`
- **Archivos**: `server/src/scripts/fixEstadiaMinima.ts` (script de correccion)
- **Verificacion**: QA-01 valida que solo Pewmafe tiene estadiaMinima, QA-03 valida contexto, QA-04 valida respuesta del bot

#### BUG-2: Bloqueos de disponibilidad no funcionaban (CRITICO)
- **Sintoma**: `blockDates`, `releaseDates` y `releaseDatesIfNotReserved` no bloqueaban/liberaban fechas en inventario — `updateMany matched: 0 rows`
- **Causa raiz**: Bug de timezone. `seedInventory.ts` crea fechas en local midnight (`setHours(0,0,0,0)`) que en UTC-3 se almacenan como `T03:00:00Z`. Pero las funciones de bloqueo usaban `new Date('2026-10-01')` que crea UTC midnight `T00:00:00Z`. La query `{ in: dates }` nunca coincidia porque `T00:00:00Z ≠ T03:00:00Z`
- **Impacto**: TODOS los bloqueos creados desde el panel de admin eran silenciosamente inefectivos — las fechas aparecian como bloqueadas en la UI pero el inventario nunca se marcaba como no disponible
- **Fix**: Funcion helper `toLocalMidnight(d)` que extrae componentes UTC y construye fecha local: `new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())`
- **Archivos modificados**:
  - `server/src/services/inventarioService.ts` — `blockDates`, `releaseDates`, `releaseDatesIfNotReserved`
  - `server/src/services/inventarioSyncService.ts` — `dateRange` helper (misma correccion)
- **Verificacion**: QA-10 valida bloqueo + disponibilidad, QA-11 valida sync de tarifa especial

#### BUG-3: Frontend caido con backend activo — No detectado (OPERACIONAL)
- **Sintoma**: Despues de matar todos los procesos node (`taskkill /F /IM node.exe`) y reiniciar solo el backend, el frontend Vite (puerto 5173) quedaba caido sin que nadie lo detectara. El usuario navegaba a `http://localhost:5173/` y la app no respondia.
- **Causa raiz**: Al reiniciar manualmente solo el servidor Express (puerto 5050), el frontend Vite no se reiniciaba. Los test suites (`testAll.ts`, `testQA.ts`) solo verificaban el backend, no el frontend.
- **Impacto**: Sesiones de QA perdidas y confusion al pensar que la app estaba operativa cuando solo el API respondia.
- **Fix**:
  1. Nuevo script `npm run dev:test` en root `package.json` que levanta ambos servicios (Vite + Express con SIMULATOR_MODE)
  2. Preflight check en `testAll.ts` y `testQA.ts` que verifica que AMBOS servicios (backend:5050 + frontend:5173) estan corriendo antes de ejecutar tests. Si alguno falta, aborta con mensaje claro indicando `npm run dev:test`.
- **Archivos modificados**:
  - `package.json` — nuevo script `dev:test`
  - `server/src/scripts/testAll.ts` — funcion `preflight()` al inicio de `main()`
  - `server/src/scripts/testQA.ts` — funcion `preflight()` al inicio de `main()`
- **Verificacion**: Matar frontend → ejecutar tests → debe fallar con "FATAL: Frontend no disponible en puerto 5173"

#### BUG-4: Bot sigue inventando estadia minima para departamentos sin restriccion (CRITICO — REINCIDENTE)
- **Sintoma**: El bot respondia "Todos nuestros departamentos requieren una estadía mínima (entre 2 y 5 noches según el tipo)" cuando el usuario consultaba por 1 noche. Solo Pewmafe tiene estadia minima configurada; Luminar Mono, Luminar 2Amb y LG NO tienen — aceptan desde 1 noche.
- **Causa raiz (3 fallas simultaneas)**:
  1. **`accommodationContext.ts`**: Departamentos sin estadia minima simplemente NO mostraban nada en el contexto. Claude veia la estadia minima de Pewmafe y **generalizaba** a todos.
  2. **`botEngine.ts`**: La validacion de estadia minima solo chequeaba UN departamento (`targetHab = habitacion || results[0].habitacion`). Si el usuario no elegia depto, solo el primero recibia el mensaje "SIN RESTRICCION". Los demas quedaban sin informacion explicita → Claude inventaba.
  3. **`claudeService.ts`**: La regla #4 decia "NUNCA inventes restricciones de estadia minima" pero no era suficientemente explicita para prevenir generalizacion.
- **Fix (3 rondas de correccion)**:
  1. `accommodationContext.ts`: Agregar linea explicita `- Estadia minima: SIN RESTRICCION (desde 1 noche)` para deptos sin minimo configurado, evitando que Claude generalice.
  2. `botEngine.ts`: Loop por TODOS los departamentos. Solo emitir `ADVERTENCIA ESTADIA MINIMA` cuando noches < minimo. No mencionar nada cuando se cumple o no hay restriccion.
  3. `claudeService.ts`: Regla #4 reforzada: "NUNCA menciones estadia minima proactivamente. Solo informala cuando el Contexto adicional contenga ADVERTENCIA ESTADIA MINIMA."
- **Reglas de negocio adicionales implementadas**:
  - **Estadia minima**: Solo informar al huesped cuando pide MENOS noches que el minimo configurado. Si cumple o no hay minimo, NO mencionarla.
  - **Tarjeta de credito/MercadoPago**: NO mencionar proactivamente. Solo informar si el huesped pregunta explicitamente por esa opcion. El medio de pago por defecto es transferencia bancaria.
- **Archivos modificados**:
  - `server/src/data/accommodationContext.ts` — else clause en buildDetalle()
  - `server/src/services/botEngine.ts` — loop ALL results, solo ADVERTENCIA en violaciones
  - `server/src/services/claudeService.ts` — regla #4 y flujo de reserva (PASO 2) actualizados
- **Test**: `server/src/scripts/testSimulaciones.ts` — 11 conversaciones simuladas
- **Verificacion**: CONV-02 (2 pers / 1 noche) y CONV-03 (10 pers / 1 noche) NO mencionan estadia minima. CONV-11 valida que no se mencione tarjeta proactivamente.

### 21.7 Test de simulacion — 11 conversaciones (2026-03-07)

Script: `npx tsx server/src/scripts/testSimulaciones.ts`

| Conv | Nombre         | Escenario                                | Validacion principal                                      |
|------|----------------|------------------------------------------|-----------------------------------------------------------|
| 01   | Maria Lopez    | Saludo simple                            | Bienvenida, sin inventar datos                            |
| 02   | Carlos Diaz    | 1 noche / 2 personas                    | NO inventar estadia minima para Luminar/LG                |
| 03   | Pedro Martinez | 10 personas / 1 noche (bug reportado)   | NO generalizar estadia minima, sugerir combinar deptos    |
| 04   | Ana Garcia     | Precio LG                                | Mostrar precio real con $, sin inventar minimo            |
| 05   | Laura Fernandez| Actividades zona                         | Mencionar actividades reales (buceo, kayak, etc)          |
| 06   | Roberto Sosa   | Pewmafe 1 noche                          | Mencionar minimo real O no disponible                     |
| 07   | Sofia Ruiz     | Amenities LG                             | Describir amenities, sin inventar minimo                  |
| 08   | Diego Morales  | Reserva paso a paso                      | Acumulacion de entidades, no re-preguntar datos conocidos |
| 09   | Marta Gimenez  | Queja / escalacion                       | Disculparse, escalar a espera_humano                      |
| 10   | Juan Perez     | Despedida                                | Despedida amable, cerrar conversacion                     |
| 11   | Lucia Torres   | Reserva sin tarjeta                      | NO mencionar MercadoPago/tarjeta proactivamente           |

### 21.8 Resultados Finales (2026-03-08)

```
testAll.ts:   97 passed, 0 failed (endpoints HTTP)
testQA.ts:    97 passed, 0 failed (logica de negocio)
Total:       194 tests, 0 failures
```

---

## 22. Mejoras de Robustez y Operacion (2026-03-07)

Implementacion de mejoras seleccionadas del documento "Posibles mejoras y correcciones".

### 22.1 Auto-cierre de conversaciones por inactividad (48h)

**Archivo**: `server/src/services/conversacionCleanup.ts`

Nuevo servicio que cierra automaticamente conversaciones en estado `bot` o `espera_humano` que no tengan actividad durante 48 horas.

- Se ejecuta al iniciar el servidor y luego cada 60 minutos
- Agrega un mensaje de sistema "Conversacion cerrada automaticamente por inactividad (48h)"
- Actualiza el estado a `cerrado` y emite evento via socket para actualizar el panel en tiempo real
- Registrado en `server/src/index.ts` (startup y graceful shutdown)

### 22.2 Rate limit por numero de WhatsApp

**Archivo**: `server/src/middleware/rateLimitWhatsApp.ts`

Proteccion contra abuso y control de costos de IA mediante limitacion por numero de WhatsApp.

- Maximo 10 mensajes por minuto por numero de WhatsApp
- Usa Redis con ventana deslizante (clave `ratelimit:wa:{waId}`, TTL 60s)
- Si Redis no esta disponible, permite todos los mensajes (fail-open)
- Integrado en `webhookProcessor.ts` antes del procesamiento del mensaje

### 22.3 Health check extendido y panel de estado

**Archivos**: `server/src/routes/health.ts`, `src/components/layout/Header.tsx`

Endpoint `GET /api/health` ampliado para verificar:

| Servicio | Verificacion |
|----------|-------------|
| Database | `SELECT 1` con medicion de latencia (ms) |
| Redis    | `PING` con medicion de latencia (ms) |
| Claude   | Verificacion de API key configurada |
| WhatsApp | Verificacion de token/phone ID (o modo simulador) |
| Sheets   | Verificacion de credenciales configuradas |

Estado general: `ok` si todos los servicios estan OK o no configurados, `degraded` si alguno falla.

En el frontend, se agrego un indicador compacto en el header:
- Punto verde/amarillo/gris segun estado general
- Click para expandir detalle de cada servicio con latencia
- Auto-refresh cada 30 segundos

### 22.4 Validacion de fechas invertidas

**Archivo**: `server/src/services/botEngine.ts`

Validacion automatica cuando `fecha_entrada > fecha_salida`:
- Detecta la inversion y las swapea automaticamente
- Loguea warning para debugging
- Agrega contexto adicional para que Claude confirme las fechas con el huesped: "Las fechas estaban invertidas. Se corrigieron automaticamente: entrada X, salida Y. Confirma amablemente con el huesped que esas son las fechas correctas."
- Previene queries de disponibilidad fallidas

### 22.5 Mejora de loading state en ChatWindow

**Archivo**: `src/components/chat/ChatWindow.tsx`

Spinner animado con texto "Cargando mensajes..." en lugar del texto plano anterior. Mas visible y claro para el usuario.

### 22.6 Log de tipo de mensaje en webhook

**Archivo**: `server/src/services/webhookProcessor.ts`

Log a nivel `warn` cuando se recibe un tipo de mensaje no soportado (imagen, documento, sticker, etc.). Facilita debugging de mensajes que el bot no puede procesar.

### 22.7 Correccion de documentacion ER

**Archivo**: `DOCUMENTACION.md`

Corregido `cantUnid` a `cantidadUn` en el diagrama ER para consistencia con el nombre real del campo en Prisma (`cantidadUnidades`).

### 22.8 Bug: Bot lista tarifas por temporada sin tener fechas (CONV-04 Ana Garcia)

**Problema detectado**: Al preguntar "cuanto sale por noche el departamento LG?" sin dar fechas, el bot respondia con la tabla completa de tarifas por temporada (baja/media/alta). Esto no es correcto: el bot debe primero preguntar las fechas exactas y cantidad de personas, y luego informar SOLO el precio correspondiente a esa temporada.

**Causa raiz**: La instruccion de `consulta_precio` en `claudeService.ts` decia "Informar precios usando la tabla de tarifas" sin restriccion. Ademas, no habia contexto adicional en `botEngine.ts` que indicara explicitamente no listar precios sin fechas.

**Archivos modificados**:

1. `server/src/services/claudeService.ts`:
   - Instruccion `consulta_precio` cambiada: "Si faltan las fechas, NO listes precios por temporada. Primero pregunta fechas y personas, asi podes dar el precio exacto."
   - Fallback de `consulta_precio` actualizado para pedir fechas en vez de listar rangos de precios

2. `server/src/services/botEngine.ts`:
   - Agregado contexto adicional explicito cuando `intent=consulta_precio` y faltan fechas: "IMPORTANTE: NO listes precios por temporada. Primero pregunta las fechas."

3. `server/src/scripts/testSimulaciones.ts`:
   - Test CONV-04 actualizado: valida que el bot NO liste temporada baja/media/alta y que pregunte por fechas

### 22.9 Bug: Bot inventa fecha incorrecta para "mañana" (CONV-03 Pedro Martinez)

**Problema detectado**: Pedro Martinez dice "somos 10 personas, es para la noche de mañana solamente". El bot responde mencionando "9 de enero" cuando la fecha real de "mañana" deberia ser el dia siguiente a la ejecucion del test. El bot inventa una fecha que el huesped nunca menciono.

**Causa raiz**: El prompt del clasificador (`classifyIntent` en `claudeService.ts`) decia "El ano actual es 2026" pero NO incluia la fecha de hoy. Sin saber que dia es hoy, Claude Haiku no puede calcular "mañana" correctamente y hallucina una fecha arbitraria.

**Fix aplicado**:

1. `server/src/services/claudeService.ts` — clasificador:
   - Cambiado: `"El ano actual es 2026"` → `"La fecha de hoy es ${new Date().toISOString().slice(0,10)}. Usa esta fecha para resolver referencias relativas como mañana, pasado mañana, este fin de semana, la semana que viene."`
   - Ahora el clasificador siempre recibe la fecha exacta de hoy, permitiendo resolver "mañana" = hoy + 1 dia

2. `server/src/scripts/testSimulaciones.ts` — CONV-03:
   - Agregada asercion: `NO inventa fecha de enero` — verifica que el bot no mencione "enero" cuando el huesped solo dijo "mañana"

**Prueba**: Marcada como fallida previamente. Con el fix, el clasificador ahora resuelve "mañana" correctamente usando la fecha del dia.

**Safety net adicional**: `resolveRelativeDate()` en `botEngine.ts` actua como segunda linea de defensa. Si Claude Haiku devuelve "mañana", "hoy" o "pasado mañana" como texto en vez de YYYY-MM-DD, esta funcion lo convierte server-side. Strings no reconocidos como fechas ni como referencias relativas se ELIMINAN para evitar datos basura en las entidades.

### 22.10 Stress Test: 12 escenarios de deteccion de bugs

**Archivo**: `server/src/scripts/testStress.ts`

Nuevo script con 12 escenarios diseñados para encontrar bugs especificos del bot. Usa telefonos en rango `54911000300XX` (separados de testSimulaciones).

| # | Test | Vector de ataque | Que valida |
|---|------|------------------|-----------|
| ST-01 | Capacidad excedida | 4 personas → NO ofrecer Luminar Mono (cap 3) | Regla de capacidad por unidad |
| ST-02 | Depto inexistente | "Premium Suite" | NO inventar departamentos |
| ST-03 | Noches vs personas | "3 noches" != "3 personas" | Clasificador no confunde entidades |
| ST-04 | Mascotas | "puedo llevar mi perro?" | Responde NO (prohibido en todos) |
| ST-05 | Fechas invertidas | "del 20 al 15 de mayo" | Swap automatico o pedido de correccion |
| ST-06 | Precio con fechas | Abril = baja → solo UNA temporada | NO lista baja/media/alta |
| ST-07 | URLs en texto | "ver fotos del Pewmafe" | NO incluir http/https/YouTube |
| ST-08 | Confirmar reserva | Datos completos de reserva | Solo "pre-reserva", NUNCA "confirmada" |
| ST-09 | Unidades limite | 6 personas | NO ofrecer 2 Luminar Mono (solo 1 existe) |
| ST-10 | MercadoPago | Reserva directa | NO mencionar tarjeta/MercadoPago proactivamente |
| ST-11 | Cambio personas | "somos 2" → "en realidad somos 4" | Actualiza entidad, NO ofrece Mono |
| ST-12 | Estadia minima | Pewmafe 1 noche temp alta (min 3) | DEBE advertir, NO generalizar |

**Deteccion de API**: El script verifica si Claude API esta disponible. Tests que requieren IA (extraccion de entidades, respuestas contextuales) se marcan `SKIP` en vez de `FAIL` cuando la API no tiene credito.

**Bugs encontrados y corregidos**:

1. **Fallback de `reservar` mencionaba MercadoPago/tarjeta** — Violaba la regla de negocio de no mencionar tarjeta proactivamente. Corregido en `claudeService.ts`: el fallback ahora dice "pre-reserva" y solo pide datos basicos sin mencionar medios de pago.

2. **Fallback del clasificador regex priorizaba `saludo` sobre intents especificos** — "Hola, cuanto cuesta LG?" se clasificaba como `saludo` porque `/hola/` era el primer regex. Corregido: intents especificos (precio, disponibilidad, reservar, mascotas, etc.) ahora se evaluan ANTES que saludo.

3. **Fallback de `consulta_precio` listaba rangos de precios** — Daba precios de referencia sin preguntar fechas. Ya corregido anteriormente (seccion 22.8).

**Resultados** (sin credito API):
```
34 passed, 0 failed, 9 skipped (requieren Claude API)
```

### 22.11 Mejoras descartadas (con justificacion)

| Mejora propuesta | Razon de descarte |
|-----------------|-------------------|
| Conversational Analytics (panel) | Feature grande que requiere planificacion propia. No es una correccion. |
| Context Manager separado en botEngine | Refactoring de arquitectura. botEngine funciona correctamente. Riesgo sin valor inmediato. |
| Simulador con replay/regresiones | Ya cubierto por testSimulaciones, testQA y testBotMemory (194+ tests existentes). |

---

## 23. Integracion con Booking.com (iCal Bidireccional) (2026-03-10)

> **NOTA**: Esta seccion documenta la implementacion original con un solo campo `icalUrl` por complejo. Esta arquitectura fue reemplazada por el modelo `IcalFeed` multi-plataforma (ver **Seccion 28**), que soporta multiples feeds por complejo (Booking, Airbnb, VRBO, etc.). La logica core de export/import se mantiene igual.

Sincronizacion de disponibilidad con Booking.com mediante el protocolo iCal (RFC 5545). Permite que las reservas de Booking bloqueen automaticamente el inventario local y viceversa.

### 23.1 Archivos creados

| Archivo | Descripcion |
|---------|-------------|
| `server/src/services/icalService.ts` | Logica core: generacion de VCALENDAR (export) y sincronizacion desde feed iCal de Booking (import) |
| `server/src/routes/ical.ts` | Endpoint publico `GET /api/ical/:complejoId.ics` (sin auth, Content-Type: text/calendar) |
| `server/src/services/icalSyncJob.ts` | Cron job cada 30 min para sincronizar complejos con icalUrl configurada |

### 23.2 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `server/prisma/schema.prisma` | Agregado `icalUrl String? @map("ical_url")` al modelo Complejo |
| `shared/types/complejo.ts` | Agregado `icalUrl: string \| null` a Complejo y `icalUrl?: string` a CrearComplejoRequest |
| `server/src/routes/complejos.ts` | Agregado `icalUrl: z.string().url().optional()` al schema Zod de validacion |
| `server/src/services/complejoService.ts` | Agregado `icalUrl` a los tipos de createComplejo y updateComplejo + pasarlo al Prisma create |
| `server/src/app.ts` | Montado `icalRouter` como ruta publica (antes del protectedRouter) |
| `server/src/index.ts` | Agregado `startIcalSyncJob()` en startup y `stopIcalSyncJob()` en shutdown |
| `src/components/complejos/ComplejoEditModal.tsx` | Agregado campo "Sincronizar Reservas - URL iCal Booking" en tab Datos |

### 23.3 Export — Booking lee nuestro calendario

```
Booking.com ──(cada ~4h)──> GET /api/ical/:complejoId.ics
                              └─ VCALENDAR con VEVENTs:
                                   - Reservas activas (pre_reserva, confirmada) → SUMMARY: "Reservado"
                                   - Bloqueos de mantenimiento → SUMMARY: "Bloqueado - motivo"
                                   - Formato: VALUE=DATE (eventos all-day)
                                   - UIDs: reserva-<id>@chatboot.app / bloqueo-<id>@chatboot.app
                                   - Sin datos del huesped (privacidad)
```

**Headers de respuesta:**
- `Content-Type: text/calendar; charset=utf-8`
- `Cache-Control: no-cache, no-store, must-revalidate`

### 23.4 Import — Leemos el calendario de Booking

```
Booking.com ──(genera iCal)──> URL en extranet de Booking
      │
      └─── icalSyncJob (cada 30 min)
                └─ syncFromBookingIcal()
                     ├─ Fetch URL iCal del complejo (node-ical)
                     ├─ Filtra VEVENTs con fecha fin > 7 dias atras
                     ├─ VEVENT nuevo → crear reserva (origenReserva='booking', estado='confirmada')
                     ├─ VEVENT con fechas cambiadas → actualizar fechas de la reserva
                     ├─ VEVENT eliminado del feed → cancelar reserva (huesped cancelo en Booking)
                     └─ recalcDisponible() para todas las fechas afectadas
```

**Identificacion de reservas de Booking:**
- `origenReserva = 'booking'`
- `notas = 'ical-uid:<uid_del_evento>'` (permite matchear en syncs posteriores)
- `nombreHuesped = 'Reserva Booking'` (Booking no expone datos del huesped via iCal)

### 23.5 Configuracion

1. En **Booking.com Extranet** → Tarifas y disponibilidad → Sincronizacion de calendarios
2. Copiar la URL de "Exportar calendario" (formato: `https://admin.booking.com/hotel/hoteladmin/ical.html?t=...`)
3. En el **panel admin** → Departamentos → Editar complejo → tab Datos → campo "Sincronizar Reservas - URL iCal Booking" → pegar URL → Guardar
4. Para el export inverso: dar a Booking la URL `https://TU-DOMINIO/api/ical/<complejoId>.ics` en "Importar calendario"

### 23.6 Notas tecnicas

- **Ruta publica**: El endpoint iCal no requiere autenticacion (Booking no envia auth). El complejoId es un CUID opaco que actua como seguridad por oscuridad.
- **node-ical**: Dependencia para parsear formato iCal. Se importa via dynamic import (ESM).
- **Timezone**: Fechas de iCal se convierten con `toLocalMidnight()` para evitar el bug conocido de UTC vs local midnight.
- **Cron startup**: Primera ejecucion 10 segundos despues del startup (para no bloquear el inicio del servidor).

---

## 24. Reservas desde Conversacion — Campos Poblados (2026-03-10)

Cuando el bot crea una reserva automaticamente desde una conversacion de WhatsApp, ahora se guardan `nombreHuesped` y `telefonoHuesped` directamente en el registro de reserva (antes quedaban null y dependian de la relacion con el huesped).

### 24.1 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `server/src/services/reservaService.ts` | Agregados `nombreHuesped` y `telefonoHuesped` opcionales a `CreateReservaParams`, pasados al Prisma create |
| `server/src/services/botEngine.ts` | Al crear reserva, se consulta el huesped y se pasan `nombre` y `telefono` (o `waId` como fallback) |

### 24.2 Campos que se llenan desde conversacion

| Campo | Origen |
|-------|--------|
| `nombreHuesped` | `huesped.nombre` de la DB |
| `telefonoHuesped` | `huesped.telefono` o `huesped.waId` (fallback) |
| `habitacion` | Entidad extraida por el clasificador |
| `fechaEntrada` / `fechaSalida` | Entidades extraidas por el clasificador |
| `numHuespedes` | Entidad extraida por el clasificador |
| `precioTotal` | Calculado por `checkAvailability()` |
| `tarifaNoche` | Promedio de `precioPorNoche[]` del resultado de disponibilidad |
| `montoReserva` | `precioTotal * porcentajeReserva / 100` |
| `saldo` | `precioTotal - montoReserva` |
| `origenReserva` | Siempre `'WhatsApp'` |
| `estado` | Siempre `'pre_reserva'` |

### 24.3 Campos que quedan vacios (no colectados en conversacion)

| Campo | Motivo |
|-------|--------|
| `nroFactura` | Se completa manualmente por el agente |
| `importeUsd` | Se completa manualmente por el agente |
| `notas` | Se completa manualmente por el agente |

---

## 25. Configuracion del Agente IA — BotConfig (2026-03-10)

La identidad del bot (nombre, tono, idioma), su comportamiento (auto pre-reserva, fotos, escalacion) y sus mensajes estandar (bienvenida, despedida, espera humano) ahora son configurables desde el panel admin sin necesidad de deploy.

### 25.1 Modelo de datos

Tabla `bot_config` (singleton, auto-create con defaults si no existe):

```prisma
model BotConfig {
  id                  String   @id @default(cuid())
  nombreAgente        String   @default("Las Grutas Departamentos")
  ubicacion           String   @default("Las Grutas, Rio Negro, Patagonia Argentina")
  tono                String   @default("amable, profesional y cercano")
  idioma              String   @default("es_AR")
  usarEmojis          Boolean  @default(false)
  longitudRespuesta   String   @default("corta")
  autoPreReserva      Boolean  @default(true)
  modoEnvioFotos      String   @default("auto")
  escalarSiQueja      Boolean  @default(true)
  escalarSiPago       Boolean  @default(true)
  mensajeBienvenida   String   // default: mensaje de bienvenida actual
  mensajeDespedida    String   // default: mensaje de despedida actual
  mensajeFueraHorario String   // default: mensaje fuera de horario
  mensajeEsperaHumano String   // default: mensaje espera humano actual
  horarioInicio       String?  // HH:mm (uso futuro)
  horarioFin          String?  // HH:mm (uso futuro)
  telefonoContacto    String   @default("+54 2920 561033")
  titularesVerificados String[] @default([])  // Nombres de titulares bancarios autorizados (comparacion case-insensitive)
  creadoEn            DateTime @default(now())
  actualizadoEn       DateTime @updatedAt
}
```

### 25.2 Archivos nuevos

| Archivo | Responsabilidad |
|---------|----------------|
| `server/src/services/botConfigService.ts` | `getBotConfig()` con cache 5 min, `updateBotConfig()`, `invalidateBotConfigCache()` |
| `server/src/routes/botConfig.ts` | `GET /api/bot/config`, `PATCH /api/bot/config` con Zod validation |
| `src/api/botConfigApi.ts` | Cliente API frontend |
| `src/components/bot/BotConfigPage.tsx` | Pagina admin con 5 secciones (Logo, Identidad, Comportamiento con titulares verificados, Mensajes, Horario) |

### 25.3 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `server/prisma/schema.prisma` | Agregado modelo `BotConfig` |
| `server/src/app.ts` | Montado `botConfigRouter` en rutas protegidas |
| `server/src/services/claudeService.ts` | Prompt dinamico usa `botConfig` (nombre, ubicacion, tono, idioma, emojis, longitud). Fallbacks usan mensajes configurables |
| `server/src/services/botEngine.ts` | Usa `botConfig` para fotos, escalacion, telefono, auto pre-reserva |
| `src/App.tsx` | Agregada vista `'bot'` con `BotConfigPage` |
| `src/components/layout/Header.tsx` | Agregado boton "Bot" en navegacion |

### 25.4 Campos editables desde panel admin

**Seccion 1 — Identidad del agente:**

| Campo | Default | Efecto |
|-------|---------|--------|
| `nombreAgente` | Las Grutas Departamentos | Primera linea del prompt: "Eres el asistente virtual de {nombre}" |
| `ubicacion` | Las Grutas, Rio Negro, Patagonia Argentina | "alojamiento turistico en {ubicacion}" |
| `tono` | amable, profesional y cercano | "Tu tono es {tono}" |
| `idioma` | es_AR | es_AR → "espanol de Argentina (voseo)", es → "espanol neutro", en → "English" |
| `usarEmojis` | false | false → "No uses markdown ni emojis excesivos", true → "Podes usar emojis moderadamente" |
| `longitudRespuesta` | corta | corta → "max 3-4 frases", media → "max 5-7 frases", detallada → "max 8-10 frases" |

**Seccion 2 — Comportamiento:**

| Campo | Default | Efecto |
|-------|---------|--------|
| `autoPreReserva` | true | Si false, el bot NO crea pre-reservas automaticamente en PASO 1 |
| `modoEnvioFotos` | auto | auto/on_request → envia fotos cuando el huesped pide, off → nunca envia fotos |
| `escalarSiQueja` | true | Si false, quejas NO escalan a `espera_humano` (bot responde normalmente) |
| `escalarSiPago` | true | Si false, problemas bancarios NO escalan a `espera_humano` |
| `telefonoContacto` | +54 2920 561033 | Usado en mensaje de capacidad excedida |
| `titularesVerificados` | [] | Lista de nombres de titulares bancarios autorizados. El bot solo muestra datos de pago si el titular del complejo esta en esta lista (comparacion case-insensitive). Se gestiona con UI de agregar/eliminar chips |

**Seccion 3 — Mensajes personalizados:**

| Campo | Uso |
|-------|-----|
| `mensajeBienvenida` | Respuesta fallback para intent `saludo` (sin API key o error de Claude) |
| `mensajeDespedida` | Respuesta fallback para intent `despedida` |
| `mensajeFueraHorario` | Almacenado para uso futuro (horario no implementado aun) |
| `mensajeEsperaHumano` | Respuesta fallback para intent `hablar_humano` |

**Seccion 4 — Horario de atencion:**

| Campo | Estado |
|-------|--------|
| `horarioInicio` / `horarioFin` | Almacenados para uso futuro. El bot responde 24h actualmente |

### 25.5 API

| Metodo | Ruta | Autenticacion | Descripcion |
|--------|------|---------------|-------------|
| GET | `/api/bot/config` | Si (JWT) | Obtener configuracion actual (auto-create con defaults si no existe) |
| PATCH | `/api/bot/config` | Si (JWT) | Actualizar campos (todos opcionales, Zod validation) |

**Zod validation del PATCH:**
- `nombreAgente`, `ubicacion`, `tono`: string, min 1, max 200-300
- `idioma`: enum `es_AR | es | en`
- `longitudRespuesta`: enum `corta | media | detallada`
- `modoEnvioFotos`: enum `auto | on_request | off`
- `mensajes`: string, min 1, max 1000
- `horarioInicio/Fin`: regex `^\d{2}:\d{2}$`, nullable
- Booleans: `usarEmojis`, `autoPreReserva`, `escalarSiQueja`, `escalarSiPago`

### 25.6 Cache

`botConfigService.ts` implementa cache en memoria con TTL de 5 minutos (mismo patron que `accommodationContext.ts`):
- `getBotConfig()`: Lee de cache si < 5 min, sino consulta DB. Si no existe registro, lo crea con defaults
- `updateBotConfig()`: Actualiza DB e invalida cache inmediatamente
- `invalidateBotConfigCache()`: Disponible para tests

### 25.7 Que NO cambia con BotConfig

Las 10 reglas de negocio del prompt (R1-R10 en seccion 7.2) son fijas y NO se pueden editar desde el panel. Esto incluye:
- Reglas de fotos, precios, capacidad, estadia minima
- Reglas conversacionales (persistencia de contexto, preguntas progresivas)
- Flujo de reserva (PASO 1-4)
- Terminologia ("reserva" vs "pre-reserva")
- Seguridad de datos bancarios (whitelist de titulares)

## 26. Fix Health Check — Claude Status (2026-03-10)

### 26.1 Problema

El indicador de estado del sistema mostraba "Estado: Degradado" con Claude en rojo, a pesar de que la API key era valida y la API de Anthropic estaba operativa.

### 26.2 Causa Raiz

En `server/src/routes/health.ts`, el health check usaba `client.messages.count_tokens()` (snake_case) pero el SDK de Anthropic (`@anthropic-ai/sdk`) expone el metodo como `client.messages.countTokens()` (camelCase). Al invocar `undefined()` se lanzaba un `TypeError`, el `catch` silencioso lo atrapaba y seteaba `status: 'error'`.

### 26.3 Fix

```typescript
// Antes (incorrecto)
await client.messages.count_tokens({ ... });

// Despues (correcto)
await client.messages.countTokens({ ... });
```

**Archivo**: `server/src/routes/health.ts` linea 44

## 27. Busqueda y Filtros en el Modulo Chat (2026-03-10)

### 27.1 Concepto

Se agrego busqueda por texto y filtro por rango de fechas en dos niveles:

1. **Nivel lista de conversaciones** (panel izquierdo): filtra CUALES conversaciones se muestran, buscando en los mensajes de todas las conversaciones
2. **Nivel conversacion individual** (panel central): filtra CUALES mensajes se muestran dentro de una conversacion seleccionada

### 27.2 Busqueda Global (Lista de Conversaciones)

Ubicado en el panel izquierdo, debajo de los filtros de estado (Todas / En espera / Mis chats / Bot / Cerradas).

**Funcionalidad:**
- Input de texto con debounce 400ms (minimo 2 caracteres)
- Rango de fechas (desde / hasta) con inputs `<input type="date">`
- Se combina con el filtro de estado existente (ejemplo: "En espera" + buscar "reserva")
- Contador de resultados: "N conversaciones encontradas"
- Boton X para cerrar y limpiar filtros
- Auto-refresh (30s) se desactiva durante busqueda activa

**Archivos modificados:**

| Archivo | Cambio |
|---------|--------|
| `server/src/services/conversacionService.ts` | `listConversaciones()` acepta `{ estado, search, dateFrom, dateTo }`. Usa Prisma `mensajes: { some: { AND: [...] } }` para filtrar conversaciones por contenido de mensajes |
| `server/src/routes/conversaciones.ts` | Schema Zod `conversacionesQuerySchema` con validacion de `search` (1-200 chars), `dateFrom`/`dateTo` (YYYY-MM-DD regex) |
| `src/api/conversacionApi.ts` | `getConversaciones()` acepta `SearchConversacionesParams` y construye query string |
| `src/hooks/useConversaciones.ts` | Acepta params completos, query key incluye search params, desactiva refetchInterval durante busqueda |
| `src/components/chat/ChatList.tsx` | Panel de busqueda colapsable integrado entre filtros de estado y lista |

### 27.3 Busqueda dentro de Conversacion

Ubicado en el panel central, entre el ChatHeader y el area de mensajes.

**Funcionalidad:**
- Input de texto con debounce 400ms (minimo 2 caracteres)
- Rango de fechas (desde / hasta)
- Texto coincidente se resalta en amarillo con `<mark class="bg-yellow-200">`
- Carga hasta 200 mensajes cuando hay filtros activos (vs 50 normal)
- Socket.IO real-time se desactiva durante busqueda (evita contaminar resultados)
- Auto-scroll se desactiva durante busqueda
- Se resetea al cambiar de conversacion
- Contador: "N mensajes encontrados"

**Archivos modificados:**

| Archivo | Cambio |
|---------|--------|
| `server/src/services/mensajeService.ts` | `getByConversacion()` acepta `{ search, dateFrom, dateTo }`. Usa `contenido: { contains, mode: 'insensitive' }` (ILIKE en PostgreSQL) |
| `server/src/routes/conversaciones.ts` | Schema Zod `mensajesQuerySchema` extendido con `search`, `dateFrom`, `dateTo` |
| `src/api/conversacionApi.ts` | `getMensajes()` acepta `SearchMensajesParams`, setea `limit=200` con filtros activos |
| `src/hooks/useChat.ts` | Acepta `searchParams`, cache independiente por filtro, skip Socket.IO durante busqueda |
| `src/components/chat/ChatSearchBar.tsx` | **Nuevo**. Panel colapsable con input de texto, rango de fechas, contador de resultados |
| `src/components/chat/MessageBubble.tsx` | Prop `highlightText`, funcion `highlightContent()` que split por regex y wrap en `<mark>` |
| `src/components/chat/ChatWindow.tsx` | Orquesta estado de busqueda, pasa `searchParams` a hook y `highlightText` a burbujas |

### 27.4 API

**Lista de conversaciones con filtros:**

| Metodo | Ruta | Params | Descripcion |
|--------|------|--------|-------------|
| GET | `/api/conversaciones` | `?search=texto` | Conversaciones con mensajes que contengan "texto" |
| GET | `/api/conversaciones` | `?dateFrom=2026-03-01&dateTo=2026-03-05` | Conversaciones con mensajes en ese rango |
| GET | `/api/conversaciones` | `?estado=bot&search=reserva` | Combinable con filtro de estado |

**Mensajes de conversacion con filtros:**

| Metodo | Ruta | Params | Descripcion |
|--------|------|--------|-------------|
| GET | `/api/conversaciones/:id/mensajes` | `?search=hola` | Solo mensajes que contengan "hola" |
| GET | `/api/conversaciones/:id/mensajes` | `?dateFrom=2026-03-01&dateTo=2026-03-05` | Solo mensajes en ese rango |
| GET | `/api/conversaciones/:id/mensajes` | `?search=hola&limit=200` | Automatico cuando hay filtros |

### 27.5 Detalles Tecnicos

- **Busqueda de texto**: Prisma `contains` con `mode: 'insensitive'` → genera `ILIKE` en PostgreSQL
- **Filtro `dateTo`**: Se suma 1 dia (`dateTo + 1 day`) para incluir todo el dia completo en zona horaria local
- **Conversaciones**: Usa `mensajes: { some: { AND: [...filters] } }` — relacion Prisma que filtra conversaciones donde AL MENOS un mensaje cumple TODOS los criterios
- **Debounce**: 400ms en ambos buscadores para evitar queries excesivos mientras el usuario escribe
- **Minimo 2 caracteres**: Evita busquedas demasiado amplias que devuelvan todo

---

## 28. Sincronizacion iCal Multi-plataforma (2026-03-17)

### 28.1 Descripcion

Soporte para multiples feeds iCal por complejo. Antes, cada complejo tenia un unico campo `icalUrl` para Booking.com. Ahora se usa un modelo `IcalFeed` que permite agregar feeds de Booking, Airbnb, VRBO u otras plataformas.

### 28.2 Modelo de Datos

**Antes**: `Complejo.icalUrl` (campo nullable en complejos)
**Ahora**: Modelo separado `IcalFeed` con relacion N:1 a Complejo

```
Complejo 1───N IcalFeed
                ├── plataforma: 'booking' | 'airbnb' | 'vrbo' | 'otro'
                ├── url: URL del feed iCal
                ├── etiqueta: nombre opcional
                ├── activo: boolean
                └── ultimoSync: timestamp del ultimo sync exitoso
```

Constraint unico en `[complejoId, url]` para evitar duplicados.

### 28.3 Migracion de Datos

La migracion `20260317020000_ical_feeds_and_gcal_sync` realiza:
1. Crea tabla `ical_feeds`
2. Inserta registros para todos los complejos que tenian `ical_url` no nulo (como plataforma `booking`)
3. Elimina la columna `ical_url` de `complejos`

### 28.4 Sync Job Actualizado

- `icalSyncJob.ts` ahora consulta `IcalFeed` activos en vez de `Complejo.icalUrl`
- Actualiza `ultimoSync` despues de cada sync exitoso
- Cada feed se procesa independientemente — si uno falla, los demas continuan

### 28.5 Reservas Importadas

Cada plataforma genera reservas con `origenReserva` distinto:
- Feed de Booking → `origenReserva: 'booking'`, `nombreHuesped: 'Reserva Booking'`
- Feed de Airbnb → `origenReserva: 'airbnb'`, `nombreHuesped: 'Reserva Airbnb'`
- Feed de VRBO → `origenReserva: 'vrbo'`, `nombreHuesped: 'Reserva Vrbo'`

Las cancelaciones se detectan por plataforma: solo se cancelan reservas con el mismo `origenReserva` cuyo UID desaparecio del feed correspondiente.

### 28.6 UI — Tab "Sync" en ComplejoEditModal

Nueva tab en el modal de edicion de complejo:
- Lista de feeds existentes con badge de plataforma, URL truncada, fecha de ultimo sync y boton eliminar
- Formulario para agregar: select de plataforma + input de URL + boton "Agregar"
- URL de exportacion iCal read-only con boton "Copiar" (`{origin}/api/ical/{id}.ics`)

---

## 29. Sincronizacion Bidireccional con Google Calendar (2026-03-17)

### 29.1 Descripcion

Sincronizacion bidireccional entre el sistema y un calendario de Google compartido. Permite que:
- Las reservas y bloqueos creados en el sistema aparezcan en Google Calendar
- Los eventos creados manualmente en Google Calendar se importen como bloqueos

### 29.2 Configuracion

1. Habilitar Google Calendar API en Google Cloud Console
2. Compartir el calendario con el email del Service Account (`GOOGLE_SERVICE_ACCOUNT_EMAIL`) con permisos de escritura
3. Obtener el Calendar ID: Google Calendar > Settings > "Integrate calendar" > Calendar ID
4. Configurar `GOOGLE_CALENDAR_ID` en `.env` / `.env.production`

Si `GOOGLE_CALENDAR_ID` no esta configurado, toda la funcionalidad de GCal se desactiva silenciosamente.

### 29.3 Push: Sistema → Google Calendar

Se ejecuta como fire-and-forget (no bloquea la operacion principal):

| Accion en el sistema | Efecto en GCal |
|---------------------|----------------|
| Crear reserva (manual, bot o iCal) | Crea evento all-day: `Reserva: {habitacion} - {nombreHuesped}` |
| Actualizar reserva | Actualiza fechas/summary del evento |
| Cancelar reserva | Elimina el evento de GCal |
| Crear bloqueo | Crea evento all-day: `Bloqueado: {complejo} - {motivo}` |
| Eliminar bloqueo | Elimina el evento de GCal |

**Puntos de integracion:**
- `reservaService.ts` — `createReserva()`, `updateReserva()`, `updateReservaEstado()`
- `complejos.ts` routes — POST y DELETE de bloqueos
- `icalService.ts` — reservas importadas por iCal

### 29.4 Pull: Google Calendar → Sistema

Se ejecuta cada 5 minutos via `gcalSyncJob.ts`:

| Accion en GCal | Efecto en el sistema |
|----------------|---------------------|
| Crear evento | Crea `Bloqueo` con `origenGoogle: true` |
| Modificar evento | Actualiza fechas del bloqueo |
| Eliminar evento | Elimina el bloqueo correspondiente |

### 29.5 Proteccion Anti-loop

Para evitar que un evento pushado al GCal se re-importe como bloqueo:
1. Eventos creados por el sistema llevan `extendedProperties.private.chatbootManaged = 'true'`
2. Al importar, se ignoran eventos con esta propiedad
3. Bloqueos importados desde GCal tienen `origenGoogle: true`, lo que previene que se re-pusheen

### 29.6 Matching de Complejo

Al importar eventos de GCal, el sistema intenta determinar a que complejo pertenece:
1. Busca el nombre del complejo o sus aliases en el summary del evento (case-insensitive)
2. Si no encuentra match, usa el primer complejo activo como fallback

### 29.7 Sync Token Incremental

- Primera ejecucion (o despues de restart): full sync de eventos de los ultimos 30 dias
- Ejecuciones posteriores: sync incremental usando `syncToken` de la API de GCal
- Si el `syncToken` expira (error 410), se realiza full sync automaticamente
- El `syncToken` se almacena en memoria (se pierde al restart, lo cual es aceptable)

---

## 30. Recuperacion de Contrasena (2026-03-17)

### 30.1 Flujo

1. Usuario hace click en "Olvide mi contrasena" en la pantalla de login
2. Ingresa su email → `POST /api/auth/forgot-password`
3. El sistema genera un token aleatorio, lo guarda en `Agente.resetToken` con expiracion de 1 hora
4. Envia email con link: `{FRONTEND_URL}/reset-password?token={token}`
5. Usuario hace click en el link → pantalla de nueva contrasena
6. Ingresa nueva contrasena → `POST /api/auth/reset-password`
7. Se valida el token, se actualiza el password hash y se limpian los campos de reset

### 30.2 Seguridad

- Token aleatorio de 32 bytes (hex)
- Expiracion de 1 hora
- Respuesta generica "si el email existe, se envio un correo" (no revela existencia del email)
- Password hasheado con bcrypt (12 rounds)

### 30.3 Configuracion SMTP

**Opcion A — Postfix local (produccion actual):**

En produccion se usa Postfix instalado en el host con OpenDKIM para firma DKIM. No requiere autenticacion:
```
SMTP_HOST=host.docker.internal
SMTP_PORT=25
SMTP_USER=
SMTP_PASS=
```

**Opcion B — Gmail SMTP (alternativa):**

Requiere una cuenta de Gmail con "Contrasena de aplicacion":
1. Habilitar verificacion en 2 pasos en la cuenta de Google
2. Ir a myaccount.google.com > Seguridad > Contrasenas de aplicacion
3. Generar contrasena para "Correo" / "Otro"
4. Configurar `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER` y `SMTP_PASS` en `.env`

---

## 31. Configuracion del Bot (BotConfig) (2026-03-17)

> **NOTA**: Esta seccion complementa la **Seccion 25** (que documenta los archivos creados, la logica del cache y el impacto en el prompt de Claude). Aqui se resumen los campos y endpoints actualizados incluyendo soporte para logo.

### 31.1 Descripcion

Modelo `BotConfig` para personalizar el comportamiento del bot desde el panel de administracion. Incluye soporte para logo.

### 31.2 Campos Configurables

| Campo | Default | Descripcion |
|-------|---------|-------------|
| `nombreAgente` | Las Grutas Departamentos | Nombre del asistente |
| `ubicacion` | Las Grutas, Rio Negro | Ubicacion del alojamiento |
| `tono` | amable, profesional y cercano | Tono de las respuestas |
| `idioma` | es_AR | Idioma de las respuestas |
| `usarEmojis` | false | Usar emojis en respuestas |
| `longitudRespuesta` | corta | Longitud de respuestas (corta/media/larga) |
| `autoPreReserva` | true | Crear pre-reserva automaticamente |
| `modoEnvioFotos` | auto | Modo de envio de fotos |
| `escalarSiQueja` | true | Escalar a humano si hay queja |
| `escalarSiPago` | true | Escalar si el huesped habla de pago |
| `mensajeBienvenida` | ... | Mensaje de bienvenida personalizable |
| `mensajeDespedida` | ... | Mensaje de despedida |
| `mensajeFueraHorario` | ... | Mensaje fuera de horario |
| `mensajeEsperaHumano` | ... | Mensaje al escalar a humano |
| `horarioInicio/Fin` | null | Horario de atencion (opcional) |
| `telefonoContacto` | +54 2920 561033 | Telefono de contacto |
| `logo` | null | URL del logo del bot |

### 31.3 Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `GET` | `/api/bot/config` | Obtener configuracion actual |
| `PATCH` | `/api/bot/config` | Actualizar configuracion parcialmente |
| `POST` | `/api/bot/logo` | Subir logo (base64 en body, max 500KB) |
| `DELETE` | `/api/bot/logo` | Eliminar logo |

---

## 32. Endpoint Webchat para Landing Page (2026-03-18)

### 32.1 Descripcion

Endpoint publico REST que permite integrar el bot como widget de chat en la landing page (`lasgrutasdepartamentos.com`). Los mensajes pasan por el mismo pipeline del bot (clasificacion + respuesta + acumulacion de entidades) pero sin requerir WhatsApp.

### 32.2 Endpoint

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `POST` | `/api/webchat/send` | No | Envia mensaje y recibe respuesta del bot |

**Request body:**
```json
{
  "sessionId": "abc12345",   // ID de sesion unico del visitante (8-64 chars)
  "message": "Hola, quiero consultar disponibilidad",
  "name": "Juan"             // Opcional, nombre del visitante
}
```

**Response:**
```json
{
  "response": "Hola Juan! Bienvenido a Las Grutas Departamentos..."
}
```

### 32.3 Funcionamiento Interno

1. El `sessionId` se prefija con `web_` para crear un `waId` virtual (`web_abc12345`)
2. Se procesa via `processIncomingMessage()` (mismo pipeline que WhatsApp)
3. Las funciones `sendText()` y `sendImage()` detectan el prefijo `web_` y omiten el envio a WhatsApp API
4. La respuesta se obtiene de la DB (ultimo mensaje `origen: 'bot'` de la conversacion)
5. Las fotos se incluyen en `metadata.imageUrls` del mensaje (para renderizado frontend)

### 32.4 Diferencias con WhatsApp

| Aspecto | WhatsApp | Webchat |
|---------|----------|---------|
| Fotos | Se envian via `sendImage()` como imagenes adjuntas con caption | URLs en `metadata.imageUrls` para renderizado frontend |
| Texto | Se envia via WhatsApp Cloud API | Se guarda en DB y se retorna en el response JSON |
| Ubicacion | Google Maps link genera preview automatica | Link plano en texto |
| Audio | Soportado (transcripcion via Claude) | No soportado |

---

## 33. Mejoras de Formato y UX en WhatsApp (2026-03-18)

### 33.1 Formato de Datos Bancarios para WhatsApp

**Problema:** Cuando el bot enviaba datos bancarios (CBU, alias, titular), el texto largo excedia los margenes de la burbuja de WhatsApp, haciendolo dificil de leer y copiar.

**Solucion:** Se agrego la directiva `FORMATO WHATSAPP — OBLIGATORIO` al system prompt de Claude (`claudeService.ts`) con reglas de formato:

- Cada dato bancario (CBU, alias, titular, CUIT, banco) debe ir en su propia linea
- NUNCA poner CBU o alias dentro de un parrafo largo
- Listas con saltos de linea simples (sin guiones largos)
- Parrafos de maximo 3 lineas seguidas antes de un salto

**Ejemplo de formato correcto en WhatsApp:**
```
Los datos para la transferencia son:

Titular: Sergio Machado
CBU: 0000000000000000000000
Alias: lasgrutas.dep
Banco: Banco Nacion
CUIT: 20-12345678-9

El saldo restante se abona al momento del check-in.
```

### 33.2 Envio de Fotos con Caption

**Problema:** Cuando el huesped pedia fotos, el bot enviaba imagenes sin descripcion, haciendo dificil identificar que muestra cada foto.

**Solucion:** Se modifico `getDepartmentImages()` en `accommodationContext.ts` para retornar objetos `{ url, caption }` en vez de strings planos. Se actualizo `botEngine.ts` para enviar cada imagen con su caption via `sendImage(to, url, caption)`.

**Archivos modificados:**
- `server/src/data/accommodationContext.ts` — `getDepartmentImages()` retorna `{ url: string; caption: string | null }[]`
- `server/src/services/botEngine.ts` — Usa `img.caption || "NombreDepto - Foto N"` como caption de cada imagen

**Comportamiento por canal:**

| Canal | Antes | Despues |
|-------|-------|---------|
| WhatsApp | Imagenes sin caption | Cada imagen con caption (ej: "Living comedor", "Pewmafe - Foto 2") |
| Web chat | Lista de URLs como texto plano | Texto breve + `metadata.imageUrls` para renderizado frontend |

### 33.3 Compartir Ubicacion via Google Maps

**Problema:** Cuando el huesped pedia la ubicacion, el bot insertaba el link de Google Maps dentro de un parrafo de texto. WhatsApp no generaba la vista previa del mapa.

**Solucion:** Se agrego la directiva de formato de ubicacion al system prompt. El link de Google Maps se envia en su propia linea, limpio, para que WhatsApp genere automaticamente la vista previa con el mapa.

**Formato en el system prompt:**
```
UBICACION / GOOGLE MAPS: Cuando el huesped pregunte la ubicacion,
compartir el link de Google Maps en su propia linea:

Ubicacion de Pewmafe:
https://www.google.com/maps/search/?api=1&query=...
```

**Archivos modificados:**
- `server/src/services/claudeService.ts` — Directiva de formato de ubicacion en el bloque `FORMATO WHATSAPP`

**Contexto tecnico:** La URL de Google Maps se genera en `accommodationContext.ts` (linea 174) usando `encodeURIComponent(direccion, Rio Negro, Argentina)` para cada complejo. El formato `maps/search/?api=1&query=` es el formato oficial de Google Maps para links compartidos.

---

## 34. Utilidades de Fecha — Argentina Timezone (dateUtils.ts)

### 34.1 Descripcion

Modulo utilitario para manejar fechas y horas en timezone Argentina (UTC-3). Critico para el correcto funcionamiento del bot (clasificacion de fechas relativas como "mañana", "hoy") y del pipeline de disponibilidad.

**Archivo:** `server/src/utils/dateUtils.ts`

### 34.2 Funciones

| Funcion | Parametros | Retorno | Descripcion |
|---------|-----------|---------|-------------|
| `getArgentinaToday()` | — | `string` (YYYY-MM-DD) | Fecha de hoy en Argentina. Usa `Intl` timezone con fallback manual UTC-3 |
| `getArgentinaTime()` | — | `string` (HH:MM) | Hora actual en Argentina (24h). Usa `toLocaleTimeString` con timezone |
| `formatLocalDate(d)` | `Date` | `string` (YYYY-MM-DD) | Formatea Date a YYYY-MM-DD usando componentes locales |

### 34.3 Uso en el sistema

| Archivo | Uso |
|---------|-----|
| `claudeService.ts` | Inyecta `getArgentinaToday()` en el prompt del clasificador para resolver "mañana", "pasado mañana", etc. |
| `botEngine.ts` | Usa `getArgentinaToday()` para resolver fechas relativas en `resolveRelativeDate()` |

### 34.4 Fallback robusto

Si `Intl.DateTimeFormat` no respeta el timezone (posible en algunos entornos Node sin ICU completo), la funcion `manualArgentinaDate()` calcula la fecha manualmente restando 3 horas al UTC actual.

---

## 35. Gestion del Perfil de WhatsApp Business

### 35.1 Descripcion

Funcionalidad para consultar y editar el perfil del negocio en WhatsApp Business (about, descripcion, direccion, email, websites, categoria) directamente desde el panel de administracion.

### 35.2 Archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `server/src/routes/whatsappProfile.ts` | Endpoints GET/PATCH `/api/whatsapp/profile` con Zod validation |
| `server/src/services/whatsappProfileService.ts` | Obtener/actualizar perfil via Meta Graph API (v20.0+). En modo simulador, retorna datos dummy |
| `src/api/whatsappProfileApi.ts` | Cliente API frontend |
| `src/components/whatsapp/WhatsAppProfilePage.tsx` | Pagina admin con formulario de edicion |

### 35.3 Endpoints

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `GET` | `/api/whatsapp/profile` | Si (JWT) | Obtiene perfil actual (about, description, address, email, websites, vertical, profile_picture_url) |
| `PATCH` | `/api/whatsapp/profile` | Si (JWT) | Actualiza campos del perfil |

**Validacion Zod del PATCH:**
- `about`: string, max 139 caracteres
- `description`: string, max 512 caracteres
- `address`: string, max 256 caracteres
- `email`: email valido
- `websites`: array de URLs, max 2 elementos
- `vertical`: enum de categorias de negocio (HOTEL, TRAVEL, OTHER, etc.)

### 35.4 Modo simulador

Cuando `SIMULATOR_MODE=true` o no hay credenciales de WhatsApp configuradas, el servicio retorna un perfil dummy con datos de ejemplo del alojamiento. Las actualizaciones en modo simulador retornan success pero no persisten.

### 35.5 UI

Pagina accesible desde el panel de admin con:
- Campos editables: about, description, address, email, 2 websites, vertical (dropdown)
- Indicadores de limite de caracteres (about: 139, description: 512, address: 256)
- Foto de perfil en modo solo-lectura (no editable via API)
- Aviso visible cuando esta en modo simulador
- Boton guardar con estado de carga

---

## 36. Mejoras de Seguridad, Performance y Funcionalidad (2026-03-18)

Lote de 10 correcciones y mejoras implementadas en una sola sesion.

### 36.1 Rate Limiting en rutas publicas

**Archivo**: `server/src/middleware/rateLimiter.ts`

Refactorizado a un patron factory `createRateLimiter(namespace, maxRequests, windowSeconds)` que permite crear limiters con distintos limites por ruta. Cada namespace tiene su propia store en Redis (key prefix `chatboot:ratelimit:{namespace}:`) con fallback in-memory independiente.

| Limiter | Namespace | Limite | Rutas |
|---------|-----------|--------|-------|
| `rateLimiter` | `api` | 100 req/min/IP | Rutas protegidas (existente) |
| `loginRateLimiter` | `login` | 5 req/min/IP | `POST /api/auth/login`, `POST /api/auth/forgot-password` |
| `webchatRateLimiter` | `webchat` | 30 req/min/IP | `POST /api/webchat/send` |

### 36.2 Titulares verificados en BotConfig

**Archivos**: `schema.prisma`, `botEngine.ts`, `botConfig.ts` (route), `botConfigApi.ts`, `BotConfigPage.tsx`

Movido el array hardcodeado `TRUSTED_HOLDERS` a un campo configurable `titularesVerificados` (String[]) en el modelo `BotConfig`. La comparacion es case-insensitive. Gestionable desde el panel admin con UI de chips (agregar/eliminar titulares).

**Migracion**: `20260318210944_add_titulares_verificados` — agrega columna `titulares_verificados` (text[]) a tabla `bot_config`.

### 36.3 Manejo de imagenes WhatsApp

**Archivo**: `server/src/services/webhookProcessor.ts`

Nuevo branch para mensajes tipo `image` en el procesamiento de mensajes entrantes:
- Guarda el mensaje con `tipo: 'image'`, `contenido: caption || '[Imagen recibida]'`
- Almacena `metadata: { mediaId, mimeType }` para futura descarga
- Si la conversacion esta en estado `bot`, escala a `espera_humano` con mensaje de sistema y responde al usuario: "Recibimos tu imagen. Un agente la va a revisar y te contacta en breve."
- Agrega campo `image` a la interfaz `WhatsAppMessage`: `{ id: string; mime_type: string; caption?: string }`

### 36.4 Indexes de performance en base de datos

**Archivo**: `server/prisma/schema.prisma`

**Migracion**: `20260318211244_add_performance_indexes`

| Modelo | Index | Columnas | Uso |
|--------|-------|----------|-----|
| `Conversacion` | simple | `estado` | Filtrado por estado en listado de conversaciones |
| `Reserva` | compuesto | `habitacion, estado` | Consultas de ocupacion por departamento |
| `Reserva` | compuesto | `fechaEntrada, fechaSalida` | Consultas de rango de fechas |
| `Bloqueo` | compuesto | `complejoId, fechaInicio, fechaFin` | Consultas de disponibilidad con bloqueos |

### 36.5 Habitaciones dinamicas en inventarioService

**Archivo**: `server/src/services/inventarioService.ts`

Reemplazado el array hardcodeado `HABITACIONES = ['Pewmafe', 'Luminar Mono', 'Luminar 2Amb', 'LG']` por la funcion `getActiveHabitaciones()` que consulta `prisma.complejo.findMany({ where: { activo: true } })`. Esto permite que al agregar o desactivar complejos desde el panel admin, el inventario y disponibilidad se actualicen automaticamente.

### 36.6 Notificacion de fechas invertidas

**Archivo**: `server/src/services/botEngine.ts`

Cuando se detectan fechas invertidas (`fecha_entrada > fecha_salida`), ademas del swap automatico, ahora se agrega contexto adicional para Claude: "Las fechas del huesped estaban invertidas. Se corrigieron automaticamente: entrada X, salida Y. Confirma amablemente con el huesped que esas son las fechas correctas." Esto evita el swap silencioso y permite al usuario verificar.

### 36.7 Intents cancelar_reserva y cambiar_reserva

**Archivos**: `server/src/services/claudeService.ts`, `server/src/services/botEngine.ts`

Dos nuevos intents agregados al clasificador (total: 12 intents):

| Intent | Deteccion (fallback regex) | Accion |
|--------|---------------------------|--------|
| `cancelar_reserva` | `/cancel.*reserv\|anular.*reserv/` | Escala a `espera_humano` + mensaje sistema "Huesped solicito cancelar su reserva" |
| `cambiar_reserva` | `/cambiar.*reserv\|modificar.*reserv\|mover.*reserv\|cambiar.*fecha/` | Escala a `espera_humano` + mensaje sistema "Huesped solicito modificar su reserva" |

Ambos intents se tratan como escalacion obligatoria (el bot no puede cancelar ni modificar reservas). El clasificador Claude Haiku los detecta en el prompt, y el fallback regex los detecta antes del intent generico `reservar` para evitar falsos positivos.

### 36.8 Warning CORS en produccion

**Archivo**: `server/src/app.ts`

Cuando `ALLOWED_ORIGINS` es `*` y `NODE_ENV` es `production`, se loguea un warning via Pino: "ALLOWED_ORIGINS is set to '*' in production — this allows any origin. Set explicit origins in .env for security."

---

## 37. Recoleccion de datos del huesped en flujo de reserva (nombre, telefono, DNI)

### 37.1 Contexto

El bot ahora recolecta 3 datos adicionales del huesped durante el flujo de reserva: **nombre completo**, **numero de celular** y **numero de DNI**. Estos datos se piden de forma progresiva (uno a la vez) junto con los datos de reserva existentes (personas, fechas, departamento). La reserva no se auto-crea hasta que TODOS los datos estan completos, incluyendo DNI.

### 37.2 Nuevas entidades del clasificador

**Archivo**: `server/src/services/claudeService.ts`

Se agregaron 3 nuevas reglas de extraccion de entidades al prompt del clasificador Haiku:

| Entidad | Regla | Ejemplo |
|---------|-------|---------|
| `nombre_huesped` | Solo si el usuario dice su nombre | "soy Juan", "me llamo Maria Perez" |
| `telefono` | Solo si da un numero de celular | "mi celular es 2920412345" |
| `dni` | Solo si da su numero de documento | "mi DNI es 35123456", "documento 28.456.789" |

Las 3 entidades se agregaron a `VALID_ENTITY_KEYS` en `botEngine.ts` para que sean aceptadas por `sanitizeEntities()`.

### 37.3 Validacion de DNI

**Archivo**: `server/src/services/botEngine.ts` (funcion `sanitizeEntities`)

El DNI se valida server-side:
- Se eliminan puntos separadores (`28.456.789` → `28456789`)
- Se verifica que sea un numero entre **5.000.000** y **99.999.999**
- Si no cumple el rango, se descarta la entidad y se loguea un warning
- El prompt de Claude tambien instruye al bot a pedir verificacion si el numero esta fuera de rango

### 37.4 Flujo de recoleccion progresiva

**Archivo**: `server/src/services/botEngine.ts`

Los datos faltantes se detectan en la seccion "missing" y se comunican a Claude como "Datos que FALTAN por preguntar". El orden de recoleccion es:

1. Cantidad de personas
2. Fechas de entrada y salida
3. Preferencia de departamento
4. Nombre del huesped
5. Numero de celular
6. Numero de DNI

Claude pregunta por **un dato a la vez** siguiendo las reglas de "PREGUNTAS PROGRESIVAS".

### 37.5 Auto-creacion de reserva

**Archivo**: `server/src/services/botEngine.ts` (seccion 10)

La condicion `allPresent` ahora requiere **7 campos** (antes 4):

```typescript
const allPresent = mergedEntities.habitacion && mergedEntities.fecha_entrada &&
                   mergedEntities.fecha_salida && mergedEntities.num_personas &&
                   mergedEntities.nombre_huesped && mergedEntities.telefono &&
                   mergedEntities.dni;
```

La misma condicion se aplica a `prevHadAll` (para verificar que PASO 1 fue mostrado con todos los datos). Al crear la reserva, se pasan los datos extraidos:

```typescript
await createReserva({
  nombreHuesped: mergedEntities.nombre_huesped || huesped?.nombre || undefined,
  telefonoHuesped: mergedEntities.telefono || huesped?.telefono || huesped?.waId || undefined,
  dni: mergedEntities.dni || undefined,
  // ... resto de campos
});
```

Los datos de la conversacion tienen prioridad sobre los datos del huesped en la DB.

### 37.6 Campo DNI en base de datos

**Archivo**: `server/prisma/schema.prisma`

Se agrego el campo `dni` al modelo `Reserva`:

```prisma
model Reserva {
  ...
  dni             String?
  ...
}
```

**Migracion**: `20260319001233_add_dni_to_reservas` — `ALTER TABLE "reservas" ADD COLUMN "dni" TEXT`

### 37.7 DNI en API REST

**Archivo**: `server/src/routes/reservas.ts`

El campo `dni` se agrego a los schemas Zod de:
- `createManualSchema`: `dni: z.string().optional()`
- `updateSchema`: `dni: z.string().nullable().optional()`

**Archivo**: `server/src/services/reservaService.ts`

El campo `dni` se agrego a las interfaces `CreateReservaParams`, `CreateReservaManualParams` y `UpdateReservaParams`, y se pasa a `prisma.reserva.create()`.

### 37.8 DNI en panel de administracion (frontend)

**Archivo**: `src/components/reservas/ReservaList.tsx`

- **Tabla desktop**: nueva columna "DNI" entre Telefono y Tarifa
- **Modal crear/editar**: campo DNI en Fila 1 (Nombre + Telefono + DNI, grid 3 cols)
- **Formulario**: se agrego `dni` a `EMPTY_FORM`, `reservaToForm()`, y `handleSubmit()`

**Archivo**: `shared/types/reserva.ts`

Se agrego `dni: string | null` a la interfaz `Reserva`, `dni?: string` a `CrearReservaManualRequest`, y `dni?: string | null` a `UpdateReservaRequest`.

### 37.9 Cambios en prompts de Claude

**Archivo**: `server/src/services/claudeService.ts`

| Seccion | Cambio |
|---------|--------|
| Regla 7 (FLUJO) | Agrega nombre, celular y DNI como datos requeridos |
| Regla 7 (validacion) | DNI debe ser entre 5.000.000 y 99.999.999 |
| Regla 8 PASO 1 | Resumen incluye nombre, telefono, DNI, precio total |
| Regla 8 PASO 3 | Ya no pide DNI (se recolecta antes de PASO 1) |
| Instruccion `reservar` | Lista los 6 datos requeridos incluyendo nombre, celular y DNI |
| Fallback `reservar` | Respuesta de fallback actualizada con los 6 campos |

### 37.10 DNI en modelo Huesped

**Archivo**: `server/prisma/schema.prisma`

Se agrego el campo `dni` tambien al modelo `Huesped`, ya que el DNI es un dato personal que pertenece al huesped (no solo a una reserva). Esto permite que al volver a reservar, el sistema ya tenga el DNI del huesped.

**Migracion**: `20260319003537_add_dni_to_huespedes` — `ALTER TABLE "huespedes" ADD COLUMN "dni" TEXT`

**Archivos actualizados**:
- `shared/types/huesped.ts`: agregado `dni: string | null`
- `server/src/routes/huespedes.ts`: agregado `dni` al schema Zod de update
- `src/components/guests/GuestCard.tsx`: muestra DNI en sidebar del chat
- `server/src/services/botEngine.ts`: al auto-crear reserva, tambien actualiza nombre/telefono/dni en el registro del huesped si no los tenia

**Logica de actualizacion del huesped** (botEngine.ts, seccion auto-create):

```typescript
const huespedUpdate: Record<string, string> = {};
if (mergedEntities.nombre_huesped && !huesped?.nombre) huespedUpdate.nombre = mergedEntities.nombre_huesped;
if (mergedEntities.telefono && !huesped?.telefono) huespedUpdate.telefono = mergedEntities.telefono;
if (mergedEntities.dni && !huesped?.dni) huespedUpdate.dni = mergedEntities.dni;
if (Object.keys(huespedUpdate).length > 0) {
  await tx.huesped.update({ where: { id: ctx.huespedId }, data: huespedUpdate });
}
```

Solo se actualizan campos que el huesped no tenia previamente (no sobreescribe datos existentes).

---

## 38. Correccion de distancias al centro de Las Grutas

### 38.1 Problema

La ubicacion de los complejos indicaba solo la distancia a la playa ("a 2 cuadras de la playa") pero no la distancia al centro comercial de Las Grutas. Esto causaba que el bot informara incorrectamente que Pewmafe era uno de los complejos mas cercanos al centro, cuando en realidad es el mas lejano.

### 38.2 Ubicaciones corregidas

Se investigo en Google Maps y fuentes turisticas la posicion real de cada complejo respecto al centro de Las Grutas (zona peatonal Viedma / Primeras Bajadas):

| Complejo | Direccion | Ubicacion anterior | Ubicacion corregida |
|----------|-----------|-------------------|---------------------|
| **LG** | Nahuel Huapi 75 (antes: Golfo San Jorge 560) | a 2 cuadras del mar (bajada Los Acantilados) | a 2 cuadras del centro y de la playa (Primeras Bajadas) |
| **Luminar Mono** | Golfo San Jorge 560 | a 2-3 cuadras de la playa (bajada Los Acantilados) | a 6 cuadras del centro, a 2-3 cuadras de la playa (bajada Los Acantilados) |
| **Luminar 2Amb** | Golfo San Jorge 560 | a 2 cuadras de la playa (bajada Los Acantilados) | a 6 cuadras del centro, a 2 cuadras de la playa (bajada Los Acantilados) |
| **Pewmafe** | Punta Perdices 370 | a 2 cuadras de la playa (bajada La Rinconada) | a 20 cuadras del centro, a 2 cuadras de la playa (bajada La Rinconada, acceso norte) |

**Orden de cercania al centro**: LG (2 cuadras) → Luminar (6 cuadras) → Pewmafe (20 cuadras)

### 38.3 Correccion de direccion de LG

La direccion de LG en el seed estaba incorrecta (`Golfo San Jorge 560`, que es la direccion de Luminar). La direccion real es `Nahuel Huapi 75`, que coincide con la direccion de la oficina de Las Grutas Departamentos. Se corrigio en el seed y en la base de datos.

### 38.4 Archivos modificados

- `server/prisma/seed-complejos.ts`: direccion y ubicacion actualizadas para los 4 complejos
- Base de datos local: UPDATE directo en tabla `complejos`
- Base de datos produccion: UPDATE aplicado via SSH

### 38.5 Impacto

Los datos de ubicacion se leen dinamicamente de la DB por `accommodationContext.ts` y se inyectan en el prompt de Claude. Tras esta correccion, el bot informara correctamente las distancias al centro cuando un huesped pregunte por la ubicacion de los departamentos.

---

## 39. TEST FAILED — Fotos no se muestran en webchat (2026-03-19)

### 39.1 Descripcion del test

**Fecha**: 2026-03-19
**Canal**: Webchat (landing page)
**Conversacion**: `cmmxeuesa0013jy2jvbnzhb8r` (Visitante Web, `web_aa85cab6b6a24cb1a667520acec26db1`)
**Estado final**: `espera_humano` (escalado por queja del huesped)

### 39.2 Pasos reproducidos

1. Usuario web inicia reserva: "Para reservar para hoy somos 3 personas"
2. Bot pide fecha de salida, usuario dice "3 noches"
3. Bot muestra opciones disponibles (Luminar 2Amb y Pewmafe)
4. Usuario pide: **"Luminar, ne envias fotos"**
5. Bot responde: "Aca te muestro fotos de Luminar 2Amb:" — **sin imagenes visibles**
6. Usuario dice: "No las rec8bi" (no las recibi)
7. Bot clasifica como `queja` → escalado a `espera_humano`
8. Usuario frustrado pide hablar con responsable

### 39.3 Causa raiz

**Archivo**: `server/src/routes/webchat.ts` (lineas 56-63)

El endpoint `/api/webchat/send` solo devuelve el campo `contenido` (texto) del ultimo mensaje del bot:

```typescript
const botMessage = await prisma.mensaje.findFirst({
  where: { conversacionId: conv.id, origen: 'bot' },
  orderBy: { creadoEn: 'desc' },
});

res.json({
  response: botMessage?.contenido ?? 'No se pudo generar una respuesta en este momento.',
});
```

Las URLs de las fotos estan guardadas correctamente en `metadata.imageUrls` del mensaje:

```json
{
  "intent": "consulta_alojamiento",
  "photosSent": 6,
  "imageUrls": [
    "https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/2AMB_B_LIVING2-725x453.jpg",
    "https://www.lasgrutasdepartamentos.com/wp-content/uploads/2016/08/01a_frente_jpg-750x453.jpg",
    "..."
  ]
}
```

Pero el endpoint **ignora el campo `metadata`** y solo devuelve `contenido`. El usuario web recibe el texto "Aca te muestro fotos de Luminar 2Amb:" sin ninguna imagen adjunta.

### 39.4 Flujo del error

```
botEngine.ts                          webchat.ts                    Frontend (landing)
    |                                      |                              |
    |-- isWebUser=true                     |                              |
    |-- Guarda en DB:                      |                              |
    |   contenido: "Aca te muestro..."     |                              |
    |   metadata.imageUrls: [6 URLs]       |                              |
    |   metadata.photosSent: 6             |                              |
    |                                      |                              |
    |                                      |-- Lee botMessage             |
    |                                      |-- Devuelve SOLO contenido  --|-> Muestra texto sin fotos
    |                                      |-- metadata IGNORADA          |
    |                                      |                              |-- Usuario no ve fotos
```

### 39.5 Evidencia en logs de produccion

```
{"from":"web_aa85cab6...","body":"Luminar, ne envias fotos","msg":"Processing incoming message"}
{"depto":"Luminar 2Amb","count":6,"isWebUser":true,"msg":"Sending photos directly"}
```

El bot detecto correctamente la solicitud de fotos, encontro 6 imagenes de Luminar 2Amb, y las guardo en metadata. El error es exclusivamente en la capa de transporte webchat → frontend.

### 39.6 Solucion propuesta (pendiente)

Modificar `server/src/routes/webchat.ts` para incluir `imageUrls` en la respuesta JSON:

```typescript
// Extraer imageUrls de metadata si existen
const metadata = botMessage?.metadata as Record<string, unknown> | null;
const imageUrls = (metadata?.imageUrls as string[]) ?? [];

res.json({
  response: botMessage?.contenido ?? 'No se pudo generar una respuesta en este momento.',
  imageUrls,
});
```

Y actualizar el widget `WhatsAppPopup.tsx` en la landing page para renderizar las imagenes cuando `imageUrls` viene en la respuesta.

### 39.7 Impacto

- **Afecta**: Solo usuarios del webchat (landing page). WhatsApp funciona correctamente (las fotos se envian via `sendImage()`)
- **Severidad**: Media — el usuario no recibe la informacion solicitada y se frustra, lo que lleva a escalado innecesario
- **Workaround**: El agente humano puede enviar las fotos manualmente tras tomar el control de la conversacion

---

## 40. Eliminacion de Reservas y Emails desde el Panel Admin (2026-03-20)

### 40.1 Objetivo

Permitir al administrador eliminar registros de reservas (ej: canceladas, duplicadas) y emails procesados desde el panel web para mantener la vista limpia y enfocarse en lo relevante.

### 40.2 Backend

**Nuevos endpoints:**

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `DELETE` | `/api/reservas/:id` | Elimina reserva. Recalcula inventario si tenia habitacion. Retorna 204 |
| `DELETE` | `/api/emails/:id` | Elimina email procesado. Retorna 204 |

Ambos retornan 404 si el registro no existe.

**Nuevas funciones de servicio:**

| Archivo | Funcion | Descripcion |
|---------|---------|-------------|
| `reservaService.ts` | `deleteReserva(id)` | Busca la reserva, la elimina, y si tenia habitacion asignada recalcula disponibilidad del inventario con `recalcDisponible()` |
| `emailQueryService.ts` | `deleteEmail(id)` | Busca el email, lo elimina de la DB |

### 40.3 Frontend

**API clients:**

| Archivo | Funcion |
|---------|---------|
| `src/api/reservaApi.ts` | `deleteReserva(id)` — `fetch DELETE /reservas/:id` |
| `src/api/emailApi.ts` | `deleteEmail(id)` — `fetch DELETE /emails/:id` |

**Fix en `apiClient.ts`:** Se agrego manejo de respuestas 204 No Content (retorna `undefined` en vez de intentar parsear JSON vacio).

**ReservaList.tsx:**
- Icono Trash2 rojo en columna Acciones (desktop) al lado del Pencil de edicion
- Icono Trash2 rojo en el header del card (mobile) al lado del Pencil
- `window.confirm('Seguro que queres eliminar esta reserva?')` antes de ejecutar
- `useMutation` con invalidacion de `['reservas']` y `toast.error` en caso de fallo

**EmailList.tsx:**
- Columna "Acciones" nueva en tabla desktop con icono Trash2
- Icono Trash2 en esquina del card mobile
- `e.stopPropagation()` en ambos para evitar abrir el modal de detalle
- `window.confirm('Seguro que queres eliminar este email?')` antes de ejecutar
- `useMutation` con invalidacion de `['emails']` (incluye stats por prefix matching) y `toast.error` en caso de fallo

### 40.4 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `server/src/services/reservaService.ts` | `+ deleteReserva(id)` |
| `server/src/routes/reservas.ts` | `+ DELETE /reservas/:id` |
| `server/src/services/emailQueryService.ts` | `+ deleteEmail(id)` |
| `server/src/routes/emails.ts` | `+ DELETE /emails/:id` |
| `src/api/apiClient.ts` | Fix: manejo de respuestas 204 No Content |
| `src/api/reservaApi.ts` | `+ deleteReserva(id)` |
| `src/api/emailApi.ts` | `+ deleteEmail(id)` |
| `src/components/reservas/ReservaList.tsx` | Boton eliminar en tabla y cards |
| `src/components/emails/EmailList.tsx` | Boton eliminar en tabla y cards, nueva columna Acciones |

---

## 41. Formulario de contacto - Guardado directo en BD + Auto-respuesta (2026-03-20)

### 41.1 Problema

Cuando un visitante envia el formulario de contacto desde la landing page, el endpoint `POST /api/contact` solo enviaba un email de notificacion a `info@lasgrutasdepartamentos.com`. No guardaba nada en la BD ni enviaba auto-respuesta al visitante.

El flujo indirecto (IMAP poller recoge el email, detecta formulario, procesa, guarda en BD) no funcionaba confiablemente porque:
- Depende de que IMAP este configurado y conectado al mismo buzon
- En produccion con SMTP localhost:25 (Postfix), el email puede no llegar al buzon IMAP de cPanel
- Hay 3 minutos de delay minimo entre polls

### 41.2 Solucion

Se modifico `POST /api/contact` para que directamente:
1. Responda `{ ok: true }` al frontend inmediatamente (sin esperar procesamiento)
2. En background (fire-and-forget):
   - Envie email de notificacion al admin (best-effort)
   - Llame a `processIncomingEmail()` con `formFields` para generar auto-respuesta con Claude
   - Guarde registro en tabla `emailProcesado` con `esFormulario: true`

### 41.3 Flujo resultante

```
Landing POST /api/contact
  ├── res.json({ ok: true })           -> respuesta inmediata al frontend
  └── background:
      ├── sendContactEmail()            -> email notificacion a admin (best-effort)
      ├── processIncomingEmail()        -> Claude genera respuesta -> sendAutoReplyEmail() al visitante
      └── prisma.emailProcesado.create() -> aparece en admin panel (seccion Emails, filtro "Formularios")
```

### 41.4 Casos de error

- Si no hay complejos con `autoResponderEmail: true`: guarda en BD con `respondido: false` y error descriptivo
- Si `processIncomingEmail()` falla: guarda en BD con `respondido: false` y el mensaje de error
- Si falla el guardado en BD tras error: se loguea pero no afecta al usuario

### 41.5 Codigo reutilizado (sin cambios)

- `processIncomingEmail` de `emailAutoResponderService.ts` (ya soporta `formFields`)
- `sendAutoReplyEmail` de `emailService.ts` (llamado internamente por `processIncomingEmail`)
- Schema `EmailProcesado` ya tiene campo `esFormulario`
- Frontend `EmailList.tsx` ya tiene filtro "Formularios" y polling cada 60s

### 41.6 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `server/src/routes/contact.ts` | Agregado: imports de `prisma`, `processIncomingEmail`, `crypto`. Respuesta inmediata al frontend. Background: auto-respuesta con Claude + guardado en BD |
| `documentacion.md` | Seccion 41 documentando el nuevo flujo |

---

## 42. Fix: datos bancarios no mostrados cuando huesped pregunta por forma de pago (2026-03-20)

### 42.1 Problema

Cuando el huesped, en vez de confirmar "si quiero reservar", preguntaba sobre formas de pago ("puedo pagar con tarjeta?"), el bot solo mencionaba MercadoPago sin dar los datos bancarios de transferencia. Esto sucedia porque el PASO 2 del flujo de reservas decia "Si acepta →" y el bot no interpretaba la pregunta sobre pago como aceptacion.

### 42.2 Solucion

Se actualizo el system prompt del bot en `claudeService.ts` (PASO 2):
- "Si acepta **o pregunta sobre formas/medios de pago** (esto equivale a aceptar)" — pregunta de pago = aceptacion
- "SIEMPRE primero indica que la sena se abona por transferencia bancaria y pasale los datos de la cuenta" — datos bancarios van primero, siempre
- Si el huesped pregunta por tarjeta/MercadoPago: "PRIMERO da los datos bancarios como opcion principal, y DESPUES menciona MercadoPago como alternativa"

### 42.3 Archivo modificado

| Archivo | Cambio |
|---------|--------|
| `server/src/services/claudeService.ts` | PASO 2 del system prompt: pregunta sobre pago equivale a aceptacion, datos bancarios siempre primero |

---

## 43. Arquitectura de produccion — UNA sola instancia (2026-03-20)

### 43.1 Problema detectado

Se descubrio que habia **DOS servidores Node.js corriendo en paralelo** en produccion:

| Instancia | Proceso | Puerto | BD | Gestionado por |
|-----------|---------|--------|----|----------------|
| Docker container | `tsx src/index.ts` | 5050 (interno Docker) | PostgreSQL Docker (container) | docker-compose |
| Host nativo | `node dist/index.js` | 5050 (host) | PostgreSQL nativo (localhost:5432) | PM2 |

El nginx del host hacia `proxy_pass http://localhost:5050` que iba al proceso PM2, **NO al container Docker**. Esto causaba:
- Conversaciones del webchat se guardaban en la BD del host (no visible en el panel admin Docker)
- Los datos bancarios y `titularesVerificados` de la BD del host estaban desactualizados
- El bot escalaba SIEMPRE a `espera_humano` por titular no verificado (`titularesVerificados` vacio en BD host)
- Los cambios deployados via Docker (ej: delete de reservas/emails) no se aplicaban al proceso PM2

### 43.2 Solucion

1. Se elimino el proceso PM2 del host (`pm2 delete chatboot`)
2. Se actualizo `docker-compose.prod.yml`: el app service ahora expone `127.0.0.1:5050:5050` al host
3. Se removieron los servicios nginx y certbot de docker-compose (SSL lo maneja el nginx del host)
4. Se actualizo el nginx del host para `proxy_pass http://localhost:5050` (ahora llega al Docker via port mapping)

### 43.3 Arquitectura VALIDA (unica)

```
Internet
  │
  ▼
Nginx del HOST (:443 SSL, Certbot)
  │  proxy_pass http://localhost:5050
  ▼
Docker: chatboot-app (:5050, port mapping 127.0.0.1:5050:5050)
  │
  ├── Docker: chatboot-postgres (:5432 interno)
  └── Docker: chatboot-redis (:6379 interno)
```

**NO DEBE existir** ningun otro proceso Node.js escuchando en el host. Verificar con:
```bash
ss -tlnp | grep 5050
# Debe mostrar SOLO el proceso de Docker (docker-proxy)
```

### 43.4 Proceso de deploy

```bash
# Desde el servidor (ssh -p5748 root@66.97.40.119)
cd /var/www/chatboot
git pull origin main
bash deploy.sh update
```

El script `deploy.sh update` hace: `git pull` → `docker compose build --no-cache app` → `docker compose up -d app`.

### 43.5 Reglas para evitar recurrencia

1. **NUNCA usar PM2, systemd o similar** para correr Node.js en el host. Solo Docker.
2. **NUNCA instalar Node.js nativo** para produccion. El Dockerfile usa `node:20-alpine`.
3. **NUNCA conectarse a `localhost:5432`** desde la app. La BD es `postgres:5432` (nombre del container Docker).
4. **Verificar despues de cada deploy** que no haya procesos duplicados: `ss -tlnp | grep 5050`
5. **El nginx del host** (`/etc/nginx/sites-enabled/chatbot-lasgrutas`) es el unico reverse proxy. El nginx de Docker fue removido.
6. **Los certificados SSL** los maneja Certbot instalado en el host (renovacion via cron).

### 43.6 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `docker-compose.prod.yml` | App expone `127.0.0.1:5050:5050`. Removidos servicios nginx y certbot de Docker |
| `/etc/nginx/sites-enabled/chatbot-lasgrutas` (servidor) | `proxy_pass http://localhost:5050` (llega a Docker via port mapping) |
| PM2 (servidor) | Proceso `chatboot` eliminado permanentemente |

## 44. Fix SMTP desde Docker — Relay a Postfix del host (2026-03-20)

### 44.1 Problema

Los emails de auto-respuesta del formulario de contacto no llegaban al destinatario, aunque el admin panel mostraba `respondido=true`.

**Causa raiz (doble):**

1. **`SMTP_HOST=localhost` dentro de Docker** apunta al propio container (no tiene MTA). El Postfix corre en el **host**, no en el container.
2. **Postfix rechazaba relay** desde IPs de Docker (`172.17.x.x` / `172.18.x.x`) con error `454 4.7.1 Relay access denied`, porque `mynetworks` solo incluia `127.0.0.0/8`.

### 44.2 Solucion

| Cambio | Donde | Detalle |
|--------|-------|---------|
| `extra_hosts: ["host.docker.internal:host-gateway"]` | `docker-compose.prod.yml` | Permite al container resolver `host.docker.internal` → IP del host |
| `SMTP_HOST=host.docker.internal` | `.env` en servidor | El container envia SMTP al host via esta resolucion |
| `useLocalMta` reconoce `host.docker.internal` | `server/src/services/emailService.ts` | No intenta autenticacion SMTP (Postfix local no la requiere) |
| `mynetworks` ampliado | Postfix en host (`/etc/postfix/main.cf`) | `mynetworks = 127.0.0.0/8 ... 172.17.0.0/16 172.18.0.0/16` para permitir relay desde Docker |

### 44.3 Flujo SMTP corregido

```
Container (app) → host.docker.internal:25 → Postfix (host) → internet (gmail, etc.)
```

### 44.4 Verificacion

```bash
# Desde dentro del container, verificar conectividad:
docker exec chatboot-app sh -c 'echo QUIT | nc host.docker.internal 25'
# Debe responder: 220 vps-... ESMTP Postfix

# Verificar que Postfix permite relay desde Docker:
postconf mynetworks
# Debe incluir 172.17.0.0/16 y 172.18.0.0/16

# Enviar test:
curl -X POST https://chatbot.lasgrutasdepartamentos.com/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Test","email":"tu@email.com","telefono":"123","complejo":"Pewmafe"}'
# Verificar en logs: docker logs chatboot-app --since 1m | grep "Auto-reply email sent"
```

---

## 45. Migracion de infraestructura — Todo en VPS DonWeb (2026-03-20)

### 45.1 Contexto

El sitio `lasgrutasdepartamentos.com` estaba distribuido en 3 proveedores:
- **DonWeb**: dominio + VPS Ubuntu (66.97.40.119) con el chatbot
- **Hosting externo** (cPanel 198.54.114.136): WordPress (sitio viejo) + email
- **Cloudflare**: DNS (controlado por la persona del hosting externo)

Esto causaba que no se pudiera configurar SPF/DKIM correctamente, los emails auto-respuesta del chatbot no llegaban (Gmail los rechazaba como spam). Ademas habia dependencia de un tercero para cualquier cambio de DNS.

### 45.2 Que se migro

Se consolido **todo** en el VPS de DonWeb:

| Componente | Antes | Despues |
|------------|-------|---------|
| Landing page | WordPress en cPanel externo | **React SPA (Vite) en Nginx** del VPS |
| DNS | Cloudflare (ns kate/tim) | **DonWeb** (ns1/ns2.donweb.com) |
| Email saliente | Sin DKIM, rechazado por Gmail | **Postfix + OpenDKIM** en el VPS |
| Chatbot | Docker en VPS (sin cambios) | Docker en VPS (sin cambios) |

### 45.3 Landing page — React SPA

La landing page es una SPA React/Vite (NO WordPress). Incluye:
- Formulario de contacto con auto-respuesta por email
- Widget webchat integrado con el chatbot (`chatbot.lasgrutasdepartamentos.com`)
- Links a WhatsApp, Instagram, Facebook
- Google Maps embed
- Galeria de fotos de los departamentos

**Ubicacion en el servidor:**
```
/var/www/lasgrutasdepartamentos.com/
├── index.html                    # Entry point React SPA
├── favicon.jpg
├── favicon.svg
├── icons.svg
├── logo.jpg / logo.png / logo-white.png
├── assets/
│   ├── index-C4En0H4e.js        # Bundle JS activo
│   ├── index-DXEtPZQ1.css       # Bundle CSS activo
│   └── (otros bundles de versiones anteriores)
└── wp-content/uploads/           # Imagenes de propiedades (migradas del WordPress viejo)
    ├── 2016/08/                  # 32 imagenes
    └── 2019/09/                  # 12 imagenes
```

**Total: 59 archivos, 4.8 MB.** Las imagenes estan en `wp-content/uploads/` porque el JS bundle las referencia con esas rutas absolutas (heredadas del WordPress original).

**Nginx config** (`/etc/nginx/sites-available/lasgrutasdepartamentos`):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name lasgrutasdepartamentos.com www.lasgrutasdepartamentos.com;
    root /var/www/lasgrutasdepartamentos.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # SSL gestionado por Certbot
    listen [::]:443 ssl;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/lasgrutasdepartamentos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lasgrutasdepartamentos.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

### 45.4 Email — Postfix + OpenDKIM

**Stack de email saliente (solo envio, no recepcion):**

| Servicio | Funcion |
|----------|---------|
| Postfix | MTA — envia emails al exterior |
| OpenDKIM | Firma DKIM en emails salientes (milter en puerto 12301) |

**Configuracion Postfix** (`/etc/postfix/main.cf` — claves):
```
myhostname = lasgrutasdepartamentos.com
mydomain = lasgrutasdepartamentos.com
myorigin = lasgrutasdepartamentos.com
milter_protocol = 6
milter_default_action = accept
smtpd_milters = inet:localhost:12301
non_smtpd_milters = inet:localhost:12301
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 172.17.0.0/16 172.18.0.0/16
inet_protocols = ipv4
virtual_alias_maps = hash:/etc/postfix/virtual
```

**Virtual aliases** (`/etc/postfix/virtual`):
```
info@lasgrutasdepartamentos.com sergiomachado82@gmail.com
```
Esto reenvía todos los emails dirigidos a `info@` hacia Gmail. Ejecutar `postmap /etc/postfix/virtual` despues de editar.

**Configuracion OpenDKIM** (`/etc/opendkim.conf`):
```
Syslog          yes
UMask           007
Socket          inet:12301@localhost
Canonicalization relaxed/simple
Mode            sv
KeyTable        /etc/opendkim/KeyTable
SigningTable    refile:/etc/opendkim/SigningTable
TrustedHosts    /etc/opendkim/TrustedHosts
```

**TrustedHosts** (`/etc/opendkim/TrustedHosts`):
```
127.0.0.1
localhost
lasgrutasdepartamentos.com
*.lasgrutasdepartamentos.com
172.17.0.0/16
172.18.0.0/16
```
Las redes Docker (`172.17/18`) deben estar incluidas para que OpenDKIM firme los emails enviados desde el container.

**Archivos DKIM:**
- Clave privada: `/etc/opendkim/keys/lasgrutasdepartamentos.com/default.private`
- KeyTable: `default._domainkey.lasgrutasdepartamentos.com lasgrutasdepartamentos.com:default:/etc/opendkim/keys/lasgrutasdepartamentos.com/default.private`
- SigningTable: `*@lasgrutasdepartamentos.com default._domainkey.lasgrutasdepartamentos.com`

### 45.5 DNS — Registros en DonWeb

| Tipo | Nombre | Contenido |
|------|--------|-----------|
| A | `@` | `66.97.40.119` |
| A | `www` | `66.97.40.119` |
| A | `chatbot` | `66.97.40.119` |
| MX | `@` | `10 lasgrutasdepartamentos.com` |
| TXT (SPF) | `@` | `v=spf1 +ip4:66.97.40.119 ~all` |
| TXT (DKIM) | `default._domainkey` | `v=DKIM1; h=rsa-sha256; k=rsa; s=email; p=MIIBIjAN...` |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@lasgrutasdepartamentos.com` |

**Nameservers:** `ns1.donweb.com` / `ns2.donweb.com`

### 45.6 Arquitectura completa del VPS

```
Internet
  │
  ▼
Nginx del HOST (:80/:443 SSL, Certbot)
  │
  ├── lasgrutasdepartamentos.com → Static SPA (/var/www/lasgrutasdepartamentos.com/)
  │
  ├── chatbot.lasgrutasdepartamentos.com → proxy_pass http://localhost:5050
  │     │
  │     ▼
  │   Docker: chatboot-app (:5050)
  │     ├── Docker: chatboot-postgres (:5432)
  │     └── Docker: chatboot-redis (:6379)
  │
  └── Postfix (:25) + OpenDKIM (:12301)
        ↑
        Container envia email via host.docker.internal:25
```

**Servicios activos:**
| Servicio | Gestionado por | Estado |
|----------|----------------|--------|
| Nginx | systemd | enabled |
| Postfix | systemd | enabled |
| OpenDKIM | systemd | enabled |
| chatboot-app | docker-compose | restart: unless-stopped |
| chatboot-postgres | docker-compose | restart: unless-stopped |
| chatboot-redis | docker-compose | restart: unless-stopped |

**Servicios eliminados (ya no necesarios):**
| Servicio | Razon |
|----------|-------|
| MariaDB | Se instalo para WordPress. WordPress eliminado. Paquetes purgados |
| PHP 8.3-FPM | Se instalo para WordPress. WordPress eliminado. Paquetes purgados |

### 45.7 Recursos del VPS

| Recurso | Valor |
|---------|-------|
| IP | 66.97.40.119 |
| SSH | Puerto 5748 |
| OS | Ubuntu 24.04 LTS |
| CPU | 2 cores |
| RAM | 1.9 GB + 2 GB swap |
| Disco | 15 GB total, ~6 GB libre |

### 45.8 Verificacion post-migracion

```bash
# Verificar servicios
systemctl is-active nginx postfix opendkim
docker ps --format 'table {{.Names}}\t{{.Status}}'

# Verificar landing page
curl -sk -H 'Host: lasgrutasdepartamentos.com' https://localhost/ | head -5

# Verificar chatbot
curl -s http://localhost:5050/api/health | python3 -m json.tool

# Verificar DKIM
opendkim-testkey -d lasgrutasdepartamentos.com -s default -vvv

# Verificar DNS
dig +short lasgrutasdepartamentos.com @8.8.8.8
dig TXT lasgrutasdepartamentos.com @8.8.8.8
dig TXT default._domainkey.lasgrutasdepartamentos.com @8.8.8.8

# Verificar email (enviar test desde el container)
docker exec chatboot-app sh -c 'echo QUIT | nc host.docker.internal 25'

# Verificar SSL
echo | openssl s_client -connect lasgrutasdepartamentos.com:443 -servername lasgrutasdepartamentos.com 2>/dev/null | openssl x509 -noout -dates
```

### 45.9 Archivos de configuracion en el servidor

| Archivo | Funcion |
|---------|---------|
| `/etc/nginx/sites-available/lasgrutasdepartamentos` | Nginx para landing page SPA + SSL |
| `/etc/nginx/sites-available/chatbot-lasgrutas` | Nginx reverse proxy chatbot + SSL |
| `/etc/postfix/main.cf` | Configuracion Postfix |
| `/etc/opendkim.conf` | Configuracion OpenDKIM |
| `/etc/opendkim/keys/lasgrutasdepartamentos.com/default.private` | Clave privada DKIM |
| `/etc/opendkim/KeyTable` | Mapeo selector → clave DKIM |
| `/etc/opendkim/SigningTable` | Mapeo dominio → selector |
| `/etc/opendkim/TrustedHosts` | Hosts que firman con DKIM (incluye redes Docker) |
| `/etc/postfix/virtual` | Alias virtuales (info@ → sergiomachado82@gmail.com) |
| `/var/www/chatboot/.env` | Variables de entorno del chatbot (SMTP_HOST=host.docker.internal) |
| `/var/www/chatboot/docker-compose.prod.yml` | Docker Compose produccion |

### 45.10 Flujo de emails del formulario de contacto

Cuando un visitante completa el formulario en la landing page:

```
Visitante completa formulario
  │
  ▼
POST /api/contact (chatbot backend)
  │
  ├── 1. Responde { ok: true } al frontend (inmediato)
  │
  └── 2. Background (fire-and-forget):
      │
      ├── sendContactEmail() → Postfix → info@lasgrutasdepartamentos.com
      │     │                              (virtual alias)
      │     │                                    ↓
      │     └──────────────────────────── sergiomachado82@gmail.com
      │
      └── processIncomingEmail() → Claude genera auto-respuesta
            │
            └── sendAutoReplyEmail() → Postfix → email del visitante
```

**Emails que se envian:**
1. **Notificacion al admin**: De `info@lasgrutasdepartamentos.com` a `info@lasgrutasdepartamentos.com` → reenviado a `sergiomachado82@gmail.com` via virtual alias de Postfix
2. **Auto-respuesta al visitante**: De `info@lasgrutasdepartamentos.com` al email que ingreso el visitante, con respuesta generada por Claude

Ambos emails se firman con DKIM (OpenDKIM) y pasan SPF (IPv4 66.97.40.119 autorizada).
