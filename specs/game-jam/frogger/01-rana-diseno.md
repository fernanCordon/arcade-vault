# Rana Veloz — Diseño del juego

| Campo | Valor |
|---|---|
| ID | `rana` |
| Título | `RANA VELOZ` |
| Categoría | `MAZE` |
| Color neón | `green` |
| Cover CSS | `cover-rana` |
| Estado | Diseño aprobado |
| Fecha | 2026-06-19 |

---

## Concepto

Frogger neón: guía a la rana desde la acera inferior hasta las lianas del otro lado del nivel. En medio hay una carretera con vehículos que matan al contacto y un río donde hay que saltar sobre troncos y tortugas en movimiento. Sin plataforma bajo las patas → muerte.

El juego es un clásico arcade de habilidad y timing. La tensión proviene de la gestión simultánea de múltiples carriles con velocidades distintas y del contador de tiempo por cruce.

---

## Mecánica

### Grid y mapa

- Canvas **800 × 600 px** → grid **16 × 12** celdas de **50 × 50 px**
- Filas del mapa (de abajo hacia arriba):

| Fila (0 = abajo) | Tipo | Contenido |
|---|---|---|
| 0 | Acera segura | Inicio de la rana |
| 1–4 | Carretera | 4 carriles de vehículos |
| 5 | Mediana | Zona segura intermedia |
| 6–9 | Río | 4 carriles de troncos/tortugas |
| 10 | Lianas | 5 huecos destino |
| 11 | Acera superior | Zona fuera de límite |

### Rana

- Movimiento discreto: **un salto = una celda** en la dirección pulsada
- Controles: **flechas + WASD**
- Al saltar hacia arriba sobre el río, la rana se monta en el tronco/tortuga más próximo de esa fila y se desplaza con él
- Si el tronco sale por el borde del canvas → muerte
- Si la rana está en el río sin plataforma → muerte

### Vehículos (carretera)

- Cada carril tiene vehículos de un tipo (coche, camión, moto) con velocidad y dirección propias
- La velocidad base aumenta con el nivel
- Los vehículos envuelven el canvas (salen por un lado, entran por el otro)
- Colisión pixel-perfect de celda completa

### Troncos y tortugas (río)

- Los troncos son plataformas seguras de 2–3 celdas de ancho
- Las tortugas pueden sumergirse periódicamente (mortales mientras están bajo el agua)
- La velocidad base aumenta con el nivel
- Envuelven el canvas igual que los vehículos

### Destinos (lianas)

- 5 huecos en la fila 10 que la rana debe alcanzar
- Ocupar un hueco ya visitado en el mismo nivel → muerte
- Al llenar los 5 huecos → siguiente nivel

### Tiempo límite

- 30 segundos por cruce
- El contador es visible en el HUD
- Llegar a 0 → pierde una vida (rana resetea a posición inicial)

---

## Scoring

| Evento | Puntos |
|---|---|
| Avanzar una fila nueva (hacia arriba) | +10 |
| Llegar a un destino (liana) | +100 × nivel |
| Bonus de tiempo al llegar | +(tiempo restante × 2) |
| Capturar insecto (aparece ocasionalmente en lianas) | +200 |

### Vidas

- 3 vidas al inicio
- Pierde vida: atropellado, ahogado, tiempo agotado, caída fuera del canvas
- Sin vidas → `onGameOver(finalScore)`

### Niveles

- Nivel 1: velocidades base
- Cada nivel: +10 % velocidad de todos los obstáculos, tortugas se sumergen más frecuentemente

---

## Interfaz de callbacks

```ts
export interface RanaCallbacks {
  onScoreChange: (score: number) => void
  onLifeLost:    (lives: number) => void
  onLevelUp:     (level: number) => void
  onGameOver:    (finalScore: number) => void
}

export interface RanaGame {
  start:   (canvas: HTMLCanvasElement, callbacks: RanaCallbacks) => void
  pause:   () => void
  resume:  () => void
  restart: () => void
  destroy: () => void
}
```

---

## Estética

- Fondo negro con cuadrícula tenue (igual que otros juegos de la plataforma)
- Carretera: franjas grises oscuras con línea central amarilla punteada
- Río: franjas azul oscuro con destellos cyan animados
- Acera y mediana: verde oscuro pixelado
- Rana: sprite simple verde neón, orientada en la dirección del último salto
- Vehículos: rectángulos coloreados con acento magenta/amarillo según tipo
- Troncos: rectángulos marrón oscuro, borde cyan tenue
- Tortugas: verde medio, parpadeo gris al sumergirse
- Insecto: punto amarillo parpadeante
- Timer: barra horizontal en el HUD que se vacía, cambia a magenta en los últimos 5 s

---

## Entrega esperada

Este spec de diseño es el insumo para el spec de integración (`02-rana-integracion.md`), que detallará la implementación en `src/games/rana/game.ts` y el seed de Supabase.
