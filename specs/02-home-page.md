# 02 — Página Home

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 01-mvp-pantallas-visuales (Nav.vue, GAMES, style.css, router) |
| Fecha | 2026-06-15 |
| Objetivo | Implementar la página Home como raíz de la app (`/`), portando el template `references/templates/home-about/home.html` a Vue 3 con seis secciones y datos estáticos, y mover la Biblioteca a `/games`. |

---

## Alcance

### Dentro del spec
- `src/pages/home/Home.vue` — página raíz con 6 secciones del template
- `src/components/FloatingSilhouettes.vue` — SVGs flotantes animados extraídos como componente
- `src/router/index.ts` — `/` apunta a `Home.vue`; `/biblioteca` se renombra a `/games`
- `src/components/Nav.vue` — link "Biblioteca" actualizado a `/games`; link "Inicio" activo en `/`

### Secciones de Home.vue
1. **Hero** — eyebrow, título 3 líneas, subtítulo, CTAs, scroll arrow, `<FloatingSilhouettes />`
2. **¿Por qué Arcade Vault?** — feature grid de 4 cards con íconos SVG inline
3. **Juegos disponibles ahora** — mini rail con los primeros 6 juegos de `GAMES`
4. **Estadísticas** — 3 stat-blocks estáticos (12+, MILES, GLOBAL)
5. **Actividad en vivo** — ticker de 7 entradas + top 5 jugadores (datos hardcodeados)
6. **Pricing** — price-card + 3 FAQ items

### Fuera del spec
- Sección "Acerca de" (es otra página, otro template)
- Backend real para actividad en vivo
- Animación del ticker (queda estática igual que el template)
- Footer (no aparece en los templates)
- Tests

---

## Modelo de datos

No se introduce ninguna estructura nueva ni store. Se reutiliza `GAMES` de `src/data/games.ts`.

Constantes locales en `Home.vue` (arrays tipados inline):

```ts
// Ticker de últimas puntuaciones
const RECENT_SCORES = [
  { player, game, score, time, color }  // 7 entradas
]

// Top jugadores del día
const TOP_PLAYERS = [
  { rank, player, score }  // 5 entradas
]
```

`FloatingSilhouettes.vue` no recibe props; sus SVGs son estáticos.

---

## Plan de implementación

1. Actualizar `src/router/index.ts`: cambiar la ruta de Biblioteca de `/` a `/games` y añadir `/` apuntando a `Home.vue` (importación lazy).
2. Actualizar `src/components/Nav.vue`: cambiar el href/to de "Biblioteca" a `/games`; añadir link "Inicio" apuntando a `/`.
3. Crear `src/components/FloatingSilhouettes.vue` con los 8 SVGs del template como template Vue puro (sin props, sin lógica).
4. Crear `src/pages/home/Home.vue` con:
   - Sección hero (eyebrow, h1 tres líneas, subtítulo, CTAs, scroll arrow, `<FloatingSilhouettes />`).
   - Sección feature grid (4 cards con íconos SVG inline).
   - Sección mini rail (`GAMES.slice(0,6)` usando las clases `.mini-card`/`.mini-cover`/`.mini-meta` existentes).
   - Sección estadísticas (3 `.stat-block` estáticos).
   - Sección actividad en vivo (ticker con `RECENT_SCORES` + top list con `TOP_PLAYERS`).
   - Sección pricing (`.price-card` + `.pricing-faq` con 3 items).
5. Verificar con `npm run build` que no hay errores de TypeScript.

---

## Criterios de aceptación

- [x] `/` renderiza `Home.vue` con las 6 secciones visibles
- [x] `/games` renderiza la Biblioteca correctamente (sin romper filtros ni grid)
- [x] El Nav muestra "Inicio" como link activo en `/` y "Biblioteca" navega a `/games`
- [x] Las silhouettes flotantes aparecen animadas en el hero
- [x] El feature grid muestra 4 cards con íconos SVG y efecto hover
- [x] El mini rail muestra exactamente 6 juegos; click en una card navega a `/juego/:id`
- [x] Las 3 estadísticas se muestran con el estilo neon correcto
- [x] El ticker muestra 7 entradas y el top list muestra 5 jugadores con colores gold/silver/bronze
- [x] La price-card y los 3 FAQ items renderizan sin errores
- [x] El botón "EXPLORAR JUEGOS" navega a `/games`; "CREAR CUENTA" navega a `/auth`
- [x] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Ruta raíz | `Home.vue` en `/` | Mantener Biblioteca en `/` | Home es la entrada natural de la app |
| Ruta Biblioteca | `/games` | `/biblioteca` | Decisión del usuario |
| Silhouettes | `src/components/FloatingSilhouettes.vue` | HTML inline en Home.vue | El usuario quiere componentes en la carpeta compartida |
| Datos de actividad | Constantes hardcodeadas en Home.vue | Pinia store / API | Sin backend real; consistente con el enfoque del spec 01 |
| Íconos del feature grid | SVG inline en Home.vue | Componente separado por ícono | Solo 4 íconos simples; extraerlos sería sobreingeniería |
| Animación reveal (.reveal/.in) | IntersectionObserver en `onMounted` | CSS puro / sin animación | El template ya usa este patrón; lo portamos igual |
