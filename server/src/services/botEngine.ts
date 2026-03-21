import { logger } from '../utils/logger.js';
import { classifyIntent, generateResponse, type Intent } from './claudeService.js';
import { createMensaje, getByConversacion } from './mensajeService.js';
import { updateConversacionEstado } from './conversacionService.js';
import { sendWhatsAppMessage, sendImage } from './whatsappService.js';
import { checkAvailability } from './inventarioService.js';
import { createReserva } from './reservaService.js';
import { prisma } from '../lib/prisma.js';
import { getDepartmentImages } from '../data/accommodationContext.js';
import { getSeason } from './inventarioSyncService.js';
import { getArgentinaToday, formatLocalDate } from '../utils/dateUtils.js';
import { getBotConfig } from './botConfigService.js';
import { logIntegrationError } from './integrationLogService.js';

interface BotContext {
  conversacionId: string;
  huespedId?: string;
  huespedWaId: string;
  mensaje: string;
}

/** Only these entity keys are meaningful to our bot logic */
const VALID_ENTITY_KEYS = new Set(['num_personas', 'fecha_entrada', 'fecha_salida', 'habitacion', 'nombre_huesped', 'telefono', 'dni']);

/** YYYY-MM-DD pattern */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Server-side safety net: resolve relative date strings that the classifier
 * failed to convert to YYYY-MM-DD. Returns the resolved date or null.
 * Uses Argentina timezone (UTC-3) to avoid date drift at night.
 */
function resolveRelativeDate(value: string): string | null {
  const lower = value.toLowerCase().trim();
  const todayStr = getArgentinaToday();
  const [y, m, d] = todayStr.split('-').map(Number);

  if (lower === 'hoy') {
    return todayStr;
  }
  if (lower === 'mañana' || lower === 'manana') {
    return formatLocalDate(new Date(y, m - 1, d + 1));
  }
  if (lower === 'pasado mañana' || lower === 'pasado manana') {
    return formatLocalDate(new Date(y, m - 1, d + 2));
  }
  return null;
}

/**
 * Sanitize entities from the classifier:
 * 1. Only keep recognized keys
 * 2. Filter out null/undefined/"null"/empty values
 * 3. Resolve relative dates ("mañana" → YYYY-MM-DD) as safety net
 * 4. Compute fecha_salida from fecha_entrada + num_noches if possible
 */
function sanitizeEntities(raw: Record<string, unknown>): Record<string, string> {
  const clean: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (VALID_ENTITY_KEYS.has(key) && value != null && value !== 'null' && value !== '') {
      clean[key] = String(value);
    }
  }

  // Safety net: resolve relative dates that classifier failed to convert
  for (const dateKey of ['fecha_entrada', 'fecha_salida'] as const) {
    if (clean[dateKey] && !DATE_REGEX.test(clean[dateKey])) {
      const resolved = resolveRelativeDate(clean[dateKey]);
      if (resolved) {
        clean[dateKey] = resolved;
        logger.info({ original: clean[dateKey], resolved, key: dateKey }, 'Resolved relative date server-side');
      } else {
        // Not a valid date and can't resolve — remove to avoid garbage data
        logger.warn({ value: clean[dateKey], key: dateKey }, 'Removing unresolvable date entity');
        delete clean[dateKey];
      }
    }
  }

  // Validate DNI: must be a number between 5_000_000 and 99_999_999
  if (clean.dni) {
    const dniNum = parseInt(clean.dni.replace(/\./g, ''), 10);
    if (isNaN(dniNum) || dniNum < 5_000_000 || dniNum > 99_999_999) {
      logger.warn({ value: clean.dni }, 'Removing invalid DNI entity (out of range 5M-99.999.999)');
      delete clean.dni;
    } else {
      clean.dni = String(dniNum); // normalize (remove dots)
    }
  }

  // If classifier gave us num_noches/noches but no fecha_salida, compute it
  if (clean.fecha_entrada && !clean.fecha_salida) {
    const nochesRaw = raw.num_noches ?? raw.noches ?? raw.cantidad_noches;
    if (nochesRaw) {
      const n = parseInt(String(nochesRaw), 10);
      if (n > 0) {
        const d = new Date(clean.fecha_entrada);
        d.setDate(d.getDate() + n);
        clean.fecha_salida = d.toISOString().slice(0, 10);
      }
    }
  }

  return clean;
}

