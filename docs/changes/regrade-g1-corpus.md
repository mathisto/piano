# G1 re-grade: corpus and feasibility

Branch `codex/regrade-g1-anchor-corpus`. This tests the root data hypothesis and records the release decision. It changes no catalogue grade or app behaviour.

## Built

- Added 53 exact live-catalogue matches from ten additional official Henle sources, bringing the research corpus to 153 pieces across 32 independent work/source groups.
- Raised the validator's intentional ceiling from 100 to 200 and made the unit test require all 153 rows.
- Recorded the grouped results and the published benchmark in `docs/research/difficulty-model.md`.

## Verified result

- The unchanged additive model reached Spearman 0.785 and 66.7% within one level.
- A deterministic random forest reached 0.774 and 67.3%; nearest neighbours reached 0.762 and 57.5%.
- All remain below the fixed 0.9 / 85% release gate. Experimental feature and model code is not shipped.

## Next

G1 needs commercially usable expert labels or human catalogue grading. G2/S2 remains blocked because it depends on a trustworthy common level.
