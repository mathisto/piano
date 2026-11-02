# G1 re-grade: existing grading systems

Branch `codex/regrade-g1-existing-systems`. This corrects the sourcing strategy and tests the proposed algorithm class. It changes no catalogue grade or app behaviour.

## Built

- Replaced the proposed commissioned grading path with existing human-assigned ABRSM, RCM, Trinity, Henle and Piano Syllabus ranks.
- Added a one-file candidate finder that splits the three current official board PDFs by their real grade page ranges and cites each possible match by PDF page. Its output is explicitly a review queue, never training truth.
- Designed the deployable model as whole-score ordinal sequence learning with system-specific thresholds and complementary pitch, fingering and expression heads.

## Verified result

- The official-PDF queue contains 403 candidates covering 256 live catalogue pieces; exact identity verification is still required before any row is a label.
- A conservative research-only Piano Syllabus join found 497 live scores, 338 distinct labels and 188 independent work groups. It rejected 64 ambiguous joins and made no mismatch among 97 independently sourced Henle anchors it could identify.
- Five-fold grouped holdout disproved aggregate formulas: 8 features reached Spearman 0.707; 26 technical features remained 0.706; training-fold-only composer/form priors reached 0.780. All miss the unchanged 0.9 release gate.
- Published CIPI evidence corrects the next model class: a whole-piece pitch/fingering/expression ensemble reached 87.3% within one of nine levels. The prior note's 75.3% figure was not the final ensemble.
- PSyllabus and CIPI remain research/non-commercial sources. No label, grade, model or boot code shipped.
- TypeScript and all 1,034 unit tests passed; all 47 browser journeys passed in 423 seconds. The web release was verified from its public version response; the TestFlight release build is 544.

## Next

Obtain commercial-training permission for the existing multi-system ranks or independently reconstruct them from official syllabuses, then train the whole-piece multi-head ordinal ensemble. G2/S2 remains blocked until that model passes the same gate.
