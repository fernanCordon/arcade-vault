import spritesheetUrl from '../../../references/started-games/arkanoid/assets/spritesheet-breakout.png'

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

// ── Levels (ported from levels.js) ────────────────────────────────────────────

interface LevelBlock { col: number; row: number; color: string }
interface Level { speed: number; blocks: LevelBlock[] }

const LEVELS: Level[] = (() => {
  const rowColors1 = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']
  const rowColors2 = ['gray', 'cyan', 'hotpink', 'yellow', 'magenta', 'green']
  const rowColors4 = ['cyan', 'magenta', 'green', 'yellow', 'hotpink', 'red']

  const l1: LevelBlock[] = []
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      l1.push({ col, row, color: rowColors1[row] })

  const l2: LevelBlock[] = []
  const pyStart = [4, 3, 2, 1, 0, 0]
  const pyEnd   = [5, 6, 7, 8, 9, 9]
  for (let row = 0; row < 6; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rowColors2[row] })

  const l3: LevelBlock[] = []
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? 'yellow' : 'magenta' })

  const gaps4 = [
    [2, 5, 8], [0, 4, 7, 9], [1, 3, 6],
    [2, 5, 8, 9], [0, 4, 7], [1, 3, 6, 9],
  ]
  const l4: LevelBlock[] = []
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (!gaps4[row].includes(col))
        l4.push({ col, row, color: rowColors4[row] })

  const l5: LevelBlock[] = []
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5
      const isCross = col === 4 || row === 2
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? 'hotpink' : 'cyan' })
    }

  return [
    { speed: 1.00, blocks: l1 },
    { speed: 1.10, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ]
})()

// ── Sprite data (ported from spritesheet.js) ───────────────────────────────────

interface SpriteFrame { sx: number; sy: number; sw: number; sh: number }

const EXPLOSION_FRAMES: Record<string, SpriteFrame[]> = {
  red:     [{ sx: 256, sy: 176, sw: 32, sh: 16 }, { sx: 288, sy: 176, sw: 32, sh: 16 }, { sx: 320, sy: 176, sw: 32, sh: 16 }, { sx: 352, sy: 176, sw: 32, sh: 16 }],
  cyan:    [{ sx: 256, sy: 192, sw: 32, sh: 16 }, { sx: 288, sy: 192, sw: 32, sh: 16 }, { sx: 320, sy: 192, sw: 32, sh: 16 }, { sx: 352, sy: 192, sw: 32, sh: 16 }],
  green:   [{ sx: 256, sy: 208, sw: 32, sh: 16 }, { sx: 288, sy: 208, sw: 32, sh: 16 }, { sx: 320, sy: 208, sw: 32, sh: 16 }, { sx: 352, sy: 208, sw: 32, sh: 16 }],
  magenta: [{ sx: 256, sy: 224, sw: 32, sh: 16 }, { sx: 288, sy: 224, sw: 32, sh: 16 }, { sx: 320, sy: 224, sw: 32, sh: 16 }, { sx: 352, sy: 224, sw: 32, sh: 16 }],
  yellow:  [{ sx: 256, sy: 240, sw: 32, sh: 16 }, { sx: 288, sy: 240, sw: 32, sh: 16 }, { sx: 320, sy: 240, sw: 32, sh: 16 }, { sx: 352, sy: 240, sw: 32, sh: 16 }],
  hotpink: [{ sx: 256, sy: 256, sw: 32, sh: 16 }, { sx: 288, sy: 256, sw: 32, sh: 16 }, { sx: 320, sy: 256, sw: 32, sh: 16 }, { sx: 352, sy: 256, sw: 32, sh: 16 }],
  gray:    [{ sx: 256, sy: 176, sw: 32, sh: 16 }, { sx: 288, sy: 176, sw: 32, sh: 16 }, { sx: 320, sy: 176, sw: 32, sh: 16 }, { sx: 352, sy: 176, sw: 32, sh: 16 }],
}

const EXPLOSION_DURATION = 150

const SPRITES: Record<string, SpriteFrame> = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball:   { sx: 32, sy:  32, sw:  16, sh: 16 },
}

const BLOCK_SPRITES: Record<string, SpriteFrame> = {
  gray:    { sx: 32, sy: 288, sw: 32, sh: 16 },
  red:     { sx: 32, sy: 176, sw: 32, sh: 16 },
  yellow:  { sx: 32, sy: 240, sw: 32, sh: 16 },
  cyan:    { sx: 32, sy: 192, sw: 32, sh: 16 },
  magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
  hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
  green:   { sx: 32, sy: 208, sw: 32, sh: 16 },
}

// ── Spritesheet loader ─────────────────────────────────────────────────────────

let ssImg: HTMLCanvasElement | null = null
let ssLoaded = false
let ssPromise: Promise<void> | null = null

