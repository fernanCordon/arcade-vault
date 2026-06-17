# 10 — Integración del juego Snake

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 06-asteroids-integracion, 07-leaderboard-supabase, 08-tetro-integracion |
| Fecha | 2026-06-17 |
| Objetivo | Integrar Snake (canvas HTML5) en la plataforma Vue como módulo TypeScript en `src/games/snake/`, con sprites de frutas, loop de juego desde cero y callbacks conectados al HUD de Vue. |

---

## Alcance

### Dentro del spec
- `src/data/games.ts` — la entrada `snake` ya existe; sin cambios de código
- Tabla `games` en Supabase — insertar seed del juego `snake` con los mismos valores del array estático
- `public/snake/fruits.png` — copiar desde `references/source-assets/snake-assets/fruits.png`
  para que el canvas pueda cargarlo en tiempo de ejecución
- `src/games/snake/game.ts` — implementación desde cero del bucle de juego: grid 20×20,
  celda 40×40 px, canvas 800×800, sprites de frutas del atlas, WASD, niveles, score

### Fuera del spec
- Cambios en `Reproductor.vue`, `Detalle.vue`, `Salon.vue` o `src/lib/scores.ts` —
  la infraestructura de leaderboard ya es genérica y opera por `game_id` sin modificaciones
- `src/style.css` — `.cover-snake` ya existe; sin cambios
- Controles táctiles / mobile
- Paginación del leaderboard
- Cualquier otro juego — cada uno tendrá su propio spec

---

## Modelo de datos

### `src/data/games.ts` — entrada existente (sin cambios)

```ts
{
  id: 'snake',
  title: 'NEON SNAKE',
  short: 'Come y crece sin chocarte',
  long: 'La serpiente crece con cada píxel que devora. Evita las paredes y tu propio cuerpo mientras el ritmo se acelera.',
  cat: 'ARCADE',
  cover: 'cover-snake',
  color: 'green',
  best: 27650,
  plays: '8.9K',
}
```

### Seed Supabase — tabla `games`

```sql
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'snake', 'NEON SNAKE', 'Come y crece sin chocarte',
  'La serpiente crece con cada píxel que devora. Evita las paredes y tu propio cuerpo mientras el ritmo se acelera.',
  'ARCADE', 'cover-snake', 'green', 27650, 8900
)
ON CONFLICT (id) DO NOTHING;
```

### Mecánica de score y niveles

- **Fruta**: cada fruta comida vale `10 × level` puntos
- **Nivel**: `Math.floor(fruitsEaten / 5) + 1` (empieza en 1, sube cada 5 frutas)
- **Velocidad**: intervalo de movimiento = `max(80, 300 - (level - 1) * 20)` ms
- **Vidas**: el módulo opera con 1 vida implícita; al morir llama `onLifeLost(0)` seguido
  de `onGameOver(finalScore)` (mismo patrón que Tetris)

### Sprite atlas (`public/snake/fruits.png`)

22 frutas definidas en `references/source-assets/snake-assets/sprites.js`.
El módulo carga la imagen una vez en `start()` y elige la fruta del turno aleatoriamente.
Recorte: `{ x, y, w: ~130, h: 160 }` por fruta según el atlas; se renderiza escalada a
una celda (40×40 px) con `ctx.drawImage(img, sx, sy, sw, sh, dx, dy, 40, 40)`.

### Interfaz del módulo `src/games/snake/game.ts`

```ts
export interface SnakeCallbacks {
  onScoreChange: (score: number) => void
  onLifeLost:    (lives: number) => void
  onLevelUp:     (level: number) => void
  onGameOver:    (finalScore: number) => void
}

export interface SnakeGame {
  start:   (canvas: HTMLCanvasElement, callbacks: SnakeCallbacks) => void
  pause:   () => void
  resume:  () => void
  restart: () => void
  destroy: () => void
}
```

