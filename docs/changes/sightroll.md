# Sight Run and reading drills: two lines that turn up, and the cursor on the note (30 Oct 2026)

## What changed
- **The cursor** sat 16 px before the card in every reading mode ("park it just before the card", from when it was drawn over the notes). It is the staff's bottom layer now, so it sits on the note in every mode (`staff.ts` `moveCursor`).
- **Two lines at least** in reading drills and Sight Run (`layout.ts` `windowFor`: an `an.read` window takes the zoom that fits two systems, `vb / (2 vb + GAP)`, unless the player has zoomed further out). A line holds six bars at most (was eight).
- **A line turns, not a bar** (`staff.ts` `frame`). Any window of several lines (a drill, Sight Run, a zoomed-out piece) used to re-lay itself out from the current bar at every bar. It now keeps its lines until the top line's last onset has passed (`turnAt`), then lays out from the second line's first bar: that line lays out exactly as it did below (greedy breaks from the same bar and width), and a new one comes in under it. The SVG starts one line lower and eases up into place: 350 ms, `cubic-bezier(0.45, 0, 0.2, 1)`, nothing under `prefers-reduced-motion`.
- **Sight Run deals 72 cards at a time** (`run.ts` `SET`, was 16, one line): three lines of single notes, so it turns twice before a set ends. A new set is a new song and still redraws the page.
- **The held-note readout** is not shown in reading modes: it sat on the second line, and the staff marks each hit there.

## Why (research, sources in the agent report this note summarises)
- Eye-hand span: about one second ahead whatever the skill (Furneaux & Land 1999: professionals about 4 notes, amateurs about 2); a little over a beat (Truitt et al. 1997). A second line gives far more than anyone uses; a third only shrinks the notes.
- The one head-to-head music study (Bell, Church, McPherson & Bainbridge, ICMC 2005, six players): an instant jump rated as hard as or harder than scrolling by everyone; any motion distracted three. Weak evidence, both ways.
- Moving text costs reading (Harvey et al. 2017): keep motion short and finished before the next note is read. Soundslice scrolls a little early so the next line has settled before the playhead reaches it; the turn here happens on the top line's last note, a beat before the second line is due.
- UI timing (Nielsen Norman Group): 200 to 500 ms for a large change; 400 ms is already slow. 350 ms is a guess inside that range; compare 700 ms on the iPad if it feels abrupt (`ROLL_MS`).
- No study shows that forced read-ahead trains the span (Rosemann; Cara 2023): this is "always see what is next", not a training claim.

## Not done
- A set boundary in an endless Sight Run still redraws the page (the next set is a new song). Seamless would deal the next set into the same song before the last line, which the judge does not support today.
- Paced runs at fast tempos: the turn is not capped to a fraction of the beat; measure on the iPad.
- Under Reduce Motion the second line jumps to the top; forScore's motion-free half-page style (the next line appearing in the stale slot) is the better fallback.
