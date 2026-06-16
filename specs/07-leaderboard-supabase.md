# 07 — Leaderboard con Supabase

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 05-integracion-supabase, 06-asteroids-integracion |
| Fecha | 2026-06-16 |
| Objetivo | Crear las tablas `games` y `scores` en Supabase y conectarlas al flujo completo: guardar scores desde el modal de fin de partida, mostrar leaderboard por juego en Detalle.vue y leaderboard global en Salon.vue. |

---

## Alcance

### Dentro del spec
- Crear tablas `games` y `scores` en Supabase con migración SQL; seed de `asteroids` en `games`
- `src/lib/scores.ts` — funciones `submitScore()` y `getScores(gameId?)` que abstraen las llamadas a Supabase
- `Reproductor.vue` — al hacer submit en el modal, llamar a `submitScore()`; recordar `player_name` en localStorage bajo la clave `av_player_name`; prerellenar el input con ese valor
- `Detalle.vue` — reemplazar el leaderboard hardcodeado con datos reales filtrados por `game_id`
- `Salon.vue` — reemplazar podio y tabla con datos reales de Supabase (top global sin agrupar por jugador)
- Estado vacío en ambos leaderboards: mensaje "Sé el primero en entrar al salón de la fama"

### Fuera del spec
- Autenticación de usuarios (`user_id` se guarda como `null` por ahora)
- Migración de carga de juegos desde `games.ts` a Supabase (spec futuro)
- Row Level Security u otras políticas de acceso
- Paginación del leaderboard
- Controles táctiles / mobile para los juegos

---

## Modelo de datos

### Tabla `games` en Supabase

```sql
create table games (
  id     text primary key,
  title  text not null,
  short  text not null,
  long   text not null,
  cat    text not null,
  cover  text not null,
  color  text not null,
  best   integer not null default 0,
  plays  integer not null default 0
);

insert into games (id, title, short, long, cat, cover, color) values (
  'asteroids',
  'Asteroids',
  'Destruye asteroides y sobrevive',
  'Nave espacial en un campo de asteroides con envolvimiento de bordes. Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños.',
  'SHOOTER',
  'cover-asteroids',
  '#00eaff'
);
```

### Tabla `scores` en Supabase

```sql
create table scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     text        not null,
  player_name text        not null,
  score       integer     not null,
  created_at  timestamptz not null default now(),
  user_id     uuid        references auth.users(id) default null
);

create index on scores (game_id, score desc);
create index on scores (score desc);
```

### `src/lib/scores.ts` — interfaz pública

```ts
export interface ScoreEntry {
  id: string
  game_id: string
  player_name: string
  score: number
  created_at: string
}

// Inserta un score. Devuelve el entry guardado o lanza error.
export async function submitScore(gameId: string, playerName: string, score: number): Promise<ScoreEntry>

// Sin gameId → top global. Con gameId → filtrado por juego. Ordenado por score DESC.
export async function getScores(gameId?: string): Promise<ScoreEntry[]>
```

### localStorage — clave `av_player_name`

Guarda el último nombre usado por el jugador. Se lee al abrir el modal para prerellenar el input.

---

## Plan de implementación

1. **Crear migración SQL en Supabase** — ejecutar el DDL de las tablas `games` y `scores` con sus
   índices, e insertar el registro de `asteroids`. El sistema queda con ambas tablas listas;
   la app sigue leyendo de `games.ts` (híbrido hasta spec de migración).

2. **Crear `src/lib/scores.ts`** — implementar `submitScore()` y `getScores()` usando el cliente
   singleton de `src/lib/supabase.ts`. El módulo queda aislado y testeable independientemente.

3. **Modificar `Reproductor.vue`** — en el modal de fin de partida:
   - Al montar el modal, leer `av_player_name` de localStorage y prerellenar el input
   - Al hacer submit, llamar a `submitScore(gameId, playerName, finalScore)`
   - Si el submit tiene éxito, guardar el nombre en `av_player_name` y mostrar `.toast-saved`; deshabilitar el botón de submit para evitar duplicados
   - Si falla, mostrar un mensaje de error inline sin bloquear el flujo

4. **Modificar `Detalle.vue`** — reemplazar el leaderboard hardcodeado:
   - En `onMounted`, llamar a `getScores(gameId)` y poblar una ref `leaderboard`
   - Mostrar estado de carga mientras llega la respuesta
   - Renderizar `rank + player_name + score` con las clases `.lb-row` y `.top1/2/3` existentes
   - Si `leaderboard` está vacío, mostrar "Sé el primero en entrar al salón de la fama"

