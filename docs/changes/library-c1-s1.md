# The catalogue fix, the incipit sidecar, covers for every row, and the Songs facets

Phases C1 and S1 of `docs/research/library-and-profile.md` (section 7.2). The owner accepted decisions 11 to 22 as recommended. Branch `feature/covers1`.

## C1: the catalogue

`scripts/library/reanalyse.mjs` (with `pipeline.ts`, `kind.ts`, `combine.mjs`, `catalog-diff.mjs`) now writes, for every piece:

- **`mode`**: in `ANALYSIS` (now exported from `pipeline.ts`, with `reanalysed(p, q)`, so a test can pin it). 723 pieces state a mode and gain it. Grades, flags, bars and every other field are unchanged: `catalog-diff` shows only the new fields.
- **`meter` only when the source states it** (`Song.stated.meter`): 2,237 of 2,241; 4 Lieder lose a "4/4" the importer made up. `Piece.meter` is optional now; a cover with no metre draws its blank staff in 4/4 and its header names none.
- **`kind`** (absent is a piece): `accomp` for the 1,299 Lieder, `study` for the 39 pieces tagged technique, `fragment` for under 16 bars or under 10 seconds (33). See "Judgement calls".
- **`form`** from the title (1,528 of 2,241; 68% of the non-Lieder: the Lieder are mostly "song"), and **`period`** on each composer from the birth year (Baroque before 1720, Classical to 1785, Romantic to 1859, Modern after).
- **The raw grade features**: onsets a second, busiest bar, largest chord, chord span, range, out-of-key share, tuplet share, 16th share (`FEATURES` in `pipeline.ts`) in `features.json` beside the catalogue. They are not in `catalog.json` and the app never fetches them: that would cost every client about 33 KB gzipped for a refit that happens in the pipeline.
- **The incipit sidecar** `i/<sha16>.json`, named in `catalog.json` as `incipits`: each piece's first three bars (`src/incipit.ts`: `encode`, `decode`, `incipit`). Times are whole numbers of 1/48 quarter (240 for five pieces with quintuplets, 5040 for seven with septuplets, and the 244 pieces with a sum that is not exact to the last bit carry those numbers as they are, so the engraving is identical to the last digit). Ties, tuplets, second voices, graces, accidentals (including a written natural), articulation, slurs, a pickup bar, key changes and a part number are kept. 1.65 MB raw, **338 KB gzipped, 239 KB brotli** (the plan measured 281 KB without articulation, slurs, parts and the exact numbers). One file; sharding by level is the named upgrade if the first Songs visit measures slow on the iPad. Written by `run()` (so `build.mjs` and `merge()` carry it) and gathered across `reanalyse.mjs`'s one-piece runs; `combine.mjs` merges the two sidecars.
- A MIDI the catalogue gives no tracks for is engraved from the score as the app builds it (`autoSelect`), not from the pipeline's own analysis, whose hands differ for some pieces (mutopia-758).

Output: `/Users/mathisto/projects/piano-roller/.cache/library/out-c1/` (built 2d91850b0dd7c479; `catalog.json`, `i/f9de787fe730829f.json`, `features.json`, `p/`, `LICENSES.md`), made from `out-reanalyse` with the existing cache. `catalog-diff` against `out-reanalyse` exits 0: ids, order, tables, aliases, LICENSES.md, every file and sha256 unchanged. Differences: form 1,528, kind 1,371, mode 723, meter 4, plus the composers' `period`. `catalog.json` 1.883 to 1.942 MB (307 to 310 KB gzipped). Publish with `LIBRARY_OUT=.cache/library/out-c1 scripts/deploy-library.sh` (it already rsyncs `i/` and `features.json` before the catalogue).

## S1: covers and facets

- `drawCovers` and `paint` take their notes from the sidecar for any `lib:` id (`fromSidecar` in `cover.ts`, fetched once, lazily, never in boot; failure is not retried for 30 s). The `local()` gate is gone (`coverSong` too). An empty staff stands in until the sidecar arrives and stays for a row it has no entry for. `src/sw.ts` caches `corpus/i/*` for good.
- **Same engraving**: all 2,241 covers (thumb and card) drawn from the sidecar equal the ones drawn from the parsed file, string for string (checked against `out-c1` in a browser). `src/incipit.test.ts` and an e2e feature keep a 42-score version in the suite.
- Today's `again` and `sight` rows carry their piece's cover. Generated exercises already draw from their own notes on the start card and in the Technique preview; reading drills, Sight run and Theory show no cover anywhere, so they have none (decision 19: no new graphic).
- **Facets** (`src/facets.ts`, the engine; `library-view.ts`, the page): kind lanes (All, Pieces, Songs with voice, Studies, with counts), Level, Length, Key signature, Period, and Form and Composer under More. Every value shows its count against all the other choices and a value with nothing behind it is disabled. A result of nothing names what was asked ("No piece matches "schubert" and Baroque.") and offers up to three removals with the count each brings back, one tap. Studies have a lane of their own with a note, listed by composer and number. Typing in the search box looks in every lane unless one was chosen by hand. "Save level n for offline" saves what the list shows. The home shelves (option D) are saved selections over `meets`, `counts` and `ways`; nothing here blocks them.
- Visual spec in `DESIGN.md` (Cover, Library tools). Rendered at 1180x820 and 390x844 in both themes.

## Judgement calls

- **Fragment** is under 16 bars or under 10 seconds, not the plan's "flagged length or bar-length": `bar-length` marks 60 full Chopin works (concertos, scherzi) whose bars are uneven, and `length` also marks a 15-minute concerto.
- **Study** is the technique tag only. The plan's "any piece that is one repeated figure" was built and tried: it also took Bach's C major Prelude, Chopin Op. 28 No. 8 and two other preludes (a repeated-figure share of 0.86 to 0.91), which are repertoire. Removed rather than left misfiring.
- **Raw features in `features.json`**, not `catalog.json`, to keep every client's catalogue lean.
- **Sidecar 338 KB, not 281 KB**: fidelity (articulation, slurs, parts, exact times) was worth 57 KB; the test over all 2,241 pieces is the proof.
- Lane default: Pieces, with search widening to every lane (otherwise a Lied or a study would vanish from a search, decision 14).

## Not done, and why

- The home shelves (option D), `fit()`, `lvl`, skills: later phases.
- The Chopin first editions with a `bar-length` flag keep that flag; nothing reads it for `kind` now.
- Not checked on the iPad. The first Songs visit pays 338 KB: measure it there.
