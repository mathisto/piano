# End-to-end suite

`npm i --no-save playwright-core axe-core`, then `npm run e2e` (about 6 minutes, needs Google Chrome; the watchdog stops it at 10, or 14 with `E2E_PULSE=1`). It starts its own Vite dev server on port 5213 (`E2E_PORT` to change it; Vite takes the next free port when it is busy, and each worktree gets its own dependency cache, so runs in two worktrees do not collide); the `window.__piano` hooks exist only in dev. `E2E_URL=http://localhost:5173/` uses a running one instead, `E2E_ONLY='^3 |rhythm'` runs the matching features, `E2E_HEADED=1` shows the browser. Exits 1 on any failure and prints a pass/fail table; failure screenshots go to a temp folder named in the last line. `npm run smoke` stays the 20-second check.

What it does: one profile plays a day (0 to 10, in order); the other features each get a fresh browser context, three lanes at a time (more starve the clock-driven players). Keys are pressed through `__piano.key/up`: in wait mode on the notes the game is waiting for, in Perform on each note's beat by the game's own clock. `Math.random` is seeded, so decks deal the same cards every run. Any console or page error fails the feature it happened in.

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
- 11 axe: every page, the drawer, Set up, the start and look-through cards, Start here, Help, the Path with pieces, and the results of drill, run, scale, Theory, read-through and technique
- 4 also: Ear chords at level 3 (inversions, 15 of 15), and Question and answer at level 4 (echo the rhythm), the first 3 cards only: a card is 13 s of phrase and answer. The driver answers a Q and A card in the phrase's own rhythm on the note it must end on. `E2E_PULSE=1` adds keep the beat, subdivisions and hold a rhythm (8 minutes 20 on their own lane, so run them with `E2E_ONLY='keepbeat|subdiv'`)
- 12 Start here on a fresh profile: the day-1 card, Start opens Treble landmarks, Skip and Hide survive a reload; a tab note once (Read, Scales; Got it closes it); Help from `?` and from Settings
- 13 Path ladder: seeded `prog:lib:*` records read Not started, Learning, Ready and "1 of 3 pieces ready"; Start opens a bundled piece in Learn
- 14 On-screen keys with touch emulation and no MIDI: a Theory chord tapped key by key is judged right; a Scales quiz card answered by tapping; the keys hide on the menus
- 15 Accompaniment: Five-finger warm-up, You play Right hand: the app plays every left-hand note (the game's `auto` events) and only the right hand is judged; Die Rose, die Lilie, You play Piano, the same at 125%. Results say only your part was judged
- 16 Recorder: a first run offers Listen back but no Compare; the second start card has the Ghost switch (the ghost loads), the second run's Compare draws its strip, and Listen back plays every note (counted through `__take.sink`)
- 17 Memorise: two clean Learn passes at stage 0 move to stage 1. 17b the metronome: B cycles beats, eighths, off; four beat dots, the lit one moves
- 18 Staff marks: the fixture score (`src/score-fixtures.ts`) imported through Add files; staccato, accent, slur, hairpin and dynamic letters all drawn on the staff during a run; played flat, the results name the flat crescendo and the long staccatos
- 19 Read: after `__piano.solidUpTo(3)` the three stages carry the Fluent tag; at 2 s a card they read "Solid · Fluent at 1.5 s" with For speed, which starts a speed set
- 21 Lead sheet (`docs/changes/lead2.md`): a bundled Lied, Lead sheet from the card at 1180x820, chord symbols drawn, no left hand, the chord switch kept across reopening, axe on the card, and a run that records no Ready, Best or box
- 22 Sheets (`docs/changes/sheets.md`): Credits (free line, the four Sounds blocks, links `_blank` `noopener`, Escape and Close return focus, axe), Set up from Settings, Options on a generated two-track MIDI. 22b the page chunk held, then refused: Scales, Read and Progress show their title at once, then the body; refused, each says "This page could not load" and the three sheets say "Check the connection, then reload the page."

Dev hook added: `__piano.theory()` returns the Theory session in progress (src/main.ts). No src change for the later features: they use `__piano.solidUpTo`, `__piano.mem`, `__take.sink`, the game's `auto` events and `game.modeOf`.

## Bugs found (1 and 2 are fixed; features 0b and 9b guard them)

1. **A key with no song open throws.** Fresh load, press A on the computer keyboard on Today: `TypeError: Cannot read properties of undefined (reading 'fifths')` in `chordUpdate` (main.ts, `game.song.fifths`). On Theory and the Quiz every key-up throws the same until a song has been opened. Fix: `if (!game.song) return` at the top of `chordUpdate`.
2. **Export misses four key families.** `scale:quiz` (Quiz stats), `plan:<day>` (Today's ticks), `simp:<id>` (Notes shown per piece) and `snap:<week>` (the weekly snapshots behind the Monday recap; only this week's is rebuilt on boot) are not in `exportAll`/`importAll` (store.ts). Repro: feature 9b.
3. **The stage keeps rendering after you leave a song.** The Pixi ticker never stops: in headless Chrome a 10 ms timer on the Theory page fires 77 times in 3 s once a song has been opened, 300 times before (worst gap 298 ms). On the iPad that is battery. Fix: stop `app.ticker` while `#play` is hidden.
4. **Clear keeps `piano.setup` and `piano.legend`** in localStorage, so after Clear the first-run Set up sheet and the colour legend never show again. Your call whether that is wanted.
5. **At 1180x820 (iPad landscape), both panes**, the stage is under 420 px, so the start card's container query hides the hint, cover, legend and the Notes shown choice; it was only reachable by switching to falling notes (V). Fixed in lead2: Notes shown stays as one line; under 260 px it is still hidden.
6. **Escape right after choosing Notes shown** (inside about 200 ms) leaves, then the reopen finishes and puts you back in the piece. Rare by hand; the suite waits for the reopen.
7. **The Help sheet could not be scrolled from the keyboard** (axe `scrollable-region-focusable` at 1180x820: its body overflows and holds nothing focusable). Fixed: `tabindex="0"` on `.helpbody` (src/guide.ts). Feature 12 guards it.
8. **Clear removes only `piano.settings` from localStorage**, so besides bug 4 it keeps `piano.guide` (a hidden or skipped Start here stays so, and the first-use day stays, so a player who clears after day 8 never sees the card), `piano.tips` (the tab notes never come back) and `piano.ghost`. Repro: feature 10 prints what is left. Same call as 4.

## Not covered

Real MIDI and Web MIDI permission, sound output, real touch latency, WebKit and the iPad app, importing MIDI files (the tracks dialog is feature 22), delay and touch-range calibration, Today's plan rows and Start here's days 2 to 7, a ladder piece that must be downloaded, Memorise stages 2 to 4 and Peek, the Hear last time button, the practice summary and Report a problem, Read through's Next piece, weak-notes review, zoom and the divider, the network corpus.
