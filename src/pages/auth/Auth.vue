<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { saveUser } from '../../data/user'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const store = useAuthStore()
const tab = ref<'login' | 'registro'>('login')

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (tab.value === 'registro') {
      const displayName = name.value.trim().toUpperCase() || email.value.split('@')[0].toUpperCase() || 'JUGADOR'
      await store.register(email.value, password.value, displayName)
    } else {
      await store.login(email.value, password.value)
    }
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error desconocido'
  } finally {
    loading.value = false
  }
}

async function loginWithOAuth(provider: 'google' | 'github') {
  error.value = ''
  try {
    await store.loginWithOAuth(provider)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error desconocido'
  }
}

function guest() {
  saveUser({ name: 'INVITADO' })
  router.push('/')
}
</script>

<template>
  <Nav />

  <main class="av-main av-auth-wrap">
    <div class="auth-card">
      <div class="auth-header">
        <div class="mark"></div>
        <h2 class="neon-cyan">ARCADE VAULT</h2>
      </div>

      <div class="auth-tabs">
        <button :class="{ on: tab === 'login' }" @click="tab = 'login'">ENTRAR</button>
        <button :class="{ on: tab === 'registro' }" @click="tab = 'registro'">REGISTRO</button>
      </div>

      <form @submit.prevent="submit">
        <div v-if="tab === 'registro'" class="field">
          <label>Nombre de jugador</label>
          <input v-model="name" type="text" placeholder="PIXEL_ACE" autocomplete="username" />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="jugador@arcade.com" autocomplete="email" />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <p v-if="error" style="color:var(--magenta);font-size:0.75rem;margin:4px 0;">{{ error }}</p>
        <button type="submit" class="btn xl pulse" style="width:100%;margin-top:8px;" :disabled="loading">
          {{ loading ? 'CARGANDO…' : (tab === 'login' ? 'ENTRAR' : 'CREAR CUENTA') }}
        </button>
      </form>

      <div class="auth-divider">O CONTINUAR CON</div>

      <div class="social">
        <button class="btn ghost" @click="loginWithOAuth('google')">GOOGLE</button>
        <button class="btn ghost" @click="loginWithOAuth('github')">GITHUB</button>
      </div>

      <div class="auth-divider">O SIN CUENTA</div>

      <button class="btn ghost" style="width:100%;" @click="guest">JUGAR COMO INVITADO</button>
    </div>
  </main>
</template>
