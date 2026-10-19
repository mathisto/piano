# MIDI import audit: why a fan MIDI of Aerith's Theme rendered as clutter

Date: 19 Oct 2026. Scope: `src/song.ts` (`fromMidi`, `build`, `assignHands`, `estimateFifths`), `src/staff.ts`, `src/spell.ts`, `src/musicxml.ts`, `src/store.ts`. Nothing under `src/` was edited. All scratch material (generators, harness, screenshots, JSON) lives in
`/private/tmp/claude-501/-Users-mathisto-projects-piano-roller/287edaa5-51d2-4cc0-8c0f-b81240b4ecf2/scratchpad/midi-audit/`.

## TL;DR

1. **The import is not "wrong" in the parsing sense; the staff is not a notation engine.** `fromMidi` reads pitches, onsets and durations correctly (via `@tonejs/midi`, which also applies the tempo map). But the Song keeps raw performance data and `staff.ts` draws it as if it were already engraved notation. There is no quantization of onsets, no voice separation, no rests, no ties, no tuplets, no grace notes, no 8va, no clef/key/meter change display. Anything that is not already a clean one-voice-per-staff, grid-aligned score looks like garbage.
2. **Three causes dominate on typical video-game fan files, in this order of severity:**
   (a) durations are drawn raw (pedal/legato overlaps become half and whole notes at sixteenth spacing; in my piano stress file 50% of chords have a written value longer than the gap to the next onset, 13% of notes cross a barline with no tie);
   (b) every track and channel is merged into two hands (orchestral stress file: 1,200 notes, up to 43 per bar, 27% on ledger lines, stacks of 5-8 heads, notes clipped off the canvas above G6);
   (c) onsets are not snapped and chords are grouped at 10 ms, so a performance with +-30 ms jitter and rolled chords fragments (619 drawn chords vs 571 intended), and downbeats played early land in the previous bar (55 notes in the last 80 ms of a bar).
3. **There are also genuine import bugs, separate from clutter:** the two-track hand rule (any 2-track file: piano plus a low pad labels all 424 left-hand notes as Right hand), a mid-file program change (splits one piano into two "tracks" and hands by time section), drums not on channel 10 imported as pitched notes, a pickup bar that shifts every barline, flat-key leading tones spelled wrongly (C sharp in D minor is drawn D flat), and the key estimator being weighted by raw duration.
4. **A prototype normaliser (about 150 lines, importer side only, renderer untouched) removes most of the clutter** on the piano file: crossing notes 82 to 0, overfull chords 309 to 6, smeared chord pairs 51 to 0, drawn chords 619 to 560 (intended 571, minus 8 dropped graces). It does nothing for the multi-voice orchestral file, which needs track selection, voices and simplification. So the fix is a stack, not one patch.
5. **I could not reproduce the owner's file.** It is in their browser's IndexedDB. Fastest path: ship an import report that is computed from the stored bytes (Phase 0 below), so the owner opens the song and we see the track table without re-importing. A console snippet that extracts the file today is in section 10.

## 1. Method and limits

What I did:

- Read the code listed above and `@tonejs/midi` 2.0.28 (track splitting by channel and program, percussion detection, tempo and time-signature collection).
- Wrote `gen.mjs`, `gen2.mjs`, `gen3.mjs` (seeded RNG, original material, a D minor game-theme-shaped piece, no copyrighted melody) producing 20 stress files, run through the **real** `fromMidi` using vitest (`vitest.config.mjs` in the scratch dir points at the project root, `metrics.ts` imports `src/song.ts` and `src/spell.ts` directly).
- Drove the **real** staff in the dev server (`npx vite --port 5174`, 5173 untouched) with Playwright (Chrome, swiftshader flags). Files were added through the Songs page file input, opened in Learn, and the staff captured in `sheet` and `both` view at 1180x820. DOM metrics (heads, stems, beams, flags, ledgers, head columns, column gaps in viewBox units) were read from the SVG.
- Prototyped a normaliser (`improve.ts`), wrote its output to new MIDI files, and re-imported them through the same unchanged app to measure and photograph the difference.

Files (all in `files/`, `files-after/`, `files-aux/`):

| id | what it mimics |
|---|---|
| a1-piano-human | one track, 32 bars 4/4 at 72 bpm, flowing LH arpeggio (16ths bars 1-16, triplet eighths bars 17-32), LH notes ringing to the barline in pedal bars, melody with +-30 ms jitter and +-70 ms slow rubato, rolled RH chord stabs (0-45 ms), 40 ms grace notes, a mordent, a triplet quarter figure, ritard at the end |
| a2-piano-clean | same notes, melody on the grid; LH keeps +-14 ms jitter (control, not perfectly clean) |
| b-orchestral | 8 pitched tracks (2 violins, viola, cello, bass, flute, harp, choir pad) plus drums on channel 10; exact ticks; up to 20 notes ringing at once |
| c-tempo | piano on the grid with accelerando, a mid-bar tempo change, a 100 to 50 bpm ritard in one-beat steps and a half-speed last bar |
| d-ornaments | solo line with pitch-bend vibrato and CC1, 30 ms acciaccaturas, 32nd trills, a 64th tremolo bar, 8- and 17-beat notes, same-pitch overlapping retriggers, 30 ms staccato |
| e1 / e1b | 3/4 waltz with a one-beat pickup, "collapsed" (notation-software export: pickup at tick 0) and "padded" (DAW: two beats of silence) |
| e2, e3 | 6/8 with flowing eighths; mixed 6/8, 3/4, 4/4, 5/4, 7/8 |
| f1-f3 | track-structure cases: piano plus low pad; one track with a mid-file program change (format 0); piano RH/LH plus bass plus drums on channel 3 |
| g-range, h-density-04..48 | every pitch A0-C8; N evenly spaced notes per bar for N = 4..48 |

