<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

const authStore = useAuthStore()
const isLoggedIn = computed(() => authStore.isLoggedIn)
const playerName = computed(() => {
  const u = authStore.user
  if (!u) return null
  return (u.user_metadata?.displayName as string | undefined) || u.email || 'JUGADOR'
})
const coins = ref(1250)

const links = [
  { label: 'Inicio', to: '/' },
  { label: 'Biblioteca', to: '/games' },
  { label: 'Salón de la Fama', to: '/salon' },
  { label: 'Acerca de', to: '/about' },
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

    <template v-if="isLoggedIn">
      <span class="btn auth-btn ghost" style="cursor:default;">{{ playerName }}</span>
      <button class="btn auth-btn magenta" @click="authStore.logout()">SALIR</button>
    </template>
    <button v-else class="btn auth-btn" @click="navigate('/auth')">ENTRAR</button>

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
    <template v-if="isLoggedIn">
      <a style="cursor:default;">{{ playerName }}</a>
      <a @click="authStore.logout(); mobileOpen = false">SALIR</a>
    </template>
    <a v-else @click="navigate('/auth')">ENTRAR</a>
  </div>
</template>
