# Humdrum fermatas

**4 November 2026.** The Humdrum converter knowingly accepted `;` but discarded it. In **kern that signifier is a pause on a note, rest or barline; dropping it erased written timing evidence from every converted Chopin score that used one.

`src/kern.ts` now emits MusicXML fermatas on notes, individual chord tones and rests, retaining `above` / `below` RDF orientation as upright / inverted. A pause on an internal Humdrum barline becomes a left MusicXML barline fermata; a final pause becomes a right barline fermata. Repeat barlines retain MusicXML's required bar-style, fermata, repeat order. Tests cover every form.

The complete cached 512-source Chopin build changes 123 shipped notation packages and adds 544 fermata elements, five on barlines. Removing only those elements and their otherwise-empty wrappers makes every replacement XML byte-identical to the live version. All 2,347 ids, ordering, metadata, licences, incipits and prior files are unchanged. Two independent builds produced byte-identical packages, catalogues and licence indexes; candidate catalogue `8c7f693628fb8dce` passes `catalog-diff`.

Checks: `src/kern.test.ts` (22 tests), TypeScript, the complete Chopin build twice, structural comparison of every replacement, catalogue identity/hash audit and the full unit suite (80 files, 1,045 tests; 1 file and 4 tests skipped). The converter is offline build tooling, so a catalogue publish needs neither a web-shell deployment nor a TestFlight binary.

Sources: [Humdrum **kern pause and barline syntax](https://www.humdrum.org/Humdrum/representations/kern.html), [MusicXML fermata](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/fermata/), [MusicXML barline](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/barline/).

## Published

Catalogue `8c7f693628fb8dce` is live. The public catalogue is byte-identical to the verified candidate, reports 2,347 pieces, and four affected score packages fetched through the public origin are byte-identical to their local files. The verified app runtime remains `5d5347c1` / TestFlight build 551.
