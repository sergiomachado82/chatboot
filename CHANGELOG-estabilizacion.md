# Estabilizacion del Producto — Changelog

**Fecha:** Marzo 2026
**Total:** 60 issues implementados en 7 batches + 1 hotfix critico (2 bugs)
**Archivos nuevos:** 6 | **Archivos modificados:** ~40
**Documentacion adicional:** `docs/BUG-pewmafe-no-disponible.md`

---

## BATCH 1: Foundation (9 issues)

Infraestructura base para manejo de errores, configuracion y resiliencia.

### 1.1 Custom error classes
**Archivo nuevo:** `server/src/utils/errors.ts`
- Clase base `AppError(statusCode, message, code?, details?)`
- Subclases: `ValidationError` (400), `NotFoundError` (404), `UnauthorizedError` (401)
- Todas extienden `Error` con `statusCode` y `code` opcionales

### 1.2 Async route wrapper
**Archivo nuevo:** `server/src/utils/asyncHandler.ts`
- Funcion `asyncHandler(fn)` que envuelve handlers async
- Captura errores y los pasa automaticamente a `next()` de Express
- Elimina la necesidad de try/catch repetitivo en cada ruta

### 1.3 Standardizar error responses
**Modificado:** `server/src/middleware/errorHandler.ts`
- Detecta `AppError` → responde con `{ error, message, details?, requestId? }`
- Detecta `ZodError` → responde con `{ error: 'VALIDATION_ERROR', details }` (400)
- Default → 500 con mensaje generico en produccion (sin leak de detalles internos)
- Incluye `requestId` en todas las respuestas de error

### 1.4 Request ID middleware
**Archivo nuevo:** `server/src/middleware/requestId.ts`
- Genera UUID por request usando `crypto.randomUUID()`
- Reutiliza header `x-request-id` si viene del cliente
- Asigna `req.id` disponible en toda la cadena de middleware

**Modificado:** `server/src/app.ts` — se agrega antes de `requestLogger`
**Modificado:** `server/src/middleware/requestLogger.ts` — incluye `req.id` en todos los logs

### 1.5 Mover hardcoded values a env
**Modificado:** `server/src/config/env.ts`
- Nuevas variables:
  - `CLAUDE_CLASSIFIER_MODEL` (default: `claude-haiku-4-5-20251001`)
  - `CLAUDE_RESPONSE_MODEL` (default: `claude-sonnet-4-5-20250929`)
  - `CLAUDE_TIMEOUT_MS` (default: `30000`)
  - `RATE_LIMIT_WINDOW_MS` (default: `900000` = 15 min)
  - `RATE_LIMIT_MAX_REQUESTS` (default: `100`)
  - `JWT_EXPIRY` (default: `24h`)
  - `WA_API_VERSION` (default: `v21.0`)
  - `ALLOWED_ORIGINS` (default: `*`)
  - `PRISMA_POOL_SIZE` (default: `10`)
- `JWT_SECRET` ahora requiere minimo 32 caracteres
- Validacion `superRefine`: en produccion, `ANTHROPIC_API_KEY` y `WA_ACCESS_TOKEN` son obligatorios

**Modificados:**
- `claudeService.ts` — usa `env.CLAUDE_CLASSIFIER_MODEL`, `env.CLAUDE_RESPONSE_MODEL`, `env.CLAUDE_TIMEOUT_MS`
- `whatsappService.ts` — usa `env.WA_API_VERSION`
- `authService.ts` — usa `env.JWT_EXPIRY`
- `rateLimiter.ts` — usa `env.RATE_LIMIT_WINDOW_MS`, `env.RATE_LIMIT_MAX_REQUESTS`

### 1.6 Toast notifications (frontend)
**Instalado:** `react-hot-toast`
**Modificado:** `src/main.tsx` — agrega `<Toaster position="top-right" />`

### 1.7 ErrorBoundary (frontend)
**Archivo nuevo:** `src/components/ui/ErrorBoundary.tsx`
- Class component con `getDerivedStateFromError`
- UI de recovery con boton "Recargar pagina"
- Envuelve toda la app en `src/main.tsx`

