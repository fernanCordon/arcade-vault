<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGamesStore } from '../../stores/games'
import FloatingSilhouettes from '../../components/FloatingSilhouettes.vue'
import Nav from '../../components/Nav.vue'

const gamesStore = useGamesStore()

const router = useRouter()

const RECENT_SCORES = [
  { player: 'NEONFOX',  game: 'Caída',      score: 184220, time: 'hace 2 min',  color: 'magenta' },
  { player: 'PX_KAI',   game: 'Glotón',     score: 96400,  time: 'hace 5 min',  color: 'yellow' },
  { player: 'Z3R0COOL', game: 'Invasores',  score: 54190,  time: 'hace 8 min',  color: 'green' },
  { player: 'VAULT_07', game: 'Rocas',      score: 41200,  time: 'hace 12 min', color: 'cyan' },
  { player: 'GLITCHA',  game: 'Buster',     score: 28450,  time: 'hace 18 min', color: 'cyan' },
  { player: 'ARKADYA',  game: 'Serpentina', score: 7820,   time: 'hace 24 min', color: 'green' },
  { player: 'CYBER_LU', game: 'Ranaria',    score: 18900,  time: 'hace 31 min', color: 'yellow' },
]

const TOP_PLAYERS = [
  { rank: 1, player: 'NEONFOX',  score: 312840 },
  { rank: 2, player: 'PX_KAI',   score: 248110 },
  { rank: 3, player: 'M00NRYU',  score: 196720 },
  { rank: 4, player: 'VAULT_07', score: 154300 },
  { rank: 5, player: 'GLITCHA',  score: 138900 },
]

const FEATURES = [
  { icon: 'GAMEPAD', title: 'JUEGOS CLÁSICOS',  desc: 'Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.',    color: 'cyan' },
  { icon: 'FREE',    title: '100% GRATIS',       desc: 'Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.',               color: 'yellow' },
  { icon: 'TROPHY',  title: 'LADDER BOARDS',     desc: 'Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.',            color: 'magenta' },
  { icon: 'ROCKET',  title: 'SIEMPRE CRECIENDO', desc: 'Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.',         color: 'green' },
]

const STATS = [
  { n: '12+',    u: 'JUEGOS',      s: 'Y CONTANDO' },
  { n: 'MILES',  u: 'DE PARTIDAS', s: 'JUGADAS CADA DÍA' },
  { n: 'GLOBAL', u: 'RANKING',     s: 'COMPITE CON EL MUNDO' },
]

function topClass(index: number) {
  if (index === 0) return 'top-row top1'
  if (index === 1) return 'top-row top2'
  if (index === 2) return 'top-row top3'
  return 'top-row'
}

onMounted(() => {
  const els = document.querySelectorAll('.reveal')
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    })
  }, { threshold: 0.12 })
  els.forEach(el => io.observe(el))
})
</script>

