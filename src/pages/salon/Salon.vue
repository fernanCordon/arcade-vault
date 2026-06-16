<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { getScores, type ScoreEntry } from '../../lib/scores'

const router = useRouter()

const allScores = ref<ScoreEntry[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    allScores.value = await getScores()
  } finally {
    loading.value = false
  }
})

const podium = computed(() => allScores.value.slice(0, 3))
</script>

<template>
  <Nav />

  <main class="av-main">
    <div class="av-hall fade-in">
      <div class="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p class="pixel" style="font-size:10px;">LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div v-if="loading" class="mono" style="color:var(--ink-dim);font-size:12px;text-align:center;padding:48px 0;">Cargando…</div>

      <template v-else-if="allScores.length">
        <div class="podium">
          <div class="podium-slot silver">
            <div class="rank-num">02</div>
            <div class="name">{{ podium[1]?.player_name }}</div>
            <div class="score">{{ podium[1]?.score.toLocaleString('es-ES') }}</div>
            <div class="date">{{ podium[1]?.game_id }}</div>
          </div>
          <div class="podium-slot gold">
            <div class="pixel" style="font-size:9px;color:var(--gold);letter-spacing:0.18em;">CAMPEÓN</div>
            <div class="rank-num" style="font-size:36px;margin-top:4px;">01</div>
            <div class="name">{{ podium[0]?.player_name }}</div>
            <div class="score" style="font-size:20px;">{{ podium[0]?.score.toLocaleString('es-ES') }}</div>
            <div class="date">{{ podium[0]?.game_id }}</div>
          </div>
          <div class="podium-slot bronze">
            <div class="rank-num">03</div>
            <div class="name">{{ podium[2]?.player_name }}</div>
            <div class="score">{{ podium[2]?.score.toLocaleString('es-ES') }}</div>
            <div class="date">{{ podium[2]?.game_id }}</div>
          </div>
        </div>

        <div class="hall-table">
          <div class="th">
            <div>RANGO</div><div>JUGADOR</div><div>JUEGO</div><div>PUNTUACIÓN</div>
          </div>
          <div
            v-for="(row, i) in allScores"
            :key="row.id"
            class="tr"
            :style="{ animationDelay: `${i * 50}ms` }"
          >
            <div class="rk">#{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="pl">{{ row.player_name }}</div>
            <div class="dt">{{ row.game_id }}</div>
            <div class="sc">{{ row.score.toLocaleString('es-ES') }}</div>
          </div>
        </div>
      </template>

      <div v-else class="mono" style="color:var(--ink-dim);font-size:12px;text-align:center;padding:48px 0;line-height:1.8;">
        Sé el primero en entrar al salón de la fama
      </div>

      <div style="text-align:center;margin-top:32px;">
        <button class="btn lg" @click="router.push('/')">VOLVER A LA BIBLIOTECA</button>
      </div>
    </div>
  </main>
</template>
