# Humdrum linked slurs

**3 November 2026.** Humdrum's `!!!RDF**kern: N = linked` is an explicit cross-spine relationship: `N` immediately precedes each linked `(` or `)`, and linked starts and stops pair in source order. The converter previously ignored that declaration, so an ordinary same-voice slur could steal a linked endpoint and four source files falsely exceeded MusicXML's limit of 16 simultaneous slur numbers.

`src/kern.ts` now reads the declared signifier before the score, keeps linked endpoints out of ordinary voice stacks, and pairs their two source-order queues as Humdrum's reference implementation does. Unbalanced linked endpoints still become unpaired MusicXML for the strict reader to refuse. Tests cover a linked slur crossing spines beside an ordinary slur and concurrent linked pairs.

The complete rebundled 512-file Chopin build converts all four former 16-number refusals: 436 editions reach analysis, up from 432; 227 survive normalization, quality and deduplication, up from 226. Over live catalogue `422e6685ce72ed9e`, 27 existing pieces receive new content-addressed notation packages and no id, ordering, catalogue fact, credit, analysis field or incipit changes. The strict private reader was run against all 27 replacements: its three accepted scores remain accepted; no refusal becomes a false acceptance. The 19 unmatched-slur anchor refusals and one ambiguous-slur anchor refusal remain refusals, so this repair does not claim benchmark progress.

Checks: `src/kern.test.ts` (18 tests), TypeScript, the complete Chopin build, strict-reader comparison of every replacement, catalogue identity/hash audit, deterministic rerun, and the full unit suite. Publishing and live verification are recorded below after merge.

## Published

Pending merge.
