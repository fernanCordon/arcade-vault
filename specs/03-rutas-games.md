# 03 — Rutas de juego bajo /games

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 01-mvp-pantallas-visuales, 02-home-page |
| Fecha | 2026-06-15 |
| Objetivo | Reorganizar las rutas de detalle y reproductor bajo el prefijo /games/:id para reflejar la jerarquía semántica de la URL. |

---

## Alcance

### Dentro del spec
- `src/router/index.ts` — cambiar rutas y nombres: `/juego/:id` → `/games/:id` (name: `game-detail`), `/jugar/:id` → `/games/:id/play` (name: `game-play`)
- `src/pages/biblioteca/Biblioteca.vue` — actualizar links de cards a `/games/:id`
- `src/pages/detalle/Detalle.vue` — actualizar link del botón "JUGAR AHORA" a `/games/:id/play`

### Fuera del spec
- Rutas anidadas reales con `<RouterView>` hijo (no hay layout intermedio compartido)
- Cambios visuales o de comportamiento en ninguna de las páginas
- Cualquier otra ruta (`/salon`, `/auth`, `/games`)

---

## Modelo de datos

No se introduce ninguna estructura nueva. Este spec solo modifica rutas y referencias de navegación existentes.

---

## Plan de implementación

1. En `src/router/index.ts`: cambiar `path: '/juego/:id'` a `path: '/games/:id'` y `name: 'detalle'` a `name: 'game-detail'`. Cambiar `path: '/jugar/:id'` a `path: '/games/:id/play'` y `name: 'reproductor'` a `name: 'game-play'`.
2. En `src/pages/biblioteca/Biblioteca.vue`: actualizar todos los links de navegación a detalle para que apunten a `/games/:id`.
3. En `src/pages/detalle/Detalle.vue`: actualizar el link del botón "JUGAR AHORA" para que apunte a `/games/:id/play`.

---

## Criterios de aceptación

- [x] `/games/:id` carga `Detalle.vue` con el juego correcto
- [x] `/games/:id/play` carga `Reproductor.vue` con el juego correcto
- [x] Las rutas antiguas `/juego/:id` y `/jugar/:id` ya no existen (redirigen a `/` por el wildcard)
- [x] Click en una card de la Biblioteca navega a `/games/:id`
- [x] Botón "JUGAR AHORA" en Detalle navega a `/games/:id/play`
- [x] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| URL del reproductor | `/games/:id/play` | `/jugar/:id` (plana) | Refleja jerarquía semántica: el reproductor pertenece al juego |
| Implementación de anidamiento | URL anidada sin `<RouterView>` hijo | Rutas hijas reales de Vue Router | No hay layout intermedio compartido; la simplicidad gana |
| Nombres de rutas | `game-detail` / `game-play` | `detalle` / `reproductor` | Nomenclatura en inglés consistente con el prefijo `/games` |
