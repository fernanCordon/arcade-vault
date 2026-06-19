import { getSkinPalette, type SkinPalette } from '../skins'

// Classic = sin atributo data-skin (o "classic") en <html>.
function isClassicSkin(): boolean {
  const s = document.documentElement.dataset.skin
  return !s || s === 'classic'
}

// ─── Constants ───────────────────────────────────────────────────────────────
const COLS = 16
const ROWS = 14
const CELL = 40
const CANVAS_W = COLS * CELL  // 640
const CANVAS_H = ROWS * CELL  // 560

const ROW_GOALS     = 0
const ROW_RIVER_TOP = 1
const ROW_RIVER_BOT = 6
const ROW_SAFE_MID  = 7
const ROW_ROAD_TOP  = 8
const ROW_ROAD_BOT  = 12
const ROW_START     = 13

const GOAL_COLS = [1, 4, 7, 10, 13] // center col of each of the 5 goals (span: col-1 to col+1)

// ─── Public types ─────────────────────────────────────────────────────────────
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

// ─── Local types ──────────────────────────────────────────────────────────────
type Direction = 'up' | 'down' | 'left' | 'right'

interface Entity {
  col:            number
  width:          number
  type:           'car' | 'truck' | 'log' | 'turtle'
  submerged?:     boolean
  submergeTimer?: number
  color?:         string
}

interface Lane {
  row:      number
  speed:    number
  dir:      1 | -1
  entities: Entity[]
}

interface Frog {
  col:       number
  row:       number
  animating: boolean
  animT:     number
  targetCol: number
  targetRow: number
}

// ─── Module state ─────────────────────────────────────────────────────────────
let canvas:     HTMLCanvasElement | null = null
let ctx:        CanvasRenderingContext2D | null = null
let cbs:        RanaCallbacks | null = null
let frog:       Frog
let lanes:      Lane[]
let goals:      Set<number>
let lives:      number
let score:      number
let level:      number
let timer:      number
let rafId:      number | null = null
let paused:     boolean = false
let running:    boolean = false
let pendingDir: Direction | null = null
let keyHandler: ((e: KeyboardEvent) => void) | null = null