What I **cannot** claim:

- Which of these shapes the Aerith file has. It could be a sequenced game-style multi-track file (a), a recorded or hand-played piano arrangement (b), or an audio-to-MIDI transcription (c, no tempo map, no bar structure, jitter by construction). My files bracket those. Evidence is "this class of input produces this class of picture", not "your file contains this".
- Quantization numbers are measured on my files with my grid assumptions. My `improve.ts` is a measurement tool, not production code. Its triplet detection recovered only 26 of about 64 triplet beats in the human file (see 6.2), which is a result, not a hidden success.
- The "headOverlaps" DOM metric is crude (it also counts displaced seconds inside chords) so I cite column gaps and glyph counts instead. Column gaps below about 12 units mean touching noteheads (a head is about 12 units wide, one staff space is 10).
- I did not run anything on iPad. Layout depends on window size; all numbers are at 1180x820.

## 2. What the code does (reading, then confirmed by runs)

| Area | Behaviour | Where |
|---|---|---|
| Parse | `new Midi(buf)`; every non-percussion track's notes become `Raw {t, d, p, v, track}` in **seconds**. `d = max(duration, 0.03)`. Percussion is `track.channel === 9` only | `song.ts:148-156` |
| Tracks | `@tonejs/midi` splits every track by `[program, channel]`, so a program change mid-track creates extra "tracks" | `Midi.js splitTracks` |
| Hands | exactly 2 tracks: lower mean pitch is Left. Otherwise split at `settings.split` (60). A source-stated hand wins | `song.ts:51-63` |
| Bars | built from **ticks** and the time-signature list, converted to seconds through the tempo map. Bar 1 starts at tick 0. No pickup handling. One trailing empty bar when the last note ends on a barline | `song.ts:159-179` |
| Note to bar | `barAt(t + 1e-6)`, no tolerance. `beats = d / q` where `q` is the **bar-average** quarter length | `song.ts:89-92` |
| Key | first `keySignature` event, else Krumhansl-Schmuckler weighted by raw `d`; one key for the whole piece | `song.ts:119-146, 180` |
| Spelling | by key signature only: chromatic notes are sharps if `fifths >= 0`, flats if `< 0` | `spell.ts:21-36` |
| x position | **linear in time inside the bar** (`posAt`): no rhythmic spacing, no quantization | `staff.ts:178-189` |
| Chords | same `Math.round(t*100)` (10 ms) and same clef | `staff.ts:322-330` |
| Value | `quant(min beats of chord)` to {4, 3, 2, 1.5, 1, .75, .5, .25}: nothing shorter than a 16th, nothing longer than a whole, no triplet values | `staff.ts:31-32, 342` |
| Beams | only inside one beat, only when each next onset is within 6% of a beat of the **end of the previous quantized value** (so any legato overlap breaks the beam) | `staff.ts:349-369` |
| Not present | rests (only a comment), ties, tuplets, grace notes, 8va, per-bar key or meter change, two voices per staff, stem-direction by voice. Time signature drawn only at bar 1 | `grep` of `staff.ts` |
| Clef | pitch >= 64 treble, <= 55 bass, 56-63 by hand | `spell.ts:62` |
| Window | sheet view: `count = floor(avail / (70 + 15 * avg onsets per bar))`, clamped 1..4. Both view: 2 bars only if <= 22 onsets across two bars | `staff.ts:108-138` |
| Canvas | viewBox about 166 high (199 in sheet): ledger notes beyond roughly D6 and D2 simply leave the SVG | measured, section 4.9 |

One more consequence worth stating: `Song.notes` is also the scoring list. Every imported note is a key the player must hit (`judge.ts`). The orchestral file has 11.5 notes per second, so "clutter" is also an **unplayable Learn mode**. The import report and track selection fix both.

## 3. Screenshots (all in `shots/`)

Viewing order for a quick read:

- Piano, human timing, pedal bar: `shots/a1-sheet-bar9.png`. Whole and half note heads with stems at sixteenth spacing, melody downbeat missing (it was played early and belongs to the previous bar).
- Same, triplet-arpeggio bar: `shots/a1-sheet-bar17.png`. Twelve unbeamed flagged eighths, no triplet sign.
- Same piano, after the prototype normaliser: `shots/a1q-sheet-bar9.png` and `shots/a1q-sheet-bar1.png`. Beamed sixteenth groups, melody on beat one.
- Orchestral bar 8 (drum roll bar, harp, trill): `shots/b-sheet-bar8.png` and `shots/b-both-bar8-full.png` (includes the falling-note highway, also swamped). Stacks of heads on beat one, a dozen ledger lines, heads cropped off the top edge.
- Orchestral after capping chords to 4 notes: `shots/bq4-sheet-bar8.png`. Better beams, still stacked: needs voices and simplification.
- Tremolo bar: `shots/d-sheet-bar3.png`. 64 heads, 64 stems, 64 flags in one bar, a solid black slab.
- Ritard bar: `shots/c-sheet-bar15.png`. Uneven spacing from the time-linear x, plus two D flats where the key is D minor.
- Pickup collapsed: `shots/e1-sheet-bar1.png` (barlines one beat off); padded: `shots/e1b-sheet-bar1.png`.
- Mixed meters: `shots/e3-sheet-bar13.png` (7/8, fourteen flagged eighths, no meter shown).
- Clean control: `shots/a2-sheet-bar1.png`.

