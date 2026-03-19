import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getFullContext, getFilteredContext } from '../data/accommodationContext.js';
import { checkAvailability } from './inventarioService.js';
import { sendAutoReplyEmail } from './emailService.js';
import { getArgentinaToday } from '../utils/dateUtils.js';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

interface IncomingEmail {
  messageId: string;
  from: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  activeComplejos: Array<{ id: string; nombre: string }>;
}

interface ExtractedData {
  fecha_entrada: string | null;
  fecha_salida: string | null;
  num_personas: number | null;
  complejo_nombre: string | null;
  nombre_huesped: string | null;
  consulta: string;
}

/**
 * Process an incoming email: extract data, check availability, generate and send reply.
 * Returns the complejoId if one was identified, or null.
 */
export async function processIncomingEmail(email: IncomingEmail): Promise<string | null> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const todayStr = getArgentinaToday();
  const complejoNames = email.activeComplejos.map(c => c.nombre).join(', ');

  // Step 1: Extract data with Claude (Haiku - fast + cheap)
  const extractionResponse = await getClient().messages.create({
    model: env.CLAUDE_CLASSIFIER_MODEL,
    max_tokens: 300,
    system: [
      {
        type: 'text',
        text: `Eres un extractor de datos de emails de consulta de alojamiento turistico.
La fecha de hoy es ${todayStr}.
Los complejos/departamentos disponibles son: ${complejoNames}.

Extrae los siguientes datos del email. Si no estan presentes, usa null.
Responde UNICAMENTE con JSON valido, sin markdown, sin backticks:
{
  "fecha_entrada": "YYYY-MM-DD o null",
  "fecha_salida": "YYYY-MM-DD o null",
  "num_personas": numero o null,
  "complejo_nombre": "nombre exacto del complejo o null",
  "nombre_huesped": "nombre del remitente o null",
  "consulta": "resumen breve de lo que consulta"
}

Reglas:
- Las fechas deben estar en formato YYYY-MM-DD
- Si dice "3 noches desde el 15 de enero", calcula la fecha de salida
- Si menciona un departamento, usa el nombre exacto de la lista
- Si no menciona ningun departamento, deja null
- "consulta" es un resumen de 1 linea de lo que pide el email`,
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Asunto: ${email.subject}\n\n${email.body}`.slice(0, 3000),
      },
    ],
  }, { timeout: env.CLAUDE_TIMEOUT_MS });

  const extractionText = extractionResponse.content[0]?.type === 'text'
    ? extractionResponse.content[0].text : '{}';
  const cleanExtraction = extractionText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let extracted: ExtractedData;
  try {
    extracted = JSON.parse(cleanExtraction);
  } catch {
    logger.warn({ raw: cleanExtraction }, 'Failed to parse extraction JSON');
    extracted = {
      fecha_entrada: null,
      fecha_salida: null,
      num_personas: null,
      complejo_nombre: null,
      nombre_huesped: null,
      consulta: 'Consulta general',
    };
  }

  logger.info({ extracted, from: email.from }, 'Email data extracted');

  // Resolve complejoId
  let complejoId: string | null = null;
  if (extracted.complejo_nombre) {
    const match = email.activeComplejos.find(
      c => c.nombre.toLowerCase() === extracted.complejo_nombre!.toLowerCase()
    );
    if (match) complejoId = match.id;
  }

  // Step 2: Check availability if we have dates
  let availabilityInfo = '';
  if (extracted.fecha_entrada && extracted.fecha_salida) {
    try {
      const fechaEntrada = new Date(extracted.fecha_entrada);
      const fechaSalida = new Date(extracted.fecha_salida);
      const noches = Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / (1000 * 60 * 60 * 24));

      // Check requested dates for the requested complejo (or all)
      const results = await checkAvailability(
        fechaEntrada,
        fechaSalida,
        extracted.complejo_nombre || undefined
      );

      if (results.length > 0) {
        const lines = results.map(r =>
          `- ${r.habitacion}: DISPONIBLE, ${r.noches} noches, $${r.precioTotal.toLocaleString('es-AR')} total ($${r.precioPorNoche.map(p => p.toLocaleString('es-AR')).join('/')} por noche)`
        );
        availabilityInfo = `\nRESULTADOS DE DISPONIBILIDAD para ${extracted.fecha_entrada} a ${extracted.fecha_salida}:\n${lines.join('\n')}`;
      } else {
        // No availability — search alternatives
        availabilityInfo = `\nSIN DISPONIBILIDAD para ${extracted.complejo_nombre || 'ningun departamento'} en las fechas ${extracted.fecha_entrada} a ${extracted.fecha_salida}.`;

        // Alternative A: Other complejos available on the same dates
        if (extracted.complejo_nombre) {
          const otherResults = await checkAvailability(fechaEntrada, fechaSalida);
          if (otherResults.length > 0) {
            const otherLines = otherResults.map(r =>
              `- ${r.habitacion}: ${r.noches} noches, $${r.precioTotal.toLocaleString('es-AR')} total ($${r.precioPorNoche.map(p => p.toLocaleString('es-AR')).join('/')} por noche)`
            );
            availabilityInfo += `\n\nOTROS DEPARTAMENTOS DISPONIBLES en las mismas fechas (${extracted.fecha_entrada} a ${extracted.fecha_salida}):\n${otherLines.join('\n')}`;
            availabilityInfo += `\nIMPORTANTE: Ofrece estas alternativas al huesped mencionando que el departamento consultado no esta disponible pero que tenemos estos otros.`;
          }
        }

        // Alternative B: Nearby dates for the same complejo (±7 days, check 3 offsets)
        const nearbyResults: Array<{ offset: number; results: typeof results }> = [];
        const offsets = [-7, -3, 3, 7];
        for (const dayOffset of offsets) {
          const altEntrada = new Date(fechaEntrada);
          altEntrada.setDate(altEntrada.getDate() + dayOffset);
          const altSalida = new Date(altEntrada);
          altSalida.setDate(altSalida.getDate() + noches);

          // Skip past dates
          const today = new Date(todayStr);
          if (altEntrada < today) continue;

          const altResults = await checkAvailability(
            altEntrada,
            altSalida,
            extracted.complejo_nombre || undefined
          );
          if (altResults.length > 0) {
            nearbyResults.push({ offset: dayOffset, results: altResults });
          }
        }

        if (nearbyResults.length > 0) {
          const nearbyLines: string[] = [];
          for (const nr of nearbyResults) {
            for (const r of nr.results) {
              const label = nr.offset < 0 ? `${Math.abs(nr.offset)} dias antes` : `${nr.offset} dias despues`;
              nearbyLines.push(`- ${r.habitacion} (${label}): ${r.fechaEntrada} a ${r.fechaSalida}, ${r.noches} noches, $${r.precioTotal.toLocaleString('es-AR')} total`);
            }
          }
          availabilityInfo += `\n\nFECHAS CERCANAS DISPONIBLES:\n${nearbyLines.join('\n')}`;
          availabilityInfo += `\nIMPORTANTE: Sugeri estas fechas alternativas al huesped como opcion cercana a lo que consultaron.`;
        }

        if (nearbyResults.length === 0 && (!extracted.complejo_nombre || (await checkAvailability(fechaEntrada, fechaSalida)).length === 0)) {
          availabilityInfo += `\nNo se encontraron alternativas cercanas. Sugeri al huesped que nos contacte por WhatsApp (+54 2920 561033) para buscar opciones juntos.`;
        }
      }
    } catch (err) {
      logger.error({ err }, 'Availability check failed for email');
      availabilityInfo = '\nNo se pudo verificar la disponibilidad en este momento.';
    }
  }

  // Step 3: Get context for the response
  // If we're offering alternatives from other complejos, use full context so Claude can describe them
  const needsFullContext = availabilityInfo.includes('OTROS DEPARTAMENTOS DISPONIBLES');
  const contextData = (extracted.complejo_nombre && !needsFullContext)
    ? await getFilteredContext(extracted.complejo_nombre)
    : await getFullContext();

  // Step 4: Generate response with Claude (Sonnet)
  const responseResult = await getClient().messages.create({
    model: env.CLAUDE_RESPONSE_MODEL,
    max_tokens: 1000,
    system: [
      {
        type: 'text',
        text: `Eres el equipo de Las Grutas Departamentos respondiendo un email de consulta sobre alojamiento.
Escribis en espanol argentino, tono amable y profesional.

REGLAS PARA EMAIL:
1. NO uses markdown (ni **, ni ##, ni listas con -). Escribi texto plano con saltos de linea.
2. Saluda al huesped por nombre si lo tenemos, sino "Hola! Gracias por tu consulta."
3. Responde la consulta con datos concretos de disponibilidad y precios si los tenemos.
4. Menciona brevemente las caracteristicas principales del departamento consultado.
5. Incluye el telefono de contacto: +54 2920 561033 (WhatsApp)
6. Firma como "Las Grutas Departamentos" (no uses tu nombre propio)
7. No prometas confirmacion de reserva. Indica que pueden reservar contactandose por WhatsApp o respondiendo el email.
8. PRECIOS: Usa EXCLUSIVAMENTE los datos del contexto. NUNCA inventes precios.
9. Se conciso pero informativo. Un email de respuesta deberia tener 15-20 lineas maximo.
10. NO incluyas links ni URLs de imagenes.
11. SIN DISPONIBILIDAD - ALTERNATIVAS: Si no hay disponibilidad para las fechas/departamento consultado:
    a) Si hay OTROS DEPARTAMENTOS DISPONIBLES en las mismas fechas, ofrece esas opciones mencionando brevemente sus caracteristicas y precios.
    b) Si hay FECHAS CERCANAS DISPONIBLES, sugerilas como alternativa indicando las fechas exactas y precios.
    c) Si hay ambas alternativas, menciona las dos opciones.
    d) Si no hay ninguna alternativa, invita al huesped a contactarnos por WhatsApp para buscar opciones juntos.
    e) Siempre se empatico: "Lamentablemente no tenemos disponibilidad en [depto] para esas fechas, pero te podemos ofrecer..."

CONTEXTO DEL ALOJAMIENTO:
${contextData}
${availabilityInfo}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Responde a este email de ${extracted.nombre_huesped || email.from}:

Asunto: ${email.subject}
Consulta: ${extracted.consulta}
${extracted.num_personas ? `Personas: ${extracted.num_personas}` : ''}
${extracted.fecha_entrada ? `Fechas: ${extracted.fecha_entrada} a ${extracted.fecha_salida}` : ''}
${extracted.complejo_nombre ? `Departamento: ${extracted.complejo_nombre}` : ''}

Texto original del email:
${email.body.slice(0, 2000)}`,
      },
    ],
  }, { timeout: env.CLAUDE_TIMEOUT_MS });

  const replyBody = responseResult.content[0]?.type === 'text'
    ? responseResult.content[0].text
    : 'Gracias por tu consulta. Te contactaremos a la brevedad. Saludos, Las Grutas Departamentos.';

  // Step 5: Send reply
  const replySubject = email.subject.startsWith('Re:')
    ? email.subject
    : `Re: ${email.subject}`;

  await sendAutoReplyEmail({
    to: email.from,
    subject: replySubject,
    bodyText: replyBody,
    inReplyTo: email.messageId,
  });

  return complejoId;
}