### 1.8 API timeout (frontend)
**Modificado:** `src/api/apiClient.ts`
- `AbortController` con timeout de 15 segundos en `apiFetch()`
- Mensaje en espanol: "La solicitud tardo demasiado. Intenta de nuevo."

### 1.9 Query retry backoff (frontend)
**Modificado:** `src/main.tsx`
- `retry: 2` (maximo 2 reintentos)
- `retryDelay: (i) => Math.min(1000 * 2 ** i, 10000)` (backoff exponencial, max 10s)

---

## BATCH 2: Backend Critical (9 issues)

Transacciones atomicas, retry, idempotencia y timeouts.

### 2.1 Transaction: createReserva
**Modificado:** `server/src/services/reservaService.ts`
- `reserva.create` + `inventario.updateMany` (blockDates) dentro de `prisma.$transaction`
- Sheets sync queda fuera de la transaccion (fire-and-forget)
- Si falla el bloqueo de fechas, la reserva no se crea

### 2.2 Transaction: updateReservaEstado cancelada
**Modificado:** `server/src/services/reservaService.ts`
- `reserva.update` + `inventario.updateMany` (releaseDates) dentro de `prisma.$transaction`
- Al cancelar, las fechas se liberan atomicamente con el cambio de estado

### 2.3 Transaction: createBloqueo
**Modificado:** `server/src/routes/complejos.ts`
- `bloqueo.create` + `inventario.updateMany` dentro de `prisma.$transaction`
- Usa `tx.bloqueo.create` y `tx.inventario.updateMany` inline

### 2.4 Sheets sync retry
**Modificado:** `server/src/services/sheetsService.ts`
- Funcion `withRetry(fn, maxRetries=3)` con delay exponencial (1s, 2s, 3s)
- `syncReservaToSheet` envuelto en `withRetry`
- Cada intento se loguea con `logger.warn`

### 2.5 Webhook idempotency
**Modificado:** `server/src/services/webhookProcessor.ts`
- Al inicio de `processIncomingMessage`: busca `mensaje` con `waMessageId === id`
- Si ya existe, skip silencioso (evita procesamiento duplicado)

### 2.6 Webhook signature raw body
**Modificado:** `server/src/app.ts` — `express.json({ verify })` captura raw body como Buffer
**Modificado:** `server/src/middleware/webhookSignature.ts` — usa `req.rawBody` (Buffer) en vez de `JSON.stringify(req.body)` para verificacion de firma correcta

### 2.7 WhatsApp: throw + timeout
**Modificado:** `server/src/services/whatsappService.ts`
- `sendText`/`sendImage`: `AbortController` con 10s timeout, throw en non-200
- `sendWhatsAppMessage`: try/catch, retorna `{ success: boolean }`
- Mensajes de error descriptivos con status code

### 2.8 Claude API timeout
**Modificado:** `server/src/services/claudeService.ts`
- Timeout configurable via `env.CLAUDE_TIMEOUT_MS` en las 3 llamadas a `messages.create`
- Clasificador, respuesta y transcripcion — todos con timeout

### 2.9 Audio fallback: escalar a humano
**Modificado:** `server/src/services/webhookProcessor.ts`
- En catch de transcripcion fallida:
  - Actualiza conversacion a `espera_humano`
  - Crea mensaje system "Audio no pudo ser procesado"
  - Envia mensaje al huesped: "No pude procesar tu audio, un agente te va a contactar"

---

## BATCH 3: Backend Validation & Auth (8 issues)

Validacion Zod en todas las rutas, mejoras de autenticacion.

### 3.1 Zod: PATCH /huespedes/:id
**Modificado:** `server/src/routes/huespedes.ts`
- Schema: `{ nombre, telefono, email, notas }` todos opcionales
- Validaciones de longitud y formato

### 3.2 Zod: PUT /inventario/:id
**Modificado:** `server/src/routes/inventario.ts`
- Schema: `{ disponible: boolean, precio: number.min(0), notas: string.max(1000) }`
- Query params validados: `mes` (0-11), `anio` (2020-2100)

### 3.3 Zod: POST /conversaciones/:id/mensajes
**Modificado:** `server/src/routes/conversaciones.ts`
- Schema: `{ contenido: string.min(1).max(4096) }`
- Query params mensajes: `limit` (1-200), `before` (datetime)

