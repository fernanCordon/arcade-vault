# 11 — Autenticación con Supabase Auth

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 05-integracion-supabase |
| Fecha | 2026-06-20 |
| Objetivo | Conectar `Auth.vue` a Supabase Auth (email/password + OAuth social), propagar la sesión a `Nav.vue` mediante un store Pinia, y restringir el guardado de puntuaciones a usuarios logueados. |

---

## Alcance

### Dentro del spec
- `src/stores/auth.ts` — nuevo store Pinia que envuelve `supabase.auth`: expone `user`,
  `isLoggedIn`, `login()`, `register()`, `loginWithOAuth()`, `logout()` e inicializa
  la sesión con `onAuthStateChange`
- `src/pages/auth/Auth.vue` — conectar el formulario existente a Supabase Auth:
  `signUp` en registro, `signInWithPassword` en login, `signInWithOAuth` para Google y GitHub;
  mostrar errores inline y estado de carga
- `src/components/Nav.vue` — cuando hay sesión: mostrar nombre del jugador + botón "Salir";
  cuando no hay sesión: mostrar botón "Entrar" (comportamiento actual)
- `src/pages/reproductor/Reproductor.vue` — en el modal de fin de partida, si el usuario
  no está logueado, reemplazar el formulario de submit por un mensaje
  "Inicia sesión para guardar tu puntuación" + botón que navega a `/auth`

### Fuera del spec
- Configuración de proveedores OAuth (Google / GitHub) en el dashboard de Supabase —
  prerequisito externo; los botones estarán implementados pero requieren esa config para funcionar
- Confirmación de email — Supabase queda en modo auto-confirm durante el desarrollo
- Cambios en el esquema de la tabla `scores` (sin `user_id`; los scores siguen siendo por nombre libre)
- Recuperación de contraseña / "¿Olvidaste tu contraseña?"
- Protección de rutas (route guards) — todas las páginas siguen accesibles sin sesión
- Cualquier otra página o componente

---

## Modelo de datos

### `src/stores/auth.ts` — interfaz del store

```ts
import type { User } from '@supabase/supabase-js'

// Estado reactivo expuesto
const user = ref<User | null>(null)
const isLoggedIn = computed(() => user.value !== null)

// Acciones
async function register(email: string, password: string, displayName: string): Promise<void>
async function login(email: string, password: string): Promise<void>
async function loginWithOAuth(provider: 'google' | 'github'): Promise<void>
async function logout(): Promise<void>

// Inicialización (llamar en main.ts o App.vue)
function init(): void  // suscribe a onAuthStateChange y carga sesión existente
```

### Sin cambios de esquema en Supabase
- Tabla `scores` — sin modificaciones; sigue recibiendo `playerName` como string libre
- No se crean tablas nuevas
- No se crean columnas nuevas

---

## Plan de implementación

1. **Crear `src/stores/auth.ts`** — store Pinia que:
   - Importa `supabase` de `src/lib/supabase.ts` y `User` de `@supabase/supabase-js`
   - Declara `user: Ref<User | null>` y `isLoggedIn: ComputedRef<boolean>`
   - `init()`: llama a `supabase.auth.getSession()` para cargar sesión existente y
     suscribe a `supabase.auth.onAuthStateChange` para mantener `user` sincronizado;
     también sincroniza `saveUser({ name: displayName })` en localStorage para que
     el resto de la app (scores, invitado) siga funcionando igual
   - `register(email, password, displayName)`: llama a `supabase.auth.signUp`;
     en éxito guarda el display name en `user_metadata` vía `updateUser`
   - `login(email, password)`: llama a `supabase.auth.signInWithPassword`
   - `loginWithOAuth(provider)`: llama a `supabase.auth.signInWithOAuth` con
     `redirectTo: window.location.origin`
   - `logout()`: llama a `supabase.auth.signOut` y llama a `saveUser(null)`
   - Cada acción lanza un `Error` con el mensaje de Supabase si falla, para que
     los componentes puedan capturarlo y mostrarlo

2. **Inicializar el store en `src/main.ts`** — llamar a `useAuthStore().init()`
   antes de montar la app para que la sesión esté disponible desde el primer render

3. **Actualizar `src/pages/auth/Auth.vue`** — reemplazar el mock actual por:
   - Importar y usar `useAuthStore()`
   - `ref` de `error: string` y `loading: boolean`
   - En submit: según la pestaña activa, llamar a `store.register()` o `store.login()`;
     capturar errores y mostrarlos bajo el formulario; en éxito `router.push('/')`
   - Botones Google / GitHub: llamar a `store.loginWithOAuth('google'/'github')`;
     Supabase gestiona el redirect
   - El botón "JUGAR COMO INVITADO" permanece igual (llama a `saveUser` directo)
   - Deshabilitar el botón de submit y mostrar texto "CARGANDO…" mientras `loading` es true
   - Mostrar error inline bajo el formulario cuando `error` tiene contenido

4. **Actualizar `src/components/Nav.vue`** — importar `useAuthStore()`:
   - Si `isLoggedIn`: mostrar el nombre del jugador (`user.value.user_metadata.displayName`
     o el email como fallback) + botón "SALIR" que llama a `store.logout()`
   - Si no `isLoggedIn`: mostrar botón "ENTRAR" que navega a `/auth` (comportamiento actual)

