# 08 — Integración del juego Tetris Stack

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 06-asteroids-integracion, 07-leaderboard-supabase |
| Fecha | 2026-06-17 |
| Objetivo | Integrar el juego Tetris Stack (canvas HTML5 puro) en la plataforma Vue como módulo TypeScript en `src/games/tetro/`, conectando su estado interno al HUD de Vue mediante callbacks y exponiendo pause()/resume() para que el contenedor controle el ciclo de juego. El módulo gestiona dos canvases: el principal (300×600) pasado por Reproductor.vue, y un canvas de preview de pieza siguiente (120×120) creado y destruido internamente. |

---

## Alcance

### Dentro del spec
- `src/data/games.ts` — actualizar `title` de la entrada `tetro` de `'TETRO STACK'` a `'TETRIS STACK'`
- `src/games/tetro/game.ts` — refactorización de `references/started-games/tetris/game.js` como módulo TypeScript: recibe el canvas principal por parámetro, crea internamente el canvas de preview (120×120) y lo añade al `parentElement` del canvas principal; exporta `start()`, `pause()`, `resume()`, `restart()` y `destroy()`, con callbacks `onScoreChange`, `onLifeLost`, `onLevelUp`, `onGameOver`

### Fuera del spec
- Cambios en `Reproductor.vue`, `Detalle.vue`, `Salon.vue` o `src/lib/scores.ts` — la infraestructura de leaderboard ya es genérica y opera por `game_id` sin modificaciones
- Cambios en `src/style.css` — `.cover-tetro` ya existe
- Seed en Supabase — la entrada del catálogo vive únicamente en `games.ts` (igual que Asteroids)
- Controles táctiles / mobile
- Paginación del leaderboard
- Mecánicas extra: rotación antihoraria, pieza hold, wall kicks avanzados

---

## Modelo de datos

### `src/data/games.ts` — entrada `tetro` actualizada

```ts
{
  id: 'tetro',
  title: 'TETRIS STACK',          // único cambio respecto al estado actual
  short: 'Apila piezas sin espacios',
  long: 'Las piezas caen sin parar. Completa líneas horizontales para eliminarlas y sigue subiendo el marcador.',
  cat: 'PUZZLE',
  cover: 'cover-tetro',
  color: 'yellow',
  best: 93100,
  plays: '31.7K',
}
```

### Interfaz del módulo `src/games/tetro/game.ts`

```ts
export interface TetroCallbacks {
  onScoreChange: (score: number) => void
  onLifeLost: (lives: number) => void
  onLevelUp: (level: number) => void
  onGameOver: (finalScore: number) => void
}

export interface TetroGame {
  start: (canvas: HTMLCanvasElement, callbacks: TetroCallbacks) => void
  pause: () => void
  resume: () => void
  restart: () => void
  destroy: () => void
}
```

`destroy()` cancela el `requestAnimationFrame` activo, elimina los listeners de teclado y
retira del DOM el canvas de preview creado internamente.

---

## Plan de implementación

1. **Actualizar `src/data/games.ts`** — cambiar `title: 'TETRO STACK'` por `title: 'TETRIS STACK'`
   en la entrada `tetro`. El sistema queda funcional: la card en Biblioteca y `Detalle.vue`
   muestran el título correcto. El botón JUGAR navega a `/games/tetro/play` y muestra el mock.

2. **Crear `src/games/tetro/game.ts`** refactorizando `references/started-games/tetris/game.js`:
   - Encapsular todo el estado (`board`, `current`, `next`, `score`, `lines`, `level`,
     `paused`, `gameOver`, `animId`, `dropAccum`, `lastTime`) en vars a nivel de módulo (`let`)
   - Reemplazar `document.getElementById('board')` por el parámetro `canvas: HTMLCanvasElement`
   - En `start()`: crear el canvas de preview (`nextCanvas`) de 120×120, asignarlo a una var
     de módulo y añadirlo con `canvas.parentElement?.appendChild(nextCanvas)`
   - En `destroy()`: retirar `nextCanvas` del DOM con `nextCanvas.parentElement?.removeChild(nextCanvas)`
     y nullear la referencia
   - Registrar listeners de teclado en `start()` con referencias de función guardadas en vars
     de módulo (no anónimas inline); limpiarlos en `destroy()` con `removeEventListener` explícito
   - Teclas gestionadas: `ArrowLeft`, `ArrowRight`, `ArrowDown`, `ArrowUp`, `Space`
     (todas con `preventDefault` para evitar scroll de página)
   - Llamar a los callbacks en los puntos correctos del loop:
     - `onScoreChange` cada vez que el score aumenta (líneas completadas o drop)
     - `onLifeLost(0)` una única vez justo antes de `onGameOver(finalScore)` al detectar
       que `spawn()` colisiona inmediatamente (tablero lleno)
     - `onLevelUp` cuando `level` sube (`floor(lines / 10) + 1` supera el nivel anterior)
     - `onGameOver` al entrar en estado de game over, una única vez (flag `gameOverFired`)
   - Sistema de scoring del original: `LINE_SCORES = [0, 100, 300, 500, 800] × level`;
     hard drop +2 pts/celda; soft drop +1 pt/fila
   - Velocidad: `dropInterval = max(100, 1000 − (level − 1) × 90)` ms
   - Loop rAF con `dt` cap a `0.05` (50 ms); `lastTime = null` al inicio de `start()`,
     `resume()` y `restart()` para evitar saltos de dt
   - Exportar `export const game: TetroGame = { ... }` + `export default game`

