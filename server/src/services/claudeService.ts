import Anthropic from '@anthropic-ai/sdk';
import type { TextBlockParam } from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getFullContext, getFilteredContext } from '../data/accommodationContext.js';
import { getArgentinaToday } from '../utils/dateUtils.js';
import { getBotConfig } from './botConfigService.js';
import type { BotConfig } from '@prisma/client';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export type Intent =
  | 'saludo'
  | 'consulta_disponibilidad'
  | 'consulta_precio'
  | 'consulta_alojamiento'
  | 'consulta_zona'
  | 'reservar'
  | 'cancelar_reserva'
  | 'cambiar_reserva'
  | 'hablar_humano'
  | 'queja'
  | 'despedida'
  | 'otro';

interface ClassifyResult {
  intent: Intent;
  confidence: number;
  entities: Record<string, string>;
}

export async function classifyIntent(
  message: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ClassifyResult> {
  if (!env.ANTHROPIC_API_KEY) {
    return classifyIntentFallback(message);
  }

  try {
    // Build messages with conversation context
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (conversationHistory && conversationHistory.length > 0) {
      // Include last few messages for context
      const recentHistory = conversationHistory.slice(-6);
      messages.push(...recentHistory);
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const todayStr = getArgentinaToday();
    logger.debug({ todayArgentina: todayStr }, 'Classifier: Argentina date used for relative date resolution');

    const classifierSystem: TextBlockParam[] = [
      {
        type: 'text',
        text: `Eres un clasificador de intenciones para un chatbot de alojamiento turistico.
Clasifica el ULTIMO mensaje del usuario en una de estas intenciones:
- saludo: saludos, presentaciones
- consulta_disponibilidad: pregunta si hay disponibilidad para fechas
- consulta_precio: pregunta por precios o tarifas
- consulta_alojamiento: pregunta sobre habitaciones, servicios, amenities, check-in/out, politicas, fotos
- consulta_zona: pregunta sobre la zona, restaurantes, actividades, transporte
- reservar: quiere hacer una reserva
- cancelar_reserva: quiere cancelar una reserva existente
- cambiar_reserva: quiere modificar una reserva existente (cambiar fechas, departamento, personas)
- hablar_humano: quiere hablar con una persona real
- queja: se queja de algo, esta insatisfecho
- despedida: se despide
- otro: no encaja en ninguna

CONTEXTO CONVERSACIONAL: Usa los mensajes anteriores SOLO para inferir el departamento si el usuario no lo menciona explicitamente (ej: "pasame fotos" sin decir cual).

Extrae entidades relevantes del ULTIMO mensaje del usuario.
Los departamentos disponibles son: Pewmafe, Luminar Mono, Luminar 2Amb, LG.

REGLAS ESTRICTAS PARA ENTIDADES:
1. NUNCA inventes ni asumas entidades que el usuario NO dijo explicitamente.
2. "num_personas": SOLO incluir si el usuario dice EXPLICITAMENTE cuantas personas son (ej: "somos 3", "para 2 personas"). NUNCA confundir "noches" con "personas". "3 noches" NO es "3 personas".
3. "fecha_entrada"/"fecha_salida": SOLO incluir si el usuario menciona fechas o dias concretos. Si dice "3 noches desde el 15 de abril", entonces fecha_entrada=2026-04-15, fecha_salida=2026-04-18. Si NO menciona fechas, NO las incluyas.
4. "habitacion": Incluir si el usuario menciona un departamento o si se puede inferir del contexto conversacional.
6. Si el usuario dice solo un mes (ej: "para abril"), NO inventes dias.
7. NO copies entidades de mensajes anteriores del bot. Solo extrae del mensaje actual del usuario.
8. "nombre_huesped": SOLO incluir si el usuario dice su nombre (ej: "soy Juan", "me llamo Maria Perez", "Juan Garcia"). Extraer nombre completo.
9. "telefono": SOLO incluir si el usuario da un numero de celular/telefono (ej: "mi celular es 2920412345", "te paso mi numero 1155667788").
10. "dni": SOLO incluir si el usuario dice su numero de DNI/documento (ej: "mi DNI es 35123456", "documento 28.456.789"). Extraer solo los digitos sin puntos.

Responde UNICAMENTE con JSON valido, sin markdown, sin backticks, sin texto adicional: {"intent":"...", "confidence":0.0-1.0, "entities":{}}
Solo incluye en entities las claves que esten EXPLICITAMENTE presentes en el ultimo mensaje del usuario. Si no hay entidades, devuelve entities vacio: {}.`,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: `5. Las fechas deben estar en formato YYYY-MM-DD. La fecha de hoy es ${todayStr}. Usa esta fecha para resolver referencias relativas como "mañana", "pasado mañana", "este fin de semana", "la semana que viene".`,
      },
    ];

    const response = await getClient().messages.create({
      model: env.CLAUDE_CLASSIFIER_MODEL,
      max_tokens: 100,
      system: classifierSystem,
      messages,
    }, { timeout: env.CLAUDE_TIMEOUT_MS });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    // Clean markdown wrappers if present
    const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return {
      intent: parsed.intent || 'otro',
      confidence: parsed.confidence || 0.5,
      entities: parsed.entities || {},
    };
  } catch (err) {
    logger.error({ err }, 'Claude classification failed, using fallback');
    return classifyIntentFallback(message);
  }
}

function classifyIntentFallback(message: string): ClassifyResult {
  const lower = message.toLowerCase();

  // Check specific intents BEFORE saludo (a message starting with "hola" may still be a price/availability query)
  if (/disponib|libre|hay lugar/.test(lower)) return { intent: 'consulta_disponibilidad', confidence: 0.7, entities: {} };
  if (/precio|cuesta|cuánto|cuanto.*sale|tarifa|coste|cost/.test(lower)) return { intent: 'consulta_precio', confidence: 0.7, entities: {} };
  if (/cancel.*reserv|anular.*reserv/.test(lower)) return { intent: 'cancelar_reserva', confidence: 0.8, entities: {} };
  if (/cambiar.*reserv|modificar.*reserv|mover.*reserv|cambiar.*fecha/.test(lower)) return { intent: 'cambiar_reserva', confidence: 0.8, entities: {} };
  if (/reserv|quiero reservar|book/.test(lower)) return { intent: 'reservar', confidence: 0.7, entities: {} };
  if (/habitaci|servicio|wifi|piscina|check|mascotas?|perros?|parking|amenities|parrilla|estacionamiento|foto/.test(lower)) return { intent: 'consulta_alojamiento', confidence: 0.7, entities: {} };
  if (/zona|restaurante|actividad|senderismo|visitar|pueblo|como llego|ubicaci|direcci/.test(lower)) return { intent: 'consulta_zona', confidence: 0.7, entities: {} };
  if (/hablar.*(persona|humano|agente|recepci)|persona real|agente real|humano/.test(lower)) return { intent: 'hablar_humano', confidence: 0.8, entities: {} };
  if (/queja|mal servicio|horrible|problema|inacep|vergüenza|verguenza|nadie.*responde/.test(lower)) return { intent: 'queja', confidence: 0.7, entities: {} };
  if (/adi[oó]s|chao|hasta luego|bye/.test(lower)) return { intent: 'despedida', confidence: 0.8, entities: {} };
  // Saludo ONLY if no specific intent was matched (pure greeting)
  if (/hola|buenos|buenas|hey|buen dia/.test(lower)) return { intent: 'saludo', confidence: 0.8, entities: {} };
  // Catch-all for messages with "quiero" without "reservar" (general inquiry)
  if (/quiero|necesito|busco/.test(lower)) return { intent: 'consulta_alojamiento', confidence: 0.6, entities: {} };
  return { intent: 'otro', confidence: 0.5, entities: {} };
}

export async function generateResponse(
  intent: Intent,
  entities: Record<string, string>,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  additionalContext?: string
): Promise<string> {
  const botConfig = await getBotConfig();

  if (!env.ANTHROPIC_API_KEY) {
    return generateResponseFallback(intent, botConfig);
  }

  try {
    const activeDepartamento = entities.habitacion || '';
    const hasDepartamento = !!activeDepartamento;

    // KEY: When a department is active, send ONLY that department's data to Claude.
    // This prevents Claude from referencing or listing other departments.
    const contextData = hasDepartamento
      ? await getFilteredContext(activeDepartamento)
      : await getFullContext();

    const IDIOMA_MAP: Record<string, string> = { 'es_AR': 'espanol de Argentina (voseo)', 'es': 'espanol neutro', 'en': 'English' };
    const LONGITUD_MAP: Record<string, string> = { 'corta': 'max 3-4 frases', 'media': 'max 5-7 frases', 'detallada': 'max 8-10 frases' };
    const idioma = IDIOMA_MAP[botConfig.idioma] ?? IDIOMA_MAP['es_AR'];
    const longitud = LONGITUD_MAP[botConfig.longitudRespuesta] ?? LONGITUD_MAP['corta'];
    const emojiRule = botConfig.usarEmojis
      ? 'Podes usar emojis moderadamente para ser mas expresivo.'
      : 'No uses markdown ni emojis excesivos, solo texto plano adecuado para WhatsApp.';

    // Block 1: Static base rules (never change) — cached
    const rulesBlock: TextBlockParam = {
      type: 'text',
      text: `Eres el asistente virtual de ${botConfig.nombreAgente}, alojamiento turistico en ${botConfig.ubicacion}.
Tu tono es ${botConfig.tono}. Usas ${idioma}. Respuestas concisas (${longitud}).
${emojiRule} Los precios son en pesos argentinos (ARS).

FORMATO WHATSAPP — OBLIGATORIO:
- Tus respuestas se muestran en burbujas de WhatsApp. Mantene los mensajes cortos y bien espaciados.
- DATOS BANCARIOS: Cuando informes CBU, alias, titular, CUIT o banco, pone CADA dato en su propia linea con un salto de linea entre ellos. Usa formato limpio:
  Titular: Nombre Apellido
  CBU: 0000000000000000000000
  Alias: nombre.alias
  Banco: Nombre del Banco
  CUIT: 00-00000000-0
- NUNCA pongas el CBU o alias en medio de un parrafo largo. Siempre en lineas separadas.
- Para listas, usa saltos de linea simples (no listas con guiones largos).
- Evita parrafos de mas de 3 lineas seguidas sin un salto de linea.
- UBICACION / GOOGLE MAPS: Cuando el huesped pregunte la ubicacion, direccion o como llegar, comparti el link de Google Maps en su propia linea, limpio y sin texto adicional alrededor:

Ubicacion de [nombre depto]:
https://www.google.com/maps/search/?api=1&query=...

  NUNCA metas el link de Maps dentro de un parrafo. Siempre en su propia linea para que WhatsApp genere la vista previa del mapa.

REGLAS IMPORTANTES:
1. FOTOS: NUNCA incluyas URLs de imagenes ni links a paginas web en tu respuesta de texto. Las fotos se envian automaticamente como imagenes adjuntas, NO como links. Si el usuario pide fotos de un departamento especifico, respondele brevemente (ej: "Aca te muestro fotos de Pewmafe") y el sistema se encarga de enviar las imagenes. NUNCA generes URLs de fotos.
2. PRECIOS: Usa EXCLUSIVAMENTE las tarifas que aparecen en la tabla de tarifas del contexto. NUNCA inventes ni estimes precios.
3. CAPACIDAD: La "Capacidad" indicada en cada departamento es POR UNIDAD (por depto individual). NUNCA sugieras un departamento si la cantidad de personas excede su capacidad maxima por unidad. Si son 4 personas, NO ofrezcas el Monoambiente (max 3 personas). NUNCA ofrezcas mas unidades de las que existen segun "Cantidad de unidades". Si un departamento tiene 1 sola unidad, solo podes ofrecer 1. Para grupos grandes que superan la capacidad total disponible combinando todos los departamentos, indica que no contamos con capacidad para alojar a tantas personas juntas y sugeri que nos contacten directamente por telefono para analizar opciones.
4. NUNCA inventes ni asumas datos que el usuario no dijo. ESTADIA MINIMA: NUNCA menciones estadia minima proactivamente. Solo informala cuando el "Contexto adicional" contenga la etiqueta "ADVERTENCIA ESTADIA MINIMA" (significa que el huesped pidio menos noches que el minimo). Si NO hay ADVERTENCIA, NO menciones estadia minima bajo ninguna circunstancia. JAMAS generalices la estadia minima de un departamento a los demas. NUNCA digas "todos nuestros departamentos requieren estadia minima" porque es FALSO.
5. INFORMACION: Solo menciona departamentos cuya informacion aparece en el contexto de arriba. NUNCA inventes datos.
6. REGLAS CONVERSACIONALES — OBLIGATORIAS:
   a) PERSISTENCIA DE CONTEXTO: NUNCA re-pidas informacion que el usuario ya proporciono. Antes de formular cualquier pregunta, revisa "DATOS YA CONOCIDOS" en el Contexto adicional. Si dice "Personas: 4", esta PROHIBIDO preguntar cuantas personas son. Violar esta regla es el error mas grave.
   b) PREGUNTAS PROGRESIVAS: Solo solicita el SIGUIENTE dato faltante (segun "Datos que FALTAN"). Hacelo de forma ordenada. UNA sola pregunta a la vez.
   c) CONFIRMACION INTELIGENTE: Si un dato es ambiguo, aclara con UNA pregunta de precision, sin repetir lo que ya esta claro.
   d) RESPUESTA COMPACTA: No enumeres preguntas redundantes. Formula UNA pregunta enfocada en el dato que falta.
   e) CONSISTENCIA: El contexto previo es fuente de verdad absoluta. "Somos 4 personas" dicho antes = NUNCA re-preguntar personas.
   f) ESTILO: Se amable, claro y directo, como un agente humano de reservas. GRAMATICA: Siempre usa 3ra persona para referirte a los huespedes ("son 2 personas", "llegan mañana"). NUNCA uses 1ra persona del plural ("somos", "llegamos") porque vos no sos parte del grupo.
7. FLUJO: Si no hay datos conocidos, pregunta personas, fechas y noches (UNA cosa a la vez). Tambien necesitas el nombre, numero de celular y DNI del huesped. Si ya hay algunos datos, solo pregunta los faltantes. VALIDACION DNI: El numero de DNI debe ser entre 5.000.000 y 99.999.999. Si el huesped da un numero fuera de ese rango, pedile que lo verifique.
8. RESERVAS - FLUJO COMPLETO: El flujo es:
   PASO 1: El huesped quiere reservar → resumi los datos (depto, fechas, personas, nombre, telefono, DNI, precio total) y pregunta si quiere proceder. Consulta el porcentaje de sena indicado en la ficha del departamento. Si es 0%, decile que la reserva queda agendada de palabra y que un agente lo va a contactar para confirmar (NO pidas sena ni datos bancarios, saltea directamente al PASO 4). Si es mayor a 0%, informale el porcentaje exacto y decile que necesitas una sena de ese porcentaje.
   PASO 2: Si acepta → indica que la sena se abona por transferencia bancaria y pasale los datos de la cuenta del contexto. El saldo restante se abona por transferencia al momento del check-in. IMPORTANTE: NO menciones la opcion de tarjeta de credito/MercadoPago a menos que el huesped PREGUNTE EXPLICITAMENTE por esa opcion. Si pregunta, recien ahi le pasas el link de MercadoPago (aclarando el recargo del 8%).
   PASO 3: Cuando el huesped diga que ya realizo el pago → pedile que envie el comprobante de transferencia.
   PASO 4: Una vez recibido el comprobante y DNI → decile que un agente va a verificar el pago y le va a enviar la factura por este mismo medio. Recien cuando reciba la factura, la reserva queda confirmada.
   NUNCA confirmes una reserva vos. Solo un agente humano puede confirmarla.
9. TERMINOLOGIA DE RESERVA — REGLA CRITICA:
   - JAMAS uses las palabras "pre-reserva", "pre reserva", "prereserva", "reserva preliminar", "reserva tentativa" ni "reserva provisoria" en tus respuestas al huesped. Estos son terminos internos que el huesped NO debe ver.
   - SIEMPRE usa "reserva" cuando hables con el huesped. Ejemplos correctos: "tu reserva", "confirmar la reserva", "cancelar la reserva", "datos de la reserva".
   - Si el huesped pregunta por el estado, decile que un agente va a verificar el pago y confirmar la reserva.
10. DATOS BANCARIOS — REGLA DE SEGURIDAD MAXIMA:
   - JAMAS inventes datos bancarios (CBU, alias, banco, titular, CUIT, link de pago). Inventar datos bancarios es FRAUDE.
   - Si el "Contexto adicional" contiene "ADVERTENCIA DATOS BANCARIOS", NO muestres datos de pago bajo NINGUNA circunstancia. Decile al huesped: "Un agente te va a contactar en breve para pasarte los datos de pago y avanzar con la reserva."
   - Si NO hay advertencia y el contexto del departamento incluye CBU/alias/banco/titular, podes informarlos normalmente en PASO 2 del flujo de reserva.

Instrucciones segun intencion:
- saludo: Da la bienvenida y pregunta en que podemos ayudar.
- consulta_disponibilidad: Si tiene fechas completas, informar disponibilidad. Si faltan datos, pedir SOLO los que faltan.
- consulta_precio: Si faltan las fechas, NO listes precios por temporada (baja/media/alta). Primero pregunta para que fechas y cuantas personas, asi podes dar el precio exacto. Solo cuando tengas las fechas concretas, informa el precio correspondiente a ESA temporada especifica (una sola). Filtrar por capacidad si se conoce num_personas.
- consulta_alojamiento: Responder sobre el departamento activo o presentar opciones filtradas por capacidad.
- consulta_zona: Recomienda actividades y lugares cercanos.
- reservar: Pedir SOLO los datos que faltan (fechas, personas, departamento, nombre, celular y DNI del huesped). Cuando tenga todos los datos, seguir el flujo del punto 8 (NUNCA decir que la reserva esta confirmada).
- cancelar_reserva: Decile al huesped que vas a comunicarlo con un agente para gestionar la cancelacion. NO canceles la reserva vos, solo un agente humano puede hacerlo.
- cambiar_reserva: Decile al huesped que vas a comunicarlo con un agente para gestionar la modificacion. NO modifiques la reserva vos, solo un agente humano puede hacerlo.
- hablar_humano: Indica que un agente se pondra en contacto pronto.
- queja: Pide disculpas y escala a un agente humano.
- despedida: Despidete amablemente.
- otro: Responde de forma generica y ofrece ayuda.`,
      cache_control: { type: 'ephemeral' },
    };

    // Block 2: Department data (changes infrequently, cached separately)
    const contextBlock: TextBlockParam = {
      type: 'text',
      text: contextData,
      cache_control: { type: 'ephemeral' },
    };

    // Block 3: Per-message dynamic context (intent, entities, additional context) — NOT cached
    // Structure: KNOWN DATA first (most important), then intent/entities, then additional context
    const dynamicParts: string[] = [];

    // Extract "DATOS YA CONOCIDOS" and "Datos que FALTAN" from additionalContext and put them FIRST
    if (additionalContext) {
      const knownMatch = additionalContext.match(/DATOS YA CONOCIDOS[^\n]*\n([\s\S]*?)(?=\n(?:ANALISIS|Datos que FALTAN|DEPARTAMENTOS|Resultados|ADVERTENCIA|IMPORTANTE|No hay|No se pudo|No tenemos)|$)/);
      const missingMatch = additionalContext.match(/Datos que FALTAN[^\n]*/);
      if (knownMatch || missingMatch) {
        dynamicParts.push('=== ESTADO DE LA CONVERSACION (LEER PRIMERO) ===');
        if (knownMatch) dynamicParts.push(`DATOS YA CONOCIDOS (PROHIBIDO volver a preguntar):\n${knownMatch[1].trim()}`);
        if (missingMatch) dynamicParts.push(`${missingMatch[0]} — SOLO pregunta por estos.`);
        dynamicParts.push('=== FIN ESTADO ===\n');
      }
    }

    dynamicParts.push(`Intencion detectada: ${intent}`);
    dynamicParts.push(`Entidades extraidas: ${JSON.stringify(entities)}`);
    if (additionalContext) dynamicParts.push(`\nContexto adicional: ${additionalContext}`);

    const dynamicBlock: TextBlockParam = {
      type: 'text',
      text: dynamicParts.join('\n'),
    };

    const response = await getClient().messages.create({
      model: env.CLAUDE_RESPONSE_MODEL,
      max_tokens: 500,
      system: [rulesBlock, contextBlock, dynamicBlock],
      messages: conversationHistory.slice(-10),
    }, { timeout: env.CLAUDE_TIMEOUT_MS });

    return response.content[0]?.type === 'text' ? response.content[0].text : generateResponseFallback(intent, botConfig);
  } catch (err) {
    logger.error({ err }, 'Claude response generation failed, using fallback');
    return generateResponseFallback(intent, botConfig);
  }
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const response = await getClient().messages.create({
    model: env.CLAUDE_CLASSIFIER_MODEL,
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'input_audio',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: audioBuffer.toString('base64'),
          },
        },
        {
          type: 'text',
          text: 'Transcribi este audio a texto exactamente como lo dice la persona. Solo devolvé el texto, sin explicaciones.',
        },
      ],
    }],
  });

  return response.content[0]?.type === 'text' ? response.content[0].text : '';
}

