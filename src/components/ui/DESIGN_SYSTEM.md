# Design System - Chatbot Alojamiento

## Tono y voz de marca

### Personalidad

- **Profesional y cercano**: trato de _vos_ (voseo rioplatense), tono cálido pero formal.
- **Directo**: frases cortas, sin ambigüedad. Evitar jerga técnica en mensajes al usuario final.
- **Empático**: reconocer errores sin culpar al usuario. Ej: "No pudimos procesar tu solicitud" (no "Enviaste datos incorrectos").

### Reglas de escritura

- **Voseo**: "Ingresá", "Repetí", "Seleccioná" (imperativo con acento en la última sílaba).
- **Acentos obligatorios**: Siempre usar tildes correctas. "Configuración", "información", "teléfono", "dirección", "descripción", "ubicación", "número", "próximo", "último", "métricas", "depósito", "estadía", "políticas", "seña", "automáticamente".
- **Mayúsculas**: Solo la primera letra en títulos de sección, botones y labels. Ej: "Nueva reserva" (no "Nueva Reserva"), excepto nombres propios.
- **Puntuación**: Los labels de formulario no llevan punto final. Los mensajes de error y confirmación sí.

### Idiomas soportados

- **Español Argentina** (`es`): idioma principal, voseo, formato ARS.
- **English** (`en`): traducción completa disponible.
- El selector de idioma está en el header (icono Globe).

---

## Paleta de colores

### Primary (acciones principales)

| Token      | Valor     | Uso                                                  |
| ---------- | --------- | ---------------------------------------------------- |
| `blue-500` | `#3b82f6` | Focus rings                                          |
| `blue-600` | `#2563eb` | Botones primarios, links activos, tabs seleccionados |
| `blue-700` | `#1d4ed8` | Hover de botones primarios                           |

### Status (estados de conversación/reserva)

| Color    | Token            | Estado                        | Nota                           |
| -------- | ---------------- | ----------------------------- | ------------------------------ |
| Cyan     | `cyan-100/800`   | `bot`                         | Diferenciado del azul primario |
| Amarillo | `yellow-100/800` | `espera_humano`               |                                |
| Verde    | `green-100/800`  | `humano_activo`, `confirmada` |                                |
| Gris     | `gray-100/800`   | `cerrado`, default            |                                |
| Naranja  | `orange-100/800` | `pre_reserva`                 |                                |
| Rojo     | `red-100/800`    | Errores, `cancelada`          |                                |
| Púrpura  | `purple-100/800` | `completada`                  | Diferenciado del azul primario |

> **Nota:** Azul (`blue`) queda reservado exclusivamente para acciones primarias (botones, links, focus). Los estados usan cyan y púrpura para evitar confusión.

### Semantic

| Rol     | Background                     | Text                        |
| ------- | ------------------------------ | --------------------------- |
| Success | `green-50` / `green-100`       | `green-600` / `green-700`   |
| Error   | `red-50` / `red-900/30` (dark) | `red-500` / `red-600`       |
| Warning | `yellow-50`                    | `yellow-600` / `yellow-800` |

### Dark mode

| Elemento         | Clase                                           |
| ---------------- | ----------------------------------------------- |
| Fondo página     | `dark:bg-gray-900`                              |
| Fondo cards      | `dark:bg-gray-800`                              |
| Fondo inputs     | `dark:bg-gray-700`                              |
| Bordes           | `dark:border-gray-600` / `dark:border-gray-700` |
| Texto principal  | `dark:text-gray-100`                            |
| Texto secundario | `dark:text-gray-300` / `dark:text-gray-400`     |

---

## Tipografía

### Font stack

**Inter** como fuente principal, con fallback a system fonts:

