# Polish after the eight merges (branch feature/polish)

An impeccable critique of every page at 1180x820 and 820x1180 with a touch pointer, then fixes. The critique used two separate
reviews: a design review of 51 screenshots, and a detector/axe/touch/focus pass. Score 25/40. Screenshots, before and after,
were kept outside the repo.

## Built
- **Set up sheet** (`setupDialog` in ui.ts, `openSetup` in main.ts). It opens once, on a first launch, and only when there
  are no saved settings, so the owner never sees it unasked. Settings > Set up opens it again. It is one list, not a wizard:
  - Keyboard: MIDI status in words, updated live, with a Connect button.
  - Touch range: hands over to the existing Technique calibration (`startTouchCal`).
  - Delay: hands over to the existing `startCalibration`.
  - Key touch: the `settings.keyTouch` select with its hint, shared with the drawer.
  Escape, the close button or Done skips it. Every step can be skipped and none blocks.
- **"Free, no subscription, no ads, no account."** appears in the Set up footer and at the top of Credits (`FREE` in ui.ts).

## Fixed from the critique
- **Song rows overprinted the length** (Learn sat over "3:17"). Read through added a third button that no longer fitted
  the 200 and 320 px action columns. Length now goes in the sub-line, the column is dropped, actions get a 352 px column
  (320 px under 1000 px) and wrap, never overlap. Empty tables no longer draw a header row.
- **Read and Scales stage tables at 820 px:** the thumbnail column rule (242 px, 94 px) was also hitting the stage name
  column, and under 760 px it hid the Stage header. Both are scoped with `:not(.stages)`. The meter column (`col.mcol`) is
  250 px, or 170 px under 1000 px.
- **Finger numbers clipped** under the short scale staff: `layout.ts` now counts them as ink, so the system grows to fit them.
- **Results card tall in landscape:** the overlay covers the whole play area (it already did in Staff and drill views), so
  the card fits in 764 px instead of scrolling inside a 370 px stage. Histograms are 76 px. Learn results no longer say
  "longest run 0".
- **Start and look-through cards covered the keyboard** on a short stage: they now sit above the keys (`24cqh`). They sit
  on the keys only when the strip is under 260 px.
- **Nav, 7 tabs:** fits 820 px with 28 px to spare. Narrower split-view windows (590 px) scroll the tabs sideways, and the
  selected tab is scrolled into view, instead of pushing Settings off screen.
- **One rhythm with Read:**
  - Plan, Theory and Path rows use the table cells' 12 px inset, so every list starts on the same edge.
  - Row names are 18 px and sub-lines 15 px everywhere: stage blurbs went from 13 to 15 px, and the Path from 16/14 to 18/15.
  - Theory level selects line up in one column.
  - The Theory and Scales rules moved from footnotes into the page lede.
  - Technique Path rows say "Not started".
- **Progress Path** level headings read "Level 10 of 6 solid" and had native triangles. They now use the shared +/−
  disclosure with a 44 px row and a separate count.
- **Notes you know** was right-hand cyan (Semantic Hue Rule). It is now Ink, and the C7 label is no longer clipped.
- **Touch targets** (coarse pointer):
  - Segment cells keep 38 px but their hit area reaches the 44 px well and is at least 44 px wide (Songs level "1" was 32 px).
  - Sliders are 44 px tall, and the quiz and range chips are 44 px.
  - Small buttons and the drawer footer links are at least 44 px wide.
- **Smoke:** it now checks Theory and that Set up shows on a first launch, closes with Escape, opens from Settings, and passes
  axe (24 checks).

## Found, not fixed (for the roadmap)
- **Notation:** at a fitted zoom or in Staff view the Five-finger warm-up draws whole rests in the treble, over bars 1 and 2,
  where the bass is silent. The empty treble bars 4 and 5 get no rests. Likely the `barRest` clef or x in `layout.ts`
  (rests section). Not touched: notation layout needs its own fixture test first.
- **Arcade leftovers, owner's call:**
  - the HUD shows "100%" and "In a row 0" before a note is played;
  - Sight Run has a "Streak" HUD;
  - the Theory and quiz cards show "streak n" and "Best streak".
- **Results contradict themselves:** a clean run still offers the amber "Loop bars 1 to 2 slowly", which is `nextStep` logic
  and was left alone. The dock also keeps its own "Loop worst bars" under the card.
- **Focus:** the drawer does not trap focus; Tab leaves it for the bar. On the start card, Play is the 9th stop, after zoom,
  divider and Connect.
- Progress mastery cells are 30x44, below 44 px wide on touch.
- Song rows still carry three actions each (Learn, Perform, Read through). The start card could take Perform and Read
  through.

## Not verified
- The iPad itself (WKWebView, safe areas, real `pointer: coarse`): only headless Chrome with touch emulation.
- A real keyboard: Connect, the touch calibration and the delay calibration were not run end to end from the sheet. Only
  the hand-over was clicked.
