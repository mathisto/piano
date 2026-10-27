# Paced Sight Run (branch feature/paced)

Sight-reading means keeping going at a steady pulse, eyes ahead, without stopping to fix a slip. Sight Run waited for the player. It now has an optional **Pace: Steady beat** on the builder.

## Built
- Builder: Pace (Waits for me | Steady beat). Steady beat adds a Tempo slider (30 to 100 bpm, spoken as it moves), "A card every" (Beat | Two beats), Length from 16 cards, Reading ahead of 2, 3 or 4 notes (default 3; "Whole set" and "Only the next" are not offered), and drops Widen. A line under the ranges says what tempo is offered and why.
- Run: a count-in at the tempo, the metronome click on every beat (always, whatever the Metronome setting), one card to a beat (a half note to two beats), the run never waits and a miss does not stop it. The whole run is one set, so the pulse never breaks (Endless means 16 cards). Notes are judged by the existing `Judge` in non-wait mode, on a window of 1.6 x the Good window (200 ms at 100%), the one place paced differs (`PACED_EASE` in `src/game.ts`). The tempo slider in the dock is hidden; judgement words are not popped up, the staff marks are the only feedback. HUD: Cards n/N and On the beat n.
- Results: "Hit 14 of 16 on the beat at 50 bpm", the run as a strip of cards (filled on the beat, hollow missed), the existing `timingLine` (spread of the gaps and bias, `coach.timing`), the notes missed by name, a count of wrong or off-beat keys, and one line from the tempo rule. No score, streak, record or rank; a paced run sets no longest streak. Finish mid-run counts the cards judged so far.
- Tempo offered (`suggest`): where the player left this range (`run:state.paced`), else a beat a quarter slower than their usual time on these cards (median of the Read stats `rt` of cards seen 3 times or more), two beats a card when one beat would be under 40 bpm, never above 80 to start, else 50 bpm and a card a beat.
- Tempo rule (`after`, like Ready): a clean run (90% of cards on the beat, at least 12 cards) on two different days at the same tempo raises it 4 bpm; two rough runs in a row (under 60%) lower it 4; anything between changes nothing; a shorter run changes nothing. A run at another tempo starts its count there. Stored per range in `run:state.paced` (so export, import and Clear already cover it).
- History: `kind: 'run'`, label "... paced at 50 bpm", `acc` the share on the beat, `bias` the timing bias; the plan's Sight Run step is ticked.

## Code
- `src/paced.ts` (pure, tested in `src/paced.test.ts`): `suggest`, `score`, `after`, `paceHint`.
- `src/drill.ts`: `deckSong(..., pulse)`, `noteCards(..., pulse)`, `layout(d, every)`. `src/game.ts`: `paced` flag on a Read-mode game (count-in, click, not waiting). `src/staff.ts`: reading ahead is counted in beats, not seconds. `src/app/drill.ts`: dealing, scoring at the end, results. `src/app/read.ts`, `src/ui.ts` (`runForm`, `pacedResults`), `src/style.css` (`.pstrip`, `.bpm`).
- e2e feature `2b` (about 13 s): `E2E_ONLY='^2b '`. 100 bpm, two cards skipped, results read "14 of 16", two hollow cells, memo stored, no streak set, axe clean on the builder and the results.

## Decisions (design bets, not findings)
- A paced run does not feed the per-card Read stats: a response time under a pulse is the pulse's, not the reader's. Misses are only reported. Open: feed misses into the weak-card weights.
- 90% clean, 60% rough, +/-4 bpm, the 1.25 slack and the 200 ms window are guesses from the sight-reading literature's direction (keep going, slow enough to read ahead), not fitted to a player.
- The history-based start is conservative: self-paced times include looking for the key, so it errs slow.

## Not verified
- iPad and the FP-10: headless Chrome with synthetic key presses only. Click timing on the iPad (`getOutputTimestamp`), Bluetooth latency (shows as bias) and a real reader's lateness against a 200 ms window are untested.
- No visual beat marker: the pulse is the click and the moving cursor. With the iPad silent switch on, only the cursor shows it. A beat dot strip like Perform's is the next step.
- Portrait (820x1180): the drill staff is still drawn too large (ROADMAP, already known); the paced screens were looked at in both sizes and show nothing new.
- Chord cards at 2 beats are written as half-note chords; not checked against the layout's rhythm rules beyond a look.
- Impeccable: only a short inline critique and the detector (nothing new off the DESIGN.md ramp from this change; the 11 notes are existing literals), not the full two-agent run.

## DESIGN.md lines to add (not applied here)
- Sight Run builder: after the Cards field, a Pace select (Waits for me, Steady beat). Steady beat adds, in the form grid, a Tempo slider (a plain range, 30 to 100, its value in a right-aligned `small.bpm` "50 bpm") and an "A card every" select (Beat, Two beats); Length drops the 10 card choice and reads "16 cards" for Endless; Reading ahead offers 2, 3 or 4 notes; the Widen switch gives way to one fine line ("Offered for this range: 50 bpm, a card every beat (why). A clean run on two days raises it 4.").
- Play screen, a paced run: the HUD shows Cards n/N and On the beat n in place of Streak; the dock Tempo control is hidden; the count-in and click come from the game as in Perform; judgement words are not shown, only the staff marks.
- Paced results (single column in the fixed overlay like the other Sight Run results): one line "Hit 14 of 16 on the beat at 50 bpm, a card every beat", the card strip (`.pstrip`: 14 x 22 px cells, 2px Edge border, Radius 4; on the beat filled Ink, missed an empty outline, not reached dotted at half opacity), the timing line, the missed notes by name, one line for the tempo rule, Run again (primary) and Back to Read. No streak, no record tag.
- Read stays "Cards, and in a Sight Run a Streak" except in a paced run (On the beat).
