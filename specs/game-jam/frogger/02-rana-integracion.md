# Rana Veloz — Integración

| Campo | Valor |
|---|---|
| Estado | Pendiente |
| Dependencias | `01-rana-diseno`, `07-leaderboard-supabase` |
| Fecha | 2026-06-19 |
| Objetivo | Implementar `src/games/rana/game.ts` con el bucle de juego completo (carretera, río, lianas, timer) y conectarlo al HUD de Vue mediante callbacks. Seed de Supabase y activación de la card. |

---

## Alcance

### Dentro del spec

- `src/data/games.ts` — descomentar la entrada `rana` (ya existe comentada o activa)
- `src/games/rana/game.ts` — módulo TypeScript con todo el bucle de juego
- `src/style.css` — clase `.cover-rana` ya existe; sin cambios salvo confirmación visual
- Tabla `games` en Supabase — seed de la fila `rana`

### Fuera del spec

- `Reproductor.vue`, `Detalle.vue`, `src/lib/scores.ts` — infraestructura genérica, sin tocar
- Controles táctiles / mobile
- Paginación del leaderboard
- Otros juegos

---

## Modelo de datos

### `src/data/games.ts` — entrada existente

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
INSERT INTO games (id, title, short, long, cat, cover, color, best, plays)
VALUES (
  'rana', 'RANA VELOZ', 'Cruza sin ser aplastado',
  'Salta de liana en liana, esquiva camiones y cruza el río sobre troncos que se mueven. El tiempo no espera.',
  'MAZE', 'cover-rana', 'green', 22100, 7600
)
ON CONFLICT (id) DO NOTHING;
```

### Mecánica de score y niveles

- Avanzar fila nueva: `+10`
- Llegar a liana: `+100 × level`
- Bonus de tiempo: `+(timeLeft × 2)` (timeLeft en segundos, 0–30)
- Insecto: `+200`
- Nivel sube al completar los 5 destinos del nivel actual
- Velocidad de obstáculos: `baseSpeed × (1 + (level - 1) × 0.10)`
- Tiempo por cruce: 30 segundos fijos (no cambia con el nivel)
- Vidas: 3; al llegar a 0 → `onLifeLost(0)` + `onGameOver(finalScore)`

---

## Interfaz del módulo `src/games/rana/game.ts`

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

---

## Plan de implementación

### 1. Seed en Supabase

Ejecutar el INSERT de la sección "Modelo de datos". La card de Rana Veloz en Biblioteca ya aparece gracias al array estático; el seed sincroniza el leaderboard.

### 2. Verificar que la entrada `rana` está activa en `src/data/games.ts`

La entrada puede estar comentada. Descomentarla si es necesario.

### 3. Crear `src/games/rana/game.ts`

#### Estado del módulo

```ts
// Configuración del grid
const COLS = 16, ROWS = 12, CELL = 50

// Tipos de fila
type RowType = 'safe' | 'road' | 'median' | 'river' | 'lilies'

