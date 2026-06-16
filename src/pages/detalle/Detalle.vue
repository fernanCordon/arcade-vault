<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { GAMES } from '../../data/games'
import { getScores, type ScoreEntry } from '../../lib/scores'

const route = useRoute()
const router = useRouter()

const game = computed(() => GAMES.find(g => g.id === route.params.id) ?? GAMES[0])

const leaderboard = ref<ScoreEntry[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    leaderboard.value = await getScores(route.params.id as string)
  } finally {
    loading.value = false
  }
})

function lbClass(i: number) {
  if (i === 0) return 'lb-row top1'
  if (i === 1) return 'lb-row top2'
  if (i === 2) return 'lb-row top3'
  return 'lb-row'
}
</script>

<template>
  <Nav />

  <main class="av-main">
    <div class="av-detail fade-in">
      <div>
        <div class="detail-cover">
          <div :class="[game.cover, 'cover-bg']"></div>
        </div>
        <div class="detail-info" style="margin-top:20px;">
          <div class="detail-tags">
            <span>{{ game.cat }}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 class="neon-cyan">{{ game.title }}</h2>
          <p>{{ game.long }}</p>
          <div class="stat-strip">
            <div>
              <div class="l">Partidas</div>
              <div class="v">{{ game.plays }}</div>
            </div>
            <div>
              <div class="l">Mejor global</div>
              <div class="v" style="color:var(--magenta);text-shadow:0 0 6px rgba(255,0,110,0.5);">
                {{ game.best.toLocaleString('es-ES') }}
              </div>
            </div>
            <div>
              <div class="l">Dificultad</div>
              <div class="v" style="color:var(--yellow);text-shadow:0 0 6px rgba(245,255,0,0.5);">★ ★ ★ ☆ ☆</div>
            </div>
          </div>
          <div class="detail-actions">
            <button class="btn xl pulse" @click="router.push(`/games/${game.id}/play`)">▶&nbsp; JUGAR AHORA</button>
            <button class="btn ghost lg" @click="router.push('/')">VOLVER AL VAULT</button>
          </div>
        </div>
      </div>

      <aside>
        <div class="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          <div v-if="loading" class="mono" style="color:var(--ink-dim);font-size:11px;padding:16px 0;">Cargando…</div>
          <template v-else-if="leaderboard.length">
            <div
              v-for="(row, i) in leaderboard"
              :key="row.id"
              :class="lbClass(i)"
            >
              <div class="rk">#{{ String(i + 1).padStart(2, '0') }}</div>
              <div class="pl">{{ row.player_name }}</div>
              <div class="sc">{{ row.score.toLocaleString('es-ES') }}</div>
            </div>
          </template>
          <div v-else class="mono" style="color:var(--ink-dim);font-size:11px;padding:16px 0;line-height:1.6;">
            Sé el primero en entrar al salón de la fama
          </div>
        </div>
      </aside>
    </div>
  </main>
</template>
