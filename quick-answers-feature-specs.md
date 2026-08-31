# Quick Answers Manager — Feature Specs

> Contexto para el agente de código: app de gestión de respuestas rápidas (Next.js + React, deploy en Vercel). Contiene Topics → Categories → Responses, cada Response tiene versiones por idioma (ES/EN/PT). Ya existe: copiar con un clic, dark mode, notas con tags, macros multi-idioma, agente de IA básico.
>
> Nota: estas specs asumen la estructura de datos típica `Topic > Category > Response { id, title, description, translations: { es, en, pt } }`. Ajustar nombres de campos/tablas según el esquema real del proyecto antes de implementar.

---

## 1. Buscador global (Cmd+K)

**Objetivo:** buscar en todos los topics/categorías/idiomas simultáneamente, sin depender de la categoría seleccionada en el sidebar.

**Implementación:**
- Componente `<CommandPalette />` (modal overlay), trigger con `Cmd+K` / `Ctrl+K` (listener global en `useEffect` a nivel de layout raíz).
- Índice de búsqueda: aplanar todos los `responses` en memoria al cargar (o vía query) con estructura:
  ```ts
  { id, topicName, categoryName, title, description, translations: {es, en, pt} }
  ```
- Búsqueda fuzzy sobre `title`, `description` y las 3 traducciones. Librería sugerida: `fuse.js` (ligera, sin backend, buen fuzzy matching) con `keys: ['title', 'description', 'translations.es', 'translations.en', 'translations.pt']` y `threshold: 0.35`.
- Resultados agrupados por Topic/Categoría, con highlight del texto coincidente.
- Navegación con teclado (flechas + Enter) y clic para saltar directo a esa respuesta (o copiarla directo desde el resultado, ver punto de acceso rápido abajo).
- Cerrar con `Esc` o clic fuera.

**Acceptance criteria:**
- Abre desde cualquier vista con `Cmd+K`.
- Encuentra resultados aunque el término esté en un idioma distinto al que se está viendo.
- Funciona sin necesidad de expandir manualmente el sidebar.

---

## 2. Favoritos / Pines

**Objetivo:** marcar respuestas de uso frecuente para acceso inmediato.

**Implementación:**
- Nuevo campo `isPinned: boolean` (o tabla/colección separada `pinned_responses { userId, responseId, pinnedAt }` si es multi-usuario).
- Ícono de pin en cada `ResponseCard`, toggle on click, con optimistic update.
- Nueva sección fija "⭐ Favoritos" arriba del listado normal (o un Topic virtual "Favoritos" en el sidebar, similar a "Todos los Temas").
- Persistencia: localStorage si es single-user sin backend; si hay backend/auth (parece que sí, hay login), persistir por `userId` en DB.
- Límite sugerido de UX (no hard limit): si hay >10 pines, mostrar scroll en vez de crecer infinito.

**Acceptance criteria:**
- Pin/unpin sin recargar página.
- Los pines persisten entre sesiones (recargar navegador, volver a loguearse).
- Favoritos visibles sin necesidad de navegar por categoría.

---

## 3. Contador de uso

**Objetivo:** trackear cuántas veces se copia cada respuesta, mostrarlo en la tarjeta.

**Implementación:**
- Campo `usageCount: number` en el modelo `Response` (default 0).
- Incrementar `usageCount` en el mismo handler que ya dispara "copiar al portapapeles" (evento `onCopy`). Si el backend es serverless/DB (Supabase, etc.), usar un increment atómico (`usageCount = usageCount + 1`) para evitar condiciones de carrera.
- Mostrar badge pequeño en la esquina de cada `ResponseCard`: `Usado {{usageCount}} veces` (o ícono + número si el espacio es limitado).
- Opcional (fácil de agregar después): endpoint/vista simple `GET /api/stats/top-responses` que devuelva top 10 ordenado por `usageCount`, para el approach de "esto es lo que uso más, tal vez debería automatizarse".

**Acceptance criteria:**
- El contador sube cada vez que se hace clic en "copiar", no al solo ver la tarjeta.
- El valor persiste (no se resetea al recargar).
- No bloquea ni retrasa perceptiblemente el copiado (fire-and-forget al backend, no bloquear el `navigator.clipboard.writeText`).

---

## 4. Variables del sistema de chat (dependencia externa)

**Objetivo:** en vez de placeholders genéricos, insertar variables reales que ya existen en el sistema de chat de Airtm (`user.name`, etc.) para que el texto copiado quede listo para pegar tal cual.

**Pre-requisito (bloqueante):** confirmar con el equipo/documentación interna qué variables expone el sistema de chat y su sintaxis exacta (ej. `{{user.name}}`, `${user.name}`, u otro formato propio de la plataforma). **No inventar sintaxis** — debe coincidir exactamente con lo que el sistema de chat interpreta, si no, el texto pegado no se va a reemplazar y quedará roto frente al cliente.

**Implementación (una vez se tenga la lista de variables):**
- Config estática `chatVariables.ts` con la lista de variables disponibles y su sintaxis exacta:
  ```ts
  export const CHAT_VARIABLES = [
    { key: 'user.name', label: 'Nombre del usuario', syntax: '{{user.name}}' },
    { key: 'ticket.id', label: 'ID del ticket', syntax: '{{ticket.id}}' },
    // ...
  ]
  ```
- En el editor de respuestas (Create/Edit Response), agregar un dropdown/menú "Insertar variable" que inyecta la sintaxis exacta en el cursor del textarea.
- En la tarjeta de respuesta (vista de lectura), si el texto contiene variables, resaltarlas visualmente (mismo estilo del highlight azul que ya usan para texto importante) para que el agente vea a simple vista qué se va a reemplazar.
- **Importante:** esta app solo inserta la variable en el texto (el reemplazo real del valor lo hace el sistema de chat al pegarlo ahí). No intentar resolver el valor real de la variable dentro de esta app a menos que haya una API expuesta para eso.

