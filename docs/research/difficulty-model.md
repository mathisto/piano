# G1 difficulty model feasibility — 2 November 2026

## TL;DR

Do not ship an automatic re-grade. Aggregate score formulas fail even after expanding the verified corpus to 153 Henle pieces and testing 497 catalogue scores matched to an existing 11-level consensus syllabus. Existing human-assigned grades are the correct supervision; the next model must preserve the score as a sequence. The academic and patent prior-art screen is in `difficulty-prior-art.md`; deterministic score grading is established, so publication waits for a concrete result and a patent/FTO decision.

## Piano Forte Henle results

Five folds hold an entire work or collection together.

| Model | Pieces | Spearman | Within one Henle level |
| --- | ---: | ---: | ---: |
| Additive | 153 | 0.785 | 66.7% |
| Random forest | 153 | 0.774 | 67.3% |
| Nearest neighbours | 153 | 0.762 | 57.5% |

The larger Henle corpus disproves the hypothesis that collection concentration was the main failure. The extracted score statistics do not represent enough of performance difficulty: a model that calls Satie's Gnossienne no. 2 level 5.23 and Bach's C-major prelude level 4.18 has not learned the target construct.

## Existing grading systems test

This experiment uses grades already assigned by examination boards and repertoire specialists; it does not require new human grading.

- Current official ABRSM, RCM and Trinity piano syllabuses were split into their actual grade page ranges. A conservative candidate finder produces 403 possible rows covering 256 live catalogue pieces. These remain a review queue: no row becomes truth until its exact composer, work and movement are checked on the cited PDF page.
- The Piano Syllabus research metadata contains 7,901 pieces on a 0–10 consensus scale and preserves ranks from 13 established systems. A conservative composer/title/catalogue-number join found 497 live scores representing 338 distinct labels in 188 work groups. It rejected 64 ambiguous joins and made no mismatch among the 97 existing Henle anchors it could also identify.
- The metadata is useful for feasibility research, not production training. The paper explicitly limits the dataset to research and prohibits commercial use, even though Zenodo displays a generic CC BY 4.0 badge. Piano Forte needs written reuse permission or independently verified board citations before any derived model ships.

Five-fold holdout kept every edition and every piece from the same numbered work in one fold. The 0–10 consensus levels were also collapsed to Piano Forte bands as 0–1 → 1, 2–3 → 2, 4–5 → 3, 6–7 → 4, and 8–10 → 5.

| Representation | Spearman | Within one source level | Exact 1–5 | Within one 1–5 band |
| --- | ---: | ---: | ---: | ---: |
| Existing eight aggregate features | 0.707 | 45.5% | 43.9% | 81.9% |
| 26 aggregate technical features | 0.706 | 47.3% | 43.7% | 83.5% |
| 26 features plus fold-only composer/form priors | 0.780 | 47.5% | 45.1% | 83.3% |

More labels identify the target but do not rescue a weighted feature formula. Difficulty depends on the ordered interaction of notes, hands and passages, not only whole-piece averages and percentiles.

## Research check

- Ramoneda et al.'s CIPI dataset contains 652 machine-readable scores with Henle 1–9 annotations, matched to public-domain scores and reviewed by an expert pianist. Its best whole-piece ensemble combines pitch, inferred fingering and expressive-performance representations. It reports 39.5% exact balanced accuracy, **87.3% within one level**, and 1.1 MSE. The earlier 75.3% note confused a single fusion result with the final ensemble.
- The same paper found that training on 256-note fragments lost more than ten exact-accuracy points and roughly one MSE point. Whole-piece context matters.
- A multi-dataset sheet-music study uses one classification head per grading system rather than pretending their numeric grades share boundaries. Its multi-task model supports a shared ordering while keeping source-specific scales.
- The 2026 difficulty-aware generation work uses calibrated Gaussian Naive Bayes over symbolic descriptors for confidence, not because it is more accurate: it reports 38.7% exact accuracy and 1.8 MSE on CIPI. A teacher found 21 misaligned labels among 100 retained examples.
- CIPI and PSyllabus both carry research/non-commercial restrictions. Their methods and published metrics are evidence; their data or a model trained from it cannot ship in the planned paid app without separate permission.

## Correct algorithm and next path

1. Obtain written commercial-training permission for the existing Piano Syllabus/PSyllabus ranks, or reconstruct the matched label matrix from official board syllabuses. This replaces the rejected proposal to commission graders.
2. Preserve each source's ordinal labels instead of averaging raw grade numbers. Test a shared latent difficulty representation with one ordered threshold map per grading system; this accounts for ABRSM 0–8, Trinity 0–8, RCM 0–10 and Henle 1–9 having different boundaries. Separate multi-task heads already have prior art; the common latent calibration and leave-one-system-out result are the research question.
3. Represent the whole score as ordered per-hand note/chord events. Train complementary ordinal sequence models for pitch/rhythm, inferred fingering/gesture, and expressive markings, then ensemble their calibrated latent predictions.
4. Hold out complete numbered works and all their editions. Also run a leave-one-grading-system-out test so a board-specific head cannot disguise a bad shared ordering. The release gate remains Spearman ≥ 0.9 and ≥ 85% within one Henle level; the displayed 1–5 thresholds are fitted only after that common ordering passes.
5. Export only the frozen deterministic inference artifact into the library build. Training data, Python and model frameworks never enter the app or its boot path.

Do not lower the gate, leak a collection across folds, substitute current heuristic labels for ground truth, or treat PDMX's automatic 0–3 complexity field as an expert grade. G2/S2 waits because its `fit()` shelves depend on a trustworthy common level.

Primary sources:

- https://doi.org/10.1016/j.eswa.2023.121776
- https://arxiv.org/abs/2306.08480
- https://arxiv.org/abs/2309.16287
- https://arxiv.org/abs/2203.13010
- https://doi.org/10.1109/TASLPRO.2025.3539018
- https://zenodo.org/records/14794592
- https://pianosyllabus.com/x-help.php
- https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf
- https://rcmusic-production-strapi-media.s3.ca-central-1.amazonaws.com/piano_syllabus_2022_edition_9c6a49bb96.pdf
- https://pubweb-prod.trinitycollege.com/resource/?id=10125
- https://doi.org/10.1016/j.eswa.2026.132088
