# 06 — Integración del juego Asteroids

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 03-rutas-games, 05-integracion-supabase |
| Fecha | 2026-06-16 |
| Objetivo | Integrar el juego Asteroids (canvas HTML5 puro) en la plataforma Vue como módulo TypeScript en `src/games/asteroids/`, conectando su estado interno al HUD de Vue mediante callbacks y exponiendo pause()/resume() para que el contenedor controle el ciclo de juego. |

---

## Alcance

### Dentro del spec
- `src/data/games.ts` — añadir entrada `asteroids` al array `GAMES`
- `src/games/asteroids/game.ts` — refactorización de `references/started-games/asteroids/game.js`
  como módulo TypeScript: recibe el canvas por parámetro, exporta `startGame()`, `pause()`, `resume()`
  y callbacks `onScoreChange`, `onLifeLost`, `onLevelUp`, `onGameOver`
- `src/pages/reproductor/Reproductor.vue` — dynamic import del módulo del juego según `route.params.id`;
  sincronización del HUD de Vue con los callbacks; botones PAUSA y FIN llaman a `pause()`/`resume()`
  del módulo real

### Fuera del spec
- Persistencia del score (localStorage o Supabase) — spec futuro
- Cualquier otro juego real (snake, tetris, etc.) — cada uno tendrá su spec
- Modificaciones visuales al HUD del canvas interno del juego
- Controles táctiles / mobile
- Leaderboard en Detalle.vue

---

## Modelo de datos

### `src/data/games.ts` — nueva entrada

```ts
{
  id: 'asteroids',
  title: 'Asteroids',
  short: 'Destruye asteroides y sobrevive',
  long: 'Nave espacial en un campo de asteroides con envolvimiento de bordes. Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños.',
  cat: 'SHOOTER',
  cover: 'cover-asteroids',
  color: '#00eaff',
  best: 0,
  plays: 0,
}
```

### Interfaz del módulo `src/games/asteroids/game.ts`

```ts
export interface AsteroidsCallbacks {
  onScoreChange: (score: number) => void
  onLifeLost: (lives: number) => void
  onLevelUp: (level: number) => void
  onGameOver: (finalScore: number) => void
}

export interface AsteroidsGame {
  start: (canvas: HTMLCanvasElement, callbacks: AsteroidsCallbacks) => void
  pause: () => void
  resume: () => void
  restart: () => void
  destroy: () => void
}
```

`destroy()` cancela el `requestAnimationFrame` activo y elimina los listeners de teclado
para evitar fugas de memoria al desmontar el componente Vue.

---

## Plan de implementación

1. **Añadir entrada `asteroids` a `GAMES`** en `src/data/games.ts` con los campos definidos
   en el modelo de datos. El sistema queda funcional: la card aparece en Biblioteca y
   Detalle.vue carga con datos reales.

2. **Crear `src/games/asteroids/game.ts`** refactorizando `references/started-games/asteroids/game.js`:
   - Eliminar globals de módulo; encapsular todo el estado (`ship`, `bullets`, `asteroids`,
     `particles`, `score`, `lives`, `level`, `state`) en una función factoría
   - Reemplazar `document.getElementById('canvas')` por el parámetro `canvas: HTMLCanvasElement`
   - Mover los `addEventListener` de teclado al interior de `start()` y registrar su cleanup en `destroy()`
   - Llamar a los callbacks en los puntos correctos del loop:
     - `onScoreChange` cada vez que `score` aumenta
     - `onLifeLost` cuando una vida se pierde
     - `onLevelUp` cuando `level` sube
     - `onGameOver` al entrar en estado `'gameover'`
   - Exponer `pause()` (cancela rAF), `resume()` (reactiva el loop), `restart()` (reinicia estado),
     `destroy()` (cancela rAF + elimina listeners)

