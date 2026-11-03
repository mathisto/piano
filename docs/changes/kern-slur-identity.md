# Humdrum slur identity

**3 November 2026.** Piano Forte's Humdrum converter used to preserve only the number of slur starts and stops on a chord. Every resulting MusicXML endpoint omitted `number`, so MusicXML read all overlapping slurs as number 1. Nested slurs, Humdrum's explicit `&` crossing levels, spine splits and repeated expansion sections could therefore be paired with the wrong endpoint.

`src/kern.ts` now retains each endpoint's Humdrum elision level, expands the score first, and then pairs endpoints in final score order. Pairing is LIFO within a voice and level; a split or join can transfer an endpoint only when the same-staff candidate, or finally the whole-part candidate, is unique. It emits MusicXML numbers 1 through 16. An ambiguous or unpaired source endpoint stays unpaired for a strict reader to reject, and a source needing more than MusicXML's 16 simultaneous identities is refused instead of guessed.

Expansion-list bars are copied before pairing, so every played copy receives its own start and stop. Chord-level slur marks are collected from every chord tone rather than collapsed to a count. Tests cover nested, crossing, split/join, repeated-section and 17-overlap cases.

The complete cached Chopin build read 512 first-edition files: 226 editions survived normalization, quality and deduplication. Laying that output over catalogue `9b71a88520e8c3a1` changes the content-addressed score file of 191 existing pieces and nothing else about any catalogue row. The candidate catalogue is `422e6685ce72ed9e`: 2,347 ids in the same order, with identical tables, aliases, credits, analysis fields and incipit sidecar. A second overlay run produced the same catalogue and sidecar hashes.

That overlay exposed two gate defects before publication. `combine.mjs` now retains the base catalogue's composer and licence indexes when replacing an existing id; without that, a standalone overlay's local indexes pointed at unrelated full-catalogue rows. `catalog-diff.mjs` still requires every replacement's file and SHA-256 to change, but correctly allows changed content to have the same byte length. The real overlay passes that gate.

Checks: `src/kern.test.ts` (16 tests), TypeScript, the complete Chopin build, the catalogue identity/hash audit, deterministic overlay rerun, and the full unit suite. Publishing and live verification are recorded below after merge.

## Published

Pending merge.
