# Roadmap reconciliation, 2 November

The public roadmap now reflects the shipped practice-path phases, learner-facing reading results, whole-row actions, catalogue facets and incipits, Studies and Packs, native iPad additions, silent pulse, boot size and current deployment state. Its Next section is reordered around device review, private deterministic G1, the blocked G2/S2 work, practice-path phase 5, sync and library quality. Resolved Dynamic Type, difficulty-scale and lead-sheet items no longer appear as future work.

The detailed grader sequence remains private. The public file says only that the mathematical/law foundation and canonical-graph phase 3a are complete and names the remaining phases. `handoff.md` now points first to the private roadmap and distinguishes runtime branches from documentation/private work so the latter do not create false deployment or TestFlight claims.

Verified with `npx vitest run`: 80 test files and 1,035 tests passed; one file and four tests were skipped. The full end-to-end run passed 47 features. No runtime, app binary or catalogue changed, so the verified live deployment remains `5d5347c1`, TestFlight build 551.
