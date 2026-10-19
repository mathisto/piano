# UI critique, 19 Oct 2026 (before the overhaul)

Independent impeccable critique of the whole web app, from source and from screenshots at 1440x900 and 1180x820 (iPad Air landscape, the primary device). Score **26/40** (acceptable, 65%): a solid engine in an over-explained shell.

Verdict on specificity: the play screen is authored (highway, receptor line, semantic hand colours, calm staff). Songs, Read music, Technique and Touch are interchangeable dark admin pages. The neon-arcade identity lives only on the stage canvas, and nothing in the shell says "practice": no today, no streak, no progression beyond a per-stage meter.

| Heuristic | Score | Issue |
|---|---|---|
| Visibility of status | 3 | HUD is three unlabelled numbers at 1180; "100%" accuracy before a note |
| Match with real world | 3 | Perform / Learn never explained; "Touch" and "Calibrate" each mean two things |
| User control | 3 | No obvious in-play back |
| Consistency | 2 | Four page templates; `.next-strip` does three jobs; unthemed Technique selects |
| Error prevention | 3 | |
| Recognition vs recall | 2 | No "what next" home; icon-only view switch |
| Flexibility | 3 | Shortcuts are keyboard-only; nothing touch-first |
| Minimalist design | 2 | Drawer, Read table, Songs header, play top bar over-furnished |
| Error recovery | 3 | |
| Help | 2 | Paragraphs pasted everywhere instead of hints at the right moment |

## Priority issues

- **P1 iPad is the primary device but gets the stripped layout.** The 1180px media query hides tempo presets, hand labels and HUD captions, which are the touch-friendly controls. No `pointer: coarse` rules anywhere. The ready card says "Press Space". Fix: pointer-aware compaction; "Tap Play".
- **P1 Settings drawer:** 14 controls, 2 disclosures, about 1,500 characters of prose, scroll height 2240px at 844px. About 85% of the prose is cuttable.
- **P1 No progression and no "what do I practise today".**
- **P2 Touch targets under 44pt:** nav cells 32px, mode and view switches 32px, `.btn.sm` 36px, slider thumb 22px.
- **P2 HUD proximity inverted:** caption-to-number gap (about 80px) larger than caption-to-next-caption (about 28px). Accuracy reads 0% after the first miss.
- **P2 Page templates diverge:** three different paragraph left edges, unthemed Technique selects, Technique and Touch 60-75% empty, Read repeats the Next blurb verbatim.

## Drawer audit

Keep inline with a shorter label: Effects, Fall speed (Slow/Fast ends), Note names, Full 88-key keyboard, Browser sound (Instrument and Volume only when on), Input delay with unit in the field and Calibrate beside it, MIDI input (only when more than one device).

Move: note names and fall speed to the dock; split point to a per-file menu ("Split at C4"); computer-keys help to a Help overlay; shortcuts hidden on touch; the Local Control advice to a one-line details.

Cut: "Name the chord I am holding" (default it or fold into Note names); the Hold Off/Lenient/Strict control becomes one switch, "Score key length"; the connection status paragraphs and the "Keyboard not detected?" details (the banner already says it).

Target: about 7 rows plus Export, no paragraphs. Add Import to match Export.

## Reclaiming screen during play (Perform at 1180x820)

Chrome is 122-178px; about 205px of visible lane. Reclaimable about 150px at rest (stage +70%) without touching the staff:

| Item | Action |
|---|---|
| Top bar | Fade after about 3s of running; returns on pause or tap at the top edge |
| Song title in the bar | Hide while playing (the ready card shows it) |
| Mode and view switches | Only when paused or ready |
| "No keyboard" chip | Dot only when idle |
| HUD in Perform | Score and Combo only; drop captions at every width |
| Learn aids row | Collapse to a handle while running; hands as one Both / Right / Left preset |
| Scrub bar in Perform | 6px progress line on the dock edge |
| On-screen keyboard | About 72px; keep the receptor lamps |
| Ready card legend | First use only |

## IA and copy

- Nav is a taxonomy, not a journey. Touch and Technique are one subject split in two.
- Songs header spends about 240px before the first row; Bars column and seven identical Learn buttons are low value; the drop zone repeats the intro.
- Read table: five columns, 64px rows, "Not started" and an em dash on every row; Stages caption redundant; the Next strip repeats the row blurb.
- A 54px H1 on every page duplicates the selected tab.
- Copy smells: about 12 parentheticals, filler restating the label, rule-of-three cadence, hedging ("a generous margin"), empty states without an action, facts stated twice. A plain pass cuts about 40% of UI copy.
- Docs drift: PRODUCT.md and DESIGN.md still say iOS is out of scope and describe a two-item nav.

## Ideal screens at 1180x820

- **Today:** Continue (last piece, Learn/Perform, best grade); next reading stage with Start; last Technique config; days practised. Nothing else.
- **Songs:** title and Add files on one row; 56px rows, 9-10 visible; one amber Continue row; no Bars column.
- **Read music:** collapsible groups, 48px rows, meter, one Practice button, Next tagged on the row; median only after first score.
- **Technique:** one-card form on one row plus Start; last 5 runs; the touch bands as one line with Calibrate. Absorbs Touch.
- **Play running:** staff, highway, 72px keyboard, 6px progress line, Score and Combo at 28px.
- **Play paused or ready:** full bar and dock return; ready card with title, "Tap Play", legend once.
- **Settings:** about 7 rows, no paragraphs.

## Open questions raised

- If the owner practises daily, why does the app open on a catalogue?
- Is Perform a real mode for a learner, or an opt-in score chase?
- Could Touch be a setting plus a chart on Technique?
- What would the shell look like if it borrowed the stage's lane language instead of a stock dark table?
