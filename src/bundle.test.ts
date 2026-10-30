// The load-time ratchet (docs/changes/perf.md): the JS loaded at boot stays under budget and the play screen and lazy features stay out of it.
// Lower BUDGET when boot shrinks; never raise it to make room, move the new weight behind an import() instead.
import { build, type Rolldown } from 'vite'
import { expect, test } from 'vitest'

// bytes of minified JS in the entry chunk and every chunk it imports statically: Rolldown may split shared modules out of
// the entry, so the entry alone can undercount. 663 958 before the stage went lazy, 308 718 before the parsers did, 274 000 (budget) before the credits, setup, track sheets, page views and results did.
export const BUDGET = 241_200

test('boot JS is under budget and holds none of the lazy features', async () => {
  const out = (await build({ logLevel: 'silent', build: { write: false } })) as Rolldown.RolldownOutput
  const chunks = new Map(out.output.filter((c): c is Rolldown.OutputChunk => c.type === 'chunk').map((c) => [c.fileName, c]))
  const boot = new Set([[...chunks.values()].find((c) => c.isEntry)!])
  for (const c of boot) for (const f of c.imports) boot.add(chunks.get(f)!)
  expect([...boot].reduce((n, c) => n + c.code.length, 0)).toBeLessThan(BUDGET)
  const lazy = /node_modules\/(pixi\.js|@tonejs\/midi|midi-file|@capacitor\/core)\/|src\/(highway|staff|layout|dock|library-view|ear-play|pulse-play|musicxml|midi-tracks|report|ladder|ladder-data|app\/take-ui|app\/theory-ui|ui-sheets|ui-views|ui-results)\.ts$/
  expect([...boot].flatMap((c) => c.moduleIds).filter((id) => lazy.test(id))).toEqual([])
}, 60_000)