function loadSpritesheet(): Promise<void> {
  if (ssLoaded) return Promise.resolve()
  if (ssPromise) return ssPromise
  ssPromise = new Promise((resolve, reject) => {
    const rawImg = new Image()
    rawImg.onload = () => {
      const oc = document.createElement('canvas')
      oc.width = rawImg.width
      oc.height = rawImg.height
      const octx = oc.getContext('2d')!
      octx.drawImage(rawImg, 0, 0)
      ssImg = oc
      ssLoaded = true
      resolve()
    }
    rawImg.onerror = () => reject(new Error('Failed to load spritesheet'))
    rawImg.src = spritesheetUrl
  })
  return ssPromise
}

function drawFrame(context: CanvasRenderingContext2D, frame: SpriteFrame, x: number, y: number, w: number, h: number) {
  if (!ssLoaded || !ssImg) return
  context.drawImage(ssImg, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h)
}

function drawSprite(context: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number) {
  if (!ssLoaded || !ssImg) return
  const sp = name.startsWith('block_') ? BLOCK_SPRITES[name.slice(6)] : SPRITES[name]
  if (!sp) return
  context.drawImage(ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h)
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PADDLE_SPEED = 400
const BLOCK_W = 64
const BLOCK_H = 24
const BLOCKS_ORIGIN_X = (800 - 10 * BLOCK_W) / 2
const BLOCKS_ORIGIN_Y = 80
const BASE_BALL_VX = 200
const BASE_BALL_VY = -300

// ── Types ──────────────────────────────────────────────────────────────────────

interface Block { x: number; y: number; w: number; h: number; color: string; alive: boolean }
interface Explosion { x: number; y: number; w: number; h: number; color: string; elapsed: number }

// ── Module state ───────────────────────────────────────────────────────────────

let _canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let cbs: BricksCallbacks | null = null

let paddle = { x: 0, y: 560, w: 81, h: 14 }
let ball   = { x: 0, y: 0, w: 16, h: 16, vx: BASE_BALL_VX, vy: BASE_BALL_VY }
let blocks: Block[] = []
let explosions: Explosion[] = []
let lives = 3
let score = 0
let currentLevel = 1
let gameState: 'playing' | 'gameover' | 'win' = 'playing'
let rafId = 0
let lastTime: number | null = null
let gameOverFired = false
let keys = { ArrowLeft: false, ArrowRight: false }

let handleKeyDown: ((e: KeyboardEvent) => void) | null = null
let handleKeyUp: ((e: KeyboardEvent) => void) | null = null
let handleMouseMove: ((e: MouseEvent) => void) | null = null

// ── Game logic ─────────────────────────────────────────────────────────────────

function initPaddle() {
  if (!_canvas) return
  paddle.x = (_canvas.width - paddle.w) / 2
}

function initBall() {
  const speed = LEVELS[currentLevel - 1].speed
  ball.x = paddle.x + (paddle.w - ball.w) / 2
  ball.y = paddle.y - ball.h
  ball.vx = BASE_BALL_VX * speed
  ball.vy = BASE_BALL_VY * speed
}

function loadLevel(n: number) {
  currentLevel = n
  const lvl = LEVELS[n - 1]
  blocks = lvl.blocks.map(b => ({
    x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
    y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
    w: BLOCK_W,
    h: BLOCK_H,
    color: b.color,
    alive: true,
  }))
  explosions = []
  ball.x = paddle.x + (paddle.w - ball.w) / 2
  ball.y = paddle.y - ball.h
  ball.vx = BASE_BALL_VX * lvl.speed
  ball.vy = BASE_BALL_VY * lvl.speed
}

function collideAABB(block: Block): boolean {
  return (
    ball.x < block.x + block.w &&
    ball.x + ball.w > block.x &&
    ball.y < block.y + block.h &&
    ball.y + ball.h > block.y
  )
}

function fireGameOver() {
  if (gameOverFired) return
  gameOverFired = true
  cancelAnimationFrame(rafId)
  cbs?.onGameOver(score)
}

function update(dt: number) {
  if (!_canvas || gameState !== 'playing') return

  if (keys.ArrowLeft)  paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt)
  if (keys.ArrowRight) paddle.x = Math.min(_canvas.width - paddle.w, paddle.x + PADDLE_SPEED * dt)

  ball.x += ball.vx * dt
  ball.y += ball.vy * dt

  if (ball.x <= 0)                        { ball.x = 0;                      ball.vx =  Math.abs(ball.vx) }
  if (ball.x + ball.w >= _canvas.width)   { ball.x = _canvas.width - ball.w; ball.vx = -Math.abs(ball.vx) }
  if (ball.y <= 0)                        { ball.y = 0;                      ball.vy =  Math.abs(ball.vy) }

  if (
    ball.vy > 0 &&
    ball.x + ball.w > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.h >= paddle.y &&
    ball.y + ball.h <= paddle.y + paddle.h + 8
  ) {
    ball.y = paddle.y - ball.h
    ball.vy = -Math.abs(ball.vy)
  }

  for (const block of blocks) {
    if (!block.alive) continue
    if (collideAABB(block)) {
      block.alive = false
      explosions.push({ x: block.x, y: block.y, w: block.w, h: block.h, color: block.color, elapsed: 0 })
      score += 10
      ball.vy = -ball.vy
      cbs?.onScoreChange(score)
      if (blocks.every(b => !b.alive)) {
        if (currentLevel < 5) {
          loadLevel(currentLevel + 1)
          cbs?.onLevelUp(currentLevel)
        } else {
          gameState = 'win'
          fireGameOver()
        }
      }
      break
    }
  }

  for (const exp of explosions) exp.elapsed += dt * 1000
  explosions = explosions.filter(exp => exp.elapsed < EXPLOSION_DURATION)

  if (ball.y > _canvas.height) {
    lives--
    cbs?.onLifeLost(lives)
    if (lives <= 0) {
      lives = 0
      gameState = 'gameover'
      fireGameOver()
    } else {
      initBall()
    }
  }
}