**Acceptance criteria:**
- Las variables insertadas coinciden 100% en sintaxis con lo que el sistema de chat reconoce.
- Se pueden insertar variables al crear/editar una respuesta sin escribir la sintaxis a mano.
- Quedan visualmente identificables en la tarjeta antes de copiar.

---

## 5. Vista compacta / lista

**Objetivo:** alternativa a las tarjetas grandes para escanear más respuestas en menos espacio vertical.

**Implementación:**
- Toggle en la barra superior (ícono grid vs. ícono lista), guardado en `localStorage` (`viewMode: 'cards' | 'compact'`) para persistir preferencia.
- Vista compacta: fila por respuesta con `título + primeras ~80 chars de una traducción + botón copiar + tag de idioma`, sin mostrar el texto completo (expandible con clic o hover para preview).
- Mismo dataset y mismos handlers (copiar, pin, contador), solo cambia el componente de render (`<ResponseCard />` vs `<ResponseRow />`).

**Acceptance criteria:**
- Cambiar de vista no pierde el estado de búsqueda/filtro activo.
- La preferencia de vista persiste entre sesiones.

---

## 6. Exportar / Importar biblioteca (JSON)

**Objetivo:** portabilidad de la biblioteca completa (o de topics/categorías seleccionadas) entre cuentas o para compartir con el equipo.

**Implementación:**
- Botón "Exportar" → genera un JSON con toda la estructura (`topics > categories > responses`, incluyendo `translations`, `tags`), descarga como archivo vía `Blob` + `URL.createObjectURL`.
  ```ts
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  ```
- Botón "Importar" → `<input type="file" accept=".json">`, parsear y validar contra un schema (usar `zod` para validar estructura antes de insertar, evitar corromper datos existentes con un JSON malformado).
- Estrategia de merge al importar: preguntar al usuario "¿Reemplazar todo / Combinar con lo existente?" — combinar es más seguro por default (evita perder datos por accidente).
- Excluir campos de tracking personal del export por default (`usageCount`, `isPinned`) o hacerlos opcionales vía checkbox, ya que esos datos no tienen sentido al compartir con otra persona.

**Acceptance criteria:**
- Exportar y luego importar el mismo archivo reproduce la biblioteca sin pérdida de datos.
- Importar un JSON inválido muestra error claro, no rompe la app ni borra datos existentes.

---

## 7. Instalable como PWA

**Objetivo:** que se pueda instalar como app independiente desde el navegador (ícono propio, carga rápida, sensación nativa).

**Implementación (Next.js):**
- Agregar `manifest.json` en `public/` con `name`, `short_name`, `icons` (192x192 y 512x512 mínimo), `start_url`, `display: "standalone"`, `theme_color`/`background_color` acorde al dark mode existente.
- Link al manifest en `<head>` (o vía `metadata` de Next si usan App Router: `export const metadata = { manifestUrl: '/manifest.json' }`).
- Service worker mínimo para cache de assets estáticos y shell de la app (librería sugerida: `next-pwa` para no armarlo a mano).
- Ícono de instalación / prompt: escuchar evento `beforeinstallprompt`, mostrar botón custom "Instalar app" en vez de depender solo del prompt nativo del navegador.

**Acceptance criteria:**
- Aparece la opción de "Instalar" en Chrome/Edge (desktop y Android).
- Al instalar, abre en ventana propia sin la barra de navegador.
- Funciona con los assets ya cacheados si se pierde momentáneamente la conexión (al menos el shell de la UI, no necesariamente los datos en vivo).

---

## 8. Botón "Reformular" con IA

**Objetivo:** ajustar tono/longitud de una respuesta existente para casos que casi encajan pero no exactamente, sin escribir desde cero.

**Implementación:**
- Botón "Reformular" (ícono varita) en cada `ResponseCard`, junto al de copiar.
- Al hacer clic, abre un popover/modal con opciones rápidas: `Más corta`, `Más cálida/empática`, `Más formal`, `Más directa` (chips seleccionables, no un textarea libre — mantiene la UX rápida/casual del resto de la app).
- Request al mismo backend/endpoint de IA que ya usan para el agente básico, con un prompt tipo:
  ```
  Reescribe el siguiente texto de soporte en [idioma], manteniendo el significado, en tono [más corto/más cálido/etc]:
  ---
  {texto original}
  ---
  Devuelve solo el texto reescrito, sin comentarios.
  ```
- Mostrar el resultado en un preview editable antes de copiar (nunca copiar directo el output de IA sin que el agente lo vea primero — importante en un contexto de soporte al cliente).
- No guardar el resultado reformulado como nueva versión permanente a menos que el usuario explícitamente elija "Guardar como nueva macro".

**Acceptance criteria:**
- El texto reformulado se puede editar antes de copiar.
- Nunca se sobrescribe la macro original sin acción explícita del usuario.
- Funciona sobre las 3 versiones de idioma (reformula en el mismo idioma del texto original, no traduce).

---

## Orden de implementación sugerido
1. Buscador global (Cmd+K) — bajo esfuerzo, alto impacto diario.
2. Favoritos/Pines — bajo esfuerzo, alto impacto diario.
3. Vista compacta — bajo esfuerzo.
4. Contador de uso — esfuerzo medio (requiere persistencia confiable).
5. Exportar/Importar JSON — esfuerzo medio.
6. PWA — esfuerzo medio, independiente del resto.
7. Botón "Reformular" — esfuerzo medio-alto (depende de la integración de IA ya existente).
8. Variables del sistema de chat — bloqueado hasta confirmar la sintaxis real con el equipo/documentación interna.
