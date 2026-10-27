# D.C., D.S., Fine, segno and partial-bar repeats at ingestion (branch feature/dc)

`scripts/library/repeats.ts` now plays out what `repeats.md` left flagged: one D.C. or D.S. jump (al Fine, al Coda), Fine, segno/coda signs, `\alternative` endings anywhere in the piece, and repeats that start or stop mid-bar. Candidate catalogue: `.cache/library/out-dc` (the patch of `out-final3`), not published.

## How

- **One play order for both importers.** The loop that `musicxml.ts` ran over measures (repeat signs, endings by pass, one jump, no repeats on the way back, last ending only after it) is `expand()` in `src/playorder.ts`; `playOrder` in `musicxml.ts` builds its measure list and calls it (same output, the MusicXML tests are unchanged and green). The `.ly` reading cuts the piece into units at every repeat sign, ending and mark and calls the same function, so a D.C. means the same in both.
- **Marks are read at their place, not by regex over the file.** `readLy` records the text of `^"..."`, `_\markup{...}`, `\mark`, `\musicglyph #"scripts.segno"`, a string variable used as `_\textCapo`, plus `\time`, `\partial` and `Timing.measurePosition`, which give the bars. D.C./Fine/To Coda are placed on the bar they end, segno/Coda/Trio on the bar they start. The old file-wide `D.C.|Fine|\segno|...` refusal is gone; a text that names one of those words and is none of them stops the piece (`a mark I cannot place`).
- **Placement rules** (each is a guess about engraving; each is why a piece is or is not in the table): a mark never reaches past the end of the repeat or ending it sits in; one that sits in a first ending belongs to the last ending (mutopia-225: "D.C." under the first ending's bar); a D.C. on the next-to-last bar jumps after the last bar (mutopia-276-2); a D.C. whose text names a movement ("Menuet da Capo.", "Aria da Capo e Fine.", but also "Men.D.C.") stops at a Fine or To Coda or a "Trio" mark if the score has one (the Trio's start is the Fine: 276-2, 1276, 186, 211), and is otherwise played in another file, so it is not a jump here (100-12, 1422). A bare "D.C." with nothing to stop at is left alone (443). A Coda, Fine or Trio with no D.C./D.S. in the piece is a label.
- **Scores that apply `\applyMusic #unfold-repeats` / `\unfoldRepeats`** already have their repeats in the MIDI. Their reading is played out the same way and compared; when the MIDI is as long as that reading, the piece keeps its file and loses the `repeats` flag. (The onset match runs one way, so a MIDI that lacks the repeats would also pass it; hence the length check.)
- **Partial bars.** The app lays bars out from the notes and time signatures (`quantize.ts`). The copies' barlines are worked out from the source's grid (the app's own, and if that fails the score's from `\time`/`\partial`), and the written file is read back through `fromMidi` and must lay exactly those barlines. A join that completes the bar it cuts (a pickup after a half bar) needs nothing. A join that leaves a short bar (a pickup after a full bar, a bar that ends early) gets that bar as a time signature for that one bar (1/8, 2/4 ...), and the previous signature again after it. If the app finds another pickup in the result than the source had and there is no short bar to state, every barline moved by one amount: accepted (that is all the old bars count check could see). Anything else: not unfolded, with the bar counts in the reason.
- **Short bars stated** (14 unfolded pieces carry time signatures for them): 84 (5/8), 165 (2/4), 225 (3/8), 276-2 (1/4 twice), 1006 (2/4 twice), 1009 and 1010 (1/8), 1276 (1/4 twice), 1484 (1/8 twice), 1497-5 (2/4), 1616 (1/4), 934 (6/8, 2/4, 1/4 several), 992 (1/8), 1277 (2/4). Where the source's pickup was not found (165, 225) the short bar is the app's grid being a pickup off, not the score's; the notes are the same.
- Smaller reader fixes that made more scores match their MIDI: graces after the main note (`\afterGrace c'''4^\trill { ... }`, the graces were read as notes of the voice), and an opening grace note that delays LilyPond's whole MIDI (mutopia-225 starts 0.11 q late; the reading is tried delayed, and the D.C. return starts after the delay).
- `pipeline.ts`: an input that `withRepeats` unfolded is marked `matched`, so the `mutopia-N-k` tempo check no longer re-reads the unfolded MIDI against the old `.ly` and drops the tempo (mutopia-276-2 came out at 60 bpm, 370 s, before this).
- `combine.mjs`: also takes an overlay entry whose file is the same but whose flags differ (441, 467, 23, 129 lose a stale `repeats` flag and keep their file; the old rule skipped them).

## Result on the live catalogue (`out-final3`), 2026-10-27