### 3.4 Query params validation
**Modificados:**
- `inventario.ts` — valida `mes`, `anio`
- `conversaciones.ts` — valida `limit`, `before`
- `reservas.ts` — valida `from`/`to` (YYYY-MM-DD regex), `estado` (enum)

### 3.5 JWT: expired vs invalid + login logging
**Modificado:** `server/src/services/authService.ts`
- `verifyToken` retorna tipo discriminado:
  ```typescript
  type VerifyResult =
    | { valid: true; payload: TokenPayload }
    | { valid: false; reason: 'expired' | 'invalid' };
  ```

**Modificado:** `server/src/middleware/authMiddleware.ts`
- Responde "Token expired" (401) vs "Invalid token" (401) segun `reason`

**Modificado:** `server/src/routes/auth.ts`
- `logger.warn({ email }, 'Failed login attempt')` en login fallido

**Modificado:** `server/src/services/socketManager.ts`
- Adaptado al nuevo tipo de retorno de `verifyToken`

### 3.6 CORS restrictivo
**Modificado:** `server/src/app.ts`
- Parsea `env.ALLOWED_ORIGINS` (CSV o `*`)
- Mismo config CORS aplicado a Express y Socket.io

**Modificado:** `server/src/services/socketManager.ts`
- CORS de Socket.io usa misma lista de origenes permitidos

### 3.7 JWT_SECRET min 32
**Modificado:** `server/src/config/env.ts`
- `JWT_SECRET: z.string().min(32)` — fuerza secretos fuertes

### 3.8 Production env validation
**Modificado:** `server/src/config/env.ts`
- `.superRefine()` valida que `ANTHROPIC_API_KEY` y `WA_ACCESS_TOKEN` existan en produccion
- En desarrollo, estas variables son opcionales

---

## BATCH 4: Backend Resilience & Performance (10 issues)

Rate limiting mejorado, graceful shutdown, optimizaciones de queries.

### 4.1 Redis rate limiter
**Reescrito:** `server/src/middleware/rateLimiter.ts`
- Redis como storage principal (prefix `chatboot:ratelimit:api:`)
- Fallback automatico a Map en memoria si Redis falla
- Patron consistente con `rateLimitWhatsApp.ts`

### 4.2 Prisma pool size configurable
**Modificado:** `server/src/config/env.ts` — `PRISMA_POOL_SIZE: z.coerce.number().default(10)`
**Modificado:** `server/src/lib/prisma.ts` — appende `connection_limit` al DATABASE_URL

### 4.3 Graceful shutdown
**Modificado:** `server/src/index.ts`
- Intercepta `SIGTERM` y `SIGINT`
- 2 segundos de gracia para requests en vuelo (`server.closeAllConnections()`)
- Cierra Redis y Prisma
- Timeout hard de 10 segundos

### 4.4 Cleanup: verificar ultimo mensaje
**Modificado:** `server/src/services/conversacionCleanup.ts`
- Usa `ultimoMensajeEn` con fallback a `actualizadoEn` via clausula OR
- Mas preciso que usar solo `actualizadoEn`

### 4.5 Entity TTL 24h
**Modificado:** `server/src/services/botEngine.ts`
- En `getAccumulatedEntities`: si ultimo mensaje bot > 24h, retorna `{}`
- Evita arrastrar entidades obsoletas de conversaciones viejas

### 4.6 Eliminar query redundante getOccupiedDepartments
**Modificado:** `server/src/services/botEngine.ts`
- Departamentos ocupados se derivan de los resultados de `checkAvailability`
- Elimina una query extra a la base de datos

### 4.7 Batch fetch min-stay (N+1 fix)
**Modificado:** `server/src/services/botEngine.ts`
- Un solo `prisma.complejo.findMany({ where: { nombre: { in: complejoNames } } })`
- Reemplaza N llamadas individuales a `findFirst` (N+1 query)

### 4.8 Paginacion mensajes con cursor
**Modificado:** `server/src/services/mensajeService.ts`
- `getByConversacion` acepta param `before` (cursor)
- Retorna `{ mensajes, nextCursor, hasMore }`
- Fetch limit+1 para determinar `hasMore`

