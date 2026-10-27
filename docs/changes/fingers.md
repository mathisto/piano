# Fingerings cross-check (arpeggios, contrary motion, chromatic, the unchecked scales)

Code: `src/scales.ts` (`ARP` table and `arpeggioFingers`; the old cost-model rule and its open-shape left hand are deleted), `src/scales.test.ts` ('published group tables'). Nothing here was played on a keyboard; this is a paper check against published tables. `UNCHECKED` and the "not yet checked against a book" notes are unchanged: they mean the owner has not seen the line in the Alfred book, and that is still true of every line below.

## Result in one paragraph

Arpeggios were wrong in 45 of 96 hand-by-hand two-octave rows against what at least two independent published sources agree on, and are corrected. The left-hand tail of every white-key triad ended 2 4 5 (the app's "open shape") where every source has 4 2 1 or 3 2 1; the black-key triads put a 3 where the sources put a 4, and F♯ major and E♭ minor started on the wrong note of the group; B♭ major's left hand had its thumb on D instead of F; B♭ and D♭ dominant sevenths and every black-root diminished seventh (5 roots) had the thumb or 4th finger in the wrong place. Left alone, with the alternatives written out below: F♯ major left hand (3 against 4), the D♭ dominant seventh left hand (the ABRSM Grade 8 guide differs from two others), the A♭ major and the three sharp harmonic minors in contrary motion, and chromatic (two sources agree with the app; the Alfred book has a second chromatic pattern to compare). The six scale lines in `UNCHECKED` agree with two sources each except B minor's left hand (one source agrees, one differs on the first finger only).

## Sources

Each is one author or institution; where two look related that is said. Fingerings are read as ascending, two octaves, from the root.

| Id | Source | Notes |
|---|---|---|
| S1 | Robert T. Kelley, Arpeggio Fingering Chart, https://robertkelleyphd.com/home/arpfing.htm | "standard accepted" patterns, all 24 triads; says 3 and 4 are interchangeable |
| S2 | Escadon chart (University of Miami), via https://www.cs.miami.edu/~burt/music/finger-charts.html | root and inversions, 24 triads; one cell ("e b minor") ambiguous |
| S3 | Evansville, https://faculty.evansville.edu/gu2/Scales.htm | scales (harmonic minors) and all 24 triads; uses 4 where S1 uses 3 for D A E B left hand |
| S4 | Joy Morin, Scale and Arpeggio Fingerings, https://colorinmypiano.com/download/scale__arpeggio_fingerings_for_piano_2_octave.pdf | full two-octave strings; groups match the Alfred contents page, possibly drawn on it; gives an alternative B♭ |
| S5 | D. P. Horn, Wheaton College, Fingerings for Arpeggios (Feb 2008), https://www.wheaton.edu/media/migrated-images-amp-files/media/files/academics/faculty/horn-dp/DPH-FINGERINGS-FOR-ARPEGGIOS.pdf (blocked directly; read from the Wayback copy) | triads, dominant and diminished sevenths; diminished sevenths are a one-line rule |
| S6 | Baylor Piano Basics (CC BY-NC-SA), https://openbooks.library.baylor.edu/pianobasics/chapter/d-flat-a-flat-and-e-flat-major-arpeggios/ and chapters `b-flat-major-arpeggio`, `g-flat-major-arpeggio`, `dominant-seventh-chord-arpeggios`, `fully-diminished-seventh-chord-arpeggios` | the appendices with all keys 404; chapters cover D♭ A♭ E♭ B♭ G♭, white-key sevenths |
| S7 | Piano Play It, https://www.piano-play-it.com/arpeggios.html | triad groups, dominant sevenths per group; names F♯ major and E♭ minor as exceptions |
| S8 | Fergus Black, Guide to Playing Dominant Seventh Arpeggios for ABRSM Grade 8 (2011), https://wwwdox.s3.amazonaws.com/fb/resources/guide-to-playing-dominant-7ths-for-piano.pdf | printed notation, read from the page images; named by KEY (the dominant of B is F♯7), so read here by chord |
| S9 | Fergus Black, the same for diminished sevenths, https://wwwdox.s3.amazonaws.com/fb/resources/guide-to-playing-diminished-7ths-for-piano.pdf | printed notation for the five black roots |
| S10 | Do Re Mi Studios, https://doremistudios.com.au/piano-major-arpeggios/ | major triads, one octave, left hand 4 or 3 given loosely |
| S11 | Alfred, contents sample of the Complete Book of Scales, Chords, Arpeggios and Cadences (probably the owner's book; the PDF has no title page), https://content.alfred.com/catpages/00-20177UK.pdf | only the contents page and the B minor page; gives the page numbers used below and the group map: F♯ major and E♭ minor sit in Major and Minor Group 1 (the white-key group), D♭ A♭ E♭ and C♯ G♯ F♯ in Group 2, B♭ major and B♭ minor each in Group 3 |
| S12 | Ruth Pheasant, https://www.ruthpheasantpianolessons.com/chromatic-scale.html | chromatic rule, a D start worked, hands together |
| S13 | https://www.piano-keyboard-guide.com/chromatic-scale.html | chromatic from C, both hands, descending retraces |
| S14 | https://lessonsinyourhome.net/blog/how-to-play-chromatic-scales-on-the-piano/ | the same three rules "starting on any note" |
| S15 | Graham Fitch, https://practisingthepiano.com/nimble-chromatics/ | basic rule, and a different "advanced" fingering |
| S16 | Penelope Roskell, The Art of Piano Fingering ch. 4 (Informance), https://dfp.informance.biz/1/6-the-art-of-piano-fingering/236-chapter-4-scales-in-thirds-tenths-sixths-and-contrary-motion | only the opening lines are free: contrary motion uses "the same as for unison scales" in each hand |

Not found free: the ABRSM, Trinity and RCM printed fingering books (paywalled; S8 and S9 are an ABRSM teacher's guide, not the board), Indiana University's secondary-piano fingerings (sign-in), the Hoffman arpeggio guide (paid), Roskell chapters 10 to 12 (paid).

## For the owner: check against the Alfred book

Order and page numbers follow the contents sample (S11); the left-hand string is read going up from the root. "was" is what the app played before this change. Two octaves: the first octave is the first 4 (triad) or 5 (seventh) digits, a right hand ending in 5 keeping it (1231235 gives 1235).

### Triad arpeggios

| Alfred p. | Key | RH | LH | Change / note |
|---|---|---|---|---|
| 44 | C major | 1231235 | 5421421 | was 1231235 / 5421245 |
| 45 | G major | 1231235 | 5421421 | was 1231235 / 5421245 |
| 46 | F major | 1231235 | 5421421 | was 1231235 / 5421245 |
| 47 | D major | 1231235 | 5321321 | was 1231235 / 5421245 |
| 48 | A major | 1231235 | 5321321 | was 1231235 / 5421245 |
| 49 | E major | 1231235 | 5321321 | was 1231235 / 5421245 |
| 50 | B major | 1231235 | 5321321 | was 1231235 / 5421245 |
| 51 | F♯ major | 1231235 | 5421421 | was 2312312 / 5421245 |
| 53 | D minor | 1231235 | 5421421 | was 1231235 / 5421245 |
| 54 | A minor | 1231235 | 5421421 | was 1231235 / 5421245 |
| 55 | E minor | 1231235 | 5421421 | was 1231235 / 5421245 |
| 56 | G minor | 1231235 | 5421421 | was 1231235 / 5421245 |
| 57 | C minor | 1231235 | 5421421 | was 1231235 / 5421245 |
| 58 | F minor | 1231235 | 5421421 | was 1231235 / 5421245 |
| 59 | B minor | 1231235 | 5421421 | was 1231235 / 5421245 |
| 60 | E♭ minor | 1231235 | 5421421 | was 2312312 / 5421245 |
| 62 | E♭ major | 2124124 | 2142142 | was 3123123 / 2132132 |
| 63 | A♭ major | 2124124 | 2142142 | was 3123123 / 2132132 |
| 64 | D♭ major | 2124124 | 2142142 | was 3123123 / 2132132 |
| 66 | C♯ minor | 2124124 | 2142142 | was 3123123 / 2132132 |
| 67 | G♯ minor | 2124124 | 2142142 | was 3123123 / 2132132 |
| 68 | F♯ minor | 2124124 | 2142142 | was 3123123 / 2132132 |
| 70 | B♭ major | 2124124 | 3213213 | was 2312312 / 2132132 |
| 72 | B♭ minor | 2312312 | 3213213 | — |

### Seventh arpeggios

The app names a seventh by its chord root (C7 is C E G B♭); S8 and ABRSM name the dominant seventh by its key (the dominant seventh "of F" is C7). Compare by the notes, not the name. Alfred's groups (dominant 1 to 5, diminished 1 to 4, pp. 86 to 96) are not in the sample, so no page numbers.

| Chord (notes) | RH | LH | Change / note |
|---|---|---|---|
| C7 (C E G B♭) | 123412345 | 543214321 | — |
| D7 (D F♯ A C) | 123412345 | 543214321 | — |
| E7 (E G♯ B D) | 123412345 | 543214321 | — |
| F7 (F A C E♭) | 123412345 | 543214321 | — |
| G7 (G B D F) | 123412345 | 543214321 | — |
| A7 (A C♯ E G) | 123412345 | 543214321 | — |
| B7 (B D♯ F♯ A) | 123412345 | 543214321 | — |
| F♯7 (F♯ A♯ C♯ E) | 234123412 | 432143214 | — |
| D♭7 (D♭ F A♭ C♭) | 412341234 | 214321432 | was 234123412 / 214321432 |
| E♭7 (E♭ G B♭ D♭) | 412341234 | 214321432 | — |
| A♭7 (A♭ C E♭ G♭) | 412341234 | 214321432 | — |
| B♭7 (B♭ D F A♭) | 412341234 | 321432143 | was 341234123 / 214321432 |
| C°7 (C E♭ G♭ A) | 123412345 | 543214321 | — |
| D°7 (D F A♭ B) | 123412345 | 543214321 | — |
| E°7 (E G B♭ D♭) | 123412345 | 543214321 | — |
| F°7 (F A♭ B D) | 123412345 | 543214321 | — |
| G°7 (G B♭ D♭ E) | 123412345 | 543214321 | — |
| A°7 (A C E♭ F♯) | 123412345 | 543214321 | — |
| B°7 (B D F A♭) | 123412345 | 543214321 | — |
| F♯°7 (F♯ A C E♭) | 412341234 | 321432143 | was 341234123 / 214321432 |
| C♯°7 (C♯ E G B♭) | 412341234 | 321432143 | was 341234123 / 214321432 |
| E♭°7 (E♭ F♯ A C) | 341234123 | 432143214 | was 234123412 / 321432143 |
| G♯°7 (G♯ B D F) | 412341234 | 432143214 | was 234123412 / 214321432 |
| B♭°7 (B♭ D♭ E G) | 341234123 | 432143214 | was 234123412 / 321432143 |

### Chromatic, one octave up (hands retrace coming down; sharps up, flats down)

Rule: 3 on black keys, thumb on white keys, except E F and B C where the right hand plays 1 2 and the left hand 2 1. Alfred has two chromatic patterns (pp. 74 and 75: "Beginning on C" and "Chopin Fingering"); the second is not in the sample, so compare it with the table below.

| Start | RH | LH |
|---|---|---|
| C | 1 3 1 3 1 2 3 1 3 1 3 1 2 | 1 3 1 3 2 1 3 1 3 1 3 2 1 |
| C♯ | 3 1 3 1 2 3 1 3 1 3 1 2 3 | 3 1 3 2 1 3 1 3 1 3 2 1 3 |
| D | 1 3 1 2 3 1 3 1 3 1 2 3 1 | 1 3 2 1 3 1 3 1 3 2 1 3 1 |
| D♯ | 3 1 2 3 1 3 1 3 1 2 3 1 3 | 3 2 1 3 1 3 1 3 2 1 3 1 3 |
| E | 1 2 3 1 3 1 3 1 2 3 1 3 1 | 2 1 3 1 3 1 3 2 1 3 1 3 1 |
| F | 1 3 1 3 1 3 1 2 3 1 3 1 2 | 1 3 1 3 1 3 2 1 3 1 3 2 1 |
| F♯ | 3 1 3 1 3 1 2 3 1 3 1 2 3 | 3 1 3 1 3 2 1 3 1 3 2 1 3 |
| G | 1 3 1 3 1 2 3 1 3 1 2 3 1 | 1 3 1 3 2 1 3 1 3 2 1 3 1 |
| G♯ | 3 1 3 1 2 3 1 3 1 2 3 1 3 | 3 1 3 2 1 3 1 3 2 1 3 1 3 |
| A | 1 3 1 2 3 1 3 1 2 3 1 3 1 | 1 3 2 1 3 1 3 2 1 3 1 3 1 |
| A♯ | 3 1 2 3 1 3 1 2 3 1 3 1 3 | 3 2 1 3 1 3 2 1 3 1 3 1 3 |
| B | 1 2 3 1 3 1 2 3 1 3 1 3 1 | 2 1 3 1 3 2 1 3 1 3 1 3 1 |

### Contrary motion, one octave, from the shared first note (the left hand goes down)

Pages from S11. "mirror" = left hand copies the right hand's numbers; "own" = left hand's usual fingering run downwards. Flagged = the app's left hand is a copy that is not the table fingering. Alfred's contrary pages (78 to 85) cover C and A minor, A and F♯ minor, E and C♯ minor, F and D minor, B♭ and G minor, E♭ and C minor, A♭ and F minor, D♭ and B♭ minor; G♯ minor is not among them.

| p. | Key | RH up | LH down (app) | Basis | If your book differs |
|---|---|---|---|---|---|
| 78 | C major | 12312345 | 12312345 | mirror = own | — |
| 78 | A minor | 12312345 | 12312345 | mirror = own | — |
| 79 | A major | 12312345 | 12312345 | mirror = own | — |
| 79 | F♯ minor | 34123123 | 34123123 | mirror, flagged | own: 41231234 |
| 80 | E major | 12312345 | 12312345 | mirror = own | — |
| 80 | C♯ minor | 34123123 | 34123123 | mirror, flagged | own: 31234123 |
| 81 | F major | 12341234 | 12312345 | own (mirror puts the thumb on B♭) | — |
| 81 | D minor | 12312345 | 12312345 | mirror = own | — |
| 82 | B♭ major | 41231234 | 31234123 | own | — |
| 82 | G minor | 12312345 | 12312345 | mirror = own | — |
| 83 | E♭ major | 31234123 | 31234123 | mirror = own | — |
| 83 | C minor | 12312345 | 12312345 | mirror = own | — |
| 84 | A♭ major | 34123123 | 34123123 | mirror, flagged | own: 31234123 |
| 84 | F minor | 12341234 | 12312345 | own | — |
| 85 | D♭ major | 23123412 | 31234123 | own | — |
| 85 | B♭ minor | 41231234 | 23412312 | own | — |
| not in book | G♯ minor | 34123123 | 34123123 | mirror, flagged | own: 31234123 |

The other keys of the app's stage s8 (D, G, B, F♯ major; D, E, G, B, E♭ minor, and the rest) are not on Alfred's contrary pages; their left hands are mirror = own, or own (B 12341234, F♯ 41231234, E♭ minor 23123412).

### The six scale lines that were in `UNCHECKED`

| Key | Hand | App (one octave) | Sources | Verdict |
|---|---|---|---|---|
| E♭ minor | LH | 21432132 | S3 21432132; S4 21432132 | agree (2 sources) |
| B♭ minor | RH | 41231234 | S3 41231234; S4 21231234 | agree, first finger 4 or 2 (as in the owner's B♭ major note) |
| B♭ minor | LH | 21321432 | S3 21321432; S4 21321432 | agree (2 sources) |
| F♯ minor | RH | 34123123 | S3 34123123; S4 34123123 | agree (2 sources) |
| F♯ minor | LH | 43213214 | S3 43213214; S4 43213214 | agree (2 sources) |
| B minor | LH | 43214321 | S4 43214321; S3 13214321 | S4 agrees; S3 starts on the thumb (the owner's book has 4 for B major, so kept) |

## Cross-check by group

"was" is the app before. Verdict CHANGED means two or more sources agree with each other against the old app and the code now plays what they say.

| Group | App was (RH / LH) | Published | Verdict |
|---|---|---|---|
| Triads RH on white-key shape: C D E F G A B major, A B C D E F G minor, F♯ major, E♭ minor | 1231235 except F♯ major and E♭ minor 2312312 | S1 1231 for all of these incl. F♯ and E♭ minor; S2 1231235 (F♯ in the first row); S3 1231231; S4 123 1235 incl. G♭ and E♭m; S5 "C G F F♯ d a e e♭" 1-2-3; S6 "G-flat is the same as white-key"; S7 names both as exceptions to the black-key rule; S10 | F♯ major RH and E♭ minor RH CHANGED to 1231235 (five sources; S11 groups them with the white keys) |
| Left hand 5421421: C G F major; A B C D E F G E♭ minor; F♯ major | 5421245 ("open shape") | S1 1421; S2 5421421; S3 5421421; S4 5421421; S5 5-4-2-1; S6 group 1 5+421+421; none has 2 4 5 | CHANGED (tail). Conflict kept in minors C and G: S5 gives 5-3-2-1 and S7 gives 321 for all white-key starts; F♯ major: S1, S4, S10 give 5321321, S2, S3, S5 give 5421421 (kept 4) |
| Left hand 5321321: D A E B major | 5421245 | S1 1321; S2 5321321; S4 5321321; S5 5-3-2-1; S6 group 2 5+321+321; S3 5421421; S7 321; S10 "4 or 3" | CHANGED (4 sources) |
| RH D♭ E♭ A♭ major, C♯ F♯ G♯ minor | 3123123 | S1 2124; S2 3124124; S3 4124124; S4 2 124 124; S5 4 1 2 4 (cycle 1-2-4); S6 4+124+124, "most prefer 2"; S7 2-124-124; S10 2124 | CHANGED to 2124124: all eight agree on the cycle 1 2 4 (S10 for the three major keys) (not 1 2 3); start 2 is the S1, S4, S6, S7, S10 reading, 3 (S2) and 4 (S3, S5) are variants |
| LH the same keys | 2132132 | S1 2142; S2 2142142; S3 2142142; S4 21 421 42; S5 2 1 4 2; S6 21+421+42; S7 214-214-2; S10 D♭ 2142 | CHANGED to 2142142 (seven sources; S10 gives 3142 for E♭ and A♭ major) |
| B♭ major RH | 2312312 | S1 2124; S2 2124124; S3 4124124; S4 2124124, alternative 23 123 12; S5 4 1 2 4; S6 4+124+124; S10 2142 | CHANGED to 2124124 (five sources). Old value is S4's alternative: if your book has it, it is 2312312 |
| B♭ major LH | 2132132 | S1 3213; S2 3213213; S4 alt 321 321 3; S5 3 2 1 3; S6 321+321+3; S7 321-321-3; S10 3213; S3 4214214; S4 main 2142142 | CHANGED to 3213213 (thumb on F, six sources). The old string put the thumb on D |
| B♭ minor RH / LH | 2312312 / 3213213 | RH: S1 2312, S2, S4, S5, S7 231-231-2; LH: S1 3213, S2, S5, S7 321-321-3, S4 321 321 2 (top note 2) | agree (kept) |
| Dominant sevenths on white roots | 123412345 / 543214321 | S6 1234+1234+5 and 5+4321+4321; S7; S5; S8 (G7, A7, C7 as printed) | agree (kept) |
| F♯7, E♭7, A♭7 | 234123412 / 432143214; 412341234 / 214321432 (both) | S8 notation; S7 (F♯7 234-1234-12 / 4321-4321-4; E♭7 and A♭7 4-1234-1234 / 21-4321-432); S5 | agree (kept) |
| D♭7 RH | 234123412 | S8 4 1 2 3 4 1 2 3 4; S7 4-1234-1234; S5 -4 1 2 3 4 | CHANGED to 412341234 (three sources) |
| D♭7 LH | 214321432 | S7 21-4321-432 and S5 2 1 4 3 2; S8 (the ABRSM guide) 4 3 2 1 4 3 2 1 4, its thumbs on different notes | kept (two against one); alternative 432143214 |
| B♭7 | 341234123 / 214321432 | S8 notation 4 1 2 3 4... / 3 2 1 4 3...; S7 RH 4-1234-1234, LH 321-4321-43; S5 -4 1 2 3 4 / 3 2 1 4 3 | CHANGED to 412341234 / 321432143 (three sources) |
| Diminished sevenths on white roots | 123412345 / 543214321 | S6 (C to A as 1234+1234+5 / 5+4321+4321); S9 page 1 (C) | agree (kept). S5's one-line rule ("4 on a black key") would move the thumb for C D F G A B; the others keep it on the root |
| Diminished sevenths on D♭ (C♯) E♭ F♯ A♭ (G♯) B♭ | see "was" in the table | S9 printed notation for all five; S5 rule ("4 on a black key; if two, the second for the right hand and the first for the left, counting ascending from the thumb") gives the same fingers for all five (checked by hand) | CHANGED (two sources; the S5 reading is by rule, not a printed row) |

## Alternatives left for the owner to compare (code unchanged)

1. F♯ major left hand: 5421421 (kept) or 5321321.
2. C minor and G minor left hand: 5421421 (kept) or 5321321 (S5).
3. D♭ dominant seventh left hand: 214321432 (kept; thumb on F with the right hand, S5 and S7) or 432143214 (S8: thumbs on different notes, the left on C♭).
4. B♭ major right hand: 2124124 (now) or 2312312; first finger 2, 3 or 4 on the black-key group (all quoted by someone).
5. Contrary A♭ major, C♯ and G♯ harmonic minor, F♯ harmonic minor left hand: the copy (app) or the left hand's own fingering (lists above). Only S16, one line, bears on it, and it says "own".
6. Chromatic: S12 to S15 agree with the app on the rule for any starting note. S15 also teaches a different "advanced" fingering (groups of 1 to 4, thumb off black keys), and the Alfred book's second pattern ("Chopin Fingering", p. 75) was not visible; if the book wants that one for starts other than C, it becomes a choice.
7. Diminished sevenths on white roots: thumb on the root (kept, S6, S9) against S5's "4 on a black key".

Not checked here: melodic minor, the owner-verified B♭ major, G♯ minor and B major lines (untouched), thirds, anything past two octaves.

## Where the tables came from, for the next session

`ARP` holds a pattern per group and a 12-letter code per form and hand picking the group by root; adding a source-backed alternative is one more letter. The first-octave strings are cut from the two-octave string in `arpeggioFingers`. Chromatic and the six scale lines were not edited: chromatic needed nothing, and the `UNCHECKED` flags stay until the owner has compared with the book. Suggested next edit after that comparison: clear E♭ minor LH, B♭ minor LH, F♯ minor RH and LH (two sources each), and chromatic from every start if pattern 1 matches.