What MuseScore or a human engraver would show for the same bars: pedal arpeggio as beamed sixteenths (or eighth-triplets with a "3" bracket), with the pedal marked, not held notes; chords as chords; early downbeats on the downbeat; a tuplet bracket; rests where there is silence; ties across barlines; ornaments as grace notes or a `tr` mark; strings and harp on separate staves, or reduced to a piano part. None of that exists today.

## 4. Findings with numbers

Per-file static metrics (real `fromMidi`, mirrored staff grouping; totals over the file):

| file | notes | n/s | drawn chords vs intended | chords overfull (value > gap to next onset) | notes crossing a barline | notes > 25 ms off a 16th grid | < 1/16 beat | on ledger lines |
|---|---|---|---|---|---|---|---|---|
| a1 human piano | 630 | 5.7 | 619 vs 571 | 309 (50%) | 82 (13%) | 446 (71%) | 17 | 85 (13%) |
| a2 control | 630 | 5.7 | 608 vs 572 | 316 (52%) | 21 (3%) | 168 (27%) | 17 | 85 |
| b orchestral | 1200 | 11.5 | 668 vs 668 | 504 (75%) | 224 (19%) | 16 | 20 | 328 (27%) |
| c tempo map | 276 | 3.2 | 273 vs 273 | 4 | 0 | 36 (13%) | 0 | 33 |
| d ornaments | 464 | 6.7 | 447 vs 183 | 99 | 20 | 247 (53%) | 384 (83%) | 32 |
| e1 pickup collapsed | 42 | 3.1 | 36 | 2 | 2 | 0 | 0 | 6 |

"Overfull" means: after the renderer's own `quant`, the note value is longer than the time to the next chord in the same clef, so the picture claims a rhythm that cannot be played (no voices, no rests, no ties to absorb it). Max notes in one bar: a1 26, b 43, d 64.

### 4.1 Raw durations are drawn as written values (severity: highest)

Real piano files, especially arrangements with legato or sustain-simulated overlaps, have most notes ringing past the next onset. The renderer takes `quant(beats)`, so a LH arpeggio note that rings to the barline is a **whole note head at sixteenth spacing** (`shots/a1-sheet-bar9.png`). 50% of the human piano file's chords and 75% of the orchestral file's are overfull. Beaming then also fails because `touching` compares onset with the end of the quantized value (`staff.ts:364`): with legato overlap the beam run is flushed on every note, so the triplet arpeggio bar is twelve flagged eighths. Cause is in the data model (no separation of performed length and written value), not in a threshold.

### 4.2 No onset quantization, 10 ms chord grouping, no bar tolerance (severity: high for performances)

- Chord key is `Math.round(t*100)`: notes less than 10 ms apart merge, 10-45 ms apart become separate "chords" whose heads sit 1-3 viewBox units apart (about 2.6 px per unit in sheet view). Result in a1: 619 drawn vs 571 intended chords (+8.4%), 51 adjacent pairs closer than 60 ms (a rolled chord reads as a smear of stems).
- `barAt(t + 1e-6)` has no tolerance. Downbeats played 20-60 ms early are filed under the previous bar and drawn glued to its barline: a1 has 55 notes in the last 80 ms of a bar (9% of notes), against 21 in the clean control. This is why the melody's first note is missing from bar 9 in `shots/a1-sheet-bar9.png`.
- Notes cannot be nearer in x than about 12 units without colliding. In sheet view one bar is about 355 units wide, so any two non-simultaneous onsets within about 1/30 of a bar (about 100 ms at 72 bpm) overlap. That is exactly the jitter and ornament range.

### 4.3 Tuplets, ornaments, grace notes (severity: medium-high for ornamented music, high for bad cases)

- Triplets: no tuplet concept. `quant(1/3 beat)` is the 16th (`|0.25-0.333| < |0.5-0.333|`). A triplet-eighth arpeggio draws as flagged "16ths" whose spacing is right (time-linear x) but whose value is wrong, and with no bracket or "3". In a2, 140 notes sit nearer a triplet point than a 16th point, which the renderer cannot express.
- Anything shorter than a 16th is drawn as a 16th: d has 384 of 464 notes below 0.2 beat. The tremolo bar is 64 heads, 64 stems, 64 flags, minimum column gap 5 units (`shots/d-sheet-bar3.png`). Trill and turn notes are separate full notes. A 40 ms acciaccatura is a normal head on its own flag.
- The 0.03 s floor on `d` is harmless; the 10 ms chord key and the 16th floor are the issue.

### 4.4 Everything merged into two hands (severity: high for multi-track files)

All pitched tracks and channels, strings, pads, flute, harp, bass, choir, are poured into two staves. In b: 20 notes ringing together at p95, up to 43 notes per bar, 27% of notes on ledger lines, 5-8 head stacks on each downbeat (`shots/b-sheet-bar1.png`). Percussion is dropped only if its channel is 10; f3 (drums on channel 3, as some converters write them) shows 512 drum hits imported as bass-clef pitches. Pads (long five-note chords) and harp glissandi are the main noise sources: dropping the choir pad and harp would remove 672 of 1,200 notes in b.

### 4.5 Hand assignment can be flatly wrong (severity: high for correctness, medium for clutter)

Measured with `hands.test.ts`:

