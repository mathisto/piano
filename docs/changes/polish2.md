# Polish, second pass (branch feature/polish2)

Closes the five findings in `docs/changes/polish.md` ("Found, not fixed").

- **Rests were drawn in the wrong place, in every song.** `layout.ts` was right (bass whole rests in bars 1 and 2, treble in 4).
  The break reminder's toast class `.rest` (habit.css: `transform: translateX(-50%)`) also matched the staff's rest glyphs, so
  each one slid left by half the staff width (227 px). The toast is now `.wristnote`. `css.test.ts` fails on any bare `.rest`
  rule; `layout.test.ts` pins the warm-up's whole-bar rests (one per silent bar, centred, in their own staff).
- **Focus.** Tab now wraps inside the open settings drawer (the page behind was already inert; the wrap was missing), Shift+Tab
  too. Escape already closed it and returned focus to its button. A newly opened piece focuses Play, so Play is the first stop
  of the start card, not the ninth. Smoke checks both.
- **Progress cells** are 44 x 44 on a coarse pointer. That exposed two overflows at 820 px: the grid column grew to the widest
  strip (`minmax(0, 1fr)` now) and long strips did not wrap (`.crow` wraps now). Checked with touch emulation at both sizes.
- **"Loop bars slowly" after a clean run.** `nextStep` was right: a clean run never gets the loop. Two real causes:
  (1) a Learn run that was not clean still said "Cleared" with a check mark, then offered the loop; it now says "Not clean yet".
  (2) stored trouble heat only decayed (x0.7 a session) and never reached zero, so Today's fix row and the dock's
  "Loop worst bars" stayed for ever. `cool()` in store.ts now zeroes anything under 0.25: one missed note is gone after four
  clean sessions. Tested in `pace.test.ts`.
- **Set up sheet.** The decision is `showSetup()` in settings.ts: never when seen, never over saved settings, never when
  `navigator.webdriver` (automation); `?setup` forces it. Smoke asserts it stays away and checks `?setup` on a second page.

## Not verified
- The iPad itself (real `pointer: coarse`, WKWebView): headless Chrome with touch emulation only.
- The "Not clean yet" card does not say why (a miss, not a wrong note); worth a line if it confuses.
- An existing player with progress but no saved settings still sees Set up once.
