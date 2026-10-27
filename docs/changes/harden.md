# Hardening pass (branch feature/harden)

A fresh-eyes sweep in headless Chrome (Playwright, the `window.__piano` dev harness) at 820x1180, 1180x820 and 590x1000, then 410x590, 590x410 and 320x568 at device scale 2 for "200% zoom". Failures were forced by init scripts and route handlers (offline, 404, denied storage, a locked-down AudioContext, a fake `requestMIDIAccess` that drops its input), by importing hand-made MIDI and MusicXML files, and by seeding damaged records into `localStorage` and IndexedDB. Page and console errors were captured on every run. Nothing here was run on an iPad, in WebKit, with VoiceOver, or with a real FP-10.

## What was broken, and the fix

Failure paths (every one is now a plain-words state, none a blank screen or an unhandled exception):

1. **IndexedDB refused** (a browser that blocks site data, a private window, a full disk): every page was blank, because `idb-keyval` throws at once, not as a rejection, and the boot waits on it. New `src/kv.ts` wraps the four calls: a write that is refused is kept in memory for the visit, a read that fails is empty, `probe()` writes one key at boot so the page can say so before anything is lost. Every page then carries "This browser is not letting the app save. What you do now is gone when you close this tab." Cache writes (the catalogue, a library file) are not reported: they can be fetched again. `store.ts` and `catalog.ts` import from `kv.ts`.
2. **Any page that throws while drawing** left an empty tab. `showSection` (main.ts) now catches, logs, and draws the heading with "This page could not load. Try again, or reload the app." and a Try again button.
3. **Corpus catalogue unreachable** (offline, 404, damaged JSON, or a stored one that no longer reads): the Songs page showed the 38 bundled pieces with no hint that the other 1,960-odd were missing, and with nothing at all when the bundled manifest also failed (the section did not exist). `catalog.net` now records whether the corpus answered; with no stored catalogue and no answer the Open library says "Showing the pieces that come with the app. The rest of the open library needs a connection." with Try again (`catalog.retry`). With no pieces at all it says the library could not be loaded, with Try again. A stored catalogue of an old shape no longer stops boot (it fell through `merge` and left Today blank): the bundled pieces are used and the corpus is fetched again.
4. **A failed piece or import message was off screen**: the error line is at the top of Songs, and a click on row 40 of the library re-drew the page with the message above the fold. `showLibrary` now scrolls it into view.
5. **The play screen's code did not load** (offline after the page, a dropped connection): `openSong` had already switched to the empty play view, and Escape did nothing. It now returns to the page the piece was started from, with "The play screen could not load. Check the connection, then reload the page." Reload, not retry: Chrome keeps a failed dynamic import until the page reloads (checked: a retry after the network came back failed the same way).
6. **`new AudioContext` throwing** (locked-down web view, too many contexts): every key press and the count-in threw. `audio.ts` `ready()` now returns nothing and the app stays silent. Checked: context suspended for ever, constructor throwing, no `AudioContext` at all, sample files failing; a Perform run starts and plays in all four.
7. **`localStorage` itself throwing** (cookies and site data blocked): boot threw in `main.ts`, and `clearAll` and `importAll` would throw. All three are guarded; the other uses already were.
8. **MIDI unplugged mid-run**: checked, already right (the run pauses, "Keyboard disconnected. Plug it back in and press Space to resume.", Space resumes), at 1180x820 and 590x1000.

Imported files:

9. **A busy MIDI took 48 s to import and froze the page 18 s** (25,600 notes): `inspectMidi` counted lone onsets with a filter per onset, quadratic. Now one pass over a Map: 1.9 s, longest frame 1 s. `Math.min(...ps)` there and `Math.max(0, ...notes.map(...))` in `quantize` overflowed the stack on a file of about 125,000 notes ("could not read this MIDI file"); now reductions.
10. **A piece of more than 5,000 bars was cut silently** (`quantize` stops at 5,000 bars): notes past it raised a `TypeError` ("Reduce of empty array") in a performance, or were dropped without a word in an exact file. MusicXML had the same cap in `playorder.expand`, and the notes past it kept `t = NaN` and `bar = 0` (the Songs thumbnail printed fifty SVG errors). Both now say "This piece is longer than 5,000 bars, more than the app can show."
11. **A cut-off MusicXML file was accepted** and played as a shorter piece (the reader is our own and forgives anything). `parseXml` now refuses a file that ends with elements still open: "This MusicXML file is cut short or damaged." All 38 bundled scores and the suite's fixtures still read.
12. **A damaged export file could store the wrong kind of thing** (`touch` as a string, an `extra` key aimed at `song:` or `catalog`) and break Progress on every visit. `importAll` keeps a field only if it is the kind of thing `exportAll` wrote, and `extra` only for the keys `exportAll` writes.
13. **Saved settings of the wrong kind** (`zoom: "big"`, `zpos: 5`) stopped the app starting; each such key now falls back to its default. Values of the right kind but outside their set (`planMin: 99`) are not checked: Today then shows the page error of item 2.