5. **Modificar `Salon.vue`** — reemplazar podio y tabla con datos reales:
   - En `onMounted`, llamar a `getScores()` (sin filtro) para obtener el top global
   - Mostrar estado de carga mientras llega la respuesta
   - Top 3 entradas → podio con `.gold`, `.silver`, `.bronze`; resto → tabla
   - La tabla muestra `rank + player_name + game_id + score`
   - Si no hay datos, mostrar "Sé el primero en entrar al salón de la fama" en lugar del podio

6. **Verificar con `npm run build`** que compila sin errores de TypeScript.

---

## Criterios de aceptación

- [ ] La tabla `games` existe en Supabase con el registro de `asteroids`
- [ ] La tabla `scores` existe en Supabase con sus dos índices
- [ ] `src/lib/scores.ts` exporta `submitScore()` y `getScores()` sin errores de TypeScript
- [ ] Al terminar una partida de Asteroids, el modal muestra el input de nombre prellenado con el valor de `av_player_name` si existe
- [ ] Al hacer submit, el score se guarda en Supabase y aparece en el leaderboard de `Detalle.vue`
- [ ] El nombre del jugador queda guardado en `av_player_name` tras el primer submit
- [ ] El botón de submit se deshabilita durante el envío y tras un envío exitoso
- [ ] Si el submit falla, se muestra un error inline y el modal no se cierra
- [ ] `Detalle.vue` muestra el leaderboard real de Asteroids ordenado por score DESC
- [ ] `Detalle.vue` muestra "Sé el primero en entrar al salón de la fama" cuando no hay scores
- [ ] `Salon.vue` muestra el podio con las 3 entradas de mayor score global
- [ ] `Salon.vue` muestra la tabla global con `rank + player_name + game + score`
- [ ] `Salon.vue` muestra "Sé el primero en entrar al salón de la fama" cuando no hay scores
- [ ] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Auth requerida para scores | No — `user_id` nullable | Auth obligatoria | Reduce fricción; cualquier visitante puede competir desde el primer día |
| Nombre del jugador | Input en modal + persistencia en `av_player_name` | Solo localStorage `av_user` existente | `av_user` guarda `{ name }` para la app; `av_player_name` es específico del flujo arcade |
| Límite de entradas en leaderboard | Sin límite (todos los scores) | Top 10 / Top 20 fijo | Más justo y más simple; se puede paginar en spec futuro si escala |
| Podio global | Top 3 entradas por score absoluto | Top 3 jugadores únicos | Más arcade; un jugador puede aparecer varias veces si mejoró su score |
| Tabla `games` en este spec | DDL + seed de `asteroids` solamente | Seed de los 8 juegos | Solo `asteroids` está implementado; insertar mocks generaría datos inconsistentes |
| Carga de juegos | Híbrido: `games.ts` local + tabla `games` en Supabase lista | Migrar carga a Supabase ahora | La migración definitiva tiene su propia complejidad; se trata en spec futuro |
| Abstracción de Supabase | `src/lib/scores.ts` con funciones puras | Llamadas directas desde los componentes | Desacopla la BD de la UI; fácil de sustituir o mockear |

---

## Riesgos identificados

- **Latencia en el modal:** `submitScore()` es una llamada asíncrona; si Supabase tarda,
  el usuario puede presionar submit varias veces. Mitigación: deshabilitar el botón de submit
  mientras la llamada está en curso y reactivarlo solo si falla.

- **Scores duplicados:** Si el usuario cierra el modal y lo reabre, el input ya tiene el nombre
  prellenado y podría re-submitir el mismo score. Mitigación: deshabilitar el botón de submit
  después de un envío exitoso y mostrar `.toast-saved` hasta que se cierre el modal.

- **`game_id` inválido:** `submitScore()` recibe el `id` de la ruta; si el juego no existe en
  la tabla `games`, el score se guarda igualmente (no hay FK entre `scores.game_id` y
  `games.id`). Mitigación: aceptable por ahora — se puede añadir la FK cuando todos los juegos
  estén en Supabase.

- **Leaderboard vacío en Salon.vue durante carga:** Hay un flash de "vacío" mientras llega la
  respuesta de Supabase. Mitigación: mostrar un estado de carga (skeleton o texto "Cargando…")
  antes de resolver si hay datos o no.
