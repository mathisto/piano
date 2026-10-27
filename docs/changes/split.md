# main.ts split into feature modules

`src/main.ts` (2,266 lines) is now boot and navigation (about 100 lines). Behaviour is unchanged: code moved verbatim,
same function names, DOM ids and listeners; only shared-state writes and upward calls changed shape (below).

## Layout (`src/app/`, low to high; a module imports only from lower ones and the pure modules, never from main)
- `state.ts` shared state (`current`, `drill`, `run`, `rt`, `mem`, `highway`/`staff`/`dock`, ...), its setters,
  `hooks`, and small helpers (`say`, `resOpen`, `esc`, `median`, `worstBars`). It runs `skeleton()` first.
- `banner.ts` banner, keyboard chip, MIDI connect. `stage.ts` views, split, zoom, frame loop, practice time, popups.
- `library.ts` Songs page, tracks dialog, import. `play.ts` openSong/openById/leave/onPhase and the game's events.
- `readthrough-ui.ts`, `memorise-ui.ts`, `drill.ts` (drills and Sight Run), `read.ts`, `calibration.ts`, `results.ts`.
- `theory-ui.ts`, `scales-ui.ts`, `technique-ui.ts` (with touch calibration), `today.ts` (Today, Progress, Path).
- `drawer.ts` settings drawer, Set up, Credits. `input.ts` MIDI/computer-key routing and the keyboard shortcuts.
- Added since the split, both importing only `state.ts`: `osk-ui.ts` (the on-screen keys, `osk.md`) and `take-ui.ts` (the recorder glue, `recorder.md`); `results.ts` calls `take-ui`, `banner.ts` calls `osk-ui`.

## Rules to keep
- Shared `let`s live in `state.ts`; assign them through their setter (`setCurrent(x)`), since another module cannot.
- A call to a higher module goes through `state.hooks` (showSection, openDrawer, closeDrawer, rtEnd, rtPhase, memEnd,
  memStage, drillOk, onDone); the owner registers it with `Object.assign(hooks, {...})` as it loads.
  `results.ts` is imported by name by nobody, so main imports it for its side effect: keep that line.
- main imports the feature stylesheets in their old order so the cascade (and the built CSS) is byte-identical.

## Verified
- tsc, vitest (482), `npm run smoke`, after each move. Build: JS 616.00 -> 616.55 kB, CSS identical.
- A headless walk (every tab, drill, Sight Run set, scale run, Theory, Read-through, Memorise, calibration, technique,
  Perform song) prints the same text on the old and new code.

## Found, then fixed
- A key release while no piece had been opened (e.g. playing on a Theory card straight after boot) threw in `chordUpdate` because `game.song` was undefined. `stage.ts` now returns early (969a5c1).