Checked and fine: 0 notes, a 0-byte file, HTML with a `.mid` name, a bad `.mxl`, text with a `.musicxml` name, a 3,000-bar MusicXML (opens in 2 s), a 110-character unbroken file name with German letters, mixed Arabic, Chinese, Japanese and emoji in a title.

## Keyboard and screen reader

Every tab at three sizes: no focusable control without a name, none under 24 px, no horizontal scroll, a visible focus ring on every stop (including the segmented radios, whose ring is on the sibling span), focus returns to Settings when the drawer closes, the drawer holds focus (inert page, Tab wraps), a finished run moves focus to its first button and says "Finished. 100 percent accuracy." in the polite live region. Reduced motion (`prefers-reduced-motion: reduce` emulated): no element on Today, Songs, Read, Scales, Theory, Technique, Progress, the start card or the count-in has an animation or transition over 0.01 ms (13 to 15 do without it).

Fixed: a search or filter in the open library changed the list without telling a screen reader (the only live region said "50 of 338" and only while more were hidden); there is now a polite "11 pieces found" or "No piece found". The Songs notice and the page error are `role="status"`; the existing `#drop` error stays `role="alert"`.

## Overflow and 200% zoom

At the three required sizes every tab is pixel-identical to before the CSS changes (screenshots compared byte for byte). The changes only act below that:

- **Long titles**: `table.songs td.name` wraps anywhere, so an 80-letter word no longer prints under the buttons; the library sub-line (composer, level, licence) keeps its three parts together but wraps inside one longer than the line (a 100-character composer ran off the screen). The start card's title is clamped to three lines (one, with the Connect banner on a short stage) so a 120-character title and its credit line no longer slide up under the banner; `padding-bottom` keeps the descenders.
- **410 CSS px (an 820 px iPad at 200%)**: Today's plan control lost "45 min" off the right (`.head-actions` and its `.seg` wrap now); the Theory rows and Today's plan rows ran their level select and Start off the edge (`.prow` wraps, `.pwho` keeps a 7rem minimum); the play bar's Metronome ran off the edge (`.dock-row` wraps).
- **320 CSS px (the narrowest split view)**: the title and the Perform/Learn switch give way (the start card has the choice) so the HUD, keyboard chip and Settings stay on screen; the two hands' Play, Listen, Hide groups stack (`.grp` wraps).

## Tests

`quantize.test.ts` (5,200 bars refused), `musicxml.test.ts` (cut-off file, 5,200 measures refused, 4,000 read with finite times), `midi-tracks.test.ts` (30,000 notes inspected in under 5 s; the old code took 32 s), `catalog.test.ts` (`net.ok` after 404, damaged, offline, unchanged), `kv.test.ts` (IndexedDB denied: write, read, list, delete, report, cache copies, probe), `settings.test.ts` (wrong-kind saved values). tsc and vitest pass. E2E single features run with `E2E_ONLY`: see the last section.

## Not fixed, and why

- A failed dynamic import cannot be retried without a reload (browser behaviour); the message says reload.
- Songs is 50 rows times four buttons, so about 200 tab stops with no skip link past the list; the row itself is a mouse target only. A design call (a list of links with a "More" menu, or a skip link to the search box).
- `planMin`, `view`, `strict`, `coach`, `metro` and `fx` are not checked against their allowed values; a hand-edited settings file can still blank Today (item 2 catches it, with no way to repair short of Settings > Clear).
- Damaged records already in IndexedDB (a `touch:log` that is not a list) show the page error on Progress; nothing repairs them except Clear all data. Only Import was made to refuse them.
- The corpus fetch has no timeout of its own; a connection that hangs shows the bundled pieces without a message until the browser gives up (then the offline notice appears).
- `@tonejs/midi` takes 19 s to parse a 200,000-note file; it then reaches the 5,000-bar error. A reader of our own would be needed for that to be quick; no real file is that big.
- The browser's own "Failed to load resource" console lines when the corpus is blocked are not ours; a test that forces offline will see them.
- Text-only zoom does not exist for this app: sizes are in px, so Chrome's font size and iOS Larger Text change nothing; only page zoom does, and that is what was tested (by narrowing the viewport at device scale 2, not by zooming a real browser).
- Reduced motion was read from computed styles; the Pixi highway's own effects (it reads `matchMedia` once at start) were not measured.
- Not tested: WebKit, the iPad app, VoiceOver, a real MIDI device or Web MIDI permission prompt, the real corpus (the catalogue was a fixture), touch gestures.

## Checks

`npx tsc --noEmit` clean, `npx vitest run` 52 files, 691 tests passed. E2E with `E2E_ONLY`: `'^(1|2|3|4|6|7|8|9a|10|9b) '` 17 of 17 passed (the main flow through Export, Clear and Import, which guards the `importAll` change; 5 minutes); `'^(0|0b|1|6|7|7b|11|12|13|14) '` 10 passed including axe over every page. Axe was also run by hand on Today and Songs with IndexedDB denied (both notices showing): no violations. Not run: features 5, 15 to 19, the pulse trainers and the rest of 4's lanes beyond the above; the full `npm run e2e` is for after the merge.
