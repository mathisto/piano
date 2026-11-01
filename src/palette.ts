// Mirrors the CSS custom properties in style.css; Pixi wants numbers.
export const C = {
  ground: 0x0c0e12,
  laneA: 0x161a22,
  laneB: 0x0e1015,
  grid: 0x3a4152,
  ink: 0xf4f2ed,
  R: 0xf27d52,
  L: 0x2ab7b0,
  LEdge: 0x6fd6d0,
  perfect: 0x3dd68c,
  great: 0xa7e8c4,
  good: 0xc9ccd6,
  bad: 0xff3d6e,
  missOnKey: 0xc8164b, // the wrong-key cross on an ivory key (= --paper-miss: crimson holds 3:1 on ivory only this dark)
  lamp: 0xffc83d,
  receptor: 0xfff3d6,
  keyWhite: 0xeae6df,
  keyBlack: 0x1b1d22,
  keyEdge: 0x050608,
  held: 0xe8e4da,
  muted: 0x5e6472, // key names and unlit receptor lamps
} as const
