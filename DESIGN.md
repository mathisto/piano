---
name: piano
description: Falling-notes piano trainer in a DDR-cabinet night room; the calm grand staff is the scoreboard.
colors:
  ground: "#090b17"
  panel: "#10132a"
  panel-2: "#181c3b"
  line: "#262b55"
  line-2: "#3a4180"
  ink: "#ecebf5"
  ink-2: "#a9acd0"
  ink-3: "#8a8fbd"
  lamp: "#ffc83d"
  lamp-ink: "#1a1300"
  right-hand: "#3fe0ff"
  left-hand: "#ff4fa3"
  perfect: "#d7ff3d"
  great: "#3dff9e"
  good: "#ffb21f"
  miss: "#ff4a3d"
  lane-a: "#161b42"
  lane-b: "#0b0e25"
  lane-grid: "#4a528f"
  receptor: "#fff3d6"
  key-white: "#e7e6f1"
  key-black: "#15182e"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "54px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "0.01em"
  hud-numeral:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
  body:
    fontFamily: "Hanken Grotesk Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tabular-nums"
  label:
    fontFamily: "Hanken Grotesk Variable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
  notation:
    fontFamily: "Bravura"
    fontSize: "40px"
rounded:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "14px"
  pill: "17px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "16px"
  lg: "28px"
components:
  button:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "38px"
    padding: "0 16px"
  button-primary:
    backgroundColor: "{colors.lamp}"
    textColor: "{colors.lamp-ink}"
    rounded: "{rounded.sm}"
    height: "38px"
  button-primary-hover:
    backgroundColor: "#ffd766"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
  chip:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    height: "34px"
    padding: "0 12px"
  segmented:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
  segmented-selected:
    backgroundColor: "{colors.line-2}"
    textColor: "{colors.ink}"
  banner:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  results-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "26px 30px"
  scrub:
    backgroundColor: "{colors.ground}"
    rounded: "6px"
    height: "44px"
  meter:
    backgroundColor: "{colors.line-2}"
    rounded: "5px"
    height: "10px"
  meter-fill:
    backgroundColor: "{colors.ink-2}"
  meter-fill-solid:
    backgroundColor: "{colors.ink}"
  next-strip:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "14px 18px"
---

# Design System: piano

## Overview

**Creative North Star: "The DDR Cabinet at Night"**

A dark, cool-blue room with lit lane panels, a bright receptor line over the keys, and judgement words in heavy condensed italic. The arcade lives on the stage (highway, receptor, sparks, the combo slam). The notation does not: the grand staff is the scoreboard, set in near-white Bravura on a flat panel, and it ignites only to report state (awaited note, hit grade, miss). The shell around the stage is plain web controls (segmented switch, sliders, buttons, a table). Reading drills reuse the same room with the arcade turned down: the staff takes the screen and the highway shrinks to a strip.

The player sits 1-2 m from the screen with busy hands, so state is carried by word, shape, and hue together, never hue alone. Hands differ by hue, by lightness, and by fill style. Density is moderate and fixed: a 56px top bar, a stage, a docked transport. The top bar also carries the section switch (Songs | Read music) while no piece is open.

**Key Characteristics:**
- Cool navy ground with one warm voice (the lamp amber) for focus, selection, primary action, cursor and combo.
- Heavy italic condensed display type for everything that is announced; a quiet grotesk for everything that is read.
- Glow is a state signal on the staff and stage only, not decoration on chrome.
- Desktop only, minimum 1024px; below that a full-screen notice replaces the app.

## Colors

A navy-ink night palette with one amber lamp and a four-step judgement spectrum.