`destroy()` cancela el `setTimeout` del loop, elimina los listeners de teclado
y nullea canvas/ctx/callbacks para evitar fugas de memoria al desmontar el componente Vue.

---

## Plan de implementación

1. **Insertar seed en Supabase** — ejecutar el INSERT de la tabla `games` definido en el
   modelo de datos. La card de Snake en Biblioteca y Detalle.vue ya funcionan (la entrada
   estática en `games.ts` lo garantiza); el seed solo sincroniza Supabase.

2. **Copiar assets** — mover `references/source-assets/snake-assets/fruits.png` a
   `public/snake/fruits.png`. El atlas de sprites queda accesible en runtime via URL relativa
   `/snake/fruits.png` sin pasar por el bundler.

3. **Crear `src/games/snake/game.ts`** — implementación desde cero:
   - Estado a nivel de módulo: `snake` (array de celdas `{x,y}`), `dir` / `nextDir`,
     `fruit` (`{x,y,type}`), `score`, `level`, `fruitsEaten`, `running`, `paused`,
     `gameOverFired`, `loopTimeout`, `canvas`, `ctx`, `cbs`, `img`, `imgReady`
   - `start(canvas, callbacks)`: inicializa estado, carga `fruits.png` en un `Image`,
     registra listener `keydown` (WASD + flechas → `nextDir`, `preventDefault` en flechas) guardado en var de módulo, llama
     `spawnFruit()` y arranca el loop con `scheduleLoop()`
   - `scheduleLoop()`: usa `setTimeout` (no rAF) con intervalo calculado según el nivel;
     en cada tick llama `tick()` y vuelve a programar el siguiente
   - `tick()`: mueve la cabeza en `nextDir`, comprueba colisión con paredes y cuerpo propio;
     si colisión → `onLifeLost(0)` + `onGameOver(score)` (flag `gameOverFired`); si come
     fruta → crece, incrementa `score` y `fruitsEaten`, llama `onScoreChange`, comprueba
     subida de nivel (`onLevelUp`), `spawnFruit()`; dibuja el frame completo
   - `draw()`: fondo negro, cuadrícula tenue, cuerpo de la serpiente en verde neón,
     cabeza diferenciada, fruta con `ctx.drawImage` del atlas escalada a 40×40
   - `pause()`: activa flag `paused`, cancela `loopTimeout`
   - `resume()`: desactiva `paused`, retoma `scheduleLoop()`
   - `restart()`: cancela timeout, reinicia todo el estado, arranca de nuevo
   - `destroy()`: cancela `loopTimeout`, elimina el listener `keydown` con
     `removeEventListener` sobre la misma referencia de función, nullea `canvas/ctx/cbs/img`
   - Exportar `export const game: SnakeGame` + `export default game`

4. **Verificar con `npm run build`** que compila sin errores de TypeScript.

---

## Criterios de aceptación

