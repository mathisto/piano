# Library batch pipeline (scripts/library/)

`npm run library:build -- --set mutopia|current [--grades 1-3] [--limit 500] [--out DIR]` bundles `pipeline.ts` with the app's importers (vite ssr, no new dependencies), then runs:

1. **fetch** (`build.mjs`, `lib.mjs`, `mutopia-index.mjs`): Mutopia's search table for Piano, Harpsichord and Clavichord (113 pages), then each piece page, `.mid` and `.ly`. One request a second, the existing User-Agent, every response cached under `.cache/library/http/<sha256(url)>`, so a rerun is offline (27 s) and resumes where it stopped.
2. **licence**: read from the piece's own page (Mutopia) or the file's `<rights>` (OpenScore). Allowed: `scripts/library-sources.json` `allow` plus MutopiaBSD. Composer must have died in or before year minus 71; the latest year named by the edition or composition date must be year minus 96 or earlier. The `current` set also checks the sha256 pins and the licence and dates in the sources.
3. **normalise**: Mutopia solo keyboard only (every listed instrument is piano, harpsichord, clavichord...); MusicXML keeps the keyboard parts (or the `dropParts`/`foldParts` in the sources).
4. **analyse** (`pipeline.ts`): `fromMidi`/`fromMusicXml`, gates, flags, tags, grade (`GATES`, `judge`). MIDI with 3+ tracks gets `pick` (hands by track name, else middle pitch). Repeats, D.C. and tempo marks come from the `.ly` for Mutopia MIDI.
5. **dedupe**: same composer, plus the same catalogue number or title words Jaccard >= 0.6, confirmed by top-line interval 4-grams Jaccard >= 0.6.
6. **emit**: `.cache/library/out/{catalog.json,LICENSES.md,p/<sha16>.mid|.mxl}`, sorted, no timestamps; the outcome for every candidate is in `.cache/library/report-<set>.json`.

Types: `src/catalog-types.ts`. Grade overrides: `scripts/library/overrides.json` (`{"mutopia-75": 1}`). `fetch-library.mjs` now imports its helpers from `lib.mjs` (same behaviour). Tests: `src/library-pipeline.test.ts`.

## Runs (2026-10-27)

- **current** (38): all 38 ship, ids and sha256 identical to `public/library/manifest.json`. Grades 2:7, 3:7, 4:8, 5:16. Spearman between the hand level and D is 0.64; Beginner pieces grade 2 to 3, Elementary 2 to 5, Intermediate 3 to 5.
- **mutopia**: 827 keyboard-tagged pieces (the "Piano 788" includes 87 voice and piano, 37 duets, chamber music), **638 solo keyboard**. Refused: 75 composer death unknown (57 Traditional, 13 living composers who licensed their own work, 5 without dates), 3 more on dates (died 1971, died 2016, a Mozart edition dated 1951), 29 zip-only multi-movement works. 531 analysed, 0 parse failures. Grades 1:2, 2:35, 3:62, 4:123, 5:309. 2 duplicates (BWV 928 twice, Chopin Op. 28 No. 4 twice), 1 under quality 70. **99 shipped** at grades 1 to 3 (not 500). Cold run 28 min, warm 27 s. catalog.json 70 KB, 10.9 KB brotli (110 B a row, not 47).

## Open

- The grade thresholds read high: D ranges 2.2 to 9.1 on our 38 pieces, so few pieces reach grades 1 to 3. The range term sits at its cap and the span term near it on most of them. Fit the thresholds on hand-labelled pieces before the next batch.
- Policy calls for the owner: Traditional tunes (57) and living composers' own CC/PD releases (13) are refused by the death-year rule; CC 2.5 licences (93 solo pieces) are allowed because the project allowlist has them.
- Zip-only multi-movement works (29) need a split into movements (`mutopia-N-k` ids).
- Dedupe dropped `mutopia-468` (shipped today) in favour of `mutopia-921` (higher quality) in the mutopia set; the app's ids must survive a swap, or pin the shipped ones.
- MIDI repeats are not played (LilyPond does not unfold them): 57 shipped pieces carry the `repeats` flag.