```
'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

Cargada desde Google Fonts con pesos 400, 500, 600, 700.

### Escala de tamaños

| Token              | Uso                                          |
| ------------------ | -------------------------------------------- |
| `text-xs` (12px)   | Labels de form, metadata, counters           |
| `text-sm` (14px)   | Body text, inputs, botones                   |
| `text-base` (16px) | Títulos de header                            |
| `text-lg` (18px)   | Títulos de página (`<h1>`), headers de modal |
| `text-2xl` (24px)  | Títulos principales (login)                  |

### Pesos

| Token                 | Uso                              |
| --------------------- | -------------------------------- |
| `font-normal` (400)   | Body text, placeholders          |
| `font-medium` (500)   | Labels, body enfatizado          |
| `font-semibold` (600) | Section headers, subtítulos      |
| `font-bold` (700)     | Títulos de página, modal headers |

---

## Border Radius

| Token               | Uso                                        | Contexto                             |
| ------------------- | ------------------------------------------ | ------------------------------------ |
| `rounded-md` (6px)  | Inputs, botones, selects, textareas        | Elementos de formulario interactivos |
| `rounded-lg` (8px)  | Cards, modales, paneles, dropdowns, alerts | Contenedores de contenido            |
| `rounded-full`      | Badges, avatars, pills, dots, spinners     | Elementos circulares/pill            |
| `rounded-xl` (12px) | Solo iconos decorativos en stat cards      | Uso excepcional                      |

> **Regla**: No usar `rounded` sin sufijo (4px) en inputs ni botones. Mínimo `rounded-md`.

---

## Spacing

### Estándar de gaps

| Token               | Uso                                                         |
| ------------------- | ----------------------------------------------------------- |
| `gap-1` / `gap-1.5` | Entre icono y texto dentro de un botón                      |
| `gap-2`             | Entre elementos inline (botones, badges, iconos en toolbar) |
| `gap-3`             | Grids de formulario, listas compactas                       |
| `gap-4`             | Entre secciones mayores, grid de stat cards                 |

### Padding

| Contexto                | Patrón                                      |
| ----------------------- | ------------------------------------------- |
| Página                  | `p-4 md:p-6`                                |
| Card                    | `p-4` (compacto) / `p-5` / `p-6` (estándar) |
| Input standard          | `px-3 py-2`                                 |
| Input compact (modales) | `px-2 py-1.5`                               |
| Modal header/footer     | `px-5 py-3`                                 |
| Modal body              | `p-5`                                       |

### Márgenes entre secciones

| Contexto                | Patrón                                             |
| ----------------------- | -------------------------------------------------- |
| Form gap (entre campos) | `space-y-4`                                        |
| Page sections           | `mb-6`                                             |
| Modal max-width         | `max-w-2xl` (forms) / `max-w-sm` (confirm dialogs) |

---

## Internacionalización (i18n)

### Estructura

- **Framework**: i18next + react-i18next
- **Archivos**: `src/locales/es.json`, `src/locales/en.json`
- **Config**: `src/i18n.ts` — detecta idioma guardado en `localStorage`
- **Formato monetario**: `src/utils/format.ts` — `formatCurrency()` usa `Intl.NumberFormat('es-AR', { currency: 'ARS' })`

### Uso en componentes

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('namespace.key')}</h1>;
}
```

### Namespaces

`auth`, `resetPassword`, `common`, `nav`, `app`, `chat`, `dashboard`, `reservas`, `calendar`, `complejos`, `tarifas`, `emails`, `bot`, `whatsapp`, `logs`, `status`, `guests`, `confirm`

---

## Inventario de componentes

### Badge

**Archivo:** `Badge.tsx`
**Exports:** `Badge` (default), `estadoColor()`, `estadoLabel()`

```tsx
import Badge, { estadoColor, estadoLabel } from './ui/Badge';

<Badge color="green">Activo</Badge>
<Badge color={estadoColor(conv.estado)}>{estadoLabel(conv.estado)}</Badge>
```

**Props:**

- `children: ReactNode` — Contenido del badge
- `color?: string` — `'green' | 'yellow' | 'cyan' | 'purple' | 'red' | 'gray' | 'orange' | 'blue'` (default: `'gray'`)

---

### Avatar

**Archivo:** `Avatar.tsx`
**Export:** `Avatar` (default)

```tsx
import Avatar from './ui/Avatar';

<Avatar name="Juan Pérez" size="md" />
<Avatar name="María" identifier="5491155001234" size="sm" />
```

**Props:**

- `name: string` — Nombre para generar iniciales
- `identifier?: string` — Seed para color consistente (ej: waId)
- `size?: 'sm' | 'md'` — Tamaño (`sm`: 24px, `md`: 32px; default: `'md'`)

---

### EmptyState

**Archivo:** `EmptyState.tsx`
**Export:** `EmptyState` (default)

```tsx
import EmptyState from './ui/EmptyState';

<EmptyState title={t('chat.noConversations')} description={t('app.chatEmptyDescription')} illustration="chat" />;
```

