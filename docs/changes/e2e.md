# End-to-end suite

`npm i --no-save playwright-core axe-core`, then `npm run e2e` (about 3 minutes, needs Google Chrome). It starts its own Vite dev server (the `window.__piano` hooks exist only in dev); `E2E_URL=http://localhost:5173/` uses a running one instead, `E2E_ONLY='^3 |rhythm'` runs the matching features, `E2E_HEADED=1` shows the browser. Exits 1 on any failure and prints a pass/fail table; failure screenshots go to a temp folder named in the last line. `npm run smoke` stays the 20-second check.

What it does: one profile plays a day (0 to 10, in order), and five more run alongside (Theory trainers, the ear trainers one each, Songs), each a fresh browser context. Keys are pressed through `__piano.key/up`: in wait mode on the notes the game is waiting for, in Perform on each note's beat by the game's own clock. `Math.random` is seeded, so decks deal the same cards every run. Any console or page error fails the feature it happened in.

- 0 Set up sheet on a fresh profile; 0b a key played before any song is open
- 1 Read: a stage set, all cards, results, Another set starts by itself
- 2 Sight Run: bass clef run, a set, the next set deals itself, Finish, results, best saved; save, start and remove a preset
- 3 Scales: a stage run in Perform (clean, counted 1 of 3); Choose a scale: contrary, chromatic, arpeggio; Quiz answered on the keyboard
- 4 Theory: chords (inversions), cadences, keys, intervals, degrees; ear play-back, intervals, degrees and rhythm echo, all 15 of 15
- 5 Read through: look-through counts down, tempo, Start now, one bar left out, summary names it, Fix these lands in a slow Learn loop
- 6 Technique: five runs; live marks on 1 to 3, a test run with none on 4, faint on 5, evenness strip every time
- 7 Songs: 5,000-row catalogue, 50 a page, Show more, search keeps focus; a bundled piece in Learn, a scrubber loop, three clean passes add a bar. 7b: Notes shown on the start card
- 8 Progress: Over time (Theory and Technique charts), Notes you know, Path
- 9 Export, Clear, Import: every IndexedDB key and the settings must come back unchanged. 10 Clear leaves no store key
- 11 axe: every page, the drawer, Set up, the start and look-through cards, and the results of drill, run, scale, Theory, read-through and technique

Dev hook added: `__piano.theory()` returns the Theory session in progress (src/main.ts).

## Bugs found (the suite fails on the first two until they are fixed)

1. **A key with no song open throws.** Fresh load, press A on the computer keyboard on Today: `TypeError: Cannot read properties of undefined (reading 'fifths')` in `chordUpdate` (main.ts, `game.song.fifths`). On Theory and the Quiz every key-up throws the same until a song has been opened. Fix: `if (!game.song) return` at the top of `chordUpdate`.
2. **Export misses four key families.** `scale:quiz` (Quiz stats), `plan:<day>` (Today's ticks), `simp:<id>` (Notes shown per piece) and `snap:<week>` (the weekly snapshots behind the Monday recap; only this week's is rebuilt on boot) are not in `exportAll`/`importAll` (store.ts). Repro: feature 9b.
3. **The stage keeps rendering after you leave a song.** The Pixi ticker never stops: in headless Chrome a 10 ms timer on the Theory page fires 77 times in 3 s once a song has been opened, 300 times before (worst gap 298 ms). On the iPad that is battery. Fix: stop `app.ticker` while `#play` is hidden.
4. **Clear keeps `piano.setup` and `piano.legend`** in localStorage, so after Clear the first-run Set up sheet and the colour legend never show again. Your call whether that is wanted.
5. **At 1180x820 (iPad landscape), both panes**, the stage is under 420 px, so the start card's container query hides the hint, cover, legend and the Notes shown choice; it is only reachable by switching to falling notes (V). Intended?
6. **Escape right after choosing Notes shown** (inside about 200 ms) leaves, then the reopen finishes and puts you back in the piece. Rare by hand; the suite waits for the reopen.

## Not covered

Real MIDI and Web MIDI permission, sound output, on-screen keys by touch, WebKit and the iPad app, importing MIDI or MusicXML files and the tracks dialog, delay and touch-range calibration, Today's plan rows, Read through's Next piece, weak-notes review, zoom and the divider, the network corpus.
