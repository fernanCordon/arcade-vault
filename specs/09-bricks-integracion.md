# 09 — Integración del juego Bricks

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 06-asteroids-integracion, 07-leaderboard-supabase, 08-tetro-integracion |
| Fecha | 2026-06-17 |
| Objetivo | Integrar el juego Brick Breaker (canvas HTML5 puro) en la plataforma Vue como módulo TypeScript en `src/games/bricks/`, conectando su estado interno al HUD de Vue mediante callbacks y exponiendo pause()/resume() para que el contenedor controle el ciclo de juego. |

---

## Alcance

### Dentro del spec
- `src/games/bricks/game.ts` — refactorización de `references/started-games/arkanoid/game.js`
  como módulo TypeScript: recibe el canvas por parámetro, exporta `start()`, `pause()`, `resume()`,
  `restart()` y `destroy()`, con callbacks `onScoreChange`, `onLifeLost`, `onLevelUp`, `onGameOver`
- Tabla `games` en Supabase — insertar seed del juego `bricks`
- `src/style.css` — sin cambios (`.cover-bricks` ya existe)
- `src/data/games.ts` — sin cambios (entrada `bricks` ya está activa)

### Fuera del spec
- Cambios en `Reproductor.vue`, `Detalle.vue`, `Salon.vue` o `src/lib/scores.ts` —
  la infraestructura de leaderboard ya es genérica y opera por `game_id` sin modificaciones
- Controles táctiles / mobile
- Paginación del leaderboard
- Modificaciones visuales al HUD interno del canvas (sprites, explosiones, colores de bloques)
- Cualquier otro juego — cada uno tendrá su propio spec

---

## Modelo de datos

### Tabla `games` en Supabase — seed

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'bricks',
  'BRICK BREAKER',
  'Rompe todos los bloques',
  'Controla la paleta y destruye todos los bloques antes de que la bola caiga. Gana vidas extra con combos.',
  'ARCADE',
  'cover-bricks',
  'cyan',
  0,
  0
);
```

### Interfaz del módulo `src/games/bricks/game.ts`

```ts
export interface BricksCallbacks {
  onScoreChange: (score: number) => void
  onLifeLost: (lives: number) => void
  onLevelUp: (level: number) => void
  onGameOver: (finalScore: number) => void
}

