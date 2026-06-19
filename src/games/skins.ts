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
  }
}