// Estado del juego
let canvas: HTMLCanvasElement | null
let ctx: CanvasRenderingContext2D | null
let cbs: RanaCallbacks | null
let frog: { col: number; row: number; dir: 'up'|'down'|'left'|'right' }
let lives: number
let score: number
let level: number
let filledLilies: Set<number>          // columnas de destino ocupadas
let obstacles: Obstacle[]              // vehículos y plataformas flotantes
let timeLeft: number                   // segundos restantes del cruce
let timerInterval: ReturnType<typeof setInterval> | null
let rafId: number | null
let running: boolean
let paused: boolean
let gameOverFired: boolean
let keyHandler: ((e: KeyboardEvent) => void) | null
```

#### Tipos de obstacle

```ts
interface Obstacle {
  row: number
  col: number          // posición en columnas (puede ser float para movimiento suave)
  width: number        // en celdas (1 para vehículos, 2–3 para troncos/tortugas)
  speed: number        // celdas por segundo, negativo = izquierda
  type: 'car' | 'truck' | 'bike' | 'log' | 'turtle'
  submerged?: boolean  // solo tortugas
  submergeTimer?: number
}
```

#### Funciones principales

- **`start(canvas, callbacks)`**: inicializa estado (frog en fila 0, col 8; lives=3; score=0; level=1), crea obstáculos con `buildLevel()`, registra `keydown` en `window` (flechas + WASD, `preventDefault` en flechas), arranca `rafLoop()` y `startTimer()`

- **`buildLevel()`**: genera el array `obstacles` para todos los carriles según el nivel actual:
  - Carretera (filas 1–4): 3–5 vehículos por carril, velocidad y dirección alternadas por fila
  - Río (filas 6–9): 2–4 troncos/tortugas por carril, velocidad y dirección alternadas
  - Velocidad = `baseSpeed × (1 + (level-1) × 0.10)`

- **`rafLoop(timestamp)`**: loop con `requestAnimationFrame`; calcula `dt` (delta en segundos desde el frame anterior); llama `update(dt)` y `draw()`; si `!paused && running` vuelve a pedir frame

- **`update(dt)`**:
  - Mueve todos los obstáculos: `obs.col += obs.speed × dt`; envuelve si sale del canvas
  - Actualiza timer de inmersión de tortugas
  - Aplica desplazamiento de plataforma a la rana si está montada en el río
  - Comprueba colisión rana–vehículo (celda completa solapada) → `loseLife()`
  - Comprueba rana en río sin plataforma → `loseLife()`
  - Comprueba rana en plataforma sumergida → `loseLife()`
  - Comprueba rana fuera del canvas → `loseLife()`
  - Comprueba llegada a liana: si `frog.row === 10` y `filledLilies` no tiene esa col → añadir, sumar score, comprobar nivel completo
  - Comprueba insecto (spawneado aleatoriamente en lianas libres, cada ~10 s)

- **`startTimer()`**: `setInterval` de 1 s; decrementa `timeLeft`; llama `cbs.onScoreChange` para actualizar HUD (si el HUD muestra el timer); a 0 → `loseLife()`

- **`loseLife()`**: cancela timer, descuenta `lives`, llama `cbs.onLifeLost(lives)`; si `lives === 0` → `cbs.onGameOver(score)`, `gameOverFired = true`, para el loop; si no → resetea posición de rana + `startTimer()`

- **`nextLevel()`**: incrementa `level`, resetea `filledLilies`, limpia posición de rana, llama `cbs.onLevelUp(level)`, `buildLevel()`, `startTimer()`

- **`draw()`**: 
  - Fondo negro
  - Carretera: franjas `#1a1a1a` con línea central `#ffff00` punteada
  - Río: franjas `#0a0a2a` con destellos cyan
  - Acera / mediana: `#0a1a0a`
  - Lianas: huecos destino como rectángulos `#002200`; rellenos con `#00ff88` al completarse
  - Obstáculos: cada tipo con su color y borde neón
  - Rana: rectángulo `#00ff44` con orientación indicada por un triángulo interior
  - Timer: barra horizontal en la fila superior del HUD canvas (o en el canvas propio si el HUD es externo)

- **`pause()`**: activa `paused`, cancela `timerInterval` y `rafId`
- **`resume()`**: desactiva `paused`, reanuda `startTimer()` y `rafLoop()`
- **`restart()`**: para todo, reinicializa estado, llama `buildLevel()`, `startTimer()`, `rafLoop()`
- **`destroy()`**: cancela `rafId`, `timerInterval`, elimina `keyHandler` con `removeEventListener`, nullea `canvas/ctx/cbs/keyHandler`

### 4. Conectar en `Reproductor.vue`

`Reproductor.vue` ya es genérico: detecta el `gameId` de la ruta, importa dinámicamente el módulo del juego y llama a `game.start(canvas, callbacks)`. Solo hay que asegurarse de que el import dinámico incluya la ruta `rana`:

```ts
// En Reproductor.vue, el switch/map de juegos debe incluir:
'rana': () => import('@/games/rana/game.ts')
```

Verificar que ese mapa ya cubre `rana` o añadirlo.

### 5. Verificar con `npm run build`

Sin errores de TypeScript antes de considerar la integración completa.

---

## Criterios de aceptación

