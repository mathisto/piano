---
name: piano
description: Falling-notes piano trainer in a DDR-cabinet night room; the calm grand staff is the scoreboard.
colors:
  ground: "#090b17"
  panel: "#10132a"
  panel-2: "#181c3b"
  panel-3: "#20254b"
  line: "#262b55"
  line-2: "#3a4180"
  edge: "#5a6196"
  scrim: "rgba(9, 11, 23, 0.82)"
  shade: "rgba(0, 0, 0, 0.6)"
  ink: "#ecebf5"
  ink-2: "#a9acd0"
  ink-3: "#8a8fbd"
  lamp: "#ffc83d"
  lamp-hi: "#ffd766"
  lamp-ink: "#1a1300"
  right-hand: "#3fe0ff"
  left-hand: "#ff4fa3"
  left-hand-edge: "#ff7bbd"
  perfect: "#d7ff3d"
  great: "#34e89a"
  good: "#ff8a3d"
  miss: "#ff4a3d"
  lane-a: "#161b42"
  lane-b: "#0b0e25"
  lane-grid: "#4a528f"
  receptor: "#fff3d6"
  key-white: "#e7e6f1"
  key-black: "#15182e"
  key-muted: "#5b5f8a"
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
  badge:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1
  stage-word:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.04em"
  body-lg:
    fontFamily: "Hanken Grotesk Variable, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.45
  body:
    fontFamily: "Hanken Grotesk Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tabular-nums"
  label:
    fontFamily: "Hanken Grotesk Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
  notation:
    fontFamily: "Bravura"
    fontSize: "40px"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "40px"
    padding: "0 16px"
  button-hover:
    backgroundColor: "{colors.panel-3}"
  button-primary:
    backgroundColor: "{colors.lamp}"
    textColor: "{colors.lamp-ink}"
    rounded: "{rounded.sm}"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.lamp-hi}"
  button-big:
    backgroundColor: "{colors.lamp}"
    textColor: "{colors.lamp-ink}"
    rounded: "{rounded.sm}"
    typography: "{typography.title}"
    height: "52px"
    padding: "0 20px"
  button-small:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "36px"
    padding: "0 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    height: "40px"
  chip:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 14px"
  segmented:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "3px"
  segmented-selected:
    backgroundColor: "{colors.line-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    height: "32px"
  switch:
    backgroundColor: "{colors.line-2}"
    rounded: "{rounded.pill}"
    height: "26px"
    width: "46px"
  switch-on:
    backgroundColor: "{colors.ink-2}"
  banner:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  results-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "28px 32px"
  scrub:
    backgroundColor: "{colors.ground}"
    rounded: "{rounded.xs}"
    height: "44px"
  meter:
    backgroundColor: "{colors.line}"
    rounded: "{rounded.pill}"
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

The player sits 1-2 m from the screen with busy hands, so state is carried by word, shape, and hue together, never hue alone. Hands differ by hue, by lightness, and by fill style. Density is moderate and fixed: a 56px top bar, a stage, a docked transport. One control height (40px) and four radii run through the whole shell. The top bar also carries the section switch (Songs | Read music) while no piece is open.

**Key Characteristics:**
- Cool navy ground with one warm voice, the lamp amber, that means only "play this / now": the verb and the now-markers. Everything else in the shell is neutral Ink.
- Heavy italic condensed display type for everything that is announced; a quiet grotesk for everything that is read.
- Glow is a state signal on the staff and stage only, not decoration on chrome. No hard offset shadows, no hard text-shadows.
- Desktop only, minimum 1024px; below that a full-screen notice replaces the app.

## Colors

A navy-ink night palette with one amber lamp, two hand hues, and a four-step judgement spectrum (lime, mint, orange, red) that deliberately excludes amber.

