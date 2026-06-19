import { getSkinPalette } from '../skins'

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

const CELL = 40
const COLS = 20
const ROWS = 20

type Dir = 'U' | 'D' | 'L' | 'R'
interface Cell { x: number; y: number }
interface Fruit extends Cell { sx: number; sy: number; sw: number; sh: number }

const FRUITS = [
  { sx: 34,   sy: 136, sw: 110, sh: 160 },
  { sx: 186,  sy: 136, sw: 150, sh: 160 },
  { sx: 378,  sy: 136, sw: 110, sh: 160 },
  { sx: 540,  sy: 136, sw: 130, sh: 160 },
  { sx: 712,  sy: 136, sw: 130, sh: 160 },
  { sx: 894,  sy: 136, sw: 110, sh: 160 },
  { sx: 1066, sy: 136, sw: 110, sh: 160 },
  { sx: 1228, sy: 136, sw: 130, sh: 160 },
  { sx: 1400, sy: 136, sw: 130, sh: 160 },
  { sx: 1582, sy: 136, sw: 110, sh: 160 },
  { sx: 1734, sy: 136, sw: 150, sh: 160 },
  { sx: 1906, sy: 136, sw: 150, sh: 160 },
  { sx: 2068, sy: 136, sw: 170, sh: 160 },
  { sx: 2250, sy: 136, sw: 140, sh: 160 },
  { sx: 2432, sy: 136, sw: 130, sh: 160 },
  { sx: 2604, sy: 136, sw: 130, sh: 160 },
  { sx: 2786, sy: 136, sw: 110, sh: 160 },
  { sx: 2948, sy: 136, sw: 130, sh: 160 },
  { sx: 3110, sy: 136, sw: 150, sh: 160 },
  { sx: 3302, sy: 136, sw: 110, sh: 160 },
  { sx: 3454, sy: 136, sw: 150, sh: 160 },
  { sx: 3637, sy: 136, sw: 130, sh: 160 },
]

const OPPOSITE: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L' }

let snake:        Cell[] = []
let dir:          Dir = 'R'
let nextDir:      Dir = 'R'
let fruit:        Fruit | null = null
let score:        number = 0
let level:        number = 1
let fruitsEaten:  number = 0
let running:      boolean = false
let paused:       boolean = false
let gameOverFired: boolean = false
let loopTimeout:  ReturnType<typeof setTimeout> | null = null
let canvas:       HTMLCanvasElement | null = null
let ctx:          CanvasRenderingContext2D | null = null
let cbs:          SnakeCallbacks | null = null
let img:          HTMLImageElement | null = null
let imgReady:     boolean = false
let keyHandler:   ((e: KeyboardEvent) => void) | null = null

function interval(): number {
  return Math.max(80, 300 - (level - 1) * 20)
}

function spawnFruit() {
  const occupied = new Set(snake.map(c => `${c.x},${c.y}`))
  let x: number, y: number
  do {
    x = Math.floor(Math.random() * COLS)
    y = Math.floor(Math.random() * ROWS)
  } while (occupied.has(`${x},${y}`))
  const sprite = FRUITS[Math.floor(Math.random() * FRUITS.length)]
  fruit = { x, y, ...sprite }
}

function draw() {
  if (!canvas || !ctx) return

  const palette = getSkinPalette()

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = palette.grid
  ctx.lineWidth = 0.5
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, canvas.height); ctx.stroke()
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(canvas.width, r * CELL); ctx.stroke()
  }

  if (fruit && imgReady && img) {
    ctx.drawImage(img, fruit.sx, fruit.sy, fruit.sw, fruit.sh, fruit.x * CELL, fruit.y * CELL, CELL, CELL)
  } else if (fruit) {
    ctx.fillStyle = palette.secondary
    ctx.fillRect(fruit.x * CELL + 8, fruit.y * CELL + 8, CELL - 16, CELL - 16)
  }

  snake.forEach((seg, i) => {
    if (i === 0) {
      ctx!.fillStyle = palette.primary
      ctx!.shadowColor = palette.glow
      ctx!.shadowBlur = 12
    } else {
      ctx!.fillStyle = palette.secondary
      ctx!.shadowColor = palette.secondary
      ctx!.shadowBlur = 6
    }
    ctx!.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
  })
  ctx.shadowBlur = 0

  ctx.strokeStyle = palette.secondary
  ctx.globalAlpha = 0.4
  ctx.lineWidth = 2
  ctx.shadowColor = palette.secondary
  ctx.shadowBlur = 8
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