| case | result |
|---|---|
| 1 piano track + 1 sparse low string pad (2 tracks) | R 630 / L 96: **all 424 left-hand piano notes labelled Right**, because the pad has the lower mean and the "lower mean is Left" rule fires |
| 1 track, 1 channel, program change at bar 9 (format 0) | `splitTracks` makes two "tracks" by time: bars 1-8 all Left (171 notes, 52 of them at or above C4), bars 9+ all Right (456 notes, incl. 303 below C4) |
| 1 track, split at 60 | a1: 24 of 448 arpeggio notes (5.4%) flip to Right because chord tones reach D4 and E4; clef is still by pitch so they jump staves |
| 4 tracks | falls back to the fixed split at C4; the bass guitar joins the left hand |

Consequences: wrong cyan/pink colours, wrong Hand toggles (hiding the Left hand hides the wrong notes), wrong clef for notes 56-63 (by hand), wrong score. No per-note or per-track override exists (ROADMAP line 71 already lists this).

### 4.6 Spelling and key (severity: medium, makes the page "look wrong" to a beginner)

- Leading tones in flat minor keys are spelled as flats: `spell(61, -1)` is **D flat** (should be C sharp in D minor), `spell(66, -2)` is **G flat** in G minor. In sharp or neutral keys every chromatic note is a sharp: B flat in C major or G major is **A sharp**; A flat in C major is G sharp. This is visible in `shots/c-sheet-bar15.png` (two flats on what should be C sharps).
- Key estimator weights by raw duration, so sustained notes dominate: a D major scale plus one 20-times-longer F sharp estimates 3 sharps (A major); with a long B flat the answer is -5. Modal material (D Dorian) estimates C major (acceptable as a signature). A piece that modulates (D minor then F sharp minor) gets a single key (3 sharps) and every note of the first half becomes an accidental; the renderer never changes key signature. For a piece like this theme (modal, borrowed chords, modulating), I would expect accidentals to proliferate, but I have not verified that on the real file.
- Time signature is drawn only at bar 1, key signature never changes: in e3 (6/8, 3/4, 4/4, 5/4, 7/8) the bars look inexplicably different with no label. 7/8 gets no beaming at all (e3 bar 13: fourteen flagged eighths).

### 4.7 Tempo map: positions and values are computed in seconds, durations use a bar-average (severity: medium; high for rubato or ritard-heavy arrangements)

`@tonejs/midi` applies the tempo map correctly, so bar boundaries in seconds are right. But `q = (t1 - t0) / beatsPerBar` is the **average** quarter length of the bar, and x is time-linear in the bar. In c (ritard 100 to 50 bpm over two bars, one mid-bar change), comparing the renderer's implied beat position and duration with the true tick values: position error p95 0.13 beat, max 0.35 beat (15 of 276 notes beyond an eighth of a beat), duration error up to 0.20 beat, giving 4 notes with a wrong written value. `spb` (used for the count-in click) is the first bar's tempo only. In the screenshot (`shots/c-sheet-bar15.png`) the LH eighths visibly widen across the bar. Working in ticks inside the importer removes this.

### 4.8 Pickup and bar alignment (severity: medium for pickup files, which game themes often have)

