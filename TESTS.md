# Chatbot - Registro de Tests, Problemas y Soluciones

Ultima actualizacion: 2026-03-06

## Problemas Identificados y Soluciones

### P01: Claude devuelve JSON envuelto en markdown
- **Sintoma**: `SyntaxError: Unexpected token` al parsear respuesta del clasificador
- **Causa**: Claude Haiku responde con ```json ... ``` alrededor del JSON
- **Solucion**: Limpieza regex en `claudeService.ts`:
  ```ts
  text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  ```
- **Archivo**: `server/src/services/claudeService.ts` linea 91
- **Estado**: RESUELTO

### P02: Bot pierde contexto del departamento
- **Sintoma**: Usuario pregunta por Pewmafe, luego dice "pasame fotos" y el bot pregunta "de cual departamento?"
- **Causa**: El clasificador no inferia el departamento del historial conversacional
- **Solucion**:
  1. Se pasa el historial conversacional al clasificador
  2. Se implemento `getLastEntities()` en botEngine.ts para carry-forward del departamento activo
  3. Se filtra el contexto de datos (`getFilteredContext`) para enviar a Claude solo info del departamento activo
- **Archivos**: `server/src/services/claudeService.ts`, `server/src/services/botEngine.ts`, `server/src/data/accommodationContext.ts`
- **Estado**: RESUELTO

### P03: Bot envia fotos de todos los departamentos
- **Sintoma**: Al pedir fotos de Pewmafe, envia fotos de los 4 departamentos
- **Causa**: Claude recibia informacion de todos los departamentos en el contexto
- **Solucion**: `getFilteredContext(depto)` envia SOLO datos del departamento activo. Claude no tiene acceso a info de otros departamentos.
- **Archivo**: `server/src/data/accommodationContext.ts`
- **Estado**: RESUELTO

### P04: Fotos se envian como links/URLs en texto
- **Sintoma**: En vez de imagenes adjuntas, aparecen URLs de texto
- **Solucion**:
  1. `whatsappService.ts` reescrito con `extractImages()` que separa URLs de imagenes y las envia como mensajes tipo `image`
  2. `WhatsAppSimulator.tsx` actualizado para renderizar `<img>` tags
  3. Luego mejorado: cuando usuario pide fotos, se envian directamente desde `getDepartmentImages()` sin pasar por Claude, evitando cualquier texto/link
- **Archivos**: `server/src/services/whatsappService.ts`, `server/src/services/botEngine.ts`, `src/components/simulator/WhatsAppSimulator.tsx`
- **Estado**: RESUELTO

### P05: Clasificador inventa entidades (personas, fechas)
- **Sintoma**: Usuario pregunta por Pewmafe sin mencionar fechas ni personas, pero el clasificador devuelve `num_personas: 3, fecha_entrada: "2026-03-15"`
- **Causa**: Prompt del clasificador no era estricto sobre extraer solo datos explicitamente mencionados
- **Solucion**: Reglas estrictas en el prompt del clasificador:
  - Solo incluir `num_personas` si el usuario dice explicitamente cuantas personas
  - Solo incluir fechas si el usuario menciona fechas concretas
  - No copiar entidades de mensajes anteriores del bot
  - Si no hay entidades, devolver `{}`
- **Archivo**: `server/src/services/claudeService.ts` (system prompt del clasificador)
- **Estado**: RESUELTO

### P06: Confunde "3 noches" con "3 personas"
- **Sintoma**: Usuario dice "3 noches desde el 15 de abril", bot interpreta `num_personas: 3`
- **Causa**: Clasificador no distinguia entre numero de noches y numero de personas
- **Solucion**: Regla explicita en el prompt: `"3 noches" NO es "3 personas"`. Solo extraer `num_personas` con palabras como "personas", "somos X", etc.
- **Archivo**: `server/src/services/claudeService.ts`
- **Estado**: RESUELTO

