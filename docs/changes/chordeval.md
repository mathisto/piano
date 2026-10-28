# Chord evaluation: no ground truth to evaluate against

Branch `feature/chordeval`. Result: **the corpus has almost no written harmony, so the Lead sheet's chord naming (`src/lead.ts`) was not evaluated and not changed.** The instruction was to stop at the evaluation below 30 pieces. This is the count.

## What was counted

Searched the whole live catalogue (2,241 pieces: 748 Mutopia, 1,299 OpenScore Lieder, 194 Chopin first editions) and the pipeline cache (`.cache/library/http`, 1,501 cached zips and 725 pages).

| Source of written harmony | Pieces |
|---|---|
| MusicXML `<harmony>` in the 1,493 live `.mxl` (Lieder + Chopin) | 4 pieces, 45 elements |
| ...of which a real chord symbol (root, kind, bass) | **1 piece, 1 chord** |
| MusicXML `<figured-bass>` | 1 piece (85 figures) |
| Mutopia `.ly` / `.ily` in the cache (667 files) with `\chordmode`, `\chords`, `ChordNames` | 0 |
| Mutopia with `\figuremode`, `\figures`, Roman-numeral markup | 0 (three hits are unrelated: an `includes.ily` template, a layout file, a Clementi exercise that names `figures` in a comment) |
| Humdrum `**harm` / `**mxhm` / `**chord` spines (Chopin kern sources) | 0 |

The cache and the live files agree (same 4). The 725 non-zip cache entries are Mutopia info pages; the MIDI zips carry no harmony.

### The 4 `<harmony>` pieces

- `lieder-lc6901078` Berceuse (1 element), `lieder-lc5978033` A la Fontaine (39), `lieder-lc5988382` Belle Yoli (4): all `<root-step>C</root-step><kind text="1">none</kind>` with a digit 1 to 5 in `text`. These are figure or fingering numbers that the OpenScore transcription stored as harmony with a placeholder root. They are not chords; using them would score every window against "C".
- `lieder-lc5107106` Wenn du auch zuweilen laechelst (Op. 57): one real `B7` (kind `dominant`), in bar 15. `chordsOf` reads that bar as `E♭m` (15), `F7` (14), `Bm` (16). One chord: root mismatch. That is an anecdote, not a rate. The piece is in 9/8, so the window is the whole bar and the melody there is G♭ F E♭; the annotation may itself be a transcription artefact.
- `lieder-lc6604420` Behold, Behold and Listen (Gambarini, harpsichord and voice) is the only figured-bass piece: 85 figures on one piece. Turning figures into chord roots needs the bass note plus a key-aware reading of 6, 6/4, 6/5 and so on; for one piece that is not worth the code.

## Not done, and why

- No baseline (always the key's tonic), no root / triad / exact rates, no by-piece-type split, no held-out half, no retuning of `SEVENTH` (0.3) or `BASS_SHARE` (0.4). With 1 chord in 1 piece every one of those numbers would be 0/1 or 1/1. Reporting them would be the optimism the house rules forbid.
- `src/lead.ts` and `src/pedal.ts` are unchanged. The existing claim in `lead.md` stands as it was: the chords are guesses, "not compared against any published chord analysis". That is still true.
- No harness was written: the count above is a few shell loops over `unzip -p ... | grep -c '<harmony'`, and a harness with nothing to run on is dead code. When a source arrives, the harness is small: `fromMusicXml` the score, take `chordsOf(song)`, look up the written chord at each window's start, compare root, root + triad quality, and exact incl. seventh and slash bass; baseline = `pcName(key tonic)` per window. Hold out by piece (e.g. odd ids), tune on the other half.

## What would give ground truth (suggestions, not verified; check licences before adding anything)

1. Annotated corpora of harmony written by people. From memory, unchecked here: the "When in Rome" repository (Roman-numeral analyses of Mozart, Haydn, Beethoven, Schumann, Bach chorales and others, with scores); DCML's annotated Mozart piano sonatas and Beethoven sonatas / quartets (check the NC clause against the "any free licence with credit" policy before use). Even 30 hand-analysed movements would be a real test set.
2. Lead-sheet style scores with symbols (hymns, folk and popular song books in public domain): they are the closest match to what the Lead sheet claims to produce, and `<harmony>` there is real.
3. Cheapest: hand-label bars. Pick 30 Mutopia / Lieder pieces across the grade range, write the chord per half bar in `scripts/library-sources.json` or a side file; an hour per five pieces. A held-out half by piece then works as the brief intended.

Until then, the Lead sheet's UI line "Chords from the harmony of the piece, not the composer's marks" is the right claim and should stay.

## Verified

`npx tsc --noEmit` and `npx vitest run` run on the unchanged tree (see the commit); the only change is this file. The counts were made from the live files and the cache on 2026-10-27; the one scratch test that read bar 15 of lc5107106 was deleted.
