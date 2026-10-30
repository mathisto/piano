import { expect, it, vi } from 'vitest'

// Pixi needs WebGL; a stand-in that answers every call and property is enough to count the label textures made.
vi.mock('pixi.js', () => {
  const any = (): unknown => new Proxy(function () {}, { get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : any()), apply: () => any() })
  const Any = function () {
    return any()
  }
  return { Application: Any, Container: Any, Graphics: Any, Sprite: Any, Text: Any, Texture: { from: any } }
})

it('a layout keeps the key-name textures: they do not depend on it', async () => {
  const { Highway } = await import('./highway')
  const h = new Highway({} as HTMLElement, { song: { lo: 60, hi: 72 }, view: 'both' } as never)
  const made = vi.fn(() => ({}))
  Object.assign(h, { app: { screen: { width: 800, height: 400 }, renderer: { generateTexture: made } }, bgGlow: { position: { set() {} } } })
  const label = (h as unknown as { label: (t: string, c: number, s: number) => unknown }).label.bind(h)
  label('C', 0, 16)
  h.layout()
  label('C', 0, 12)
  expect(made).toHaveBeenCalledTimes(1)
})
