---
name: spec-impl-game
description: Implementa un spec aprobado (igual que /spec-impl) y, al terminar el último paso, detona el agente skin-design para tematizar el juego con las 3 skins (Classic/Neon/Retro). Solo produce skins si el spec pasa la validación de estado "Aprobado".
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*), Read, Glob, Grep, Task
---

# /spec-impl-game

## Contexto de sesión

Estado actual del repositorio:
!`git status --short`

Rama actual:
!`git branch --show-current`

Specs disponibles:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe"`

---

## Instrucciones

Este comando extiende `/spec-impl` con una Fase 5 adicional: detonar el agente `skin-design` al
completar la implementación.

---

### Fases 1–4 — Implementación del spec

Lee el skill `/spec-impl` completo antes de actuar:

```
~/.claude/skills/spec-impl/SKILL.md
```

Usa la tool **Read** para leerlo ahora mismo. Luego **ejecuta sus 4 fases exactamente**, tal como
están definidas en ese archivo, pasando `$ARGUMENTS` como el identificador del spec objetivo.

No omitas ningún comportamiento del skill original:
- Validación de estado "Aprobado" (Fase 2) — si el estado no es Aprobado, detente y muestra el
  error estándar del skill. **No continúes a la Fase 5.**
- Creación de rama `spec-NN-slug` (Fase 3).
- Implementación paso a paso con pausas y confirmación del usuario (Fase 4).

---

### Fase 5 — Detonar `skin-design` (automática tras el último paso)

**Disparo:** inmediatamente después de completar el **último paso** del plan de implementación de
la Fase 4, **antes** de emitir el recordatorio de verificar criterios de aceptación.

**Paso 5.1 — Derivar el `id` del juego**

Determina el `id` en este orden de prioridad:

1. **Módulo creado durante la implementación:** busca con Glob si se creó algún archivo nuevo
   `src/games/*/game.ts` durante esta sesión. El directorio padre es el `id` (ej. `src/games/rana/game.ts` → `rana`).
2. **Fallback — objetivo del spec:** busca en el archivo del spec la cadena `ID \`<id>\`` o
   `id: '<id>'` dentro de la sección de objetivo. Extrae el valor entre backticks o comillas.
3. **Ambigüedad:** si hay múltiples módulos nuevos o no se puede determinar con certeza, pregunta
   al usuario: `¿Cuál es el id del juego que debo pasar a skin-design? (ej. rana, snake, bricks)`

**Paso 5.2 — Lanzar el agente**

Una vez confirmado el `id`, lanza el agente `skin-design` usando la tool **Task** con:

```
subagent_type: "skin-design"
prompt: "Aplica las tres skins (Classic, Neon, Retro) al juego con id `<id>` en Arcade Vault.
Lee src/games/<id>/game.ts, extrae sus colores hardcodeados al contrato de tokens --skin-* en
src/style.css y al helper src/games/skins.ts, y actualiza references/game-with-themes.md.
El juego acaba de ser implementado — sus colores están en src/games/<id>/game.ts."
```

Informa al usuario antes de lanzarlo:

```
🎨 Implementación completa. Lanzando skin-design para el juego `<id>`...
```

**Paso 5.3 — Tras completar `skin-design`**

Cuando el agente devuelva su resultado:

1. Muestra un resumen breve de qué tematizó (tokens añadidos, archivos modificados).
2. **Luego** emite el recordatorio final de criterios de aceptación de `spec-impl`:

```
✅ Todos los pasos del plan están implementados y el juego está tematizado.

Siguiente paso: verificar los criterios de aceptación del spec uno a uno.
Si todos pasan, actualiza el estado del spec a "Implementado" y haz el commit final antes
de mergear esta rama.
```
