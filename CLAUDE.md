# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Proyecto

Arcade Vault — plataforma online para jugar y competir por la mayor cantidad de puntos.

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm run build     # type-check + build de producción (vue-tsc y luego vite)
npm run preview   # previsualizar el build de producción
```

No hay test runner configurado todavía.

## Stack

- **Vue 3** Composition API + `<script setup>`
- **TypeScript** (~6.0)
- **Vite 8** con `@vitejs/plugin-vue`
- **Tailwind CSS v4** mediante el plugin `@tailwindcss/vite` (sin archivo de configuración — usa el plugin de Vite directamente)
- **Vue Router 5** con hash history (`createWebHashHistory`)
- **Pinia 3** para manejo de estado
- **Supabase** como backend (BD y autenticación)

## Arquitectura

```
src/
  main.ts                        # entrada de la app — monta Vue, registra router y pinia
  App.vue                        # raíz: un único <RouterView />
  router/index.ts                # todas las rutas definidas aquí; rutas desconocidas redirigen a /
  data/
    games.ts                     # catálogo estático de juegos (GAMES[]) + tipos + CATS
    user.ts                      # persistencia de usuario en localStorage
  lib/
    supabase.ts                  # cliente Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
    games.ts                     # getGames() — fetch del catálogo desde la tabla `games` de Supabase
    scores.ts                    # submitScore() / getScores() — tabla `scores` de Supabase
  games/
    snake/game.ts                # módulo TypeScript del juego Snake (callbacks: onScoreChange, onLifeLost, onLevelUp, onGameOver)
    bricks/game.ts               # módulo TypeScript de Brick Breaker
    tetro/game.ts                # módulo TypeScript de Tetris Stack
    asteroids/game.ts            # módulo TypeScript de Asteroids
  pages/
    home/Home.vue                # landing con hero, silhouettes flotantes y grid de juegos
    biblioteca/Biblioteca.vue    # catálogo con búsqueda, filtros por categoría y ordenación BD-primero
    salon/Salon.vue              # salón de la fama con podio y tabla de ranking
    detalle/Detalle.vue          # detalle de juego con stats, tags y leaderboard
    reproductor/Reproductor.vue  # pantalla de juego (carcasa CRT + HUD + arena)
    auth/Auth.vue                # login / registro con persistencia en localStorage
    about/About.vue              # página "acerca de" con highlights del proyecto
  components/
    Nav.vue                      # navbar compartida (sticky, glassmorphism, menú móvil)
    FloatingSilhouettes.vue      # siluetas SVG pixel-art animadas (usadas en Home)
  stores/
    games.ts                     # store Pinia de juegos: merge estático+BD, expone dbIds
  style.css                      # estilos globales, design tokens y componentes en capas