// ─── Lane builder ─────────────────────────────────────────────────────────────
function buildLanes(lvl: number): Lane[] {
  const speedMult = Math.pow(1.15, lvl - 1)
  const result: Lane[] = []

  const roadConfigs: { row: number; speed: number; dir: 1 | -1; entities: Omit<Entity, 'submerged' | 'submergeTimer'>[] }[] = [
    { row: 12, speed: 1.5, dir:  1, entities: [{ col: 0,  width: 1, type: 'car',   color: '#e74c3c' }, { col: 5,  width: 1, type: 'car',   color: '#3498db' }, { col: 10, width: 1, type: 'car',   color: '#f1c40f' }] },
    { row: 11, speed: 2.0, dir: -1, entities: [{ col: 1,  width: 3, type: 'truck', color: '#7f8c8d' }, { col: 8,  width: 3, type: 'truck', color: '#95a5a6' }] },
    { row: 10, speed: 2.5, dir:  1, entities: [{ col: 0,  width: 1, type: 'car',   color: '#e67e22' }, { col: 4,  width: 2, type: 'truck', color: '#7f8c8d' }, { col: 10, width: 1, type: 'car',   color: '#9b59b6' }] },
    { row: 9,  speed: 3.0, dir: -1, entities: [{ col: 2,  width: 1, type: 'car',   color: '#1abc9c' }, { col: 7,  width: 1, type: 'car',   color: '#e74c3c' }, { col: 12, width: 1, type: 'car',   color: '#f1c40f' }] },
    { row: 8,  speed: 4.0, dir:  1, entities: [{ col: 0,  width: 2, type: 'truck', color: '#2c3e50' }, { col: 6,  width: 1, type: 'car',   color: '#c0392b' }, { col: 11, width: 2, type: 'truck', color: '#34495e' }] },
  ]

  const riverConfigs: { row: number; speed: number; dir: 1 | -1; entities: Entity[] }[] = [
    { row: 6, speed: 1.0, dir:  1, entities: [
      { col: 0,  width: 3, type: 'log' },
      { col: 7,  width: 2, type: 'turtle', submerged: false, submergeTimer: 0 },
      { col: 12, width: 3, type: 'log' },
    ]},
    { row: 5, speed: 1.5, dir: -1, entities: [
      { col: 1,  width: 4, type: 'log' },
      { col: 9,  width: 4, type: 'log' },
    ]},
    { row: 4, speed: 2.0, dir:  1, entities: [
      { col: 0,  width: 2, type: 'turtle', submerged: false, submergeTimer: 0 },
      { col: 5,  width: 3, type: 'log' },
      { col: 11, width: 2, type: 'turtle', submerged: false, submergeTimer: 500 },
    ]},
    { row: 3, speed: 1.2, dir: -1, entities: [
      { col: 0,  width: 4, type: 'log' },
      { col: 8,  width: 2, type: 'turtle', submerged: false, submergeTimer: 0 },
    ]},
    { row: 2, speed: 2.5, dir:  1, entities: [
      { col: 1,  width: 3, type: 'log' },
      { col: 7,  width: 2, type: 'turtle', submerged: false, submergeTimer: 1500 },
      { col: 12, width: 2, type: 'log' },
    ]},
    { row: 1, speed: 1.8, dir: -1, entities: [
      { col: 0,  width: 2, type: 'turtle', submerged: false, submergeTimer: 0 },
      { col: 5,  width: 4, type: 'log' },
      { col: 12, width: 3, type: 'log' },
    ]},
  ]

  for (const cfg of roadConfigs) {
    result.push({
      row: cfg.row,
      speed: cfg.speed * speedMult,
      dir: cfg.dir,
      entities: cfg.entities.map(e => ({ ...e })),
    })
  }

  for (const cfg of riverConfigs) {
    result.push({
      row: cfg.row,
      speed: cfg.speed * speedMult,
      dir: cfg.dir,
      entities: cfg.entities.map(e => ({ ...e })),
    })
  }

  return result
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roundTimer(lvl: number): number {
  return Math.max(8, 15 - (lvl - 1))
}

function initFrog(): Frog {
  return { col: 8, row: ROW_START, animating: false, animT: 0, targetCol: 8, targetRow: ROW_START }
}

function checkRoadCollision(fr: Frog): boolean {
  if (fr.row < ROW_ROAD_TOP || fr.row > ROW_ROAD_BOT) return false
  const lane = lanes.find(l => l.row === fr.row)
  if (!lane) return false
  for (const e of lane.entities) {
    if (fr.col >= e.col && fr.col < e.col + e.width) return true
  }
  return false
}

function getSupport(fr: Frog): Entity | null {
  if (fr.row < ROW_RIVER_TOP || fr.row > ROW_RIVER_BOT) return null
  const lane = lanes.find(l => l.row === fr.row)
  if (!lane) return null
  for (const e of lane.entities) {
    if (fr.col >= e.col && fr.col < e.col + e.width) {
      if (e.type === 'turtle' && e.submerged) return null
      return e
    }
  }
  return null
}

function goalIndexForCol(col: number): number | null {
  for (let i = 0; i < GOAL_COLS.length; i++) {
    const gc = GOAL_COLS[i]
    if (col >= gc - 1 && col <= gc + 1) return i
  }
  return null
}

// ─── Kill & round logic ───────────────────────────────────────────────────────
function killFrog(): void {
  lives--
  cbs?.onLifeLost(lives)
  if (lives === 0) {
    cbs?.onGameOver(score)
    running = false
    return
  }
  frog = initFrog()
  timer = roundTimer(level)
}

function completeRound(): void {
  goals = new Set()
  level++
  cbs?.onLevelUp(level)
  lanes = buildLanes(level)
  timer = roundTimer(level)
  frog = initFrog()
}

function addScore(pts: number): void {
  score += pts
  cbs?.onScoreChange(score)
}

// tracks highest row reached this life (for +10 per new row)
let highestRow: number = ROW_START

function resolveDestCell(): void {
  const fr = frog

  // Reached goal row
  if (fr.row === ROW_GOALS) {
    const idx = goalIndexForCol(fr.col)
    if (idx === null || goals.has(idx)) {
      // not a goal mouth or already occupied → die
      killFrog()
      return
    }
    goals.add(idx)
    addScore(50 + timer * 10)
    if (goals.size === 5) {
      addScore(200)
      completeRound()
    } else {
      frog = initFrog()
      timer = roundTimer(level)
    }
    highestRow = ROW_START
    return
  }

  // Road collision
  if (checkRoadCollision(fr)) {
    killFrog()
    return
  }

  // River: no support
  if (fr.row >= ROW_RIVER_TOP && fr.row <= ROW_RIVER_BOT) {
    if (!getSupport(fr)) {
      killFrog()
      return
    }
  }

  // Score for new rows advanced upward
  if (fr.row < highestRow) {
    addScore((highestRow - fr.row) * 10)
    highestRow = fr.row
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update(dt: number): void {
  if (paused || !running) return
  dt = Math.min(dt, 100)

  // Move lane entities
  for (const lane of lanes) {
    for (const e of lane.entities) {
      e.col += (lane.speed / CELL) * lane.dir * dt / 16

      // wrap around
      if (lane.dir === 1 && e.col > COLS) e.col = -e.width
      if (lane.dir === -1 && e.col + e.width < 0) e.col = COLS
    }

    // turtle submersion
    for (const e of lane.entities) {
      if (e.type !== 'turtle') continue
      e.submergeTimer! += dt
      const cycle = e.submerged ? 1500 : 3000
      if (e.submergeTimer! >= cycle) {
        e.submerged = !e.submerged
        e.submergeTimer = 0
      }
    }
  }

  // Frog animation
  if (frog.animating) {
    frog.animT += dt
    if (frog.animT >= 120) {
      frog.col = frog.targetCol
      frog.row = frog.targetRow
      frog.animating = false
      resolveDestCell()
    }
  } else {
    // Start new jump
    if (pendingDir !== null) {
      const dir = pendingDir
      pendingDir = null
      let nc = frog.col, nr = frog.row
      if (dir === 'up')    nr--
      if (dir === 'down')  nr++
      if (dir === 'left')  nc--
      if (dir === 'right') nc++

      // clamp lateral
      nc = Math.max(0, Math.min(COLS - 1, nc))
      // clamp vertical
      nr = Math.max(0, Math.min(ROW_START, nr))

      if (nc !== frog.col || nr !== frog.row) {
        frog.animating = true
        frog.animT = 0
        frog.targetCol = nc
        frog.targetRow = nr
      }
    }

    // River drift
    if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
      const support = getSupport(frog)
      if (support) {
        const lane = lanes.find(l => l.row === frog.row)!
        frog.col += (lane.speed / CELL) * lane.dir * dt / 16

        // check out-of-bounds from drift
        if (frog.col < 0 || frog.col >= COLS) {
          killFrog()
          return
        }
      } else {
        killFrog()
        return
      }
    }
  }

  // Timer countdown
  timer -= dt / 1000
  if (timer <= 0) {
    timer = 0
    killFrog()
  }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
// Tinte de vehículos: en Classic respetamos los colores nativos por vehículo
// (e.color); en Neon/Retro toda la flota se tiñe con el token de peligro
// (--skin-enemy) para mantener coherencia con la skin sobre fondo oscuro.
function vehicleColor(pal: SkinPalette, fallback: string, native?: string): string {
  if (isClassicSkin()) return native ?? fallback
  return pal.enemy
}

const RANA_FALLBACK = { grass: '#1a3a1a', goal: '#1a4a1a', water: '#0a2a5a', road: '#111111', log: '#7a4a1a', log2: '#5a3010' }

function draw(): void {
  if (!ctx || !canvas) return
  const pal = getSkinPalette()
  const rp = pal.rana ?? RANA_FALLBACK

  // Background zones
  for (let r = 0; r < ROWS; r++) {
    if (r === ROW_GOALS) {
      ctx.fillStyle = rp.goal
    } else if (r >= ROW_RIVER_TOP && r <= ROW_RIVER_BOT) {
      ctx.fillStyle = rp.water
    } else if (r === ROW_SAFE_MID) {
      ctx.fillStyle = rp.grass
    } else if (r >= ROW_ROAD_TOP && r <= ROW_ROAD_BOT) {
      ctx.fillStyle = rp.road
    } else {
      // ROW_START
      ctx.fillStyle = rp.grass
    }
    ctx.fillRect(0, r * CELL, CANVAS_W, CELL)
  }

  // Road lane lines
  for (let r = ROW_ROAD_TOP; r <= ROW_ROAD_BOT; r++) {
    ctx.strokeStyle = pal.line
    ctx.lineWidth = 1
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(0, r * CELL + CELL - 1)
    ctx.lineTo(CANVAS_W, r * CELL + CELL - 1)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Goal mouths
  for (let i = 0; i < GOAL_COLS.length; i++) {
    const gc = GOAL_COLS[i]
    const x = (gc - 1) * CELL
    const y = ROW_GOALS * CELL
    ctx.fillStyle = rp.goal
    ctx.fillRect(x, y, 3 * CELL, CELL)
    ctx.strokeStyle = pal.accent
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, y + 1, 3 * CELL - 2, CELL - 2)

    if (goals.has(i)) {
      // draw frog silhouette in occupied goal
      const cx = x + 1.5 * CELL
      const cy = y + CELL / 2
      ctx.fillStyle = pal.primary
      ctx.beginPath()
      ctx.ellipse(cx, cy, 10, 8, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Entities
  for (const lane of lanes) {
    const y = lane.row * CELL
    for (const e of lane.entities) {
      const x = e.col * CELL
      const w = e.width * CELL

      if (e.type === 'log') {
        ctx.fillStyle = rp.log
        ctx.fillRect(x + 2, y + 8, w - 4, CELL - 16)
        // wood grain lines
        ctx.strokeStyle = rp.log2
        ctx.lineWidth = 1
        for (let i = 1; i < e.width; i++) {
          ctx.beginPath()
          ctx.moveTo(x + i * CELL, y + 10)
          ctx.lineTo(x + i * CELL, y + CELL - 10)
          ctx.stroke()
        }
      } else if (e.type === 'turtle') {
        const alpha = e.submerged ? 0.3 : 1.0
        ctx.globalAlpha = alpha
        for (let t = 0; t < e.width; t++) {
          const tx = x + t * CELL + CELL / 2
          const ty = y + CELL / 2
          ctx.fillStyle = pal.secondary
          ctx.beginPath()
          ctx.ellipse(tx, ty, 14, 12, 0, 0, Math.PI * 2)
          ctx.fill()
          // shell pattern
          ctx.strokeStyle = pal.bg
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.ellipse(tx, ty, 9, 7, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.globalAlpha = 1.0
      } else if (e.type === 'car') {
        ctx.fillStyle = vehicleColor(pal, '#e74c3c', e.color)
        ctx.fillRect(x + 3, y + 10, w - 6, CELL - 20)
        // wheels
        ctx.fillStyle = pal.bg
        ctx.beginPath()
        ctx.arc(x + 8, y + CELL - 8, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + w - 8, y + CELL - 8, 4, 0, Math.PI * 2)
        ctx.fill()
      } else if (e.type === 'truck') {
        ctx.fillStyle = vehicleColor(pal, '#7f8c8d', e.color)
        ctx.fillRect(x + 2, y + 8, w - 4, CELL - 16)
        // cabin
        ctx.fillStyle = isClassicSkin() ? '#555' : pal.accent
        const cabinW = CELL - 6
        ctx.fillRect(x + (lane.dir === 1 ? w - cabinW - 2 : 2), y + 10, cabinW, CELL - 20)
        // wheels
        ctx.fillStyle = pal.bg
        const wheelPositions = [8, w - 8]
        for (const wx of wheelPositions) {
          ctx.beginPath()
          ctx.arc(x + wx, y + CELL - 6, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  // Frog
  {
    let fx: number, fy: number
    if (frog.animating) {
      const t = frog.animT / 120
      fx = (frog.col + (frog.targetCol - frog.col) * t) * CELL + CELL / 2
      fy = (frog.row + (frog.targetRow - frog.row) * t) * CELL + CELL / 2
    } else {
      fx = frog.col * CELL + CELL / 2
      fy = frog.row * CELL + CELL / 2
    }

    // Body
    ctx.fillStyle = pal.primary
    ctx.beginPath()
    ctx.ellipse(fx, fy, 14, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    // Eyes
    ctx.fillStyle = pal.neutral
    ctx.beginPath()
    ctx.arc(fx - 6, fy - 5, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(fx + 6, fy - 5, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = pal.bg
    ctx.beginPath()
    ctx.arc(fx - 6, fy - 5, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(fx + 6, fy - 5, 2, 0, Math.PI * 2)
    ctx.fill()

    // Legs (extended during jump)
    if (frog.animating) {
      ctx.strokeStyle = pal.secondary
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(fx - 14, fy)
      ctx.lineTo(fx - 22, fy + 8)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(fx + 14, fy)
      ctx.lineTo(fx + 22, fy + 8)
      ctx.stroke()
    }
  }

  // ── Internal HUD ──────────────────────────────────────────────────────────
  // Time bar (row 0 area, below goals)
  const timerMax = roundTimer(level)
  const timerFrac = Math.max(0, timer / timerMax)
  const barColor = timerFrac > 0.5 ? pal.secondary : timerFrac > 0.25 ? pal.accent : pal.enemy
  // Overlay HUD bar at very bottom
  const HUD_Y = CANVAS_H - 18
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, HUD_Y - 4, CANVAS_W, 22)
  // score left
  ctx.fillStyle = pal.neutral
  ctx.font = '10px "Press Start 2P", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`${score}`, 8, HUD_Y + 10)
  // level center
  ctx.textAlign = 'center'
  ctx.fillText(`LV${level}`, CANVAS_W / 2, HUD_Y + 10)
  // lives right (frog icons)
  for (let i = 0; i < lives; i++) {
    const lx = CANVAS_W - 16 - i * 18
    ctx.fillStyle = pal.primary
    ctx.beginPath()
    ctx.arc(lx, HUD_Y + 6, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  // timer bar
  ctx.fillStyle = pal.line
  ctx.fillRect(0, CANVAS_H - 5, CANVAS_W, 5)
  ctx.fillStyle = barColor
  ctx.fillRect(0, CANVAS_H - 5, CANVAS_W * timerFrac, 5)
}

// ─── RAF loop ─────────────────────────────────────────────────────────────────
let lastTs = 0
function rafLoop(ts: number): void {
  if (!running) return
  const dt = ts - lastTs
  lastTs = ts
  update(dt)
  draw()
  rafId = requestAnimationFrame(rafLoop)
}

// ─── Exported game object ─────────────────────────────────────────────────────
export const game: RanaGame = {
  start(cvs, callbacks) {
    canvas = cvs
    canvas.width  = CANVAS_W
    canvas.height = CANVAS_H
    ctx = canvas.getContext('2d')!
    cbs = callbacks

    lives = 3
    score = 0
    level = 1
    goals = new Set()
    highestRow = ROW_START
    frog = initFrog()
    lanes = buildLanes(level)
    timer = roundTimer(level)
    paused = false
    running = true
    pendingDir = null
    keyHandler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      }
      const dir = map[e.code] ?? map[e.key]
      if (dir) {
        e.preventDefault()
        pendingDir = dir
      }
    }
    document.addEventListener('keydown', keyHandler)

    lastTs = performance.now()
    rafId = requestAnimationFrame(rafLoop)
  },

  pause() {
    paused = true
  },

  resume() {
    if (running && paused) {
      paused = false
      lastTs = performance.now()
      rafLoop(lastTs)
    }
  },

  restart() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
    lives = 3
    score = 0
    level = 1
    goals = new Set()
    highestRow = ROW_START
    frog = initFrog()
    lanes = buildLanes(level)
    timer = roundTimer(level)
    paused = false
    running = true
    pendingDir = null
    cbs?.onScoreChange(0)
    cbs?.onLifeLost(3)
    cbs?.onLevelUp(1)
    lastTs = performance.now()
    rafId = requestAnimationFrame(rafLoop)
  },

  destroy() {
    running = false
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
    if (keyHandler) { document.removeEventListener('keydown', keyHandler); keyHandler = null }
    canvas = null
    ctx = null
    cbs = null
  },
}

export default game
