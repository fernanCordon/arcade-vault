# 04 — Página About

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | 01-mvp-pantallas-visuales, 02-home-page, 03-rutas-games |
| Fecha | 2026-06-15 |
| Objetivo | Implementar la página Acerca de (`/about`) portando el template `references/templates/home-about/about.html` a Vue 3, y añadir su enlace al Nav. |

---

## Alcance

### Dentro del spec
- `src/pages/about/About.vue` — página nueva con 3 secciones: hero, divisor animado y contacto con formulario
- `src/router/index.ts` — añadir ruta `/about` con name `about`, apuntando a `About.vue` (import lazy)
- `src/components/Nav.vue` — añadir enlace "Acerca de" → `/about` en el array `links`

### Fuera del spec
- Envío real del formulario (backend, email, API)
- Footer
- Tests
- Cambios visuales en otras páginas

---

## Modelo de datos

No se introduce ninguna estructura nueva ni store. Todos los datos son estáticos.

Estado local en `About.vue` (con `ref`):

```ts
const form = ref({ name: '', email: '', msg: '' })
const sent = ref<string | null>(null)  // nombre del remitente al enviar con éxito
const shake = ref(false)               // activa animación de error en el formulario
```

Los 3 highlights son un array constante definido inline en el componente:

```ts
const HIGHLIGHTS = [
  { icon: 'HEART',   text: 'HECHO CON ❤️ PARA JUGADORES',                color: 'magenta' },
  { icon: 'BROWSER', text: 'JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR', color: 'cyan' },
  { icon: 'PLANT',   text: 'PROYECTO EN CONSTANTE CRECIMIENTO',           color: 'green' },
]
```

Los SVGs de los íconos se definen inline en `About.vue` con `v-if` por `icon`, igual que los feature icons de `Home.vue`.

---

## Plan de implementación

1. En `src/router/index.ts`: añadir `{ path: '/about', name: 'about', component: () => import('../pages/about/About.vue') }` antes del wildcard.

2. En `src/components/Nav.vue`: añadir `{ label: 'Acerca de', to: '/about' }` al array `links` después de "Salón de la Fama".

3. Crear `src/pages/about/About.vue` con:
   - **Hero:** kicker, `<h1>`, párrafo de misión, grid de 3 `.highlight` cards con SVGs inline por `v-if`.
   - **Divisor animado:** barra + 24 píxeles parpadeantes (`v-for` con `animationDelay`).
   - **Sección contacto:** grid 2 columnas — columna izquierda con título, subtítulo y 3 tips LED; columna derecha con el formulario. Al enviar: valida que los 3 campos estén rellenos (si no, activa `shake`); si pasan, guarda el nombre en `sent`. Cuando `sent` no es `null`, sustituye el formulario por el terminal de éxito.
   - `onMounted` con `IntersectionObserver` para activar `.reveal` en divisor y sección contacto.

4. Verificar con `npm run build` que no hay errores de TypeScript.

---

## Criterios de aceptación

- [x] `/about` renderiza `About.vue` con las 3 secciones visibles (hero, divisor, contacto)
- [x] El Nav muestra "Acerca de" como enlace activo cuando se está en `/about`
- [x] Los 3 highlight cards muestran su ícono SVG y efecto hover con el color correspondiente
- [x] El divisor animado muestra 24 píxeles parpadeando con los colores cyan/magenta/yellow
- [x] El formulario muestra animación `shake` si se intenta enviar con algún campo vacío
- [x] Al enviar con los 3 campos rellenos, el formulario es reemplazado por el terminal de éxito con el nombre del remitente en mayúsculas
- [x] El botón "ENVIAR OTRO MENSAJE" del terminal resetea el formulario y vuelve al estado inicial
- [x] El divisor y la sección de contacto aparecen con animación `.reveal` al hacer scroll
- [x] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| URL de la ruta | `/about` | `/acerca-de` | Consistencia con el inglés de las otras rutas (`/games`, `/salon`) |
| Envío del formulario | Simulado (estado local) | Backend / API real | Sin backend; misma aproximación que el resto de la app |
| SVGs de highlights | Inline en `About.vue` con `v-if` | Componente separado | Solo 3 íconos simples; extraerlos sería sobreingeniería |
| Datos de highlights | Array constante en `About.vue` | Store de Pinia | Son estáticos y solo los usa esta página |
