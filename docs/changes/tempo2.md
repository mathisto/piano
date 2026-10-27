# Tempo from the .ly, and the pickup detector (branch feature/tempo2)

Follows `tempo.md`, whose two open items these are. All numbers below are from a local `npm run library:build -- --set mutopia` over the cached Mutopia pages (754 pieces ship there, more than the live corpus), compared with the same build before the change. Nothing was pushed, deployed or published; the live catalogue is untouched.

## 1. Pace of a Mutopia MIDI from its .ly

**Choice: a catalogue-level override, not rewritten bytes.** `Piece.tempo` (quarter-note bpm, `src/catalog-types.ts`) is set only for these pieces; the app passes it to `fromMidi(..., { bpm, guess })` (`libSong` -> `Stored.tempo` -> `toSong`), which scales the file's tempo map by one factor (or sets one tempo when the file has none). The MIDI file, its sha256 and its path `p/<sha16>.mid` do not change, so the content-addressed corpus, the integrity check in `pieceBytes` and every copy already kept on a device stay valid. Rewriting the event would have moved all of those and orphaned the published file.

What the pipeline does (`lyPace()` and `analyse()` in `scripts/library/pipeline.ts`):

1. A number in the .ly (`\tempo ... N=`, `tempoWholesPerMinute`) means LilyPond already wrote it into the MIDI: nothing to do.
2. Otherwise, only when the MIDI's tempo is LilyPond's default (every event exactly 60, or none): the first thing in file order that is a markup metronome mark (`\note #"4." #1 " = 112"`, read in quarters whatever the unit) or a tempo word (via `tempoWord()` from `src/musicxml.ts`, not duplicated; compound-meter factor from the MIDI's first time signature). Text is read after `\tempo`, `\mark`, `\markup`, a `^"..."`/`_"..."` script, and the header's `piece`, `meter`, `subtitle` (never title, composer, tagline). Comments are stripped first.
3. A word is a guess: flagged `tempo-estimated`. A metronome mark is the score's own number: `tempo` is set, no flag. A default-60 file whose .ly names nothing stays `no-tempo` and keeps playing at 60.
4. A movement of a zip (`mutopia-N-k`) may have been given a sibling's .ly (`pickLy` falls back to the first one); its word is used only if the new `plays()` (`repeats.ts`, the existing .ly reading checked against the MIDI's onsets) says that .ly plays this file. That dropped mutopia-276-3 (Moonlight 3rd movement, which would have got "Adagio sostenuto") and 12 Clementi fragment files whose only "tempo word" is the caption "Allegro by Corelli".

Results on the 754: `no-tempo` 330 -> 76; `tempo-estimated` 0 -> 41; 14 more take an exact number from a markup metronome mark; 55 pieces carry `tempo`. Where the rest went: the old test was `/\\tempo/`, so it also flagged 199 files that do have a tempo: 102 set `tempoWholesPerMinute`, the others take it from an `\include` or a sibling .ly (non-60 in the MIDI). Those flags are gone (a quality +3 each). Of the 330, 127 were at the default 60; 42 of them now have a pace. The other 13 of the 55 had a `\tempo` with a word and no number (`\tempo "Allegro"`): never flagged, although they played at 60. The 76 still `no-tempo` are all default-60 files whose .ly names no word or metronome.

Side effects to know about: grades were computed at the default 60, so 39 grades move, nearly all up one (e.g. mutopia-1214 3->5, 1653 3->5, 1511 3->5); `bars`/`sec` in the catalogue follow. One dedupe swap among Pictures-at-an-Exhibition duplicates (475-23 out, 475-1 in). All other shipped files and sha256 are identical.

`merge()` keeps published pieces exactly as they were, so the live catalogue only gets `tempo` for pieces added later; the existing ones need a rebuild or a patch like `repeats-patch.mjs`. Not built.

Tests: `src/library-pipeline.test.ts` (`lyPace`: numbers, comments, each text site, metronome units, no hit in title/composer/tagline; `analyse`: word -> `tempo` + flag, metronome -> no flag, number or tempo elsewhere -> untouched, nothing named -> `no-tempo`), `src/midi-tracks.test.ts` (override on a tempo-less file, whole-map scaling, no flag for an exact number).

### Not done

