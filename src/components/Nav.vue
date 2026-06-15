<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUser } from '../data/user'

const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

const user = computed(() => getUser())
const coins = ref(1250)

const links = [
  { label: 'Biblioteca', to: '/' },
  { label: 'Salón de la Fama', to: '/salon' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

function navigate(to: string) {
  mobileOpen.value = false
  router.push(to)
}
</script>

<template>
  <nav class="av-nav">
    <div class="logo" @click="navigate('/')">
      <div class="logo-mark"></div>
      <span class="logo-text neon-cyan">ARCADE <span class="neon-magenta">VAULT</span></span>
    </div>

    <div class="links">
      <a
        v-for="link in links"
        :key="link.to"
        :class="{ active: isActive(link.to) }"
        @click="navigate(link.to)"
      >{{ link.label }}</a>
    </div>

    <div class="spacer"></div>

    <div class="coin-counter">
      <div class="coin"></div>
      CRÉDITOS · {{ String(coins).padStart(2, '0') }}
    </div>

    <button class="btn auth-btn" @click="navigate('/auth')">
      {{ user ? user.name : 'ENTRAR' }}
    </button>

    <button class="hamburger btn ghost" @click="mobileOpen = true" aria-label="Menú">
      ☰
    </button>
  </nav>

  <div :class="['av-mobile-backdrop', { open: mobileOpen }]" @click="mobileOpen = false"></div>

  <div :class="['av-mobile-panel', { open: mobileOpen }]">
    <a
      v-for="link in links"
      :key="link.to"
      :class="{ active: isActive(link.to) }"
      @click="navigate(link.to)"
    >{{ link.label }}</a>
    <a @click="navigate('/auth')">{{ user ? user.name : 'ENTRAR' }}</a>
  </div>
</template>
