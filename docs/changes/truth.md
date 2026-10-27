# Truth pass: where the app could mislead

Done on this branch:
- Voicing (coach.ts): `melodyHand(notes)` picks the hand with the highest note in at least 75% of the bars where both play (2+ such bars), else null. `voicing(samples, edges, melody)` compares melody hand to the other; no clear melody hand means no line. Exercises with `dyn: 'balance'` define the melody as R. Line names the hand ("the melody (left hand) ..."). Tests include a left-hand-melody fixture.
- Unchecked fingerings (scales.ts `checkNote`): the Choose a scale card and the quiz answer now say "not yet checked against a book; your teacher or book wins" (arpeggios, chromatic and rule-copied hands say "rule-derived, not yet checked"). The arpeggio text no longer reads as a standard. The old separate note in scalesView is gone (it is in `explain().why`). The quiz names only the hand asked.
- Arcade leftovers: `multiplier`/`mult` removed from judge.ts, game.ts and tests; a hit scores its grade only. Kept `combo` (the HUD "In a row") and `maxCombo` (results "longest run"). store.ts keeps the best run by accuracy (it compared the multiplied score, so old bests could block new ones). HUD accuracy now starts as a dash in ui.ts.
- Copy: grepped all UI strings; no claims of ear-training transfer, medical effect, "proven", "guaranteed" or "learn faster" were found. Only softened readthrough.ts ("Reading improves with plenty of new music ...").

Needed `main.ts` (not edited on this branch), both made since:
1. The accuracy HUD shows a dash until a note is judged (`app/stage.ts` frame loop).
2. The Ready rule: a clean run counts toward Ready and the review boxes only at 90% of the written tempo or more and without waiting (`app/results.ts`; Perform is always rate 1, no wait). Still open: the Ready tag (`ui.ts`, `library-view.ts`) carries no title saying so.
