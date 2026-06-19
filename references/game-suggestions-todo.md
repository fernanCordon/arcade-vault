<!-- Memoria del agente game-planner. Mantenido automáticamente — no editar a mano. -->

| Fecha | Juego | Categoría | Estado | Motivo |
|---|---|---|---|---|
| 2026-06-19 | Pong Duel | ARCADE | SUGERIDO | Implementación trivial en canvas 2D, reconocimiento máximo como primer arcade comercial |
| 2026-06-19 | Minesweeper | PUZZLE | RECHAZADO | PUZZLE ya tiene Glot activo + Tetro comentado; menor urgencia |
| 2026-06-19 | Pacman Maze | ARCADE | RECHAZADO | ARCADE es la categoría más saturada; complejidad alta (tile-map + IA de fantasmas) |
| 2026-06-19 | 2048 Neon | PUZZLE | SUGERIDO | Puntuación incremental nativa, canvas 2D trivial, reconocimiento máximo post-arcade; puntaje 14/15 |
| 2026-06-19 | Sokoban | PUZZLE | RECHAZADO | Sin puntuación incremental natural; difícil encaje con leaderboard continuo |
| 2026-06-19 | Nonogram | PUZZLE | RECHAZADO | Reconocimiento más nicho; integración canvas más compleja (input preciso por celda) |
| 2026-06-19 | Pipe Dream | PUZZLE | RECHAZADO | Menor reconocimiento clásico en arcade; lógica de fluido más compleja de implementar |
| 2026-06-19 | Columns | PUZZLE | RECHAZADO | Similar a Tetris Stack ya en catálogo; riesgo de solapamiento de mecánica |
| 2026-06-19 | Breakout Duel | ARCADE | SUGERIDO | 14/15 — física de bola reutilizable de bricks/game.ts + referencia arkanoid disponible; diferenciador real vs Pong con bloques y segunda paleta |
| 2026-06-19 | Air Hockey Duel | ARCADE | RECHAZADO | 13/15 — buena física pero ningún código de base reutilizable; mayor esfuerzo de implementación que Breakout Duel |
| 2026-06-19 | Tank Arena | ARCADE | RECHAZADO | 13/15 — reconocimiento clásico alto pero tile-map + colisiones de proyectil más complejo que alternativas |
| 2026-06-19 | Combat Jets | ARCADE | RECHAZADO | 12/15 — mecánica interesante pero físicas de vuelo (inercia/thrust) suben complejidad innecesariamente |
| 2026-06-19 | Sumo Ring | ARCADE | RECHAZADO | 12/15 — menor reconocimiento clásico arcade; mecánica de empuje menos legible en canvas que las otras opciones |
| 2026-06-19 | Galaga Rush | ARCADE | SUGERIDO | Mayor puntaje total (12/15): reconocimiento máximo, formaciones dinámicas distintas a Pixel Invaders, implementación directa en canvas 2D |
| 2026-06-19 | Lunar Lander | ARCADE | RECHAZADO | 11/15 — física de gravedad/fuel añade complejidad de UX; menor urgencia que Galaga |
| 2026-06-19 | Centipede | ARCADE | RECHAZADO | 11/15 — mecánica de grid de segmentos conceptualmente cercana a Brick Breaker ya comentado |
| 2026-06-19 | Q*bert | ARCADE | RECHAZADO | 10/15 — perspectiva isométrica falsa aumenta complejidad de implementación |
| 2026-06-19 | Defender | ARCADE | RECHAZADO | 10/15 — scroll bidireccional + minimap exige más arquitectura de canvas |
| 2026-06-19 | Galaga | SHOOTER | SUGERIDO | 12/15: reconocimiento máximo, mecánica de captura única vs invaders, canvas 2D tractable con pathfinding en curvas simples |
| 2026-06-19 | Galaxian | SHOOTER | RECHAZADO | 11/15: menor reconocimiento que Galaga; mecánica similar a Invaders existente, poca diferenciación |
| 2026-06-19 | 1942 | SHOOTER | RECHAZADO | 10/15: tono bélico diferente pero scroll vertical añade complejidad de fondo; menor reconocimiento en público joven |
| 2026-06-19 | Tempest | SHOOTER | RECHAZADO | 9/15: visualmente único y muy neón pero proyección pseudo-3D compleja eleva costo de implementación significativamente |
| 2026-06-19 | Centipede | SHOOTER | RECHAZADO | 11/15: grid dinámico de hongos interesante pero lista enlazada de segmentos añade complejidad innecesaria frente a Galaga |
