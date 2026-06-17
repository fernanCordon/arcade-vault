---
name: spec-juego
description: "Genera el spec de integración de un juego arcade en Arcade Vault: módulo TS sobre canvas HTML5 + leaderboard genérico ya existente. Úsalo antes de implementar cualquier juego nuevo, venga o no de references/started-games/."
disable-model-invocation: true
argument-hint: 'nombre o descripción corta del juego (p.ej. "tetris" o "snake estilo clásico")'
---

# /spec-juego — Generador de specs de integración de juegos arcade

Este skill produce el spec de integración de un nuevo juego en Arcade Vault. **No se escribe código aquí.** Tu trabajo es clarificar con el usuario qué juego se va a integrar, cuál es su mecánica, y generar un spec accionable que `/spec-impl` pueda ejecutar después.

## Filosofía

El spec es el contrato que ejecuta `/spec-impl`. Si el spec es vago, el código improvisa. Por eso la fase de definición es **deliberadamente lenta** y la de escritura es rápida.

La infraestructura de leaderboard (tabla `scores`, `src/lib/scores.ts`, modal en `Reproductor.vue`, `Detalle.vue`, `Salon.vue`) **ya existe y es genérica**: opera por `game_id` sin modificar código. El spec de un juego nuevo solo cubre:

1. El módulo TypeScript del juego (`src/games/<id>/game.ts`).
2. Registrar el juego en el catálogo (`src/data/games.ts` y/o tabla `games` en Supabase).
3. La clase CSS de portada (`.cover-<id>`) si no existe en `src/style.css`.

Cualquier cosa fuera de esas tres áreas es muy probable que ya esté construida.

## Flujo del comando

Sigue las cuatro fases en orden. **No saltes fases.** Si el usuario quiere ir más rápido, recuérdale que el coste de un spec malo se paga después en código.

Responde siempre en el mismo idioma del prompt inicial.

---

### Fase 1 — Contexto del proyecto

Antes de preguntar al usuario, lee el estado actual del sistema:

1. Lee `CLAUDE.md` raíz — arquitectura del proyecto, rutas del router, design tokens, estructura de `src/`.
2. Lista `specs/` para determinar el número correlativo siguiente (el último define el próximo `NN`).
3. Lee `specs/06-asteroids-integracion.md` — es la plantilla de referencia de la que deriva el spec resultante.
4. Lee `template.md` (en el mismo directorio que este skill) — esqueleto del spec a generar.
5. Comprueba si existe `references/started-games/<id>/` y lee su `CLAUDE.md` si lo tiene. Esto determina si hay una referencia JS pura que refactorizar o si el juego se diseña desde cero.
6. Revisa el contrato vivo (para no reinventarlo):
   - `src/games/asteroids/game.ts` — patrón del módulo TS (interfaces, factoría, listeners, rAF, callbacks).
   - `src/pages/reproductor/Reproductor.vue` — dynamic import `../../games/${id}/game.ts`; fallback mock si falla.
   - `src/data/games.ts` — interfaz `Game` y `CATS` válidas.
   - `src/lib/scores.ts` — `submitScore` / `getScores`; tabla `scores`.

Si `$ARGUMENTS` llega vacío, pide al usuario una descripción en **una sola frase** del juego a integrar.

---

### Fase 2 — Preguntas guiadas

Esta es la fase más importante. Tu trabajo es **detectar ambigüedades y preguntar**, no asumir.

Haz preguntas en bloques de 3 a 5. Espera respuesta antes de continuar con el siguiente bloque.

#### Bloque A — Identidad y catálogo

1. **`id` del juego** (kebab-case, sin espacios). Este id es el nombre de carpeta en `src/games/<id>/`, el valor de `route.params.id`, y la clave `game_id` en la tabla `scores`. Debe ser único respecto a los juegos existentes en `src/data/games.ts`.
2. **Título, `short` y `long`** (`title` en mayúsculas estilo arcade; `short` ≤ 50 chars; `long` ≤ 200 chars).
3. **Categoría** (`cat`): `ARCADE`, `PUZZLE`, `SHOOTER` o `VERSUS`.
4. **Color de acento** (`color`): `cyan`, `magenta`, `yellow` o `green`. Es el color del borde y detalles de la card.
5. **Clase de portada** (`cover`): convención `cover-<id>`. ¿Existe ya en `src/style.css`? Si no, habrá que añadirla — el spec debe incluirlo en el alcance.

