# G1 re-grade: 100-anchor expansion

Branch `codex/regrade-g1-anchor-expansion`. This widens the approved source-backed training set and records why the fitted re-grade did not ship. It changes no catalogue grade or app behaviour.

## Built

- Added 20 exact live-catalogue matches from eleven additional works or collections, bringing the Henle table from 80 to 100 pieces.
- Added official Henle sources for Beethoven, Mozart, Mendelssohn, Brahms, Debussy, Liszt, Grieg, Satie and Rachmaninoff, plus Chopin's Impromptus.
- Updated the committed validation to require all 100 rows.

## Model gate

- Five-fold holdout keeps every collection or work in one fold.
- The best 80-anchor experiment reached Spearman 0.875 and 77.5% within one Henle level.
- With the 20 approved independent additions, the same approach reached 0.789 and 74.0%. The release gate remains Spearman 0.9 and 85% within one level.
- The fall confirms that the original collection-heavy estimate was optimistic. No fitted level, feature code or `gradeOverride` ships.

## Tested

- `node scripts/library/anchors.mjs .cache/library/out-src1/catalog.json`: all 100 identities match the 2,347-piece live catalogue.
- `npx vitest run src/anchors.test.ts`: the committed table passes its validation.

## Next

G1 needs a broader verified corpus or a better-specified model before another fit. The release gate does not move.
