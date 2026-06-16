# 05 — Integración de Supabase

| Campo | Valor |
|---|---|
| Estado | Implementado |
| Dependencias | ninguna |
| Fecha | 2026-06-16 |
| Objetivo | Instalar y configurar el cliente de Supabase como módulo singleton en `src/lib/supabase.ts`, listo para ser consumido por futuros specs de auth, persistencia, realtime y edge functions. |

---

## Alcance

### Dentro del spec
- Instalar `@supabase/supabase-js` como dependencia
- Crear `src/lib/supabase.ts` — módulo singleton que exporta el cliente de Supabase
- Añadir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` a `.env.template`
- Añadir los valores reales a `.env.local`

### Fuera del spec
- Autenticación de usuarios (spec futuro)
- Persistencia de scores, partidas o perfiles (specs futuros)
- Realtime y Edge Functions (specs futuros)
- Modificación de ninguna página o componente existente
- Row Level Security u otras políticas en Supabase

---

## Modelo de datos

No se introduce ninguna estructura nueva en la app ni en Supabase. Las tablas y esquemas se definirán en specs futuros.

---

## Plan de implementación

1. Instalar la dependencia: `npm install @supabase/supabase-js`

2. Añadir a `.env.template` las dos variables:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

3. Añadir a `.env.local` los valores reales del proyecto de Supabase
   (URL y anon key obtenidos desde el dashboard de Supabase).

4. Crear `src/lib/supabase.ts`:
   ```ts
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

5. Verificar con `npm run build` que compila sin errores de TypeScript.

---

## Criterios de aceptación

- [ ] `@supabase/supabase-js` aparece en `package.json` como dependencia
- [ ] `src/lib/supabase.ts` existe y exporta `supabase` como cliente singleton
- [ ] `.env.template` contiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con valores vacíos
- [ ] `.env.local` contiene los valores reales y no está comprometido en git
- [ ] `npm run build` termina sin errores de TypeScript

---

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Motivo |
|---|---|---|---|
| Ubicación del cliente | `src/lib/supabase.ts` singleton | Plugin de Vue / Store de Pinia | Patrón estándar de Supabase; más simple y agnóstico al consumidor |
| Documentación de env vars | `.env.template` existente | `.env.example` nuevo | El proyecto ya tiene `.env.template`; no duplicar convenciones |
| Verificación de integración | `npm run build` sin errores | Llamada de prueba en `main.ts` / página `/debug` | Suficiente para una integración pura sin persistencia |
| Scope de este spec | Solo cliente + env vars | Auth + persistencia + realtime | Cada funcionalidad tendrá su propio spec; este es el cimiento |
