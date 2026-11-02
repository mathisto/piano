# G1 difficulty model feasibility — 2 November 2026

## TL;DR

Do not ship an automatic re-grade. Three model families fail Piano Forte's fixed release gate even after the source-backed corpus grows from 100 to 153 exact catalogue matches across 32 independent work/source groups. Published research on a larger expert-reviewed Henle dataset also remains below the gate.

## Piano Forte results

Five folds hold an entire work or source collection out together.

| Model | Anchors | Spearman | Within one Henle level |
|---|---:|---:|---:|
| Non-negative ordinal fit | 100 | 0.789 | 74.0% |
| Non-negative ordinal fit | 153 | 0.785 | 66.7% |
| Random forest | 153 | 0.774 | 67.3% |
| Nearest neighbours | 153 | 0.762 | 57.5% |

The larger corpus disproves the hypothesis that collection concentration was the main failure. The extracted score statistics do not represent enough of performance difficulty: a model that calls Satie's Gnossienne no. 2 level 5.23 and Bach's C-major prelude level 4.18 has not learned the target construct.

## Research check

- Ramoneda et al.'s CIPI dataset contains 652 machine-readable scores with Henle 1–9 annotations, matched to public-domain scores and reviewed by an expert pianist. Their best deep ensemble reports 39.5% exact balanced accuracy and 75.3% within one level; the paper identifies fingering and expressive-performance representations as complementary.
- The 2026 difficulty-aware generation work uses calibrated Gaussian Naive Bayes over symbolic descriptors for confidence, not because it is more accurate: it reports 38.7% exact accuracy and 1.8 MSE on CIPI. A teacher found 21 misaligned labels among 100 retained, higher-confidence examples.
- The official mirdata loader describes CIPI as CC BY-NC-SA 4.0 and restricted to open research. Piano Forte's planned paid launch makes it unsuitable as production training data or a model dependency without separate permission.

Primary sources:

- https://doi.org/10.1016/j.eswa.2023.121776
- https://github.com/PRamoneda/difficulty-prediction-CIPI
- https://zenodo.org/records/8037327
- https://github.com/mir-dataset-loaders/mirdata/blob/master/mirdata/datasets/cipi.py
- https://doi.org/10.1016/j.eswa.2026.132088

## Correct next paths

1. Obtain a commercially usable expert-labelled corpus large enough to train and independently evaluate performance-aware representations; written permission for CIPI would be one route.
2. Commission human Henle-aligned grading for the catalogue, with double review on a stratified sample and adjudication of disagreements.

Do not lower the 0.9 / 85% gate, leak a collection across folds, substitute the current heuristic labels for ground truth, or ship low-confidence predictions. G2/S2 waits because its `fit()` shelves depend on a trustworthy common level.
