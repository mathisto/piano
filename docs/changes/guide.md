# Help for a new learner

Code: `src/guide.ts` (logic, copy, HTML), `src/guide.css`, `src/guide.test.ts`. Small hooks in `ui.ts`, `app/today.ts`, `app/banner.ts`.

## Start here (Today)
- A card for the first week of use: seven suggested days built from real features (Read Treble landmarks, C major right hand, chord triads on white keys, a read-through, five-finger Technique, Memorise Twinkle, Progress). Start opens the feature; Skip and Hide are remembered.
- `guideDay(first, today, done, skipped)` is pure. It returns null after day 8, and once every day is done or skipped.
- First use is stored in `localStorage` (`piano.guide`). With no stored day it is the earliest practice day, so a player with history is already past day 8 and never sees it.
- Ticks come from the plan records (`plan:<day>`: read, scale, theory, sight, warm), Memorise progress (`memStage`), and Progress having been opened. Any Read drill ticks day 1, any scale ticks day 2: they are not matched to the exact exercise.
- The card's Start is a plain button, so Today keeps one lamp.

## Tab notes
One line at the top of Read, Scales, Theory, Technique and Progress, drawn once per tab (`piano.tips`), with Got it. No claim beyond what the app measures; a test greps the copy for "proven", "faster", "guarantee".

## Help sheet
The Shortcuts sheet is now Help (`?` or Settings > Help): what each tab is for, how the touch coach works and what it cannot see, how a scale counts as solid (3 clean runs in a row), review spacing (1, 2, 4, 8, 16 days), shortcuts. Help now shows on touch devices too (the `hover: none` rule that hid its link is gone).

## No keyboard
`.kbline` (No keyboard connected, Connect keyboard, computer-key hint) heads Theory, Scales Quiz and Sight Run. `updateChip` hides it when a MIDI input appears and shows it again when it goes.

## Known gaps
- There is no on-screen piano, so an iPad with no MIDI keyboard and no hardware keyboard still cannot answer a Theory card. The hint names the computer keys only. Tappable keys are the real fix (file in ROADMAP).
- Verified in headless Chrome with a fake MIDI input, not on the iPad or a real keyboard.
