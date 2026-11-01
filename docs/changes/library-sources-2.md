# The missing study books: sources checked, 106 pieces added, titles cleaned

Branch `feature/source1`, 1 Nov 2026. Owner's brief: "do the missing study books, anything open source, free and available". Sources were checked one by one (table below); the pipeline gained two source sets and a retitle step. Nothing was published, merged or deployed.

Output: `/Users/mathisto/projects/piano-roller/.cache/library/out-src1/` (built `8c525d19be85ec7f`), made over `out-c1` (never touched). Publish with `LIBRARY_OUT=.cache/library/out-src1 scripts/deploy-library.sh` once the owner has decided the points under "Needs the owner".

## What changed in the catalogue (`catalog-diff out-c1 out-src1`, exit 0, identity holds)

- **2,241 to 2,347 pieces** (+106), files 2,420 to 2,526, `catalog.json` 1.942 to 2.026 MB (310 to 323 KB gzipped), incipit sidecar 338 to 353 KB gzipped (every new piece has one).
- Ids, order, tables, aliases, every old file, byte and sha256 are unchanged. LICENSES.md: every old row is still there (see "Found on the way" for the 12 composer cells that moved).
- **106 added, by book:** Lemoine Op. 37 35 · Czerny Op. 599 16 · Duvernoy Op. 176 16 · Czerny Op. 299 11 · Op. 740 9 · Op. 300 3 · Op. 139 2 · Op. 849 1 · Op. 399 1 · Bertini Op. 29 3 · Schumann Op. 68 3 (Nos. 15, 17, 19) · Anna Magdalena notebook 4 (BWV Anh. 122, 124, 125, 132) · Tchaikovsky Op. 39 No. 8 · Diabelli Op. 168 No. 1.
- **By grade (new pieces):** 24 at 1, 29 at 2, 16 at 3, 19 at 4, 18 at 5. 53 of the 106 sit at grades 1 and 2, against 48 grade-1 pieces outside Lieder and studies before (library-and-profile 4.6): the thin first rung gets its supply, as studies (Lemoine, Duvernoy, Op. 599, Op. 139 mostly).
- **Licences of the new pieces:** CC0 91, Public Domain 15 (14 LilyPond from a header, 1 Public Domain Mark). No CC BY or CC BY-SA, so no new share-alike notice.
- **Kind:** studies 49 to 146 (the new books, plus the 10 Czerny Op. 840 now tagged: `kindOf` takes a composer of teaching books, `STUDY_COMPOSERS` in `kind.ts`: Czerny, Hanon, Bertini, Duvernoy, Köhler, Beyer, Lemoine, Concone, Cramer. Burgmüller, Gurlitt and Schumann's Album are repertoire and stay pieces).
- **Flags on the new pieces:** 70 have none. `dc-ds` on 19 (a D.C. in the MusicXML is not played out, as for every MusicXML score), `bar-length` 6, `hand-register` 3, `chord` 2, `no-tempo` 4, `tempo-estimated` 4, `tuplets`, `length`, `hand-share` one each.
- **Titles cleaned, 150 existing pieces** (`scripts/library/titles.json`, applied by `retitle.mjs`; files untouched):
  - Clementi Op. 42: 76 "Movement k" titles become "Art of Playing, Lesson 7: Prelude in A minor", "Lesson 23: German Hymn: variation 2 (Pleyel)" and so on. The index is the file names of Mutopia's own `clementi-op42-mids.zip` (`les07-prel-amin`, `les23-pleyel-v2`), checked against the "% LESSON" lines of its `-lys.zip` source. Same ids (`mutopia-1938-k`).
  - Clementi Op. 36 No. 1 (3 movements), Kuhlau Op. 20 No. 1 (3), Hanon (20: "The Virtuoso Pianist, Part I, No. n"), Czerny Op. 840 No. 1.
  - Burgmüller Op. 100 Nos. 1 to 18: one shape, "La Candeur, Op. 100 No. 1", and an opus of `Op. 100, No. n` (it was "Opus 100., Meter: Allegro moderato"; the book's order is from the book).
  - Schumann Op. 68 (20): English names and `Op. 68, No. n`. The old opus was "O 68 n°16", which dedupe cannot read as a catalogue number, so a second typesetting of the same piece would have shipped beside it. Now PDMX's Nos. 1 to 8, 10 to 14 and 16 are dropped as duplicates (14 of them) and only 15, 17 and 19 are new.
  - `form` is read again from the new titles (52 pieces gain one: preludes, dances, songs of the Clementi lessons).
- **Czerny Op. 840 tagged as studies: yes.** C1's rule read the technique tag only, and Mutopia styles Op. 840 "Romantic". Now by composer (above), in `run()` and in `retitle`.

## Sources: the table

Counts are pieces in the catalogue now / of the book. "Added" are this pass's. Every PDMX piece is Public Domain Mark or CC0 as its uploader marked it, with no licence conflict in PDMX, and the licence field of the score's own MuseScore data agrees (checked in `pdmx-pick.mjs --metadata`).

| Book | Found | Source | Licence | Quality notes |
|---|---|---|---|---|
| Czerny Op. 599 (100) | 16 (14 + 2 added) | Nos. 1 to 14: GitHub `DASTSAD/Czerny-op599` (LilyPond, Schirmer 1893, typeset by Daniel Studzinski, pinned commit); Nos. 63, 69: PDMX | Public Domain (each `.ly` header: `license = "Public Domain"`, "placed in the public domain by the typesetter"); CC0 | Nos. 1 to 14 are 8 to 32 bars, grades 1 to 2, fingered; tempo as typeset (half note 88, so 176 to the quarter: check by ear). No LICENSE file in the repo: owner call |
| Czerny Op. 261 | 0 | one PDMX score ("Carl Czerny Op.261", no title, 9 bars, 2 parts) | CC0 | not numbered, not taken |
| Czerny Op. 299 (40) | 11 | PDMX, Tim Roust, Robin Pannenberg and others | CC0 | Nos. 1 to 7, 9, 10, 19, 22. No. 8 held back: its one score says Op. 266 in the subtitle and runs 110 bars. Numbers outvoted by two other uploaders are dropped (a 44-bar "No. 1") |
| Czerny Op. 139 (100) | 2 | PDMX (Nos. 1, 2). `da-x/czerny` on GitHub has Nos. 1 to 3 of Op. 139 and Op. 453 in LilyPond with no licence | CC0; the GitHub repo none | the repo is not usable as is |
| Czerny Op. 777 | 0 | not found | | |
| Czerny Op. 849 (30) | 1 | PDMX No. 26 | CC0 | |
| Czerny Op. 740 (50) | 9 | PDMX Nos. 1 to 8 (Tim Roust), No. 50 | CC0 | grades 4 to 5, 60 to 114 bars |
| Czerny Op. 821 (160) | 19 (already) | Mutopia; PDMX has Nos. 1 to 11 too (not picked: nothing new) | | |
| Czerny Op. 840 (50) | 10 (already) | Mutopia | PD | now studies, titled alike |
| Czerny Op. 300, 399 | 3, 1 (extra) | PDMX | CC0 | Art of Preluding Nos. 8, 10, 24; School of the Left Hand No. 1 |
| Burgmüller Op. 100 (25) | 18 (already) | Mutopia | PD | Nos. 19 to 25 (Ave Maria to La Chevaleresque): not on Mutopia, not in PDMX (only dupes of 2, 3, 7) |
| Burgmüller Op. 109, 105 | 0 | not found | | |
| Schumann Op. 68 (43) | 23 (20 + 3) | Mutopia (CC BY-SA 2.5 to PD) and PDMX Nos. 15, 17, 19 | CC0 | Nos. 20 to 24, 27 to 31, 33 to 35, 37 to 43 have no symbolic source anywhere I could reach |
| Gurlitt Op. 82, 117, 140, 187, 210 | 0 | PDMX has three Op. 82 scores with no number (5996532, 3971246, 3882866) | CC0 | held back: no number to title them by |
| Köhler Op. 190, 218 | 0 | PDMX has an Op. 300 sonatina (5964753) and flute studies; none of these | | |
| Beyer Op. 101 | 0 | PDMX "Beyer - No. 38" (5965808): no opus, composer field empty | CC0 | held back |
| Duvernoy Op. 176 (25) | 16 | PDMX (Anes) | CC0 | Nos. 1 to 11, 13, 15, 16, 18, 19; grades 1 to 2 |
| Lemoine Op. 37 (50) | 35 | PDMX (richardpohl) | CC0 | grades 2 to 4; 18 carry `dc-ds`. Missing: 3, 8 to 11, 13, 20, 23, 24, 31, 37, 41, 46 to 48 |
| Bertini | 3 | PDMX Op. 29 Nos. 1, 3, 4 | CC0 | |
| Streabbog | 1 (already) | Mutopia (Les étoiles d'or) | PD | PDMX: one Op. 99 "La Violette", unverifiable opus, not taken |
| Türk, Handstücke | 0 | not found anywhere | | |
| Clementi Op. 36 | 3 (already: No. 1) | Mutopia; PDMX only duplicates | PD | Nos. 2 to 6 not found |
| Clementi Op. 42 | 76 (already) | Mutopia | PD | now lesson titles |
| Kuhlau sonatinas | 3 (already: Op. 20 No. 1) | Mutopia | PD | Op. 55, Op. 88 not found |
| Diabelli Op. 168 | 1 | PDMX No. 1, first movement | CC0 | Mutopia's Diabelli (36 rows) is Op. 149, piano duet |
| Bach, Little Preludes | 3 (already) | Mutopia | PD | PDMX has "9 Kleine Präludien BWV 924-932" as one 56-bar score, not taken |
| Anna Magdalena notebook | 18 of ~26 | Mutopia 14, PDMX 4 (Anh. 122, 124, 125 by C. P. E. Bach as the notebook has them; Anh. 132) | PD, CC0 | Anh. 114 to 116 duplicates dropped |
| Tchaikovsky Op. 39 (24) | 4 | Mutopia Nos. 1, 5, 16; PDMX No. 8 (Waltz) | PD | PDMX also has the whole album as one 1,982-bar score: not split |
| Kabalevsky, Bartók Mikrokosmos | skipped | not public domain | | as instructed |

### The sources, one by one

| Source | Licence and terms | Credit fields | Fetched how |
|---|---|---|---|
| Mutopia | per piece PD, CC BY, CC BY-SA; robots allows all | maintainer, source edition, licence page | already complete for this list: the index (827 piano rows, re-read 1 Nov, unchanged) holds every Czerny, Burgmüller, Kuhlau, Clementi, Schumann and Tchaikovsky row it has; the 278 rows not in the catalogue are voice, duets, ensembles and living composers |
| OpenScore | CC0; only `Lieder` and `StringQuartets` exist on GitHub (`gh api orgs/OpenScore/repos`); Orchestral is "not yet available" | `<rights>`, transcriber | nothing else to take |
| PDMX (Zenodo 15571083) | dataset CC BY 4.0 (credit "PDMX, Long et al. 2025", printed in LICENSES.md); each score keeps its uploader's Public Domain Mark or CC0 (`license` in `PDMX.csv` and in the score's metadata). 12% of PDMX carry a licence conflict: excluded. Label accuracy is the uploader's claim | uploader name and score URL from the metadata (`typesetter`, `sourceUrl`) | `PDMX.csv` 225 MB, `metadata.tar.gz` 159 MB, `mxl.tar.gz` 1.9 GB, as 6 requests (4 byte ranges of the last), read once into `.cache/library/pdmx`; nothing from musescore.com |
| GitHub LilyPond | only where the file's own header states a licence | `maintainer`, `source` header | `raw.githubusercontent.com` at a pinned commit through the existing cache (1 request a second); the MIDI made by `lilypond` 2.26.0 and cached |
| MuseScore.com | `robots.txt` disallows `/score/*/download/*`; downloads need an account (earlier research); its terms were unreadable (403) and are known to forbid scraping | | not touched |
| IMSLP | PD scans, almost no symbolic files; `robots.txt` disallows `/images/` and `/wiki/File:`, crawl-delay 2 | | not scripted (as before) |
| KernScores | `kern.humdrum.org` answers 503 with a Chopin Institute maintenance page, so it could not be read. Craig Sapp's GitHub kern repos: Mozart and Haydn sonatas and Joplin say CC BY-NC-SA 4.0 (NC); Scarlatti and Beethoven's sonatas state none I could find | | not used. None are on the list |
| piano-midi.de | answered HTTP 418, so its licence was not read (remembered as CC BY-SA); performance MIDI, not made from a score | | not used |
| Wikimedia Commons | searched the file namespace for each book: scans and audio, no symbolic scores | | |

## Pipeline changes

- `build.mjs --set open` reads `scripts/library/open-sources.json`: LilyPond files in a GitHub repo at a pinned commit. The file's own `license` header must equal the list's; the MIDI comes from `lilypondMidi` (`lib.mjs`: `LILYPOND` or PATH, cached as `<sha256 of the source>-<version>.mid`, so a rerun needs no binary). New `Piece.source` value `github`.
- `build.mjs --set pdmx` reads `scripts/library/pdmx-picks.json`, made by `pdmx-pick.mjs` (`node scripts/library/pdmx-pick.mjs PDMX.csv --metadata <dir>`): a table of books (title shape, composer with dates, opus), licence `publicdomain` or `cc-zero`, no licence conflict, the metadata's licence equal to the CSV's, a subtitle that does not name another opus or number, and uploaders who disagree outvoted. The composer and the title come from the table, never the uploader's free text. Add a book by adding a line to `BOOKS`.
- Both sets pin the published pieces of the composers they bring (`pinPublished`), so dedupe drops a second typesetting of a published piece (21 PDMX duplicates: 14 against Mutopia Op. 68, 7 between uploaders) and never moves a published one.
- `retitle.mjs` and `retitle()` (`pipeline.ts`): new titles and opus from `titles.json`, `form` and `kind` recomputed, LICENSES.md regenerated, `built` new. A stale id throws.
- `catalog-diff.mjs` now takes a catalogue that grew: old ids first and in order, tables extended only, added pieces counted by book; a title or opus may differ only for ids in `titles.json`; `form` and `kind` changes are listed, not forbidden.
- `combine.mjs` was not needed: it lays a reanalysis over the same ids, and `build.mjs --merge-with` already adds new pieces over a published output.
- LICENSES.md carries the PDMX credit and the GitHub note when those pieces are present; `SOURCE` in `credits.ts` names them.

To rebuild: `npx vite build --config scripts/library/vite.config.mjs`; `node scripts/library/retitle.mjs out-c1 out-src1-titles`; `LILYPOND=<binary> node scripts/library/build.mjs --set open --out out-src1-open --merge-with out-src1-titles`; `node scripts/library/build.mjs --set pdmx --pdmx <dir> --out out-src1 --merge-with out-src1-open`; `node scripts/library/catalog-diff.mjs out-c1 out-src1`. A second run gives byte-identical `catalog.json` and LICENSES.md (checked).

## Needs the owner

1. **PDMX as a source.** `docs/library.md` said PDMX and MuseScore were not used; this ships 92 pieces from it. They are the uploaders' own typesettings, marked CC0 or Public Domain by them, of works whose composers died by 1893. The labels are claims (PDMX's own paper does not audit them), the dataset was gathered from MuseScore.com by its authors under terms that forbid scraping, and none of the 92 names the printed edition it was typeset from. If that is more risk than wanted, the whole set is one `--set pdmx` run: leave it out.
2. **Czerny Op. 599 Nos. 1 to 14** (14 LilyPond pieces) rest on the typesetter's header, with no LICENSE file in the repo, in a repo last pushed in 2018. Same standing as a Mutopia "Public Domain" tag, but not Mutopia. Ask the typesetter, or leave them out.
3. **Held back for want of a number or an opus**, any of which the owner can number by hand from IMSLP: Gurlitt Op. 82 (PDMX 5996532, 3971246), Beyer (5965808), Czerny Op. 261 (3972061), Czerny Op. 299 No. 8 (5982347), the Bach "9 Kleine Präludien" (2910501), the Tchaikovsky Children's Album as one score (5329984).
4. **No symbolic source exists** (so the choice is OMR, which the project dropped, hand entry into MuseScore or LilyPond as CC0, or the generated drills of decision 27): Czerny Op. 261, 777 and most of 599, 139, 849, 740; Burgmüller Nos. 19 to 25 and Op. 105, 109; Gurlitt, Köhler, Beyer, Türk; Clementi Op. 36 Nos. 2 to 6; Kuhlau Op. 55, 88; Diabelli Op. 168 Nos. 2 on; Tchaikovsky Op. 39 but four; Schumann Op. 68 but 23. Cloud MuseScore scores and IMSLP files that need a login or break the sites' terms are not touched.
5. **Non-commercial:** Craig Sapp's kern repos for Mozart, Haydn and Joplin are CC BY-NC-SA 4.0; usable only with the explicit `nc` flag, and none is on the study list.
6. **The tempo of Op. 599 Nos. 1 to 14** (quarter 176) is the typesetter's `\tempo 2 = 88`; worth a listen before publishing.

## Found on the way (filed)

- **LICENSES.md of `out-c1` named 12 Lieder by the folder's composer** (for example "A Century's Penultimate" as Walter Parratt, the catalogue says Charles Wood) and kept one stale row (a Satie "Mort de Socrate" file no piece has). The regenerated file follows `catalog.json`; `catalog-diff` reports both.
- **More "Movement k" titles remain**: Bach partitas and the French Suite 3, Dussek's Six sonates faciles, Moonlight, Pictures at an Exhibition, Couperin, Royer, Froberger, the Chopin first-edition sonatas. The Mutopia stems name most of them (`movements()` only reads stems without digits); the same table-from-stems fix as Op. 42 would do them.
- **Composer rows are split** ("J. F. F. Burgmüller" and "Johann Friedrich Franz Burgmüller"; three Czerny, two Schumann): the catalogue's composer table needs a merge, which moves composer indexes, so it is a separate step.
- **Czerny Op. 821 and Hanon are still graded 3 to 5** (library-and-profile 4.1); the re-grade is its own phase.
- 19 new `dc-ds` flags: MusicXML repeats and D.C. marks are still not played out (the known importer gap).

## Checked

`npx tsc --noEmit -p .` clean (exit 0). `npx vitest run`: Test Files 71 passed | 1 skipped (72); Tests 979 passed | 4 skipped (983). New tests in `src/library-pipeline.test.ts` for the composer rule, `retitle`, `lilypondMidi` (cache and missing binary) and `pdmx-pick` (licence, conflict, scrap, mislabelled subtitle, outvoted numbers).