export interface BricksGame {
  start: (canvas: HTMLCanvasElement, callbacks: BricksCallbacks) => void
  pause: () => void
  resume: () => void
  restart: () => void
  destroy: () => void
}
```

`destroy()` cancela el `requestAnimationFrame` activo y elimina los listeners de teclado
y ratón para evitar fugas de memoria al desmontar el componente Vue.

### Variables de estado a nivel de módulo

```ts
let canvas: HTMLCanvasElement | null
let ctx: CanvasRenderingContext2D | null
let cbs: BricksCallbacks | null
let paddle, ball, blocks[], explosions[]
let lives: number        // empieza en 3
let score: number
let currentLevel: number // 1–5, basado en LEVELS de la referencia
let gameState: 'playing' | 'paused' | 'gameover' | 'win'
let rafId: number
let lastTime: number | null
let gameOverFired: boolean
let keys: { ArrowLeft: boolean; ArrowRight: boolean }
// handlers de teclado y ratón guardados en vars de módulo para removeEventListener
let handleKeyDown, handleKeyUp, handleMouseMove
```

---

## Plan de implementación

1. **Insertar seed `bricks` en la tabla `games` de Supabase** — ejecutar el INSERT del modelo
   de datos. La card ya aparece en Biblioteca (venía de `GAMES` local); ahora el leaderboard
   de `Detalle.vue` también la reconoce por `game_id`.

2. **Crear `src/games/bricks/game.ts`** refactorizando `references/started-games/arkanoid/game.js`:
   - Eliminar globals de módulo DOM (`document.getElementById`); recibir `canvas` por parámetro
     en `start()`
   - Portar `LEVELS` de `levels.js` directamente en el módulo (array constante inline)
   - Encapsular todo el estado (`paddle`, `ball`, `blocks`, `explosions`, `lives`, `score`,
     `currentLevel`, `gameState`) en vars `let` a nivel de módulo
   - Registrar listeners de teclado (`keydown`/`keyup` para ← →) y ratón (`mousemove`) en
     `start()` con referencias guardadas en `handleKeyDown`, `handleKeyUp`, `handleMouseMove`;
     limpiarlos en `destroy()`
   - Eliminar los listeners de `click` sobre el canvas del original (el HUD de pausa lo gestiona Vue)
   - Llamar a los callbacks en los puntos correctos del loop:
     - `onScoreChange` cada vez que se destruye un bloque
     - `onLifeLost` cuando la bola cae por debajo del canvas (antes de restar vida)
     - `onLevelUp` al completar todos los bloques de un nivel y avanzar al siguiente
     - `onGameOver` al agotar las 3 vidas o al completar el nivel 5 (victoria), una única vez
       (flag `gameOverFired`)
   - Loop rAF con `dt` cap a `0.05` (50 ms); `lastTime = null` al inicio de `start()`,
     `resume()` y `restart()`
   - Exponer `pause()` (cancela rAF), `resume()` (resetea `lastTime`, reactiva loop),
     `restart()` (reinicia estado a nivel 1, score 0, vidas 3), `destroy()` (cancela rAF +
     elimina listeners + nullea `canvas/ctx/cbs`)
   - Exportar `export const game: BricksGame` + `export default game`

3. **Verificar con `npm run build`** que compila sin errores de TypeScript.

---

## Criterios de aceptación

- [ ] La card de Brick Breaker aparece en Biblioteca con categoría ARCADE
- [ ] `/games/bricks` carga `Detalle.vue` con los datos correctos del juego
- [ ] `/games/bricks/play` carga `Reproductor.vue` con el canvas real del juego
- [ ] El canvas renderiza la paleta, la bola y los bloques correctamente
- [ ] Los controles de teclado (← →) mueven la paleta dentro del canvas
- [ ] El ratón mueve la paleta dentro del canvas
- [ ] El HUD de Vue muestra la puntuación real sincronizada con el juego
- [ ] El HUD de Vue muestra las vidas reales sincronizadas con el juego
- [ ] El HUD de Vue muestra el nivel real sincronizado con el juego
- [ ] Al destruir un bloque, el score del HUD de Vue se actualiza inmediatamente
- [ ] Al perder una vida, el HUD de Vue refleja las vidas restantes
- [ ] Al completar todos los bloques de un nivel, el juego avanza al siguiente nivel
- [ ] El botón PAUSA detiene el loop del juego (la bola deja de moverse)
- [ ] El botón REANUDAR reactiva el loop desde donde se pausó
- [ ] Al agotar las 3 vidas, se abre el modal de fin de partida con la puntuación final real
- [ ] Al completar el nivel 5, se abre el modal de fin de partida con la puntuación final real
- [ ] El botón FIN en el HUD pausa el juego y abre el modal
- [ ] JUGAR DE NUEVO reinicia el canvas con estado limpio (score 0, vidas 3, nivel 1)
- [ ] El input de nombre en el modal se prerellena con `av_player_name` de localStorage si existe
- [ ] Al hacer submit, el score se guarda en Supabase y aparece en el leaderboard de `Detalle.vue`
- [ ] El botón de submit se deshabilita mientras el envío está en curso y tras un envío exitoso
- [ ] Al desmontar `Reproductor.vue`, no quedan listeners de teclado, ratón ni rAF activos
- [ ] Los juegos sin módulo real siguen mostrando el mock sin cambios
- [ ] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Método de embed | Módulo TS con canvas por parámetro | iframe / Web Component | Integración nativa; el HUD de Vue se comunica directamente con el juego |
| HUD | Doble HUD: canvas interno + Vue sincronizado | Solo canvas / Solo Vue | El canvas mantiene su estética arcade; Vue sincroniza para coherencia con la plataforma |
| Comunicación juego→Vue | Callbacks (`onScoreChange`, etc.) | Pinia store / eventos del DOM | Acoplamiento mínimo; el módulo del juego no depende de Vue |
| Control de pausa | Vue llama a `pause()`/`resume()` del módulo | Pausa cosmética con overlay | La bola no sigue moviéndose detrás del overlay |
| Controles | Mouse + teclado (← →) | Solo mouse / Solo teclado | La referencia ya soporta ambos; el teclado es consistente con otros juegos de la plataforma |
| Niveles | 5 niveles de `levels.js` portados inline en el módulo TS | Importar `levels.js` original | Evita dependencia JS sin tipos; el módulo TS queda autocontenido |
| Leaderboard | Infraestructura genérica existente | Implementación específica | Ya construido en spec 07; opera por `game_id` sin cambios de código |
| Catálogo local | Sin cambios (entrada `bricks` ya activa en `GAMES`) | Añadir / modificar entrada | El juego ya estaba registrado desde el MVP; solo faltaba el módulo real |
| Reproductor genérico | Dynamic import por `id` de ruta | Componente dedicado por juego | Escala sin duplicar la pantalla del reproductor para cada juego |
| Ubicación del módulo | `src/games/bricks/game.ts` | Co-localizado en `src/pages/reproductor/` | Separa la lógica del juego de la capa de presentación |

---

## Riesgos identificados

- **Listeners de teclado y ratón globales:** `start()` registra `keydown`/`keyup` en `window`
  y `mousemove` en el canvas. Si `destroy()` no los elimina correctamente al desmontar,
  quedarán activos en otras páginas. Mitigación: guardar referencias a los handlers en vars
  de módulo y usar `removeEventListener` explícito en `destroy()`.

- **rAF en segundo plano:** Si el usuario navega fuera sin pasar por el botón SALIR,
  `onUnmounted` de Vue debe garantizar que `destroy()` cancela el `requestAnimationFrame`
  activo. Mitigación: siempre llamar `game.destroy()` en el hook `onUnmounted` de Vue.

- **Canvas fijo vs `.crt-screen`:** El juego usa un canvas de 800×600. En viewports menores
  el canvas puede desbordar la carcasa. Mitigación: aplicar `max-width:100%; height:auto`
  al canvas vía CSS; las coordenadas internas no cambian.

- **Sonidos bloqueados por el navegador:** La referencia usa `new Audio(...)` con rutas
  relativas a `assets/sounds/`. Al mover el módulo a `src/games/bricks/`, esas rutas
  dejarán de resolverse. Mitigación: importar los archivos de audio con `import` de Vite
  o silenciar el sonido en la primera versión integrada.

- **Bug latente en `exit()`:** `Reproductor.vue` navega a `/juego/${id}` en lugar de
  `/games/${id}` (el router define `/games/:id`). Si el jugador usa el botón de salida,
  la navegación fallará. Corregir en la misma PR o en un fix independiente.
