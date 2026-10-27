# Read through (roadmap item 3, real-music sight-reading)

One no-stop pass of a new, easy piece, after a look-through. Evidence: sight-reading grows with volume of new easy music, forced reading ahead and a keep-going rule (Mishra 2014); flashcards alone are not shown to transfer.

## Flow
- Start: Songs row action "Read through" (starters, your files, the open library) or the Today step "Read through" (10 and 20 minute plans; plan key `sight`).
- Look-through: the start card counts down 30 s (a thin meter and 0:27, no sound, keys do not count). Start now, the dock Play or Space starts early. Tempo − / + on the card. Switch "Only the next two bars". The staff shrinks to fit the piece (not below zoom 0.6) and goes back when the read-through ends.
- Play: Perform mode (count-in, does not wait; late notes are misses, the music carries on). The Perform | Learn switch is hidden for the pass.
- Summary: accuracy, notes caught, wrong notes, a strip of bars (slipped bars red and taller, also listed in words), the weakest two bars with Fix these (opens Learn with those bars looped at 70%, the existing fix-it chain), and Next piece.

## Picker (`src/readthrough.ts`, tested)
- Your level: the hardest piece with a Perform result or a clean run (starter and library levels: First notes, Beginner, Elementary, Intermediate); Beginner before anything counts.
- Target: two levels under yours, never under Beginner (the warm-up is not a piece). Unplayed pieces first, nearest level at or under the target, then harder; when all are played, the one played longest ago. User files have no level and are never offered.
- The look-through card says why ("You play Intermediate pieces. Reading improves with plenty of new music that is easier ...").

## Tempo
Default 70% of written, or your fastest clean read-through (`settings.readBest`) when that is slower. Clean = no misses, at most one wrong note, accuracy 90% or more.

## Records
`store.commit(id, heat, undefined, clean)` puts the piece into spaced review like a Perform run (no Best score: a read-through is not a performance); history `kind: 'song'`, label `Read-through: <title>`; Today plan step `sight`.

## Code
- `src/readthrough.ts` picker, tempo, card HTML; `src/readthrough.css`; `src/readthrough.test.ts`.
- `src/staff.ts`: `aheadBars` masks chords, beams and rests by bar (`lookahead` for drills is unchanged).
- `src/main.ts`: glue (`readThrough`, `rtPhase`, `rtDone`, `rtEnd`); `openById` now awaits a starter's open (fixBars on a starter from Today returned early before).
- `src/ui.ts`: the row action and the Today step. `src/settings.ts`: `readBest`, `readAhead`.

## Not verified / known gaps
- iPad and a real keyboard: only headless Chrome with synthetic key presses.
- The player level ignores Learn-only practice (Learn with Wait leaves no result or clean run).
- Ties into a masked bar still show; the look-through card covers the keys on a short stage, like the normal start card.
- At default zoom a 'both' view shows about two bars, so the mask only bites once the staff is fitted or zoomed out.
