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
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
  hud-numeral:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "30px"
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
  heading-lg:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.03em"
  section:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.03em"
  stage-word:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "54px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "0.02em"
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
  hair: "4px"
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
  select:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "40px"
    padding: "0 10px"
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
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "18px 20px"
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
  mastery-cell:
    backgroundColor: "{colors.panel-2}"
    rounded: "{rounded.xs}"
    width: "26px"
    height: "40px"
  week-day:
    textColor: "{colors.ink-3}"
    size: "22px"
  plan-row:
    textColor: "{colors.ink}"
    padding: "14px 4px"
  plan-lead:
    textColor: "{colors.ink-2}"
    width: "24px"
  band-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.xs}"
    padding: "8px 10px"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.xs}"
    padding: "3px 6px 2px"
  tag-next:
    textColor: "{colors.lamp}"
  sheet:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    width: "680px"
  popmenu:
    backgroundColor: "{colors.panel-2}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  chord-readout:
    backgroundColor: "{colors.scrim}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-lg}"
    rounded: "{rounded.md}"
    padding: "8px 16px 10px"
  next-strip:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "14px 18px"
---

# Design System: piano

## Overview

**Creative North Star: "The DDR Cabinet at Night"**

A dark, cool-blue room with lit lane panels, a bright receptor line over the keys, and judgement words in heavy condensed italic. The arcade lives on the stage (highway, receptor, sparks, the combo slam). The notation does not: the grand staff is the scoreboard, set in near-white Bravura on a flat panel, and it ignites only to report state (awaited note, hit grade, miss). The shell around the stage is plain web controls (segmented switch, sliders, buttons, rows) and stays quiet. Reading drills reuse the same room with the arcade turned down: the staff takes the screen and the highway shrinks to a strip.

The iPad in landscape is the main screen, a desktop browser the second. The player sits 1-2 m away with busy hands, so state is carried by word, shape, and hue together, never hue alone, and every target is thumb-sized on a coarse pointer. Density is moderate and fixed: a 56px top bar, one view, a docked transport. One control height (40px, 44px on touch) and four radii run through the whole shell. Five tabs live in the top bar until a piece opens: Today, Songs, Read, Technique, Progress. Today is a generated plan, not a menu.

**Key Characteristics:**
- Cool navy ground with one warm voice, the lamp amber, that means only "play this / now". Everything else in the shell is neutral Ink.
- Heavy italic condensed display type for what is announced; a quiet grotesk for what is read.
- Glow is a state signal on the staff and stage only. No hard offset shadows, no hard text-shadows.
- Every page shares one measure and one head; plan rows, song rows and stage rows are one grammar.
- Touch first: `pointer: coarse` raises controls to 44px. Below 1024px wide a full-screen notice still replaces the app.
- Copy is label, value, nothing else.
- One dialog grammar (`dialog.sheet`), one tag style, one disclosure marker.

## Colors

A navy-ink night palette with one amber lamp, two hand hues, and a four-step judgement spectrum (lime, mint, orange, red) that deliberately excludes amber.

