// The load-time ratchet (docs/changes/perf.md): the entry chunk stays under budget and the play screen and lazy features stay out of it.
// Lower BUDGET when the entry shrinks; never raise it to make room, move the new weight behind an import() instead.
import { build, type Rolldown } from 'vite'
import { expect, test } from 'vitest'

export const BUDGET = 330_000 // bytes of minified JS in the entry chunk; it was 663 958 before the stage went lazy

test('the entry chunk is under budget and holds none of the lazy features', async () => {
  const out = (await build({ logLevel: 'silent', build: { write: false } })) as Rolldown.RolldownOutput
  const entry = out.output.find((c): c is Rolldown.OutputChunk => c.type === 'chunk' && c.isEntry)!
  expect(entry.code.length).toBeLessThan(BUDGET)
  const lazy = /node_modules\/pixi\.js\/|src\/(highway|staff|layout|dock|library-view|ear-play|pulse-play|app\/take-ui|app\/theory-ui)\.ts$/
  expect(entry.moduleIds.filter((id) => lazy.test(id))).toEqual([])
}, 60_000)
