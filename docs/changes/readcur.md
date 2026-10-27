# Read curriculum fill, Fluent tier, keyed Sight Run (feature/readcur)

## Stages (src/drill.ts)
Every old stage id and its card keys stay the same. 37 stages now, up from 21, each in its existing Read group:
- Treble: `t-anch` (C5 G5 C6) after the octave stage, then `t-led1` (one ledger line, B3 to D4 and G5 to B5) and `t-led2` (A3 B3, B5 to D6) before Treble reach.
- Bass: `b-anch` (C3 G2 C2), `b-led1` (D2 to F2, B3 to D4), `b-led2` (B1 to E2). A second ledger line above the bass staff (E4) is not possible: `clefFor` always puts 64 and up in treble.
- Both clefs: `mixed` (strictly alternating treble and bass through `stageDeck`, which starts on either clef) before `grand`; `oct8` after it (G6 to D7 and C1 to F1). The layout already writes 8va/8vb past three ledger lines, so no layout change was needed (checked in Chrome).
- Keys: `keys-am`, `keys-dm` (natural minor plus the raised seventh under each tonic; `sharp` spells C sharp against the one-flat key), then D, B flat, A, E flat major.
- Melodies: `tune-a1` and `tune-a2` read ahead. These are the tune-c shapes, and once the first note is played the next 1 or 2 notes are hidden (`staff.lookahead < 0`, which reuses the Sight Run `ahead` class). A wrong key shows the hidden card again (`staff.uncover`), so nobody gets stuck.
- Card keys: the same note is the same skill wherever it is dealt (an existing rule), so anchors and ledger stages share stats with the reach stages. Switching and read-ahead cards get a tag (`:x`, `:a1`, `:a2`), because they test a different skill on the same notes. Tagged cards stay out of Review.
- `weakest()` used to name a tune card "triad on undefinedNaN". It now names it "tune from G4, key of G", and key names cover -4 to 4 fifths.

## Fluent tier
`fluentMs(stage)`: 1.5 s for single notes and tunes, half the goal for intervals and triads (2 s and 2.5 s), always at least 1.2 s. `mastery(stage, stats, goal)` takes an optional clock, so the stats and old callers are unchanged. The Read table:
- The meter has two tiers: Ink Soft up to Solid, then Ink climbing to Fluent. Once solid, the percentage shows the fluent tier.
- A solid row reads "Solid · Fluent at 1.5 s" and has a ghost "For speed" button (aria "Practice X for speed"). "Practice for speed" wrapped onto two lines in the 150 px column.
- A fluent row gets an outlined Fluent tag. Results text names the tier and its threshold.
- Grade path: `read(..., fast)` adds a level 5 "Reading at speed" requirement. New stages are added at levels 2 to 5.

## Sight Run
Intervals and triads now stack the chosen key's own notes, under its signature (`keyNotes` in drill.ts; `run.ts` uses it). With Intervals or Triads selected, the Notes select offers Naturals and the keys, but not loose sharps or flats.

## Verified
- tsc, vitest (441 tests), and `npm run smoke` all pass.
- Headless Chrome at 1180x820 and 820x1180 checked: the Read table, and the oct8, mixed, D minor and t-led2 drills. Also checked: a full Fluent set to its results, cover hiding then uncovering, and a keyed Sight Run of intervals in D.

## Not verified or found
- Nothing has been tried on the iPad or with the FP-10.
- Bug, not fixed (it was there before this branch): in portrait (820x1180) the drill staff is drawn far too large, and the notes overlap the clef. Same on the unchanged `t-land`.
- Inserting stages moves the Next stage back for players already past them, for example to `t-led1`, because it has a card that is new to them.
