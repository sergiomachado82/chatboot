# Bug Report: Pewmafe reportado como no disponible estando libre

**Fecha:** 2026-03-10
**Severidad:** Critica
**Componentes afectados:** `inventarioService.ts`, `botEngine.ts`
**Estado:** RESUELTO

---

## Sintoma

El bot responde "Lamentablemente Pewmafe no esta disponible para las fechas del X al Y de marzo, ya tiene reserva" cuando en realidad:
- El inventario de Pewmafe muestra TODAS las fechas como `disponible: true`
- Solo 1 de 4 departamentos tiene una reserva que se superpone con las fechas solicitadas
- Esa reserva tiene estado `completada` (el huesped ya hizo checkout)

## Investigacion

### Paso 1: Verificar inventario
```sql
-- Inventario Pewmafe Mar 8-15: 7 slots, 0 occupied
Pewmafe: 15 slots, 0 occupied
```
Resultado: Inventario OK, todas las fechas disponibles.

### Paso 2: Verificar reservas
```sql
-- Reservas que se superponen con Mar 9-14
Pewmafe | completada | 2026-03-11 - 2026-03-14 | Macarena
```
Resultado: Existe UNA reserva con estado `completada`.

### Paso 3: Trazar la logica de checkAvailability
```typescript
// inventarioService.ts — linea 33-40
const conflictos = await prisma.reserva.count({
  where: {
    habitacion: hab,
    estado: { notIn: ['cancelada', 'cancelado'] },  // <-- BUG: falta 'completada'
    fechaEntrada: { lt: fechaSalida },
    fechaSalida: { gt: fechaEntrada },
  },
});
if (conflictos > 0) continue;  // <-- Pewmafe se salta por la reserva completada
```

**Root Cause 1:** La reserva `completada` de Macarena cuenta como conflicto porque `completada` NO esta en la lista `notIn`. Resultado: `conflictos = 1` → Pewmafe se salta completamente.

### Paso 4: Verificar contexto enviado a Claude
```
DEPARTAMENTOS NO DISPONIBLES para las fechas 2026-03-11 a 2026-03-15
(ya tienen reserva): Luminar Mono, Luminar 2Amb, LG.
```

**Root Cause 2:** Cuando el usuario pregunta por un departamento especifico (Pewmafe), `checkAvailability` solo verifica ESE departamento. Luego `botEngine.ts` calcula "ocupados" como `TODOS - resultados`. Si Pewmafe es el unico verificado y esta disponible, los otros 3 se listan falsamente como "NO DISPONIBLES" — aunque nunca fueron verificados.

```typescript
// botEngine.ts — logica erronea
const ALL_HABITATIONS = ['Pewmafe', 'Luminar Mono', 'Luminar 2Amb', 'LG'];
const availableNames = new Set(results.map(r => r.habitacion));
// Si results solo tiene Pewmafe, los otros 3 se listan como occupied — INCORRECTO
const occupied = ALL_HABITATIONS.filter(h => !availableNames.has(h));
```

---

## Root Cause (resumen)

**2 bugs independientes, mismo archivo de logica:**

| # | Archivo | Bug | Impacto |
|---|---------|-----|---------|
| 1 | `inventarioService.ts` | Reservas `completada` no excluidas del conteo de conflictos | Departamentos con reservas pasadas (huesped ya salio) se reportan como ocupados |
| 2 | `botEngine.ts` | Derivar "ocupados" de `TODOS - resultados` cuando solo se verifico 1 depto | Departamentos NO verificados se listan falsamente como "NO DISPONIBLES" en el contexto de Claude |

---

## Correccion

### Fix 1: inventarioService.ts (3 lugares)
```diff
- estado: { notIn: ['cancelada', 'cancelado'] },
+ estado: { notIn: ['cancelada', 'cancelado', 'completada'] },
```

Aplicado en:
- `checkAvailability()` — linea 36
- `getOccupiedDepartments()` — linea 77
- `releaseDatesIfNotReserved()` — linea 149

**Logica:** Una reserva `completada` significa que el huesped ya hizo checkout. Las fechas estan liberadas en el inventario. No debe bloquear disponibilidad futura.

### Fix 2: botEngine.ts
```diff
- // Derive occupied departments from availability results
- const ALL_HABITATIONS = ['Pewmafe', 'Luminar Mono', 'Luminar 2Amb', 'LG'];
- const availableNames = new Set(results.map(r => r.habitacion));
- const occupied = ALL_HABITATIONS.filter(h => !availableNames.has(h));
- if (occupied.length > 0) {
-   additionalContext += `\nDEPARTAMENTOS NO DISPONIBLES...`;
- }
+ // Only derive occupied when checking ALL departments (no specific habitacion filter)
+ if (!habitacion) {
+   const ALL_HABITATIONS = ['Pewmafe', 'Luminar Mono', 'Luminar 2Amb', 'LG'];
+   const availableNames = new Set(results.map(r => r.habitacion));
+   const occupied = ALL_HABITATIONS.filter(h => !availableNames.has(h));
+   if (occupied.length > 0) {
+     additionalContext += `\nDEPARTAMENTOS NO DISPONIBLES...`;
+   }
+ }
```

**Logica:** Cuando `checkAvailability` se llama con un departamento especifico, solo verifica ese. Los demas NO fueron verificados, asi que no se puede asumir que estan ocupados.

---

## Verificacion

### Test manual post-fix
```
Input:  "Hola quiero saber si pewmafe esta disponible del 11 al 15 de marzo para 4 personas"
Output: "¡Hola! Sí, Pewmafe está disponible del 11 al 15 de marzo para 4 personas.
         Son 4 noches en temporada baja, el precio total es de $280.000 ARS ($70.000 por noche).
         ¿Querés proceder con la reserva?"
```

### Contexto verificado
```
Resultados de disponibilidad:
- Depto Pewmafe: disponible, 4 noches, $280000 ARS total
```
Sin lineas falsas de "DEPARTAMENTOS NO DISPONIBLES".

---

## Leccion aprendida

1. **Estados de reserva**: El ciclo de vida es `pre_reserva → confirmada → completada` y `cancelada`. Solo `pre_reserva` y `confirmada` deben bloquear disponibilidad. `completada` y `cancelada` = fechas libres.

2. **Logica de derivacion**: Nunca derivar "X no esta" de "X no esta en los resultados" cuando la consulta esta filtrada. El universo de resultados posibles depende del filtro aplicado.

3. **Testing**: Este tipo de bug solo se manifiesta cuando hay reservas `completada` en el sistema (datos reales post-checkout). Los tests con inventario limpio o solo `pre_reserva` no lo detectan.