Bar 1 starts at tick 0 always. A notation-software export puts the pickup at tick 0 with the 3/4 signature at tick 0 (MIDI has no pickup concept), so all barlines land one beat early: in `shots/e1-sheet-bar1.png` bar 1 contains the pickup and two beats of the first real bar and a half note straddles into bar 2. The padded DAW variant (`e1b`) is fine. MuseScore has an explicit "Recognize pickup measure" option for this ([MuseScore handbook](https://musescore.org/en/handbook/3/midi-import)).

### 4.9 Density, window and canvas limits (severity: medium)

From `h-density-NN` (N evenly spaced notes per bar in one hand, 1180x820):

| notes per bar | sheet view: bars shown, min column gap | both view: bars shown, min gap |
|---|---|---|
| 4 | 2 bars, 44 u | 2 bars, 84 u |
| 8 | 1 bar, 44 u | 2 bars, 42 u |
| 16 | 1 bar, 22 u | 1 bar, 42 u |
| 24 | 1 bar, 15 u | 1 bar, 29 u |
| 32 | 1 bar, 11 u (touching) | 1 bar, 21 u |
| 48 | 1 bar, 7 u (**47 colliding pairs**) | 1 bar, 14 u |

- Sheet view shows a single bar for anything above about 6 onsets per bar (`perBar = 70 + 15 * avg onsets` against about 334 units available), and then collides at roughly 32+ onsets per bar per clef. Both view is less crowded at the same density because its glyphs are smaller. The "how many notes fit" answer today: **about 24 onsets per bar is comfortable in sheet view, 32 is touching, 48 is unreadable**; both view tolerates about 48 (14 u gaps).
- Vertical clipping (`g-range`): in sheet view heads at or above G6 (MIDI 91) and at or below E-flat 1 (27) are off-canvas; in both view at or above D6 (86) and at or below B-flat 1 (34). There are no ottava lines. Orchestral flute and harp parts hit this immediately (b bar 8, `shots/b-sheet-bar8.png`, top-right heads cropped).
- `build()` plus `fromMidi` adds an empty trailing bar when the last note ends on a barline (a1 shows 33 bars for 32 written).

### 4.10 What did **not** go wrong

- Pitches, velocities, absolute timing and tempo-map-derived bar boundaries are correct (verified: c-tempo bar starts match tick math; a1 and a2 produce identical bar tables).
- Percussion on channel 10 is dropped correctly (b: 1,200 pitched notes, 0 drums).
- 6/8 and 3/4 files with clean timing render well (`e2`: 0 overfull, 17 heads, beams in dotted-quarter groups). The renderer handles clean, grid-aligned, monophonic-per-staff music fine. The failure is the distance between performance data and notation, which is exactly where a fan arrangement sits.
- Pitch bend and CC data (vibrato, mod wheel) are ignored and cause no clutter.

## 5. Root-cause ranking

Ranked by (probability the owner's file triggers it) x (visual damage) x (fix leverage). "Owner file" probability is my judgement, not a measurement.

| # | Root cause | Evidence | Severity | Likely on a fan Aerith file |
|---|---|---|---|---|
| 1 | No written-value layer: raw durations drawn, no voices, rests, ties | 50-75% overfull chords; 13-19% notes crossing barlines with no tie | very high | almost certain (any sustain-heavy arrangement) |
| 2 | Everything merged to two hands, no track or channel selection, no simplification | b: 43 notes/bar, 27% ledger, stacks of 5-8 heads, clipping | very high | likely if multi-track |
| 3 | No onset quantization; 10 ms chord key; no bar tolerance | +8% fragmentation, 55 early downbeats, smear | high | likely if recorded or transcribed |
| 4 | Hand assignment rules | f1: 424 notes mislabelled; f2: sections by program change | high (correctness) | plausible (two-track and layered files are common) |
| 5 | Dense-bar layout limits and no 8va | 32+/bar touches in sheet view; clipped above G6 | medium-high | likely at climaxes |
| 6 | Tuplets, ornaments, tremolo, grace notes forced to binary 16ths | d: 384 sub-16th notes; 64 heads in a bar | medium-high | likely (arpeggio triplets, flute runs) |
| 7 | Spelling and key: flat-key leading tones, sharp default, duration-weighted K-S, one key, no meter display | D flat for C sharp; 3-sharp pick for a modulating piece | medium | likely for a modal theme |
| 8 | Tempo map handled as time fractions with bar-average q | p95 0.13 beat, max 0.35 | medium | plausible if it has ritardandos |
| 9 | Pickup bar not recognised | e1 barlines off a beat | medium | plausible |
| 10 | Trailing bar, `spb` first tempo only, no 7/8 beams | minor | low | n/a |

Is "the import wrong"? Partly yes: causes 4, 9 and the drum-channel case are import-side errors, and 2 is an import-side omission (no choice of tracks). Causes 1, 3, 5, 6, 7 are render-side but they are fixed most cheaply **in the importer** by producing a notation layer next to the performance layer.

## 6. Prototype: what importer-side normalisation alone buys

`improve.ts` (scratch only), run on the real `fromMidi` output, re-written as MIDI (one track per hand), re-imported through the unmodified app. Steps: work in ticks; drop acciaccaturas (note under 0.11 beat followed within 0.16 beat in the same hand); cluster per clef with a 45 ms tolerance (converted to beats at the local tempo); per-beat grid scoring over 16th, triplet-eighth and 32nd grids with a small complexity penalty; notated duration = min(performed, gap to the next onset in that clef, distance to the barline), snapped to an allowed value set.

| | a1 before | a1 after | b before | b after (chords capped to 4) |
|---|---|---|---|---|
| notes | 630 | 622 (8 graces dropped) | 1200 | 1072 (128 inner chord notes removed) |
| drawn chords | 619 | 560 (= intended) | 668 | 665 |
| chords overfull | 309 | 6 | 504 | 25 |
| crossing barlines | 82 | 0 | 224 | 0 |
| smeared pairs (< 60 ms) | 51 | 0 | 0 | 0 |
| notes > 25 ms off 16th grid | 446 | 135 (legit triplet/32nd choices) | 16 | 13 |
| written value wrong by > 25% | 100 | 19 | 32 | 49 |

Visual: `shots/a1q-sheet-bar9.png` (pedal arpeggio now beamed sixteenth groups, melody on beat one) against `shots/a1-sheet-bar9.png`. For b the picture improves (beams appear, no whole-note slabs) but stacks, ledger lines and clipping remain (`shots/bq4-sheet-bar8.png`).

Honest caveats:

- Triplet detection per beat window is fragile under rubato: it found 26 triplet beats in a1 (about 64 are real) but 52 of about 64 in a2. A fixed grid cannot follow a drifting performance. Production needs **beat tracking or a tempo-curve estimate before quantizing** (MuseScore's "human performance" mode runs a beat-tracking step for unaligned files, [MuseScore handbook](https://musescore.org/en/handbook/3/midi-import)).
- Clipping every duration to the next onset in the clef collapses sustained pad notes under a moving line. That is a stand-in for real voice separation; in b the "written value wrong" count goes **up** (32 to 49) because clipped pads become sixteenths. Voices are required, not optional.
- The d tremolo and trills were dropped wholesale as "graces" (271 of 464 notes). That is the wrong default for a user who wants them; it should be a flagged, reportable choice, which is what the import report is for.

## 7. Prior art, and what is practical in a browser

- **MuseScore MIDI import** is the closest product precedent. Its dialog exposes per-track operations: quantization grid from quarter to 128th, a "max. quantization" cap with grid size that shrinks for short notes, **maximum number of voices**, **search tuplets** (applied before quantizing, so too coarse a grid hides tuplets), "is human performance" (beat tracking for unaligned files), "2x less measure count", a time-signature choice for unaligned files, **recognize pickup measure**, and **detect swing** (replace 2:1 triplet pairs with straight eighths). A recurring bug report there is non-aligned triplets going undetected. The lesson: expose these as an import step with sane per-file defaults, not hidden heuristics. [MuseScore MIDI import](https://musescore.org/en/handbook/3/midi-import), [triplet detection bug thread](https://musescore.org/en/node/81776).
- **Dorico** has a similar dialog (Detect tuplets, tuplet quantize unit); its docs advise turning off tuplet detection when you know there are none. [Dorico quantize options](https://steinberg.help/dorico/v4/en/dorico/topics/project_file_handling/project_file_handling_quantize_options_r.html).
- **music21**: `quantize` snaps events to divisors, default `(4, 3)`, meaning sixteenths and eighth-note triplets whichever is closer, which is the same grid-choice idea as `improve.ts`. Cheap and portable to TypeScript in a few dozen lines. [music21 quantization notes](https://velog.io/@clayryu328/Music211-Quantization).
- **Magenta note-seq**: default 4 steps per quarter (16th grid, no triplets), meant for ML data, not notation. [note-seq](https://github.com/magenta/note-seq). Useful only as a reminder that a fixed binary grid is the default everywhere and is exactly this app's current state.
- **Partitura** (CPJKU) keeps performance and score separate, provides pitch spelling, key identification and voice separation in Python; its docs warn that a performance MIDI should not be loaded as a score and is not expected to quantize correctly through simple loaders. The design point (two layers) is what Phase 2 below copies. [Partitura](https://arxiv.org/abs/2206.01071).
- **Performance-MIDI-to-score with transformers**: *End-to-end piano performance-MIDI to score conversion with transformers* (ISMIR 2024, code on GitHub); Score Transformer for typesetting quantized MIDI; a GNN approach that splits quantized MIDI into voices and staves. All are piano-only and server-sized. Interesting for a later optional "better engrave" model, not for a static browser app now. [arXiv 2410.00210](https://arxiv.org/html/2410.00210v1), [Score Transformer](https://arxiv.org/pdf/2112.00355).
- **Voice separation**: Kilian and Hoos (local optimisation, built for score notation, allows multi-note sonorities inside a voice) is the one aimed at notation; Chew and Wu's contig approach, Temperley's, and recent neural link-prediction models (Gray and Bunescu; the 2023 multi-trajectory paper) are perceptual. For this app a cheap rule is enough: per staff, voice 1 is the top line (skyline), voice 2 the rest, cap at 2, split sustained notes into voice 2. [Karydis et al. 2007 survey, which describes Kilian and Hoos](https://datalab-old.csd.auth.gr/~apostol/pubs/smc2007.pdf), [link-prediction voice separation](https://arxiv.org/pdf/2304.14848).
- **Pitch spelling**: Meredith's **ps13** (J. New Music Res. 2006) spells by the nearest tonic on the line of fifths weighted by nearby pitch-class frequency, 99.3% on a 196k-note corpus, beating Temperley, Longuet-Higgins, Cambouropoulos, and Chew and Chen. It is small enough to port (a windowed pitch-class histogram plus a line-of-fifths distance). Temperley-Sleator's melisma version is simpler but about 2% worse. This is the principled replacement for `spell`'s "sharp in sharp keys, flat in flat keys". [Meredith ps13](https://research.gold.ac.uk/id/eprint/1007), [Meredith and Wiggins comparison](https://archives.ismir.net/ismir2005/paper/000004.pdf).
- **Transkun** (Yan and Duan, ISMIR 2024; `pip install transkun`) is a piano audio-to-MIDI transcriber. Relevant because if the owner's "MIDI" came from an audio transcription (some fan-share sites do this), it has human-level jitter, no tempo map, **no bar structure at all**, and the default checkpoint does not extend notes by the pedal. It would behave like a1 with no tempo map. [Transkun](https://arxiv.org/abs/2404.09466).
- **Not found:** I searched for Verovio MIDI import and abcjs quantization and found nothing useful. Verovio and abcjs render encoded notation; they do not turn performance MIDI into notation, so they are not references for this problem (they remain candidate **renderers** if `staff.ts` is ever replaced).

## 8. Fix plan

Principle (Directive 2, 3): the right shape is a **two-layer Song**, performance layer (`t`, `d`, `p`, `v`, used by audio and judge) plus a notation layer (quantized onset, written value, voice, tuplet, tie flags, spelled pitch), produced by an importer pipeline with user-visible options, drawn by a staff that supports rests, ties, tuplets, voices and 8va. Phases are ordered so each stands on its own and moves the owner's file forward.

Effort figures assume this repo's pace (ROADMAP slices land at about a day each) and include tests; they are estimates, not promises.

### Phase 0: import report and original-file recovery (0.5-1 day, do first)

- Pure function `inspectMidi(bytes) -> Report` in `src/import-report.ts`: per track (name, channel, GM program name, notes, pitch range, mean pitch, notes per bar p50/p95/max, longest note, share of notes under 1/16 or over 4 beats), tempo-event count and range, time-signature list, estimated key and margin, pickup suspicion (first bar shorter than expected or first event after a downbeat), densest bar and its note count, sustained overlap ratio, same-pitch overlap count, 10-45 ms near-chord count, drum track detection by channel 10 or by GM-drum-like note numbers.
- Show it from the song row ("Import report") for songs **already stored**: the bytes are in IndexedDB, so the owner gets the table for the Aerith file without re-importing.
- Tests first: reuse the generator files in this audit as fixtures (original material, safe to commit under `src/fixtures/` or generated in the test): assert the report finds the pad track in f1, the program-change split in f2, the drums on channel 3 in f3, the pickup in e1, the 43-note bar in b.
- A "Share original MIDI" button on the song row (the iPad share sheet exists already) so a bad import is always reproducible.

### Phase 1: track and channel selection, hands (2-3 days)

- `Stored` gains `opts?: { tracks: number[] | 'auto'; hand: Record<number, 'R' | 'L' | 'auto'>; split: number; simplify?: 0..3; drums: boolean }`. `fromMidi(buf, title, id, opts)`. Bytes are already stored, so changing options re-derives the Song, non-destructively.
- Defaults chosen by the report: skip percussion (channel 10 **and** note-number heuristics), skip tracks that are pads (many simultaneous notes, long values, no melodic motion), skip tracks with under 1% of the notes; "Everything" is one click away.
- Hand rule rewrite in `assignHands`: apply the two-track rule only to the **selected** tracks and only when both tracks span a comparable register; otherwise, per-track Auto splits by pitch with hysteresis (stay in the hand you were in within +-3 semitones of the split, prefer continuity with the previous onset); per-track override is explicit. Group program-change splits back to their original track (do not trust `@tonejs/midi`'s time-sectioned tracks; merge sibling tracks that share a channel and never overlap in time).
- Tests first: f1 (piano plus pad: after default selection R 206 / L 424), f2 (one piano, hands by pitch not by time section), f3 (drums dropped).

### Phase 2: notation layer in the importer (4-6 days)

- `Raw` gains `tick`, `dtick`; the importer quantizes in **ticks and beats**, never seconds, so tempo maps stop distorting positions (fixes 4.7).
- Pipeline: (1) chord clustering at 30-50 ms scaled by local tempo; (2) beat grid: if the file is tick-aligned (most ticks on a 1/16 or 1/12 lattice) use it; else estimate a tempo curve by beat tracking (dynamic programming over inter-onset intervals, as MuseScore's "human performance" mode and as in `partitura`'s performance alignment) before snapping; (3) grid choice per beat among 16th, triplet-8th, 32nd (music21's `(4, 3)` idea plus score penalty, as in `improve.ts`), with a longer window to survive rubato; (4) written value = performed duration clipped to the voice's next onset and the barline, then snapped; (5) cross-barline notes split into **tied segments** for notation; (6) acciaccaturas and ornaments flagged rather than dropped, with a report line and a "show ornaments" option; (7) pickup detection (first bar underfull, or no events before an apparent anacrusis) shifts bar 1; (8) key estimation weighted by onset count with a duration cap (e.g. `min(d, 1 beat)`), sectioned by a sliding window so a key signature can change; (9) spelling by a ps13-style windowed algorithm instead of `spell`'s default.
- `Note` keeps `t`, `d`; adds `qb` (bar-relative quantized beat), `qd` (written value), `tuplet?: {num, den}`, `tieNext?`, `voice`, `acc` spelling. `build()` fills them. `judge.ts` and audio stay on `t` and `d`.
- Tests first (vitest, no DOM): the fixtures above with assertions that chord fragmentation is 0, overfull under 5%, no note crosses a barline untied, hand counts as in Phase 1, key signature for a2 is -1, and the spell tests `C#4 in D minor`, `F#4 in G minor`, `Bb4 in C major` (written the way a musician would, not by key signature only). Property test: `quantize` idempotent and sorted.
- Evidence this helps: section 6 (a1 crossing 82 to 0, overfull 309 to 6).

### Phase 3: staff upgrades (5-7 days)

- Extract a pure `layout(song, window) -> glyphs` from `staff.ts` and test collisions (minimum column gap, ledger-line count, clipping) in vitest, painting stays a thin SVG layer. This is the "tests first" move that makes the rest safe; today `staff.ts` is untestable without a browser.
- Draw from the notation layer: rests, ties, tuplet brackets (3 first), two voices per staff (stems up/down, shared noteheads where onsets coincide), 8va and 15ma, proper beaming per meter (6/8, 7/8, 5/4 groupings), time and key signatures at the bar where they change, grace-note small heads.
- Rhythmic spacing instead of time-linear x (spacing by written value with a minimum gap of 14 units), so dense bars widen rather than collide. Revisit `windowFor`: choose bars per system by notation width, allow bars wider than the viewport to wrap to a second system, and cap with a "too dense" fallback to Simplify.
- Acceptance: a bar of the orchestral file at Simplify level 2 shows at most 14 units min gap, no head outside the canvas, no collisions in the layout test.

### Phase 4: simplify control and melody modes (2-3 days; unusually high value for this owner)

The owner is an adult beginner, fluent in treble and not yet in bass (owner-piano-setup memory). A "Simplify" setting on the song with four levels is worth more than perfect engraving of the full texture:

0. Full (as arranged, quantized);
1. Two hands (collapse to <= 2 voices per staff, drop pad and inner-chord duplicates, cap chords at 3 notes);
2. Melody and bass (skyline for the top line, lowest note for the bass, drop everything else; arpeggios reduced to root and top);
3. Melody only (right hand skyline, with the existing hand toggles for the rest).

Skyline and bass-line extraction is a one-pass algorithm (top and bottom note per onset cluster, smoothed over the beat). Reported numbers from the prototype: capping chords to four notes removed 128 of 1,200 orchestral notes; track selection (no pad, no harp) would remove 672. Level changes are per-song, instant, and re-derive from the stored bytes.

### Phase 5: optional (1-2 weeks each, only if needed)

- Beat tracking quality (tempo curve with rubato and fermatas) beyond the simple DP; swing detection (MuseScore has it).
- A tiny ONNX performance-to-score model is possible in a browser but needs training data and licensing review; I would not start here.
- MusicXML export of the quantized Song, so the owner can check it against MuseScore (the app already imports MusicXML).

### Overall order and rationale

Phase 0 (find out what the owner's file actually is, and make every future bad import diagnosable) then Phase 1 (fixes the correctness bugs and the multi-track case) then Phase 2 (fixes the dominant clutter for piano files) then Phase 3 and 4 in parallel with the design pass. Total about 3-4 weeks of focused work for the full stack; Phases 0-2 are about 8-10 days and would already have changed the owner's experience.

## 9. Minimal import report and per-track selection UI

Opens automatically after adding a MIDI file, and from the song row ("Import options"). One dialog, no paragraphs (STRATEGY copy rules).

```
Aerith's Theme            33 bars · 4/4 · 76 bpm · Key D minor (likely)
1,200 notes · densest bar 43 (bar 8)

Tracks                              Notes   Range     Per bar   Hand
[x] Piano        Acoustic Grand      630    A0-D6      19       Auto
[ ] Choir pad    Choir Aahs          160    D2-D5       5       skip   (pad, long notes)
[x] Flute        Flute               224    D5-D7       7       R      (above the staff: 8va)
[ ] Harp         Orchestral Harp     512    D2-D6      16       skip
    Drums        Percussion (ch 10)  --     --          --      skipped
[Piano only] [Melody + bass] [Everything]

Notes for this file
 ! 17 notes shorter than a 16th (ornaments): shown as grace notes
 ! 224 notes ring across barlines: tied
 ! 55 notes are within 80 ms of a barline: moved to the beat
 ! First bar has 1 beat: treated as a pickup
 i Tempo changes: 12; first used for the count-in
Simplify  [ Full | Two hands | Melody + bass | Melody ]
[Preview densest bar]            [Cancel]  [Add]
```

Rules: nothing is silently dropped, every drop appears as a line with its count; each line toggles; presets cover the 90% case; the choice is stored in `Stored.opts` and the song re-derives from the stored bytes, so the user can fix a bad import themselves without a new file.

## 10. What we need from the owner

1. **The file, or the report.** Options in ascending effort: (a) wait for Phase 0 and open the song's Import report; (b) in Chrome on the web app (then piano.mattkelly.io), open DevTools Console on the page and run the snippet below; it downloads the stored bytes (idb-keyval default store, verified against the dev server); (c) on the iPad, nothing exists yet, so Phase 0's "Share original MIDI" is the route.

```js
const db = await new Promise((r) => { const q = indexedDB.open('keyval-store'); q.onsuccess = () => r(q.result) })
const rows = await new Promise((r) => { const q = db.transaction('keyval').objectStore('keyval').getAll(); q.onsuccess = () => r(q.result) })
const s = rows.find((x) => x?.bytes && /aerith/i.test(x.title))
const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([s.bytes])), download: s.title + '.mid' })
a.click()
```

   Please do **not** commit it (game music is not committed per `ROADMAP.md`); keep it local for the audit.
2. Where did it come from (vgmusic.com-style game rip, a MuseScore export, a YouTube or Synthesia-style hand recording, or an audio-to-MIDI transcription)? The answer picks between causes 2, 3 and 8.
3. Which device and view showed the garbage (iPad app or Chrome, Staff or Both) and a screenshot of the worst bar. The iPad app is behind main, so it may also lack recent staff changes.
4. Does the file have one track or many? In MuseScore, "Tracks" count answers this without code.
5. What would the owner want from this piece: all of it, or a learnable right-hand line first? That decides the default Simplify level.

## 11. Reproduce

All commands run from the scratch directory above.

```
node gen.mjs ./files && node gen2.mjs && node gen3.mjs               # files/, files-aux/
cd /Users/mathisto/projects/piano-roller
npx vitest run --silent=false --reporter=verbose --config <scratch>/vitest.config.mjs   # audit, hands, improve, early tests
npx vite --port 5174 &                                                # dev server for screenshots
node render.mjs files/a1-piano-human.mid a1 0,8,16                     # shots/, results/dom-*.json
ONLY=h- node aux.mjs                                                  # density and range sweeps
```

Data: `results/baseline.json` (per-bar metrics for every file), `results/improve.json` (before and after), `results/dom-*.json` (rendered glyph counts), `results/aux.json` (density and range).

## 12. Sources

- MuseScore handbook, MIDI import: https://musescore.org/en/handbook/3/midi-import
- MuseScore, non-aligned triplet detection thread: https://musescore.org/en/node/81776
- Dorico MIDI quantize options: https://steinberg.help/dorico/v4/en/dorico/topics/project_file_handling/project_file_handling_quantize_options_r.html
- music21 quantization (default divisors (4, 3)), secondary write-up: https://velog.io/@clayryu328/Music211-Quantization
- Magenta note-seq: https://github.com/magenta/note-seq
- Partitura: https://arxiv.org/abs/2206.01071
- End-to-end piano performance-MIDI to score with transformers (ISMIR 2024): https://arxiv.org/html/2410.00210v1
- Score Transformer: https://arxiv.org/pdf/2112.00355
- Voice separation survey (Karydis et al., SMC 2007): https://datalab-old.csd.auth.gr/~apostol/pubs/smc2007.pdf
- Musical voice separation as link prediction: https://arxiv.org/pdf/2304.14848
- Meredith, The ps13 pitch spelling algorithm: https://research.gold.ac.uk/id/eprint/1007
- Meredith and Wiggins, comparing pitch spelling algorithms (ISMIR 2005): https://archives.ismir.net/ismir2005/paper/000004.pdf
- Transkun (Yan and Duan, ISMIR 2024): https://arxiv.org/abs/2404.09466
- `@tonejs/midi` 2.0.28 source in `node_modules/@tonejs/midi/dist/Midi.js` and `Header.js`

Not verified: the exact behaviour of MuseScore 4 (search results were the MuseScore 3 handbook); the Verovio and abcjs question (no relevant results); music21's own documentation (only a secondary write-up was found, confirm the `(4, 3)` default there before citing it externally).
