# On-screen keys

An iPad with no MIDI keyboard can now answer Theory cards, the Scales quiz, Sight Run and reading drills by touch.
Code: `src/osk.ts` (pure layout and hit-testing), `src/osk.test.ts`, `src/app/osk-ui.ts` (the strip and its pointer handling), `src/osk.css`.

## Behaviour
- A strip under the page (`#osk`, a third row of `#app`) with 2 to 4 octaves (48 px minimum white key, so 2 at 820 px wide, 3 at 1180), black keys on top, a label on every C (C4 is middle C), octave buttons, Names (a letter on every white key) and Hide.
- Shown while a Theory card or a quiz card is open, and while a reading drill or Sight Run is open on the play screen. Never on the menus, results, or a song (the song stage has its own keys).
- On when no MIDI keyboard is connected; the "On-screen keys" switch (Theory, Quiz, Sight Run builder) or Hide overrides that, and the choice is remembered (`settings.osk`, `settings.oskNames`). `updateChip` re-syncs it when a keyboard comes or goes.
- Several fingers play a chord. Dragging across keys glides: the old key lets go, the next sounds. Two fingers on one key release it only when both lift.

## The input path
The strip sends the same `MidiMsg` as a keyboard, with `virtual: true` and velocity 0.75, into `fromKeyboard`. Theory, the quiz and `game.press` need no change; `game` already judges a virtual press with velocity 0, so touch evenness is not scored on screen keys. The first key on a reading drill starts it, as on a keyboard.
Fix on the way: Theory and the quiz played no sound for virtual notes (they relied on the keyboard's own speaker); they now sound through the sampler, which also fixes the computer keys there.

## Checked
Headless Chrome, touch emulation (CDP multi-touch), 1180x820 and 820x1180: a chord session, an ear play-back session, a Scales quiz of 10 by note, a Sight Run set of 16, the switch (remembered across reload) and a faked MIDI keyboard plugging in.

## Not checked, open
- Real iPad touch latency and the sound latency of a first tap (audio unlock happens on the first touch).
- Rhythm cards are judged on tap time; screen-tap latency adds to it.
- The keys are `aria-hidden` shapes: no screen-reader path beyond the computer keys.
- The stage's own canvas keys stay small (about 40 px tall) on the play screen; this strip is the touch target there.