### Primary
- **Marquee Lamp** (#ffc83d): the verb and the "now" markers only. Primary buttons (at most one per view: the Continue / Start row on Songs, the Next row's Practice on Read, the first undone plan row on Today, Start in the Technique head, the dock Play and the big action on results, Use these in Options), the lamp Next tag on the same row as its primary, the staff cursor, scrubber playhead, awaited notehead (in a drill, every head of the next card), receptor lamps over lit keys, awaited-note outline on the highway, the "Play this" legend swatch, the count-in numeral and the combo slam, the focus ring and text selection. Hover is **Lamp Bright** (#ffd766). The wordmark, selected segments, switches, slider thumbs, combo number and x-multiplier are Ink, not lamp.
- **Lamp Ink** (#1a1300): text on any lamp fill.

### Secondary (hands)
- **Right-Hand Cyan** (#3fe0ff): right-hand notes, solid filled bars.
- **Left-Hand Magenta** (#ff4fa3) with **Left-Hand Edge** (#ff7bbd): left-hand notes are a 60% magenta fill with a 2px lighter-pink outline, so the hands differ by fill style and lightness as well as hue (legend and dock swatches use the same recipe).

### Tertiary (judgement spectrum)
- **Perfect Lime** (#d7ff3d), **Great Mint** (#34e89a), **Good Orange** (#ff8a3d), **Miss Red** (#ff4a3d, `--bad` in CSS). Each is paired with its word in the judge popup; Great and Good also leave a persistent shape on the staff (dot, diamond), Miss a triangle. Miss red marks wrong staff heads and the bar heat on the scrubber. Mint additionally marks MIDI connected (chip dot).

### Neutral
- **Ground** (#090b17): page, stage clear colour, wells (segmented, scrubber, inputs, kbd).
- **Panel** (#10132a): top bar, staff strip, dock, drawer, cards, results card.
- **Panel Raised** (#181c3b) and **Panel Hover** (#20254b): buttons, chips, banner, band chips, mastery-cell track; hover step.
- **Line** (#262b55): hairlines, row dividers, meter track, scrubber border.
- **Line Strong** (#3a4180): the selected / track surface: selected segment, switch track, table-head rule.
- **Edge** (#5a6196): every control and card border, slider track (3:1 against Panel). Line stays hairline-only.
- **Scrim** (rgba 9,11,23 at .82): ready card, results overlay, chord readout. **Shade** (rgba 0,0,0 at .6): the soft shadow under stage words.
- **Ink** (#ecebf5), **Ink Soft** (#a9acd0), **Ink Faint** (#8a8fbd): primary, secondary, and caption/label text. Ink Faint is the floor for text on Panel.
- Stage-only (palette.ts mirrors the CSS custom properties): lane tints #161b42 / #0b0e25 alternate per white key, octave and bar grid #4a528f, receptor #fff3d6, key white #e7e6f1, key black #15182e, muted key names and unlit receptor lamps #5b5f8a.

### Named Rules
**The Neutral Progress Rule.** Mastery and effort are measured in Ink, not in a judgement hue: meter and mastery-cell fill is Ink Soft, and Ink once solid; a practised day is an Ink dot. State is also stated in words ("Solid", "7 of 12 seen") and as a percentage.

**The Calm Staff Rule.** Notation is Ink on Panel. Colour appears on a staff glyph only as state: lamp for awaited, grade colour for a hit, miss red for a miss; it then decays to Ink Faint as "played". A hold outline (orange for held too long, red for released early) is the one state that stays on the head. Aids that are not score (ghost notes, dynamics marks, 8va brackets, the Dense hint) are Ink Soft or Ink Faint.

**The One Lamp Rule.** Amber means "play this, now": the verb and the now-markers. It is never chrome, never selection, never a judgement grade. Counted per screen: at most one lamp-filled button, and the lamp Next word only on that button's row. A page with nothing left to do (every plan row done) shows none. On the play screen the dock Play is the one fill; the cursor, awaited heads, receptor lamps and count-in are its now-markers.

**The Semantic Hue Rule.** Hand colours (cyan, magenta + pink edge) and judgement colours (lime, mint, orange, red) appear only where a hand or a grade is being reported, never as chrome, decoration, selection or emphasis.

**The Word And Shape Rule.** A judgement colour never stands alone; it ships with its word (or letter grade) and, on the staff, a position or mark.

## Typography

**Display Font:** Barlow Condensed 800 italic (fallback Arial Narrow, sans-serif); 700 upright is loaded for Pixi key labels.
**Body Font:** Hanken Grotesk Variable (fallback system-ui). Body sets `tabular-nums` globally so counters never jitter.
**Notation Font:** Bravura (SMuFL, OFL, self-hosted woff2) for every staff glyph: noteheads, clefs, rests, accidentals, flags, tuplet numerals, time-signature digits and the dynamic letters p, mf, f.

**Character:** A scoreboard shout over a quiet instruction manual.

### Hierarchy
UI text has three sizes: 13 (label, kbd, sub-lines, fine print), 15 (body, controls), 18 (row names, ready sentence, result lines). 14 appears in touch-range chips, histogram text and credit blocks (see debt). Display italic as built uses 22, 28, 30, 34, 40 plus stage words. Full table under Design Grammar.
- **Display** (800 italic, 40px, 1): the page h1 on every page, the judge popup.
- **HUD numeral** (800 italic, 30px, 1): score, combo, cards, with a 12px Label caption stacked above. Combo number and x-multiplier are Ink; the multiplier is a 22px badge with a 1px Ink Faint outline.
- **Title** (800 italic, 28px, 1, uppercase, +0.04em): drawer and dialog-sheet headings, big buttons, tempo value, letter grade in tables.
- **Heading large** (800 italic, 34px, uppercase): results heading, chord readout, narrow notice.
- **Section** (800 italic, 22px, uppercase, +0.03em): `h2.sec` blocks on Progress. Also the multiplier badge size.
- **Body** (400-650, 15px, 1.45): controls, notes. Row names 18px, sub-line 13px or 15px Ink Faint; prose capped at 52-56ch.
- **Label** (700, 13px, +0.1em, uppercase): the one label style: HUD captions (12px), table heads and captions, group caps, the Next tag and the outlined tags.
- **Stage words:** ready title 54px (38px under 820px tall), count-in 160px, combo slam `clamp(64px, 11vw, 150px)`, results grade 190px, staff grade word 17px. Display italic, over a soft Shade.

### Named Rules
**The Announce Versus Read Rule.** Display italic is for what is announced (score, grade, judgement, headings, big actions). Anything read in a sentence is Hanken.

## Layout

A single-column app grid: 56px top bar (safe-area insets padded for the iPad), then one view. Top bar, left to right: wordmark (Display 30px, Ink), the five-tab section switch (hidden on the play screen), the song title (play), "All stages" (drills) or the Perform | Learn switch (hidden on the start card, which carries the choice) (songs), a spacer, the HUD, the MIDI chip, the settings icon button.

Every non-play page (Today, Songs, Read, Technique, Progress) pads `32px clamp(16px, 6vw, 96px) 64px`, scrolls, and centres its children at `min(100%, 1100px)` (One Measure). Play rows by view: Both is staff `minmax(160px, 31vh)` + highway + dock; Staff is the staff filling the screen with a `clamp(96px, 15vh, 150px)` highway strip; Falling drops the staff row; a reading drill is staff `minmax(0, 1fr)` + strip `clamp(150px, 24vh, 230px)` + dock. The keyboard is drawn inside the highway canvas, 24% of stage height at most.

Spacing rhythm is 4 / 8 / 12 / 16 / 24 / 32 with 6, 10, 14, 18, 20 inside controls and cards. Responsive: under 1180px bar gaps tighten and, with a fine pointer only, tempo presets and hand labels hide (a coarse pointer keeps them); under 820px tall the ready card compacts; `pointer: coarse` sets `--control` to 44px, segment cells to 38px, small buttons to 44px, slider thumbs to 32px; `hover: none` hides the drawer footer links (see debt); disclosure summaries get a 44px row. Below 1024px wide a fixed notice covers the app (iPad portrait gets it; see debt).

## Elevation & Depth

Tonal layering, mostly flat: Ground wells recess into Panel surfaces, Edge borders separate cards and controls, Line hairlines separate rows. Real shadows are reserved for things that float: banner (`0 10px 30px rgba(0,0,0,.5)`), the drawer (`-18px 0 40px rgba(0,0,0,.45)`) and the Aids popover (`0 -8px 24px rgba(0,0,0,.4)`). A dialog sheet has no shadow: Edge border over a dark backdrop (`rgba(5,6,13,.7)`). Stage words sit on a soft Shade (`0 2px 24-28px`); the judge popup uses a Ground halo (`0 0 6px, 0 0 14px`, no offset). Light is a state signal: the staff cursor, scrubber head, hit notes and ghost snaps carry a glow in their own colour; the highway adds additive radial glows and sparks scaled by Effects (Off / Calm / Arcade). Sheet view forces effects off; under `prefers-reduced-motion` CSS motion collapses to ~0ms and canvas effects cap to Calm.

### Named Rules
**The Glow Means State Rule.** A glow is allowed only on an element reporting live state in its own colour. Chrome does not glow.

**The Soft Shade Rule.** Nothing carries a hard offset shadow or a hard text-shadow, including the primary button. Separation is a border, a tonal step, or a soft Shade.

## Shapes

Four radii and one control height. 4px (kbd, thumbnails, scrubber, segment cells, focus ring, multiplier badge, band chips, tags, mastery cells, swatches), 8px (buttons, segmented outer, selects, Aids popover), 12px (cards, dialog sheets, banner, ready, results, chord readout, next strip), pill (chips, switches, slider tracks, meters). Controls are 40px (44 coarse); small 36 (44 coarse); big 52; segment cells 32 (38 coarse) inside a 3px well. Every control border is Edge. Falling notes are 5px rounded bars inset 3px inside their lane (1.5px on black keys), with a 3px bright bottom edge marking the moment to play. Left-hand bars are tinted with a lighter outline, right-hand bars solid.

## Components

Each component: anatomy, then states. All interactive states share the 2px Lamp focus ring, 2px offset.

### Segmented control
- Ground well, Edge border, 8px, 3px padding, 2px gap; cells 32px at 4px radius (38 coarse), Ink Soft text 650. Radio inputs are visually hidden over the cell.
- Selected: Line Strong fill, Ink text, inset 1px Edge ring (no amber). Hover on unselected: Ink text, Panel Raised fill.
- Used for: section tabs, Perform | Learn (bar and start card), view, hand modes, plan length (5 / 10 / 20 min), Notes shown (Full, Thin chords, Melody and bass, Melody) and every drawer choice row.

### Switch
- 46x26 pill, 20px thumb; label 600 beside it, min-height 40px. Off: Line Strong track, inset Edge ring, Ink Faint thumb. On: Ink Soft track, thumb Ground, 20px travel. Never amber.

### Buttons
- 8px radius, 40px high (44 coarse), 1px Edge border, 650 weight, no offset shadow; active nudges 1px down.
- **Default:** Panel Raised fill; hover Panel Hover fill and Ink Faint border.
- **Primary:** Lamp fill, Lamp Ink text, 800; hover Lamp Bright. One per view. A leading 20px solid play icon marks "start/continue".
- **Big:** primary at 52px, Display 28px italic uppercase, min 124px; results and the dock Play.
- **Ghost:** transparent, Ink Soft; hover Ink, Panel Raised, Line border. Row actions (Learn, Perform, Options, Start, Practice on non-next rows), icon buttons (close, focus).
- **Small:** 36px, 0 12px (44 coarse); drawer data buttons and tempo presets.
- **Icon:** 40px square, 20px stroked SVG, 2px round caps.
- **Disabled:** Ink Faint text, transparent fill, Line border.

### Select and number field
- 40px (44 coarse), Ground fill, Edge border, 8px, 0 10px padding, full width of its cell. In a `.field` the 650 label sits above with 6px gap; `.field.inline` puts it left of an auto-width select.

### Chip
- Pill, 40px, Panel Raised, Edge border, 600. Dot outlined Ink Faint for "No keyboard" (a normal state); filled mint when connected, chip border mint with a soft ring while live.

### Mastery meter
- 10px Line track, pill, Ink Soft fill (Ink when solid), min fill 4px, `role="meter"` with min, max, now, label. Sits in `.mrow` beside a right-aligned bold percentage (min 3.2ch). The goal meter on week blocks is the same meter.

### Mastery cell
- 26x40px, 4px radius, Panel Raised track, fill rises from the bottom in Ink Soft (Ink when solid). Reading cells fill to the stage percentage; technique cells fill 100% solid or due, 50% learning, 0 new, and a due cell adds a 2px inset Ink Soft outline. Cells are grouped in a `.cgrp` (6px gap): Label caption over a `.crow` (4px gap); groups wrap with 20px / 28px gaps. The group carries `role="group"` with "n of m solid"; each cell has a title with name and percent or state word.

### Week day
- Column of a 22px circle over a 13px 700 letter. Not practised: 2px Edge ring, Ink Faint letter. Practised: Ink fill. Today: Ink letter, Ink Soft ring if not yet practised. Row gap 10px. Followed by a goal meter and "N of M min".

### Plan row
- Flex, gap 20px, padding 14px 4px, Line rule above (and below the last). Today rows start with a 24px lead column (`.plead`, empty or a 20px check in Ink Soft when done); title 18px 650 over a 15px Ink Faint sub-line ending "about N min"; optional 260px mastery row; action at the right. Only the first undone row's action is primary (with a play icon). Done rows sink to the bottom, title Ink Soft, no time, ghost action. Technique Path rows are the same row without the lead column. Nothing locks; every row stands alone.

### Card
- Panel fill, Edge border, 12px radius, padding 18px 20px, gap 12 (`.tcard`). Variants: week strip (`.span`: days and goal meter side by side, 32px column gap, 24px below), the Progress week, the strip (flex, space-between, 16px gap: touch range) and the last-week recap (flex, space-between, Ink Soft sentence with Ink figures, optional ghost "Aim for N min"). Results card: 28px 32px, 880px max.

### Touch-range card
- Strip card: a Label "Touch range" over three value chips (Soft 1-n, Medium n-m, Hard m+), 4px apart, max 600px, each flex-proportional to its velocity range. Chip is outlined (1px Edge, transparent, 4px radius), 650 14px Ink Soft, nowrap; `role="img"` states the ranges. Beside it a ghost "Use defaults" once set and "Set touch range". While calibrating the chips are replaced by "Play 10 soft notes: k of 10" and Cancel; a status line (`p.note`) may follow the card.

### Tag
- A Label-style word (13px 700, +0.1em, uppercase) outlined 1px Edge, 4px radius, padding 3px 6px 2px, Ink Soft, 10px left of the name. "Due" on a Technique path row, "n due" on a Read row. `.tag.next` ("Next") drops the outline and the padding and takes Lamp; it sits only on the row that holds the primary.

### Disclosure
- One marker for every `<details>`: a 1.2em slot holding "+" (closed) or "−" (open) in Ink Faint, native triangle removed. Summary is Ink Faint (library groups: 650 Ink with an Ink Faint count), 44px row on coarse pointers. Used by drawer Advanced, library level groups (first group open) and the Path "n more".

### Dialog sheet
- `dialog.sheet`: Panel, Edge border, 12px, `min(680px, 94vw)` wide (Shortcuts 440px), max 86vh, flex column over a dark backdrop. Header (20px 22px 8px 26px): Title 28px italic uppercase h2, optional Ink Soft line under it, ghost icon close at the right. Body scrolls (4px 26px 12px); `h3` is the Label style in Ink Faint; `.fine` is Ink Soft. Footer is pinned: Line rule above, actions right-aligned, 8px gap, `.grow` spacer to split left and right actions, nowrap buttons. Used by Options (facts list, track switches with a hand select each; footer Remove, Share, Pick for me, Cancel, primary Use these), Credits (sounds and scores, footer Close) and Shortcuts. The settings drawer is a side panel, not a sheet.

### Aids popover
- `.pop` in the Learn dock: an "Aids" button (`aria-expanded`) opening `.popmenu` upward: Panel Raised, Edge border, 8px, 200px min, 10px 14px padding, 4px gap, soft shadow. Three switches: Auto tempo, Hide played, Hold to advance. Closes on an outside click or Escape (focus returns to the button).

### Learn dock
- Row one: big lamp Play (Play, Resume, Pause, Again), Restart icon button, focus icon button (`aria-pressed`, also M), the scrubber, then loop buttons. "Loop worst bars" appears only once there are red bars; "Clear loop" only while a loop is set. Row two: "Wait for me" switch (Learn); Falling notes and Note names switches (Read); Tempo group (Label, 150px slider, 28px value, presets 50 / 75 / 100 as small buttons); Aids; then right-aligned hand groups (swatch, name, Play | Listen | Hide). Controls hide by mode, never disable.

### Start card
- The ready card holds, top to bottom: title (54px), a credit line for open-library pieces (15px Ink Faint), Perform | Learn with a one-line hint, the "Notes shown" Label and four-level Simplify switch (only when Melody would drop at least 10% of notes), the start hint, and the colour legend once per device. Background is near-opaque Ground (`rgba(9,11,23,.94)`).

### Banner, Ready card, Results card
- Banner: Panel Raised, 12px, floats at stage top. Ready card: Scrim, 12px, title (54px), one sentence ("Tap Play to start." on coarse, "Press Space to start." otherwise; Learn adds "The song waits for you."), legend once per device (Right hand cyan swatch, Left hand tinted with pink outline, Play this lamp). Results card: grade letter (Learn shows a check), one stat line, counts with shape swatches, timing histogram (centre line Ink), touch histogram, then actions. Drill results are single column in a fixed overlay under the bar.

### Judgement popup
- `#judge`: Display 40px italic uppercase, centred over the stage, colour by grade (lime, mint, orange, red), word always present. Beneath it a 15px early/late or touch line in Ink at 85%. Ground halo, no offset.

### Ghost note
- What the player is pressing, drawn on the staff: hollow notehead, dashed Ink Soft stroke 1.5, ledger/accidental text Ink Soft, ignores the pointer. Hit: slides onto the written note, fills 40% in the grade colour with a same-colour glow, fades by 0.52s. Wrong key: stroke Miss Red, an X, a 0.5s shake. Released unscored: fades 0.25s. Max 12.

### Target pips (falling bar)
- On Technique exercises, a bar at least 22px wide and 26px tall carries 3 squares (8px, 10px pitch) 6px under its top in Ground: 1, 2 or 3 lit (90%) for soft, medium, hard; unlit 22%. Level and count, not colour, carry the meaning.

### Dynamics marks (staff)
- Aim-for dynamic on Technique: p, mf, f are Bravura dynamic glyphs (40px, Ink Soft); cresc. and dim. are 15px italic words in Ink Soft. Once per system between the staves at the left. Accents are a 1.6 round-capped chevron beside notes above C4, opposite the stem. `aria-hidden`.

### Hold feedback (staff)
- After a held note is judged, its head keeps a 1.4px outline: Good Orange when held too long, Miss Red when released early. Perform results report the same fact in words as "held n%".

### Held-chord readout
- Absolute at the right of the play view, 16px in: Scrim, Edge border, 12px, min 120px, right-aligned. Chord name in Display 34px; a 13px Ink Faint line under it. Pointer-transparent, `aria-hidden`.

### Count-in numeral
- 160px Display italic in Lamp, 36% from the top, centred, over a soft Shade, pointer-transparent. One numeral per beat.

### Drawer row
- `.srow`: grid 6.5rem label (Ink Soft) + control, 12px gap, min-height 40px (44 coarse). Controls: a segmented control for choices, a select, a range, or read-only bold text. Instrument and Volume appear only under Sound "This device". Keyboard shows a select only with more than one input. Delay and Data hold inline fields and small buttons. Advanced is a Disclosure holding Note names, "Fade names I know" (indented, disabled while names are off), All 88 keys, Play the file's dynamics, Fall speed (Slow to Fast slider), Hand split. Footer: Credits and Shortcuts links open dialog sheets. No paragraphs; `.fine` status lines (13px Ink Faint) appear only on a fault.

### Scrubber
- 44px Ground well, Line border, per-bar miss heat (Miss Red). Learn: slider with an A-B loop region (Ink 14% fill, 2px Ink edges) and a Lamp playhead. Perform: 18px non-interactive progress bar.

### Highway and keyboard (signature)
- Alternating lane tints per white key, brighter line at each C and bar, a bright receptor line over the keys with a small lamp per white key (Lamp when lit, muted otherwise), on-screen keyboard (Key White / Key Black). Held keys pulse a lane gradient in the hand's hue. Awaited notes get a pulsing Lamp outline.

### Grand staff (signature)
- SVG painted from a pure layout module (`layout.ts`: analysis, window, positions; `staff.ts` only draws and animates). Bravura at 40px (10-unit staff space; grace notes 26px), Ink on Panel, 1.1 staff lines in Ink Faint, 1.4 bar lines, lamp cursor. Bar numbers 12px Ink Faint. The layout draws rests, ties (Ink), tuplets (numeral plus 1.2 bracket), grace notes, 8va / 15ma (15px italic Ink Soft word over a dashed 1.2 bracket), key and time signature changes, and meter-aware beams. Horizontal spacing is a monotone time-to-x map: onset columns never closer than 14 units, wider bars get more room. A bar too crowded at full spacing shows "Too dense: tap to thin" in 12px Ink Soft beside its number; tapping it steps Simplify up one level. A played chord (head, stem, beam, accidental, dot) dims as one group to 42% opacity after its hit flash; hits ignite 0.8s in grade colour then settle. Great and Good leave a persistent 0.8-opacity shape (mint dot, orange diamond); Miss a red triangle, the head fading to Ink Faint after 2s. In Staff view the grade also shows as a 17px word above the notation, fading in about 1s. Beams are flat Ink rectangles. Hide played clips the notation at the cursor so played notes vanish. Note names fade per pitch once known (Fade names I know). In a reading drill the awaited card is every notehead of the next chord in Lamp, staff lines 1.7.

## Do's and Don'ts

### Do:
- **Do** keep notation Ink on Panel and let it ignite only for state.
- **Do** pair every judgement colour with a word, letter or position.
- **Do** differentiate hands by hue, fill style (solid vs. tinted with a lighter outline) and lane edge.
- **Do** reserve Lamp (#ffc83d) for the verb and the now-markers, and use the 2px/2px Lamp focus ring everywhere.
- **Do** draw control borders in Edge (#5a6196) and keep Line for hairlines.
- **Do** use Ink 2, not Ink 3, for text read mid-song (HUD captions, bar numbers, dock labels, scrub labels): Ink 3 is 5.9:1 and Apple asks 7:1 for small dark-mode text. Ink 3 stays for icons, grabbers and menus read at arm's length.
- **Do** keep the staff at print size (staff space about 1.9 mm); the divider's 26% minimum guards it.
- **Do** build controls from `--control` and the four radii (4, 8, 12, pill) so touch sizing follows.
- **Do** start every non-play page with the page head and the 1100px measure.
- **Do** write plan, song and stage rows in the same row grammar.
- **Do** build every modal as `dialog.sheet`; header with close, scrolling body, pinned footer.
- **Do** mark every disclosure with the shared +/− marker.
- **Do** show tags as outlined Ink Soft words; only Next is lamp, on the primary's row.
- **Do** use Barlow Condensed 800 italic for announced values and Hanken for reading text; keep numerals tabular.
- **Do** mirror any new colour in `src/palette.ts` if Pixi draws it.
- **Do** show mastery and effort as Ink meters, cells and dots plus a number or word.
- **Do** cap canvas effects to Calm and collapse CSS motion under `prefers-reduced-motion`.

### Don't:
- **Don't** add synthwave sun, perspective grid, or glow on chrome.
- **Don't** add a hard offset shadow or a hard text-shadow; use Shade.
- **Don't** colour notation permanently; colour is a transient state.
- **Don't** use amber for selection, switches, slider thumbs, the wordmark, combo or multiplier, and never for a judgement grade.
- **Don't** reuse a hand or judgement colour for chrome.
- **Don't** set text dimmer than Ink Faint (#8a8fbd) on Panel, or smaller than 12px.
- **Don't** invent a second dialog layout, an inline-styled modal or a coloured tag.
- **Don't** put a Label-style kicker above a heading.
- **Don't** add paragraphs, parentheticals or explanatory sentences to controls, headers or drawers.
- **Don't** show a streak, points or a loss-framed counter; effort only goes up.

## Design Grammar

### Token table

| Group | Token | Value | Use |
|---|---|---|---|
| Colour | ground / panel / panel-2 / panel-3 | #090b17 / #10132a / #181c3b / #20254b | well, surface, raised, hover |
| Colour | line / line-2 / edge | #262b55 / #3a4180 / #5a6196 | hairline, selected-track, control border |
| Colour | ink / ink-2 / ink-3 | #ecebf5 / #a9acd0 / #8a8fbd | text primary, secondary, caption floor |
| Colour | lamp / lamp-hi / lamp-ink | #ffc83d / #ffd766 / #1a1300 | verb and now |
| Colour | R / L / L-edge | #3fe0ff / #ff4fa3 / #ff7bbd | hands |
| Colour | perfect / great / good / bad | #d7ff3d / #34e89a / #ff8a3d / #ff4a3d | judgement |
| Type, Display italic | 17 / 22 / 28 / 30 / 34 / 40 / 54 | staff grade word / section, badge / title, big button, tempo, drawer h2 / wordmark, HUD numeral / results h2, chord, narrow notice / page h1, judge / ready title | announced |
| Type, Display italic, stage | 160 / `clamp(64px,11vw,150px)` / 190 | count-in / slam / results grade | announced |
| Type, Hanken | 12 / 13 / 15 / 18 | HUD caption, bar numbers / label, kbd, fine, sub-line / body, controls / row name, ready sentence | read |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 | gaps, card gaps, bar padding, section gaps, page top | rhythm |
| Spacing | 6, 10, 14, 18, 20 | inside controls, rows and cards | local |
| Page | `32px clamp(16px,6vw,96px) 64px`, measure 1100px | every non-play page | One Measure |
| Radii | 4 / 8 / 12 / pill | small parts / controls / cards / pills | shape |
| Control | 40 (44 coarse) | buttons, selects, chips, icon buttons, switch row | height |
| Control | 36 (44 coarse) / 52 | small / big button | height |
| Control | cell 32 (38 coarse) in 3px well | segmented | height |
| Control | switch 46x26; slider track 6, thumb 22 (32 coarse); meter 10; scrub 44 (18 progress) | | |

### Page templates

All five pages are `section.view` with the One Measure.
- **Page head:** `h1` Display 40px; optional lede (Ink Soft, below, full width); actions pushed right (`head-actions`, 8px gap). Title is the tab name, one word. 20px below.
- **List page (Songs, Read):** Label-style caption and heads over a fixed-layout table; rows 10px 12px padding with a Line rule and a faint hover wash. The whole row opens Learn.
  - **Songs:** head action "Add files"; then three groups. Starter pieces and Your files share a table: 140x52 first-bars thumbnail, name 18px 650 with a 13px sub-line (starter: author and level; file: date and "n of m tracks"), length, Best (only after the first score), actions (Continue / Start primary on the one next row, otherwise ghost Learn; ghost Perform; ghost Options on every user file, which opens the Options sheet). Your files empty state: one sentence naming the action. Open library: a Label "Open library", then one Disclosure per level (Beginner, Elementary, Intermediate; the first open, count beside the name). Library rows have no thumbnail: name with "composer, licence", best grade letter once earned, ghost Learn and Perform. Credits live in a sheet.
  - **Read:** Label band rows per group (Treble clef, Bass clef, Both clefs, Accidentals and keys, Melodies, Chords), rows 8px tighter, name with blurb, mastery meter with percent and "Solid" or "n of m seen", typical time (only after the first card), Practice. Head action "Review weak notes" when any are due. The next row gets the lamp Next tag and the primary; "n due" is an outlined tag; all other actions ghost.
- **Form page (Technique):** head with the one primary Start; an auto-fit grid (min 150px, 16px gap, align end) of six labelled selects (Pattern, Key, Hands, Dynamics, Articulation, Tempo; the Rhythm pattern swaps Key, Hands, Dynamics and Articulation for Level); the notation preview (max 260px); the touch-range card; then the Path: a Label "Path, n of m solid", the next five unsolved exercises as plan rows (ghost Start; outlined Due tag; Learning or Solid as the sub-line), and the rest folded under a Disclosure "n more".
- **Plan page (Today):** head with the plan length switch (5 / 10 / 20 min); the last-week recap card (early in the week only); the week strip card (days, goal meter, "n of m min"); then the plan as rows with a lead column. 5 min: warm-up, reading; 10 adds the last piece (Continue or Start); 20 adds "Bars a to b of Piece" with a Loop button when a run left weak bars, and a second reading stage. Unfinished steps first in practice order, done steps (check, no time) sink below.
- **Progress page:** head, then `h2.sec` blocks: This week (card with week, goal select), Reading (one sentence count, mastery cells grouped by the six reading groups), Technique (one sentence "n of m exercises solid, k due", cells grouped by path group), Touch (sparkline of average velocity over 30 runs with dashed soft/hard guides, then a Songs-grammar table of the last 8). Empty states carry one sentence.

### Play screen and focus states

Layout is under Layout. States:
- **Ready:** full bar, Perform | Learn, the pane divider, dock; Scrim ready card with title and one sentence; legend once.
- **Running:** count-in numeral, then play. Two and a half seconds into a run (not ready, paused or done) the top bar children go to opacity 0 and stop taking pointer events over 0.35s (hushed). Any pointer move, press or key restores them. The 56px band stays.
- **Hushed:** HUD, title, chip and settings fade together; staff, highway and dock keep their place.
- **Zen:** the dock focus button (any pointer) or M toggles; the bar and the dock aids row are removed, the grid becomes one row, the highway re-lays out. The first dock row stays, so the focus button restores it.
- **Results:** Scrim overlay over the stage with the Results card; dock Play and Restart hidden. Drill results fix the overlay below the bar.

- **Quiet:** in Learn and Technique, after 8 clean notes in a row the judgement words stop; a slip speaks again and resets the run. Perform always speaks.

HUD by mode: Perform shows Score and Combo (x-multiplier badge from x2); Read shows Cards; Learn shows none. Numerals 30px, captions 12px stacked above (15px in Read).

### Motion

- Ease `cubic-bezier(0.16, 1, 0.3, 1)`; buttons, switch thumb, ghost shift 0.14-0.22s; drawer slide 0.22s; bar fade 0.35s. Dialogs and the Aids popover appear without animation.
- Staff: ignite 0.8s ease-out, miss fade 1.2s after 0.8s, grade word 1s, ghost snap 0.52s, ghost shake 0.5s, thud 0.35s.
- Motion reports state or a state change, never decorates. Effects tiers Off / Calm / Arcade: sparks and bursts at Arcade, background pulse at Arcade only; Calm keeps lane pulses.
- Reduced motion: CSS durations 0.01ms; canvas capped to Calm.

### Copy rules

- Label, value, nothing else. A control that names itself gets no sentence.
- Sentence case everywhere; Display italic is uppercased by CSS, not by typing.
- No parentheticals, no "please", "simply", "note that", no hedging.
- One fact once. A number or state is not repeated in a header, a caption and a note.
- Empty states carry one action in one sentence ("Add a MIDI or MusicXML file, or drop one anywhere on this page.").
- Status sentences state the fact: "7 of 12 seen", "3 of 10 min", "about 3 min", "Last week: 45 min on 4 days". No streaks, no loss framing.
- Tags are one word ("Next", "Due"). Dialog and group titles are one or two words ("Options", "Open library"). Disclosures read "n more".
- Hints state the action, not an apology: "Too dense: tap to thin".
- Praise goes quiet when playing is clean; only slips are spoken.
- Touch-aware verbs: "Tap Play" on coarse pointers, "Press Space" otherwise.

### Named Rules (pages)

**The One Measure Rule.** Every non-play page shares the same padding, the 1100px column, and the same page head. No page invents its own left edge.

**The Plan Rows Share Songs Grammar Rule.** A plan row, a song row, a stage row and a path row are one row: optional lead, name over sub-line, optional meter, one action at the right, one primary per view.

**The Touch Floor Rule.** Targets are 40px with a fine pointer and 44px with a coarse one; sizes come from `--control`, not literals.

**The Dialog Sheet Rule.** Every modal is `dialog.sheet`: header with close, scrolling body, pinned footer. One primary at most, in the footer. No modal invents its own frame.

**The Tag Rule.** A tag is one outlined Ink Soft Label word. Only Next is lamp, and only on the row with the primary. Tags never use a hand or judgement hue.

**The One Marker Rule.** Every disclosure uses the same +/− marker in Ink Faint.

**The Quiet Bar Rule.** Chrome fades during a run and returns on any input; it never carries information the player needs mid-run.

## Known quirks and design debt

Recorded from the build; none of these is a rule for new surfaces.
- Hushed bar keeps its 56px band; the stage does not reclaim it. Only Zen reclaims it.
- Display sizes drifted from the earlier 22/28/34/54 ramp to 22/28/30/34/40 (+54 on the ready title, 17 on the staff grade word). 30 (wordmark, HUD) and 40 (h1, judge) were added ad hoc; there is no 24.
- Learn results show a 150px stroked check icon where Perform shows the grade letter; the icon stands in for a grade and has no word beside it.
- Staff hit marks: Perfect and the "ok" touch hit are colour only and decay to Ink Faint after 0.8s; only Great, Good and Miss leave a shape. The "ok" hit and letter grades B and D reuse hand hues (cyan, magenta) for a grade, against the Semantic Hue Rule.
- Hold outlines on staff heads differ by hue only (orange held too long, red released early), against the Word And Shape Rule; the words exist only as the Perform "held n%" figure.
- Georgia italic remains for the cresc. / dim. words and the 8va / 15ma text on the staff: a system serif outside the three font roles.
- The inline file-error message is Miss Red text on chrome.
- Under 1024px wide (iPad portrait) the narrow notice replaces the app; there is no portrait layout.
- The drawer footer links (Credits, Shortcuts) are hidden under `hover: none`, and Credits has no other entry point, so Credits is unreachable on a touch-only iPad. Shortcuts is also keyboard-reachable (?).
- Several values are literals, not tokens: lamp glow rgba, mint ring rgba, loop fill rgba, dialog backdrop rgba(5,6,13,.7), start-card fill rgba(9,11,23,.94) over the Scrim token, 12px/13px/14px/15px sizes in results and drill inline styles, touch-range chips and histograms, 150px/190px grade sizes.
- No hard offset shadow exists on the primary button in `src/style.css` (grep of `box-shadow` and `text-shadow` finds only soft shadows, glows and inset rings); the Soft Shade Rule holds as built.
