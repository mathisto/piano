# G1 re-grade: prior art and publication gate

Branch `codex/regrade-g1-prior-art`. This is a research-only release. It changes no grade, catalogue data, model or app behaviour.

## Built

- Mapped the academic and patent prior art for deterministic score-difficulty estimation.
- Replaced the broad patent idea with a falsifiable cross-system research direction, without adding a candidate mechanism to the public repository.
- Added a publication gate: no enabling public disclosure before a concrete result receives patentability and freedom-to-operate review.

## Verified result

- Score features, local difficulty, fingering cost, whole-piece pitch/fingering/expression ensembles, multiple grading-system heads and explainable white-box models all have published prior art.
- Yousician's US 9,767,705 includes score-derived difficulty characteristics and learning from annotated pieces inside a broader performance, skill and recommendation claim. That is not an infringement finding; it is a verified reason for claim-level counsel review before G2 recommendations ship.
- Deterministic inference alone does not distinguish the method.
- The public repository already disclosed the broad shared-ordering / system-threshold direction in commit `51b96db` on 2 November 2026. Any counsel review must start from that verified disclosure date.
- No catalogue or runtime file changed.
- TypeScript and all 1,034 unit tests passed; all 47 browser journeys passed in 423 seconds. The web release was verified from its public version response; the TestFlight release build is 547.

## Next

Resolve commercial label rights, reproduce the published baselines, and run the cross-system latent-threshold experiment. A white paper needs a reproducible result; a patent review needs a concrete mechanism that materially beats those baselines.
