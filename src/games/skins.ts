// src/games/skins.ts
// Fuente de verdad de paletas — lee tokens CSS --skin-* del DOM.
// Mantenido por el agente skin-design. No editar a mano.

export interface SkinPalette {
  bg:        string
  grid:      string
  line:      string
  primary:   string
  secondary: string
  accent:    string
  glow:      string
  glowBlur:  number
  enemy:     string
  neutral:   string
  /**
   * Tetris — color por tipo de pieza, indexable por el valor de celda 1..7
   * (I,O,T,S,Z,J,L). El índice 0 es `null` (celda vacía).
   */
  pieces:    (string | null)[]
  /**
   * Rana Veloz — colores de zonas y entidades del tablero.
   * `enemy`/`primary`/`secondary`/`neutral` del nivel raíz cubren rana, coches,
   * tortugas y texto; estos campos cubren las zonas de fondo y el tronco.
   */
  rana?: {
    grass: string
    goal:  string
    water: string
    road:  string
    log:   string
    log2:  string
  }
  // Campos adicionales se añaden por juego según necesidad
}

/**
 * Lee los tokens --skin-* actualmente activos (según data-skin en <html>)
 * y devuelve un objeto de paleta tipado.
 */
export function getSkinPalette(): SkinPalette {
  const s = getComputedStyle(document.documentElement)
  const get = (v: string) => s.getPropertyValue(v).trim()
  return {
    bg:        get('--skin-bg'),
    grid:      get('--skin-grid'),
    line:      get('--skin-line'),
    primary:   get('--skin-primary'),
    secondary: get('--skin-secondary'),
    accent:    get('--skin-accent'),
    glow:      get('--skin-glow'),
    glowBlur:  Number(get('--skin-glow-blur')) || 0,
    enemy:     get('--skin-enemy'),
    neutral:   get('--skin-neutral'),
    pieces:    [
      null,
      get('--skin-piece-I'),
      get('--skin-piece-O'),
      get('--skin-piece-T'),
      get('--skin-piece-S'),
      get('--skin-piece-Z'),
      get('--skin-piece-J'),
      get('--skin-piece-L'),
    ],
    rana: {
      grass: get('--skin-rana-grass'),
      goal:  get('--skin-rana-goal'),
      water: get('--skin-rana-water'),
      road:  get('--skin-rana-road'),
      log:   get('--skin-rana-log'),
      log2:  get('--skin-rana-log2'),
    },
  }
}
