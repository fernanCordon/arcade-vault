import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { saveUser } from '../data/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => user.value !== null)

  function syncLocalStorage(u: User | null) {
    if (u) {
      const name = u.user_metadata?.displayName || u.email || 'JUGADOR'
      saveUser({ name })
    } else {
      saveUser(null)
    }
  }

  function init() {
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      user.value = data.session?.user ?? null
      syncLocalStorage(user.value)
    })

    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      user.value = session?.user ?? null
      syncLocalStorage(user.value)
    })
  }

  async function register(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Revisa tu email y confirma tu cuenta para continuar.')
    await supabase.auth.updateUser({ data: { displayName } })
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function loginWithOAuth(provider: 'google' | 'github') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
    if (error) throw new Error(error.message)
  }

  async function logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  return { user, isLoggedIn, init, register, login, loginWithOAuth, logout }
})
