<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Nav from '../../components/Nav.vue'
import { saveUser } from '../../data/user'

const router = useRouter()
const tab = ref<'login' | 'registro'>('login')

const name = ref('')
const email = ref('')
const password = ref('')

function submit() {
  const n = name.value.trim() || email.value.split('@')[0] || 'JUGADOR'
  saveUser({ name: n.toUpperCase() })
  router.push('/')
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
        <button type="submit" class="btn xl pulse" style="width:100%;margin-top:8px;">
          {{ tab === 'login' ? 'ENTRAR' : 'CREAR CUENTA' }}
        </button>
      </form>

      <div class="auth-divider">O CONTINUAR CON</div>

      <div class="social">
        <button class="btn ghost" @click="submit">GOOGLE</button>
        <button class="btn ghost" @click="submit">GITHUB</button>
      </div>

      <div class="auth-divider">O SIN CUENTA</div>

      <button class="btn ghost" style="width:100%;" @click="guest">JUGAR COMO INVITADO</button>
    </div>
  </main>
</template>