3. **Verificar con `npm run build`** que compila sin errores de TypeScript.

---

## Criterios de aceptación

- [ ] La card de Tetris Stack aparece en Biblioteca con título `TETRIS STACK` y categoría `PUZZLE`
- [ ] `/games/tetro` carga `Detalle.vue` con los datos correctos del juego
- [ ] `/games/tetro/play` carga `Reproductor.vue` con el canvas real del juego (300×600)
- [ ] El canvas de preview de pieza siguiente (120×120) aparece montado junto al canvas principal
- [ ] Las 7 piezas (I, O, T, S, Z, J, L) se renderizan y caen correctamente
- [ ] Los controles de teclado (← → ↓ ↑ Espacio) funcionan dentro del canvas
- [ ] La pieza siguiente se muestra en el canvas de preview
- [ ] La ghost piece se dibuja en el tablero con `globalAlpha = 0.2`
- [ ] El HUD de Vue muestra la puntuación real sincronizada con el juego
- [ ] El HUD de Vue muestra el nivel real sincronizado con el juego
- [ ] Completar 10 líneas incrementa el nivel y acelera la caída
- [ ] El botón PAUSA detiene el loop del juego (las piezas dejan de caer)
- [ ] El botón REANUDAR reactiva el loop desde donde se pausó
- [ ] Al llenar el tablero, se abre el modal de fin de partida con la puntuación final real
- [ ] El botón FIN en el HUD pausa el juego y abre el modal
- [ ] JUGAR DE NUEVO reinicia el canvas con estado limpio (score 0, nivel 1, tablero vacío)
- [ ] El input de nombre en el modal se prerellena con `av_player_name` de localStorage si existe
- [ ] Al hacer submit, el score se guarda en Supabase y aparece en el leaderboard de `Detalle.vue`
- [ ] El botón de submit se deshabilita mientras el envío está en curso y tras un envío exitoso
- [ ] Al desmontar `Reproductor.vue`, el canvas de preview es retirado del DOM
- [ ] Al desmontar `Reproductor.vue`, no quedan listeners de teclado ni rAF activos
- [ ] Los juegos sin módulo real siguen mostrando el mock sin cambios
- [ ] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| `id` del juego | Reutilizar `tetro` | Crear `tetris` como id nuevo | La entrada ya existe en `GAMES`; el leaderboard hereda el histórico de la card mock |
| Canvas de preview | Módulo lo crea internamente y lo añade al `parentElement` | Segundo parámetro en `start()` / contenedor div | `Reproductor.vue` no cambia; el módulo es autónomo en su gestión del DOM |
| Vidas en el HUD | `onLifeLost(0)` una vez justo antes de `onGameOver` | No llamar nunca / arrancar con 1 vida | Señal limpia al morir sin inventar una mecánica que Tetris no tiene |
| Método de embed | Módulo TS con canvas por parámetro | iframe / Web Component | Integración nativa; el HUD de Vue se comunica directamente con el juego |
| Comunicación juego→Vue | Callbacks (`onScoreChange`, etc.) | Pinia store / eventos del DOM | Acoplamiento mínimo; el módulo no depende de Vue |
| Control de pausa | Vue llama a `pause()`/`resume()` del módulo | Pausa cosmética con overlay | Las piezas no siguen cayendo detrás del overlay |
| Leaderboard | Infraestructura genérica existente | Implementación específica por juego | Ya construido en spec 07; opera por `game_id` sin cambios de código |
| Registro en catálogo | Solo `games.ts` (igual que Asteroids) | Seed adicional en Supabase | La entrada `tetro` ya existe; solo se actualiza el título |
| Mecánicas extra | Fuera del spec | Rotación antihoraria, pieza hold | Añaden complejidad sin estar en la referencia base; pueden ser un spec propio |

---

## Riesgos identificados

- **Canvas de preview huérfano:** `start()` añade el canvas de preview al `parentElement` del
  canvas principal. Si `destroy()` no lo retira explícitamente, el elemento queda en el DOM
  tras desmontar `Reproductor.vue`. Mitigación: guardar la referencia en una var de módulo y
  llamar `nextCanvas.parentElement?.removeChild(nextCanvas)` en `destroy()`.

- **Listeners de teclado globales:** `start()` registra listeners en `window`. Si `destroy()`
  no los elimina correctamente, quedarán activos en otras páginas. Mitigación: guardar
  referencias a los handlers en vars de módulo y usar `removeEventListener` explícito en
  `destroy()`.

- **rAF en segundo plano:** Si el usuario navega fuera sin pasar por el botón SALIR,
  `onUnmounted` de Vue debe garantizar que `destroy()` cancela el `requestAnimationFrame`
  activo. Mitigación: siempre llamar `game.destroy()` en el hook `onUnmounted`.

- **Canvas fijo vs `.crt-screen`:** El tablero usa un canvas de 300×600. Aplicar
  `max-width: 100%; height: auto` al canvas vía CSS para escalar visualmente sin cambiar
  las coordenadas internas.

- **Bug latente en `exit()`:** `Reproductor.vue` navega a `/juego/${id}` en lugar de
  `/games/${id}` (el router define `/games/:id`). Si el usuario pulsa el botón de salida,
  la navegación fallará y redirigirá a `/`. Se puede corregir en la misma PR de integración
  o en un fix independiente.
