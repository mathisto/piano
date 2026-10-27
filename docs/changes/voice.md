# Voice on strings, hairpins in words

Branch `feature/voice`.

## Voice line on strings
- When the app plays a part named like a voice (Voice, Vocals, Singstimme, Gesang, Stimme, Canto, Chant, Soprano, Mezzo, Alto, Tenor, Baritone, Bass and the German/Italian spellings), it sounds on the strings sample set; the piano accompaniment stays on the setting's instrument. No setting. `voiceOf(song, note)` in `accomp.ts` is the pure choice; `audio.noteOn(p, vel, force, as?)` takes the optional instrument id.
- Until the strings have loaded, the chosen instrument plays the note. `Game.accomp()` preloads them when the app is about to play a voice line; `noteOn` also starts the load on first use.
- Strings release is 0.45 s, so notes overlap into a legato line. Tempo, loops and Wait are untouched (same `listen` path).
- Learn with a hand on Listen also uses it, if the listened notes belong to a voice part.

## Hairpins in words
- `cresc.`, `crescendo`, `dim.`, `dimin.`, `diminuendo`, `decresc.`, `decrescendo` in `<words>` become a hairpin from that point to the next dynamic mark of the same part, else four bars on, else the end of the part. They go through the same velocity interpolation and `Song.wedges` as `<wedge>`.
- A word inside a written hairpin, or at its start, adds nothing (the wedge wins); a hairpin starting before the four bars are up ends it. Tempo words (`rit.`, `a tempo`) are untouched.

## Tested
- `accomp.test.ts`: the app sings lc4976849's 28 voice notes with `'strings'` and plays the piano part with none; name matching.
- `musicxml.test.ts`: cresc. to a dynamic, dim. for four bars and hold, end of part, wedge plus word, non-hairpin words.
- Headless Chrome (lc4976849, Perform): "Piano" (you) gave 28 `noteOn` calls with `strings` (loaded); "Voice" (you) gave 18, none with an instrument id.

## Not done / open
- One strings sample set, so no violin/cello split by register.
- A voice note and a piano note on the same pitch share one voice slot in `audio.ts` (voices are keyed by pitch), so the second cuts the first.
- No check of how many library scores now gain word hairpins; the 4-bar default is a guess.