**Modificado:** `server/src/routes/conversaciones.ts` — responde con nuevo formato
**Modificado:** `src/api/conversacionApi.ts` — unwraps `result.mensajes`

### 4.9 Health check ping Claude
**Modificado:** `server/src/routes/health.ts`
- Llama `count_tokens` endpoint de Claude API
- Cache de 60 segundos para no saturar la API

### 4.10 Redis key prefix
**Modificado:** `server/src/middleware/rateLimitWhatsApp.ts`
- Key prefix cambiado a `chatboot:ratelimit:wa:` (consistente con el rate limiter de API)

---

## BATCH 5: Frontend Critical (7 issues)

Error handling, socket reconnection, feedback al usuario.

### 5.1 Wrap con ErrorBoundary
**Modificado:** `src/main.tsx`
- `<ErrorBoundary>` envuelve `<QueryClientProvider>` y toda la app
- Captura errores de renderizado y muestra UI de recovery

### 5.2 Toast en todas las mutations
**Modificados:**
- `src/components/reservas/ReservaList.tsx` — `onError` muestra error inline en modal (no cierra)
- `src/components/complejos/ComplejoEditModal.tsx` — `onError` con `toast.error()`
- `src/components/chat/ChatHeader.tsx` — `onError` con `toast.error()`

### 5.3 Socket reconnection + status
**Reescrito:** `src/hooks/useSocket.ts`
- Reconnection automatica: 10 intentos con delay exponencial
- `useSocketStatus()` hook via `useSyncExternalStore`
- `disconnectSocket()` funcion exportada
- `connect_error` con "Invalid token" → auto-reload

### 5.4 ChatWindow: loading + error
**Modificado:** `src/components/chat/ChatWindow.tsx`
- State `sending` — deshabilita input durante envio
- `toast.error()` si el envio falla
- Placeholder cambia a "Enviando..." durante envio

### 5.5 Simulator: toast en error
**Modificado:** `src/components/simulator/WhatsAppSimulator.tsx`
- `toast.error()` reemplaza `console.error()` en errores de envio y audio

### 5.6 Login: mensajes especificos
**Modificado:** `src/components/auth/LoginPage.tsx`
- Parsea tipo de error: credenciales invalidas / error de red / error del servidor
- Mensajes en espanol descriptivos

### 5.7 ReservaList: error inline en modal
**Modificado:** `src/components/reservas/ReservaList.tsx`
- State `modalError` — muestra error dentro del modal (fondo rojo)
- NO cierra el modal en error — el usuario puede corregir y reintentar

---

## BATCH 6: Frontend State & Data (7 issues)

Deduplicacion, sincronizacion, fechas UTC.

### 6.1 Query key consistency
Verificado — ya funciona correctamente con partial matching de TanStack Query.

### 6.2 Socket dedup con Set
**Modificado:** `src/hooks/useChat.ts`
- `processedIds = useRef(new Set())` para evitar mensajes duplicados via socket
- Limite de 500 IDs en el Set (limpia los mas viejos)

### 6.3 Esperar query inicial
**Modificado:** `src/hooks/useChat.ts`
- Guard `isInitialLoadDone` antes de procesar eventos de socket
- Evita que mensajes de socket se pierdan o dupliquen durante carga inicial

### 6.4 Date parsing UTC
**Modificado:** `src/components/reservas/ReservaCalendar.tsx`
- Helper `parseUTCDate(iso)` — parsea fecha como local evitando shift de timezone

**Modificado:** `src/components/reservas/ReservaList.tsx`
- `parseUTCDate()` y `fmtDate()` con mismo patron UTC-safe
- Evita el bug de off-by-one en fechas

### 6.5 Socket: disconnect en logout
**Modificado:** `src/api/authApi.ts`
- Llama `disconnectSocket()` antes de limpiar localStorage

**Modificado:** `src/hooks/useSocket.ts`
- `connect_error` con "Invalid token" → `window.location.reload()`

### 6.6 Disable buttons durante mutations
**Modificado:** `src/components/reservas/ReservaList.tsx`
- `disabled={updateEstadoMut.isPending}` en botones Confirmar/Cancelar/Completar

### 6.7 Health check retry
**Modificado:** `src/components/layout/Header.tsx`
- Retry con backoff exponencial (max 3 intentos)
- Si los 3 fallan, `setHealth(null)` (indicador gris)

