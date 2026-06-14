# CLAUDE.md

Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Proyecto

Arcade Vault — plataforma online para jugar y competir por la mayor cantidad de puntos.

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm run build     # type-check + build de producción (vue-tsc y luego vite)
npm run preview   # previsualizar el build de producción
```

No hay test runner configurado todavía.

## Stack

- **Vue 3** Composition API + `<script setup>`
- **TypeScript** (~6.0)
- **Vite 8** con `@vitejs/plugin-vue`
- **Tailwind CSS v4** mediante el plugin `@tailwindcss/vite` (sin archivo de configuración — usa el plugin de Vite directamente)
- **Vue Router 5** con hash history (`createWebHashHistory`)
- **Pinia 3** para manejo de estado

## Arquitectura

```
src/
  main.ts          # entrada de la app — monta Vue, registra router y pinia
  App.vue          # raíz: un único <RouterView />
  router/index.ts  # todas las rutas definidas aquí; rutas desconocidas redirigen a /
  pages/           # una carpeta por ruta, ej. pages/home/Home.vue
  components/      # componentes compartidos (vacío, pendiente de poblar)
  stores/          # stores de pinia (vacío, pendiente de poblar)
  style.css        # estilos globales / punto de entrada de Tailwind
```

Las páginas viven en `src/pages/<nombre-de-ruta>/`, co-localizando la vista con cualquier subcomponente específico de la página. Los componentes reutilizables van en `src/components/`. Los stores de Pinia van en `src/stores/`.

Tailwind v4 se configura únicamente a través del plugin de Vite — no existe archivo `tailwind.config.*`. Las clases utilitarias están disponibles globalmente; no agregar archivo de configuración salvo que alguna característica de v4 lo requiera.

## Skills
Para tareas de diseño frontend, carga y aplica 
~/.claude/skills/frontend-design/SKILL.md