function drawOverlay(message: string) {
  if (!ctx || !_canvas) return
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, _canvas.width, _canvas.height)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(message, _canvas.width / 2, _canvas.height / 2)
}

function draw() {
  if (!ctx || !_canvas) return

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, _canvas.width, _canvas.height)

  for (const block of blocks)
    if (block.alive) drawSprite(ctx, 'block_' + block.color, block.x, block.y, block.w, block.h)

  for (const exp of explosions) {
    const frameIndex = Math.min(Math.floor(exp.elapsed / EXPLOSION_DURATION * 4), 3)
    const frames = EXPLOSION_FRAMES[exp.color]
    if (frames) drawFrame(ctx, frames[frameIndex], exp.x, exp.y, exp.w, exp.h)
  }

  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h)
  drawSprite(ctx, 'ball',   ball.x,   ball.y,   ball.w,   ball.h)

  if (gameState === 'playing') {
    const ballSize = 16
    const ballSpacing = 4
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('Score: ' + score, 10, 10)
    ctx.textAlign = 'center'
    ctx.fillText('Nivel: ' + currentLevel, _canvas.width / 2, 10)
    for (let i = 0; i < lives; i++) {
      const bx = _canvas.width - 10 - (lives - i) * (ballSize + ballSpacing)
      drawSprite(ctx, 'ball', bx, 10, ballSize, ballSize)
    }
  }

  if (gameState === 'gameover') drawOverlay('GAME OVER')
  if (gameState === 'win')      drawOverlay('¡Completaste el juego!')
}

function loop(timestamp: number) {
  if (lastTime === null) lastTime = timestamp
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05)
  lastTime = timestamp
  update(dt)
  draw()
  if (gameState !== 'gameover' && gameState !== 'win') {
    rafId = requestAnimationFrame(loop)
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

function start(c: HTMLCanvasElement, callbacks: BricksCallbacks) {
  _canvas = c
  _canvas.width = 800
  _canvas.height = 600
  ctx = c.getContext('2d')
  cbs = callbacks

  keys = { ArrowLeft: false, ArrowRight: false }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keys[e.key as 'ArrowLeft' | 'ArrowRight'] = true
      e.preventDefault()
    }
  }
  handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keys[e.key as 'ArrowLeft' | 'ArrowRight'] = false
    }
  }
  handleMouseMove = (e: MouseEvent) => {
    if (!_canvas) return
    const rect = _canvas.getBoundingClientRect()
    const scaleX = _canvas.width / rect.width
    const mouseX = (e.clientX - rect.left) * scaleX
    paddle.x = Math.max(0, Math.min(_canvas.width - paddle.w, mouseX - paddle.w / 2))
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  c.addEventListener('mousemove', handleMouseMove)

  lives = 3
  score = 0
  gameOverFired = false
  gameState = 'playing'
  lastTime = null

  loadSpritesheet().then(() => {
    if (!_canvas) return
    initPaddle()
    loadLevel(1)
    rafId = requestAnimationFrame(loop)
  })
}

function pause() {
  cancelAnimationFrame(rafId)
}

function resume() {
  if (gameState === 'gameover' || gameState === 'win') return
  lastTime = null
  rafId = requestAnimationFrame(loop)
}

function restart() {
  cancelAnimationFrame(rafId)
  lives = 3
  score = 0
  gameOverFired = false
  gameState = 'playing'
  lastTime = null
  initPaddle()
  loadLevel(1)
  rafId = requestAnimationFrame(loop)
}

function destroy() {
  cancelAnimationFrame(rafId)
  if (handleKeyDown) { window.removeEventListener('keydown', handleKeyDown); handleKeyDown = null }
  if (handleKeyUp)   { window.removeEventListener('keyup',   handleKeyUp);   handleKeyUp   = null }
  if (handleMouseMove && _canvas) { _canvas.removeEventListener('mousemove', handleMouseMove); handleMouseMove = null }
  _canvas = null
  ctx = null
  cbs = null
}

export const game: BricksGame = { start, pause, resume, restart, destroy }
export default game
