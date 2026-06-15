# 01 — MVP: Pantallas visuales

| Campo | Valor |
|---|---|
| Estado | Aprobado |
| Dependencias | ninguna (es el primer spec) |
| Fecha | 2026-06-15 |
| Objetivo | Portar los 5 templates HTML del MVP a componentes Vue 3 con routing, datos compartidos y Nav reutilizable — sin implementar ningún juego real. |

---

## Alcance

### Dentro del spec
- `src/data/games.ts` — array GAMES con los 8 juegos (constante compartida)
- `src/components/Nav.vue` — navbar con menú mobile, coin counter y botón auth
- `src/pages/biblioteca/Biblioteca.vue` — hero + filtros + grid de cards con hover 3D
- `src/pages/salon/Salon.vue` — podio + tabs por juego + tabla de ranking con scores generados
- `src/pages/auth/Auth.vue` — tabs login/registro + botón invitado + botones sociales (sin backend)
- `src/pages/detalle/Detalle.vue` — cover + info + stat-strip + leaderboard lateral
- `src/pages/reproductor/Reproductor.vue` — HUD + carcasa CRT con animación CSS placeholder
- `src/router/index.ts` — 5 rutas + wildcard redirect
- Eliminar `src/pages/home/` (era placeholder)
- El estado de usuario va en `localStorage` directamente (sin Pinia por ahora)

### Fuera del spec
- Ningún juego implementado (la arena es decorativa)
- Backend, API, autenticación real
- Pinia stores (quedan pendientes para specs futuros)
- Footer (no aparece en los templates)
- Tests

---

## Modelo de datos

### `src/data/games.ts`

```ts
export interface Game {
  id: string
  title: string
  short: string
  long: string
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER' | 'VERSUS'
  cover: string   // clase CSS: 'cover-bricks', 'cover-tetro', etc.
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
  best: number
  plays: string
}

export const GAMES: Game[] = [ /* 8 juegos del template */ ]
export const CATS = ['TODOS', 'ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS']
```

### Estado de usuario (`src/data/user.ts`)

```ts
interface User { name: string }
export function getUser(): User | null
export function saveUser(u: User | null): void
```

No hay nuevas estructuras de base de datos ni stores — todo es efímero o constante.

---

## Plan de implementación

1. Crear `src/data/games.ts` con la interfaz `Game`, el array `GAMES` y `CATS`.
2. Crear `src/data/user.ts` con `getUser` y `saveUser`.
3. Crear `src/components/Nav.vue` con menú desktop, panel mobile y lógica de ruta activa.
4. Crear `src/pages/biblioteca/Biblioteca.vue` (hero + búsqueda + filtros + grid de cards).
5. Crear `src/pages/salon/Salon.vue` (tabs por juego + podio + tabla con scores generados).
6. Crear `src/pages/auth/Auth.vue` (tabs login/registro + invitado + botones sociales).
7. Crear `src/pages/detalle/Detalle.vue` (cover + info + stat-strip + leaderboard lateral).
8. Crear `src/pages/reproductor/Reproductor.vue` (HUD + carcasa CRT + animación placeholder + modal de fin).
9. Actualizar `src/router/index.ts` con las 5 rutas y wildcard redirect.
10. Eliminar `src/pages/home/`.

---

## Criterios de aceptación

- [ ] `/` muestra la Biblioteca con hero, buscador, chips de filtro y grid de 8 cards
- [ ] Filtrar por categoría y buscar por nombre reduce las cards visibles correctamente
- [ ] Click en una card o en "JUGAR" navega a `/juego/:id`
- [ ] `/juego/:id` muestra cover, info, stat-strip y leaderboard con el juego correcto
- [ ] Botón "JUGAR AHORA" en detalle navega a `/jugar/:id`
- [ ] `/jugar/:id` muestra HUD con score/vidas/nivel, carcasa CRT con animación y botones de pausa/fin/salir
- [ ] Modal de fin de partida aparece al pulsar "FIN"; permite guardar nombre y reiniciar
- [ ] `/salon` muestra tabs con los 8 juegos; cambiar tab actualiza podio y tabla
- [ ] `/auth` muestra tabs login/registro, alterna el campo email correctamente, y el botón invitado funciona
- [ ] Nav está presente en todas las pantallas con el link activo resaltado
- [ ] Panel mobile aparece y se cierra correctamente en pantallas ≤840px
- [ ] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Datos de juegos | `src/data/games.ts` (constante) | Pinia store | Sin estado reactivo necesario en el MVP |
| Estado de usuario | `localStorage` directo vía `src/data/user.ts` | Pinia store | Evitar complejidad prematura; stores quedan para specs futuros |
| Nav | `src/components/Nav.vue` compartido | Duplicado por página | Los templates lo repiten idéntico — extraerlo es la decisión obvia |
| Página raíz | `pages/biblioteca/Biblioteca.vue` en `/` | Mantener `pages/home/` | Home era un placeholder de una línea sin valor |
| Arena del reproductor | Animación CSS decorativa existente | Placeholder estático | El usuario quiere conservar la animación para iterar sobre ella |
| Autenticación | Visual únicamente (sin backend) | Auth real | Fuera del alcance del MVP visual |

---

## Riesgos

- **Clases CSS del `style.css` no cubren todo lo necesario:** Los templates definen estilos inline que ya están en `src/style.css`. Si hay discrepancias, habrá que añadir las clases faltantes al archivo global — no crear estilos scoped por componente.
- **TypeScript estricto en scores generados:** La función `seededScores` usa aritmética con números potencialmente negativos. Hay que tipar el retorno correctamente para evitar errores en `vue-tsc`.
