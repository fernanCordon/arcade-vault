export interface Game {
  id: string
  title: string
  short: string
  long: string
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER' | 'VERSUS'
  cover: string
  color: 'cyan' | 'magenta' | 'yellow' | 'green'
  best: number
  plays: string
}

export const GAMES: Game[] = [
  // {
  //   id: 'bricks',
  //   title: 'BRICK BREAKER',
  //   short: 'Rompe todos los bloques',
  //   long: 'Controla la paleta y destruye todos los bloques antes de que la bola caiga. Gana vidas extra con combos.',
  //   cat: 'ARCADE',
  //   cover: 'cover-bricks',
  //   color: 'cyan',
  //   best: 48200,
  //   plays: '12.4K',
  // },
  // {
  //   id: 'tetro',
  //   title: 'TETRIS STACK',
  //   short: 'Apila piezas sin espacios',
  //   long: 'Las piezas caen sin parar. Completa líneas horizontales para eliminarlas y sigue subiendo el marcador.',
  //   cat: 'PUZZLE',
  //   cover: 'cover-tetro',
  //   color: 'yellow',
  //   best: 93100,
  //   plays: '31.7K',
  // },
  // {
  //   id: 'snake',
  //   title: 'NEON SNAKE',
  //   short: 'Come y crece sin chocarte',
  //   long: 'La serpiente crece con cada píxel que devora. Evita las paredes y tu propio cuerpo mientras el ritmo se acelera.',
  //   cat: 'ARCADE',
  //   cover: 'cover-snake',
  //   color: 'green',
  //   best: 27650,
  //   plays: '8.9K',
  // },
  {
    id: 'glot',
    title: 'GLOT',
    short: 'Código que se auto-destruye',
    long: 'Elimina bloques de código antes de que el stack se desborde. Cada línea completada ejecuta un refactor.',
    cat: 'PUZZLE',
    cover: 'cover-glot',
    color: 'magenta',
    best: 61400,
    plays: '5.2K',
  },
  {
    id: 'invaders',
    title: 'PIXEL INVADERS',
    short: 'Defiende la Tierra',
    long: 'Oleadas de invasores pixelados descienden en formación. Dispara, esquiva y usa tus escudos con inteligencia.',
    cat: 'SHOOTER',
    cover: 'cover-invaders',
    color: 'cyan',
    best: 114500,
    plays: '44.1K',
  },
  {
    id: 'rana',
    title: 'RANA VELOZ',
    short: 'Cruza sin ser aplastado',
    long: 'Salta de liana en liana, esquiva camiones y cruza el río sobre troncos que se mueven. El tiempo no espera.',
    cat: 'ARCADE',
    cover: 'cover-rana',
    color: 'green',
    best: 22100,
    plays: '7.6K',
  },
  {
    id: 'duelo',
    title: 'DUELO LASER',
    short: '1v1 de reflejos',
    long: 'Dos jugadores, dos pistolas de luz. El primero en fallar pierde. Pura velocidad de reacción.',
    cat: 'VERSUS',
    cover: 'cover-duelo',
    color: 'magenta',
    best: 0,
    plays: '3.1K',
  },
  // {
  //   id: 'asteroids',
  //   title: 'ASTEROIDS',
  //   short: 'Destruye asteroides y sobrevive',
  //   long: 'Nave espacial en un campo de asteroides con envolvimiento de bordes. Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños.',
  //   cat: 'SHOOTER',
  //   cover: 'cover-asteroids',
  //   color: 'cyan',
  //   best: 0,
  //   plays: '0',
  // },
]

export const CATS = ['TODOS', 'ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS']