#### Bloque B — Origen del juego

1. ¿Existe `references/started-games/<id>/game.js`? Si sí, el spec describe el **refactor a módulo TS**. Si no, el spec describe la **implementación desde cero** del bucle de juego.
2. Si viene de referencia: ¿hay diferencias entre el original y lo que se quiere en la plataforma (dimensiones, mecánica, HUD, power-ups)?
3. **Dimensiones del canvas** (ancho × alto en px). El contenedor `.crt-screen` aplica `max-width:100%; height:auto` — ¿hay restricciones de aspecto ratio?

#### Bloque C — Mecánica y HUD

1. **`onScoreChange(score)`** — ¿cuándo sube el score y en qué cantidad? (destruir enemigos, recoger items, avanzar nivel…)
2. **`onLifeLost(lives)`** — ¿cuándo pierde una vida el jugador? ¿con cuántas vidas empieza?
3. **`onLevelUp(level)`** — ¿hay niveles o es continuo? Si hay niveles, ¿qué los dispara?
4. **`onGameOver(finalScore)`** — condición de fin de partida (¿vidas agotadas? ¿tiempo? ¿otra?).
5. **Controles de teclado** (teclas usadas para movimiento, disparo, acción). Hay que declarar cuáles para documentar el `preventDefault` necesario.

#### Bloque D — Registro en catálogo

El catálogo es híbrido: `src/data/games.ts` (array estático `GAMES`) + tabla `games` en Supabase (merge en el store Pinia).

1. ¿Se añade la entrada en `GAMES` de `games.ts`, en la tabla `games` de Supabase, o en ambos?
2. Si va a Supabase: ¿el entorno tiene las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` configuradas? (Necesario para que funcione el dynamic import y el leaderboard.)

**Cuándo parar de preguntar:** cuando puedas responder sin asumir nada:

- ¿Qué archivos aparecen o cambian?
- ¿Cuál es el primer paso ejecutable y cuál el último?
- ¿Cómo se verifica que el juego está integrado?

---

### Fase 3 — Escribir el spec sección a sección

Con toda la información recogida, rellena `template.md` **sección a sección**. Muestra cada sección al usuario y espera confirmación antes de pasar a la siguiente. Si pide cambios, aplícalos y vuelve a mostrar.

Orden estricto:

1. **Cabecera** — estado (`Borrador`), dependencias, fecha, objetivo en una frase.
2. **Alcance** — qué está dentro y qué fuera. Lo que está fuera debe ser explícito.
3. **Modelo de datos** — entrada `Game` completa + interfaces `<Name>Callbacks` y `<Name>Game`.
4. **Plan de implementación** — pasos numerados, cada uno deja el sistema funcional.
5. **Criterios de aceptación** — checklist booleano, verificable, sin "que funcione bien".
6. **Decisiones tomadas y descartadas** — tabla con razones.
7. **Riesgos identificados** — solo si aplican; si no hay riesgos relevantes, omitir la sección.

#### Notas fijas que el spec SIEMPRE debe incluir

Estos puntos son invariantes del proyecto — van en las secciones correspondientes sin que el usuario tenga que pedirlos:

**En "Fuera del spec" (Alcance):**
- Cambios en `Reproductor.vue`, `Detalle.vue`, `Salon.vue` o `src/lib/scores.ts` — la infraestructura de leaderboard ya es genérica y opera por `game_id`.
- Controles táctiles / mobile.
- Paginación del leaderboard.

**En el Plan de implementación:**
- Paso final: `npm run build` sin errores de TypeScript.
- El paso de "registrar en catálogo" debe aclarar si es `GAMES` local, seed en Supabase, o ambos.

**En los Criterios de aceptación:**
- Al desmontar `Reproductor.vue`, no quedan listeners de teclado ni rAF activos.
- Los juegos sin módulo real (los que no tienen `src/games/<id>/game.ts`) siguen mostrando el mock sin cambios.

**En Riesgos (si aplica):**
- **Listeners de teclado globales:** `start()` registra en `window`; `destroy()` debe eliminarlos con `removeEventListener` explícito sobre las mismas referencias de función.
- **rAF en segundo plano:** `onUnmounted` de Vue debe llamar siempre a `game.destroy()`.
- **Canvas fijo vs `.crt-screen`:** aplicar `max-width:100%; height:auto` al canvas; las coordenadas internas no cambian.

**Advertencia sobre bug latente** (incluir en la sección de Riesgos o como nota en el plan):
> `Reproductor.vue` tiene un bug en `exit()` — navega a `/juego/${id}` en vez de `/games/${id}` (el router define `/games/:id`). Si el juego nuevo expone el botón de salida, este bug se activará. Se puede corregir en la misma PR de integración o en un fix aparte.

#### Contrato del módulo que el spec debe documentar

El módulo `src/games/<id>/game.ts` debe respetar este contrato (derivado de `src/games/asteroids/game.ts`):

```ts
export interface <Name>Callbacks {
  onScoreChange: (score: number) => void
  onLifeLost: (lives: number) => void
  onLevelUp: (level: number) => void
  onGameOver: (finalScore: number) => void
}