5. **Actualizar `src/pages/reproductor/Reproductor.vue`** — en el modal de fin de partida:
   - Importar `useAuthStore()`
   - Si `isLoggedIn`: mostrar el formulario de submit actual (sin cambios)
   - Si no `isLoggedIn`: mostrar mensaje "Inicia sesión para guardar tu puntuación" +
     botón `.btn.ghost` que navega a `/auth`

6. **Verificar con `npm run build`** que compila sin errores de TypeScript

---

## Criterios de aceptación

### Registro
- [ ] Al rellenar el formulario de registro y hacer submit, se crea una cuenta en Supabase Auth
- [ ] Tras el registro exitoso, el usuario queda logueado y es redirigido a `/`
- [ ] Si el email ya existe, se muestra un error inline bajo el formulario
- [ ] El botón "CREAR CUENTA" se deshabilita y muestra "CARGANDO…" durante el proceso

### Login
- [ ] Al introducir credenciales correctas y hacer submit, el usuario queda logueado y es redirigido a `/`
- [ ] Si las credenciales son incorrectas, se muestra un error inline bajo el formulario
- [ ] El botón "ENTRAR" se deshabilita y muestra "CARGANDO…" durante el proceso

### OAuth (requiere providers configurados en Supabase)
- [ ] El botón GOOGLE llama a `signInWithOAuth({ provider: 'google' })` sin errores de consola
- [ ] El botón GITHUB llama a `signInWithOAuth({ provider: 'github' })` sin errores de consola

### Sesión persistente
- [ ] Al recargar la página, el usuario sigue logueado si tenía sesión activa
- [ ] `useAuthStore().isLoggedIn` es `true` desde el primer render si hay sesión

### Navbar
- [ ] Cuando hay sesión, la navbar muestra el nombre del jugador y el botón "SALIR"
- [ ] Cuando no hay sesión, la navbar muestra el botón "ENTRAR"
- [ ] Al hacer clic en "SALIR", la sesión se cierra y la navbar vuelve a mostrar "ENTRAR"

### Guardado de puntuaciones
- [ ] En el modal de fin de partida, si el usuario está logueado, aparece el formulario de submit
- [ ] En el modal de fin de partida, si el usuario NO está logueado, aparece el mensaje
  "Inicia sesión para guardar tu puntuación" y un botón que navega a `/auth`

### Invitado
- [ ] El botón "JUGAR COMO INVITADO" sigue funcionando igual (guarda `{ name: 'INVITADO' }` en localStorage y redirige a `/`)
- [ ] Todas las páginas y juegos siguen siendo accesibles sin sesión

### Build
- [ ] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Store de auth | Pinia (`src/stores/auth.ts`) | Estado local en cada componente | Nav y Reproductor comparten el estado; un store evita prop drilling y llamadas duplicadas a Supabase |
| Confirmación de email | Auto-confirm (desactivada) | Confirmación obligatoria por email | Agiliza el desarrollo; se puede activar en Supabase dashboard antes de producción sin cambios de código |
| Schema de scores | Sin cambios (`playerName` libre) | Añadir columna `user_id` | No rompe el flujo de invitado ni el leaderboard existente; la auth es independiente de los scores |
| Gate de puntuaciones | Mensaje + botón a `/auth` en el modal | Bloquear submit con error en runtime | UX más clara; el invitado sabe exactamente qué hacer para guardar su puntuación |
| OAuth en este spec | Código implementado, config excluida | Implementar solo cuando los providers estén activos | El código es trivial; la config es un paso de dashboard externo que no bloquea el resto del spec |
| Recuperación de contraseña | Fuera del spec | Incluir flujo de reset | Añade superficie sin ser necesario para el MVP de auth; puede ir en un spec propio |
| Route guards | Fuera del spec | Proteger rutas con `beforeEach` | La plataforma es pública; ninguna ruta requiere auth para ser visitada |
| Sincronización localStorage | `saveUser()` llamado desde el store | Eliminar localStorage y usar solo Supabase | Mantiene compatibilidad con el resto de la app (scores, nombre en modal) sin refactor adicional |

---

## Riesgos identificados

- **OAuth sin configurar:** Los botones de Google y GitHub llaman a `signInWithOAuth` pero
  fallarán silenciosamente si los providers no están activados en el dashboard de Supabase.
  Mitigación: mostrar el mismo error inline que cualquier otro fallo de auth.

- **`user_metadata.displayName` no garantizado:** En login con email/password, si el usuario
  se registró sin pasar por el formulario (p.ej. directo desde Supabase dashboard), el campo
  `displayName` puede estar vacío. Mitigación: usar `user.email` como fallback en Nav y en
  la sincronización con `saveUser()`.

- **Sesión expirada en segundo plano:** `onAuthStateChange` detecta la expiración y pone
  `user` a `null`, pero si el usuario estaba en `Reproductor.vue` con el modal abierto,
  el formulario de submit desaparecerá sin aviso. Mitigación: aceptable en esta versión;
  el caso es extremadamente raro dado el TTL largo de Supabase.

- **Auto-confirm en producción:** Si el proyecto se despliega sin activar la confirmación
  de email en Supabase, cualquiera puede registrarse con un email falso. Mitigación: activar
  la confirmación antes del deploy a producción desde el dashboard (sin cambios de código).
