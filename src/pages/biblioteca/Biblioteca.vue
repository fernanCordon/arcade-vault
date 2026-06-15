<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { GAMES, CATS } from '../../data/games'

const router = useRouter()
const search = ref('')
const activecat = ref('TODOS')

const filtered = computed(() => {
  return GAMES.filter(g => {
    const matchCat = activecat.value === 'TODOS' || g.cat === activecat.value
    const matchSearch = g.title.toLowerCase().includes(search.value.toLowerCase())
    return matchCat && matchSearch
  })
})

function goDetail(id: string) {
  router.push(`/juego/${id}`)
}
</script>

<template>
  <Nav />

  <main class="av-main">
    <div class="fade-in">
    <section class="av-hero">
      <h1 class="flicker">ARCADE VAULT</h1>
      <p class="sub">INSERTA UNA MONEDA PARA JUGAR <span class="blink">_</span></p>
    </section>

    <div class="av-filters">
      <div class="av-search">
        <span class="ico">⌕</span>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar juego..."
        />
      </div>
      <div class="av-chips">
        <button
          v-for="cat in CATS"
          :key="cat"
          :class="['chip', { active: activecat === cat }]"
          @click="activecat = cat"
        >{{ cat }}</button>
      </div>
    </div>

    <div class="av-grid">
      <div
        v-if="filtered.length === 0"
        style="grid-column:1 / -1;text-align:center;padding:80px;color:var(--ink-faint);"
      >
        <div class="pixel neon-magenta" style="font-size:14px;margin-bottom:12px;">NO HAY RESULTADOS</div>
        <div>Intenta otra búsqueda o categoría.</div>
      </div>
      <div
        v-for="game in filtered"
        :key="game.id"
        class="card"
        @click="goDetail(game.id)"
      >
        <div class="cover">
          <div :class="[game.cover, 'cover-bg']"></div>
          <span class="label">{{ game.cat }}</span>
        </div>
        <div class="meta">
          <div :class="['title', `neon-${game.color}`]">{{ game.title }}</div>
          <div class="desc">{{ game.short }}</div>
          <div class="row">
            <div class="score-badge">
              <span>MEJOR PUNTUACIÓN</span>
              <b>{{ game.best.toLocaleString() }}</b>
            </div>
            <button
              :class="['btn', game.color === 'magenta' ? 'magenta' : game.color === 'yellow' ? 'yellow' : '']"
              @click.stop="router.push(`/jugar/${game.id}`)"
            >JUGAR</button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </main>
</template>