<template>
  <Nav />
  <div class="home fade-in">

    <!-- ① Hero -->
    <section class="home-hero">
      <FloatingSilhouettes />
      <div class="home-hero-inner">
        <div class="hero-eyebrow pixel neon-yellow">▸ INSERTA UNA MONEDA<span style="animation:blink 1.2s steps(1,end) infinite;display:inline-block">_</span></div>
        <h1 class="home-title">
          <span class="line-1">EL ARCADE</span>
          <span class="line-2">CLÁSICO ESTÁ</span>
          <span class="line-3">DE VUELTA</span>
        </h1>
        <p class="home-sub">
          Juega los mejores clásicos directamente en tu navegador.<br>
          Sin descargas. Sin costo. Solo diversión.
        </p>
        <div class="home-ctas">
          <button class="btn xl pulse" @click="router.push('/games')">▶&nbsp; EXPLORAR JUEGOS</button>
          <button class="btn xl magenta" @click="router.push('/auth')">✦&nbsp; CREAR CUENTA</button>
        </div>
      </div>
      <div class="hero-scroll" aria-hidden="true">
        <span>DESLIZA</span>
        <span class="arrow">▼</span>
      </div>
    </section>

    <!-- ② ¿Por qué Arcade Vault? -->
    <section class="home-section reveal">
      <div class="section-head">
        <div class="kicker pixel neon-magenta">// 01</div>
        <h2 class="section-title">¿POR QUÉ ARCADE VAULT?</h2>
        <div class="section-rule"></div>
      </div>
      <div class="feature-grid">
        <div
          v-for="(f, i) in FEATURES"
          :key="f.icon"
          :class="['feature-card', f.color]"
          :style="{ transitionDelay: (i * 80) + 'ms' }"
        >
          <!-- Gamepad icon -->
          <svg v-if="f.icon === 'GAMEPAD'" class="ft-icon" viewBox="0 0 16 16"><g fill="currentColor">
            <rect x="2" y="6" width="12" height="6"/>
            <rect x="0" y="8" width="2" height="4"/><rect x="14" y="8" width="2" height="4"/>
            <rect x="3" y="8" width="2" height="2"/>
            <rect x="11" y="7" width="1.5" height="1.5"/><rect x="11" y="10" width="1.5" height="1.5"/>
          </g></svg>
          <!-- Free / money icon -->
          <svg v-else-if="f.icon === 'FREE'" class="ft-icon" viewBox="0 0 16 16"><g fill="currentColor">
            <rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <rect x="5" y="6" width="1.5" height="4"/><rect x="5" y="6" width="4" height="1.5"/><rect x="5" y="8" width="3" height="1"/>
            <rect x="10" y="6" width="1.5" height="4"/>
          </g></svg>
          <!-- Trophy icon -->
          <svg v-else-if="f.icon === 'TROPHY'" class="ft-icon" viewBox="0 0 16 16"><g fill="currentColor">
            <rect x="3" y="2" width="10" height="2"/>
            <rect x="3" y="2" width="2" height="6"/><rect x="11" y="2" width="2" height="6"/>
            <rect x="5" y="8" width="6" height="2"/>
            <rect x="7" y="10" width="2" height="3"/>
            <rect x="5" y="13" width="6" height="1.5"/>
            <rect x="1" y="3" width="2" height="3"/><rect x="13" y="3" width="2" height="3"/>
          </g></svg>
          <!-- Rocket icon -->
          <svg v-else-if="f.icon === 'ROCKET'" class="ft-icon" viewBox="0 0 16 16"><g fill="currentColor">
            <rect x="7" y="1" width="2" height="2"/>
            <rect x="6" y="3" width="4" height="2"/>
            <rect x="5" y="5" width="6" height="6"/>
            <rect x="4" y="11" width="2" height="2"/><rect x="10" y="11" width="2" height="2"/>
            <rect x="7" y="6" width="2" height="2" fill="#0a0a0f"/>
          </g></svg>
          <div class="ft-title pixel">{{ f.title }}</div>
          <div class="ft-desc">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <!-- ③ Juegos disponibles ahora -->
    <section class="home-section reveal">
      <div class="section-head">
        <div class="kicker pixel neon-cyan">// 02</div>
        <h2 class="section-title">JUEGOS DISPONIBLES AHORA</h2>
        <div class="section-rule"></div>
      </div>
      <div class="mini-rail">
        <div
          v-for="game in gamesStore.games.slice(0, 6)"
          :key="game.id"
          class="mini-card"
          @click="router.push('/juego/' + game.id)"
        >
          <div class="mini-cover">
            <div :class="['cover-bg', game.cover]"></div>
          </div>
          <div class="mini-meta">
            <div class="mini-title">{{ game.title }}</div>
            <div class="mini-cat">{{ game.cat }}</div>
          </div>
        </div>
      </div>
      <div style="text-align:center;margin-top:24px">
        <button class="btn lg" @click="router.push('/games')">VER TODOS LOS JUEGOS →</button>
      </div>
    </section>

    <!-- ④ Estadísticas -->
    <section class="home-stats reveal">
      <div class="stats-inner">
        <div
          v-for="(st, i) in STATS"
          :key="st.n"
          class="stat-block"
          :style="{ transitionDelay: (i * 90) + 'ms' }"
        >
          <div class="stat-n neon-yellow">{{ st.n }}</div>
          <div class="stat-u pixel">{{ st.u }}</div>
          <div class="stat-s">{{ st.s }}</div>
        </div>
      </div>
    </section>

    <!-- ⑤ Actividad en vivo -->
    <section class="home-section reveal">
      <div class="section-head">
        <div class="kicker pixel neon-yellow">// 03</div>
        <h2 class="section-title">ACTIVIDAD EN VIVO</h2>
        <div class="section-rule"></div>
      </div>
      <div class="activity-grid">
        <div class="activity-card">
          <div class="ac-head">
            <div class="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
          </div>
          <div class="ticker">
            <div
              v-for="(r, i) in RECENT_SCORES"
              :key="r.player"
              class="tick-row"
              :style="{ animationDelay: (i * 60) + 'ms' }"
            >
              <span :class="['tk-p', 'neon-' + r.color]">{{ r.player }}</span>
              <span class="tk-mid">▸ {{ r.game }}</span>
              <span class="tk-s">+{{ r.score.toLocaleString('es-ES') }}</span>
              <span class="tk-t">{{ r.time }}</span>
            </div>
          </div>
        </div>

        <div class="activity-card">
          <div class="ac-head">
            <div class="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
            <button class="lb-link" @click="router.push('/salon')">VER SALÓN →</button>
          </div>
          <div class="top-list">
            <div
              v-for="(p, i) in TOP_PLAYERS"
              :key="p.player"
              :class="topClass(i)"
            >
              <span class="tp-rk">#{{ String(p.rank).padStart(2, '0') }}</span>
              <span class="tp-p">{{ p.player }}</span>
              <span class="tp-s">{{ p.score.toLocaleString('es-ES') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ⑥ Pricing -->
    <section class="home-section reveal">
      <div class="section-head">
        <div class="kicker pixel neon-green">// 04</div>
        <h2 class="section-title">PRECIOS</h2>
        <div class="section-rule"></div>
      </div>
      <div class="pricing-grid">
        <div class="price-card">
          <div class="pc-label pixel">PLAN ÚNICO</div>
          <div class="pc-name pixel">JUGADOR VAULT</div>
          <div class="pc-amount">
            <span class="pc-amount-n">$0</span>
            <span class="pc-amount-u">/ SIEMPRE</span>
          </div>
          <div class="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
          <ul class="pc-list">
            <li>✔ Acceso a todos los juegos</li>
            <li>✔ Ranking global y salón de la fama</li>
            <li>✔ Sin anuncios entre partidas</li>
            <li>✔ Guarda tus puntuaciones</li>
            <li>✔ Nuevos juegos cada mes</li>
            <li>✔ Funciona en cualquier navegador</li>
          </ul>
          <button class="btn xl pulse" style="width:100%" @click="router.push('/auth')">EMPEZAR GRATIS →</button>
          <div class="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
          <div class="pc-stamp pixel">FREE<br>PLAY</div>
        </div>

        <div class="pricing-faq">
          <div class="faq-item">
            <div class="faq-q pixel">¿REALMENTE ES GRATIS?</div>
            <div class="faq-a">Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.</div>
          </div>
          <div class="faq-item">
            <div class="faq-q pixel">¿NECESITO CREAR CUENTA?</div>
            <div class="faq-a">No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.</div>
          </div>
          <div class="faq-item">
            <div class="faq-q pixel">¿CÓMO SOBREVIVEN SIN COBRAR?</div>
            <div class="faq-a">Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="home-final reveal">
      <h2 class="final-title pixel">¿LISTO PARA JUGAR?</h2>
      <button class="btn xl pulse final-cta" @click="router.push('/games')">INSERTAR MONEDA →</button>
      <div class="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
    </section>

  </div>
</template>
