# Humdrum tie endpoints

**3 November 2026.** A Humdrum note may stop one tie and start the next at the same pitch. The converter previously kept only one of those two endpoints, so a tied chain could become a false re-attack in MusicXML. It now preserves both endpoints and emits the stop before the start.

Expansion lists need one further distinction: a tie leaving a repeated section can belong to one numbered ending but not another. The converter now removes that copied start only when another pass has the matching same-staff, same-pitch stop. A malformed start with no matching ending remains in the output for a strict reader to reject instead of being silently discarded. Tests cover both through-ties and pass-specific endings.

The complete 512-source Chopin build changes 39 existing notation packages: 139 intermediate notes gain the missing endpoint and one copied first-ending start is omitted on its second pass. Thirty-three attack counts are corrected. After removing only MusicXML tie elements, every old and new score is byte-identical; all 2,347 ids, ordering, tables, aliases, credits, incipits and existing content-addressed files are unchanged. Two independent builds produced byte-identical standalone outputs and the same combined catalogue, `c99223ef3bef5b55`.

Checks: `src/kern.test.ts` (20 tests), TypeScript, the complete Chopin build, structural comparison of every replacement, catalogue identity/hash audit, deterministic rerun, and the full unit suite (80 files, 1,043 tests). Publishing and live verification are recorded below after merge.