- [ ] La card de Rana Veloz aparece en Biblioteca con categoría MAZE y acento verde
- [ ] `/games/rana` carga `Detalle.vue` con los datos correctos
- [ ] `/games/rana/play` carga `Reproductor.vue` con el canvas 800×600 del juego
- [ ] La rana arranca en la fila inferior, centrada
- [ ] Flechas y WASD mueven la rana un salto por pulsación; las flechas no hacen scroll
- [ ] La rana no puede salir por los lados del canvas
- [ ] Los vehículos se mueven y envuelven el canvas
- [ ] Los troncos y tortugas se mueven y envuelven el canvas
- [ ] Al chocar con un vehículo, la rana pierde una vida y el HUD lo refleja
- [ ] Al estar en el río sin plataforma, la rana pierde una vida
- [ ] Al subirse a un tronco, la rana se desplaza con él
- [ ] Al llegar a una liana libre, el hueco se marca como completado y suma puntos
- [ ] El bonus de tiempo se suma correctamente al llegar a una liana
- [ ] Al completar las 5 lianas, el nivel sube y los obstáculos aceleran
- [ ] El HUD muestra score, vidas y nivel en tiempo real
- [ ] El timer de 30 s regresa a 0 y provoca pérdida de vida
- [ ] Al llegar a 0 vidas, se abre el modal de fin de partida con la puntuación final
- [ ] JUGAR DE NUEVO reinicia con estado limpio (score 0, nivel 1, 3 vidas)
- [ ] El score se guarda en Supabase y aparece en el leaderboard de `Detalle.vue`
- [ ] Al desmontar `Reproductor.vue`, no quedan listeners de teclado ni rAF activos
- [ ] `npm run build` sin errores de TypeScript

---

## Decisiones de diseño

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Loop de juego | `requestAnimationFrame` + `dt` | `setTimeout` paso discreto | El movimiento fluido de obstáculos requiere interpolación continua; la rana mantiene saltos discretos via input |
| Posición de obstáculos | `col` como float continuo | Entero de cuadrícula | Movimiento fluido; colisión se evalúa por solapamiento de rangos, no por celda exacta |
| Timer | `setInterval` independiente | Dentro del `rafLoop` | Separa la precisión del timer del framerate; más simple de pausar/reanudar |
| Sprites | Formas geométricas neón | PNG externo | Sin assets de imagen adicionales; coherencia visual con el resto de juegos de la plataforma |
| Colisión | Celda completa solapada (AABB) | Pixel-perfect | Suficiente para el género; más predecible para el jugador |
| Plataformas río | Rana hereda velocidad del tronco | Detección de colisión cada frame | Más natural; la rana se siente "montada" en la plataforma |
| Tortugas | Ciclo visible/sumergida cada ~3 s | Siempre visibles | Añade variación y tensión sin complejidad extra |
| Canvas | 800×600 con `max-width:100%; height:auto` | Resolución fija sin escalar | Responsivo en pantallas pequeñas sin cambiar coordenadas internas |

---

## Riesgos identificados

- **Listener de teclado global:** mismo riesgo que Snake. Mitigación: guardar referencia en `keyHandler` y llamar `removeEventListener` explícito en `destroy()`.

- **rAF en segundo plano:** si el usuario cambia de pestaña, `rAF` se ralentiza automáticamente (comportamiento del navegador); el `dt` puede crecer mucho al volver. Mitigación: `dt = Math.min(dt, 0.1)` para evitar saltos de simulación.

- **Timer vs pausa:** al llamar `pause()`, el `setInterval` del timer debe cancelarse. Al `resume()`, reiniciarlo desde `timeLeft` actual (no reiniciar a 30). Verificar que los estados no se desincronicen.

- **Obstáculos wrap-around y colisión en borde:** un obstáculo que envuelve el canvas puede estar parcialmente fuera del borde derecho y parcialmente en el izquierdo. La lógica AABB debe tratar el wrap (checar ambos lados) para no crear zona ciega de colisión.

- **Rana en tronco que sale del canvas:** si el tronco arrastra a la rana fuera del canvas → `loseLife()` antes del wrap del tronco. Verificar el orden de evaluación en `update()`.
