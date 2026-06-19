# SPEC — Rana Veloz: integración core del juego (Vue)

> **Estado:** Aprobado
> **Depende de:** 07-leaderboard-supabase
> **Fecha:** 2026-06-19
> **Objetivo:** Implementar Rana Veloz (canvas puro, construido desde cero) como juego jugable en Arcade Vault con ID `rana`, exponiendo la interfaz `RanaGame` que `Reproductor.vue` consume para conectar score, vidas, nivel y game over con el HUD Vue y el reproductor genérico.

---

## Scope

**In:**

- UPDATE SQL para sincronizar la fila `rana` en la tabla `games` de Supabase (la entrada ya existe en `src/data/games.ts`).
- Crear `src/games/rana/game.ts` — módulo TypeScript puro que exporta el objeto `game: RanaGame`. Recibe un `HTMLCanvasElement` y un objeto `RanaCallbacks` a través de `start()`. Canvas: 640 × 560 px. Cuadrícula de 16 columnas × 14 filas de 40 × 40 px. El mapa vertical se divide en tres zonas fijas: zona segura inferior (fila 13 — base de inicio), zona de carretera (filas 12–8, 5 carriles de tráfico), zona de río (filas 7–2, 6 carriles fluviales) y zona de metas (fila 1, 5 bocas destino).
- Entidades de carretera: coches y camiones de distintas longitudes (1–3 celdas), velocidades y direcciones por carril; se mueven horizontalmente en loop continuo; colisión con la rana es letal.
- Entidades de río: troncos (longitud 2–4 celdas) y tortugas (grupos de 2–3) por carril; se mueven horizontalmente. La rana sólo sobrevive en el río si está encima de un tronco o tortugas visibles; si cae al agua, muere. Las tortugas pueden sumergirse periódicamente (fase visible → bajo el agua → visible); mientras están bajo el agua no sirven de apoyo.
- Movimiento de la rana: basado en saltos discretos de 1 celda (40 px) en 4 direcciones (↑ ↓ ← →); cada pulsación desplaza la rana exactamente una celda tras completar una animación de salto de 120 ms. La rana no puede moverse fuera de los bordes laterales.
- Condición de meta alcanzada: la rana llega a una de las 5 bocas destino de la fila superior (cada boca ocupa 2 columnas de las 16). Una boca ya ocupada no puede volver a usarse en la misma ronda. Al rellenar las 5 bocas se completa la ronda y comienza la siguiente.
- Condición de muerte: (a) colisión con vehículo, (b) caída al agua, (c) sumergirse la tortuga bajo la rana, (d) salir por los bordes izquierdo/derecho del río, (e) agotar el temporizador de ronda (15 s iniciales reducidos en niveles altos).
- Sistema de vidas: la rana arranca con 3 vidas. Cada muerte resta 1 vida y llama `onLifeLost(lives - 1)`. Si `lives - 1 === 0` se llama `onLifeLost(0)` y luego `onGameOver(finalScore)`.
- Puntuación: +10 pts por cada celda avanzada hacia arriba por primera vez en la ronda; +50 pts al ocupar una boca destino; +200 pts al completar una ronda; +bonus de tiempo = `tiempo_restante × 10` al ocupar una boca.
- Temporizador de ronda visible en HUD: 15 s por defecto, decrementado en rondas altas.
- HUD interno del canvas (score top-left, vidas como iconos de rana top-right, nivel top-center, barra de tiempo en la fila 0) — patrón doble HUD igual que los demás juegos de la plataforma.
- Métodos `pause()` / `resume()`: `pause()` congela `update()` pero sigue llamando a `draw()`; `resume()` reanuda el loop.
- Limpiar los event listeners (`keydown` en `document`) y cancelar `requestAnimationFrame` en `destroy()`, que es invocado por `onUnmounted` en `Reproductor.vue`.
- `Reproductor.vue` **no requiere cambios** — importa `../../games/${id}/game.ts` dinámicamente en `onMounted` (sólo cliente); al resolver `rana` carga este módulo y llama `game.start(canvas, callbacks)` automáticamente.
- Guardar score al terminar: el modal de fin de partida ya existe en `Reproductor.vue`; pre-rellena nombre desde `localStorage` (`av_player_name`), inserta en Supabase y persiste el nombre para la próxima partida.

**Fuera de alcance:**

