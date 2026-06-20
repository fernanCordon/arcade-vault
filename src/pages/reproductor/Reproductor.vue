<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { useGamesStore } from '../../stores/games'
import { useAuthStore } from '../../stores/auth'
import { getUser } from '../../data/user'
import { submitScore } from '../../lib/scores'

const gamesStore = useGamesStore()
const authStore = useAuthStore()

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

const gameData = computed(() => gamesStore.byId(route.params.id) ?? gamesStore.games[0])

const user = getUser()
const score = ref(0)
const lives = ref(3)
const level = ref(1)
const paused = ref(false)
const over = ref(false)
const playerName = ref(localStorage.getItem('av_player_name') ?? user?.name ?? 'INVITADO')
const saved = ref(false)
const submitting = ref(false)
const submitError = ref('')

const gameCanvas = ref<HTMLCanvasElement | null>(null)
const hasRealGame = ref(false)
let gameModule: GameModule | null = null
let mockTimer: ReturnType<typeof setInterval> | null = null

type Skin = 'classic' | 'neon' | 'retro'
const SKINS: { id: Skin; label: string }[] = [
  { id: 'classic', label: 'CLASSIC' },
  { id: 'neon',    label: 'NEON' },
  { id: 'retro',   label: 'RETRO' },
]
const activeSkin = ref<Skin>((localStorage.getItem('av_skin') as Skin) ?? 'classic')

function applySkin(skin: Skin) {
  activeSkin.value = skin
  localStorage.setItem('av_skin', skin)
  if (skin === 'classic') {
    delete document.documentElement.dataset.skin
  } else {
    document.documentElement.dataset.skin = skin
  }
}

watch(activeSkin, () => {}, { immediate: false })  // keep reactivity

onMounted(async () => {
  applySkin(activeSkin.value)
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

async function saveScore() {
  const name = playerName.value.trim().toUpperCase()
  if (!name || submitting.value || saved.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await submitScore(route.params.id as string, name, score.value)
    localStorage.setItem('av_player_name', name)
    saved.value = true
  } catch {
    submitError.value = 'Error al guardar. Inténtalo de nuevo.'
  } finally {
    submitting.value = false
  }
}

function restart() {
  score.value = 0
  lives.value = 3
  level.value = 1
  paused.value = false
  over.value = false
  saved.value = false
  submitting.value = false
  submitError.value = ''
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
          <div class="skin-picker">
            <span class="skin-label">SKIN</span>
            <button
              v-for="s in SKINS"
              :key="s.id"
              class="skin-btn"
              :class="{ active: activeSkin === s.id }"
              @click="applySkin(s.id)"
            >{{ s.label }}</button>
          </div>
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
            style="height:100%;width:auto;max-width:100%;display:block;margin:0 auto;"
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

        <template v-if="authStore.isLoggedIn">
          <div v-if="!saved" class="input-row">
            <input
              v-model="playerName"
              type="text"
              placeholder="TUS INICIALES"
              maxlength="10"
              :disabled="submitting"
              @input="playerName = (playerName as string).toUpperCase().slice(0, 10)"
            />
            <button
              class="btn yellow"
              :disabled="submitting"
              @click="saveScore"
            >{{ submitting ? 'GUARDANDO…' : 'GUARDAR PUNTUACIÓN' }}</button>
          </div>
          <div v-if="submitError" class="mono" style="color:var(--magenta);font-size:11px;margin-top:6px;">{{ submitError }}</div>
          <div v-if="saved" class="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
        </template>
        <template v-else>
          <div class="mono" style="color:var(--ink-dim);font-size:11px;margin:12px 0 6px;text-align:center;">
            Inicia sesión para guardar tu puntuación
          </div>
          <button class="btn ghost" style="width:100%;" @click="router.push('/auth')">INICIAR SESIÓN</button>
        </template>

        <div class="actions">
          <button class="btn" @click="restart">JUGAR DE NUEVO</button>
          <button class="btn magenta" @click="router.push('/')">VOLVER AL VAULT</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