export interface <Name>Game {
  start: (canvas: HTMLCanvasElement, callbacks: <Name>Callbacks) => void
  pause: () => void
  resume: () => void
  restart: () => void
  destroy: () => void
}
```

- Estado a nivel de módulo (vars `let`), no clase ni factory.
- `export const game: <Name>Game = { ... }` + `export default game`.
- Listeners de teclado guardados en vars de módulo (no anónimas inline) para poder eliminarlos en `destroy()`.
- Loop rAF con `dt` cap a `0.05` (50 ms) para evitar espiral de muerte al volver de background.
- `lastTime = null` al inicio de `start()`, `resume()` y `restart()` para evitar saltos de dt.
- `onGameOver` se dispara una única vez (flag `gameOverFired`).
- `destroy()` cancela rAF, elimina listeners, nullea `canvas/ctx/cbs`, limpia `keys`/`justPressed`.

---

### Fase 4 — Guardar el spec

Cuando todas las secciones estén confirmadas:

1. Determina el número correlativo mirando `specs/` (último número + 1).
2. Propone el nombre de archivo: `specs/NN-<id>-integracion.md`. Confirma con el usuario antes de escribir.
3. Escribe el archivo con todas las secciones aprobadas.
4. Confirma al usuario:
   - Ruta del archivo creado.
   - El spec está en estado `Borrador`. Cambia a `Aprobado` una vez releído.
   - Siguiente paso: cuando esté aprobado, ejecutar `/spec-impl NN-<id>-integracion` para implementarlo.
5. **Para aquí.** No propongás implementar el spec, escribir código ni tomar ninguna acción adicional.

---

## Reglas duras

- **Nunca escribas código durante este comando.** Solo el archivo `.md` del spec al final.
- **Nunca generes el spec completo de una vez.** Sección a sección, con confirmación.
- **Nunca asumas decisiones que el usuario no confirmó.** Si falta información, pregunta.
- **Nunca propongás implementar el spec tras guardarlo.** Tu trabajo termina cuando el archivo está escrito.
- **Si el juego es demasiado grande** (más de tres áreas del sistema que requieren diseño propio), propón dividirlo en specs separados antes de continuar.
- **Si el usuario quiere saltarse la Fase 2**, recuérdale: "Las preguntas ahora ahorran horas después. ¿Seguro que quieres saltarlas?" Si insiste, respeta su decisión y regístrala en la sección de decisiones del spec.

## Tono al preguntar

Directo y específico. No pidas disculpas por preguntar. No uses "si no te importa…" ni "¿podrías quizás…?". El usuario invocó este skill precisamente para que preguntes. Usa preguntas concretas, una por línea cuando hay varias, numeradas para que sean fáciles de contestar.
