# Tempo in imported scores (branch feature/tempo)

## Fixed

1. **Tempo words** (`src/musicxml.ts`, `tempoWord()`): the first word names the pace (`TEMPI`, now with `vivo`, `animato`, `allo`, `tranquillo`, `maestoso`, `lent`, `vif`, `modéré` and more German: `geschwind`, `ruhig`, `innig`, `gefällig`, `getragen`, `gemessen`, ...), the rest of the text bends it by 12% or 8%: `molto`/`assai`/`sehr`/`-issimo` push away from moderate; `ma non troppo`/`nicht zu`/`etwas`/`ziemlich`/`moderato` pull toward it ("Adagio ma non troppo" is faster, "Nicht zu schnell" slower than "Schnell"); `con moto`/`con brio`/`animato`/`agitato`/`mosso` +8%; `sostenuto`/`cantabile` -8%. In a compound meter (6/8, 9/8, 12/8) the word names a dotted-quarter beat, so the quarter rate is x1.2 (6/8 Allegro no longer reads slow). "Tempo I" / "Tempo primo" returns to the first word's pace mid-piece.
2. **Honest flag**: a score whose only tempo is a word now gets `tempo-estimated` (the bpm is a guess); `no-tempo` is left for scores where nothing names a pace (100 bpm). A `<sound tempo>` or `<metronome>` gives neither. `src/flags.ts`, `GATES.flag` and the pipeline's `judge()` know the new flag (same -3 quality as `no-tempo` had); the pipeline's MusicXML `hasTempo` now comes from the importer (it used to look for `<sound tempo=` only, so a `<metronome>` mark alone was flagged `no-tempo`). The start card's "Changes:" line says "tempo guessed from its tempo word" / "no tempo marked, so a default one" (`src/credits.ts`).
3. **Metronome marks**: `<per-minute>` ranges ("132-144") read as the first number; `breve` and `32nd` beat units added.
4. **Mid-piece changes**: already worked and now has tests. The Song model bakes seconds into every bar and note (`Bar.t0/t1`, `Note.t`) through one piecewise-constant tempo map (`secAt`), so `<sound tempo>` between bars and inside a bar, `<metronome>` marks and tempo words (no number in the score) are all honoured, and survive unfolded repeats. Tests: `src/musicxml.test.ts`.
5. **Count-in in compound meters** (`src/song.ts`, `Song.spb`): `spb` was seconds per quarter, so the four count-in clicks and the two-beat lead before a bar or loop ticked quarters in 6/8, 9/8 and 12/8 while the practice metronome (and the music) feel a dotted quarter: the count-in ran at 1.5x the beat. `spb` is now seconds per beat for those meters only (306 shipped pieces; cut time and 3/8 still count quarters, as before). The pipeline's catalogue `bpm` (`60 / spb`) becomes the beat rate for them at the next build.

## Counts (live corpus, 1,988 pieces)

The 385 `no-tempo` pieces are 223 Mutopia MIDI, 83 Chopin first editions and 79 OpenScore Lieder (the "83" is the Chopin set, `kern.md`). None of the 162 MusicXML ones has a `<metronome>` or `<sound tempo>`.

| set | flagged `no-tempo` | now `tempo-estimated` | still `no-tempo` |
|---|---|---|---|
| Chopin first editions | 83 | 68 (58 had a word-derived bpm before; 10 gained one) | 15 (no tempo word in the file: `Semplice.`, `Polonaise.`, `Tempo giusto.`, none at all, a mistyped `Allo non tantao.`) |
| OpenScore Lieder | 79 | 41 (27 before) | 38 (mostly only cresc./dim./rit. words or none; a few misses like `Sehr Iangsam`, a capital I for the l) |
| total MusicXML | 162 | 109 | 53 |

No piece that carried a number gains a flag (checked over all 1,240 MusicXML pieces).

## Chopin Nocturne Op. 9 No. 2 (mutopia-1590, MIDI)

Not an importer tempo bug. The Mutopia `.ly` says `\tempo 8=132`, LilyPond writes quarter = 66 into the MIDI, and the app reads exactly that (12/8, 205 s, 38 bars; a dotted quarter at 44 and bars of 5.45 s). It is the first edition's mark read the way `!!!SIC` in the Chopin Institute kern says it should be (an eighth, not a quarter, `kern.md`). I did not hear it, so whether 44 to the dotted quarter is "wrong" to your ear is a judgement call; the file is uniform, so `poco rall.`, the fermata and the free cadenza are all played strictly in time. What was wrong and is fixed: the count-in ran at 66 clicks a minute against a beat of 44 (item 5). What is wrong and is not fixed:

- **The pickup is mis-detected** (`quantize()`, the `pickup` block): the piece has a one-eighth anacrusis (`\partial 8`), the importer makes bar 1 three quarters long, so every barline sits two beats late (the first full bar should start at 0.5 quarters, not 3.5). The scorer gives u = 3.5 a score of 306 against 125 for the true u = 0.5, because the melody's long notes fall on the middle of the Chopin bar. The metronome's first three clicks are therefore half a beat off the notes, and the bar accent lands on beat 3. A general failure of the heuristic on 12/8 with half-bar syncopation; a lone first note followed by the whole texture starting together is the cue the scorer ignores. Not fixed; it needs a regression set of pickups, not one piece.

## Remaining

- **rit., ritard., rallentando, accel., a tempo, fermata**: not applied. Taking them needs (a) a ramp in the tempo map: `secAt` is piecewise-constant, a ramp is a linear change of tempo between two map points (integrate 1/bpm, closed form), nothing else in the Song model changes because bars and notes already carry seconds; (b) a reading of how far and how long (to the next `a tempo`/`Tempo I`/number, else a guessed two bars and 20 to 30%; a fermata a guessed 1.5 to 2x); (c) a decision that those invented timings may judge a player (wait mode, accuracy windows, the tempo ladder all assume the written timing), probably as an "expressive timing" option off by default. The known gap that a mid-bar tempo change leaves the cursor up to a third of a beat off applies to ramps too.
- **Mutopia MIDI with no `\tempo`** (223 in the live corpus, 113 of them at LilyPond's default 60): 173 have their `.ly` in the cache, and 92 of those name a pace in it (a header `piece`, a `\mark` or markup) that the pipeline ignores; 81 do not. Taking them: read the word from the `.ly` in `analyse()`, `tempoWord()` it, rewrite the MIDI tempo event (`repeats.ts` already rewrites MIDI), flag `tempo-estimated`. Not built; the survey was a crude regex over the `.ly`, so 92 is an upper bound. 50 more have no `.ly` in the cache (multi-movement zips).
- **Tempo text in `<words>` with a number** ("Allegro (♩ = 120)") is not read; none of the 162 files had one.
- **Not heard**: the new estimates (Allegro 6/8 at 158 quarters, `Allegro ma non troppo` at 118) are table values checked by tests, not by ear. Qualifiers are a flat 12% and 8%; there is no word for "Tempo di valse", "L'istesso tempo", "Più mosso" or "Meno mosso" (relative to the previous tempo).
- Nothing was rebuilt or deployed: the corpus catalogue on the site still shows `no-tempo` and the old `bpm` until `build.mjs` runs.
