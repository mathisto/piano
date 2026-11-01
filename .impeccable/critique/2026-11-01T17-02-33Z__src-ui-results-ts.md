---
target: song results card, run marks, Review, Mark list, mark pop
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/mathisto/projects/piano-wt-polish1/src/ui-results.ts"
target_fingerprint: "sha256:cafc84ae86b53f0e38bdd50d2263b1eed59370effbd72360448df593c29b372f"
target_path: /Users/mathisto/projects/piano-wt-polish1/src/ui-results.ts
timestamp: 2026-11-01T17-02-33Z
slug: src-ui-results-ts
---
Method: dual-agent (A: design review, isolated · B: detector and browser evidence, isolated). Target: the song results card, run marks, Review, Mark list and mark pop at HEAD e15144e (phase 1 merge), Canon in D with misses, early and late notes and wrong keys, Nocturne and Matinée, 1180x820, 820x1180, 390x844.

## Design health (Nielsen) 23/40, Acceptable

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of status | 2 | The paper opens on bar 8 while the headline names bars 2, 6 and 7 |
| 2 | Match real world | 3 | Bar, beat, hand, pitch are good; ms and s mixed |
| 3 | User control | 3 | Fold, unfold, Escape, zoom restored |
| 4 | Consistency | 2 | HUD 83% beside "53 of 56"; legend ▶ vs paper ▹ |
| 5 | Error prevention | 2 | Learn lamp loops bars 2-3, headline says 3 and 5 |
| 6 | Recognition over recall | 2 | Headline bars not on screen; list sentences matched to paper by hand |
| 7 | Flexibility | 2 | No keys for marks; Show all timing with no Greats |
| 8 | Minimalist | 2 | Review leaves a frozen highway, music shrinks to specks |
| 9 | Error recovery | 3 | Task words, a loop offered |
| 10 | Help | 2 | Legend only in the folded bar, 14px Ink Faint |

Cognitive load: 4 of 8 fail (single focus, one thing at a time, options per decision, working memory).

## Design specificity
Authored for this product (sentence headline, the count, counts / not counted yet, marks on engraved paper). Review's layout is a floating panel over a dead highway, which undercuts "the staff is the review". Detector: 0 findings on the target files; 24 advisory on src/ (off-scale font sizes), overlay false positives (cream palette is the Matinée ground; the 12-vertex polygon is the miss glyph). axe: no violations in #res or #staff. Contrast >= 5.67:1 everywhere measured. Fine-pointer disclosure summaries 21.8px tall (44 on coarse, by design).

## Priority issues
- [P0] The paper does not show the run's marks when the card opens (it stays on the last window). Fix: reveal the first slip on open.
- [P1] The mark pop covers music, including the mark it describes (B: 1-3 heads covered for most marks at 1180; 1-2 at 390); not a live region. Fix: delete it; the sentence goes in the review bar, aria-live.
- [P1] Review gives its room to a frozen highway; the fit starts at the last revealed bar (bar 1 cut); B: the fold did not refit until a step. Fix: paper alone while folded, from bar 1.
- [P1] Early or late is unreadable at the review's size: the 5-unit shift is about 3px and puts a shape under the gap to the next quick note; wrong-key heads overlap written heads (B: 2 of 3, 5-7px apart). Fix: a pointing glyph centred under the head; displace a stray as an engraver sets a second.
- [P2] Numbers and lamp disagree: HUD % over the count; Learn loop from heat vs slip bars; "slowly" instead of a tempo.

## Persona red flags
Matt at the stand: marks and a 14px legend unreadable from the bench; headline points at bars he cannot see; contradictory voicing and fixed-velocity coach lines. VoiceOver: stepping announces only "Mark 4 of 13". Colour-blind: early vs late is 2px of position.

## Minor
Missed heads re-flash crimson on every rebuild; Show all timing with no Greats; nested Mark list scroll; "on the beat" twice in the Time line; Holds line decides nothing; Matinée disabled Perform segment pale; an unlabelled input outside #res in tab order.
