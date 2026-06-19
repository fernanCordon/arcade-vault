import { getSkinPalette, type SkinPalette } from '../skins'

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

// ── Constants ──────────────────────────────────────────────────────────────────

const COLS = 10
const ROWS = 20
const BLOCK = 30

// Los colores de pieza (I,O,T,S,Z,J,L) provienen ahora de los tokens
// --skin-piece-* vía getSkinPalette().pieces, refrescados en cada render.

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
]

const LINE_SCORES = [0, 100, 300, 500, 800]

// ── Module state ───────────────────────────────────────────────────────────────

let mainCanvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let nextCanvas: HTMLCanvasElement | null = null
let nextCtx: CanvasRenderingContext2D | null = null
let cbs: TetroCallbacks | null = null
let palette: SkinPalette = getSkinPalette()

let board: number[][]
let current: { type: number; shape: number[][]; x: number; y: number }
let next: { type: number; shape: number[][]; x: number; y: number }
let score: number
let lines: number
let level: number
let paused: boolean
let gameOver: boolean
let gameOverFired: boolean
let animId: number
let dropAccum: number
let dropInterval: number
let lastTime: number | null

let keyHandler: ((e: KeyboardEvent) => void) | null = null

// ── Board helpers ──────────────────────────────────────────────────────────────

function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0))
}

function randomPiece() {
  const type = Math.floor(Math.random() * 7) + 1
  const shape = (PIECES[type] as number[][]).map(row => [...row])
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 }
}

function collide(shape: number[][], ox: number, oy: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const nx = ox + c
      const ny = oy + r
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true
      if (ny >= 0 && board[ny][nx]) return true
    }
  }
  return false
}

function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length, cols = shape[0].length
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0))
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c]
  return result
}

function tryRotate() {
  const rotated = rotateCW(current.shape)
  const kicks = [0, -1, 1, -2, 2]
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated
      current.x += kick
      return
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c]
}

function clearLines() {
  let cleared = 0
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1)
      board.unshift(new Array(COLS).fill(0))
      cleared++
      r++
    }
  }
  if (cleared) {
    lines += cleared
    score += (LINE_SCORES[cleared] || 0) * level
    const prevLevel = level
    level = Math.floor(lines / 10) + 1
    dropInterval = Math.max(100, 1000 - (level - 1) * 90)
    cbs?.onScoreChange(score)
    if (level > prevLevel) cbs?.onLevelUp(level)
  }
}

function ghostY(): number {
  let gy = current.y
  while (!collide(current.shape, current.x, gy + 1)) gy++
  return gy
}

function hardDrop() {
  const gy = ghostY()
  score += (gy - current.y) * 2
  current.y = gy
  cbs?.onScoreChange(score)
  lockPiece()
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++
    score += 1
    cbs?.onScoreChange(score)
  } else {
    lockPiece()
  }
}

function lockPiece() {
  merge()
  clearLines()
  spawn()
}

function spawn() {
  current = next
  next = randomPiece()
  if (collide(current.shape, current.x, current.y)) {
    endGame()
    return
  }
  drawNext()
}

// ── Render ─────────────────────────────────────────────────────────────────────

function drawBlock(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  alpha?: number
) {
  if (!colorIndex) return
  const color = palette.pieces[colorIndex] as string
  context.globalAlpha = alpha ?? 1
  context.fillStyle = color
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2)
  context.fillStyle = 'rgba(255,255,255,0.12)'
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4)
  context.globalAlpha = 1
}

function drawGrid() {
  if (!ctx || !mainCanvas) return
  ctx.strokeStyle = palette.grid
  ctx.lineWidth = 0.5
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath()
    ctx.moveTo(c * BLOCK, 0)
    ctx.lineTo(c * BLOCK, ROWS * BLOCK)
    ctx.stroke()
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath()
    ctx.moveTo(0, r * BLOCK)
    ctx.lineTo(COLS * BLOCK, r * BLOCK)
    ctx.stroke()
  }
  // bordes laterales — acento del marco con el color primario del skin
  ctx.save()
  ctx.globalAlpha = 0.25
  ctx.strokeStyle = palette.primary
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0.5, 0)
  ctx.lineTo(0.5, ROWS * BLOCK)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(COLS * BLOCK - 0.5, 0)
  ctx.lineTo(COLS * BLOCK - 0.5, ROWS * BLOCK)
  ctx.stroke()
  ctx.restore()
}