- Not heard: the guesses are the table values of `tempoWord()`; a word's bend is the flat 12%/8% of `tempo.md`. Where the .ly has both, the metronome number beats the word (mutopia-1516: 60, not the 84 "Andante" would give).
- 76 pieces still `no-tempo` at 60 bpm (all default 60, no word). A fallback of 100 as for MusicXML was not applied: not asked, and 60 is also what a genuine slow piece may carry.
- A MIDI with no .ly in the cache (the 50 multi-movement zips the previous note counted) keeps `hasTempo = tempos.length > 0`: a bare 60 there is taken as a real tempo.
- Numbers in quoted text ("Allegro (♩ = 120)") are not read; only `\note #"n" ... = N` in markup.

## 2. Pickup detector (`quantize()`, `src/quantize.ts`)

**Cause.** The score for a candidate pickup length `u` summed duration-weighted onsets on the would-be barlines, plus a bonus of 0.2 per onset in the piece when the last onset falls on one. For mutopia-1590 (12/8) the last onset is the final chord, half way into the last bar, so u = 3.5 got the bonus (211 of which 114 was the bonus; the true u = 0.5 scored 79). The bonus is a hint at best: only 43% of the Mutopia files end on a barline-phase onset. The same bonus put 77 pieces of 424 on a false half-bar pickup (a Bach fugue that starts on the barline got "2 beats").

**Change** (three constants, `PICKUP_*`): the end bonus is 0.02 per onset instead of 0.2; a candidate's score is divided by `1 + 0.1 * (onsets in front of its first downbeat)` (a pickup is a fragment; a half-bar shift of busy music is not); and a pickup has to reach 0.9 of the no-pickup score after that discount (it used to have to beat it by 1.4). Candidates stay every half beat. mutopia-1590 now has a 0.5 pickup and 39 bars (was 3.5 and 38).

**How it was measured.** Ground truth for Mutopia MIDI is the piece's own `\partial` in its cached .ly: 424 of the 754 have exactly one `\score` and one consistent `\partial` (or none). Detected pickup == `\partial` quarters:

| | agree | false pickup | missed pickup | wrong length |
|---|---|---|---|---|
| before | 267 (63%) | 77 | 50 | 30 |
| after | 350 (83%) | 12 | 58 | 4 |

The three constants were fitted on those same 424 pieces (a grid search showed a wide plateau: 340 to 350 across neighbouring settings, so it is not a knife edge, but it is not held-out either).

**Before/after over all 754 cached MIDI pieces** (bar count, pickup, notes of bar 1): 536 identical, 218 changed pickup, 65 changed bar count. Of the 117 changed pieces with ground truth: 89 now match the .ly and did not, 6 matched and no longer do, 22 were wrong and still are (a different wrong value); 101 changed pieces have no usable ground truth (mostly .ly files with several scores: plausible, mostly a 2-beat "pickup" dropped, not verified). Regressions: mutopia-72 (a false 0.5 pickup where there was none) and five real pickups now missed: 99-4, 445, 1024, 1616, 1935-4. Six pinned/bundled pieces change, all correctly (79, 221, 647, 998, 1540 lose a false pickup, 2146 3 -> 1).

Tests: `src/quantize.test.ts` builds engraved-style MIDI (bass and accompaniment repeating every half bar, long melody notes at the start and middle of the bar, the closing chord mid-bar) and asserts the pickup for 1 eighth in 12/8, 1 eighth and 3 eighths in 6/8, 1 quarter in 4/4 and 3/4, 1 eighth in 2/4, 2 beats in 4/4, and no pickup in 4/4, 3/4, 6/8, 12/8, 2/4. The old detector fails 7 of those 12. `src/pickup.test.ts` asserts bar count, pickup and bar-1 notes for 37 cached Mutopia files (the 13 the old detector got wrong and 24 it got right), including mutopia-1590; it passes untested where `.cache/library` has no copy. The old detector fails 13 of the 37.

### Not done

- 58 of about 122 true pickups are still missed: mostly short ones in simple textures (`\partial 4` in 4/4 or 3/4 with a few accompaniment notes), where the metric evidence is a 5 to 30% edge. mutopia-139 (`\partial 4.` in 12/8) is a pickup of exactly half a bar in symmetrical music: not decidable from the notes. Better evidence would be hands (a pickup is often one hand), bass change, or the harmony; a texture-entry cue was measured and found no better (17 of 35).
- Sixteenth-note pickups (0.25, 0.75) are not tried: candidates stay on the half beat (a quarter-beat grid found the same number of correct answers with more false ones).
- Performed (non-engraved) MIDI is only covered by the existing jittered fixtures (`waltz`, `sixEight`), which still pass; the ground-truth set is all exact files.
