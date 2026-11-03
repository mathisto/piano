# G1 notation acquisition gate

Date: 3 November 2026

The private deterministic-grader repository now has one strict, outcome-free source-to-graph gate for every sealed benchmark identity. It verifies exact source evidence and refuses lossy, structurally invalid or nondeterministic notation conversion rather than grading a partial score.

The measured third-party LilyPond exporters did not satisfy that gate across the benchmark. They remain research references, not production dependencies. The next private branch implements a native adapter over LilyPond's compiler-resolved score tree and keeps the same independent equivalence and determinism checks.

No published difficulty level was opened. No grader mechanism, constant, result, fixture or ablation was copied into the public repository. No app code, catalogue grade, deployment or TestFlight build changed.