function draw() {
  if (!ctx || !mainCanvas) return
  palette = getSkinPalette()
  ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
  drawGrid()

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK)

  const gy = ghostY()
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2)

  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK)
}

function drawNext() {
  if (!nextCtx || !nextCanvas) return
  const NB = 30
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height)
  const shape = next.shape
  const offX = Math.floor((4 - shape[0].length) / 2)
  const offY = Math.floor((4 - shape.length) / 2)
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB)
}

// ── Game lifecycle ─────────────────────────────────────────────────────────────

function endGame() {
  if (gameOverFired) return
  gameOverFired = true
  gameOver = true
  cancelAnimationFrame(animId)
  cbs?.onLifeLost(0)
  cbs?.onGameOver(score)
}

function initState() {
  board = createBoard()
  score = 0
  lines = 0
  level = 1
  paused = false
  gameOver = false
  gameOverFired = false
  dropInterval = 1000
  dropAccum = 0
  lastTime = null
  next = randomPiece()
  spawn()
}

function loop(ts: number) {
  if (paused || gameOver) return
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05)
  lastTime = ts
  dropAccum += dt * 1000
  if (dropAccum >= dropInterval) {
    dropAccum = 0
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++
    } else {
      lockPiece()
    }
  }
  if (gameOver) return
  draw()
  animId = requestAnimationFrame(loop)
}

// ── Public API ─────────────────────────────────────────────────────────────────

function start(canvas: HTMLCanvasElement, callbacks: TetroCallbacks) {
  canvas.width = COLS * BLOCK
  canvas.height = ROWS * BLOCK
  mainCanvas = canvas
  ctx = canvas.getContext('2d')
  cbs = callbacks

  nextCanvas = document.createElement('canvas')
  nextCanvas.width = 120
  nextCanvas.height = 120
  nextCanvas.style.cssText = 'position:absolute;top:12px;right:12px;border:1px solid rgba(0,245,255,0.2);background:rgba(0,0,0,0.6);z-index:2;'
  nextCtx = nextCanvas.getContext('2d')
  canvas.parentElement?.appendChild(nextCanvas)

  keyHandler = (e: KeyboardEvent) => {
    if (paused || gameOver) return
    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault()
        if (!collide(current.shape, current.x - 1, current.y)) current.x--
        break
      case 'ArrowRight':
        e.preventDefault()
        if (!collide(current.shape, current.x + 1, current.y)) current.x++
        break
      case 'ArrowDown':
        e.preventDefault()
        softDrop()
        break
      case 'ArrowUp':
        e.preventDefault()
        tryRotate()
        break
      case 'Space':
        e.preventDefault()
        hardDrop()
        break
    }
  }
  window.addEventListener('keydown', keyHandler)

  initState()
  animId = requestAnimationFrame(loop)
}

function pause() {
  if (gameOver || paused) return
  paused = true
  cancelAnimationFrame(animId)
}

function resume() {
  if (gameOver || !paused) return
  paused = false
  lastTime = null
  animId = requestAnimationFrame(loop)
}

function restart() {
  cancelAnimationFrame(animId)
  initState()
  animId = requestAnimationFrame(loop)
}

function destroy() {
  cancelAnimationFrame(animId)
  if (keyHandler) {
    window.removeEventListener('keydown', keyHandler)
    keyHandler = null
  }
  if (nextCanvas) {
    nextCanvas.parentElement?.removeChild(nextCanvas)
    nextCanvas = null
    nextCtx = null
  }
  mainCanvas = null
  ctx = null
  cbs = null
}

export const game: TetroGame = { start, pause, resume, restart, destroy }
export default game