- [ ] La card de Snake aparece en Biblioteca con categoría ARCADE y acento verde
- [ ] `/games/snake` carga `Detalle.vue` con los datos correctos del juego
- [ ] `/games/snake/play` carga `Reproductor.vue` con el canvas real del juego (800×800)
- [ ] El canvas renderiza la serpiente, la cuadrícula y la fruta con sprite del atlas
- [ ] Los controles WASD y las flechas direccionales mueven la serpiente en la dirección correcta
- [ ] La serpiente no puede invertir dirección (W cuando va al sur no hace nada)
- [ ] Al comer una fruta, la serpiente crece un segmento
- [ ] El score sube `10 × level` por fruta y el HUD de Vue lo refleja en tiempo real
- [ ] El nivel sube cada 5 frutas comidas y el HUD de Vue lo refleja
- [ ] Al subir de nivel, el intervalo de movimiento se reduce (la serpiente acelera)
- [ ] Al colisionar con una pared o con el propio cuerpo, se abre el modal de fin de partida
- [ ] El modal muestra la puntuación final real
- [ ] El botón PAUSA detiene el loop (la serpiente deja de moverse)
- [ ] El botón REANUDAR reactiva el loop desde donde se pausó
- [ ] El botón FIN en el HUD pausa el juego y abre el modal
- [ ] JUGAR DE NUEVO reinicia el canvas con estado limpio (score 0, nivel 1, serpiente inicial)
- [ ] El input de nombre en el modal se prerellena con `av_player_name` de localStorage si existe
- [ ] Al hacer submit, el score se guarda en Supabase y aparece en el leaderboard de `Detalle.vue`
- [ ] El botón de submit se deshabilita mientras el envío está en curso y tras un envío exitoso
- [ ] Al desmontar `Reproductor.vue`, no quedan listeners de teclado ni timeouts activos
- [ ] Los juegos sin módulo real siguen mostrando el mock sin cambios
- [ ] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Método de embed | Módulo TS con canvas por parámetro | iframe / Web Component | Integración nativa; el HUD de Vue se comunica directamente con el juego |
| Loop de juego | `setTimeout` con intervalo variable | `requestAnimationFrame` | Snake es un juego de pasos discretos, no continuo; el intervalo controla la velocidad directamente |
| Sprites de fruta | Atlas PNG vía `ctx.drawImage` | Emoji / formas geométricas | Assets ya preparados; añaden personalidad visual sin coste extra |
| Puntos por fruta | `10 × level` | Valor fijo / por tipo de fruta | Recompensa al jugador avanzado sin complejidad de tabla de valores |
| Velocidad por nivel | Intervalo `max(80, 300 - (level-1)×20)` ms | Velocidad fija | La aceleración progresiva es el núcleo de tensión del juego |
| Vidas | Sin vidas (1 implícita); `onLifeLost(0)` + `onGameOver` | 3 vidas con respawn | Snake clásico: un choque = fin; mismo patrón que Tetris en la plataforma |
| Controles | WASD + flechas direccionales | Solo WASD | Mayor accesibilidad; se llama `preventDefault()` en las flechas para evitar scroll |
| Catálogo | `games.ts` existente + seed Supabase | Solo uno de los dos | El array estático garantiza la card aunque Supabase falle; el seed sincroniza el leaderboard |
| Ubicación del módulo | `src/games/snake/game.ts` | Co-localizado en `src/pages/reproductor/` | Separa la lógica del juego de la capa de presentación |
| Assets | `public/snake/fruits.png` | `src/assets/` con import Vite | Canvas necesita URL en runtime; `public/` es la ruta correcta para assets cargados dinámicamente |

---

## Riesgos identificados

- **Listener de teclado global:** `start()` registra `keydown` en `window`. Si `destroy()`
  no lo elimina con la misma referencia de función, el handler queda activo en otras páginas
  y puede causar que WASD interfiera con la navegación. Mitigación: guardar el handler en
  una var de módulo (`let keyHandler: ...`) y usar `removeEventListener` explícito en `destroy()`.

- **Timeout en segundo plano:** Si el usuario navega fuera sin pasar por el botón SALIR,
  `onUnmounted` de Vue debe llamar siempre a `game.destroy()` para cancelar el `loopTimeout`
  activo.

- **Canvas 800×800 vs `.crt-screen`:** En viewports menores el canvas puede desbordar la
  carcasa. Aplicar `max-width:100%; height:auto` al canvas vía CSS; las coordenadas internas
  no cambian.

- **Carga asíncrona de la imagen:** `fruits.png` se carga con `new Image()` en `start()`.
  Si el primer tick ocurre antes de que `onload` dispare, `ctx.drawImage` fallará silenciosamente.
  Mitigación: arrancar `scheduleLoop()` solo dentro del callback `img.onload`.

- **Bug latente en `exit()`:** `Reproductor.vue` navega a `/juego/${id}` en lugar de
  `/games/${id}` (el router define `/games/:id`). Si el jugador usa el botón de salida,
  la navegación fallará. Corregir en la misma PR o en un fix independiente.
