# The practice path, phase 4: adapt from the record

Branch `codex/practice-path-4`. Phase 4 of `docs/research/practice-path.md`, with the error-map and plateau slice of `docs/research/library-and-profile.md`.

## Built

- `src/profile.ts` is the shared, pure rule layer over raw attempts. Two unassisted sessions below 70% suggest the preceding unit. Five unassisted sessions averaging below 85%, with no upward first-try trend and no faster response trend where all five are timed, suggest a different task. A handled suggestion does not repeat until the original unit produces new evidence.
- `nextUp()` keeps its existing cascade, then checks drop-back, task-change, and one learning unit from the lowest Path level before the Path frontier and piece fallback. Due work still wins. Every choice keeps its reason and is written to the next history row through `by`.
- Reading sets, Sight Runs, Theory sessions and read-throughs now log stable unit ids. Scale, technique and song runs already did. Old rows without ids remain valid chart data but cannot drive a unit rule.
- Progress adds **Where it goes wrong**. Reading pitches appear after ten attempts, ranked by miss rate shrunk toward the player's mean with prior strength 8. The map shows shrunk rate, raw counts and the most frequent played-for-written pitch from `got`. **Practise these** starts a set made of exactly the three named pitches.
- Progress adds **Stuck** only when the shared five-session plateau rule applies. It says which unit has five sessions with no gain and that the recommendation changes the task.
- A song result can name a bar that was at least 30 ms early or late in at least two compatible, non-waiting takes. The copy says `2 of your 3` or `all 3`; the app keeps three takes, so it never claims five.

## Calls where the plans and code differed

- The research row's sample “4 of the last 5 runs” is impossible with `KEEP = 3`, an earlier product decision. The evidence and wording use the three retained takes rather than silently retaining more recordings.
- “No gain” is a median pairwise accuracy slope at or below zero. Timed work is not called stalled when its response-time slope is improving. These are deterministic small-sample rules, not confidence intervals; the longer-window profile remains phase 5.
- The free slot compares Path levels of strands that are already Learning. It does not manufacture a level for an untouched strand, and the piece joins only when it has been played but is not Ready.
- First units have no preceding unit, so their low-session rule has no drop-back candidate. Scale and song work can still step back by tempo.

## Tested

- Synthetic attempt logs cover the 70% boundary, assisted rows, improving accuracy, improving speed, a handled suggestion, shared Stuck output, shrinkage, and played-for-written confusion.
- A deterministic 30-day learner exercises drop-back, task-change and strand-lag choices; every offered curriculum unit has its prerequisite solid, `nextUp()` is never empty, and success is 25 of 30 (83%).
- Take tests cover `2 of 3`, `all 3`, opposing directions, waiting takes and incompatible arrangements.
- Boot is 221,923 bytes under the unchanged 223,000-byte budget; the profile rules and repeated-take analysis are lazy.
- Full e2e: 46 of 47 passed in 422 seconds; the Lied-row accompaniment check timed out under the full load, then passed alone in 55.9 seconds. All 47 features are verified, with that one load-sensitive retry recorded.

## Owner check

- On Progress after enough reading: open the error map and start **Practise these**; confirm the set contains only the named pitches.
- After two low runs on the same unit: the next reason should say to take one step back. After five flat runs: it should say to change the task and Progress should show Stuck.
- After three passes of one piece with the same bar consistently early or late: confirm the results wording says `2 of your 3` or `all 3`, never five.
