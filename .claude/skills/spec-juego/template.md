# Plantilla de spec de integración de juego

Este archivo es la referencia que consulta el skill `/spec-juego` al generar specs. Cada sección incluye su propósito y los placeholders que hay que rellenar. **No es texto para copiar literalmente** — es la forma que el skill debe respetar.

Los placeholders usan la convención `<PLACEHOLDER>`. En el spec final se reemplazan por los valores reales confirmados con el usuario.

---

## Cabecera

```markdown
# NN — Integración del juego <Nombre>

| Campo | Valor |
|---|---|
| Estado | Borrador |
| Dependencias | 06-asteroids-integracion, 07-leaderboard-supabase |
| Fecha | YYYY-MM-DD |
| Objetivo | Integrar el juego <Nombre> (canvas HTML5) en la plataforma Vue como módulo TypeScript en `src/games/<id>/`, conectando su estado interno al HUD de Vue mediante callbacks y exponiendo pause()/resume() para que el contenedor controle el ciclo de juego. |
```

---

## Alcance

```markdown
## Alcance

### Dentro del spec
- `src/data/games.ts` — añadir / descomentar entrada `<id>` en el array `GAMES` (si aplica)
- Tabla `games` en Supabase — insertar seed del juego `<id>` (si aplica)
- `src/games/<id>/game.ts` — <si viene de referencia: "refactorización de `references/started-games/<id>/game.js`"> <si es nuevo: "implementación desde cero"> como módulo TypeScript: recibe el canvas por parámetro, exporta `start()`, `pause()`, `resume()`, `restart()` y `destroy()`, con callbacks `onScoreChange`, `onLifeLost`, `onLevelUp`, `onGameOver`
- `src/style.css` — añadir clase `.cover-<id>` para la portada de la card (si no existe)

### Fuera del spec
- Cambios en `Reproductor.vue`, `Detalle.vue`, `Salon.vue` o `src/lib/scores.ts` — la infraestructura de leaderboard ya es genérica y opera por `game_id` sin modificaciones
- Controles táctiles / mobile
- Paginación del leaderboard
- Cualquier otro juego — cada uno tendrá su propio spec
```

---

## Modelo de datos

Esta sección tiene dos partes: la entrada en el catálogo y las interfaces del módulo.

```markdown
## Modelo de datos

### `src/data/games.ts` — nueva entrada

\`\`\`ts
{
  id: '<id>',
  title: '<TÍTULO EN MAYÚSCULAS>',
  short: '<descripción corta ≤ 50 chars>',
  long: '<descripción larga ≤ 200 chars>',
  cat: '<ARCADE | PUZZLE | SHOOTER | VERSUS>',
  cover: 'cover-<id>',
  color: '<cyan | magenta | yellow | green>',
  best: 0,
  plays: '0',
}
\`\`\`

### Interfaz del módulo `src/games/<id>/game.ts`

\`\`\`ts
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
\`\`\`

`destroy()` cancela el `requestAnimationFrame` activo y elimina los listeners de teclado para evitar fugas de memoria al desmontar el componente Vue.
```

---

## Plan de implementación

Regla: cada paso deja el sistema en estado funcional y committable.

```markdown
## Plan de implementación

1. **Registrar el juego en el catálogo** — <añadir entrada en `GAMES` de `games.ts`> y/o <insertar seed en la tabla `games` de Supabase>. La card aparece en Biblioteca y `Detalle.vue` carga con datos reales. El botón JUGAR navega a `/games/<id>/play` pero muestra el mock (no hay módulo real todavía).

2. **Crear `src/games/<id>/game.ts`** — <si viene de referencia: "refactorizando `references/started-games/<id>/game.js`"> <si es nuevo: "implementando el bucle de juego desde cero">:
   - Encapsular todo el estado (`<variables de estado según el juego>`) en vars a nivel de módulo
   - <Si viene de referencia:> Reemplazar `document.getElementById('canvas')` por el parámetro `canvas: HTMLCanvasElement`
   - Registrar listeners de teclado en `start()` con referencias de función guardadas en vars de módulo (no anónimas inline); limpiarlos en `destroy()`
   - Llamar a los callbacks en los puntos correctos del loop:
     - `onScoreChange` cada vez que el score aumenta (comparar con valor previo)
     - `onLifeLost` cuando <condición de pérdida de vida>
     - `onLevelUp` cuando <condición de subida de nivel> (si aplica)
     - `onGameOver` al entrar en estado final, una única vez (flag `gameOverFired`)
   - Exponer `pause()` (cancela rAF), `resume()` (resetea `lastTime`, reactiva el loop), `restart()` (reinicia estado), `destroy()` (cancela rAF + elimina listeners + nullea refs)
   - Loop rAF con `dt` cap a `0.05` (50 ms)
   - Exportar `export const game: <Name>Game` + `export default game`

3. <Si hay clase CSS de portada nueva:> **Añadir `.cover-<id>` en `src/style.css`** — siguiendo el patrón de las otras clases `.cover-*` existentes (gradiente o imagen de fondo representativa del juego).

4. **Verificar con `npm run build`** que compila sin errores de TypeScript.
```

