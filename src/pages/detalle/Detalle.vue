<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { GAMES } from '../../data/games'

const route = useRoute()
const router = useRouter()

const game = computed(() => GAMES.find(g => g.id === route.params.id) ?? GAMES[0])

const PLAYERS = ['PX_KAI','NEONFOX','Z3R0COOL','M00NRYU','VAULT_07','GLITCHA','ATARI_KID','CYBER_LU','MAGENTA88','SCANLINE','BIT_LORD','ARKADYA','DROID_X','RGB_QUEEN','PIXEL_DAD','RETROVIRA','VECTORX','JOY_STK']

function seededScores(seed: number, count = 10) {
  let s = seed
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280
  const used = new Set<string>()
  const rows: { rank: number; name: string; score: number; date: string }[] = []
  for (let i = 0; i < count; i++) {
    let name: string
    do { name = PLAYERS[Math.floor(rand() * PLAYERS.length)] } while (used.has(name) && used.size < PLAYERS.length)
    used.add(name)
    const base = Math.floor(50000 + rand() * 250000)
    const score = base - i * Math.floor(2000 + rand() * 4000)
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, '0')
    const mon = String(1 + Math.floor(rand() * 12)).padStart(2, '0')
    rows.push({ rank: i + 1, name, score: Math.max(score, 1000), date: `${day}/${mon}/2026` })
  }
  return rows.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }))
}

const scores = computed(() => seededScores((route.params.id as string).length * 17 + 3, 10))

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
          <div
            v-for="(row, i) in scores"
            :key="row.name"
            :class="lbClass(i)"
          >
            <div class="rk">#{{ String(row.rank).padStart(2, '0') }}</div>
            <div class="pl">
              {{ row.name }}
              <div style="font-size:10px;color:var(--ink-faint);letter-spacing:0.1em;">{{ row.date }}</div>
            </div>
            <div class="sc">{{ row.score.toLocaleString('es-ES') }}</div>
          </div>
        </div>
      </aside>
    </div>
  </main>
</template>