function tick() {
  if (!running || paused || !canvas || !ctx || !cbs) return

  dir = nextDir
  const head = snake[0]
  let nx = head.x
  let ny = head.y

  if (dir === 'U') ny -= 1
  else if (dir === 'D') ny += 1
  else if (dir === 'L') nx -= 1
  else if (dir === 'R') nx += 1

  const hitWall = nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS
  const hitSelf = snake.some(s => s.x === nx && s.y === ny)

  if (hitWall || hitSelf) {
    running = false
    if (!gameOverFired) {
      gameOverFired = true
      cbs.onLifeLost(0)
      cbs.onGameOver(score)
    }
    return
  }

  const newHead = { x: nx, y: ny }
  const ateFreit = fruit && nx === fruit.x && ny === fruit.y

  if (ateFreit) {
    snake = [newHead, ...snake]
    fruitsEaten++
    score += 10 * level
    cbs.onScoreChange(score)

    const newLevel = Math.floor(fruitsEaten / 5) + 1
    if (newLevel > level) {
      level = newLevel
      cbs.onLevelUp(level)
    }

    spawnFruit()
  } else {
    snake = [newHead, ...snake.slice(0, -1)]
  }

  draw()
  scheduleLoop()
}

function scheduleLoop() {
  if (loopTimeout !== null) clearTimeout(loopTimeout)
  loopTimeout = setTimeout(tick, interval())
}

function initState() {
  snake = [
    { x: 4, y: 10 },
    { x: 3, y: 10 },
    { x: 2, y: 10 },
  ]
  dir = 'R'
  nextDir = 'R'
  fruit = null
  score = 0
  level = 1
  fruitsEaten = 0
  running = true
  paused = false
  gameOverFired = false
}

export const game: SnakeGame = {
  start(c, callbacks) {
    canvas = c
    canvas.width = COLS * CELL
    canvas.height = ROWS * CELL
    ctx = c.getContext('2d')
    cbs = callbacks

    initState()

    keyHandler = (e: KeyboardEvent) => {
      let desired: Dir | null = null
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')    desired = 'U'
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')  desired = 'D'
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')  desired = 'L'
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') desired = 'R'

      if (desired) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault()
        }
        if (desired !== OPPOSITE[dir]) nextDir = desired
      }
    }
    window.addEventListener('keydown', keyHandler)

    img = new Image()
    img.onload = () => {
      imgReady = true
      spawnFruit()
      draw()
      scheduleLoop()
    }
    img.onerror = () => {
      imgReady = false
      spawnFruit()
      draw()
      scheduleLoop()
    }
    img.src = '/snake/fruits.png'
  },

  pause() {
    if (!running || paused) return
    paused = true
    if (loopTimeout !== null) {
      clearTimeout(loopTimeout)
      loopTimeout = null
    }
  },

  resume() {
    if (!running || !paused) return
    paused = false
    scheduleLoop()
  },

  restart() {
    if (loopTimeout !== null) {
      clearTimeout(loopTimeout)
      loopTimeout = null
    }
    initState()
    if (imgReady) {
      spawnFruit()
      draw()
      scheduleLoop()
    } else if (img) {
      img.onload = () => {
        imgReady = true
        spawnFruit()
        draw()
        scheduleLoop()
      }
    }
  },

  destroy() {
    if (loopTimeout !== null) {
      clearTimeout(loopTimeout)
      loopTimeout = null
    }
    if (keyHandler) {
      window.removeEventListener('keydown', keyHandler)
      keyHandler = null
    }
    running = false
    canvas = null
    ctx = null
    cbs = null
    img = null
    imgReady = false
  },
}

export default game
