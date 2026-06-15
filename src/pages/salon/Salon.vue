<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { GAMES } from '../../data/games'
import { getUser } from '../../data/user'

const router = useRouter()
const activeId = ref(GAMES[0].id)
const activeGame = computed(() => GAMES.find(g => g.id === activeId.value)!)
const user = getUser()

const PLAYERS = ['PX_KAI','NEONFOX','Z3R0COOL','M00NRYU','VAULT_07','GLITCHA','ATARI_KID','CYBER_LU','MAGENTA88','SCANLINE','BIT_LORD','ARKADYA','DROID_X','RGB_QUEEN','PIXEL_DAD','RETROVIRA','VECTORX','JOY_STK']

function seededScores(seed: number, count = 12) {
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

const scores = computed(() => seededScores(activeId.value.length * 23 + 7, 12))
const podium = computed(() => scores.value.slice(0, 3))

const youRank = computed(() => user ? Math.floor(8 + (activeId.value.length % 4)) : null)
const youScore = computed(() => user ? (scores.value[5]?.score ?? 9999) - 2400 : null)

function rowClass(i: number) {
  if (i === 0) return 'tr top1'
  if (i === 1) return 'tr top2'
  if (i === 2) return 'tr top3'
  return 'tr'
}
</script>

<template>
  <Nav />

  <main class="av-main">
    <div class="av-hall fade-in">
      <div class="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p class="pixel" style="font-size:10px;">LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div class="hall-tabs">
        <button
          v-for="game in GAMES"
          :key="game.id"
          :class="['chip', { active: activeId === game.id }]"
          @click="activeId = game.id"
        >{{ game.title }}</button>
      </div>

      <div class="podium">
        <div class="podium-slot silver">
          <div class="rank-num">02</div>
          <div class="name">{{ podium[1]?.name }}</div>
          <div class="score">{{ podium[1]?.score.toLocaleString('es-ES') }}</div>
          <div class="date">{{ podium[1]?.date }}</div>
        </div>
        <div class="podium-slot gold">
          <div class="pixel" style="font-size:9px;color:var(--gold);letter-spacing:0.18em;">CAMPEÓN</div>
          <div class="rank-num" style="font-size:36px;margin-top:4px;">01</div>
          <div class="name">{{ podium[0]?.name }}</div>
          <div class="score" style="font-size:20px;">{{ podium[0]?.score.toLocaleString('es-ES') }}</div>
          <div class="date">{{ podium[0]?.date }}</div>
        </div>
        <div class="podium-slot bronze">
          <div class="rank-num">03</div>
          <div class="name">{{ podium[2]?.name }}</div>
          <div class="score">{{ podium[2]?.score.toLocaleString('es-ES') }}</div>
          <div class="date">{{ podium[2]?.date }}</div>
        </div>
      </div>

      <div class="hall-table">
        <div class="th">
          <div>RANGO</div><div>JUGADOR</div><div>PUNTUACIÓN</div><div>FECHA</div>
        </div>
        <div
          v-for="(row, i) in scores"
          :key="row.name + i"
          :class="rowClass(i)"
          :style="{ animationDelay: `${i * 50}ms` }"
        >
          <div class="rk">#{{ String(row.rank).padStart(2, '0') }}</div>
          <div class="pl">{{ row.name }}</div>
          <div class="sc">{{ row.score.toLocaleString('es-ES') }}</div>
          <div class="dt">{{ row.date }}</div>
        </div>

        <template v-if="user">
          <div class="tr you-label">▸ TU MEJOR MARCA EN {{ activeGame.title }}</div>
          <div
            class="tr you"
            :style="{ animationDelay: `${scores.length * 50 + 50}ms` }"
          >
            <div class="rk" style="color:var(--yellow);">#{{ String(youRank).padStart(2, '0') }}</div>
            <div class="pl" style="color:var(--yellow);">{{ user.name }}</div>
            <div class="sc" style="color:var(--yellow);text-shadow:0 0 6px rgba(245,255,0,0.5);">{{ (youScore ?? 9999).toLocaleString('es-ES') }}</div>
            <div class="dt">11/05/2026</div>
          </div>
        </template>
      </div>

      <div style="text-align:center;margin-top:32px;">
        <button class="btn lg" @click="router.push('/')">VOLVER A LA BIBLIOTECA</button>
      </div>
    </div>
  </main>
</template>