### P07: Carry-forward arrastra datos de conversaciones anteriores
- **Sintoma**: Consulta generica "alojamiento para 4 personas" responde solo sobre Pewmafe (de conversacion previa)
- **Causa**: Entity carry-forward traia `habitacion` de mensajes anteriores sin importar si la consulta actual era generica
- **Solucion**: Carry-forward solo activo para follow-ups puros (sin nuevos datos de booking):
  - NO carry-forward si el intent es generico (saludo, despedida, etc.)
  - NO carry-forward si el usuario introduce nuevos parametros (personas, fechas)
  - Solo carry-forward para mensajes tipo "pasame fotos", "cuanto sale" sin datos nuevos
- **Archivo**: `server/src/services/botEngine.ts`
- **Estado**: RESUELTO

### P08: Monoambiente sugerido para 4 personas (excede capacidad)
- **Sintoma**: Bot ofrece Luminar Mono (max 3 pers) cuando el usuario dice 4 personas
- **Causa**: No habia validacion de capacidad en el prompt de respuesta
- **Solucion**: Regla en el prompt: "NUNCA sugieras un departamento si la cantidad de personas excede su capacidad maxima"
- **Archivo**: `server/src/services/claudeService.ts`
- **Estado**: RESUELTO

### P09: Precios inventados/incorrectos
- **Sintoma**: Bot dice Luminar Mono cuesta $40.000 cuando la tarifa real es $65.000
- **Causa**: Claude alucinaba precios de su conocimiento general en vez de usar la tabla de tarifas del contexto
- **Solucion**:
  1. Regla reforzada: "Usa EXCLUSIVAMENTE las tarifas de la tabla de tarifas del contexto. NUNCA inventes ni estimes precios"
  2. Regla adicional: "Solo menciona departamentos cuya informacion aparece en el contexto"
- **Archivo**: `server/src/services/claudeService.ts`
- **Estado**: RESUELTO

### P10: Consulta generica responde con un solo departamento
- **Sintoma**: "quiero info de alojamiento en Las Grutas" responde solo sobre Pewmafe
- **Causa**: Carry-forward agresivo + prompt no indicaba flujo para consultas genericas
- **Solucion**:
  1. Flujo generico: primero preguntar personas, fechas, noches. Despues mostrar opciones filtradas por capacidad
  2. Carry-forward desactivado para consultas genericas
- **Archivos**: `server/src/services/claudeService.ts`, `server/src/services/botEngine.ts`
- **Estado**: RESUELTO

---

## Tests Automatizados

### Test 1: Consulta generica sin departamento
- **Input**: "Hola, quiero informacion de alojamiento en Las Grutas"
- **Esperado**: Respuesta generica, pregunta personas/fechas/noches, entities vacias `{}`
- **Resultado**: PASS

### Test 2a: Consulta de departamento especifico
- **Input**: "Hola, me interesa el departamento Pewmafe"
- **Esperado**: Info solo de Pewmafe, pregunta datos, `entities: {habitacion: "Pewmafe"}`
- **Resultado**: PASS

### Test 2b: Follow-up pidiendo fotos (contexto)
- **Input**: (despues de 2a) "pasame fotos"
- **Esperado**: Solo fotos de Pewmafe como imagenes adjuntas, sin texto ni links
- **Resultado**: PASS

### Test 3: Fechas sin mencionar personas
- **Input**: "hay disponibilidad del 15 al 18 de abril en Pewmafe?"
- **Esperado**: Disponibilidad correcta, NO inventar `num_personas`
- **Resultado**: PASS

### Test 4: "3 noches" no es "3 personas"
- **Input**: "necesito 3 noches desde el 15 de abril en Pewmafe"
- **Esperado**: `fecha_entrada: 2026-04-15, fecha_salida: 2026-04-18`, sin `num_personas`
- **Resultado**: PASS

### Test 5: Escalacion a humano
- **Input**: "quiero hablar con una persona"
- **Esperado**: `intent: hablar_humano`, mensaje de escalacion
- **Resultado**: PASS

### Test 6: Distinguir personas de noches en mismo mensaje
- **Input**: "somos 2 personas, necesitamos 3 noches desde el 20 de julio"
- **Esperado**: `num_personas: 2` (no 3), `fecha_entrada: 2026-07-20, fecha_salida: 2026-07-23`
- **Resultado**: PASS

### Test 7: Elegir departamento despues de listado + pedir fotos
- **Input**: (despues de test 6) "me interesa el Luminar Mono, pasame fotos"
- **Esperado**: Fotos solo de Luminar Mono como imagenes
- **Resultado**: PASS