### Primary
- **Marquee Lamp** (#ffc83d): the verb and the "now" markers only. Primary buttons, the one Continue / Start-here row on the songs list (and its tag), the "Next" tag and Start on the Read page, the staff cursor, scrubber playhead, awaited notehead (in a drill, every head of the next card), receptor lamps over lit keys, awaited-note outline on the highway, the "Play this" legend swatch, the count-in numeral and the combo slam, the focus ring and text selection. Hover is **Lamp Bright** (#ffd766). The wordmark, selected segments, switches, slider thumbs, combo number and x-multiplier are NOT lamp; they are Ink.
- **Lamp Ink** (#1a1300): text on any lamp fill.

### Secondary (hands)
- **Right-Hand Cyan** (#3fe0ff): right-hand notes, solid filled bars.
- **Left-Hand Magenta** (#ff4fa3) with **Left-Hand Edge** (#ff7bbd): left-hand notes are a 60% magenta fill with a 2px lighter-pink outline, so the hands differ by fill style and lightness as well as hue (legend and dock swatches use the same recipe).

### Tertiary (judgement spectrum)
- **Perfect Lime** (#d7ff3d), **Great Mint** (#34e89a), **Good Orange** (#ff8a3d), **Miss Red** (#ff4a3d, `--bad` in CSS). Each is always paired with its word in the judge callout; Great and Good also leave a persistent shape on the staff (dot, diamond), Miss a triangle. Miss red also marks wrong staff heads and the bar heat on the scrubber. Mint additionally marks MIDI connected (chip dot).

### Neutral
- **Ground** (#090b17): page, stage clear colour, wells (segmented, scrubber, inputs, kbd).
- **Panel** (#10132a): top bar, staff strip, dock, drawer, results card.
- **Panel Raised** (#181c3b) and **Panel Hover** (#20254b): buttons, chips, banner; hover step.
- **Line** (#262b55): hairlines, row dividers, meter track, scrubber border.
- **Line Strong** (#3a4180): the selected / track surface: selected segment, switch track, table-head rule.
- **Edge** (#5a6196): every control border and slider track (3:1 against Panel). Line stays hairline-only.
- **Scrim** (rgba 9,11,23 at .82): ready card and results overlay. **Shade** (rgba 0,0,0 at .6): the soft shadow under stage words.
- **Ink** (#ecebf5), **Ink Soft** (#a9acd0), **Ink Faint** (#8a8fbd): primary, secondary, and caption/label text. Ink Faint is the floor for text on Panel.
- Stage-only (palette.ts mirrors the CSS custom properties): lane tints #161b42 / #0b0e25 alternate per white key, octave and bar grid #4a528f, receptor #fff3d6, key white #e7e6f1, key black #15182e, muted key names and unlit receptor lamps #5b5f8a.

### Named Rules
**The Neutral Progress Rule.** Mastery is measured in Ink, not in a judgement hue: the meter fill is Ink Soft, and Ink once the stage is solid. The state is always also stated in words ("Solid", "7 of 12 notes seen", "Not started") and as a percentage.

**The Calm Staff Rule.** Notation is Ink on Panel. Colour appears on a staff glyph only as state: lamp for awaited, grade colour for a hit, miss red for a miss; it then decays to Ink Faint as "played".

**The One Lamp Rule.** Amber means "play this, now": the verb (primary action, the one Continue / Start-here row) and the now-markers (playhead, cursor, awaited note, receptor lamps). It is never chrome, never selection, never a judgement grade, and never more than one primary per view.

**The Semantic Hue Rule.** Hand colours (cyan, magenta + pink edge) and judgement colours (lime, mint, orange, red) are semantic. They appear only where a hand or a grade is being reported, and are never reused for chrome, decoration, selection or emphasis.

**The Word And Shape Rule.** A judgement colour never stands alone; it ships with its word (or letter grade) and, on the staff, a position or mark.

## Typography

**Display Font:** Barlow Condensed 800 italic (fallback Arial Narrow, sans-serif); 700 upright is loaded for Pixi key labels.
**Body Font:** Hanken Grotesk Variable (fallback system-ui). Body sets `tabular-nums` globally so counters never jitter.
**Notation Font:** Bravura (SMuFL, OFL, self-hosted woff2) for every staff glyph.

**Character:** A scoreboard shout over a quiet instruction manual.

### Hierarchy
UI text has three sizes: 13 (label, kbd, sub-lines), 15 (body, controls), 18 (table names, ready sentence, result lines). Display italic has four: 22, 28, 34, 54. Stage words sit outside the ramp.
- **Display** (800 italic, 54px, 0.95): library heading, wordmark excepted (30px); ready-card title (54px, 38px when the window is under 820px tall).
- **HUD numeral** (800 italic, 34px, 1; 28px under 1180px): score, combo, accuracy. Combo number and x-multiplier are Ink; the multiplier is a 22px badge with a 1px Ink Faint outline.
- **Title** (800 italic, 28px, 1, uppercase, +0.04em): drawer heading, big buttons, tempo value, letter grade in tables; results heading is 34px, +0.03em.
- **Body** (400-650, 15px, 1.45): controls, banners, drawer prose. Table names 18px, sub-line 13px; prose capped at 52-56ch.
- **Label** (700, 13px, +0.1em, uppercase): the one label style, shared by HUD captions, table heads and captions, drawer legends, group caps and the lamp "Next / Continue / Start here" tag. Captions are Ink Faint (Ink Soft on band rows). HUD captions are 15px while `body.reading`.
- **Stage words:** judge callout 40px, ready title 54px, count-in 160px, combo slam `clamp(64px, 11vw, 150px)`, results grade 190px, staff grade word 17px. All Display italic, set over a soft Shade, never a hard text-shadow.

### Named Rules
**The Announce Versus Read Rule.** Display italic is for what is announced (score, grade, judgement, headings, primary big actions). Anything the player must read in running sentences is Hanken.

## Layout

A single-column app grid: 56px top bar, then one view. Play view rows by view switch (Staff / Both / Falling): Both is staff strip `minmax(160px, 31vh)` + highway + dock; Staff-only is the staff filling the screen with a `clamp(96px, 15vh, 150px)` highway strip; Falling-only drops the staff row. The keyboard is drawn inside the highway canvas at the bottom, 24% of stage height at most. The Staff-only view renders ONE large, centred system at about 26px per staff space (two systems only when the window is tall enough for a second at readable size), with as many bars (1-4) as fit across. The HUD cluster sits right in the bar after a spacer. Library pads `32px clamp(16px, 6vw, 96px) 64px`; rows lead with a 140x52 first-bars thumbnail (src/thumb.ts, noteheads on a miniature grand staff, no clefs). The whole row opens Learn; the Learn button is secondary and Perform is ghost; a single amber Continue (or Start here) row carries the primary. A Best column appears only once a first score exists. The Read page uses the library padding and the same table: a lib-head, the Next-up strip, then the Stages table (rows 8px tighter than songs).

The dock has two rows. Row 1: Play (big), restart, scrubber, loop buttons (Learn only). Row 2, the aids: Wait for me, tempo slider + value + 50/75/100 presets, then hands (Learn only; Right and Left each a swatch and a Play / Listen / Hide switch). Perform shows only row 1, and its scrubber is a non-interactive progress bar. The drawer is a 420px right sheet under the bar, opened with focus on its heading; its groups (Look and feel, Sound, Timing, Keyboard, Hands, Shortcuts, Your data) are fieldsets, with help text behind `<details>` disclosures (+ / minus). In a reading drill the play rows invert to staff `minmax(0, 1fr)`, highway strip `clamp(150px, 24vh, 230px)`, dock auto: the staff is the screen. While a piece is open the section switch is hidden and the "All stages" button (drills) or the mode switch (songs) takes its place.

Spacing rhythm is 8 / 12 / 16 / 24 / 32, with 10-14px for gaps inside controls. Responsive: under 1360px the view switch shows icons only; under 1180px HUD captions are visually hidden for Perform (kept for Learn and Read, at 12px), tempo presets and the hand labels hide, HUD numerals drop to 28px and bar gaps tighten. Below 1024px a fixed "widen your window" notice covers everything; there is no tablet/phone layout. Whole key range follows the song (min 35 semitones, white key width capped at 76px) unless "full" is set.

## Elevation & Depth

Tonal layering, mostly flat: Ground wells recess into Panel surfaces, hairline borders separate regions. Real shadows are reserved for things that float over the stage: banner (`0 10px 30px rgba(0,0,0,.5)`) and the drawer (`-18px 0 40px rgba(0,0,0,.45)`). Stage words sit on a soft Shade (`0 2px 24-28px`) rather than hard shadows. Light is a state signal on the stage and staff: the staff cursor, scrubber head, and hit notes carry a coloured `drop-shadow`/`box-shadow` glow in their own colour; the highway adds additive radial glows and sparks scaled by the Effects setting (Off / Calm / Arcade / Max). Under `prefers-reduced-motion`, CSS animation and transition collapse to ~0ms and canvas effects are capped to Calm.

### Named Rules
**The Glow Means State Rule.** A glow is allowed only on an element reporting live state in its own colour. Chrome (buttons, panels, headings) does not glow.

**The Soft Shade Rule.** Nothing carries a hard offset shadow or a hard text-shadow, including the primary button. Separation is a border, a tonal step, or a soft Shade.

## Shapes

Four radii and one control height. 4px (kbd, thumbnails, scrubber, segment cells, focus ring, multiplier badge, legend swatches), 8px (buttons, segmented outer, inputs), 12px (banner, drop zone, Next-up strip, ready card, results card), and pill (chips, switches, sliders, meters). Controls are 40px high (36 small, 52 big, 32 segment cells inside a 3px well). Every control border is Edge. Falling notes are 5px rounded bars inset 3px inside their lane (1.5px on black keys), with a 3px bright bottom edge marking the moment to play. Left-hand bars are tinted with a lighter outline, right-hand bars solid.

## Components

### Buttons
- **Shape:** 8px radius, 40px high (36 small, 52 big), 1px Edge border, no offset shadow.
- **Default:** Panel Raised fill, Ink text, weight 650; hover brightens border to Ink Faint and fill to Panel Hover; active nudges 1px down. "Songs" and "All stages" on the results cards are this outlined default.
- **Primary:** Lamp fill, Lamp Ink text, weight 800; hover Lamp Bright. Big variant is Barlow 800 italic 28px uppercase, 52px high. One per view.
- **Ghost / Icon:** transparent, Ink Soft; hover reveals Panel Raised and a Line border. Icon buttons are 40px square with a 20px stroked SVG, 2px round-capped. Perform in the library is ghost.
- **Disabled:** Ink Faint text, transparent fill, Line border.

### Chips
- Pill, 40px, Panel Raised, Edge border. The status dot is outlined Ink Faint for "No keyboard" (a normal state, not a fault); filled mint when a keyboard is connected, and the chip border turns mint with a soft ring while live.

### Segmented switch
- Ground well, Edge border, 8px radius, 3px padding, 32px cells at 4px radius. Selected cell is Line Strong fill, Ink text and an inset 1px Edge ring; there is no amber. Used for Perform|Learn, hand modes, effects, and the top-bar section switch Songs | Read music.
- **View switch:** Staff / Both / Falling, each an 18px icon plus word; icons only under 1360px.

### Inputs / Fields
- Selects and number inputs: 40px, Ground fill, Edge border, 8px. Sliders: 6px Edge track, 22px Ink thumb with a Panel ring. Switch: 46x26 pill, Line Strong track with an inset Edge ring and an Ink Faint thumb when off (outlined), Ink Soft track with a Ground thumb when on.
- **Focus (all controls):** 2px Lamp outline, 2px offset.

### Navigation (section switch)
- Top bar, after the wordmark (Ink, Display italic 30px): a Segmented switch (radiogroup "Section") with Songs and Read music. Hidden on the play screen. The "All stages" button replaces it there in a drill: a standard bordered Button, not a ghost, so the way out is visible from across the room.

### Mastery meter
- 10px Line track, pill radius, Ink Soft fill (Ink when solid), `role="meter"` with min, max, now and a label. Sits in a flex row (`mrow`) beside a right-aligned percentage in bold. Never coloured by grade.

### Song and stage tables
- Rows have a bottom Line rule and a faint white hover wash. Songs rows: thumbnail, name (18px) with sub-line (13px), bars, length, Best (once scored), actions. The one Continue / Start-here row carries a Lamp label tag and a primary Learn button with a play icon. Stage table: group rows use the Label style in Ink Soft; the recommended stage carries the Lamp "Next" tag.
- **Next-up strip:** 1px Edge border, 12px radius, 14px 18px padding, Ink Soft text with the stage name in Ink; a primary "Start" on the right.

### Banner, Ready card and Results card
- Banner: Panel Raised, 12px radius, floats at top of stage. Ready card: Scrim over the stage, 12px radius, names the song (54px), one sentence, and a colour legend: Right hand (cyan swatch), Left hand (tinted swatch with pink outline), Play this (lamp swatch). Results card: Panel, Edge border, 12px radius, 880px max, grid of giant grade letter (colour by grade), stats, counts, timing histogram with the centre bin in Ink. Footer actions: a primary big action, and outlined "Songs" / "All stages".

### Highway and keyboard (signature)
- Alternating lane tints per white key, brighter line at each C and each bar, a bright receptor line over the keys with a small lamp over every white key (Lamp when lit, muted otherwise), on-screen keyboard (Key White / Key Black). Held keys pulse a lane gradient in the hand's hue. Awaited notes get a pulsing Lamp outline.

### Grand staff (signature)
- SVG, Bravura at 40px (10-unit staff space), Ink on Panel, 1.1 stroke staff lines, 1.4 bar lines, lamp cursor line. Two bars shown (one when dense). Played notes dim to Ink Faint; hits ignite for 0.8s in the grade colour then settle to played. Great and Good leave a persistent 0.8-opacity shape under the head (mint dot, orange diamond) like the miss triangle. In Staff-only view the grade also appears as a coloured word (17px Display italic, Perfect / Great / Good with an early or late arrow) above the notation, clear of the highest ink, fading in about 1s. Beams are flat Ink rectangles across the stem tips, never slanted. In a reading drill the awaited card is every notehead of the next chord lit in Lamp.

### Reading-drill play screen
- Body gets `reading`, the play grid gets `drill`. The staff is the large element (single staff when one clef is used, lines at 1.7); the falling notes and key names are hidden by default and revealed by the dock switches "Falling notes" and "Note names" (standard Switch, only shown in this mode). The HUD swaps to Cards, Streak, First try, Median. The ready sentence is 20px.

### Drill results
- Same Results card, single column, in a `position: fixed` overlay from the bottom of the top bar to the screen edge. Heading "[Stage]: set complete", a stat sentence, a mastery sentence with the meter, the "Needs the most work" list, then a big primary ("Another set" or "Next stage" when solid) and an outlined "All stages".

### Scrubber
- 44px Ground well with a Line border and a per-bar miss heat strip (Miss Red). In Learn it is a slider: an A-B loop region (Ink 14% fill, 2px Ink edges) and a Lamp playhead. In Perform it is a progress bar showing only the playhead.

## Do's and Don'ts

### Do:
- **Do** keep notation Ink on Panel and let it ignite only for state.
- **Do** pair every judgement colour with a word, letter or position.
- **Do** differentiate hands by hue, fill style (solid vs. tinted with a lighter outline) and lane edge.
- **Do** reserve Lamp (#ffc83d) for the verb and the now-markers, and use the 2px/2px Lamp focus ring everywhere.
- **Do** keep hand and judgement colours semantic: only where a hand or a grade is reported.
- **Do** draw control borders in Edge (#5a6196) and keep Line for hairlines.
- **Do** use one control height (40px) and the four radii (4, 8, 12, pill).
- **Do** use Barlow Condensed 800 italic for announced values and Hanken for reading text; keep numerals tabular.
- **Do** mirror any new colour in `src/palette.ts` if Pixi draws it.
- **Do** show mastery as an Ink meter plus a percentage and a word, never as a grade colour.
- **Do** cap canvas effects to Calm and collapse CSS motion under `prefers-reduced-motion`.

### Don't:
- **Don't** add synthwave sun, perspective grid, or glow on chrome.
- **Don't** add a hard offset shadow or a hard text-shadow; use Shade.
- **Don't** colour notation permanently; colour is a transient state.
- **Don't** use amber for selection, switches, slider thumbs, the wordmark, combo or multiplier, and never for a judgement grade.
- **Don't** reuse a hand or judgement colour for chrome.
- **Don't** set text dimmer than Ink Faint (#8a8fbd) on Panel, or smaller than 12px.
- **Don't** design below 1024px; the narrow notice is the whole responsive story.