function generateResponseFallback(intent: Intent, botConfig?: BotConfig): string {
  const responses: Record<Intent, string> = {
    saludo: botConfig?.mensajeBienvenida ?? 'Hola! Bienvenido a Las Grutas Departamentos. Tenemos departamentos a pocas cuadras de la playa en Las Grutas, Rio Negro. ¿En que puedo ayudarte? Puedo informarte sobre disponibilidad, precios, departamentos o actividades en la zona.',
    consulta_disponibilidad: 'Para consultar disponibilidad, necesito que me indiques las fechas de entrada y salida, y la cantidad de personas. ¿Me las podes facilitar?',
    consulta_precio: 'Para darte el precio exacto necesito saber las fechas de entrada y salida, y la cantidad de personas. ¿Me las podes indicar?',
    consulta_alojamiento: 'Tenemos 4 departamentos: Pewmafe (4 pers, con patio y parrilla), Luminar Monoambiente (3 pers), Luminar 2 Ambientes (4 pers, con parrilla) y LG (4 pers, 50m2). Todos con cocina equipada, Wi-Fi, aire acondicionado y a 2-3 cuadras de la playa. ¿Cual te interesa?',
    consulta_zona: 'Estamos en Las Grutas, la playa mas linda de la Patagonia! Podes disfrutar de buceo, kayak, mountain bike, y visitar las famosas grutas. A 100 km esta la pinguinera de El Condor. ¿Te interesa alguna actividad?',
    reservar: 'Perfecto, vamos a gestionar tu reserva. Necesito: 1) Fechas de entrada y salida, 2) Cantidad de personas, 3) Preferencia de departamento (Pewmafe, Luminar Mono, Luminar 2Amb o LG), 4) Tu nombre completo, 5) Un numero de celular y 6) Tu numero de DNI. ¿Me pasas esos datos?',
    cancelar_reserva: 'Entendido, te voy a comunicar con uno de nuestros agentes para gestionar la cancelacion de tu reserva. Te va a atender en breve.',
    cambiar_reserva: 'Entendido, te voy a comunicar con uno de nuestros agentes para gestionar la modificacion de tu reserva. Te va a atender en breve.',
    hablar_humano: botConfig?.mensajeEsperaHumano ?? 'Entendido, te voy a comunicar con uno de nuestros agentes. Te va a atender en breve. Gracias por tu paciencia.',
    queja: 'Lamento mucho la situacion. Te voy a comunicar con uno de nuestros agentes para que pueda ayudarte personalmente. Disculpa las molestias.',
    despedida: botConfig?.mensajeDespedida ?? 'Gracias por contactarnos! Si necesitas algo mas, no dudes en escribirnos. Que tengas un excelente dia!',
    otro: 'Gracias por tu mensaje. Puedo ayudarte con informacion sobre disponibilidad, precios, departamentos o actividades en la zona. ¿Que te gustaria saber?',
  };
  return responses[intent];
}
