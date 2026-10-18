// Mirrors the CSS custom properties in style.css; Pixi wants numbers.
export const C = {
  ground: 0x090b17,
  laneA: 0x161b42,
  laneB: 0x0b0e25,
  grid: 0x4a528f,
  ink: 0xecebf5,
  R: 0x3fe0ff,
  L: 0xff4fa3,
  perfect: 0xd7ff3d,
  great: 0x3dff9e,
  good: 0xffb21f,
  bad: 0xff4a3d,
  lamp: 0xffc83d,
  receptor: 0xfff3d6,
  keyWhite: 0xe7e6f1,
  keyBlack: 0x15182e,
  keyEdge: 0x05060d,
  held: 0xbfeaff,
} as const

export type GradeKey = 'perfect' | 'great' | 'good'
