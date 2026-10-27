# Scales 2: contrary motion, chromatic, arpeggios

Code: `src/scales.ts` (generators, fingering rules, stages), `src/scales.test.ts`; `scalesView` in `src/ui.ts` (selects and fingering lines only).

- **Forms** added: `chromatic`, `arpMajor`, `arpMinor`, `dom7`, `dim7` (dom7 and dim7 are named by chord root: C dominant 7th is C E G B flat). **Hands** added: `contrary`.
- **Stats** keep `form:tonic:hands:oct`; new kinds only add keys. Stages s1 to s6 unchanged; new: s7 contrary (easy keys, 1 oct), s8 contrary (24 keys, 2 oct), s9 chromatic from C, s10 chromatic from all 12 notes, s11 triad arpeggios (easy keys), s12 all 24 triads, s13 dominant and diminished sevenths.
- **Contrary**: both hands leave one note (the unison is one note, the right hand's) and move apart. RH is its table fingering. LH copies the RH fingers unless that puts its thumb on a black key, then it keeps its own table fingering, played downwards. Melodic: RH rises with 6th and 7th raised, LH falls natural. Where the copy is not the table fingering reversed (major A flat; harmonic C sharp, F sharp, G sharp) the LH is flagged unchecked. LH keeps its own fingering in major D flat, F, F sharp, B flat, B and harmonic E flat, F, B flat, B.
- **Chromatic** (rule, any start): 3 on black keys, thumb on white; where two white keys follow (E F, B C) RH goes 1 then 2, LH 2 then 1. From C: RH 1 3 1 3 1 2 3 1 3 1 3 1 2, LH 1 3 1 3 2 1 3 1 3 1 3 2 1 (matches the convention given). Coming down each hand retraces. Sharps up, flats down, no key signature. Only C is treated as checked; other starts are unchecked.
- **Arpeggio rule** (all UNCHECKED, both hands): RH repeats a rotation of 1-a-b(-c) each octave, thumb crossing once, top note 5 (or restarts the cycle). LH is the same rule read from the top down, plus the open shape 5 4 2 1 (2 4 5) for triads, which wins ties. Cost: thumb on black 10, 5th on black 3, 2-4 on black -0.5, 1.5 per rotation, LH starting on thumb 10. Forced exceptions: F sharp major and E flat minor are black from root to fifth.
- Key signature of an arpeggio: its key; dom7 = the key a fourth up; dim7 = minor key a semitone up (dim7 spelling is approximate; no double flats).

## Arpeggio fingering to verify against Alfred, two octaves up, RH / LH

One octave: the first 4 (triad) or 5 (seventh) fingers of the row; a RH row ending in 5 keeps that 5 as the last of them (1231235 gives 1235).

| Root | Major | Minor | Dom 7th | Dim 7th |
|---|---|---|---|---|
| C | 1231235 / 5421245 | 1231235 / 5421245 | 123412345 / 543214321 | 123412345 / 543214321 |
| D♭ | 3123123 / 2132132 | 3123123 / 2132132 | 234123412 / 214321432 | 341234123 / 214321432 |
| D | 1231235 / 5421245 | 1231235 / 5421245 | 123412345 / 543214321 | 123412345 / 543214321 |
| E♭ | 3123123 / 2132132 | 2312312 / 5421245 | 412341234 / 214321432 | 234123412 / 321432143 |
| E | 1231235 / 5421245 | 1231235 / 5421245 | 123412345 / 543214321 | 123412345 / 543214321 |
| F | 1231235 / 5421245 | 1231235 / 5421245 | 123412345 / 543214321 | 123412345 / 543214321 |
| F♯ | 2312312 / 5421245 | 3123123 / 2132132 | 234123412 / 432143214 | 341234123 / 214321432 |
| G | 1231235 / 5421245 | 1231235 / 5421245 | 123412345 / 543214321 | 123412345 / 543214321 |
| A♭ | 3123123 / 2132132 | 3123123 / 2132132 | 412341234 / 214321432 | 234123412 / 214321432 |
| A | 1231235 / 5421245 | 1231235 / 5421245 | 123412345 / 543214321 | 123412345 / 543214321 |
| B♭ | 2312312 / 2132132 | 2312312 / 3213213 | 341234123 / 214321432 | 234123412 / 321432143 |
| B | 1231235 / 5421245 | 1231235 / 5421245 | 123412345 / 543214321 | 123412345 / 543214321 |

Rows are the root note: the D♭ row is D♭ major, C♯ minor, D♭7, C♯ dim7; A♭ is G♯ minor and G♯ dim7; other rows are named as shown. Not verified in a browser on a real keyboard: nothing here has been played on the FP-10.
