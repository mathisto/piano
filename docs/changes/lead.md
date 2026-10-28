# Lead sheet (ROADMAP "Later": lead-sheet mode)

Branch `feature/lead`. Headless Chrome only: nothing here has met an iPad, an FP-10 or real speakers.

## What it is

A fifth choice in the start card's **Notes shown** row: Full | Thin chords | Melody and bass | Melody | **Lead sheet**. The staff shows the melody alone on one staff, with a chord symbol above it where the chord changes (C, Am7, G/B, F♯dim). The left hand is gone. Offered only on a piece with a left hand. The start card, once Lead sheet is chosen, adds a switch **App plays the chords** and the line "Chords from the harmony of the piece, not the composer's marks." Help has a Lead sheet paragraph that says the same.

## Why a Notes shown level, not a view or a hand mode

- The view control is not a three-way control: `settings.view` (both / sheet / falling) is the divider position, and a view says which panes show, not what is in the song. Hand modes (Play | Listen | Hide) change who plays a note, and the left hand would still be in the song, dimmed or silent.
- Notes shown already turns a song into a smaller song (`simplify.ts`), is remembered per piece (`simp:<id>`, already in Export and Import), has its start-card row, and a one-line melody makes the staff a single clef by itself (`analyze` picks a solo staff at 97% of notes in one hand). So the level was one new case in `simplify()` and the chord symbols a new field on `Song`. A view or hand mode would have needed the same chord data and a new control as well.
- Melody: the voice part when the score names one (a folded Lied's "Singstimme", via `voiceOf`, 8 notes or more), else the top note of each right-hand chord, which is what the Melody level already does. The notes lose `part` and `also`, so the "You play" chooser does not offer the voice or the piano as parts: a lead sheet is one line.

## How the chords are read

`src/lead.ts`, `chordsOf(song)`: reuses `pedal.ts`. `pedal.ts` gave up its private window loop and template match: `windows(song)` (bars in halves, whole in odd metres) and `chordIn(song, a, b, shapes, extra)` are exported, and `changes()` now uses them (its 13 tests pass unchanged; its shapes and results are the same).
- Shapes: major, minor, dominant seventh, major seventh, minor seventh, diminished. A fourth tone must beat the triad's fit by 0.3 (`extra`), else a passing note makes every bar a seventh. Measured on the 40 bundled pieces, 2,738 chords: at no margin 47% were sevenths; at 0.3, 20% (10% dominant, 5% major, 5% minor); at 0.45, 7%. 0.3 is a judgement from reading those, not a fitted value.
- No half-diminished shape: F♯m7♭5 is a D7 with no root, so Bach's minuet read as it for a G major bar. A triad's diminished already covers the leading-tone chord.
- Slash bass: the lowest note sounding for 40% of the window, kept only if it is a tone of the chord (a passing bass is not an inversion). 31% of the survey's chords got a slash.
- `Song.chords`: `{ t, d, bar, name, keys }`, set by level 4 only, from the full song (the left hand is read, then dropped). Spelled for the song's key with `chord.ts`'s `pcName`.
- Known ceiling (`ponytail:` in the file): half-bar resolution, so a chord that changes on beat 2 or 3 is missed; two-part baroque writing (the minuet, the inventions) gives guesses, not analysis; no ninths, suspensions or chords inside a window.

## Drawing

`layout.ts` places `Layout.syms`: a symbol per chord change (and the first of each system, so a window that opens mid-chord still says which chord), above the bar numbers and clear of the highest ink in its x range (`inkTop`), and the system grows to hold them (the same headroom path as bar numbers and dynamics). Where two would touch (a pickup bar next to bar 2) the earlier is dropped. `staff.ts` paints them as `.cname`: 18px, 700, Ink Soft, `aria-hidden` by being part of the staff image.

## Play along

You play the melody (Perform scores only it, Learn waits only on it). **App plays the chords**: `Game.comp`, `Song.chords[].keys`: on each half bar the game sounds a block chord with its bass (bass in C2 to B2, chord tones in C3 to B3, velocity 0.45, held 90% of the half bar) through `audio.noteOn(..., force)`, at the tempo, like Listen. It is a separate pointer (`compI`) beside `autoI`, so the chords are not notes: not judged, not on the staff, not in the falling lanes, no wait. I did not use `accomp.ts`'s "You play the right hand": that plays the written left hand, and the lead sheet has none; chords from the harmony are what the app plays instead. A root-fifth pattern was not built; a block chord is one pattern and enough to hear the harmony.
- The switch is kept until the page reloads (not stored).
- The sampler keeps one voice per pitch, so a melody note below B3 cuts a chord tone of the same pitch (the same as Listen notes).

## DESIGN.md lines (for the lead to apply; I did not edit it)

- In Segmented control "Used for", Notes shown becomes "(Full, Thin chords, Melody and bass, Melody, Lead sheet)".
- In the Calm Staff Rule's list of aids, add "chord symbols of the Lead sheet level (Ink Soft, bold 18px, above the bar numbers; read from the harmony, so never Ink)".
- New component line: "Lead sheet: Notes shown level, melody on one staff and a chord symbol (`.cname`: Ink Soft, 18px 700) above it where the chord changes, clear of the highest ink and above the bar numbers. The start card adds an 'App plays the chords' switch (the Ghost switch's style) and the line 'Chords from the harmony of the piece, not the composer's marks.' Chords are derived, never claimed as the composer's."

## Tested

- `src/lead.test.ts` (9): chord naming on synthetic half bars (C, Am, G7, Cmaj7, Am7, F♯dim), slash basses (G/B, C/E, a passing bass dropped), flat-key spelling (B♭, E♭), a passing note not making a seventh, the block-chord keys, the level (melody kept, left hand gone, chords added, other levels carry none), a layout symbol above the staff once per change, the app playing the chords only when asked (mocked audio: nothing off; 36 48 52 55 43 55 59 50 on), and the bundled Lied lc4976849 (the melody is exactly its sung notes, no parts, more than 10 chords).
- `npx tsc --noEmit`, `npx vitest run` (56 files, 748 passed, 1 skipped), `E2E_ONLY='^7 |^11 |^15 '` (Songs, accessibility, Accompaniment: 3 of 3). Not the full suite. axe on `#play` with the Lead sheet card: no violations.
- Headless Chrome on the dev server, screenshots looked at: Brahms Wiegenlied (the bundled "melody and piano", the voice line folded into the right hand) at 820x1180 (both panes, and staff only with two systems) and 1180x820 (both panes, and staff only); Bach Minuet in G (mutopia-75) at 820x1180. Perform with App plays the chords on: the game ran 9 s at 1180x820, `compI` advanced, no console errors. Screenshots were not saved into the repo.
- What the screenshots showed and was fixed: symbols colliding at a one-beat pickup bar (earlier one dropped), and every bar reading as a seventh chord (the 0.3 margin).

## Not verified / open (ROADMAP candidates)

1. **No sound heard.** The chord playback is checked by the mocked `audio.noteOn` call list and by the game clock advancing; nobody listened. iPad and FP-10 not touched.
2. **Notes shown is hidden on a short stage.** On the default Both view at 1180x820 the stage is under 420 px and the card's container query hides the Notes shown row (e2e bug 5), so Lead sheet is reachable there only after switching view (V). Once chosen, the switch and the "Chords from the harmony" line do show. Fix would be a Notes shown control in the dock or Aids popover.
3. **The chords are guesses.** Half-bar resolution, 31% slash chords, and two-part baroque pieces read oddly (Wiegenlied bar 6 reads E♭maj7/D, a passing D). Not compared against any published chord analysis. Since compared and retuned: see `chordeval2.md` (256 analysed pieces; root right in 72% of half bars, exact 64%). Finer windows with bass-led detection would help; a human-checked set of chords per piece in the manifest would be better still.
4. **A Lead sheet or Melody run counts as a run of the piece** (`results.ts` ignores the level), so it can feed Ready and the review boxes. Unchanged from the Melody level; worth a decision.
5. **Chord symbols are not in the accessible name** of the staff image, and are not read by a screen reader.
6. **Root-fifth pattern, per-song memory of the switch, a different voice for the chords** are not built.
7. No e2e feature for this; the unit tests and the manual run above are all there is.