- Sprites bitmap externos — todos los elementos se dibujan con primitivas canvas (rectángulos, arcos, formas compuestas) con colores temáticos; no se carga ninguna imagen.
- Controles táctiles o mobile.
- Animaciones de muerte elaboradas (explosiones, partículas) — se cubre en spec secundario.
- Power-ups especiales (mosca en la boca destino, cocodrilo disfrazado de tronco) — se cubre en spec secundario.
- Supabase Auth y RLS — `user_id` se almacena como `null`.
- Realtime en el leaderboard.
- Módulo genérico `GameBase` (YAGNI).

---

## Data model

### Entrada en `src/data/games.ts`

La entrada ya está activa. No requiere cambios:

```ts
{
  id: 'rana',
  title: 'RANA VELOZ',
  short: 'Cruza sin ser aplastado',
  long: 'Salta de liana en liana, esquiva camiones y cruza el río sobre troncos que se mueven. El tiempo no espera.',
  cat: 'MAZE',
  cover: 'cover-rana',
  color: 'green',
  best: 22100,
  plays: '7.6K',
}
```

### Seed Supabase — tabla `games`

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'rana',
  'RANA VELOZ',
  'Cruza sin ser aplastado',
  'Salta de liana en liana, esquiva camiones y cruza el río sobre troncos que se mueven. El tiempo no espera.',
  'MAZE',
  'cover-rana',
  'green'
)
ON CONFLICT (id) DO NOTHING;
```

### Interfaz del módulo `src/games/rana/game.ts`

```ts
export interface RanaCallbacks {
  onScoreChange: (score: number) => void
  onLifeLost:    (lives: number) => void
  onLevelUp:     (level: number) => void
  onGameOver:    (finalScore: number) => void
}

export interface RanaGame {
  start:   (canvas: HTMLCanvasElement, callbacks: RanaCallbacks) => void
  pause:   () => void
  resume:  () => void
  restart: () => void
  destroy: () => void
}