---

## BATCH 7: Frontend UX & Accessibility (10 issues)

Validacion, paginacion, responsive, accesibilidad.

### 7.1 Form validation en tiempo real
**Modificado:** `src/components/reservas/ReservaList.tsx`
- Validacion en `handleSubmit`: nombre requerido, fechas requeridas, fecha salida > entrada
- Errores mostrados inline en el modal (`modalError`)

### 7.2 Paginacion ReservaList
**Modificado:** `server/src/services/reservaService.ts`
- `listReservas(estado?, page=1, pageSize=20)` con `skip/take` + `count`
- Retorna `{ reservas, total, page, totalPages }`

**Modificado:** `server/src/routes/reservas.ts`
- Params `page` (min 1) y `pageSize` (min 1, max 100) en query schema

**Modificado:** `src/api/reservaApi.ts`
- `getReservas(estado?, page, pageSize)` con `URLSearchParams`
- Tipo `ReservaPage` exportado

**Modificado:** `src/hooks/useReservas.ts`
- `useReservas(estado?, page)` — queryKey incluye pagina

**Modificado:** `src/components/reservas/ReservaList.tsx`
- State `page`, controles Anterior/Siguiente
- Reset a pagina 1 al cambiar filtro
- Muestra "Pagina X de Y (N reservas)"

### 7.3 Confirmacion destructivas
**Modificado:** `src/components/reservas/ReservaList.tsx`
- `window.confirm()` antes de cancelar reserva

**Modificado:** `src/components/chat/ChatHeader.tsx`
- `window.confirm()` antes de cerrar conversacion

### 7.4 Skeleton loaders
**Archivo nuevo:** `src/components/ui/Skeleton.tsx`
- `TableSkeleton({ rows, cols })` — filas animadas con pulse
- `CardSkeleton({ count })` — cards animados en grid

**Modificado:** `src/components/reservas/ReservaList.tsx` — `<TableSkeleton>` reemplaza "Cargando..."
**Modificado:** `src/components/complejos/ComplejoList.tsx` — `<CardSkeleton>` reemplaza "Cargando..."

### 7.5 Modal keyboard: Escape handler
**Archivo nuevo:** `src/hooks/useModalKeyboard.ts`
- Hook con listener de Escape y auto-focus del contenedor
- Retorna `ref` para el contenedor del modal

**Modificado:** `src/components/reservas/ReservaList.tsx`
- `useModalKeyboard(closeModal)` + `ref={modalRef}` + `tabIndex={-1}`

**Modificado:** `src/components/complejos/ComplejoEditModal.tsx`
- `useModalKeyboard(handleCloseWithDirtyCheck)` + `ref={modalRef}` + `tabIndex={-1}`

### 7.6 ARIA labels
**Modificados:**
- `Header.tsx` — `aria-label="Estado de servicios"` + `aria-expanded` en dropdown de health
- `ChatInput.tsx` — `aria-label="Enviar mensaje"` en boton Send (solo icono)
- `ChatHeader.tsx` — `aria-label="Tomar control de la conversacion"`
- `ReservaList.tsx` — `aria-label="Editar reserva"` y `aria-label="Cerrar modal"`
- `ComplejoEditModal.tsx` — `aria-label="Cerrar modal"`

### 7.7 Sidebar responsive
**Modificado:** `src/App.tsx`
- Chat list: `w-full md:w-80` — ocupa todo el ancho en mobile, 320px en desktop
- Chat list: `hidden md:block` cuando hay conversacion seleccionada
- Chat window: `hidden md:flex` cuando no hay conversacion
- Guest sidebar: `hidden lg:block` — solo visible en pantallas grandes
- Boton "Volver" visible solo en mobile (`md:hidden`) para volver a la lista

### 7.8 Simulator mobile
**Modificado:** `src/components/simulator/WhatsAppSimulator.tsx`
- Agrega `max-w-[calc(100vw-2rem)]` al contenedor
- Evita overflow horizontal en pantallas chicas

### 7.9 Unsaved changes warning
**Modificado:** `src/components/reservas/ReservaList.tsx`
- Trackea `initialForm` state al abrir modal
- `closeModal()` compara form actual vs inicial con `JSON.stringify`
- Si hay cambios: `window.confirm('Hay cambios sin guardar...')`

