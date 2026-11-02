# Score difficulty prior art and publication strategy — 2 November 2026

## TL;DR

Automatic, deterministic grading from score structure is an established research and patent field. Piano Forte does not yet have a defensible patent invention. It does have a worthwhile white-paper question around learning from incompatible existing grading systems and generalizing beyond them.

Do not publish further enabling algorithm details while a patent remains an option. First obtain lawful labels, implement the experiment privately, and beat the existing baselines under work-grouped and leave-one-system-out tests. If a concrete technical improvement survives, have patent counsel run a claim chart and freedom-to-operate review before a paper, public repository, talk, demo, or detailed change note discloses it.

The public repository already disclosed the broad shared-ordering / system-specific-threshold direction in commit `51b96db` on 2 November 2026. That date and the exact public text must be given to counsel. It may matter to novelty and filing deadlines. Do not add the concrete mechanism, formula, ablations or results here.

This is a technical prior-art screen, not a patentability or infringement opinion.

## What is already taken

| Concept | Verified prior art | Consequence |
| --- | --- | --- |
| Extract note, chord, rhythm, movement and polyphony features from MusicXML and assign a difficulty class | Sébastien et al., ISMIR 2012, used seven criteria, PCA and 50 piano pieces | A score-feature heuristic is not new. |
| Learn score difficulty from existing graded pieces | Chiu and Chen, 2012; Yousician's US 9,767,705 claim 1 includes learning a difficulty algorithm from manually annotated pieces as part of a performance/skill/recommendation system | Existing grades as supervision are not new. The active Yousician family is close enough to require a claim-level freedom-to-operate review before G2 recommendations ship. |
| Infer fingering and turn ergonomic motion into cost | Parncutt et al., 1997; Nakamura et al., 2007; Ramoneda et al., 2022 | Fingering cost by itself is not new. |
| Produce local or passage-level difficulty | Nakamura and Yoshii, 2018 define a time-local difficulty rate; Ramoneda et al., 2022 visualize overlapping-window difficulty; Miyaji et al., 2025 estimate bar difficulty | A difficulty envelope, worst passage, or heat map is not new by itself. |
| Combine pitch, inferred fingering and expressive-performance representations over the whole piece | CIPI, 2023 | The proposed three-head ensemble is a baseline, not an invention. |
| Train across several grading systems with a source-specific task head | Ramoneda et al., 2023 sheet-image study | Separate system heads are not new. |
| Explain a grade with a compact white-box rubric | RubricNet, 2024 | Explainability and deterministic inference are not new by themselves. |
| Use entropy as score difficulty | US 11,288,975; RubricNet also uses pitch entropy | Entropy cannot be our distinguishing feature. |

The broad claim “analyze all notes in sheet music and deterministically predict perceived grade” is therefore anticipated. A frozen learned model is deterministic at inference, but determinism is an implementation property, not the missing novelty.

## Remaining research question

The public design already calls for a common ordering across incompatible grading systems, system-specific thresholds, whole-score sequences, grouped folds and leave-one-system-out evaluation. That is a research hypothesis, not a novelty claim. Multi-task system heads, local difficulty, fingering and explainable scoring all exist separately, so a patent would require a concrete non-obvious technical mechanism and measured improvement.

Develop that mechanism in a private invention record, not this repository. The public benchmark plan is limited to reproducing the current aggregate baseline, RubricNet, the published whole-piece ensemble and the public multi-system approach. The private experiment may be compared against them only after label rights are resolved.

## Evidence gate

- No current heuristic grade may appear in the targets.
- Labels must be licensed for commercial model training or independently reconstructed from cited official sources.
- Keep every edition and every movement from one numbered work in one fold.
- Report exact accuracy, within-one accuracy, MSE and Spearman for every source system.
- Run leave-one-grading-system-out evaluation; a system-specific head cannot conceal a bad common ordering.
- Compare against simple baselines and publish negative results.
- Piano Forte's release gate stays Spearman >= 0.9 and >= 85% within one Henle level.
- Repeated training with the recorded seed and environment must reproduce the selected artifact; production inference itself must be bit-for-bit deterministic.

A paper is justified if the method gives a reproducible improvement or a useful negative result about cross-system calibration. A patent review is justified only if a specific mechanism produces a material result that the baselines do not.

## Patent and publication gate

The USPTO says a patentable utility invention must be useful, adequately described, novel and non-obvious; software also faces subject-matter eligibility. The United States provides a limited one-year inventor-disclosure grace period, but the USPTO and WIPO both warn that pre-filing disclosure can prevent protection in many other countries. A provisional establishes a filing date but is not examined and expires after 12 months unless followed by a non-provisional application.

Therefore:

1. Keep any new mechanism and results private while prototyping; the GitHub repository is public.
2. Once it beats the baselines, prepare an invention record: exact algorithm, alternatives tried, dated commits, authorship, benchmark data and ablations.
3. Ask patent counsel for a patentability search and a separate freedom-to-operate review against at least US 9,767,705 and its family. Patentability and permission to practice are different questions.
4. If counsel finds a claimable invention, file before the white paper, open-source code, public demo or detailed product explanation.
5. If not, publish the reproducible method as a white paper or defensive publication after label rights are settled.

## Primary sources

- Sébastien et al., *Score Analyzer* (ISMIR 2012), pp. 571–576: https://archives.ismir.net/ismir2012/2012_ISMIR_Proceedings.pdf
- Chiu and Chen, *A Study on Difficulty Level Recognition of Piano Sheet Music* (2012): https://doi.org/10.1109/ISM.2012.11
- Parncutt et al., ergonomic fingering model (1997): https://static.uni-graz.at/fileadmin/_Persoenliche_Webseite/parncutt_richard/Pdfs/PaSlClRaDe97_FingeringModel.pdf
- Yonebayashi et al., HMM fingering (2007): https://www.ijcai.org/Proceedings/07/Papers/469.pdf
- Nakamura and Yoshii, *Statistical piano reduction controlling performance difficulty* (2018): https://doi.org/10.1017/ATSIP.2018.18
- Ramoneda et al., fingering and local feedback (2022): https://arxiv.org/abs/2203.13010
- Ramoneda et al., CIPI whole-score ensemble (2023): https://arxiv.org/abs/2306.08480
- Ramoneda et al., multiple grading-system heads (2023): https://arxiv.org/abs/2309.16287
- Ramoneda et al., RubricNet (2024): https://arxiv.org/abs/2408.00473
- Miyaji et al., local bar difficulty (2025): https://www.apsipa.org/proceedings/2025/papers/APSIPA2025_P441.pdf
- Yousician US 9,767,705: https://patents.google.com/patent/US9767705B1/en
- Aleatoric US 11,288,975: https://patents.google.com/patent/US11288975B2/en
- USPTO patent essentials: https://www.uspto.gov/patents/basics/essentials
- USPTO provisional applications and disclosure warning: https://www.uspto.gov/patents/basics/apply/provisional-application
- WIPO, protecting inventions before disclosure: https://www.wipo.int/en/web/patents/protection
