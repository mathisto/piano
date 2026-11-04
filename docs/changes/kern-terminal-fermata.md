# Humdrum terminal fermata duration

**4 November 2026.** Chopin's Etude Op. 10 No. 5 ends in 2/4 with whole-note heads and a fermata. The Humdrum source correctly retained that engraving, but the converter also treated the graphic whole notes as four performed quarter notes. That made the last measure twice its intended length.

The converter now separates graphic value from intended duration for one narrow source-proven form: the final source measure is shorter than a whole note, every sounding stream has one whole-note onset at the bar start, and that closing sonority carries a fermata. MusicXML keeps `<type>whole</type>` while `<duration>` ends at the measure boundary. The same notation in an internal measure, without a fermata or with another onset is unchanged.

The evidence is the exact edition chain, not a score-specific exception. Chopin Online identifies `10–1b-Sm` as a reprint whose only modification is the volume's contents; its `10–1a-Sm` plate scan shows the 2/4 final bar with whole-note heads and the lower-staff fermata. MusicXML independently defines duration as intended duration and type as the graphic note value.

The complete cached 512-source Chopin build changes one shipped package, `chopin-010-1b-Sm-005`. Only measure 85's three durations change from 48 to 24 divisions; all three whole-note types and the inverted fermata remain. Its analysed duration becomes 87.9 seconds instead of 89.0. Every other catalogue identity, field, package, table, alias, credit, licence and incipit is unchanged. Two independent complete builds are byte-identical: candidate catalogue `cce6489407f16a08`, catalogue SHA-256 `767de15bfec1a39fb4a1b4ad2e09cd8f41f85814a274cf36513ad8adb2aadea2`, package SHA-256 `f443427d1fa2d87cdb47f67e8b1b204b5d8c033883513d60cda6ae95a52447f3`.

Checks: `src/kern.test.ts` (24 tests), TypeScript, the complete Chopin build twice, exact old/new MusicXML comparison, recursive output comparison and `catalog-diff`. The converter is offline build tooling, so a catalogue publish needs neither a web-shell deployment nor a TestFlight binary.

Sources: [Chopin Online 10–1b-Sm catalogue](https://chopinonline.ac.uk/aco/catalogue/etudes-opus-10/101b-sm/), [the corresponding 10–1a-Sm final score page](https://chopinonline.ac.uk/ocve/browse/pageview/78537/), [MusicXML duration](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/duration/), [MusicXML note type](https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/note-type-value/).