---

## Criterios de aceptación

Checklist booleano. Cada ítem debe ser verificable con sí o no.

```markdown
## Criterios de aceptación

- [ ] La card de <Nombre> aparece en Biblioteca con categoría <CAT>
- [ ] `/games/<id>` carga `Detalle.vue` con los datos correctos del juego
- [ ] `/games/<id>/play` carga `Reproductor.vue` con el canvas real del juego
- [ ] El canvas renderiza <elementos visuales principales del juego> correctamente
- [ ] Los controles de teclado (<teclas: ← → ↑ Espacio, etc.>) funcionan dentro del canvas
- [ ] El HUD de Vue muestra la puntuación real sincronizada con el juego
- [ ] El HUD de Vue muestra las vidas reales sincronizadas con el juego
- [ ] <Si hay niveles:> El HUD de Vue muestra el nivel real sincronizado con el juego
- [ ] El botón PAUSA detiene el loop del juego (<elementos del juego> dejan de moverse)
- [ ] El botón REANUDAR reactiva el loop desde donde se pausó
- [ ] Al <condición de game over>, se abre el modal de fin de partida con la puntuación final real
- [ ] El botón FIN en el HUD pausa el juego y abre el modal
- [ ] JUGAR DE NUEVO reinicia el canvas con estado limpio (score 0, vidas <N>, nivel 1)
- [ ] El input de nombre en el modal se prerellena con `av_player_name` de localStorage si existe
- [ ] Al hacer submit, el score se guarda en Supabase y aparece en el leaderboard de `Detalle.vue`
- [ ] El botón de submit se deshabilita mientras el envío está en curso y tras un envío exitoso
- [ ] Al desmontar `Reproductor.vue`, no quedan listeners de teclado ni rAF activos
- [ ] Los juegos sin módulo real siguen mostrando el mock sin cambios
- [ ] `npm run build` termina sin errores de TypeScript
```

---

## Decisiones tomadas y descartadas

```markdown
## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Método de embed | Módulo TS con canvas por parámetro | iframe / Web Component | Integración nativa; el HUD de Vue se comunica directamente con el juego |
| HUD | Doble HUD: canvas interno + Vue sincronizado | Solo canvas / Solo Vue | El canvas mantiene su estética arcade; Vue sincroniza para coherencia con la plataforma |
| Comunicación juego→Vue | Callbacks (`onScoreChange`, etc.) | Pinia store / eventos del DOM | Acoplamiento mínimo; el módulo del juego no depende de Vue |
| Control de pausa | Vue llama a `pause()`/`resume()` del módulo | Pausa cosmética con overlay | Los <elementos del juego> no siguen moviéndose detrás del overlay |
| Leaderboard | Infraestructura genérica existente | Implementación específica por juego | Ya construido en spec 07; opera por `game_id` sin cambios de código |
| Reproductor genérico | Dynamic import por `id` de ruta | Componente dedicado por juego | Escala sin duplicar la pantalla del reproductor para cada juego |
| Ubicación del módulo | `src/games/<id>/game.ts` | Co-localizado en `src/pages/reproductor/` | Separa la lógica del juego de la capa de presentación |
```

---

## Riesgos identificados

```markdown
## Riesgos identificados

- **Listeners de teclado globales:** El módulo registra listeners en `window`. Si `destroy()` no los elimina correctamente al desmontar, quedarán activos en otras páginas. Mitigación: guardar referencias a los handlers en `start()` y usar `removeEventListener` explícito en `destroy()`.

- **rAF en segundo plano:** Si el usuario navega fuera sin pasar por el botón SALIR, `onUnmounted` de Vue debe garantizar que `destroy()` cancela el `requestAnimationFrame` activo.

- **Canvas fijo vs `.crt-screen`:** El juego usa un canvas de <W>×<H>. Aplicar `max-width:100%; height:auto` al canvas vía CSS para escalar visualmente sin cambiar coordenadas internas.

- **Bug latente en `exit()`:** `Reproductor.vue` navega a `/juego/${id}` en lugar de `/games/${id}` (el router define `/games/:id`). Si el juego expone el botón de salida, este bug se activará. Corregir en la misma PR o en un fix independiente.
```
