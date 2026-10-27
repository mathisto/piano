# Score marks on the staff

Branch `feature/marks`. The touch results named marks the staff did not draw; now it draws them.

## Built

- **Import** (`musicxml.ts`): `Song.marks = {t, text}[]`, the dynamic letters where the score writes them (one per moment, the first part's wins; repeated with the bars of a repeat). Curve changes are never turned into letters.
- **Layout** (`layout.ts`, pure, `marks()`): `LChord.art` (staccato, tenuto, accent) away from the stem (outward on the stem side in a two-voice staff), always in a space, never on a staff or ledger line, past a finger number. `Layout.slurs`: a cubic from the first to the last note of a `Note.slur` run per hand and part. It goes under the notes only when the stems at both ends point up. It rises to clear every head, stem and mark under it (capped at 4 spaces, then the ends move out). Where the window or a line break cuts it, it stays open at the system edge. `Layout.wedges`: hairpins as pieces per system, with the opening at a cut end matching the time already passed; they stop short of any letter in their way. `Layout.dyns`: letters centred on their note. Letters and hairpins sit between the staves (under a staff on its own), clear of the heads and marks over their stretch (and of stems when there is room).
- **Painter** (`staff.ts`): SMuFL `artic*Above/Below` glyphs inside the chord group (so they dim and hide with it), filled slur crescents, two-line hairpins, Bravura dynamic letters. Class `mk`: Ink at 70%, masked in read-through like chords.

## Tested

- `layout.test.ts` (fixture `touchPiece`): the side, the space and the ledger clearance; past the finger number; slur ends and clearance; open slurs at the window and across a line break; the hairpin opening, kept clear of the notes, with its ink inside the page; the opening where the window cuts a hairpin; the grand-staff row and clearing letters; no marks in a MIDI-style song.
- `musicxml.test.ts`: letters and their times, repeated through a repeat, none without dynamics.
- Headless Chrome at 1180x820 and 820x1180, the fixture plus a two-part grand-staff variant imported through Add files, in Staff and Both views, zoomed in and out. Smoke green.

## Not verified / open

- Real library scores only through tests. If the gap between the staves is crowded (a ledger note with a mark over a left-hand stem pointing up), a letter can cross a stem. Slurs and beams in that gap are not avoided.
- A slur whose two ends are both off the page is not drawn. A slur's end on a tied note is drawn at the note's first head.
- Pre-existing, not from this branch: `dock.ts` `drawMap` can throw "Cannot destructure property 'bars' of 'this.song'" when `liveHeat` fires before a song is set (seen once on a reload in portrait).