3. **Modificar `Reproductor.vue`** para soportar juegos reales:
   - Al montar el componente, intentar dynamic import de `../../games/${id}/game.ts`
   - Si el import falla (juego sin módulo real), seguir mostrando el mock actual
   - Si el import tiene éxito: montar un `<canvas ref="gameCanvas">` dentro de `.crt-screen`
     (ocultando `.game-arena` del mock), llamar a `game.start(canvas, callbacks)` en `onMounted`
   - Los callbacks actualizan `score`, `lives`, `level` del HUD de Vue
   - El botón PAUSA llama a `game.pause()` / `game.resume()`
   - El botón FIN llama a `game.pause()` y activa `over.value = true`
   - `restart()` llama a `game.restart()` además de resetear los refs de Vue
   - `onUnmounted` llama a `game.destroy()`

4. **Verificar con `npm run build`** que compila sin errores de TypeScript.

---

## Criterios de aceptación

- [ ] La card de Asteroids aparece en Biblioteca con categoría SHOOTER
- [ ] `/games/asteroids` carga Detalle.vue con los datos correctos del juego
- [ ] `/games/asteroids/play` carga Reproductor.vue con el canvas real del juego
- [ ] El canvas renderiza la nave, los asteroides y las partículas correctamente
- [ ] Los controles de teclado (← → ↑ Espacio) funcionan dentro del canvas
- [ ] El HUD de Vue muestra la puntuación real sincronizada con el juego
- [ ] El HUD de Vue muestra las vidas reales sincronizadas con el juego
- [ ] El HUD de Vue muestra el nivel real sincronizado con el juego
- [ ] El botón PAUSA detiene el loop del juego (los asteroides dejan de moverse)
- [ ] El botón REANUDAR reactiva el loop desde donde se pausó
- [ ] Al perder todas las vidas, se abre el modal de fin de partida con la puntuación final real
- [ ] El botón FIN en el HUD pausa el juego y abre el modal
- [ ] JUGAR DE NUEVO reinicia el canvas con estado limpio (score 0, vidas 3, nivel 1)
- [ ] Al desmontar Reproductor.vue, no quedan listeners de teclado ni rAF activos
- [ ] Los juegos sin módulo real (rocas, snake, etc.) siguen mostrando el mock sin cambios
- [ ] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Método de embed | Módulo TS con canvas por parámetro | iframe / Web Component | Integración nativa; el HUD de Vue puede comunicarse directamente con el juego |
| HUD | Doble HUD: canvas interno + Vue sincronizado | Solo canvas / Solo Vue | El canvas mantiene su estética arcade; Vue sincroniza para coherencia con la plataforma |
| Comunicación juego→Vue | Callbacks (`onScoreChange`, etc.) | Pinia store / eventos del DOM | Acoplamiento mínimo; el módulo del juego no depende de Vue |
| Control de pausa | Vue llama a `pause()`/`resume()` del módulo | Pausa cosmética con overlay | Coherente con el HUD; los asteroides no siguen moviéndose detrás del overlay |
| Persistencia del score | Fuera del spec | localStorage / Supabase | Requiere decisiones propias (tabla, RLS, conflictos); se trata en spec futuro |
| Reproductor genérico | Dynamic import por `id` de ruta | Componente dedicado por juego | Escala sin duplicar la pantalla del reproductor para cada juego |
| Ubicación del módulo | `src/games/asteroids/game.ts` | Co-localizado en `src/pages/reproductor/` | Separa la lógica del juego de la capa de presentación; escala para más juegos |

---

## Riesgos identificados

- **Listeners de teclado globales:** El `game.js` original registra listeners en `window`. Si
  `destroy()` no los elimina correctamente al desmontar, quedarán activos en otras páginas.
  Mitigación: guardar referencias a las funciones de handler en `start()` y usar
  `removeEventListener` explícito en `destroy()`.

- **rAF en segundo plano:** Si el usuario navega fuera sin pasar por el botón SALIR,
  `onUnmounted` debe garantizar que `destroy()` cancela el `requestAnimationFrame` activo.
  Mitigación: siempre llamar `game.destroy()` en el hook `onUnmounted` de Vue.

- **Canvas size vs. contenedor CRT:** El juego usa un canvas fijo de 800×600. En viewports
  menores, el canvas puede desbordar la carcasa `.crt-screen`. Mitigación: aplicar
  `max-width: 100%; height: auto` al canvas vía CSS, aceptando que el juego se escala
  visualmente sin cambiar las coordenadas internas.
