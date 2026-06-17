import { ref } from 'vue'
import { defineStore } from 'pinia'
import { GAMES } from '../data/games'
import type { Game } from '../data/games'
import { getGames } from '../lib/games'

export const useGamesStore = defineStore('games', () => {
  // Inicializa con los estáticos → UI instantánea, sin parpadeo
  const games = ref<Game[]>([...GAMES])
  const loaded = ref(false)
  const dbIds = ref<Set<string>>(new Set())

  async function load() {
    if (loaded.value) return
    try {
      const fromDb = await getGames()
      const ids = new Set(fromDb.map(g => g.id))
      // Merge por id: BD pisa al estático si coinciden; ids nuevos se agregan
      const merged = [...games.value]
      for (const dbGame of fromDb) {
        const idx = merged.findIndex(g => g.id === dbGame.id)
        if (idx !== -1) {
          merged[idx] = dbGame
        } else {
          merged.push(dbGame)
        }
      }
      games.value = merged
      dbIds.value = ids
      loaded.value = true
    } catch (err) {
      console.warn('[games store] Error cargando desde BD, usando catálogo estático:', err)
    }
  }

  function byId(id: string | string[]): Game | undefined {
    const gameId = Array.isArray(id) ? id[0] : id
    return games.value.find(g => g.id === gameId)
  }

  return { games, loaded, dbIds, load, byId }
})