**Modificado:** `src/components/complejos/ComplejoEditModal.tsx`
- Trackea `initialFormRef` y `initialAmenitiesRef`
- `isDirty` computed comparando form + amenities vs estado inicial
- `handleCloseWithDirtyCheck()` usado en X, Cancel y Escape
- Save exitoso cierra sin preguntar (via `onClose` directo en `onSuccess`)

### 7.10 Cleanup imports
- Server: `npx tsc --noEmit` — 0 errores reales (solo warnings TS6059 pre-existentes)
- Frontend: `npx tsc --noEmit` — 0 errores

---

## HOTFIX: Pewmafe reportado como no disponible (2 bugs)

Detectado en testing post-batch 7. Pewmafe aparecia como "no disponible" a pesar de tener inventario libre.

### HF-1: Reservas `completada` bloqueaban disponibilidad
**Modificado:** `server/src/services/inventarioService.ts` (3 queries)

**Root cause:** `checkAvailability()` excluia solo reservas `cancelada`/`cancelado` del conteo de conflictos. Una reserva con estado `completada` (huesped ya hizo checkout) seguia contando como conflicto, bloqueando el departamento.

**Ejemplo:** Reserva de "Macarena" en Pewmafe (Mar 11-14, estado `completada`) impedia mostrar Pewmafe como disponible para cualquier fecha que se superpusiera, a pesar de que el inventario estaba liberado (`disponible: true`).

**Fix:**
```diff
- estado: { notIn: ['cancelada', 'cancelado'] },
+ estado: { notIn: ['cancelada', 'cancelado', 'completada'] },
```
Aplicado en las 3 queries de conflicto: `checkAvailability`, `getOccupiedDepartments`, `releaseDatesIfNotReserved`.

### HF-2: Departamentos no verificados listados como "NO DISPONIBLES"
**Modificado:** `server/src/services/botEngine.ts`

**Root cause:** Cuando el usuario preguntaba por un departamento especifico (ej: "tiene Pewmafe?"), `checkAvailability` solo verificaba ESE departamento. Luego `botEngine.ts` calculaba:

```typescript
const occupied = ALL_HABITATIONS.filter(h => !availableNames.has(h));
```

Esto listaba todos los departamentos NO verificados como "NO DISPONIBLES" en el contexto de Claude. Resultado: Claude recibia informacion falsa ("Luminar, LG no disponibles") cuando en realidad nunca fueron consultados.

**Fix:**
```diff
- const occupied = ALL_HABITATIONS.filter(h => !availableNames.has(h));
+ if (!habitacion) {
+   const occupied = ALL_HABITATIONS.filter(h => !availableNames.has(h));
+   // ... solo derivar ocupados cuando se verifican TODOS los departamentos
+ }
```

### Verificacion post-fix
```
Input:  "Hola quiero saber si pewmafe esta disponible del 11 al 15 de marzo"
Output: "Sí, Pewmafe está disponible. $280.000 ARS (4 noches). ¿Querés reservar?"
```

**Documentacion completa:** ver `docs/BUG-pewmafe-no-disponible.md`

---

## Resumen de archivos

### Archivos nuevos (6)
| Archivo | Descripcion |
|---------|------------|
| `server/src/utils/errors.ts` | Clases de error custom (AppError, ValidationError, etc.) |
| `server/src/utils/asyncHandler.ts` | Wrapper async para handlers Express |
| `server/src/middleware/requestId.ts` | Middleware de request ID (UUID) |
| `src/components/ui/ErrorBoundary.tsx` | React error boundary con UI de recovery |
| `src/components/ui/Skeleton.tsx` | Skeleton loaders (tabla y cards) |
| `src/hooks/useModalKeyboard.ts` | Hook para Escape y focus en modales |