**Props:**

- `title: string` — Título principal (siempre vía `t()`)
- `description?: string` — Subtítulo opcional
- `illustration?: 'chat' | 'reservas' | 'emails' | 'complejos'` — SVG decorativo

---

### ConfirmDialog

**Archivo:** `ConfirmDialog.tsx`
**Export:** `ConfirmDialog` (default)

```tsx
import ConfirmDialog from './ui/ConfirmDialog';

<ConfirmDialog
  open={showConfirm}
  title={t('reservas.deleteTitleSingle')}
  message={t('reservas.deleteMessageSingle')}
  confirmLabel={t('common.delete')}
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>;
```

**Props:**

- `open: boolean` — Visibilidad
- `title: string` — Título del dialog
- `message: string` — Mensaje descriptivo
- `confirmLabel?: string` — Texto del botón de confirmación (default: i18n `confirm.confirmButton`)
- `cancelLabel?: string` — Texto del botón cancelar (default: i18n `confirm.cancelButton`)
- `variant?: 'danger' | 'warning'` — Estilo visual (default: `'danger'`)
- `loading?: boolean` — Estado de carga
- `onConfirm: () => void` — Callback al confirmar
- `onCancel: () => void` — Callback al cancelar

---

### ErrorBoundary

**Archivo:** `ErrorBoundary.tsx`
**Export:** `ErrorBoundary` (named)

```tsx
import { ErrorBoundary } from './ui/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>;
```

**Props:**

- `children: ReactNode` — Contenido a proteger

---

### Skeleton

**Archivo:** `Skeleton.tsx`
**Export:** `Skeleton` (default)

```tsx
import Skeleton from './ui/Skeleton';

<Skeleton className="h-4 w-32" />
<Skeleton className="h-8 w-full rounded-lg" />
```

**Props:**

- `className?: string` — Clases adicionales para dimensiones

---

## Patrones comunes

### Form inputs (label + input)

```tsx
{
  /* Standard form field */
}
<div>
  <label htmlFor="field-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    {t('namespace.label')}
  </label>
  <input
    id="field-id"
    type="text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      bg-white dark:bg-gray-700 dark:text-gray-100"
  />
</div>;

{
  /* Compact form field (modals) */
}
<div>
  <label htmlFor="field-id" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
    {t('namespace.label')}
  </label>
  <input
    id="field-id"
    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5
      bg-white dark:bg-gray-700 dark:text-gray-100"
  />
</div>;
```

### Error / success messages

```tsx
{
  /* Error message (role="alert" for screen readers) */
}
{
  error && (
    <p role="alert" className="text-red-500 text-sm bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
      {error}
    </p>
  );
}

{
  /* Success message (role="status" for screen readers) */
}
{
  success && (
    <p role="status" className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
      {success}
    </p>
  );
}
```

### Cards

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-5">
  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
    {t('namespace.sectionTitle')}
  </h3>
  {/* content */}
</div>
```

### Botones

```tsx
{
  /* Primary (gradient) */
}
<button
  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md
  hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium
  shadow-md shadow-blue-500/20 transition-all"
>
  {t('common.save')}
</button>;

{
  /* Primary (solid) */
}
<button
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm
  font-medium hover:bg-blue-700 disabled:opacity-50"
>
  <Icon size={16} /> {t('common.save')}
</button>;

{
  /* Danger */
}
<button className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
  <Trash2 size={14} /> {t('common.delete')}
</button>;

{
  /* Ghost / secondary */
}
<button
  className="text-sm px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md
  hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
>
  {t('common.cancel')}
</button>;
```

### Modal layout

```tsx
<div
  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700">
      <h3 id="modal-title" className="text-lg font-bold text-gray-800 dark:text-gray-100">
        {t('namespace.modalTitle')}
      </h3>
      <button aria-label={t('common.close')}>
        <X size={20} />
      </button>
    </div>
    {/* Body */}
    <div className="flex-1 overflow-y-auto p-5">{/* content */}</div>
    {/* Footer */}
    <div
      className="flex items-center justify-end gap-2 px-5 py-3 border-t dark:border-gray-700
      bg-gray-50 dark:bg-gray-900"
    >
      <button>{t('common.cancel')}</button>
      <button>{t('common.save')}</button>
    </div>
  </div>
</div>
```
