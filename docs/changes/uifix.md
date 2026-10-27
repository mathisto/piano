# UI fixes (branch feature/uifix)

Four defects the polish passes left open, plus what a sweep of every page and the play screen found. Verified in headless Chrome
with touch emulation (`pointer: coarse`) at 820x1180 (iPad portrait), 1180x820 (landscape) and 590x1000 (split view), looking at
the screenshots; not on an iPad. `npx tsc --noEmit` and `npx vitest run` pass; `npm run e2e` is left to the lead.

## Fixed
- **Reading drills showed two keyboards** (the strip's keys and the stage's canvas keys, with a 230 px strip of empty lanes
  between). While the on-screen keys show in a drill, the stage row collapses to 0 and the staff takes the room; the Falling
  notes switch hides with it (the lanes have nowhere to fall to). With a MIDI keyboard the on-screen keys are off and the stage
  keys show as before; Hide on the strip brings the stage back. `osk.css`; `#play` row templates are now a `--rows` variable
  (`style.css`) so a view can add a row.
- **Memorise strip covered the top right of the staff.** It is a row of its own above the staff (`memory.css`,
  `app/memorise-ui.ts`), 52 px tall with or without Peek so the staff does not jump. At stage 4 it is the same row, no longer
  centred in the empty pane. This removes the debt line about it.
- **Theory repeated "No keyboard connected".** The Connect line and the On-screen keys switch sat above the card while the strip
  below already answered "no keyboard", beside the bar's No keyboard chip. They now show on the trainer list only, and on the
  Scales Quiz only before a card is up (`ui.ts`).
- **On-screen keys under 44 px at 590.** White keys are 47 px at 590, 46 at 820, 45 at 1180: the strip fits as many white keys
  as keep each at 44 px (`whitesFor`, 8 to 29), so a split view gets a part-octave (C4 to G5, 12 keys) instead of 2 octaves of
  37 px keys. The range label names its top key ("C4 to G5"). A part-octave strip opens on the C under the lowest note of a
  drill's cards (a bass drill opens at C3), and goes back to its default when the strip hides. Test in `osk.test.ts`.
- **Count-in under the Connect banner.** The "No keyboard yet" banner covered the top of the count-in numeral; it yields while
  the count-in shows.
- **MIDI chip and the Start here Skip link were under 44 px wide** (36 and 37) in a narrow window; both reach `--control`.
- **Technique aim-for dynamic on one hand.** "mf" was placed halfway between two staves, which on a lone staff is the middle of
  the staff, across the first note and the cursor. It sits under the lone staff now (`staff.ts`).
- **Play-bar title** took half the free room however short it was ("C major five-finger, ste..."); it takes its own width.
- **"Next" tag** wrapped under its name 10 px out of line at 590 on Read and Scales; flush under 640 px.

## Guards
`css.test.ts`: every `#play` row template is a `--rows` value; the Memorise strip is never absolutely positioned.
`osk.test.ts`: a white key is at least 44 px at every width from 352 to 1700.

## Not fixed
- Black keys are 28 to 29 px wide at every width (62% of a white key, as on a piano) and 62% of the strip tall; the floor holds
  for the white keys and the buttons, not the black keys. Wider black keys would hide the white keys under them.
- At 590 the strip holds 12 white keys, so a card past its range needs the octave button; a Theory card has no range to read.
- The start card still sits over the dimmed keys on a stage 420 to 480 px tall (820x1180 is one): the compact card that clears
  the keys applies at 420 px and under, and the full card needs about 480. Raising the threshold would drop Notes shown and You
  play from the portrait iPad's start card, so it stays.
- DESIGN.md is not edited (the lead owns it). Lines it now misstates: On-screen keys ("2 to 4 octaves", "a white key is at
  least 48px wide, so 2 at 820px and 3 at 1180px"; now whole white keys of at least 44px, 12 at 590, 17 at 820, 25 at 1180);
  Memorise card and strip ("floats at the top right of the staff", "At stage 4 ... centred", and the debt line that it covers
  the notation); the Connect line (it also hides while a Theory or Quiz card shows); Layout's reading-drill row (the
  `clamp(150px, 24vh, 230px)` strip is 0 while the on-screen keys show) and the Falling notes switch (hidden then); the Tag
  line (Next sits under the name below 640px); the Technique aim-for mark (above a lone staff).
- A drill's results card and Sight Run results were looked at at 590 and 820 only for the drill; Sight Run results, Technique and Scales results and Compare were not.
- Not looked at: the Settings drawer, dialogs, Technique results, Compare and the recorder (outside the list), and Safari.