/**
 * Accumulate known entities from bot messages in the current conversation,
 * but ONLY from messages AFTER the last "saludo" intent.
 * This ensures a "hola" effectively resets the conversation state.
 */
const ENTITY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getAccumulatedEntities(conversacionId: string): Promise<Record<string, string>> {
  const botMessages = await prisma.mensaje.findMany({
    where: {
      conversacionId,
      origen: 'bot',
      metadata: { not: undefined },
    },
    orderBy: { creadoEn: 'asc' },
  });

  // TTL: if last bot message is older than 24h, return empty entities
  const lastBotMsg = botMessages[botMessages.length - 1];
  if (lastBotMsg && Date.now() - new Date(lastBotMsg.creadoEn).getTime() > ENTITY_TTL_MS) {
    return {};
  }

  // Find the index of the last "saludo" message — we only accumulate from after that point
  let startIdx = 0;
  for (let i = botMessages.length - 1; i >= 0; i--) {
    const meta = botMessages[i].metadata as Record<string, unknown> | null;
    if (meta?.intent === 'saludo') {
      startIdx = i + 1; // start accumulating from the message AFTER the last saludo
      break;
    }
  }

  const accumulated: Record<string, string> = {};

  for (let i = startIdx; i < botMessages.length; i++) {
    const meta = botMessages[i].metadata as Record<string, unknown> | null;
    if (meta?.entities) {
      const entities = sanitizeEntities(meta.entities as Record<string, unknown>);
      for (const [key, value] of Object.entries(entities)) {
        if (value) {
          accumulated[key] = value;
        }
      }
    }
  }

  return accumulated;
}

