# Scales 2: contrary motion, chromatic, arpeggios

Code: `src/scales.ts` (generators, fingering rules, stages), `src/scales.test.ts`; `scalesView` in `src/ui.ts` (selects and fingering lines only).

- **Forms** added: `chromatic`, `arpMajor`, `arpMinor`, `dom7`, `dim7` (dom7 and dim7 are named by chord root: C dominant 7th is C E G B flat). **Hands** added: `contrary`.
- **Stats** keep `form:tonic:hands:oct`; new kinds only add keys. Stages s1 to s6 unchanged; new: s7 contrary (easy keys, 1 oct), s8 contrary (24 keys, 2 oct), s9 chromatic from C, s10 chromatic from all 12 notes, s11 triad arpeggios (easy keys), s12 all 24 triads, s13 dominant and diminished sevenths.
- **Contrary**: both hands leave one note (the unison is one note, the right hand's) and move apart. RH is its table fingering. LH copies the RH fingers unless that puts its thumb on a black key, then it keeps its own table fingering, played downwards. Melodic: RH rises with 6th and 7th raised, LH falls natural. Where the copy is not the table fingering reversed (major A flat; harmonic C sharp, F sharp, G sharp) the LH is flagged unchecked. LH keeps its own fingering in major D flat, F, F sharp, B flat, B and harmonic E flat, F, B flat, B.
- **Chromatic** (rule, any start): 3 on black keys, thumb on white; where two white keys follow (E F, B C) RH goes 1 then 2, LH 2 then 1. From C: RH 1 3 1 3 1 2 3 1 3 1 3 1 2, LH 1 3 1 3 2 1 3 1 3 1 3 2 1 (matches the convention given). Coming down each hand retraces. Sharps up, flats down, no key signature. Only C is treated as checked; other starts are unchecked.
- **Arpeggio fingering**: published group tables, not a rule (changed in `docs/changes/fingers.md`, which lists the sources, the corrections and a checklist in Alfred's order). All arpeggios stay UNCHECKED until compared with the Alfred book.
- Key signature of an arpeggio: its key; dom7 = the key a fourth up; dim7 = minor key a semitone up (dim7 spelling is approximate; no double flats).

The per-root arpeggio table that was here is now in `docs/changes/fingers.md`.
