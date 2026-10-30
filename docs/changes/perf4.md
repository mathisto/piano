# Load time, round four: the Theory decks and the Help text leave boot

## Boot JS 241 510 -> 222 247 bytes (19.3 kB, 8%); budget 241 200 -> 223 000
After the datafix and enginefix merges the boot JS was 241 510 against the 241 200 budget. Numbers from `src/bundle.test.ts` (test-mode build);
`node scripts/bootmods.mjs` reads 240 804 before and 221 541 after (entry chunk 216 425 -> 197 162).

| module | before | after | why it was in boot |
|---|---|---|---|
| `theory.ts` | 8 920 | lazy (`theory` chunk, 16.7 kB with the three below) | `grades.ts` (the Path) and `plan.ts` (`theoryDue`) imported `deckOf` |
| `ear.ts` | 8 352 | lazy | through `theory.ts` |
| `pulse.ts` | 6 202 | lazy | through `theory.ts` |
| `ear2.ts` | 6 130 | lazy | through `theory.ts` |
| `theory-cards.ts` (new) | - | 4 349 | the five keyboard decks the Path needs |
| `guide.ts` | 7 884 | 4 535 | the Help sheet's text was in the shell markup |

## What moved
- `src/theory-cards.ts`: the card types (`Trainer`, `Step`, `TCard`), `NAMES`, `QUAL`, `INV`, `pc`, `MAJOR` (from `ear.ts`) and the
  decks answered from a name (chords, keys, intervals, cadences, degrees) with `keyDeck(t, level)`, moved verbatim from `theory.ts`.
  The guess was that Today needs only trainer names and ids; it needs more: `grades.ts` builds the decks of its Theory requirements
  when it loads, and a requirement's state is its cards' stats. Those are exactly the five keyboard decks, so they stay in boot.
  `theory.ts` keeps `TRAINERS`, `untimed`, `deckOf` (ear and pulse decks, else `keyDeck`), `check` and `deal`. Importers point at the module that has the name; no re-exports.
- `plan.theoryDue` is async and imports `theory` only when a Theory card is due (it already returned at once otherwise). So a new
  player, or one with nothing due, never fetches it before the idle prefetch; a returning player with cards due fetches the 16.7 kB
  chunk while Today is drawn. If it does not arrive, Today draws without its Theory row (`today.ts` catch) instead of failing.
  Checked against `vite preview`: a profile with a due chord card on a 20-minute plan shows "Theory: Chords, 1 card due"; the
  `theory` chunk is fetched before the idle ones; no console errors.
- The Theory page was already on the lazy path (`app/lazy.ts`, `showSection` draws the title first and "This page could not load"
  on failure); its chunk now carries the decks and trainers too. e2e 22b now also holds and refuses `app/theory-ui`.
- The Help sheet's text (`HELP`, 3.3 kB) moved from `guide.ts` to `ui-sheets.ts` (already lazy, prefetched at idle). `ui.ts` draws the
  sheet's header and an empty body; a `MutationObserver` on the dialog's `open` (in `main.ts`) fills it the first time it opens, so
  neither opener (the drawer's Help button, the `?` key) changed. If `ui-sheets` does not load, the body says "Check the connection,
  then reload the page.", as the other sheets do. e2e 12 waits for the text; e2e 22b refused checks the message.

## Ratchet
`BUDGET` 223 000 (measured 222 247, 753 B margin). `theory|ear|ear2|pulse` added to the modules that must not be in boot; seen red
with a static `import './theory'` in `plan.ts` (239 842 against the budget).

## Not moved, and why
- `grades.ts` (6.4 kB), `guide.ts` (the rest: Start here card, tab notes, `keyboardLine`): Today's first paint needs them.
- `memory.ts` (6 kB): `app/play.ts` imports `facts` and `startCard` statically; `play.ts` was being edited by another agent. Splitting
  `memTag`/`facts`/`startCard` from the memorise flow, or making `app/memorise-ui` lazy, is the next small step (perf3 found Rolldown
  split shared modules into 13 chunks when `memorise-ui` went lazy; measure again).
- `coach.ts`, `game.ts`, `app/stage.ts`, `quantize.ts` (about 48 kB together): `app/state.ts` builds the `Game` at boot and `song.build`
  (boot, for drills and starters) calls `notate`. Moving them means a stage-free `Game` handle; not attempted here.
- `@capacitor/core` (15.5 kB): the platform check at boot.

## Verified
`npx tsc --noEmit` clean; `npx vitest run` 64 files, 806 passed, 4 skipped; `npm run build`. E2E (`E2E_ONLY`, dev server):
`^(0|0b|1|4|8|12|13|19|22|22b) ` ran 15 of 16 (22b did not match that pattern: the flow is gated on `ONLY.test('22b')`); 8 failed there
only because its Technique chart needs feature 6. Then `^(6|8|22) |22b` and `^(1|4|6|8) `: all pass, every trainer in 4 included,
22b slow and refused included. The full suite was not run.
Not measured: `scripts/perf.mjs` (Today time).
