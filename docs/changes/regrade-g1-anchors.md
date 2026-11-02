# G1 re-grade: anchor review gate

Branch `codex/regrade-g1`. This is the owner-review gate at the start of G1; it deliberately does not change a catalogue grade.

## Built

- `scripts/library/anchors.json` names 80 complete pieces in the live catalogue and records their published Henle 1–9 level. Seven also carry their placement in the current ABRSM practical syllabus.
- `docs/research/grade-anchors.md` is the review table: catalogue identity, source identity, Henle level, ABRSM grade where current, and direct primary-source links.
- `scripts/library/anchors.mjs` rejects a table outside 60–100 rows, duplicate ids, missing sources, invalid levels and ABRSM placements. Given a catalogue, it also rejects a missing or renamed piece and any fragment, accompaniment or study-lane item.
- The two Anna Magdalena rows are matched by BWV number: Anh. 114 and 115 are Henle level 1. This closes the numbering check left in the plan.

## Judgement calls

- Published Henle values are the target `lvl`; no exam-board-to-Henle conversion was invented. ABRSM is recorded only where the exact catalogue work appears in the official current syllabus.
- The upper range was expanded with Chopin ballades, etudes and nocturnes after the first 65-row set proved thin at Henle 7–9.
- Cross-validation must group a collection or work into one fold. Randomly splitting neighbouring Op. 68 or Op. 10 pieces would leak collection identity into the holdout.

## Tested

- `node scripts/library/anchors.mjs .cache/library/out-src1/catalog.json`: all 80 identities matched the 2,347-piece live build.
- `src/anchors.test.ts` keeps the committed table valid in the unit suite.

## Still gated

Owner approval of `docs/research/grade-anchors.md`. Only then: new difficulty features, grouped five-fold holdout, ordinal monotone fit, isotonic `lvl`, absolute Level 1–5 bands, Lieder piano-part grading and `gradeOverride` on anchors.
