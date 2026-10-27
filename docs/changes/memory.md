# Memorise (roadmap 7, memory mode)

Learn (the song waits) with the score fading by bars. Teachers lean on finger memory, which fails under nerves; aural, visual and analytical memory hold up better, so the mode asks you to look at the piece first and hands back the bars you stumbled in.

## Flow
- Start: Songs row action "Memorise" (starters, your files, the open library), or "Try it from memory" on the results of a clean Learn run (starts at stage 1 at least). A session starts at the highest stage cleared before.
- Start card: stage 0 to 4 (set by hand), then "Look first": key, time, bars, each hand's lowest to highest note, bars whose pitches repeat an earlier bar.
- Stages: 0 full score; 1 every 4th bar hidden (bars 4, 8, ...); 2 every 2nd bar; 3 barlines and bar numbers only; 4 no staff. Hidden bars vanish from the staff and the falling notes and light no key. Each stage hides everything the one before it hid.
- Hidden bars still count: Learn waits, wrong notes and misses are judged as usual.
- A strip over the staff: stage, notes right, slips, clean passes, Peek. At stage 4 it sits in the middle of the empty staff pane.
- Peek: shows the bar the song is waiting in (the next note to play) for 2 s, on the staff and the falling notes. Counted; results report it.
- Rules (`afterPass`): two clean passes in a row (whole piece or loop) move up a stage; more than three slips (misses plus wrong notes) move down one; anything else restarts the count. Clean = the app's usual clean (no miss, at most one wrong note) and no peek.
- Pass card: the stage played, slips, peeks, what happened, a strip of bars and up to three weak spots (most trouble this pass). Loop passes report in the banner instead.

## Records
- `Progress.memStage` (highest stage cleared, 0..4) and `memDay`; Songs rows show "Memorised n/4" once stage 1 or higher is cleared.
- Passes at stage 3 or 4 go into spaced review through `store.commit(..., clean)`, like a clean Perform run (existing box and due fields).
- `store.commit` and `store.memorised` now queue: a loop pass and a cleared stage wrote the same progress record at once and one write was lost (found by the browser walk).

## Code
- `src/memory.ts` pure logic and card HTML (`hidden`, `afterPass`, `startStage`, `weakSpots`, `keyName`, `repeats`, `facts`); `src/memory.test.ts`; `src/memory.css`.
- `src/staff.ts` `hideBar`; ties, tuplets, 8va brackets and rest dots now join the per-bar elements (also used by Read through's reading ahead). `src/highway.ts` `hideBar`.
- `src/main.ts` glue (`memorise`, `memShow`, `memPeek`, `memPass`, `memDone`, a second `game.on` listener); `src/ui.ts`, `src/library-view.ts` row action and tag (row actions are now two by two).

## Verified
tsc, vitest (16 new tests), `npm run smoke`. Headless Chrome, synthetic keys, Five-finger warm-up: clean Learn run to Try it from memory, stage set by hand, two clean passes at each of stages 0 to 4, memStage 4 and due saved, a peek at stage 4, a 4-slip drop from 4 to 3, the Songs tag; screenshots at 1180x820 and 820x1180.

## Not verified / known gaps
- iPad and a real keyboard; only synthetic presses.
- Key name: major or minor is guessed from the last, then the first, bass note; when neither is a tonic both are named with the signature. Chord symbols are not in the Song model, so stage 3 is barlines only.
- Today's "Due for another go" opens Learn, not Memorise, for a memorised piece.
- The ghost of a correct press still slides onto the hidden note's position for half a second.
- Several clean passes in one day climb several review boxes (same as Perform runs).
