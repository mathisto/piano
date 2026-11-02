# Auto from Songs and Read

## TL;DR

Auto Timing and Touch feedback now use the lower of two independent signals: the Read frontier and the Songs repertoire ceiling. An unfinished Theory, Scale or Technique requirement no longer holds a strong reader at Easy timing.

## Change

- The Read level is the first unfinished reading requirement, or level 5 when all are solid.
- The Songs level is the highest level with at least three Ready pieces. Ready still means clean runs on two different days. Starters and repertoire pieces count; studies, accompaniments and ungraded local files do not. With fewer than three Ready pieces at any one level, Songs starts at level 1.
- Auto takes the lower level. The existing level-to-standard map and every manually chosen Timing or Touch value stay unchanged.
- Settings names the two signals. The full per-strand model remains practice-path phase 5.

## Checked

- `grades.test.ts` pins the empty repertoire, Songs-lower, Read-lower and both-level-5 cases.
- `npx tsc --noEmit -p .`: clean.
- `npx vitest run`: 77 files passed, 1 skipped; 1,024 tests passed, 4 skipped.
- `E2E_ONLY='^26 ' npm run e2e`: 1 of 1 passed; Settings names both Auto signals and the level-1 scale flow still counts as before.
- `node scripts/bootmods.mjs`: 220,782 bytes under the unchanged 223,000-byte budget.
- Settings rendered without drawer overflow in Nocturne and Matinée at 1180×820, 820×1180 and 390×844; the Impeccable detector reported no findings.