export async function handleBotMessage(ctx: BotContext): Promise<void> {
  const { conversacionId, huespedWaId, mensaje } = ctx;
  const botConfig = await getBotConfig();

  // 1. Build conversation history (needed for classification and response)
  const { mensajes: historial } = await getByConversacion(conversacionId, 20);
  const conversationHistory = historial
    .filter((m) => m.tipo !== 'system')
    .map((m) => ({
      role: (m.origen === 'huesped' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.contenido,
    }));

  // 2. Classify intent WITH conversation context
  const classification = await classifyIntent(mensaje, conversationHistory);

  // 3. Build accumulated state from ALL previous messages in this conversation
  const accumulated = await getAccumulatedEntities(conversacionId);

  // 4. Merge: current extraction takes priority, accumulated fills gaps
  const genericIntents: Intent[] = ['saludo', 'despedida', 'hablar_humano', 'queja', 'consulta_zona'];
  const isGenericQuery = genericIntents.includes(classification.intent);

  // Sanitize current entities: only keep valid keys, compute fecha_salida from noches if needed
  const currentEntities = sanitizeEntities(classification.entities as Record<string, unknown>);

  // Build merged entities: start with current extraction
  const mergedEntities: Record<string, string> = { ...currentEntities };

  // Carry forward accumulated data for missing fields (within same conversation segment)
  if (!isGenericQuery) {
    for (const [key, value] of Object.entries(accumulated)) {
      if (value && !(key in mergedEntities)) {
        mergedEntities[key] = value;
      }
    }
  }

  // Post-merge: compute fecha_salida if we now have fecha_entrada + noches from classifier
  if (mergedEntities.fecha_entrada && !mergedEntities.fecha_salida) {
    const rawEntities = classification.entities as Record<string, unknown>;
    const nochesRaw = rawEntities.num_noches ?? rawEntities.noches ?? rawEntities.cantidad_noches;
    if (nochesRaw) {
      const n = parseInt(String(nochesRaw), 10);
      if (n > 0) {
        const d = new Date(mergedEntities.fecha_entrada);
        d.setDate(d.getDate() + n);
        mergedEntities.fecha_salida = d.toISOString().slice(0, 10);
      }
    }
  }

  classification.entities = mergedEntities;

  logger.info({
    intent: classification.intent,
    confidence: classification.confidence,
    entities: classification.entities,
    accumulated,
  }, 'Intent classified (with context)');

  // 5. Handle photo requests directly (bypass Claude)
  const photoRegex = /fotos?|imagene?s?|pictures?|mostrame/i.test(mensaje);
  const isPhotoRequest = botConfig.modoEnvioFotos !== 'off' && photoRegex && (
    classification.intent === 'consulta_alojamiento' ||
    classification.intent === 'otro' ||
    classification.intent === 'saludo'
  );
  let photosFailed = false;
  if (isPhotoRequest && classification.entities.habitacion) {
    try {
      const images = await getDepartmentImages(classification.entities.habitacion, 6);
      if (images && images.length > 0) {
        const isWebUser = huespedWaId.startsWith('web_');
        const deptoName = classification.entities.habitacion;
        logger.info({ depto: deptoName, count: images.length, isWebUser }, 'Sending photos directly');

        if (isWebUser) {
          // For web users, include image URLs in metadata for frontend rendering
          const imageUrls = images.map((img) => img.url);
          const respuesta = `Aca te muestro fotos de ${deptoName}:`;
          await createMensaje({
            conversacionId,
            direccion: 'saliente',
            origen: 'bot',
            contenido: respuesta,
            metadata: {
              intent: classification.intent,
              confidence: classification.confidence,
              entities: classification.entities,
              photosSent: images.length,
              imageUrls,
            },
          });
        } else {
          // WhatsApp users: send each image with its caption
          for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const caption = img.caption || `${deptoName} - Foto ${i + 1}`;
            await sendImage(huespedWaId, img.url, caption);
          }
          await createMensaje({
            conversacionId,
            direccion: 'saliente',
            origen: 'bot',
            contenido: `[${images.length} fotos de ${deptoName}]`,
            metadata: {
              intent: classification.intent,
              confidence: classification.confidence,
              entities: classification.entities,
              photosSent: images.length,
            },
          });
        }
        return;
      }
      // No images found — fall through to Claude response
      photosFailed = true;
    } catch (err) {
      logger.error({ err, depto: classification.entities.habitacion }, 'Error fetching/sending photos, falling through to text response');
      logIntegrationError('whatsapp', 'Error enviando fotos', (err as Error).message).catch(() => {});
      photosFailed = true;
    }
  }

  // 6. Handle escalation intents
  const shouldEscalateQueja = botConfig.escalarSiQueja && classification.intent === 'queja';
  const shouldEscalateHumano = classification.intent === 'hablar_humano';
  const shouldEscalateCancelacion = classification.intent === 'cancelar_reserva';
  const shouldEscalateModificacion = classification.intent === 'cambiar_reserva';
  if (shouldEscalateHumano || shouldEscalateQueja || shouldEscalateCancelacion || shouldEscalateModificacion) {
    await updateConversacionEstado(conversacionId, 'espera_humano');

    const respuesta = await generateResponse(classification.intent, classification.entities, [
      ...conversationHistory,
      { role: 'user', content: mensaje },
    ]);

    const systemMessages: Record<string, string> = {
      queja: 'Conversacion escalada por queja del huesped',
      hablar_humano: 'Huesped solicito hablar con un agente',
      cancelar_reserva: 'Huesped solicito cancelar su reserva',
      cambiar_reserva: 'Huesped solicito modificar su reserva',
    };

    await createMensaje({
      conversacionId,
      tipo: 'system',
      direccion: 'saliente',
      origen: 'sistema',
      contenido: systemMessages[classification.intent] ?? 'Conversacion escalada',
    });

    await createMensaje({
      conversacionId,
      direccion: 'saliente',
      origen: 'bot',
      contenido: respuesta,
      metadata: {
        intent: classification.intent,
        confidence: classification.confidence,
        entities: classification.entities,
      },
    });

    await sendWhatsAppMessage(huespedWaId, respuesta);
    return;
  }

  // 7. Handle farewell
  if (classification.intent === 'despedida') {
    const respuesta = await generateResponse(classification.intent, classification.entities, [
      ...conversationHistory,
      { role: 'user', content: mensaje },
    ]);

    await createMensaje({
      conversacionId,
      direccion: 'saliente',
      origen: 'bot',
      contenido: respuesta,
      metadata: {
        intent: classification.intent,
        confidence: classification.confidence,
        entities: classification.entities,
      },
    });

    await sendWhatsAppMessage(huespedWaId, respuesta);
    await updateConversacionEstado(conversacionId, 'cerrado');
    return;
  }

  // Add current message to history
  conversationHistory.push({ role: 'user', content: mensaje });

  // 8. Build additional context with conversation state summary
  let additionalContext = '';
  let availabilityResults: Array<{ habitacion: string; noches: number; precioTotal: number; precioPorNoche: number[] }> | null = null;

  if (photosFailed) {
    additionalContext += 'No tenemos fotos disponibles para enviar por este medio. NO menciones fotos, ni digas que se envian automaticamente, ni des excusas tecnicas. Simplemente describile el departamento con palabras y seguí la conversacion naturalmente.\n';
  }

  // Build a summary of what we already know from the conversation
  const known: string[] = [];
  if (mergedEntities.habitacion) {
    known.push(`Departamento: ${mergedEntities.habitacion}`);
    additionalContext += `Departamento activo en la conversacion: ${mergedEntities.habitacion}. Responde SOLO sobre este departamento.\n`;
  }
  if (mergedEntities.num_personas) {
    known.push(`Personas: ${mergedEntities.num_personas}`);
  }
  if (mergedEntities.fecha_entrada) {
    known.push(`Fecha entrada: ${mergedEntities.fecha_entrada}`);
  }
  if (mergedEntities.fecha_salida) {
    known.push(`Fecha salida: ${mergedEntities.fecha_salida}`);
  }
  if (mergedEntities.nombre_huesped) {
    known.push(`Nombre: ${mergedEntities.nombre_huesped}`);
  }
  if (mergedEntities.telefono) {
    known.push(`Telefono: ${mergedEntities.telefono}`);
  }
  if (mergedEntities.dni) {
    known.push(`DNI: ${mergedEntities.dni}`);
  }

  if (known.length > 0) {
    additionalContext += `\nDATOS YA CONOCIDOS de esta conversacion (NO volver a preguntar):\n${known.join('\n')}\n`;
  }

  // Add capacity constraints when num_personas is known
  if (mergedEntities.num_personas && !isGenericQuery) {
    const numPersonas = parseInt(mergedEntities.num_personas, 10);
    if (numPersonas > 0) {
      const complejos = await prisma.complejo.findMany({
        where: { activo: true },
        select: { nombre: true, capacidad: true, cantidadUnidades: true },
      });

      const capacityInfo: string[] = [];
      let maxTotalCapacity = 0;

      for (const c of complejos) {
        const totalCapacity = c.capacidad * c.cantidadUnidades;
        maxTotalCapacity += totalCapacity;

        if (numPersonas <= c.capacidad) {
          capacityInfo.push(`- ${c.nombre}: APTO (max ${c.capacidad} pers/unidad, SOLO ${c.cantidadUnidades} unidad(es) — NUNCA ofrezcas mas de ${c.cantidadUnidades})`);
        } else {
          capacityInfo.push(`- ${c.nombre}: NO APTO para ${numPersonas} personas (max ${c.capacidad} pers/unidad, SOLO ${c.cantidadUnidades} unidad(es))`);
        }
      }

      additionalContext += `\nANALISIS DE CAPACIDAD para ${numPersonas} personas:\n${capacityInfo.join('\n')}\n`;

      if (numPersonas > maxTotalCapacity) {
        additionalContext += `IMPORTANTE: ${numPersonas} personas EXCEDE la capacidad total combinada de todos nuestros departamentos (${maxTotalCapacity} personas max). Indica que no contamos con capacidad para alojar a tantas personas y sugeri contactar por telefono al ${botConfig.telefonoContacto}.\n`;
      } else if (numPersonas > Math.max(...complejos.map(c => c.capacidad))) {
        const unitLimits = complejos.map(c => `${c.nombre}: maximo ${c.cantidadUnidades} unidad(es)`).join(', ');
        additionalContext += `IMPORTANTE: Ningun departamento individual tiene capacidad para ${numPersonas} personas (max por unidad: ${Math.max(...complejos.map(c => c.capacidad))}). Podes combinar departamentos PERO respeta estos LIMITES ESTRICTOS de unidades: ${unitLimits}. Si un depto tiene 1 sola unidad, SOLO podes ofrecer 1.\n`;
      }
    }
  }

  // Determine what's still missing
  const missing: string[] = [];
  if (!mergedEntities.num_personas) missing.push('cantidad de personas');
  if (!mergedEntities.fecha_entrada || !mergedEntities.fecha_salida) missing.push('fechas de entrada y salida');
  if (!mergedEntities.habitacion) missing.push('preferencia de departamento');
  if (!mergedEntities.nombre_huesped) missing.push('nombre del huesped');
  if (!mergedEntities.telefono) missing.push('numero de celular');
  if (!mergedEntities.dni) missing.push('numero de DNI');

  if (missing.length > 0 && !isGenericQuery) {
    additionalContext += `Datos que FALTAN por preguntar: ${missing.join(', ')}. Solo pregunta por estos datos faltantes.\n`;

    // When asking about prices without dates, explicitly prevent listing all seasonal tariffs
    if (classification.intent === 'consulta_precio' && (!mergedEntities.fecha_entrada || !mergedEntities.fecha_salida)) {
      additionalContext += `IMPORTANTE: NO listes precios por temporada (baja/media/alta). Primero pregunta las fechas para poder dar el precio exacto de la temporada correspondiente.\n`;
    }
  }

  // Check availability whenever we have dates (any intent)
  let { fecha_entrada, fecha_salida } = mergedEntities;
  const { habitacion } = mergedEntities;

  // Validate and fix inverted dates (entrada > salida)
  if (fecha_entrada && fecha_salida && fecha_entrada > fecha_salida) {
    logger.warn({ fecha_entrada, fecha_salida }, 'Inverted dates detected, swapping');
    [fecha_entrada, fecha_salida] = [fecha_salida, fecha_entrada];
    mergedEntities.fecha_entrada = fecha_entrada;
    mergedEntities.fecha_salida = fecha_salida;
    classification.entities = mergedEntities;
    additionalContext += `NOTA: Las fechas del huesped estaban invertidas. Se corrigieron automaticamente: entrada ${fecha_entrada}, salida ${fecha_salida}. Confirma amablemente con el huesped que esas son las fechas correctas.\n`;
  }

  if (fecha_entrada && fecha_salida && !isGenericQuery) {
    try {
      const results = await checkAvailability(
        new Date(fecha_entrada),
        new Date(fecha_salida),
        habitacion
      );
      // Derive occupied departments ONLY when checking ALL departments (no specific habitacion filter)
      if (!habitacion) {
        const allComplejos = await prisma.complejo.findMany({ where: { activo: true }, select: { nombre: true } });
        const allNames = allComplejos.map(c => c.nombre);
        const availableNames = new Set(results.map(r => r.habitacion));
        const occupied = allNames.filter(h => !availableNames.has(h));
        if (occupied.length > 0) {
          additionalContext += `\nDEPARTAMENTOS NO DISPONIBLES para las fechas ${fecha_entrada} a ${fecha_salida} (ya tienen reserva): ${occupied.join(', ')}. NUNCA ofrezcas ni menciones estos departamentos como opcion.\n`;
        }
      }

      if (results.length > 0) {
        availabilityResults = results;
        additionalContext += `Resultados de disponibilidad:\n${results
          .map((r) => `- Depto ${r.habitacion}: disponible, ${r.noches} noches, $${r.precioTotal} ARS total ($${r.precioPorNoche.join(', $')} ARS por noche)`)
          .join('\n')}`;

        // Validate minimum stay for ALL available departments (batch query to avoid N+1)
        const entradaDate = new Date(fecha_entrada);
        const noches = results[0]?.noches ?? 0;
        if (noches > 0) {
          const complejoNames = results.map(r => r.habitacion);
          const complejos = await prisma.complejo.findMany({
            where: { nombre: { in: complejoNames }, activo: true },
            include: { tarifas: true, tarifasEspeciales: true },
          });
          const complejoMap = new Map(complejos.map(c => [c.nombre, c]));

          const minStayLines: string[] = [];
          for (const r of results) {
            try {
              const complejoData = complejoMap.get(r.habitacion);
              if (complejoData) {
                // Priority: TarifaEspecial > Tarifa per season > Complejo.estadiaMinima
                let minNoches: number | null = null;
                let minSource = '';

                // Check TarifaEspecial covering the entry date
                const activeOverride = complejoData.tarifasEspeciales.find(
                  (te) => te.activo && entradaDate >= new Date(te.fechaInicio) && entradaDate < new Date(te.fechaFin)
                );
                if (activeOverride?.estadiaMinima) {
                  minNoches = activeOverride.estadiaMinima;
                  minSource = 'tarifa especial';
                }

                // Fallback: Tarifa per season
                if (!minNoches) {
                  const season = getSeason(entradaDate);
                  const tarifaSeason = complejoData.tarifas.find((t) => t.temporada === season);
                  if (tarifaSeason?.estadiaMinima) {
                    minNoches = tarifaSeason.estadiaMinima;
                    minSource = `temporada ${season}`;
                  }
                }

                // Fallback: Global
                if (!minNoches && complejoData.estadiaMinima) {
                  minNoches = complejoData.estadiaMinima;
                  minSource = 'general';
                }

                if (minNoches && noches < minNoches) {
                  minStayLines.push(`- ${r.habitacion}: REQUIERE MINIMO ${minNoches} noches (${minSource}). El huesped solicita ${noches} noche(s) — NO CUMPLE.`);
                }
                // If noches >= minNoches or no minimum configured: don't mention anything
              }
            } catch (err) {
              logger.error({ err, hab: r.habitacion }, 'Error checking minimum stay');
            }
          }
          if (minStayLines.length > 0) {
            additionalContext += `\nADVERTENCIA ESTADIA MINIMA:\n${minStayLines.join('\n')}\nInforma amablemente al huesped que estos departamentos requieren mas noches y sugeri extender la estadia. Para los demas departamentos NO menciones estadia minima.\n`;
          }
        }
      } else {
        additionalContext += `No hay disponibilidad para las fechas ${fecha_entrada} a ${fecha_salida}${habitacion ? ` en el departamento ${habitacion}` : ''}. Sugiere fechas alternativas cercanas.`;
      }
    } catch (err) {
      logger.error({ err }, 'Error checking availability');
      additionalContext += 'No se pudo consultar la disponibilidad en este momento. Pide disculpas e indica que un agente verificara.';
    }
  }

  // Guard: Validate bank data before generating reservation response
  // 3 scenarios: trusted holder → show data, no data → espera_humano, untrusted holder → espera_humano + fraud warning
  const trustedHolders = (botConfig.titularesVerificados ?? []).map((h: string) => h.toLowerCase().trim());
  let bankDataEscalate = false;

  if (classification.intent === 'reservar' && mergedEntities.habitacion) {
    const deptoData = await prisma.complejo.findFirst({
      where: { activo: true, nombre: mergedEntities.habitacion },
      select: { cbu: true, aliasCbu: true, titularCuenta: true, banco: true, porcentajeReserva: true },
    });

    const hasBankData = !!(deptoData?.cbu || deptoData?.aliasCbu);
    const titular = (deptoData?.titularCuenta ?? '').toLowerCase().trim();

    if (!hasBankData) {
      // Scenario 2: No bank data loaded → escalate to human
      additionalContext += `\nADVERTENCIA DATOS BANCARIOS: El departamento "${mergedEntities.habitacion}" NO tiene datos bancarios cargados. ESTA PROHIBIDO inventar CBU, alias, banco o titular. Decile al huesped que un agente lo va a contactar en breve para pasarle los datos de pago y avanzar con la reserva.\n`;
      bankDataEscalate = true;
    } else if (!trustedHolders.includes(titular)) {
      // Scenario 3: Bank data loaded but untrusted holder → do NOT show, escalate
      logger.warn({ habitacion: mergedEntities.habitacion, titular: deptoData?.titularCuenta }, 'Bank data has untrusted account holder — suppressing');
      additionalContext += `\nADVERTENCIA DATOS BANCARIOS: El departamento "${mergedEntities.habitacion}" tiene datos bancarios pero NO estan verificados. ESTA PROHIBIDO mostrar CBU, alias, banco o titular al huesped. Decile que un agente lo va a contactar en breve para pasarle los datos de pago y avanzar con la reserva.\n`;
      bankDataEscalate = true;
    }
    // Scenario 1: Bank data loaded + trusted holder → allow (no warning added, Claude will use context data)
  }

  if (bankDataEscalate && botConfig.escalarSiPago) {
    await updateConversacionEstado(conversacionId, 'espera_humano');
    await createMensaje({
      conversacionId,
      tipo: 'system',
      direccion: 'saliente',
      origen: 'sistema',
      contenido: 'Conversacion escalada: datos bancarios no disponibles o no verificados para este departamento.',
    });
  }

  const respuesta = await generateResponse(
    classification.intent,
    classification.entities,
    conversationHistory,
    additionalContext
  );

  // 9. Save and send response
  await createMensaje({
    conversacionId,
    direccion: 'saliente',
    origen: 'bot',
    contenido: respuesta,
    metadata: {
      intent: classification.intent,
      confidence: classification.confidence,
      entities: classification.entities,
    },
  });

  await sendWhatsAppMessage(huespedWaId, respuesta);

  // 10. Auto-create reservation when guest confirms PASO 1
  // Detection: intent=reservar, all 4 fields present NOW, and accumulated from previous turns
  // already had all 4 fields (meaning PASO 1 summary was shown and guest is confirming)
  if (botConfig.autoPreReserva && classification.intent === 'reservar' && ctx.huespedId) {
    const allPresent = mergedEntities.habitacion && mergedEntities.fecha_entrada &&
                       mergedEntities.fecha_salida && mergedEntities.num_personas &&
                       mergedEntities.nombre_huesped && mergedEntities.telefono &&
                       mergedEntities.dni;
    const prevHadAll = accumulated.habitacion && accumulated.fecha_entrada &&
                       accumulated.fecha_salida && accumulated.num_personas &&
                       accumulated.nombre_huesped && accumulated.telefono &&
                       accumulated.dni;

    if (allPresent && prevHadAll && availabilityResults) {
      try {
        // Serializable transaction: findFirst + createReserva atomically to prevent race conditions
        await prisma.$transaction(async (tx) => {
          const existing = await tx.reserva.findFirst({
            where: { conversacionId, estado: { notIn: ['cancelada'] } },
          });

          if (existing) return;

          const result = availabilityResults!.find(r => r.habitacion === mergedEntities.habitacion);
          if (!result) return;

          const complejoData = await tx.complejo.findFirst({
            where: { activo: true, nombre: mergedEntities.habitacion },
            select: { porcentajeReserva: true },
          });
          const pctReserva = complejoData?.porcentajeReserva ?? 30;
          const precioTotal = result.precioTotal;
          const montoReserva = Math.round(precioTotal * pctReserva / 100);
          const saldo = precioTotal - montoReserva;
          const avgTarifa = result.precioPorNoche.length > 0
            ? Math.round(result.precioPorNoche.reduce((a, b) => a + b, 0) / result.precioPorNoche.length)
            : undefined;

          const huesped = await tx.huesped.findUnique({
            where: { id: ctx.huespedId },
            select: { nombre: true, telefono: true, dni: true, waId: true },
          });

          // Update huesped record with collected data (name, phone, dni)
          const huespedUpdate: Record<string, string> = {};
          if (mergedEntities.nombre_huesped && !huesped?.nombre) huespedUpdate.nombre = mergedEntities.nombre_huesped;
          if (mergedEntities.telefono && !huesped?.telefono) huespedUpdate.telefono = mergedEntities.telefono;
          if (mergedEntities.dni && !huesped?.dni) huespedUpdate.dni = mergedEntities.dni;
          if (Object.keys(huespedUpdate).length > 0) {
            await tx.huesped.update({ where: { id: ctx.huespedId }, data: huespedUpdate });
          }

          await createReserva({
            huespedId: ctx.huespedId,
            conversacionId,
            nombreHuesped: mergedEntities.nombre_huesped || huesped?.nombre || undefined,
            telefonoHuesped: mergedEntities.telefono || huesped?.telefono || huesped?.waId || undefined,
            dni: mergedEntities.dni || undefined,
            fechaEntrada: new Date(mergedEntities.fecha_entrada),
            fechaSalida: new Date(mergedEntities.fecha_salida),
            numHuespedes: parseInt(mergedEntities.num_personas, 10),
            habitacion: mergedEntities.habitacion,
            precioTotal,
            tarifaNoche: avgTarifa,
            montoReserva: pctReserva > 0 ? montoReserva : undefined,
            saldo: pctReserva > 0 ? saldo : undefined,
            origenReserva: 'WhatsApp',
          });

          logger.info({ conversacionId, habitacion: mergedEntities.habitacion, precioTotal }, 'Auto-created reservation from bot conversation');
        }, { isolationLevel: 'Serializable' });
      } catch (err) {
        logger.error({ err }, 'Error auto-creating reservation');
        logIntegrationError('reservas', 'Error creando reserva automatica', (err as Error).message).catch(() => {});
      }
    }
  }
}
