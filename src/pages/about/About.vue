<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Nav from '../../components/Nav.vue'

const HIGHLIGHTS = [
  { icon: 'HEART',   text: 'HECHO CON ❤️ PARA JUGADORES',                    color: 'magenta' },
  { icon: 'BROWSER', text: 'JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR', color: 'cyan' },
  { icon: 'PLANT',   text: 'PROYECTO EN CONSTANTE CRECIMIENTO',              color: 'green' },
]

const form = ref({ name: '', email: '', msg: '' })
const sent = ref<string | null>(null)
const shake = ref(false)

function onSubmit() {
  if (!form.value.name.trim() || !form.value.email.trim() || !form.value.msg.trim()) {
    shake.value = true
    setTimeout(() => { shake.value = false }, 400)
    return
  }
  sent.value = form.value.name.trim()
}

function resetForm() {
  sent.value = null
  form.value = { name: '', email: '', msg: '' }
}

onMounted(() => {
  const els = document.querySelectorAll('.reveal')
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    })
  }, { threshold: 0.12 })
  els.forEach(el => io.observe(el))
})
</script>

<template>
  <Nav />
  <div class="about fade-in">
    <section class="about-hero">
      <div class="kicker pixel neon-yellow">▸ ACERCA DE</div>
      <h1 class="about-title">ACERCA DE ARCADE VAULT</h1>
      <p class="about-mission">
        ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar
        los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar
        y sin costo.
      </p>

      <div class="highlight-row">
        <div
          v-for="(h, i) in HIGHLIGHTS"
          :key="h.icon"
          :class="['highlight', h.color]"
          :style="{ transitionDelay: (i * 80) + 'ms' }"
        >
          <svg v-if="h.icon === 'HEART'" class="hl-icon" viewBox="0 0 16 16">
            <g fill="currentColor">
              <rect x="2" y="3" width="4" height="2"/><rect x="10" y="3" width="4" height="2"/>
              <rect x="1" y="4" width="2" height="4"/><rect x="13" y="4" width="2" height="4"/>
              <rect x="2" y="8" width="2" height="2"/><rect x="12" y="8" width="2" height="2"/>
              <rect x="3" y="9" width="10" height="2"/>
              <rect x="4" y="11" width="8" height="2"/>
              <rect x="5" y="12" width="6" height="2"/>
              <rect x="7" y="14" width="2" height="1"/>
            </g>
          </svg>
          <svg v-else-if="h.icon === 'BROWSER'" class="hl-icon" viewBox="0 0 16 16">
            <g fill="currentColor">
              <rect x="1" y="2" width="14" height="12" fill="none" stroke="currentColor" stroke-width="1.4"/>
              <rect x="1" y="2" width="14" height="3"/>
              <rect x="3" y="3" width="1" height="1" fill="#0a0a0f"/>
              <rect x="5" y="3" width="1" height="1" fill="#0a0a0f"/>
              <rect x="7" y="3" width="1" height="1" fill="#0a0a0f"/>
              <rect x="3" y="7" width="4" height="1"/><rect x="3" y="9" width="6" height="1"/><rect x="3" y="11" width="3" height="1"/>
            </g>
          </svg>
          <svg v-else-if="h.icon === 'PLANT'" class="hl-icon" viewBox="0 0 16 16">
            <g fill="currentColor">
              <rect x="7" y="2" width="2" height="10"/>
              <rect x="4" y="4" width="3" height="2"/><rect x="9" y="6" width="3" height="2"/>
              <rect x="3" y="3" width="2" height="2"/><rect x="11" y="5" width="2" height="2"/>
              <rect x="3" y="12" width="10" height="2"/>
              <rect x="4" y="14" width="8" height="1"/>
            </g>
          </svg>
          <div class="hl-text pixel">{{ h.text }}</div>
        </div>
      </div>
    </section>

    <div class="about-divider reveal" aria-hidden="true">
      <div class="div-bar"></div>
      <div class="div-pixels">
        <span
          v-for="i in 24"
          :key="i"
          :style="{ animationDelay: ((i - 1) * 80) + 'ms' }"
        ></span>
      </div>
      <div class="div-bar"></div>
    </div>

    <section class="about-contact reveal">
      <div class="contact-grid">
        <div class="contact-intro">
          <div class="kicker pixel neon-cyan">▸ CONTACTO</div>
          <h2 class="contact-title">CONTÁCTANOS</h2>
          <p class="contact-sub">
            ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
            Escríbenos.
          </p>
          <div class="contact-tips">
            <div class="tip"><span class="tip-led"></span>RESPUESTA EN 24-48H</div>
            <div class="tip"><span class="tip-led y"></span>SUGERENCIAS BIENVENIDAS</div>
            <div class="tip"><span class="tip-led m"></span>SIN SPAM, JAMÁS</div>
          </div>
        </div>

        <form :class="['contact-form', { shake }]" @submit.prevent="onSubmit">
          <template v-if="!sent">
            <div class="field">
              <label>NOMBRE</label>
              <input v-model="form.name" placeholder="px_kai" />
            </div>
            <div class="field">
              <label>CORREO ELECTRÓNICO</label>
              <input type="email" v-model="form.email" placeholder="jugador@vault.gg" />
            </div>
            <div class="field">
              <label>MENSAJE</label>
              <textarea v-model="form.msg" rows="5" placeholder="Cuéntanos qué tienes en mente…"></textarea>
            </div>
            <button class="btn xl press" type="submit" style="width:100%">▶  ENVIAR MENSAJE</button>
          </template>

          <div v-else class="terminal-success">
            <div class="term-bar">
              <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
              <span class="term-title">VAULT-OS // TERMINAL</span>
            </div>
            <div class="term-body">
              <div class="line"><span class="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
              <div class="line dim">[OK] Conectando con servidor…</div>
              <div class="line dim">[OK] Validando contenido…</div>
              <div class="line dim">[OK] Transmitiendo paquete…</div>
              <div class="line success">&gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {{ sent.toUpperCase() }}.<span class="caret">_</span></div>
              <div style="margin-top:18px">
                <button class="btn ghost" type="button" @click="resetForm">ENVIAR OTRO MENSAJE</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>
