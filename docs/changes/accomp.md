# Accompaniment practice: you play one part, the app plays the rest

The app plays the other part at the tempo, like a pianist with a singer or a backing track. Accompanying experience predicts sight-reading skill (Lehmann and Ericsson 1996).

## Flow
- Start card, under Perform | Learn: **You play**. A piece with several source parts gets Everything plus one choice per part (a folded Lied: Everything / Voice / Piano). A two-hand piece gets Both hands / Right hand / Left hand: one tap for play-along. A one-hand piece or a single-part score gets no row. Choosing a part shows "The app plays the voice part. Only your part is judged."
- Perform: the app sounds the other parts through the sampler (always, like Listen) and never waits. Learn: tempo, loops, the metronome and Wait work as before. With Wait on, the app's part waits with you. The dock's hand switches show the choice. Perform goes back to the card's choice. A new song clears it, and a change of Notes shown keeps it.
- The app's notes are dimmed on the staff (`#staff .head.app`, 40%) and in the falling lanes (Listen's existing 40%). Only your notes are judged.
- Results add "Judged on your part only: the piano part. The app played the voice part." A run of one part (this, or Learn with a hand on Listen or Hide) records heat and history (labelled "<title>: your part"). It does not set the piece's Best or count as a clean run for Ready or the review boxes, because it is not a run of the piece. This is a change for Learn with hands separate.

## Model
- `Note.part`: the source part (MusicXML part index, MIDI track). `Note.also`: a second part that wrote the same note. The importer merges a voice note that the piano doubles into one note, and that note belongs to both. `Song.parts`: the part names (MusicXML `part-name`, MIDI track name). Hands are unchanged: the folded voice stays `'R'`.
- MusicXML sets these when two or more parts have notes. MIDI sets them when three or more tracks are read (two tracks are the two hands). Songs are stored as bytes and parsed again on open, so stored songs gain the fields with nothing to migrate.
- `Game.parts` (the parts the app plays) and `Game.you` (the card's hands). `Game.modeOf(note)`: a part the app plays is 'listen', otherwise the note follows its hand. Scoring, autoplay, the highway and the staff all go through it.
- I used the part, not the track (`pi*4+staff-1`). A MusicXML part's staves are already its hands, so "the voice" or "the primo" is a part.

## Code
`src/accomp.ts` (choices, `byApp`, `yourPart`, the card row), `src/accomp.css`, `src/accomp.test.ts`. Small edits: `song.ts`, `musicxml.ts`, `game.ts`, `highway.ts`, `staff.ts`, `app/play.ts`, `app/results.ts`, `main.ts`.

## Verified
- tsc, vitest (6 new tests, all suites pass), `npm run smoke`, and axe on the start card.
- The tests use the bundled Lieder lc6917116 (the piano doubles all 168 sung notes, so only Voice is offered and the app plays the other 503) and lc4976849 (Piano: the app plays the 66 sung notes the piano does not double). They also cover a two-hand starter and a three-track MIDI file.
- Headless Chrome with synthetic keys, counting `audio.noteOn` through a wrapped module. Die Rose, die Lilie, "Piano" at 1180x820: the app played 66 notes and 132 were judged. Ode to Joy, "Right hand" at 820x1180: the app played 36 left-hand notes and 62 were judged. Results show the line, and Learn keeps R play / L listen. No console errors. Screenshots were taken at 1180x820, 820x1180 and 1180x600.

## Not verified / open
- Audio on the iPad and a real keyboard. Synthetic presses only.
- Simplify works by hand, not by part. At Melody and bass, the top line of a folded Lied is mostly the voice, so "Piano" leaves you mostly the bass. Simplifying per part would fix this.
- More than 4 parts gets no part row, only hands. A third part doubling a note is not recorded (`also` holds one).
- The app's part uses the piano sample, not the voice's instrument.
- Without a keyboard on a short stage (1180x600), a long title still runs under the "No keyboard yet" banner. This was tight before the change. The card now drops onto the keys when the banner shows.
