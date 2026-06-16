<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { GAMES } from '../../data/games'
import { saveUser, getUser } from '../../data/user'

interface GameCallbacks {
  onScoreChange: (score: number) => void
  onLifeLost: (lives: number) => void
  onLevelUp: (level: number) => void
  onGameOver: (finalScore: number) => void
}

interface GameModule {
  start: (canvas: HTMLCanvasElement, callbacks: GameCallbacks) => void
  pause: () => void
  resume: () => void
  restart: () => void
  destroy: () => void
}

const route = useRoute()
const router = useRouter()

const gameData = computed(() => GAMES.find(g => g.id === route.params.id) ?? GAMES[0])

const user = getUser()
const score = ref(0)
const lives = ref(3)
const level = ref(1)
const paused = ref(false)
const over = ref(false)
const playerName = ref(user?.name ?? 'INVITADO')
const saved = ref(false)

const gameCanvas = ref<HTMLCanvasElement | null>(null)
const hasRealGame = ref(false)
let gameModule: GameModule | null = null
let mockTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  const id = route.params.id as string
  try {
    const mod = await import(`../../games/${id}/game.ts`)
    gameModule = (mod.default ?? mod.game) as GameModule
    hasRealGame.value = true

    gameModule.start(gameCanvas.value!, {
      onScoreChange: (s) => { score.value = s },
      onLifeLost: (l) => { lives.value = l },
      onLevelUp: (l) => { level.value = l },
      onGameOver: (finalScore) => {
        score.value = finalScore
        over.value = true
      },
    })
  } catch {
    hasRealGame.value = false
    mockTimer = setInterval(() => {
      if (!over.value && !paused.value) {
        score.value += Math.floor(10 + Math.random() * 90)
        if (score.value > 0 && score.value % 2500 < 100) level.value++
      }
    }, 220)
  }
})

onUnmounted(() => {
  gameModule?.destroy()
  if (mockTimer) clearInterval(mockTimer)
})

function togglePause() {
  if (paused.value) {
    gameModule?.resume()
    paused.value = false
  } else {
    gameModule?.pause()
    paused.value = true
  }
}

function end() {
  gameModule?.pause()
  over.value = true
}

function saveScore() {
  if (playerName.value.trim()) {
    saveUser({ name: playerName.value.trim().toUpperCase() })
    saved.value = true
  }
}

function restart() {
  score.value = 0
  lives.value = 3
  level.value = 1
  paused.value = false
  over.value = false
  saved.value = false
  gameModule?.restart()
}

function exit() {
  router.push(`/juego/${gameData.value.id}`)
}
</script>

<template>
  <Nav />

  <main class="av-main">
    <div class="av-player fade-in">
      <div class="player-hud">
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          <div class="hud-stat">
            <div class="l">Jugador</div>
            <div class="v" style="color:var(--ink);">{{ playerName }}</div>
          </div>
          <div class="hud-stat">
            <div class="l">Puntuación</div>
            <div class="v">{{ score.toLocaleString('es-ES') }}</div>
          </div>
          <div class="hud-stat lives">
            <div class="l">Vidas</div>
            <div class="v">{{ '♥ '.repeat(lives).trim() || '—' }}</div>
          </div>
          <div class="hud-stat level">
            <div class="l">Nivel</div>
            <div class="v">{{ String(level).padStart(2, '0') }}</div>
          </div>
        </div>
        <div class="hud-actions">
          <button class="btn yellow" @click="togglePause">{{ paused ? 'REANUDAR' : 'PAUSA' }}</button>
          <button class="btn magenta" @click="end">FIN</button>
          <button class="btn ghost" @click="exit">SALIR</button>
        </div>
      </div>

      <div class="crt">
        <div class="crt-screen">
          <div v-show="!hasRealGame" class="game-arena">
            <div class="grid-floor"></div>
            <div class="enemy e1"></div>
            <div class="enemy e2"></div>
            <div class="enemy e3"></div>
            <div class="player-ship"></div>
          </div>
          <canvas
            ref="gameCanvas"
            v-show="hasRealGame"
            style="max-width:100%;height:auto;display:block;"
          />
          <div v-if="paused" class="crt-content" style="background:rgba(0,0,0,0.6);z-index:5;">
            <div>
              <div class="pixel neon-yellow" style="font-size:22px;">EN PAUSA</div>
              <div class="mono" style="font-size:11px;color:var(--ink-dim);margin-top:10px;letter-spacing:0.16em;">PULSA REANUDAR PARA CONTINUAR</div>
            </div>
          </div>
        </div>
        <div class="crt-bottom">
          <span class="led">SEÑAL OK</span>
          <span>{{ gameData.title }} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
    </div>
  </main>

  <Teleport to="body">
    <div v-if="over" class="modal-bd">
      <div class="modal">
        <h2>FIN DEL JUEGO</h2>
        <div class="final-label">PUNTUACIÓN FINAL</div>
        <div class="final">{{ score.toLocaleString('es-ES') }}</div>

        <div v-if="!saved" class="input-row">
          <input
            v-model="playerName"
            type="text"
            placeholder="TUS INICIALES"
            maxlength="10"
            @input="playerName = (playerName as string).toUpperCase().slice(0, 10)"
          />
          <button class="btn yellow" @click="saveScore">GUARDAR PUNTUACIÓN</button>
        </div>
        <div v-else class="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>

        <div class="actions">
          <button class="btn" @click="restart">JUGAR DE NUEVO</button>
          <button class="btn magenta" @click="router.push('/')">VOLVER AL VAULT</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