export const game: RanaGame
export default game
```

El estado local arranca con `lives = 3`, `score = 0`, `level = 1`.
`onLifeLost(n)` se dispara cada vez que la rana muere (con las vidas restantes tras la pérdida).
`onLifeLost(0)` se dispara justo antes de `onGameOver(score)` en cualquier condición de fin de partida.

Esta interfaz encaja exactamente con `GameModule` definida en `Reproductor.vue:18-24` y con los callbacks mapeados en `Reproductor.vue:75-83`.

No se introducen nuevas tablas ni tipos TypeScript — se reutilizan la tabla `games` y `scores` ya existentes.

---

## Implementation plan

1. **Seed en Supabase** — ejecutar el SQL del data model en el SQL Editor de Supabase.
   Verificación: la fila `rana` existe en la tabla `games`; `/games` muestra la card con cover `cover-rana` y color `green`.

2. **Definir constantes y tipos** al inicio de `src/games/rana/game.ts`:

   ```ts
   const COLS = 16
   const ROWS = 14
   const CELL = 40 // px
   const CANVAS_W = COLS * CELL // 640
   const CANVAS_H = ROWS * CELL // 560
   // Zonas (índice de fila, 0 = arriba)
   const ROW_GOALS    = 0
   const ROW_RIVER_TOP = 1
   const ROW_RIVER_BOT = 6
   const ROW_SAFE_MID  = 7
   const ROW_ROAD_TOP  = 8
   const ROW_ROAD_BOT  = 12
   const ROW_START     = 13
   ```

   Tipos locales (no exportados):

   ```ts
   type Direction = 'up' | 'down' | 'left' | 'right'

   interface Lane {
     row:      number
     speed:    number
     dir:      1 | -1
     entities: Entity[]
   }

   interface Entity {
     col:        number
     width:      number
     type:       'car' | 'truck' | 'log' | 'turtle'
     submerged?: boolean
     submergeTimer?: number
   }

   interface Frog {
     col:       number
     row:       number
     animating: boolean
     animT:     number
     targetCol: number
     targetRow: number
   }
   ```

3. **Construir el mapa de carriles** — función `buildLanes(level: number): Lane[]`:
   - Carriles de carretera (filas 8–12): velocidades entre 1.5 y 4 px/frame (escaladas por nivel); sentidos alternos; entidades precargadas con huecos para que sean atravesables.
   - Carriles de río (filas 1–6): velocidades entre 1 y 3 px/frame; troncos de 2–4 celdas con huecos de al menos 1 celda; grupos de tortugas de 2–3 con ciclo de inmersión de 3 s visible / 1.5 s bajo el agua.
   - Cada nivel incrementa todas las velocidades en un 15 %.
     Verificación: al imprimir el array `lanes` en consola, cada carril tiene al menos 2 entidades y los huecos son visibles.

4. **Game loop principal** con `requestAnimationFrame`:

   Estado del módulo necesario para el loop:

   ```ts
   let canvas: HTMLCanvasElement | null = null
   let ctx:    CanvasRenderingContext2D | null = null
   let cbs:    RanaCallbacks | null = null
   let frog:   Frog
   let lanes:  Lane[]
   let goals:  Set<number>   // columnas de bocas ocupadas en la ronda
   let lives:  number
   let score:  number
   let level:  number
   let timer:  number        // segundos restantes de la ronda
   let rafId:  number | null = null
   let paused: boolean = false
   let running: boolean = false
   let pendingDir: Direction | null = null
   let keyHandler: ((e: KeyboardEvent) => void) | null = null
   ```

   - **`update(dt: number)`** — `dt` en ms; aplicar `dt = Math.min(dt, 100)` para evitar saltos de simulación al volver de pestaña en segundo plano:
     - Si `paused`, saltar toda lógica.
     - Avanzar posición de cada entidad en su carril (`entity.col += lane.speed * lane.dir * dt / 16`); cuando una entidad sale del borde, se reintroduce por el lado opuesto (`col = -entity.width` o `col = COLS`).
     - Actualizar `submergeTimer` de tortugas; alternar `submerged` al cumplirse 3 s (visible) o 1.5 s (sumergida).
     - Si la rana no está animando: comprobar `pendingDir`; si hay dirección, iniciar animación (`animating = true`, `animT = 0`, calcular `targetCol/targetRow`).
     - Si la rana está animando: avanzar `animT += dt`; si `animT >= 120`, completar salto (`col = targetCol`, `row = targetRow`, `animating = false`), resolver lógica de celda destino (muerte / meta / puntuación).
     - Si la rana está en el río y no animando: aplicar desplazamiento horizontal de la entidad soporte (`getSupport(frog, lanes)`).
     - Decrementar temporizador de ronda; si llega a 0, `killFrog()`.
     - Llamar callbacks si el valor difiere del anterior (score, lives, level).

   - **`draw()`**:
     - Fondo por zonas: negro para carretera, azul oscuro para río, verde oscuro para filas seguras, verde claro para bocas destino.
     - Dibujar entidades de cada carril: coches (rectángulo rojo/amarillo/azul con ruedas circulares), camiones (rectángulo gris con cabina diferenciada), troncos (rectángulo marrón con textura de líneas), tortugas visibles (círculo verde con patrón de escamas), tortugas sumergidas (contorno semitransparente).
     - Dibujar rana: cuerpo verde brillante (elipse 28×24 px) con ojos blancos/negros (dos círculos), patas extendidas durante animación de salto.
     - Dibujar bocas destino: rectángulo de meta verde oscuro con borde dorado; si ocupada, dibujar silueta de rana dentro.
     - HUD interno: score top-left (fuente blanca 16 px), nivel top-center, iconos de rana top-right (un círculo verde por vida), barra de tiempo (rectángulo en fila 0, anchura proporcional al tiempo restante, color verde → amarillo → rojo).

5. **Detección de colisiones y soporte**:
   - `checkRoadCollision(frog, lanes)`: itera entidades de carriles de carretera; si `frog.col` está dentro del rango `[entity.col, entity.col + entity.width)` y `frog.row === lane.row`, devuelve `true`.
   - `getSupport(frog, lanes)`: itera entidades de carriles de río; devuelve la entidad cuyo rango cubre la columna de la rana en el mismo carril, o `null`. Si la entidad es una tortuga con `submerged === true`, devuelve `null` (sin soporte).
   - `checkGoal(frog, goals)`: si `frog.row === ROW_GOALS`, calcula la boca que corresponde a `frog.col`; si no está ocupada, la marca y suma puntos; si ya estaba ocupada o `frog.col` no es una boca, es muerte.

6. **Gestión de ronda completada** — `completeRound()`:
   - Resetea la posición de la rana a `ROW_START`, columna central.
   - Vacía `goals`.
   - Incrementa `level`, llama `cbs.onLevelUp(level)`.
   - Reconstruye los carriles con `buildLanes(level)`.
   - Resetea el temporizador a `Math.max(8, 15 - (level - 1) * 1)` s.

7. **Gestión de muerte** — `killFrog()`:
   - Decrementa `lives`.
   - Llama `cbs.onLifeLost(lives)`.
   - Si `lives === 0`: llama `cbs.onLifeLost(0)`, luego `cbs.onGameOver(score)`, activa `running = false` y cancela el loop.
   - Si `lives > 0`: resetea la posición de la rana a `ROW_START`, columna central; resetea temporizador.

8. **Integración con `Reproductor.vue`** — sin modificar el archivo:
   - `Reproductor.vue:71` importa dinámicamente `../../games/${id}/game.ts` en `onMounted`; al visitar `/games/rana/play` resuelve este módulo.
   - `Reproductor.vue:75-83` llama `game.start(canvas, { onScoreChange, onLifeLost, onLevelUp, onGameOver })` — los nombres de callback deben coincidir exactamente con los declarados en `RanaCallbacks`.
   - El HUD Vue (`score`, `lives`, `level`) se actualiza en tiempo real a través de los callbacks.
   - El botón PAUSA de `Reproductor.vue` llama `game.pause()` / `game.resume()`.
   - El modal de game over ya está implementado en `Reproductor.vue:219-250`: pre-rellena `av_player_name`, llama `submitScore('rana', name, score)`, deshabilita el botón tras el primer envío, persiste el nombre.
   - El botón JUGAR DE NUEVO llama `game.restart()`, que reinicializa todo el estado sin remontar el canvas.
   - `Reproductor.vue:95-98` llama `game.destroy()` en `onUnmounted` — aquí se cancelan `rafId` y `keyHandler`.

   Implementar los cinco métodos para encajar en `GameModule` (`Reproductor.vue:18-24`):

   ```ts
   export const game: RanaGame = {
     start(cvs, callbacks) { /* inicializa y arranca el loop */ },
     pause()   { paused = true },
     resume()  { if (running && paused) { paused = false; rafLoop(performance.now()) } },
     restart() { /* para el loop, reinicializa estado, arranca de nuevo */ },
     destroy() {
       running = false
       if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
       if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null }
       canvas = ctx = cbs = null
     },
   }

   export default game
   ```

9. **Verificación final** — `npm run build` (vue-tsc + vite) termina sin errores de TypeScript. Ninguna ruta existente devuelve error.

---

## Acceptance criteria

- [ ] La fila `rana` existe en la tabla `games` de Supabase con los valores del data model.
- [ ] La card de Rana Veloz aparece en `/games` con cover `cover-rana` y color `green`.
- [ ] La ruta `/games/rana/play` carga `Reproductor.vue` sin errores de TypeScript ni de consola.
- [ ] El canvas (640 × 560) se renderiza con las zonas visualmente diferenciadas (carretera, río, zonas seguras, bocas destino).
- [ ] La rana aparece centrada en la fila de inicio al cargar la partida.
- [ ] La rana salta exactamente una celda (40 px) por pulsación de tecla de dirección con animación de 120 ms.
- [ ] La rana no puede salir por los bordes laterales.
- [ ] Los coches y camiones se mueven horizontalmente en loop por sus carriles; se reintroducen por el lado opuesto al salir.
- [ ] Los troncos y tortugas se mueven horizontalmente en loop por sus carriles.
- [ ] Las tortugas alternan entre visible y sumergida con el ciclo definido (3 s / 1.5 s).
- [ ] La rana muere al ser alcanzada por un vehículo de carretera.
- [ ] La rana muere al caer al agua (no estar sobre tronco ni tortugas visibles).
- [ ] La rana muere cuando la tortuga que la soporta se sumerge.
- [ ] La rana muere al agotar el temporizador de ronda.
- [ ] Al morir, `onLifeLost(lives - 1)` se dispara; la rana vuelve a la fila de inicio.
- [ ] Al llegar a una boca libre, la boca queda marcada y se suma el bonus de puntuación.
- [ ] Al llegar a una boca ya ocupada, la rana muere.
- [ ] Al completar las 5 bocas, la ronda termina y comienza la siguiente con `level` incrementado.
- [ ] `onLevelUp(level)` se dispara al iniciar cada nueva ronda.
- [ ] La velocidad de entidades aumenta con cada nivel.
- [ ] El temporizador de ronda disminuye con cada nivel.
- [ ] `onScoreChange(score)` se dispara en cada cambio de puntuación.
- [ ] El HUD interno del canvas (score, nivel, vidas-iconos, barra de tiempo) se dibuja correctamente.
- [ ] El HUD Vue de la plataforma refleja en tiempo real score, vidas y nivel.
- [ ] El botón PAUSA de la plataforma congela el game loop; REANUDAR lo reanuda.
- [ ] Al llegar a `lives = 0`, `onLifeLost(0)` y `onGameOver(score)` se disparan; aparece el modal de `Reproductor.vue`.
- [ ] El modal pre-rellena el nombre desde `av_player_name` si existe en localStorage.
- [ ] Al confirmar el nombre, el score se inserta en Supabase y el nombre se persiste en localStorage.
- [ ] El botón de guardar se deshabilita tras el primer envío (sin doble inserción).
- [ ] El botón JUGAR DE NUEVO reinicia la partida desde cero llamando `game.restart()`.
- [ ] El score guardado aparece en `/games/rana` y en `/salon` al recargar.
- [ ] Al desmontar `Reproductor.vue`, no quedan listeners de teclado ni rAF activos (verificar con DevTools).
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: Primitivas canvas sin sprites bitmap** — coches, camiones, troncos, tortugas y rana se dibujan con formas geométricas canvas y colores temáticos. Razón: no existen assets de Frogger en el repositorio; dibujar por código elimina dependencias de carga de imágenes y permite ajustar visual sin archivos externos.

- **Sí: Cuadrícula discreta de 40 px con animación de salto de 120 ms** — el movimiento de la rana es celda a celda, no continuo. Razón: mecánica canónica de Frogger; el movimiento discreto simplifica enormemente la detección de colisiones y el soporte en el río al comparar filas/columnas enteras.

- **Sí: Doble HUD** — el canvas conserva su HUD interno y `Reproductor.vue` muestra los mismos valores en el HUD Vue de la plataforma. Razón: coherencia con el patrón establecido en todos los juegos de la plataforma.

- **Sí: 3 vidas** — Frogger original arranca con 3 vidas. `onLifeLost` notifica cada pérdida con las vidas restantes. Razón: fiel a la mecánica clásica; coherente con el resto de juegos de Arcade Vault.

- **Sí: Tortugas con ciclo de inmersión** — alternan entre soporte y peligro con temporizador independiente por grupo. Razón: mecánica diferenciadora de Frogger respecto a un río de sólo troncos; añade gestión de riesgo sin complejidad de implementación excesiva.

- **Sí: Temporizador de ronda** — 15 s iniciales, decrementados en niveles altos. La muerte por tiempo añade urgencia. Razón: mecánica original de Frogger; impide que el jugador espere indefinidamente en la zona segura.

- **Sí: 5 bocas destino** — requieren llenarse todas para completar la ronda. Razón: mecánica original que da estructura de objetivo claro por ronda sin ser un nivel único lineal.

- **Sí: Canvas 640 × 560 px (16 × 14 celdas de 40 px)** — relación de aspecto vertical cercana a la original. Razón: el mapa de Frogger es vertical (el jugador avanza hacia arriba); un canvas más ancho que alto no representaría bien el recorrido.

- **Sí: Módulo `game.ts` con interfaz `start/pause/resume/restart/destroy`** — en lugar de un componente Vue o React. Razón: es el patrón establecido en todos los juegos de Arcade Vault; `Reproductor.vue` es genérico y espera exactamente esta interfaz.

- **Sí: Import dinámico en `onMounted` de `Reproductor.vue`** — el módulo de juego se carga sólo en cliente. Razón: `canvas` y `requestAnimationFrame` no existen en SSR; el import en `onMounted` garantiza ejecución sólo en el navegador sin configuración adicional.

- **Sí: `dt = Math.min(dt, 100)` en el game loop** — el delta en ms se recorta a 100 ms máximo. Razón: al volver de una pestaña en segundo plano el navegador puede devolver un `dt` muy alto; recortarlo evita saltos de simulación que colocarían entidades o a la rana en posiciones inválidas.

- **No: Movimiento continuo (interpolado)** — la rana no se desliza; salta de celda en celda. Razón: la interpolación continua requeriría colisiones AABB en espacio continuo para el río y la carretera, aumentando la complejidad sin añadir diversión.

- **No: Cocodrilo disfrazado de tronco ni mosca bonus en bocas** — se cubren en el spec secundario de power-ups y eventos. Razón: son capas de dificultad y recompensa independientes de la mecánica base.

- **No: Módulo genérico `GameBase`** — cada juego tiene su propio módulo. Razón: YAGNI.

- **No: RLS en este spec** — las tablas quedan abiertas (INSERT y SELECT públicos). Razón: se mitiga en el spec futuro de seguridad.

- **No: Realtime en leaderboards** — los scores se ven al recargar. Razón: la complejidad de subscriptions no aporta valor mientras haya pocos jugadores activos.