```

### Rutas

| Ruta | Nombre | Componente |
|---|---|---|
| `/` | `home` | `Home.vue` |
| `/games` | `biblioteca` | `Biblioteca.vue` |
| `/games/:id` | `game-detail` | `Detalle.vue` |
| `/games/:id/play` | `game-play` | `Reproductor.vue` |
| `/salon` | `salon` | `Salon.vue` |
| `/auth` | `auth` | `Auth.vue` |
| `/about` | `about` | `About.vue` |
| `/*` | — | redirige a `/` |

### Datos (`src/data/`)

**`games.ts`** — catálogo estático de respaldo (fallback sin red):
- `Game` interface: `id`, `title`, `short`, `long`, `cat`, `cover`, `color`, `best`, `plays`
- `GAMES: Game[]` — juegos activos (algunos comentados si aún no están integrados): `glot`, `invaders`, `rana`, `duelo`
- `CATS` — categorías: `TODOS | ARCADE | PUZZLE | SHOOTER | VERSUS`

**`user.ts`** — persistencia mínima:
- `getUser()` / `saveUser()` — lee y escribe `{ name: string }` en `localStorage` bajo la clave `av_user`

### Backend (`src/lib/`)

- **`supabase.ts`** — cliente singleton de Supabase; variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`
- **`games.ts`** — `getGames()` → fetch de la tabla `games`; mapea filas a la interface `Game`
- **`scores.ts`** — `submitScore(gameId, playerName, score)` + `getScores(gameId?)` sobre la tabla `scores`; `ScoreEntry` interface

### Store de juegos (`src/stores/games.ts`)

- Inicializa `games` con el catálogo estático para UI instantánea
- `load()` hace merge estático + BD: la BD pisa datos estáticos por `id`, ids nuevos se añaden
- Expone `dbIds: Set<string>` — IDs que existen en Supabase (usado por Biblioteca para ordenar BD-primero)
- `byId(id)` — lookup por ID

### Módulos de juego (`src/games/`)

Cada juego es un módulo TypeScript puro que recibe un `<canvas>` y un objeto de callbacks:

```ts
interface XxxCallbacks {
  onScoreChange: (score: number) => void
  onLifeLost:    (lives: number) => void
  onLevelUp:     (level: number) => void
  onGameOver:    (finalScore: number) => void
}
```

| Módulo | Juego |
|---|---|
| `snake/game.ts` | Neon Snake |
| `bricks/game.ts` | Brick Breaker |
| `tetro/game.ts` | Tetris Stack |
| `asteroids/game.ts` | Asteroids |

Las páginas viven en `src/pages/<nombre-de-ruta>/`, co-localizando la vista con cualquier subcomponente específico de la página. Los componentes reutilizables van en `src/components/`. Los stores de Pinia van en `src/stores/`.

Tailwind v4 se configura únicamente a través del plugin de Vite — no existe archivo `tailwind.config.*`. Las clases utilitarias están disponibles globalmente; no agregar archivo de configuración salvo que alguna característica de v4 lo requiera.

## Referencias de juegos (`references/started-games/`)

Implementaciones de referencia en HTML/JS puro para integrar como juegos reales:

| Carpeta | Juego |
|---|---|
| `arkanoid/` | Arkanoid (con niveles en `levels.js`) |
| `asteroids/` | Asteroids |
| `tetris/` | Tetris |

Cada carpeta incluye su propio `CLAUDE.md` con instrucciones específicas de integración.

## Sistema de estilos (`src/style.css`)

El archivo está completo y estructurado en capas:

### Design tokens
Definidos en `:root` como variables CSS y expuestos a Tailwind v4 mediante `@theme inline`:

| Token | Valor |
|---|---|
| `--bg` / `--bg-2` / `--bg-3` | Fondos oscuros (`#0a0a0f` → `#15151f`) |
| `--ink` / `--ink-dim` / `--ink-faint` | Texto (`#e6e9ff` → `#4a4f70`) |
| `--cyan` / `--magenta` / `--yellow` / `--green` | Colores neón principales |
| `--gold` / `--silver` / `--bronze` | Colores de ranking |
| `--line` / `--line-2` | Bordes sutiles |
| `--pixel` | Fuente `Press Start 2P` |
| `--mono` | Fuente `JetBrains Mono` |

En Tailwind se usan como `text-cyan`, `bg-bg-2`, `border-line`, `font-pixel`, etc.

### `@layer base`
Reset mínimo: `box-sizing`, altura full, tipografía base sobre `--mono`.

### `@layer components` — clases disponibles

**Layout / fondo**
- `.av-bg` — fondo fijo con gradientes radiales + grid retro animado en perspectiva + scanlines
- `.av-noise` — capa de ruido SVG superpuesta
- `#root` — flex column, z-index sobre el fondo
- `.av-main` — flex:1 para empujar footer

**Tipografía / neón**
- `.pixel` — fuente pixel, uppercase
- `.mono` — fuente monoespaciada
- `.neon-cyan` / `.neon-magenta` / `.neon-yellow` / `.neon-green` — color + text-shadow de brillo
- `.flicker` — animación de parpadeo

**Navegación**
- `.av-nav` — navbar sticky con glassmorphism; contiene `.logo`, `.logo-mark`, `.logo-text`, `.links`, `.spacer`, `.coin-counter`, `.auth-btn`, `.hamburger`
- `.av-mobile-panel` / `.av-mobile-panel.open` — panel lateral móvil deslizable
- `.av-mobile-backdrop` / `.av-mobile-backdrop.open` — overlay semitransparente

**Botones**
- `.btn` — botón base con clip-path diagonal y borde cyan; variantes: `.magenta`, `.yellow`, `.ghost`, `.lg`, `.xl`, `.pulse`

**Animaciones de entrada**
- `.fade-in` / `.slide-in`

**Chips / filtros**
- `.av-chips` — contenedor flex
- `.chip` / `.chip.active` — filtro seleccionable

**Home — hero y grid**
- `.av-hero` — sección hero centrada con h1 en gradiente
- `.av-filters` — fila de filtros con `.av-search`
- `.av-grid` — grid responsivo de cards

**Cards de juego**
- `.card` — card con hover 3D; contiene `.cover`, `.meta`, `.title`, `.desc`, `.row`, `.score-badge`
- Fondos de portada: `.cover-bricks`, `.cover-tetro`, `.cover-snake`, `.cover-glot`, `.cover-invaders`, `.cover-rocas`, `.cover-rana`, `.cover-duelo`

**Hall of Fame**
- `.av-hall`, `.hall-head`, `.hall-tabs`
- `.podium` — grid 1-2-3 con `.podium-slot` (`.gold`, `.silver`, `.bronze`)
- `.hall-table` con `.th` / `.tr` — tabla de ranking; clases especiales: `.top1/2/3`, `.you`, `.you-label`

**Auth**
- `.av-auth-wrap`, `.auth-card`, `.auth-header`, `.auth-tabs`, `.field`, `.auth-divider`, `.social`

**Detalle de juego**
- `.av-detail` — grid 2 columnas; `.detail-cover`, `.detail-info`, `.detail-tags`, `.stat-strip`, `.detail-actions`
- `.leaderboard` con `.lb-row` (`.top1/2/3`)

**Player / pantalla de juego**
- `.av-player`, `.player-hud`, `.hud-stat` (`.lives`, `.level`), `.hud-actions`
- `.crt` — carcasa CRT con `.crt-screen`, `.crt-content`, `.crt-bottom`
- `.game-arena` con `.grid-floor`, `.player-ship`, `.enemy` (`.e1/2/3`)
- `.modal-bd`, `.modal` — modal de fin de partida con `.final`, `.input-row`, `.actions`, `.toast-saved`

### Keyframes definidos
`gridscroll`, `flicker`, `fadeIn`, `slideIn`, `blink`, `pulse`, `rise`, `bob`, `drift`, `typewriter`, `caret`

### Responsive
- `≤840px` — navbar oculta links y coin-counter, muestra hamburger
- `≤900px` — `.av-detail` pasa a columna única
- `≤720px` — padding reducido en grid, hero, filters, hall; podium en columna; tabla de hall con columnas ajustadas

## Skills
Para tareas de diseño frontend, carga y aplica 
~/.claude/skills/frontend-design/SKILL.md
