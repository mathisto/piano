# Polish, third pass (branch feature/polish3)

An impeccable critique of the surfaces added since polish2 (Memorise, metronome, Read's Fluent tier, Sight Run, the nine
Theory trainers, Scales forms, Progress, Today 5 to 45 min, the 800-piece catalogue, Report a problem, Set up, Credits),
then fixes. Two isolated reviews: a design review (27/40) and a detector, axe and focus pass (detector clean, axe 0 violations
in every state). Headless Chrome, touch emulated, 1180x820 and 820x1180.

## Fixed
- **The play-screen banner was never visible.** `#banner` is not positioned, so its z-index did nothing and the Pixi canvas,
  appended later, painted over `.banner`. Every `flash()` note (loop verdicts in Memorise, test-run notes) and the
  "No keyboard yet / Connect keyboard" line were hidden, while Connect still took keyboard focus. `.banner` now has its own
  z-index and is no longer capped at half the stage. On a short stage the start card drops onto the keys while the banner shows.
- **Start card was half the stage wide** (`left: 50%` shrink-to-fit): titles wrapped to three lines and "Thin chords" to two.
  It now uses its full `min(720px, 92%)`.
- **Landscape iPad start card lost its hint** (the 420px rule hid `.hint`): it now hides only under 260px. The Memorise card
  keeps the stage name, without which 0 to 4 meant nothing. Each stage radio is named ("Stage 2, every 2nd bar hidden").
- **Tags split inside themselves** ("MEMORISED" / "4/4"): `.tag` is nowrap.
- **Song rows:** four actions in one row from 1100px wide (row height 113 to 73 px); 2x2 below. The 2x2 grid no longer
  touches the one-button Read and Scales tables. Row hover wash only with a hover-capable pointer (it stuck after a tap).
- **Open library at 820px:** composer select moved before the Level segment, so the tools take two rows, not three.
- **Theory and quiz cards:** default h2/p margins doubled the grid gap (70px between lines); the prompt is 28px.
- **Rhythm echo cells** are Ink, not Lamp (closes that One Lamp debt: the card's Next is the one lamp).
- **Scales quiz:** the right degree gets a check after you answer; the Scale select spans two columns ("Diminished 7th arpeggio").
- **Read:** a Fluent row dropped "Solid and fluent, under 1.5 s"; the tag and the time say it.
- **Today:** plan actions share a 112px column so the meters line up. **Progress:** Over time charts fill their card.
- **Credits:** long licence URLs wrap instead of running past the sheet.

## Not fixed, and why
- **Memorise strip covers the top-right of the staff** (bar number, top line, high notes). CSS cannot move it off the notation:
  `staff.ts` lays out from the whole pane. Proposal for main.ts/staff: give `Cfg` a top inset while Memorise is on (as the
  zoom cluster has none), or put the strip and Peek in the Learn dock's first row.
- **Theory with no keyboard is a dead end on the iPad** ("Play it on your keyboard."). Needs MIDI state in `theoryView`
  (main.ts passes it): a Connect line above the trainer list when no input is present.
- **Four equal ghost actions on every song row**: the real fix is the start card offering Perform, Read through and Memorise
  (main.ts), leaving one row action. Density is better, the choice overload is not.
- Theory Level selects truncate at 820px (native select; the iPad picker shows the full text). The tri-state metronome button
  and its unlabelled beat dots: left as built. "Report a problem" opens a GitHub issue form (needs an account) until
  `REPORT_TO` holds an address. Memorise's Display-italic stage digits differ from other segments: deliberate.
- Memorise pass card not captured (synthetic presses did not finish a clean pass).

## Not verified
- The iPad itself (WKWebView, real `pointer: coarse`) and a real keyboard; headless Chrome with touch emulation only.
- The banner over a 260px-or-shorter strip (Staff view, no keyboard) can still meet the start card.
