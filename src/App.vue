<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useGamesStore } from './stores/games'

const gamesStore = useGamesStore()
onMounted(() => gamesStore.load())
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>
