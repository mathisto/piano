# Roadmap and known gaps

v1 (Perform, Learn, MIDI import, staff strip) is built. This file tracks what is next and what is known to be rough.

## v2

- [ ] Sight-reading drills: landmark notes first (middle C, treble G, bass F), then steps, skips, intervals, chords, grand staff. Weighted toward the notes you miss. Reading-ahead mode (next bar hidden until the current one ends).
- [ ] MusicXML import (exact spelling and rhythm) and a full score view. The v1 staff spells pitches by a key-signature heuristic and shows rhythm simply (no rests, beams or ties).
- [ ] Sound packs: Salamander piano samples, then General MIDI instruments from a soundfont. Check each pack's license first. v1 has a two-partial oscillator only.
- [ ] Note names that fade as mastery grows (v1: a plain on/off toggle).

## Known gaps in v1

- Staff clips ledger lines below about C2 and above about C7 (needs 8va/15ma marks or a taller strip).
- No beams, rests, ties, tuplets or dynamics on the staff. Durations are rounded to the nearest standard value.
- Hands for single-track MIDI are split at one pitch (settings). No per-note override.
- Key signature from the file is trusted when present; a wrong "C major" default in a transposed file is not corrected.
- Timing windows (45 / 80 / 125 ms) and scoring weights are tuned by feel, not by testing with real players.
- Bluetooth MIDI adds jitter that calibration cannot remove, only offset.
- Web MIDI needs Chrome, Edge or Firefox on a computer. Safari and iOS have none.
- Cloudflare injects a Web Analytics beacon at the edge for the zone. The app itself sends nothing; exclude `piano.mattkelly.io` in the dashboard if that matters.

## Content

- Starter pieces are public-domain compositions with arrangements written for this project. Copyrighted pieces (game music, pop) are never committed. Users import their own MIDI; it stays in their browser.

## Design debt (from the finish review and DESIGN.md)

- [ ] Primary button uses a hard offset shadow (`0 2px 0`), and the combo slam and count-in use hard `text-shadow` offsets. Replace with soft depth or drop.
- [ ] Learn-mode results show a `✓` text glyph as the grade; draw it as an icon.
- [ ] Staff-hit marks are colour-only on the staff itself (only the miss has a shape); the results legend carries word and shape.
- [ ] Radius scale has four near-duplicates (4/6/8/10px); collapse to two.
- [ ] No third review pass after the last two fixes (bass stem direction, histogram labels); they were checked in captures by the builder only.