`node scripts/library/repeats-patch.mjs --from <out-final3> --out .cache/library/out-dc`: 49 flagged non-pinned Mutopia pieces, **23 unfolded** (new file; 20 of the lead's list and 3 more), **4 lose the flag, same file**, rest unchanged with the reason printed. Byte-identical on rerun. Bars/seconds/notes before to after (bars from the app's grid; seconds at the catalogue tempo):

| id | piece | result | bars | sec | notes |
|---|---|---|---|---|---|
| 84 | English Suite II Gigue | unfolded: A, B each with endings, D.S. (segno after the pickup) senza rep. to the Fine in the last bar | 79 to 225 | 49.4 to 141.5 | 785 to 2275 |
| 100-12 | French Suite 3 Trio | unfolded: its own repeats; "Menuet da Capo." is another file | 25 to 49 | 45 to 88.2 | 214 to 428 |
| 191 | Rondo | unfolded: D.C. al Fine to the end of the 2nd repeat | 33 to 81 | 57.1 to 140.2 | 269 to 673 |
| 215 | Progrès | unfolded: D.C. al Fine | 17 to 32 | 30.9 to 58.2 | 213 to 485 |
| 216 | Le Courant Limpide | unfolded: D.C. al Fine | 17 to 32 | 23.2 to 43.6 | 219 to 463 |
| 217 | La Gracieuse | unfolded: D.C. al Fine | 17 to 32 | 30.6 to 57.6 | 318 to 628 |
| 225 | La Styrienne | unfolded: D.C. al Fine (D.C. is under the first ending's bar; Fine at the end of the 2nd repeat, mid-bar), opening grace delay | 37 to 97 | 37.8 to 98.2 | 331 to 894 |
| 276-2 | Moonlight, 2nd mvt | unfolded: Allegretto, Trio, D.C. back to the Trio's start without repeats ("Trio" mark is the stop) | 60 to 143 | 96.4 to 226.6 | 373 to 898 |
| 345 | Original Rags | unfolded: five repeats, one with endings; the Fine is on the last bar | 109 to 188 | 218 to 376 | 1735 to 2991 |
| 441 | Magnetic Rag | **flag dropped, same file**: its MIDI score applies `\applyMusic #unfold-repeats` (reading played out matches, same length) | 191 | 458.4 | 3020 |
| 443 | Harlem Rag | **not unfolded**: a bare "D.C." in the last bar with no Fine, To Coda or Trio in the .ly; where it stops is not in the score | 115 | 191.7 | 1545 |
| 467 | Sugar Cane | **flag dropped, same file**: same `unfold-repeats` score ("Fine." is in the dynamics line at the end) | 145 | 174 | 2614 |
| 1276 | Sonata 1, 3rd mvt | unfolded: Menuetto (2 repeats), Trio (2), "Men.D.C." back to the Trio's start (also `key` review flag gone) | 74 to 189 | 78.6 to 200.4 | 623 to 1571 |
| 1422 | Goldberg 30 | unfolded: its own repeats; "Aria da Capo e Fine." is another file | 17 to 33 | 68 to 132 | 377 to 754 |
| 165 | Air | unfolded: six repeats, half-bar joins, endings 1/2 on the last | 37 to 73 | 82.2 to 161.1 | 521 to 1031 |
| 1006 | Chorale Gib dich zufrieden (F) | unfolded: pickup bars between sections (short bar stated) | 24 to 48 | 23.5 to 46.5 | 107 to 214 |
| 1009, 1010 | same chorale (D minor, E minor) | unfolded: a 1/8 pickup bar stated at the join | 12 to 17 | 44.5 to 61 | 125 to 173, 135 to 189 |
| 1484 | BWV 1006a Gigue | unfolded | 34 to 68 | 99.5 to 196.5 | 435 to 870 |
| 1497-5 | Partita E minor, mvt 5 | unfolded: endings of half a bar, 2 repeats | 33 to 65 | 132 to 258 | 605 to 1197 |
| 1616 | Wer nur den lieben Gott | unfolded | 9 to 14 | 36 to 53 | 182 to 270 |
| 934 | Six Variations | unfolded: 14 repeats, meter changes | 188 to 292 | 309.5 to 468.4 | 3177 to 4966 |
| 1277 | Sonata 1, 4th mvt | unfolded: repeat from beat 3, endings of 8 and 12 q | 198 to 391 | 264 to 520.7 | 3126 to 6193 |
| 1080-2 | Partita A minor, mvt 2 | **not unfolded**: the two voices disagree on the last repeat's length (32 vs 33.5 q) and the longer runs 1.5 q past the last note; second pass would start 1.5 q late | 17 | 96.8 | 534 |
| 1614 | March in E-flat | **not unfolded**: the source grid has no pickup (the score has 1 q), so the join at the end of section 2 is a 5 q bar in it; against the score's own grid the app again finds no pickup in the result (57 barlines against 60). Allowing a bar longer than the meter (drop the `> Math.max(...src.map(...))` test in `write`) ships it with one 5/4 bar | 29 | 72.5 | 357 |
| 1477 | BWV 1006a Loure | **not unfolded**: the app finds a 4.5 q pickup in the result (the score has 1.5 q, the source got none); the result's 49 barlines are not the copies' 50 | 25 | 150 | 355 |
| 1483 | BWV 1006a Bourrée | **not unfolded**: same (source pickup 1 q, result none, 73 barlines against 76) | 38 | 149 | 355 |

Not in the lead's 27 but now unfolded because the reader got `\afterGrace` right (all three were flagged `repeats`, "reading misses"): **993** (170 to 208 bars, 171.2 to 209.7 s), **992** (205 to 406, 255.3 to 505.6), **1211** (153 to 201, 192.3 to 252.9). Also **23** and **129** were flagged for repeats their MIDI already plays (`unfold-repeats`): flag dropped, file unchanged.

Still flagged, unchanged: 1080-4, 1497-1, 1497-3, 1497-4, 1497-6, 2012, 635, 1509 (reading misses; for 1509 the published file has 3,984 notes against the source MIDI's 2,864 and the reading misses 2,001: it is not the file the .ly makes, look at how it got published), 288 (voices disagree), 2114-x and 1446 (no `\midi` score), 1080-2, 443, 1477, 1483, 1614.

## Checks

- `npx tsc --noEmit`, `npx vitest run`: green (683 tests; new: D.C. al Fine, D.S. al Coda with endings, D.C. in a first ending, named D.C., labels, `unfold-repeats`, a half-bar join with its time signature).
- Regression against the previous code on the original MIDI of all 254 catalogue Mutopia pieces with a `\repeat volta` (cached sources): about 175 give the same bytes or the same reason; of the rest, 33 are flagged pieces above, 6 are bundled (pinned, never run), 38 carry a literal `\unfoldRepeats` (`withRepeats` never calls `unfold` for them; their reading now matches), and two were already published unfolded: **mutopia-186 and 211** carry "Men. d. C." (lower case, never matched by the old regex or the `dc-ds` flag). A rebuild would now play their D.C. (186: 1296 to 1731 notes; 211: 854 to 1149) and the Trio's key returns. They are not in the overlay: the patch only reruns flagged pieces, and its input is the published (already unfolded) file. Patching them needs the Mutopia MIDI as input.
- Every note of the source is in some segment of the order (else the piece is refused), and every copied note and key is there after writing.
- Nothing heard.

## Not done / open

- D.C. or D.S. pieces **without a `\repeat volta`** are not touched (`withRepeats` still starts from `\repeat volta`); `dc-ds` stays as a flag on every unfolded D.C. piece, as for MusicXML.
- The pickup detector in `quantize.ts` decides differently for the result than for the source in 1477, 1483, 1614 (and 1080-2 if its voices were settled). That is the real blocker: the bars of the source are already off by the pickup in 1477 (true pickup 1.5 q, the app found none). Fixing it is a `quantize.ts` change, not this file.
- 443: needs a human decision on where "D.C." stops (Fine is not in the .ly).
- The reader's `\repeat unfold n { } \alternative { }` puts all passes before the endings; LilyPond interleaves them. No piece here needed it.

## Publish (not run)

From the worktree, `out-dc` is built; the base is the live `out-final3`:

```
cd /Users/mathisto/projects/piano-roller      # main checkout (script and ssh key live here)
node scripts/library/combine.mjs .cache/library/out-final3 /Users/mathisto/projects/piano-wt-dc/.cache/library/out-dc /Users/mathisto/projects/piano-wt-dc/.cache/library/combined-dc   # merge feature/dc first for the combine.mjs change, else 4 stale flags stay (27 taken, built 6c0945c94036549a)
LIBRARY_OUT=/Users/mathisto/projects/piano-wt-dc/.cache/library/combined-dc scripts/deploy-library.sh
```

`p/` goes up with `--ignore-existing`, `LICENSES.md`, then `catalog.json` last by rename (as in `rebuild.md`). `combined-dc` already exists in the worktree (its `p/` holds every file of both) (2,004 pieces, 27 taken from the overlay: 23 new files and 4 flag-only; `repeats` flags 66 to 39). Review `catalog-diff.mjs` output first. Pieces 993, 992, 1211 are the unrequested ones: drop them from the overlay's catalog if they should wait.
