# Repeats unfolded at ingestion (scripts/library/repeats.ts)

LilyPond's MIDI plays a `\repeat volta` once unless the score says `\unfoldRepeats`, so 132 shipped Mutopia pieces played each repeated section once. The pipeline now plays them out before analysis: `run()` passes every non-pinned input through `withRepeats` (the 38 bundled pieces are never touched).

**How** (`unfold(midi, ly)`): the `.ly` is read for durations only (no pitches): variables (lexical default duration), `{ }`, `<< >>`, chords, `\relative`/`\new`/`\context`, tuplets (`\times`, `\tuplet`, `\scaleDurations`), graces, `\repeat unfold|percent|tremolo`, multipliers, `\set`/`\override`/`\tempo`/`\markup` and Scheme skipped. Every `\score` with `\midi` is read (LilyPond writes one MIDI file each) and matched to the file: at most 2% of the MIDI's onsets may miss a note onset of the reading (grace notes just before a grace position are allowed). Then, per repeat: everything before it, each pass of the body with its ending (extra passes take the first ending), on to the next. Notes, pedal, tempo, meter, key and text events are copied with their stretch, and the tempo, meter, key and pedal in force are restated at each jump. Checks on the written file: the note count, the keys, and `fromMidi` bars = old bars + the bars each repeat adds (a repeat must add whole bars).

**Left flagged** (`repeats` stays, the reason is printed by the patch): nested repeats, D.C./D.S./Fine/segno and 2.24's `\volta` (by text), repeats that add a part bar, voices that disagree, a reading that misses the MIDI. A score whose MIDI has no volta (only another score in the `.ly` does, or only `\repeat volta 1`) loses the flag and keeps its file.

**Also fixed**: `@tonejs/midi` 2.0.28 writes key signatures as table index + 7 instead of the fifths; `encode()` puts them right (it broke the key of 78 pieces on the first run). `built` now hashes the shipped catalogue (the app refetches only on a new `built`, and the same inputs now ship new files).

## Patch of the published catalogue (2026-10-27)

`npx vite build --config scripts/library/vite.config.mjs && node scripts/library/repeats-patch.mjs --from <published out>` re-runs the flagged pieces through `run()` and writes `.cache/library/out-repeats/`: the changed pieces' new `p/<sha16>.mid`, `catalog.json` (same 500 pieces and ids; new file, sha256, bytes, bars, sec, notes, gradeWhy, quality, flags for the changed ones; new `built`) and `LICENSES.md` with the file names swapped. Old files are not removed. Byte-identical on rerun. Only the 102 Mutopia pages and their `.ly`/zips were fetched (about 4 minutes).

Of the 132: 13 pinned (bundled, untouched). Of 119: **89 unfolded** (new files), **5** lose the flag with the same file (mutopia-374, 989: `volta 1`; 804-2, 804-3, 1080-1: no volta in their score), **25 stay flagged**: 9 repeats that add a part bar (a `\partial` mid-piece or half-bar endings: 165, 1006, 1009, 1010, 1477, 1483, 1484, 1614, 1616), 8 D.C./D.S./Fine (191, 215, 216, 225, 441, 443, 1276, 1422), 6 read from the wrong movement's `.ly` (1080-3..6, 1497-5, 1497-6, see Open), 1 `\keepWithTag` (2012), 1 misread (993). 38 shipped pieces now carry `repeats` (was 132). One grade moved (mutopia-227 Ballade 2 to 3); grades 1:61, 2:166, 3:224, 4:48, 5:1.

Checked: Goldberg Var. 4 (3/8, both halves with first and second endings) 34 to 64 bars; Var. 16 (2/2, 3/8, 2/2) 51 to 96 with the meter changes moved to the right bars; French Suite 5 Allemande 25 to 49, 560 to 1120 notes; Gott, wie gross 17 to 21; Sonata in G, 3rd mvt 61 to 77. Bars, seconds and notes grow by the same ratio in all 89. Not heard by ear.

Tests: `src/library-repeats.test.ts` (simple repeat, first and second endings, nested and D.C. left alone, a reading that does not fit, the flag after analysis).

## Open

- Publish: copy `out-repeats/p/*` into `.cache/library/out/p/` and `catalog.json`, `LICENSES.md` over (or point `deploy-library.sh` at it); not deployed.
- A full `--set mutopia` rebuild now unfolds by itself; it was not run (cold fetch), so selection under `--limit 500` may shift a little (mutopia-972 is 1027 s now, still above the 900 s review it already had).
- Movement `.ly` choice in `build.mjs` is ambiguous by name: BWV 827 and 830 zips number the MIDI files by the master `.ly`'s scores (`BWV-827-2.mid` is its third score) while `BWV-827-2.ly` is the second movement, so tempo, D.C. and repeat marks of 6 movements come from the wrong file. Fix: hand every `.ly` of the zip to `unfold` and let the onset match pick.
- `\tag`/`\keepWithTag`, repeats that add a part bar, graces just before a repeat's first beat (the second pass plays without them).