### Archivos modificados — Backend (~20)
| Archivo | Cambios |
|---------|---------|
| `config/env.ts` | +12 env vars, JWT min 32, produccion validation |
| `app.ts` | requestId middleware, CORS env, raw body |
| `middleware/errorHandler.ts` | AppError + ZodError detection, requestId |
| `middleware/requestLogger.ts` | req.id en logs |
| `middleware/rateLimiter.ts` | Redis primary + Map fallback |
| `middleware/rateLimitWhatsApp.ts` | Key prefix consistente |
| `middleware/authMiddleware.ts` | Expired vs invalid token |
| `middleware/webhookSignature.ts` | Raw body para firma |
| `services/claudeService.ts` | Env vars para modelos y timeout |
| `services/whatsappService.ts` | Timeout 10s, throw non-200 |
| `services/authService.ts` | VerifyResult discriminated union, JWT_EXPIRY |
| `services/reservaService.ts` | Transactions, paginacion |
| `services/inventarioService.ts` | Export dateRange(), excluir `completada` de conflictos (HF-1) |
| `services/sheetsService.ts` | withRetry(3) |
| `services/webhookProcessor.ts` | Idempotencia, audio fallback |
| `services/botEngine.ts` | Entity TTL, N+1 fix, no redundant query, fix occupied derivation (HF-2) |
| `services/mensajeService.ts` | Cursor pagination |
| `services/socketManager.ts` | Nuevo verifyToken, CORS env |
| `services/conversacionCleanup.ts` | ultimoMensajeEn fallback |
| `routes/reservas.ts` | Zod query + paginacion |
| `routes/conversaciones.ts` | Zod query + body |
| `routes/huespedes.ts` | Zod PATCH schema |
| `routes/inventario.ts` | Zod query + PUT |
| `routes/complejos.ts` | Bloqueo transaction |
| `routes/auth.ts` | Login failure logging |
| `routes/health.ts` | Claude ping + cache 60s |
| `lib/prisma.ts` | Connection pool configurable |
| `index.ts` | Graceful shutdown |

### Archivos modificados — Frontend (~15)
| Archivo | Cambios |
|---------|---------|
| `main.tsx` | Toaster, ErrorBoundary, retry backoff |
| `App.tsx` | Sidebar responsive, mobile back button |
| `api/apiClient.ts` | AbortController timeout 15s |
| `api/reservaApi.ts` | Paginacion params, ReservaPage type |
| `api/conversacionApi.ts` | Unwrap mensajes pagination |
| `api/authApi.ts` | disconnectSocket en logout |
| `hooks/useSocket.ts` | Reconnection, status, disconnect |
| `hooks/useChat.ts` | Dedup Set, initial load guard |
| `hooks/useReservas.ts` | Paginacion param |
| `components/reservas/ReservaList.tsx` | Toast, modal error, validation, pagination, skeleton, keyboard, ARIA, dirty check, UTC dates |
| `components/reservas/ReservaCalendar.tsx` | UTC date parsing |
| `components/complejos/ComplejoEditModal.tsx` | Toast, keyboard, dirty check, ARIA |
| `components/complejos/ComplejoList.tsx` | CardSkeleton |
| `components/chat/ChatHeader.tsx` | Toast, confirm, ARIA |
| `components/chat/ChatWindow.tsx` | Sending state, toast |
| `components/chat/ChatInput.tsx` | ARIA label |
| `components/simulator/WhatsAppSimulator.tsx` | Toast, responsive width |
| `components/auth/LoginPage.tsx` | Error messages especificos |
| `components/layout/Header.tsx` | Health retry, ARIA |

---

## Dependencias agregadas
| Paquete | Version | Motivo |
|---------|---------|--------|
| `react-hot-toast` | ^2.x | Notificaciones toast para errores y exitos |

---

## Variables de entorno nuevas

```env
# Claude AI
CLAUDE_CLASSIFIER_MODEL=claude-haiku-4-5-20251001
CLAUDE_RESPONSE_MODEL=claude-sonnet-4-5-20250929
CLAUDE_TIMEOUT_MS=30000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Auth
JWT_EXPIRY=24h
JWT_SECRET=  # minimo 32 caracteres

# WhatsApp
WA_API_VERSION=v21.0

# CORS
ALLOWED_ORIGINS=*  # o CSV: http://localhost:5173,https://midominio.com

# Database
PRISMA_POOL_SIZE=10
```

Todas las variables tienen valores por defecto sensatos para desarrollo. En produccion, `ANTHROPIC_API_KEY` y `WA_ACCESS_TOKEN` son obligatorias.
