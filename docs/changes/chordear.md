# Chord ear and question and answer (feature/chordear)

Two more MIDI-first trainers in Theory, in the 15-card session (spaced review via `record()`, results, `logHistory`). Pure logic and tests in `src/ear2.ts`, `src/ear2.test.ts`. No claims about transfer to playing.

- **Ear: chords** (5 levels): hear a chord arpeggiated slowly (450 ms a note), then blocked; play it back in any octave and order, or just its root. Levels: major or minor on C (three registers), every root, triad inversions (the lowest note must match; no root-only shortcut), I-IV-V-I and I-V-vi-IV in a key (each chord blocked, played in turn; built from `cadenceCards`), dominant 7ths. Replay is allowed and counted; a miss shows the answer and replays.
- **Ear: question and answer** (4 levels: C major, any major key, minor keys, echo the rhythm): a two-bar stepwise phrase (5 to 8 notes, 80 bpm click, 60 seeded phrases a level, ids hold notes and rhythm), then two bars of your own on the same click. Half the cards ask you to answer (end on the tonic), half to ask back (end on the dominant); the card says which.
- **Judged on form only**: 4 notes or more; every pitch in the key (natural minor in minor); the last note on the tonic or dominant; pulse held (each onset to its nearest eighth, mean offset removed, each within `RHYTHM.window`: `scoreTaps`); level 4 also the same rhythm as the phrase. Keys within `RHYTHM.merge` are one onset. The result says plainly what held and what did not, with bias and spread; no score. Judged when the two bars end (no early finish).

## Edits to shared code
`ear.ts`: `Play` gains `qa`; `seeded`, `noteAt`, `tonicMidi`, `MAJOR`, `MINOR`, `pc` exported; `earAsk` uses `TCard.ask`. `theory.ts`: trainer ids, `Step.root` (a single root note is accepted), `TCard.ask`, `untimed()` (rhythm and Q and A show no median time), `deckOf` lines. `ear-play.ts`: `earNote`, `judgeQA`, the Q and A sounding branch. `ui.ts`: "Chord" or "Note" label by the step, `untimed`. `theory-ui.ts`: routes notes of a `qa` card.

Fixed on the way: a card answered correctly queued `nextTheory` 1.2 s ahead even if the session was stopped and a new one started in that time, which skipped the new session's first card.

## Not verified
Real sound on the iPad; a real keyboard (synthetic presses in headless Chrome at 1180x820 and 820x1180 passed all levels' first cards, a full chord session, Q and A hit and miss). Whether 80 bpm and the 450 ms arpeggio feel right by ear. `scripts/e2e/run.mjs` does not drive the Q and A cards (its driver reads `steps`, which these have none of) and is untouched.