### Primary
- **Marquee Lamp** (#ffc83d): focus ring, selection, primary buttons, brand mark, combo, multiplier chip, staff cursor, loop region, awaited notehead (in a drill, every head of the next card), the "Next" tag on the stage table, slider thumbs, switch-on, segmented underline. The only warm neutral-adjacent accent.
- **Lamp Ink** (#1a1300): text on any lamp fill.

### Secondary
- **Right-Hand Cyan** (#3fe0ff): right-hand notes, solid filled bars.
- **Left-Hand Magenta** (#ff4fa3): left-hand notes, drawn as a 28% tint fill with a 2px outline so the hands differ by fill style as well as hue.

### Tertiary (judgement spectrum)
- **Perfect Lime** (#d7ff3d), **Great Mint** (#3dff9e), **Good Amber** (#ffb21f), **Miss Red** (#ff4a3d). Each is always paired with its word in the judge callout; miss red also marks wrong staff heads and the MIDI-missing dot.

### Neutral
- **Ground** (#090b17): page, stage clear colour, wells (segmented, scrubber, inputs, kbd).
- **Panel** (#10132a): top bar, staff strip, dock, drawer, results card.
- **Panel Raised** (#181c3b): buttons, chips, banner.
- **Line** (#262b55) and **Line Strong** (#3a4180): hairlines, control borders, slider tracks, selected segment.
- **Ink** (#ecebf5), **Ink Soft** (#a9acd0), **Ink Faint** (#8a8fbd): primary, secondary, and caption/label text. Ink Faint is the floor for text on Panel.
- Stage-only (palette.ts mirrors the CSS custom properties): lane tints #161b42 / #0b0e25 alternate per white key, octave and bar grid #4a528f, receptor #fff3d6, key white #e7e6f1, key black #15182e.

### Named Rules
**The Neutral Progress Rule.** Mastery is measured in Ink, not in a judgement hue: the meter fill is Ink Soft, and Ink once the stage is solid. The state is always also stated in words ("Solid", "7 of 12 notes seen", "Not started") and as a percentage.

**The Calm Staff Rule.** Notation is Ink on Panel. Colour appears on a staff glyph only as state: lamp for awaited, grade colour for a hit, miss red for a miss; it then decays to Ink Faint as "played".

**The One Lamp Rule.** Amber means "here, now, yours": focus, selection, the next action. It is never used for a judgement grade other than the Good step.

**The Word And Shape Rule.** A judgement colour never stands alone; it ships with its word (or letter grade) and, on the staff, a position or mark.

## Typography

**Display Font:** Barlow Condensed 800 italic (fallback Arial Narrow, sans-serif); 700 upright is loaded for Pixi key labels.
**Body Font:** Hanken Grotesk Variable (fallback system-ui). Body sets `tabular-nums` globally so counters never jitter.
**Notation Font:** Bravura (SMuFL, OFL, self-hosted woff2) for every staff glyph.

**Character:** A scoreboard shout over a quiet instruction manual.

### Hierarchy
- **Display** (800 italic, 54px, 0.95): library heading; also the 190px grade letter on results and the 160px count-in.
- **HUD numeral** (800 italic, 34px, 1): score, combo, accuracy; tempo value 26px; results stats 36px.
- **Title** (800 italic, 24-34px, 1, uppercase, +0.03 to +0.04em): drawer and results headings, table captions, big buttons (24px).
- **Body** (400-650, 15px, 1.45): controls, table rows (name 17px, sub-line 13px), banners; prose capped at 52ch.
- **Label** (700, 12px, +0.08 to +0.1em, uppercase, Ink Faint): HUD captions (15px while `body.reading`, because the player is further from the screen), table heads, drawer legends, group caps. Staff bar numbers are 11px 700. The "Next" tag is a Label in Lamp.
- **Group heading** (800 italic, 20px, 1, uppercase, +0.04em, Ink Soft): the full-width rows that split the stage table into Treble clef, Bass clef, Both clefs, Chords; a Line Strong rule under them.

### Named Rules
**The Announce Versus Read Rule.** Display italic is for what is announced (score, grade, judgement, headings, primary big actions). Anything the player must read in running sentences is Hanken.

## Layout

A single-column app grid: 56px top bar, then one view. Play view rows: staff strip `minmax(160px, 31vh)`, highway stage filling the rest (keyboard drawn inside the same canvas at the bottom, 24% of stage height at most), dock auto-height. The HUD cluster sits right in the bar with a spacer before it. Library pads `28px clamp(16px, 6vw, 96px) 64px`. The Read page uses the library padding and the same table: a lib-head, the Next-up strip, then the Stages table (rows 8px tighter than songs, five columns: stage 1fr, notes 190px, mastery 250px, median time 130px, action 130px). The drawer is a 400px right sheet under the bar. In a reading drill the play rows invert to staff `minmax(0, 1fr)`, highway strip `clamp(150px, 24vh, 230px)`, dock auto: the staff is the screen. A single-clef drill draws one staff in a 104-unit-tall viewBox (the grand staff is 158), so notation renders about half again as large. The staff cursor is parked 16 units before the card instead of sweeping, and staff and bar lines thicken to 1.7. While a piece is open the section switch is hidden and the "All stages" button (drills) or the mode switch (songs) takes its place. Spacing rhythm is 8 / 14 / 16 / 28 with 10-12px for inside-control gaps. Whole key range follows the song (min 35 semitones, white key width capped at 76px) unless "full" is set. Below 1024px a fixed "widen your window" notice covers everything; there is no tablet/phone layout.

## Elevation & Depth

Tonal layering, mostly flat: Ground wells recess into Panel surfaces, hairline borders separate regions. Real shadows are reserved for things that float over the stage: banner (`0 10px 30px rgba(0,0,0,.5)`) and the drawer (`-18px 0 40px rgba(0,0,0,.45)`). Light is a state signal on the stage and staff: the staff cursor, scrubber head, and hit notes carry a coloured `drop-shadow`/`box-shadow` glow in their own colour; the highway adds additive radial glows and sparks scaled by the Effects setting (Off / Calm / Arcade / Max).

### Named Rules
**The Glow Means State Rule.** A glow is allowed only on an element reporting live state in its own colour. Chrome (buttons, panels, headings) does not glow.

## Shapes

Soft rectangles with small radii: 4px (kbd, brand focus, multiplier chip), 5px (mastery meter, fully rounded at 10px high), 6px (scrubber, segment cells), 8px (buttons, segmented, inputs), 10px (banner, drop zone, Next-up strip), 14px (results card), full pill for chips (17px) and switches (11px). Falling notes are 5px rounded bars inset 3px inside their lane (1.5px on black keys), with a 3px bright bottom edge marking the moment to play. Left-hand bars are outlined, right-hand bars solid.

## Components

### Buttons
- **Shape:** 8px radius, 38px high (30 small, 48 big), 1px Line Strong border.
- **Default:** Panel Raised fill, Ink text, weight 650; hover brightens border to Ink Faint and fill to #20254b; active nudges 1px down.
- **Primary:** Lamp fill, Lamp Ink text, weight 800; hover #ffd766. Big variant is Barlow 800 italic 24px uppercase.
- **Ghost / Icon:** transparent, Ink Soft; hover reveals Panel Raised. Icons are 20px stroked SVG, 2px round-capped.
- **Disabled:** 40% opacity.

### Chips
- Pill, 34px, Panel Raised, Line Strong border, with a status dot (miss red, great mint when OK) for MIDI state.

### Segmented switch
- Ground well, Line Strong border, 8px radius, 30px cells. Selected cell is Line Strong with a 3px Lamp underline. Used for Perform|Learn, hand modes, effects, and the top-bar section switch Songs | Read music. The selected cell stays neutral (Line Strong fill, Ink text); the Lamp underline alone marks it, so the switch never competes with the primary button.

### Inputs / Fields
- Selects and number inputs: 38px, Ground fill, Line Strong border, 8px. Sliders: 6px Line Strong track, 18px Lamp thumb with a Ground ring. Switch: 38x22 pill, Lamp when on.
- **Focus (all controls):** 2px Lamp outline, 2px offset.

### Navigation (section switch)
- Top bar, after the brand: a Segmented switch (radiogroup "Section") with Songs and Read music. Hidden on the play screen. The "All stages" button replaces it there in a drill: a standard bordered 38px Button, not a ghost, so the way out is visible from across the room.

### Mastery meter
- 10px Line Strong track, 5px radius, Ink Soft fill (Ink when solid), `role="meter"` with min, max, now and a label. Sits in a flex row (`mrow`) beside a right-aligned percentage in bold, with a Label-sized caption beneath in Ink Faint. Never coloured by grade.

### Next-up strip and stage table
- Strip: 1px Line Strong border, 10px radius, 14px 18px padding, Ink Soft text with the stage name in Ink; sentence on the left, "Review weak notes" (default) and "Start" (primary) on the right. The stage table is the songs table plus Group heading rows; the recommended stage carries a Lamp "Next" tag after its name.

### Banner and Results card
- Banner: Panel Raised, 10px radius, floats at top of stage. Results card: Panel, 14px radius, 880px max, grid of giant grade letter (colour by grade), stats, counts, timing histogram with the centre bin in Lamp.

### Highway and keyboard (signature)
- Alternating lane tints per white key, brighter line at each C and each bar, a bright receptor line over the keys, on-screen keyboard (Key White / Key Black). Held keys pulse a lane gradient in the hand's hue. Awaited notes get a pulsing Lamp outline.

### Grand staff (signature)
- SVG, Bravura at 40px (10-unit staff space), Ink on Panel, 1.1 stroke staff lines, 1.4 bar lines, lamp cursor line. Two bars shown (one when dense). Played notes dim to Ink Faint; hits ignite for 0.8s in the grade colour then settle to played. Beams are flat Ink rectangles across the stem tips of a beat's eighths and sixteenths (second beam or a stub for sixteenths), never slanted. In a reading drill the awaited card is every notehead of the next chord lit in Lamp.

### Reading-drill play screen
- Body gets `reading`, the play grid gets `drill`. The staff is the large element (single staff when one clef is used, lines at 1.7); the falling notes and key names are hidden by default and revealed by the dock switches "Falling notes" and "Note names" (standard Switch, only shown in this mode). The HUD swaps to Cards, Streak, First try, Median. The ready card is Panel at 82% with the sentence enlarged to 20px.

### Drill results
- Same Results card, single column, in a `position: fixed` overlay from the bottom of the top bar to the screen edge (the stage strip is too short to hold it). Heading "[Stage]: set complete", a stat sentence, a mastery sentence with the meter, the "Needs the most work" list (Ink Soft, per-note first-try % and time), then a big primary ("Another set" or "Next stage" when solid) and a ghost "All stages".

### Scrubber
- 44px Ground well with a per-bar miss heat strip, an A-B loop region (Lamp 22% fill, Lamp edges) and a Lamp playhead.

## Do's and Don'ts

### Do:
- **Do** keep notation Ink on Panel and let it ignite only for state.
- **Do** pair every judgement colour with a word, letter or position.
- **Do** differentiate hands by hue, fill style (solid vs. outlined tint) and lane edge.
- **Do** use Lamp (#ffc83d) for focus, selection and the primary action, and the 2px/2px Lamp focus ring everywhere.
- **Do** use Barlow Condensed 800 italic for announced values and Hanken for reading text; keep numerals tabular.
- **Do** mirror any new colour in `src/palette.ts` if Pixi draws it.
- **Do** show mastery as an Ink meter plus a percentage and a word, never as a grade colour.
- **Do** keep the Lamp underline as the only mark of the selected segment.
- **Do** respect `prefers-reduced-motion` (animations collapse to ~0ms).

### Don't:
- **Don't** add synthwave sun, perspective grid, or glow on chrome.
- **Don't** colour notation permanently; colour is a transient state.
- **Don't** set text dimmer than Ink Faint (#8a8fbd) on Panel, or smaller than 11px.
- **Don't** design below 1024px; the narrow notice is the whole responsive story.
- **Don't** introduce a second warm accent beside the lamp.