### Test 8: Despedida
- **Input**: "bueno gracias, adios!"
- **Esperado**: `intent: despedida`, mensaje de despedida
- **Resultado**: PASS

### Test A: 4 personas - filtro de capacidad
- **Input**: "hola necesito alojamiento para 4 personas en marzo, precios?"
- **Esperado**: NO mostrar Monoambiente (max 3), precios correctos de la tabla
- **Verificar**: Pewmafe $70k, Luminar 2Amb $70k, LG $80k (temp baja)
- **Resultado**: PASS

### Test B: 2 personas - todas las opciones
- **Input**: "hola somos 2 personas, que opciones tienen para marzo?"
- **Esperado**: Incluir Monoambiente a $65.000 (precio correcto), todos los departamentos disponibles
- **Resultado**: PASS

### Test C: Follow-up con fechas mantiene filtro de personas
- **Input**: (despues de test A) "del 10 al 15 de marzo"
- **Esperado**: Disponibilidad para 4 personas, NO mostrar Monoambiente, precios correctos
- **Resultado**: PASS

### Test D: Fotos directas sin links ni texto
- **Input**: "me interesa pewmafe, pasame fotos"
- **Esperado**: Solo 3 imagenes enviadas como type=image, sin texto, sin URLs, sin links
- **Resultado**: PASS

### Test E: Conversacion completa - NO repetir preguntas (estado acumulado)
Flujo de 5 pasos simulando un cliente real:

**Paso 1** - "hola busco alojamiento en las grutas"
- **Esperado**: Pregunta personas, fechas, noches
- **Resultado**: PASS

**Paso 2** - "somos 4 personas"
- **Esperado**: Ya sabe personas (4). Solo pregunta fechas y noches. NO vuelve a preguntar personas.
- **Resultado**: PASS

**Paso 3** - "del 10 al 15 de abril"
- **Esperado**: Ya sabe personas (4) y fechas. Muestra disponibilidad sin Monoambiente. Precios correctos. NO pregunta nada ya conocido.
- **Verificar**: Pewmafe $70k x 5 = $350k, Luminar 2Amb $70k x 5 = $350k, LG $80k x 5 = $400k
- **Resultado**: PASS

**Paso 4** - "me interesa pewmafe"
- **Esperado**: Tiene todos los datos. Ofrece reservar directamente con precio total y seña. NO repregunta nada.
- **Resultado**: PASS

**Paso 5** - "si primero mostrame fotos"
- **Esperado**: Solo imagenes de Pewmafe, sin texto ni links
- **Resultado**: PASS

---

## Problemas Adicionales Identificados

### P11: Bot repite preguntas que ya fueron contestadas
- **Sintoma**: Usuario dice "4 personas", luego "del 10 al 15 de abril", bot vuelve a preguntar cuantas personas
- **Causa**: No se acumulaban entidades de mensajes anteriores de la conversacion. Solo se usaban las del mensaje actual.
- **Solucion**:
  1. `getAccumulatedEntities()` recopila TODAS las entidades de la conversacion completa (no solo la ultima)
  2. Se pasa "DATOS YA CONOCIDOS" y "Datos que FALTAN" a Claude como contexto adicional
  3. Regla en prompt: "NUNCA vuelvas a preguntar algo que ya se sabe"
- **Archivo**: `server/src/services/botEngine.ts`, `server/src/services/claudeService.ts`
- **Estado**: RESUELTO

---

## Tarifas de Referencia (verificacion)

| Departamento   | Temp. Baja | Temp. Media | Temp. Alta | Capacidad |
|----------------|------------|-------------|------------|-----------|
| Pewmafe        | $70.000    | $90.000     | $120.000   | 4 pers    |
| Luminar Mono   | $65.000    | $85.000     | $100.000   | 3 pers    |
| Luminar 2Amb   | $70.000    | $90.000     | $120.000   | 4 pers    |
| LG             | $80.000    | $95.000     | $130.000   | 4 pers    |

## Temporadas
- Baja: Mar-Jun, Ago-Nov
- Media: Jul, 1-14 Dic
- Alta: 15 Dic - Feb
