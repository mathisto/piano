---
name: Page to Hand
description: Urtext. A piano practice room at night around a lit page of music: dark ink on warm paper, one brass lamp for play this now.
colors:
  ground: "#0c0e12"
  panel: "#13161c"
  panel-2: "#1b1f27"
  panel-3: "#222731"
  line: "#262a33"
  line-2: "#363d4e"
  edge: "#727a8b"
  scrim: "rgba(12, 14, 18, 0.82)"
  shade: "rgba(0, 0, 0, 0.6)"
  ink: "#f4f2ed"
  ink-2: "#a6abb8"
  ink-3: "#8a90a0"
  lamp: "#ffc83d"
  lamp-hi: "#ffd466"
  lamp-ink: "#14110a"
  accent: "#78a9ff"
  right-hand: "#f27d52"
  left-hand: "#2ab7b0"
  left-hand-edge: "#6fd6d0"
  perfect: "#3dd68c"
  great: "#a7e8c4"
  good: "#c9ccd6"
  miss: "#ff3d6e"
  paper: "#efece4"
  paper-ink: "#161513"
  paper-line: "#524e46"
  paper-played: "#78736a"
  paper-cursor: "#a85a00"
  paper-awaited: "#8f4e00"
  paper-miss: "#c8164b"
  lane-a: "#161a22"
  lane-b: "#0e1015"
  lane-grid: "#3a4152"
  receptor: "#fff3d6"
  key-white: "#eae6df"
  key-black: "#1b1d22"
  key-muted: "#5e6472"
typography:
  display:
    fontFamily: "Newsreader Variable, Iowan Old Style, Georgia, serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  stage-word:
    fontFamily: "Newsreader Variable, Iowan Old Style, Georgia, serif"
    fontSize: "52px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Newsreader Variable, Iowan Old Style, Georgia, serif"
    fontSize: "88px"
    fontWeight: 400
    lineHeight: 0.9
    fontFeature: "tabular-nums"
  heading-lg:
    fontFamily: "Newsreader Variable, Iowan Old Style, Georgia, serif"
    fontSize: "34px"
    fontWeight: 500
    lineHeight: 1.1
  title:
    fontFamily: "Newsreader Variable, Iowan Old Style, Georgia, serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
  piece-name:
    fontFamily: "Newsreader Variable, Iowan Old Style, Georgia, serif"
    fontSize: "20px"
    fontWeight: 560
    lineHeight: 1.25
  hud-numeral:
    fontFamily: "-apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1
    fontFeature: "tabular-nums"
  section:
    fontFamily: "-apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  body-lg:
    fontFamily: "-apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.45
  body:
    fontFamily: "-apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tabular-nums"
  label:
    fontFamily: "-apple-system, system-ui, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
  notation:
    fontFamily: "Bravura"
    fontSize: "40px"
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
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
    backgroundColor: "{colors.panel-3}"
    textColor: "{colors.accent}"
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
    width: "30px"
    height: "44px"
  week-day:
    textColor: "{colors.ink-3}"
    size: "22px"
  plan-row:
    textColor: "{colors.ink}"
    padding: "12px 20px"
  plan-lead:
    textColor: "{colors.ink-2}"
    width: "20px"
  cover:
    backgroundColor: "#fbf8f1"
    textColor: "#161513"
    rounded: "{rounded.xs}"
    width: "56px"
    height: "42px"
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
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    width: "680px"
  popmenu:
    backgroundColor: "{colors.panel-2}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  chord-readout:
    backgroundColor: "{colors.scrim}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-lg}"
    rounded: "{rounded.md}"
    padding: "8px 16px 10px"
---

# Design System: piano

## Overview

**Creative North Star: "Urtext"**

An engraving house's page in a night room: dark ink on warm paper, under a near-black cool ground, with one brass lamp for "play this, now" (`docs/research/urtext.md` is the binding spec). The score is always dark ink on paper, in both modes; the highway beneath it is the one dark field, and it is lit only to report state (the awaited note, a hit, a miss). There are no points, ranks, lives or fireworks, and the shell never scores you. The shell around the stage is native-feeling iPadOS (segmented switch, sliders, rows, a drawer) and stays quiet; Newsreader announces and names the music, the system font does the rest. Two modes: Nocturne (dark, the default) and Matinée (light, warm stone). Reading drills reuse the same room with the stage turned down: the staff takes the screen and the highway shrinks to a strip.

The product name is **Page to Hand**: notation on the page becoming understood movement in the player's hands. The Pause / Lid mark and the Urtext visual system are unchanged; the wordmark uses the same Newsreader construction.

The iPad in landscape is the main screen, a desktop browser the second. The player sits 1-2 m away with busy hands, so state is carried by word, shape, and hue together, never hue alone, and every target is thumb-sized on a coarse pointer. Density is moderate and fixed: a 56px top bar, one view, a docked transport. One control height (40px, 44px on touch) and four radii run through the whole shell. Seven tabs live in the top bar until a piece opens: Today, Songs, Read, Scales, Theory, Technique, Progress. Today is a generated plan, not a menu. Progress is the reward: accuracy over time, mastery, a quiet day streak.

**Key Characteristics:**
- A near-black cool ground (warm stone in Matinée) with one warm voice, the lamp brass, that means only "play this / now". Everything else in the shell is neutral Ink.
- Newsreader for what is announced and for the names of music; the system font for what is read.
- Glow is a state signal on the staff and stage only. No hard offset shadows, no hard text-shadows.
- Every page shares one measure and one head; plan rows, song rows and stage rows are one grammar.
- Touch first: `pointer: coarse` raises controls to 44px. The app has no minimum width: portrait and split-view windows reflow (see Responsive).
- Skill over points: progress is shown as charts, meters and words that can honestly fall; nothing is scored against you and nothing is locked.
- Copy is label, value, nothing else.
- One dialog grammar (`dialog.sheet`), one tag style, one disclosure marker.

## Colors

Urtext, Nocturne (the dark mode; `docs/research/urtext.md` is the binding spec): a near-black cool ground, warm ivory ink, one brass lamp, a slate-blue interface tint, two hand hues (terracotta right, verdigris left), and a judgement spectrum that runs mint to crimson through neutral and shares a hue with neither the hands nor the lamp. It was chosen by scoring candidates for distance in normal vision, deuteranopia and protanopia; the worst remaining pair is perfect and miss under deuteranopia (ΔE 13), which the glyphs carry.

### Matinée (the light mode)

Warm stone around the same page of music. Appearance (Settings: Auto, Dark, Light) sets `data-theme` on `<html>`; Auto leaves it off and follows the system. Every token that differs by mode is one `light-dark(Matinée, Nocturne)` line in `:root` of `src/style.css`, with `color-scheme: light dark` on the root and `color-scheme: dark` or `light` for a forced mode, so there is no second block to drift; `vite.config.ts` sets `cssTarget` so the build keeps `light-dark()` native. The highway stays dark in both modes (`--night` behind the canvas; `src/palette.ts` draws it), so the grade word and the count-in sit under `color-scheme: dark` and keep the Nocturne judgement colours. `src/palette.test.ts` reads both sides and checks every pair below (text 4.5:1, marks 3:1).

| Token | Nocturne | Matinée | Use in Matinée |
|---|---|---|---|
| Ground | #0c0e12 | #f3efe6 | page, wells |
| Panel | #13161c | #faf7f0 | top bar, dock, cards |
| Panel Raised | #1b1f27 | #eae4d7 | buttons, chips, floating surfaces |
| Panel Hover | #222731 | #ffffff | hover, selected segment |
| Line / Line Strong | #262a33 / #363d4e | #e2ddd2 / #c7c0b3 | hairlines, floating borders |
| Edge | #727a8b | #7d776b | control borders (3:1 on Ground, Panel, Raised and Hover) |
| Ink / Soft / Faint | #f4f2ed / #a6abb8 / #8a90a0 | #181715 / #524f49 / #666259 | text (4.8:1 or better on every surface) |
| Lamp / Lamp Bright | #ffc83d / #ffd466 | #f5b316 / #e09f08 | primary fills with Lamp Ink (8:1+) |
| Lamp line (`--lamp-line`) | Lamp | #a85a00 (Paper Cursor) | the scrubber head and the current Start-here step: brass is 1.7:1 on stone |
| Accent | #78a9ff | #0058d0 | links, focus, selection (5:1+) |
| Right / Left hand | #f27d52 / #2ab7b0 | #c94a22 / #0e7c77 | swatches (3:1 marks, never text) |
| Left edge / fill | #6fd6d0 / 60% | #0e7c77 / 30% | the left swatch |
| Perfect / Great / Good / Miss | #3dd68c / #a7e8c4 / #c9ccd6 / #ff3d6e | #13794b / #3e8f69 / #67635a / #c8164b | glyphs and words beside them |
| Late (`--late`) | Good at 60% | Good at 80% | the faded glyph (3:1 on every surface) |
| Paper | #efece4 | #fbf8f1 | the page; the paper inks do not change |
| Scrim / Scrim High | 12,14,18 at .82 / .94 | 243,239,230 at .92 / 250,247,240 at .95 | results overlay, chord readout / start card |
| Backdrop, Drop, Wash | black-blue .7, black .45, white .03 | ink .4, warm brown .2, ink .045 | behind a dialog, shadows, row hover |
| Specular / on the lamp | white 7% / 28% | white 90% / 50% | the top edge of a raised surface |
| Loop, Great ring | ink 14%, mint 35% | ink 14%, green 30% | the A-B span, the live-key halo |

Changed from the brief (urtext.md has the reasons): Good is #67635a (the brief's #6e6a61 is 4.25:1 on Panel Raised), Edge is #7d776b (the brief's #8a8478 is 2.9:1 on Panel Raised), Late is Good at 80% (the brief's value was never given a ratio; Good at 60% is 2.4:1), and the lamp as a line takes Paper Cursor. The on-screen keys take the paper's ivory and ebony in both modes.

### Primary
- **Brass Lamp** (#ffc83d): the verb and the "now" markers only. Primary buttons (at most one per view: a page head's Start on Songs, Read and its Sight run, Scales' Stages, Technique and Theory, the first undone plan row on Today, Choose a scale and the quiz's Next, Again or Finish, the Start of the Path's overall next requirement, the dock Play and the big action on results, Use these in Options, Done in Set up), the staff cursor, scrubber playhead, awaited notehead (in a drill, every head of the next card), receptor lamps over lit keys, awaited-note outline on the highway, the "Play this" legend swatch, the count-in numeral, the lit cells of a rhythm echo, the focus ring and text selection. Hover is **Lamp Bright** (#ffd466). The Pause / Lid mark in the bar, selected segments, switches, slider thumbs and the HUD numerals are Ink, not lamp.
- **Lamp Ink** (#14110a): text on any lamp fill (more than 10:1).
- **Accent Slate** (#78a9ff, `--accent`): the interface's own tint (selection, links, the on-screen keys under a finger). Never on the staff or in the lanes.

### Secondary (hands)
- **Right-Hand Terracotta** (#f27d52, `--R`): right-hand notes, solid filled bars with a pale top light. Warm.
- **Left-Hand Verdigris** (#2ab7b0, `--L`) with **Left-Hand Edge** (#6fd6d0, `--L-edge`): left-hand notes are a 60% verdigris fill (`--L-fill`) with a 2px lighter outline, so the hands differ by fill style and lightness as well as hue (legend and dock swatches use the same recipe). Cool. A note's key name is Ground on the terracotta body and Ink on the verdigris one (checked in `src/palette.test.ts`). Neither hue is near mint, crimson or the lamp.

### Tertiary (judgement spectrum)
- **Perfect Mint** (#3dd68c) ●, **Great Pale Mint** (#a7e8c4) ○, **Good Neutral** (#c9ccd6) ▲, **Late** (Good at 60%, `--late`) ▸, **Miss Crimson** (#ff3d6e, `--bad` in CSS) ×. Late is the right key up to a beat after the window, the worst hit. On paper (the staff) the same grades are #13794b, #3e8f69, #6e6a61, the played ink and #c8164b (`--paper-*`); crimson also takes that darker value for the wrong-key cross on an ivory key (`C.missOnKey`), which the bright crimson cannot hold 3:1 against.
- **The glyphs** are drawn by `jg()` in `src/icons.ts` (CSS shapes, `.jg` in `style.css`, coloured by their grade), not typed characters, so every font and size draws the same shape. Perfect is a filled circle, Great a ring (its own glyph, because pale mint beside mint is a lightness step, not a safe cue), Good a triangle, Late a right-pointing chevron, Miss a cross. Each sits beside its word in the judge popup and the results counts; the Read drill and Sight run strip puts a cross over every note you missed, the scrubber heat puts a cross over bars you missed in, and the Compare line names the bars with a ring (more right) or a cross (fewer right). Mint additionally marks MIDI connected (chip dot), a state, not a grade (open: see Known quirks).

### Interface tint
- **Accent** (#78a9ff; Matinée #0058d0): the focus ring, the selected state (text on a raised fill), links, text selection. 6.4:1 on Panel Hover, 7.7:1 on Panel. See the Accent Rule.

### Neutral
- **Ground** (#0c0e12): page, stage clear colour, wells (segmented, scrubber, inputs, kbd).
- **Panel** (#13161c): top bar, staff strip, dock, cards, results card.
- **Panel Raised** (#1b1f27): buttons, chips, band chips, mastery-cell track, and every floating surface (drawer, dialog sheets, popovers, banner).
- **Panel Hover** (#222731): hover, a selected segment, a button resting on a floating surface.
- **Line** (#262a33): hairlines, row dividers, meter track, scrubber border.
- **Line Strong** (#363d4e): a floating surface's border, the selected ring, switch track, table-head rule.
- **Edge** (#727a8b): every control border (3:1 on its surface), slider track. Line stays hairline-only.
- **Specular** (white at 7%; at 28% on the lamp fill): the 1px inset top edge of a raised surface.
- **Scrim** (rgba 12,14,18 at .82): ready card, results overlay, chord readout. **Shade** (rgba 0,0,0 at .6): the soft shadow under stage words. Named tokens for the other translucent values, all in `:root`: `--scrim-hi` (the start card), `--backdrop` (behind a dialog), `--drop` (shadow under a raised surface), `--wash` (row hover), `--loop` (the A-B span), `--L-fill`, `--lamp-line`, `--night` (the highway's ground, behind the canvas, the same in both modes).
- **Ink** (#f4f2ed), **Ink Soft** (#a6abb8), **Ink Faint** (#8a90a0): primary, secondary, and caption/label text. Ink Faint is the floor for text on Panel.
- Stage-only (palette.ts mirrors the CSS custom properties; the highway is Nocturne in both modes): lane tints #161a22 / #0e1015 alternate per white key, octave and bar grid #3a4152, receptor #fff3d6, key white #eae6df, key black #1b1d22, muted key names and unlit receptor lamps #5e6472.

### Named Rules
**The Neutral Progress Rule.** Mastery and effort are measured in Ink, not in a judgement hue: meter and mastery-cell fill is Ink Soft, and Ink once solid; a practised day is an Ink dot. State is also stated in words ("Solid", "7 of 12 seen") and as a percentage.

**The Calm Staff Rule.** The score is Paper Ink on Paper (`--paper-ink` on `--paper`, staff lines `--paper-line`), in both modes. Colour appears on a staff glyph only as state, and every state also has a shape or a word: Paper Cursor for the cursor and Paper Awaited for the notehead being waited for; a grade colour for the 0.8s flash of a hit (`--paper-perfect`, `--paper-great`, `--paper-good`), then the chord settles to Paper Played (a colour change, not a fade, so its grade mark stays at full strength). The grade lives on in a shape under the head, readable with no hue: perfect none (a clean note just goes quiet), great a filled dot, good a filled triangle pointing the way the key missed the beat (◂ early, ▸ late, centred under the head), late an outlined right-pointing triangle, miss a crimson `--paper-miss` cross (the head flashes crimson, then settles to played). A hold outline is the one state that stays on the head: released early a solid crimson outline, held too long a dashed neutral one. Aids that are not score (ghost notes, the Technique aim-for dynamics, 8va brackets, the Dense hint, bar numbers, chord symbols, fingering numbers, the dots of a Ghost of last run) are Paper Ink at 72% or 60% (`--paper-ink-2`, `--paper-ink-3`, mixed on `#staff`); the notes the app plays in accompaniment are the same heads at 50% (3.4:1 on paper; 40% was under 3:1). The score's own marks (articulation, slurs, hairpins, dynamic letters) are Paper Ink at 70%. No glow on paper: light on a page would be a lie.

**The One Lamp Rule.** Amber means "play this, now": the verb and the now-markers. It is never chrome, never selection, never the focus ring, never a link, never text selection, never a judgement grade. Those belong to the Accent. Counted per screen: at most one lamp-filled button, and the lamp Next word only on that button's row. A page with nothing left to do (every plan row done) shows none. On the play screen the dock Play is the one fill; the cursor, awaited heads, receptor lamps and count-in are its now-markers.

**The Accent Rule.** Slate blue (#78a9ff; #0058d0 in Matinée) is the interface's own tint and has four jobs: the focus ring, the selected state, links, and text selection. It is never on the staff or in the lanes, never a fill larger than a control, and never the only sign of a state (a selected control also has its raised fill).

**The Semantic Hue Rule.** Hand colours (terracotta; verdigris with its lighter edge) and judgement colours (mint, pale mint, neutral, crimson) appear only where a hand or a grade is being reported, never as chrome, decoration, selection or emphasis. Chrome that needs a tint takes Accent Slate or Ink. A chart of grades does not borrow a hand hue either: the Read strip runs neutral to crimson, not the right hand's colour to red.

**The Word And Shape Rule.** A judgement colour never stands alone; it ships with its glyph (● ○ ▲ ▸ ×) or its word, and on the staff a position or mark. Hands are told apart by fill style, not hue alone.

## Typography

**Display Font:** Newsreader (`@fontsource-variable/newsreader`, SIL OFL; the upright `opsz` file, weight 200-800 and optical size 6-72 on one variable face; Iowan Old Style, Georgia as fallback). It announces and it names music. Upright and in sentence case everywhere except on the staff, where the dynamic and expression words are italic, as an engraver sets them (the `opsz-italic` file, imported by `src/staff.ts` so it loads with the staff, not at boot). `font-optical-sizing: auto` ties the optical size to the font size, so an 18-20px title is sturdy and the 160px count-in is fine-cut; no size is set by hand. Only the latin file is fetched (unicode-range), upright or italic. The Pixi key labels are drawn in the system font at 600.
**Body Font:** the platform's own (`-apple-system, system-ui`): San Francisco on the iPad and the Mac, nothing to download (Hanken Grotesk until 30 Oct 2026). Body sets `tabular-nums` globally; the `font` shorthand resets it, so every counter rule (HUD, tempo, timers, percentages, the results figure, the count-in) repeats `font-variant-numeric: tabular-nums`.
**Notation Font:** Bravura (SMuFL, OFL, self-hosted woff2) for every staff glyph: noteheads, clefs, rests, accidentals, flags, tuplet numerals, time-signature digits, the articulation marks and the dynamic letters (p, m, f, r, s, z, so p to ff, sf and the like).

**Character:** An engraver's title page over a quiet instruction manual.

### Hierarchy
UI text has three sizes: 13 (label, kbd, fine print, song-row sub-lines), 15 (body, controls, other sub-lines), 18 (row names, ready sentence, result lines). 14 appears in touch-range chips, histogram text and credit blocks (see debt). Newsreader as built uses 19 to 52 plus the stage figures. Full table under Design Grammar.
- **Display** (Newsreader 500, 44px, 1.1, -0.01em): the page h1 on every page.
- **Piece name** (Newsreader 560, 20px, 1.25): the title on a song or library row, with a 13px Ink Faint system sub-line. The play screen's top title is the same face at 19px.
- **HUD numeral** (system 650, 30px, 1, tabular): accuracy, notes in a row, cards in a row, cards, in Ink, with a 12px Label caption stacked above (15px in Read). The Over time figure on Progress, the tempo value and the Memorise stage digits are the same numeral at 24, 28 and 22px.
- **Title** (Newsreader 600, 28px, 1): the big button's label, the dock's Play.
- **Heading large** (Newsreader 500, 34px, 1.1): the results verdict. The chord readout is a system 650 32px.
- **Section** (system 600, 20 to 22px): `h2.sec` blocks on Progress, drawer and dialog-sheet headings.
- **Body** (400-650, 15px, 1.45): controls, notes. Row names 18px, sub-line 15px Ink Faint on stage, plan, path and requirement rows (13px on song rows); prose capped at 52-56ch.
- **Label** (600, 13px, sentence case): the one label style: HUD captions (12px), table heads and captions, group caps, the Next tag and the outlined tags.
- **Stage words:** ready title 52px (38px under 820px tall, 34px on a short stage), count-in 160px at 400, results figure 88px at 400 top right of the card (a percentage, a stage, or a 72px check in Learn), judge word 42px at 650, staff grade word 21px at 600. Over a soft Shade.

### Named Rules
**The Two Voices Rule** (was Announce Versus Read). Newsreader versus the system font. Newsreader is for what is announced (page titles, the results figure and verdict, the count-in numeral, judgement words, the dock's Play) and for the names of music (piece titles on rows, cards, the start card, the play screen's top title). It is upright and in sentence case, never tracked capitals; the one italic is the staff's own expression words (below). A piece's name inside a sentence or a row of mixed names (Today's plan rows, "Bars 3 to 5 of ...", the Progress ladder) sits in a `.pn` span, which takes Newsreader 560 at 1.1em and the row's ink. Everything tapped or read, and every counter, is the system font in sentence case: section and sheet titles (600, 18 to 22px), labels (600 13px), controls, sentences, the HUD, the tempo, the timers.

### The design language (30 Oct 2026; research in `docs/research/design-language.md`)
Seven rules every screen is checked against:
1. **Two voices.** As above.
2. **One lamp.** At most one amber fill per screen, on the background of the primary verb.
3. **Icons, Apple's way.** One family, Lucide (`src/icons.ts`, path data copied in; ISC, credited): 24px grid, 2px round stroke; play and pause filled. Tabs carry an icon and their word; under 1040px only the selected tab shows its word. Universal verbs may be icon-only with an accessible name (restart, loop, close, back, more, settings, zoom). App verbs keep their word, with the icon where one fits (Start, Practice, Learn take the play icon on every row, not only the lamp one). A menu's items have icons on all or none; a segmented control never mixes words and icons.
4. **One icon family.** No icon drawn by hand next to Lucide's.
5. **Three actions at most** on show on any summary or end surface, sheet or settings row (a primary, Again, a More menu, and the way back apart); the rest go in a ⋯ More menu (`rowMenu` in `src/ui.ts`).
6. **The right container.** Choices go in a pop-up anchored to their button (Tempo, Practice, a row's More), tasks in a sheet, playing full screen with the controls fading.
7. **Touch.** 44pt targets, nothing hover-only (hover styles sit in `@media (hover: hover)`, so a tap never leaves one stuck), reduced motion honoured, no imitation glass (`backdrop-filter` is banned: it costs frames over the WebGL highway), chrome never glows. Pressed is a 0.97 scale.
SF Symbols are not used: Apple's licence ties them to apps for Apple platforms and the same code is the public website.

## Layout

A single-column app grid: 56px top bar (safe-area insets padded for the iPad), then one view, then an auto row that is empty except while the on-screen keys show (see On-screen keys; Zen drops it). Top bar, left to right: the Pause / Lid mark (40x30, Ink), the seven-tab section switch (hidden on the play screen), the song title (play), "All stages" (drills) or the Perform | Learn switch (hidden on the start card, which carries the choice, and for a read-through) (songs), a spacer, the HUD, the MIDI chip, the settings icon button. The seven tabs are a nav landmark ("Sections", a radio group). Under 1040px (an iPad in portrait, a split view) every tab but the selected one shows its icon alone and the selected one its icon and word, so all seven fit down to a 590px window with Settings still in the bar; each tab keeps its word as its accessible name. The tab row still scrolls, keeping the selected tab in view, in a window too narrow even for that.

Every non-play page (Today, Songs, Read, Scales, Theory, Technique, Progress) pads `32px clamp(16px, 6vw, 96px) 64px`, scrolls, and centres its children at `min(100%, 1100px)` (One Measure). Play rows by view: Both is staff `minmax(160px, 31vh)` + highway + dock; Staff is the staff filling the screen with a `clamp(96px, 15vh, 150px)` highway strip; Falling drops the staff row; a reading drill is staff `minmax(0, 1fr)` + strip `clamp(150px, 24vh, 230px)` + dock (the strip row is 0 while the on-screen keys show, and the Falling notes switch hides with it). The keyboard is drawn inside the highway canvas, 24% of stage height at most.

Spacing rhythm is 4 / 8 / 12 / 16 / 24 / 32 with 6, 10, 14, 18, 20 inside controls and cards. Responsive: under 1180px bar gaps tighten and, with a fine pointer only, tempo presets and hand labels hide (a coarse pointer keeps them); under 820px tall the ready card compacts; `pointer: coarse` sets `--control` to 44px, segment cells to 38px, small buttons to 44px, slider thumbs to 32px; disclosure summaries get a 44px row; segment cells keep 38px but their hit area reaches the 44px well and is never narrower than tall; sliders, the quiz and range chips, small buttons and the drawer links are 44px. No width is refused: there is no narrow-window notice.

## Elevation & Depth

Depth is luminance steps and a top hairline, never a glow. Five steps: Ground (wells, the recessed track), Panel (the page's surfaces: top bar, dock, cards), Panel Raised (controls, and every floating surface: the drawer, dialog sheets, popovers, the banner), Panel Hover (a button on a floating surface, a selected segment, hover). `--specular` (white at 7%; at 90% in Matinée) is the 1px inset top edge of a raised surface, as overhead light on a bevel (`inset 0 1px 0 var(--specular)`): buttons, chips, the dock, popovers, sheets, the banner (the drawer takes it down its left edge); the lamp fill takes `--specular-lamp`. Hairlines: Line separates rows, Line Strong (`--line-2`) outlines a floating surface and a selected cell, Edge outlines a control (3:1 on its surface). Real shadows are reserved for things that float, all soft and offset: the banner (`0 10px 30px`), the drawer (`-18px 0 40px`), popovers (`0 -8px 24px`), dialog sheets (`0 24px 64px`), the Listen bar (`0 8px 24px`), all in `--drop`, and a slider thumb (`0 1px 4px`). Stage words sit on a soft Shade (`0 2px 24-28px`); the judge popup uses a Ground halo (`0 0 6px, 0 0 14px`, no offset). Light is a state signal and only on the highway: the staff has none (it is paper: the cursor, hit flashes and ghost snaps are flat colour); the highway adds additive radial glows and sparks at Calm (Effects is Off or Calm). The scrubber head is a plain 2px lamp line. Sheet view forces effects off; under `prefers-reduced-motion` CSS motion collapses to ~0ms and the canvas glow stops swelling and the waiting ring holds steady (Calm is the only tier, so there is nothing to cap). No `backdrop-filter` anywhere: the brief's frosted tab capsule and dock were not taken (urtext.md, Not taken).

### Named Rules
**The Glow Means State Rule.** A glow is allowed only on an element reporting live state in its own colour. Chrome does not glow.

**The Soft Shade Rule.** Nothing carries a hard offset shadow or a hard text-shadow, including the primary button. Separation is a border, a tonal step, or a soft Shade.

## Shapes

Four radii and one control height. 6px `--r-1` (kbd, covers, scrubber, segment cells, tags, mastery cells, swatches, the dock's inner wells), 10px `--r-2` (buttons, segmented outer, selects, number fields), 14px `--r-3` (cards, dialog sheets, popovers, banner, ready, results, chord readout), pill (chips, switches, slider tracks, meters, the section tab capsule and its cells). Controls are 40px (44 coarse); small 36 (44 coarse); big 52; segment cells 32 (38 coarse) inside a 3px well. Every control border is Edge; a floating surface's border is Line Strong. Falling notes are 5px rounded bars inset 3px inside their lane (1.5px on black keys), with a 3px bright bottom edge marking the moment to play. Left-hand bars are tinted with a lighter outline, right-hand bars solid.

## Components

Each component: anatomy, then states. Every interactive state shares one focus ring: 2px Accent, 2px offset (a slider's goes round the thumb). Hover applies only to a hover-capable pointer. Pressed scales to 0.97 (a switch thumb widens, a slider thumb grows 10%). Disabled is Ink Faint text, transparent fill, Line border (a segment drops to 45%, a switch to 40%).

**Selected, everywhere.** One treatment for a segment, a section tab, a filter chip, a toggle button that is on (`aria-pressed`) and a button whose menu is open (`aria-expanded`): Panel Hover fill, Accent text, a 1px Line Strong ring, the specular hairline. Not a lamp, not a colour alone.

### The mark: the Pause

The identity (`design/identity/SPEC.md`, approved 1 Nov 2026) is a fermata reduced to one arch and one dot; the arch also reads as the raised lid of a concert grand. Geometry on a 1024 grid: arch `M168 612 C240 290 784 290 856 612 C751 480 649 424 512 424 C375 424 273 480 168 612 Z`, dot at (512, 638) r 76. Never redraw it; copy the path.
- **In the bar**: the symbol in `currentColor` (Ink on Nocturne, Matinée Ink on Matinée), 36x18 cropped to its bounds, in a 44px-tall button back to Today. From 1180px wide, off the play screen, the wordmark "Page to Hand" follows it: Newsreader optical size 60, 540, -0.012em, 21px, a gap of 0.36 of the mark's width. Narrower, or on the play screen (the song's title takes the bar), the symbol alone.
- **App icon**: ink #161513 on paper #fbf8f1, full bleed, no baked corners (`ios/App/App/Assets.xcassets/AppIcon.appiconset`): default, a dark appearance (#efece4 on #13161c) and a tinted one (white on black, which iOS recolours). The clear appearance of iOS 26 needs an Icon Composer `.icon` file, not built yet (ROADMAP).
- **Web**: `public/favicon.svg` (the default icon), `apple-touch-icon.png` (180), and generated 192 and 512 px maskable icons. `manifest.json` installs the root app as **Page to Hand** in a standalone window; it does not lock orientation. The static manifest background is paper #fbf8f1, while the page's theme-colour metadata follows the current appearance.
- Amber and slate blue are never part of the identity: amber stays "play this, now", blue stays selection.

### Staff zoom

Two fingers on the staff zoom it, a double-tap resets it, ⌘-wheel or a trackpad pinch on a computer, the - and = keys, and ⌘= and ⌘- in the app's menu bar. The single-pointer alternative WCAG 2.5.1 asks for is Staff minus, Fit and plus in the dock's Practice menu (Fit pressed again goes back to the normal size). Nothing floats over the staff.

### Segmented control
- Ground well, Edge border, 10px, 3px padding, 2px gap; cells 32px at 6px radius (38 coarse), Ink Soft text 650. Radio inputs are visually hidden over the cell.
- Selected: the one selected treatment above (Panel Hover fill, Accent text, Line Strong ring). Hover on unselected: Ink text, Panel Raised fill.
- **Section tabs** (`#nav`) are the same control as a solid capsule: pill well, pill cells, an icon and the word (the selected tab's only, under 1040px). Not a floating blurred pill: the top bar stays a full-width Panel band (title, HUD, keyboard chip and Settings share it at 590px).
- Used for: section tabs, Perform | Learn (bar and start card), view, hand modes and the Metronome (Practice menu), plan length (5 / 10 / 20 / 30 / 45 min), Read (Stages | Sight run), Scales (Stages | Choose a scale | Quiz), the Songs Level filter (All levels, 1 to n), Notes shown (Full, Thin chords, Melody and bass, Melody, Lead sheet) and every drawer choice row.

### Switch
- 46x26 pill, 20px thumb; label 600, min-height 40px. In Settings, the Practice menu and Options a switch is a row like any other: the name at the left, the switch at the right (iOS Settings), a one-line description under the name where the setting needs one. Off: Line Strong track, inset Edge ring, Ink Faint thumb. On: Ink Soft track, thumb Ground, 20px travel. Never amber.

### Buttons
- 10px radius, 40px high (44 coarse), 1px Edge border, 650 weight, a specular top hairline, no offset shadow; pressed scales to 0.97.
- **Default (secondary):** Panel Raised fill; hover Panel Hover fill and Ink Faint border; pressed Panel. On a floating surface (drawer, sheet, popover) it rests on Panel Hover and hovers a step lighter.
- **Primary:** Lamp fill and border, Lamp Ink text, 800, a `--specular-lamp` hairline; hover Lamp Bright; pressed Lamp. One per view. A leading 20px solid play icon marks "start/continue".
- **Big:** primary at 52px, Newsreader 600 28px, min 124px; results and the dock Play.
- **Ghost:** transparent, no hairline, Ink Soft; hover Ink on Panel Raised (no border); pressed Panel Hover. Row actions (Learn on song rows, Practise on non-next stage rows), the More button and its menu items, icon buttons (close, focus).
- **Small:** 36px, 0 12px (44 coarse); drawer data buttons and tempo presets.
- **Icon:** 40px square, 20px stroked SVG, 2px round caps.
- **Disabled:** Ink Faint text, transparent fill, Line border, no hairline, no hover or press.

### Select and number field
- 40px (44 coarse), Ground fill, Edge border, 8px, 0 10px padding, full width of its cell. In a `.field` the 650 label sits above with 6px gap; `.field.inline` puts it left of an auto-width select.

### Pop-up button
- `label.pick` (Theory's level): a native `<select>` with no box, the chosen value in 15px 600 Ink Soft (Ink on hover) and a 16px Ink Faint chevron after it (Lucide chevron-left turned down), as wide as its value (`field-sizing: content`). It sits under a plan row's sub-line with negative margins, so the target is 44px and the line is not. A tap opens the platform's own menu, anchored to it: Apple's pop-up button, rule 6's pop-up for a choice. A row's one bordered or lamp control stays its action at the right.

### Chip
- Pill, 40px, Panel Raised, Edge border, 600. Dot outlined Ink Faint for "No keyboard" (a normal state); filled Accent when connected (a state, not a grade), chip border Accent with a soft Accent ring while live.

### Mastery meter
- 10px Line track, pill, Ink Soft fill (Ink when solid), min fill 4px, `role="meter"` with min, max, now, label. Sits in `.mrow` beside a right-aligned bold percentage (min 3.2ch). The goal meter on week blocks is the same meter.

### Mastery cell
- 30x44px (a button: tap a reading cell to practise that stage, a technique cell to start that exercise; 30px is narrower than the 44px touch floor, see debt), 4px radius, Panel Raised track, fill rises from the bottom in Ink Soft (Ink when solid). Reading cells fill to the stage percentage; technique cells fill 100% solid or due, 50% learning, 0 new, and a due cell adds a 2px inset Ink Soft outline. Cells are grouped in a `.cgrp` (6px gap): Label caption over a `.crow` (4px gap); groups wrap with 20px / 28px gaps. The group carries `role="group"` with "n of m solid"; each cell has a title and an accessible name with the stage or exercise and its percent or state word.

### Week day
- Column of a 22px circle over a 13px 700 letter. Not practised: 2px Edge ring, Ink Faint letter. Practised: Ink fill. Today: Ink letter, Ink Soft ring if not yet practised. Row gap 10px. Followed by a goal meter and "N of M min".

### Cover
- A piece's own opening bars engraved on paper: the library cover system of `design/identity/SPEC.md` (decision 9 in `docs/research/urtext.md`). Score paper `--cover-paper` #fbf8f1 and ink `--cover-ink` #161513 in **both** app modes (a printed page, not a themed surface; distinct from the practice staff's `--paper`), no other colour: the secondary line is `--cover-ink-2` (#4c4842), the rest are ink at an opacity. Radius `--r-1`, no border, no shadow. Decoration: `aria-hidden`, the row or card around it carries the name.
- **Three densities of one grid** (`COVER` in `src/cover.ts` and nowhere else; `src/cover.css` draws them). 7% margins, header 7% from the top, a 1px ink rule at 42%, a title block about 24%, the incipit's box 52% of the height with a 5.5% foot for the difficulty rule. Thumbnail 56x42 (Songs rows and Today's piece rows: the last piece, the review and the read-through; composer token in 4.5px type and the incipit, no title, no rule), card 300x200 (20px margins; 7px header, 17px title, 9px secondary, the difficulty rule), start card 600x400 (42px margins; 11px header, 42px title, 16px secondary). Header: system sans 650, capitals, 0.12em, composer and catalogue left ("Bach · BWV 846"), key and metre right. Title Newsreader 560, -0.018em, two lines at most, shrunk to as little as 70% for a longer one (cards never ellipsize); the secondary line is Newsreader 410, shown only when the title takes one line. For a library piece the movement after ": " in the title is the secondary line, for a starter its level. Difficulty (cards only): five 1px ink segments, 68% active, 18% inactive; the catalogue grade for a library piece, the starter's level for a starter (First notes and Beginner 1, Elementary 2, Intermediate 3), none for your files.
- **Key honesty.** The header names a key ("C major", "B♭ minor") only when the source states its mode: a MusicXML `<mode>`, a MIDI key-signature event's scale flag, a starter spec's `mode`, or `mode` in `catalog.json` (the pipeline writes it from the same two reads). `Song.stated` carries it from the importers; the key is read when a score is kept (`keep`). The importer's estimate (`quantize.ts`) is never shown as data. A piece with no stated mode shows the metre alone; an import shows "KEY — · METRE —" for what its file does not state. The engraved key signature and time signature below say what they say regardless.
- **Your files** (the spec's missing-metadata rule): header "Your file · MIDI" or "Your file · MUSICXML" (the thumbnail's token is "MIDI" or "MUSICXML"); title the file's name, else "Untitled MIDI" or "Untitled score"; secondary line the localized import date.
- **The engraving** is the play screen's own: `src/cover-draw.ts` hands the first three bars to the same `analyze`, `windowFor`, `layout` and `Staff` painter on an off-screen page and keeps the SVG, so the cover and the staff cannot drift apart. Bar numbers, the cursor, slurs, hairpins, dynamics, fingerings and chord names are dropped. Ink only; staff lines 0.75px and barlines and stems 1px, non-scaling.
- **Scale and fit.** One staff size per density, never fitted per piece: the spec's minimum (staff space 2.5, 5 and 8pt, so a scale of 0.25, 0.5 and 0.8 per layout unit), a single line 1.45 times larger and centred. The layout is asked for a page as wide as the box and shows one bar or two as it chooses; the grand staff is whole and centred, its window sliding toward ledger-line notes but never off the staff. A bar whose columns would sit closer than 16 units (or that the layout squeezed) is laid out at readable spacing on a wider page and the notes are cut where the box ends: at the last complete beat (a dotted quarter in 6/8, 9/8 and 12/8), never inside a beam, with no barline on the open end. Fewer beats, never a squeezed bar. Not done: the three-staff voice-and-piano page and lyrics (the layout engine has no third staff; a voice folded into the right hand shows as the app plays it).
- **Every library piece has its notes.** A piece's first three bars travel in one lazy sidecar file (`i/<hash>.json`, named in `catalog.json` as `incipits`, 359 KB gzipped for 2,347 pieces, `src/incipit.ts`; the pipeline writes it). The first library cover on a page fetches it once (the service worker keeps it for good) and decodes the piece's entry into the same `Song` the file gives, so the engraving is `cover-draw.ts`'s and the cover is the same SVG, string for string, as one drawn from the score (a test over the whole catalogue; `src/incipit.test.ts` and e2e 7). A score is never fetched for its cover. Until the sidecar arrives, and for a row it has no entry for (a catalogue from before it, offline on a first visit), the cover shows the paper, its header, and an empty staff with the clef, key signature and time signature the catalogue gives, no notes and no rests: the one placeholder, and it needs no graphic of its own. A piece whose source states no metre (4 of 2,347) shows a 4/4 staff and no metre in the header. A header names a key only when the catalogue's `mode` (or the file) states it.
- **Generated exercises** (scales, technique) draw their covers from the notes they generate, on the start card and in the Technique preview, with the key and metre they know by construction. Reading drills, Sight run and Theory have no cover: their rows are about a skill, not a score.
- **Drawing.** Lazily and one at a time: a cover is drawn when it scrolls within 200px of the screen (an IntersectionObserver), or when its score is read (an empty staff first when the sidecar is still on its way, so the paper never flashes bare); the SVG is kept by score and size for the session, so a redrawn row or card shows it at once, and every empty staff of the same signature is drawn once. The covers' code (`cover.ts`, `cover-draw.ts` and the staff painter) loads after boot, never in it. Not persisted across launches.
- **The start card** uses the cover as its title block and keeps the title as screen-reader text (`b.ttl`); the text shows only when no cover does. Both the 600 and 300 covers are in the card; the stage (`#stage`, a size container) decides which shows. 600x400 over the choices with no banner and a stage 600px tall or more (the choices go into rows as on a short stage), or with the banner and 850px or more; otherwise 300x200 over the choices from 500px tall and 480px wide (with the banner the mode line gives way); 300x200 beside the choices (cover left, choices right) on a stage under 500px tall and 820px wide or more, which is a landscape iPad; and none, the title as text, below that (a split view). A portrait iPad Air's stage is 619px tall, so it gets the 600 cover only with no banner.

### Plan row
- Flex, gap 8px 20px, padding 12px (12px 20px on Today, below), Line rule above (and below the last). Today rows start with a 20px lead column (`.plead`): a 20px ring in Line Strong when to do, a 20px check in Ink Soft when done; rows take the card's 20px inset (padding-inline 20px, column gap 16px), so ring and name line up with Start here (ring at 20, name at 56); title 18px 650 over a 15px Ink Faint sub-line ending "about N min"; optional 260px mastery row; action at the right. The piece row carries its Cover (the 56x42 thumbnail, `--r-1`) between the ring and the name, so its name starts 72px later than its neighbours'. Only the lamp row's action is primary (`nextUp()` in `src/next.ts`: the first undone row, unless the first week's step has the lamp, when every row is ghost); every other row's is ghost, as on Read and Songs, and every Start, Practice, Play and Loop carries its icon. Done rows sink to the bottom, title Ink Soft, no time, ghost action. Technique Path rows are the same row without the lead column. Nothing locks; every row stands alone.

### Card
- Panel fill, Edge border, 12px radius, padding 18px 20px, gap 12 (`.tcard`). Variants: week strip (`.span`: days and goal meter side by side, 32px column gap, 24px below, the day-streak line under them), the Progress week, the strip (flex, space-between, 16px gap: touch range) and the last-week recap (flex, space-between, Ink Soft sentence with Ink figures, optional ghost "Aim for N min"). Song results card: 16px 24px 18px, 820px max (the card over the falling notes; the others keep 28px 32px, 880px max).

### Touch-range card
- Strip card: a Label "Touch range" over three value chips (Soft 1-n, Medium n-m, Hard m+), 4px apart, max 600px, each flex-proportional to its velocity range. Chip is outlined (1px Edge, transparent, 4px radius), 650 14px Ink Soft, nowrap; `role="img"` states the ranges. Beside it a ghost "Use defaults" once set and "Set touch range". While calibrating the chips are replaced by "Play 10 soft notes: k of 10" and Cancel; a status line (`p.note`) may follow the card.

### Tag
- A Label-style word (13px 600, sentence case) outlined 1px Edge, 4px radius, padding 3px 6px 2px, Ink Soft, 10px left of the name. "Due" on a Technique path row, "n due" on a Read row, "Ready" on a starter piece or your file once it has been played on two days. `.tag.next` ("Next") drops the outline and the padding and takes Ink (brass text is 1.7:1 on stone, so the lamp stays on fills and lines); it sits only on the row that holds the primary, which is now a Today row: a page with a head Start has no Next tag (the Start's line names what it starts).

### Disclosure
- One marker for every `<details>`: a 1.2em slot holding "+" (closed) or "−" (open) in Ink Faint, native triangle removed. Summary is Ink Faint (Progress Path levels: 18px 650 Ink with a 15px Ink Faint count beside it), 44px row on coarse pointers. Used by drawer Advanced, the Progress Path levels (the first with work left is open) and the Technique Path "n more".

### Pop-ups
- The ⋯ More menus (`rowMenu` in `src/ui.ts`, the results card's More), the keyboard chip's panel and the dock's Tempo and Practice pop-ups are disclosures, not ARIA menus: a button with `aria-expanded` and `aria-controls`, and a plain container (a `role=group` with a name where it has a title). There is no `role=menu` or `menuitem` and no arrow-key menu behaviour: Tab walks the items, Escape (from the button or from inside) closes it and returns focus to the button, an outside tap closes it. A More menu holding one item is not a menu: that item is a ghost button in the row.

### Dialog sheet
- `dialog.sheet`: Panel Raised, Line Strong border, 14px, a specular hairline and a soft `0 24px 64px` shadow, `min(680px, 94vw)` wide, max 86vh, flex column over a dark backdrop. Header (20px 22px 8px 26px): a 22px 600 system-font h2, optional Ink Soft line under it, an optional ghost ⋯ More and the ghost icon close at the right. Body scrolls (4px 26px 12px); `h3` is a 13px 600 label in Ink Faint; `.fine` is Ink Soft; rows inside line up with the title (no card inset). Footer is pinned, and only when the sheet has an action besides closing (the header's close is the one way out): Line rule above, actions right-aligned, 8px gap, `.grow` spacer to split left and right actions, nowrap buttons. Used by Options (facts list; Tracks with "n of m in use" and a ghost Pick for me on one line, then track switches with a hand select each; More holds Share file and Remove file; footer Cancel and primary Use these, only for a file with several tracks), Credits (no footer), Set up (footer Done) and Help (no footer). The settings drawer is a side panel, not a sheet: Panel Raised, a Line Strong left edge with a specular hairline, `-18px 0 40px` shadow.

### Set up sheet
- A `dialog.sheet` that opens once on a first launch with no saved settings, and again from Settings > Set up. Title Set up, line "Five steps. Skip any of them." The body is plan rows, not a wizard: Keyboard (MIDI status in words, updated live, a Connect button until one is found), Your music ("Bring your own MIDI or MusicXML. Files stay on this device.", direct Add files), Touch range (hands over to the touch calibration), Delay (hands over to Calibrate) and Key touch (the same select as the drawer, with its hint). Footer: the platform ownership line at the left in 13px, primary Done at the right. Escape, the close button or Done skips it; nothing blocks. At phone height the body scrolls while the footer stays reachable.

### Credits
- Links open outside (`target=_blank`, `noopener`): a licence's name is the link to its text ("Licence: CC BY 3.0"), and a bare URL (a score's source) shows its site's name, so no raw URL is printed.
- A `dialog.sheet`, no footer. It opens with the platform's ownership line (Ink Soft, 13px)—"One purchase. Everything included. No subscription, ads or account." in the iPad and Designed-for-iPad Mac app; "Free in your browser. No subscription, ads or account." on the website—and Support / Privacy links, then Sounds (one `pre` block each: grand piano, electric piano, harp, organ and strings, music box, with their licences), Icons (Lucide Contributors, ISC), then Scores: a fine line that scores are public domain or openly licensed and keep their own licence, links to the licence lists for the pieces in the app and for the whole library, and one block per piece you have played or saved, with the changes made to it (voice folded or dropped). With none: "Pieces you play or save for offline appear here." The same ownership line closes the Set up sheet.

### Public Support and Privacy
- `/support/` and `/privacy/` are static, independently readable pages on the public origin, linked from Settings and Credits and opened in the system browser from the iPad app. They share the Urtext Ground, Ink, Newsreader headings and system body face, but no app-shell controls, cards or JavaScript application bundle. The saved Appearance is applied before paint by `theme.js`.
- The page column is 720px at most with 20px per-side insets, or 16px per side at 480px and below. Its linked brand is the approved mark at 27×36 beside “Page to Hand” in Newsreader 600 at 19px. The title is Newsreader 560 at 52px / .98 / −.035em (44px on a phone); the lede is system 18px / 1.5; read copy is system 15px / 1.6; section headings are system 600 at 20px and divided by Line Strong. Both pages work at phone, iPad portrait and landscape widths in Matinee and Nocturne. Focus is a 2px Accent outline; links are underlined; there is no motion.
- Support leads with the public mailbox, says exactly what helps a report and tells the player to export before deleting or reinstalling. A piece's Report a problem link opens a `mailto:` draft outside the web view (`target=_blank`, `noopener`) without sending anything. The draft carries the piece ID, credit, source URL and SHA-256, app version, catalogue build, importer flags, current bar and one plain question for the player; no practice record or file is attached. Privacy names local and chosen-folder data, Cloudflare request and browser-beacon boundaries, Apple payment processing, support mail and every deletion path. Neither page claims that no data ever leaves the device.

### Start here card
- `.tcard.guide` on Today, between the head and the last-week recap, for the first seven days of use (`src/guide.ts`; day 8 is the last it can show, after that or once every step is done or skipped it is gone). Header: 22px "Start here", an Ink Soft line "Day n of 7, in any order.", and a ghost Hide at the right. Below it an ordered list in the plan-row grammar (a Line rule between steps): the lead is a 20px ring with the step number (Line Strong; the day's own step ring is Lamp, with an Ink numeral) or a check in Ink Soft once done. The day's step shows its title at 18px with a sub-line, the primary Start (while it is undone it is Today's lamp and the plan's rows go ghost: one first step, UX-6) and a quiet Skip; earlier undone steps show a ghost Start and Skip; later steps are Ink Faint titles with a ghost Start under the day's (nothing is locked, UX-25), no Skip; a skipped step reads "Skipped". Seven steps: Read Treble landmarks, C major right hand, chord triads on white keys, a read-through, five-finger Technique, Memorise a short piece, Review and look at Progress. Under 760px the actions wrap under the title.

### Empty states
- Two drawings, `src/empty.ts` and `src/empty.css`, from `design/identity/SPEC.md` and the geometry of `boards.html`: **No keyboard connected** (two 44x56-unit key rectangles, 7-unit square-capped stroke, a dashed link and a centred 7-unit dot) and **No music here yet** (five 3-unit staff lines between two 6-unit end bars, a centred notehead placeholder at 18% ink). Inline SVG in `currentColor`, one ink (`--paper-ink`), on a 120px square of cover paper (`var(--cover-paper, #fbf8f1)`: the same lit page as a Cover, radius `--r-1`). `aria-hidden="true"`: the sentence beside it carries the meaning, and the sentence and its action are the state's own, not new copy. No motion at all (the spec allows one 180ms opacity change; nothing here needs it).
- **Where.** Songs, "Your files" while empty: the drawing at the left, the sentence beside it in Ink Soft (the page's Add files button stays in the head). Set up sheet, the Keyboard row while Connect shows: the drawing leads the row (Keyboard, "Not connected. Plug it in over USB, then Connect.", Connect), and goes the moment a keyboard appears (`:has(#suConnect[hidden])`). **Not used** in the Connect line (a 50px row for a one-line status; the drawing would triple it, and the on-screen keys are the answer there), in the play screen's "No keyboard yet" banner (it floats over the highway; Directive: effects never obscure notation), or in Songs' "No piece matches" (a filtered result, not an empty library: the drawing would say there is no music).

### Connect line
- `.kbline` heads Theory, the Scales Quiz and the Sight run builder while no MIDI keyboard is connected: a Panel row with a Line Strong border, "No keyboard connected." in Ink and "Play the on-screen keys, or the computer keys A to ;." in Ink Soft, then the On-screen keys switch (below) and a Connect keyboard button, which wrap together to the right under the words in a narrow window. It hides, switch and all, when an input appears (the drawer's Advanced keeps the switch) and returns when it goes, and on Theory and the Quiz it shows on the trainer list only, not over a card.

### Help sheet
- `dialog.sheet` named Help (the old Shortcuts sheet), opened by `?` or Settings > Help, on touch devices too. Header with close and a scrolling body, no footer. A `dl` (Ink name, Ink Soft text, a two-column grid that stacks under 760px) says what each tab is for; Label `h3` groups follow in Ink Faint with `.fine` paragraphs: how touch feedback works and what it cannot see, how a scale counts as solid (three clean runs in a row), how review spacing works (1, 2, 4, 8, 16 days; the days are a choice, not a proven best), the keyboard shortcuts as a `kbd` grid, No keyboard (the computer-key piano) and Hearing every note twice? (Local Control).

### On-screen keys
- `#osk` (`src/osk.ts`, `src/app/osk-ui.ts`, `src/osk.css`), the third row of `#app`, under the page: a Panel strip with a Line Strong top rule. Top bar: octave down and up buttons (44px), the range in words ("C3 to C5"), a Names toggle (`aria-pressed`, an Ink Soft inset ring when on) and a hide button. Keys: as many whole white keys as keep each at least 44px wide (12 at 590px, 17 at 820px, 25 at 1180px), 124px to 190px tall; in a reading drill it opens on the C below the lowest note the cards ask for, and while it shows the stage's own key strip collapses and the Falling notes switch hides (with a MIDI keyboard the stage keys show as before); white keys Ink, with a letter on every C (C4 is middle C) and on every white key with Names on; black keys Ground at 62% height with an Edge inset ring. A key under a finger is Accent Slate (never a hand hue: the strip answers a question, it does not play a hand). Several fingers play a chord; dragging across keys glides.
- Shown while a Theory card or Quiz card is open, and while a reading drill or Sight run is open on the play screen; never on menus, results or a song, whose stage has its own keys. On by default when no MIDI keyboard is connected; the "On-screen keys" switch (in the Connect line on Theory, the Quiz and the Sight run builder, and in the drawer's Advanced) or the hide button overrides that and the choice is remembered. Every key is a named button ("C4") inside a "Piano keys" group, so touch, keyboard and VoiceOver reach the same notes. Direct touch keeps multi-finger chords and gliding; VoiceOver gives four seconds between chord notes so moving to the next button does not submit an incomplete answer.

### Pulse bars
- `.pulse` on a pulse-trainer card (Theory): one bar per figure, 170px wide (300px for Hold a rhythm), 40px tall, a Line Strong border, a Line rule on every beat, and a 10px Ink Soft dot where a tap is wanted, placed along the bar by its beat. A silent bar (Keep the beat) is a dashed border with hollow dots and a 12px Ink Faint caption under it. Ink, not Lamp: the card's Next is the one lamp. The click is the prompt; the bars give the count.

### Aids popover
- `.pop` in the Learn dock: a "Practice" button (`aria-expanded`, `aria-controls`) opening `.popmenu` upward: Panel Raised, Line Strong border, 14px, 200px min, 10px 14px padding, 8px gap, specular hairline and a soft shadow; the button that opened it shows the selected treatment while it is open. Its rows are all one layout, the name at the left and the control (switch, segment, steppers) at the right: Wait for me, Hide played and Hold to advance (switches; Auto tempo is the Auto tempo on/off button on the tempo group), Metronome, Right and Left hand, A–B loop (Set start / Set end at the bar selected on the scrubber), Staff size. Closes on an outside click or Escape (focus returns to the button).

### Learn dock
- One row (30 Oct 2026; Apple's toolbars keep to a few groups and one prominent action): Play, Restart, the bar scrubber, the beat dots (metronome on), Loop worst bars and Clear loop (Learn, when there is something to loop), a Tempo pop-up (Learn and reading: a 15px "Tempo" and the value in Display 22px; inside, a slider between minus and plus, presets 50%, 75%, 100% and the Auto tempo button when looping) and a Practice pop-up (Wait for me, Hide played, Hold to advance, the reading switches, the Metronome (Off | Beats | Eighths), the two hands' Play, Listen, Hide, and Staff minus, Fit, plus; each segmented row is a 13px caption at the left and its control at the right: pinch, double-tap, the keys and the menu bar do the same). The pop-ups open upwards from their button's right edge, one at a time; an outside tap or Escape closes them, wherever focus is (a tap leaves it on the button): Escape closes an open pop-up first and only then pauses or leaves the piece (`app/input.ts`). Play reads Play when paused (a "Paused" word on the stage says the state). The row fades with the top bar 2.5 s into a run and comes back on any touch or key (a MIDI key is not one); playing and waiting taking turns in Learn do not restart that clock. No floating zoom buttons on the staff and no Hide controls button (M still hides the top bar).
### Metronome
- A segmented Off | Beats | Eighths | Silent captioned Metronome in the dock's Practice menu, Perform and Learn only (hidden in Read drills); it shows its state, and the B key steps through the four. Silent keeps time with no click: the beat dots and the Pulse. The beat dots in the dock row follow the bar (`aria-hidden`; they carry no label, left as built). It is plain chrome, no Lamp. The click accents a full bar's first beat; 6/8, 9/8 and 12/8 count dotted quarters.
- **Pulse** (Settings > Display; `src/beatpulse.ts`, `docs/changes/beatpulse.md`; two looks, the player's choice: Beat lines or the Ball, the Ball standing in for the lines when only the staff shows; Edges was tried and dropped, 1 Nov 2026): the metronome's beat seen while it runs and the song moves (not in a count-in, not while Wait for me holds the song, not in calibration). Every look swells into the beat over 0.45 of a beat (easing in, as a fall speeds up), peaks on it and fades over 0.25 of a beat; a full bar's downbeat is full strength, other beats 0.6; beats only, never eighths. Ink, never the Lamp (the lamp is "play now"). **Ball** (stored `staff`): a Paper Ink 60% ball, 0.9 staff space across, bouncing on the cursor's top tip, a ballistic hop of 1.5 staff spaces into a downbeat and 0.9 into the other beats, landing on each beat; under the notes, in the paper's top margin. **Beat lines**: the highway's own beat lines (on the metronome's grid: dotted quarters in compound metre, a pickup counted back from its end) brighten in Ink 3px through their last beat of fall and fade on the keys. Reduced motion: the ball stays on the tip and only darkens into the beat; the lines change opacity only.
- In a paced Sight run the beat is shown in `.beat-bar`, a row of its own between the header and the staff (13px: four 4px segments across the full width, 6px gaps, Radius 2, Line Strong; the segment on the beat is Ink; nothing transitions). The count-in lights the four in turn. The dock shows no Metronome block in a drill. Never over the notation: it is a grid row, like the Memorise strip. Perform's own dots stay in the dock.

### Start card
- The ready card holds, top to bottom: title (54px when no cover shows; the card is the full `min(720px, 92%)` wide so titles and the Simplify labels do not wrap, 960px with the cover beside the choices), the Cover as its title block (see Cover: 600x400 or 300x200, over the choices or beside them; the title then stays as screen-reader text and shows only where no cover does), a credit line for open-library pieces (with a quiet Report a problem link) (15px Ink Faint, with the changes made to the score when there are any), Perform | Learn with a one-line hint, the "You play" row (below), the "Notes shown" Label and four-level Simplify switch (only when Melody would drop at least 10% of notes), the "Ghost of last run" switch (below), the start hint, and the colour legend once per device. The hint hides only on a card under 260px tall, and Notes shown never hides: a card taller than its room scrolls (200% zoom, a split view). The title may run to four lines (WCAG text spacing wraps it one more). Beside the cover, Perform | Learn and the other choices sit at their own width, centred (not stretched across the column), and the colour legend and the mode line show; the Notes shown cells are `Full | Thin | Melody + bass | Melody | Lead sheet`, each on one line. Background is near-opaque Ground (`--scrim-hi`). It centres between the banner and the keys, drops onto the keys when the room above them runs out, and scrolls when it is taller than the stage. **Over the paper:** where the stage under the card is too short to hold it (Staff view, a 96 to 150px strip; a reading drill with the on-screen keys, no stage at all) the banner and card go up over the staff pane instead, before Play, while the paper is still (`.stagecol` takes the pane's height, `--paper-h` from `staff.ts`, and is the container its layout asks about; the card is Panel Raised with the banner's edge and shade, since the score would show through a scrim). A song's card is centred on the paper; a drill's, which is a title and a hint, and a look-through's, which is a page to read, sit at its foot. Playing sends it back. On a split-view stage (340 px tall and 700 px wide or less) with the banner, a card with You play or Notes shown drops its title. Reading drills and calibration show only a title and the start hint. A scale or technique exercise's cover reads `SCALE` or `TECHNIQUE` with its key (where its form or tonic names a mode) and `4/4`, never `Your file`.

### You play row
- `.accomp` on the start card under Perform | Learn (`src/accomp.ts`): a Label "You play" over a segmented control, one cell per choice. A piece with several source parts offers Everything plus one cell per part (a folded Lied: Everything, Voice, Piano); a two-hand piece offers Both hands, Right hand, Left hand; a one-hand or single-part piece shows no row. Choosing a part adds a hint under it, "The app plays the voice part. Only your part is judged.", capped at 46ch. On a stage 420px tall or less the caption and the choice share one line and the hint hides; while the "No keyboard yet" banner shows, the taller card drops onto the keys and its mode line hides.
- The notes the app plays are dimmed to 50% on the staff (`#staff .head.app`, 3.4:1 on paper) and to 40% in the falling lanes (Listen's existing 40%), so they stay readable but are plainly not yours. Results add one line, "Judged on your part only: the piano part. The app played the voice part."

### Ghost switch
- `.ghostsw`, a Switch labelled "Ghost of last run" on the start card, centred at the foot of the card, before the Report a problem link. It appears once a piece has a take, is remembered per device (`piano.ghost`), and hides on a card under 260px tall. Never offered in Read drills or the special runs.
- On: each key of the last run is a dim dot behind its head on the staff (Ink Soft at 50%; an on-time key hides under its note, an early or late one shows beside it), and in the lanes a bright tick where the key went down (Ink at 70%) with a thin hairline while it was held (Ink at 40%).

### Memorise card and strip
- The start card of a Memorise session hides Perform | Learn (the stage is the choice) and shows a "Stage" segment of five digits 0 to 4 (system 650 22px tabular, min 44px wide; each radio is named, "Stage 2, every 2nd bar hidden"), the stage's name (kept on the short card) and a "Look first" facts list (key, time, bars, each hand's range, bars that repeat an earlier bar).
- While playing, `.mem-bar` is its own row above the staff, never over notation: Scrim, Line border, 8px radius, 15px Ink Soft with Ink figures: "Stage 2 · Every 2nd bar hidden" and "n right · k slips · clean j of 2", and from stage 1 a small Peek button (page icon) that shows the awaited bar for 2 seconds. At stage 4 (no staff) it is the same row at 15px.
- The pass card is the results card's single column: the stage played as the figure ("2/4", captioned "stage"), slips, peeks, a strip of bars with "Bar 1" and the last bar under its two ends and up to three weak spots; the primary names what it does ("Again at stage 2", "On to stage 3"); the strip above the staff is hidden while the card shows; a loop pass reports in the banner. Songs rows show a "Memorising n/4" tag until the last stage is cleared, then "Memorised".

### Look-through card
- The start card of a read-through: title, one hint line ("Look it through: the key, the time, the bars that look hard. Nothing counts yet."), a 4px meter that drains over 30 seconds (full while more time than that is left) beside "0:27" (15px Ink Faint, `role="timer"`), then one wrapped row: Tempo with - and + icon buttons around a 28px tabular percentage (default 70%), the switch "Only the next two bars", "More time" (adds 30 seconds, as often as asked) and a plain "Start now". "10 seconds left" is said once to a screen reader. A 13px Ink Faint line says why this piece was offered, and a second carries the credit. No Perform | Learn switch shows for the pass. The staff shrinks to fit the piece (not below zoom 0.6) and goes back afterwards.

### Read-through summary
- The results card in its single-column grammar: accuracy percentage as the big figure (captioned "accuracy"), "Read-through at 70% tempo", one line (accuracy, notes caught of total, wrong notes), a strip of one cell per bar (slipped bars Miss Red and taller, the rest Line Strong 8px; height says it as well as colour), "Bar 1" and "Bar n" under its two ends (the labels are as wide as the strip, not the card), with a sentence naming the slipped bars, the weakest two bars, the next piece and why. Actions: primary Next piece, Loop these bars (opens Learn on those bars looped at 70%), Songs.

### Banner, Ready card, Results card
- The banner and the start card share one column over the stage (`.stagecol`, 14 px from the top, 4% each side, 10 px from the bottom): the card centres between the banner and the keys (24% of the stage); short of room it drops onto the keys, then scrolls. They never overlap.
- Start from the piano: on the start screen any key is the Play button. The first note to play starts the piece there and then (no count-in, the key judged on time); any other key starts the count-in. Calibration and a paced Sight run always count in.
- Keyboard strip labels: the Cs always carry their octave (C3, C4, C5), as Synthesia's Octaves labels do; the other letters come with Note names.
- Lines turn, not bars: a window of several lines (reading drills and Sight run always show two at least, six bars a line; a zoomed-out piece) keeps its lines until the top line's last note is played, then the second line eases up into its place (350 ms) and a new one comes in under it (`docs/changes/sightroll.md`).
- Staff cursor: Paper Cursor (the lamp darkened to hold 3:1 on paper), 1.5px, round-capped, at 70%, no glow, the bottom layer of the staff (under the staff lines as well as the notes). In Learn and the reading drills it stands on the awaited note, through the middle of its head. It stays at the same opacity as on the dark panel: on paper the 70% line still reads as a brown-gold rule behind the ink and does not compete with the awaited head.
- MIDI chip: the keyboard's name only; a key lights its ring for a moment, it never shows the key.
- Play: the first Escape pauses a run (count-in, playing, waiting); the next leaves. Leaving returns to the page the piece was opened from; a reading drill returns to Read. The results button names that page.
- iPad app: with no keyboard connected the banner reads "No keyboard. Plug in a USB keyboard and switch it on; it connects by itself. Or connect one over Bluetooth." with the Connect button (the chip's panel, where Apple's pairing sheet opens); the same button is in Settings' Keyboard row and Set up, and the MIDI chip opens the sheet. The screen stays awake only during a run.
- Results cards are a labelled `role="region"`, not a dialog: they are not modal (the bar and dock stay reachable). Footer, every card (song, scale and technique, reading set, Sight run, Theory session; practice path phase 2): Continue as the one primary, with where it goes in a line under the actions (`.dest`, Ink Soft 17px, tied to the button by `aria-describedby`: "Loop bars 6 to 7 at 70%", "Review: Bass landmarks · 12 cards due"), then Again as the restart icon alone (`aria-label="Again"`; on a reading set "Another set", and a solid stage keeps a plain Next stage), a More button (three dots) when there is something behind it (Listen back, Compare with last time, the pace step when Continue is not it, Try it from memory; no icons in it; a menu of one item is that item), and the way back (Back to Songs, Today, Read; All stages; All trainers) as the only ghost, at the right end. On a phone the line stays under Continue and the way back wraps below it. Where Continue goes is `nextUp()` (`src/next.ts`); if its code cannot load, the card shows without it and Again is the lamp. While a card shows, the bar's back button is hidden (the card names the way back), and under a song card the dock's Loop worst bars, Clear loop and Tempo hide (Continue is the loop, the tempo step is in More). The stats disclosure is Details, not More. Read-through and Memorise cards keep their own next step (Next piece, Again).
- Results cards (read-through, memorise): a grid of the words (`.stats`: the Display 34px title, the lines, the bar strip with "Bar 1" and the last bar under it, the advice) on the left and the figure top right, 88px; the actions span the bottom. The song card is its own, below ("Song results card"). Over six slipped bars the sentence counts them ("Slipped in 12 of 32 bars") instead of listing them. A read-through where nothing came in from the keyboard says so, draws its bars neutral and offers no Loop these bars.
- Song rows: one line each. One action (the lamp Start or Continue on the one row that carries it, Learn on the rest; the whole row opens Learn too) and a More button (three dots, 44px) whose menu opens down from it: Perform, Listen, Read through, Memorise, and Options on your files. One menu open at a time; a choice, a tap elsewhere or Escape closes it, and focus goes back to the More button.
- Listen (a row's menu): the piece opens in Learn with both hands on Listen and Wait off and plays straight away through the app's piano, whatever Sound says; nothing is judged or kept. At the end the start card is back with the hands yours.
- Banner: Panel Raised, 12px, floats at stage top above the canvas (`z-index: 3`; not capped at half the stage). It carries loop verdicts, test-run notes and the "No keyboard" line with Connect (a live region, `#banner`, kept in place while its words change). Ready card: Scrim, 12px, title (54px), one sentence ("Tap Play to start." on coarse, "Press Space to start." otherwise; Learn adds "The song waits for you."), legend once per device (Right hand terracotta swatch, Left hand tinted with a lighter verdigris outline, Play this lamp). Results card: see "Song results card" below; the drill, Sight run, read-through and Memorise cards keep the whole-play-area overlay.
- Results: the Back button names the page it returns to (Songs, Scales or Technique); a piece is "Piece complete", a scale, exercise or Sight run "Run complete" with the range in bold under it. Under 760px a stage table sets the meter column to 130px, typical time to 64px and the action to 110px so the name keeps most of the row, and a tag sits under the name; a songs table keeps the Best column at 60px. In a Theory card Replay is optically aligned with the text (-16px margin) while Stop and All trainers keep a 16px inset. Staff letters and hairpins between the staves clear the lowest head above (gap edge to edge, letter 20 units tall); the Technique aim-for dynamic uses the same row.
- **Lead sheet:** a Notes shown level: the melody on one staff and a chord symbol (`.cname`: Ink Soft, bold 18px) above it where the chord changes (none over a pickup bar or a figure of fewer than three pitch classes), clear of the highest ink and above the bar numbers. Chords are read from the harmony (triads, sevenths, slash basses), so Ink Soft, never Ink, and never claimed as the composer's. The start card adds an "App plays the chords" switch (the Ghost switch's style, a block chord with its bass on each half bar, not judged) and the line "Chords from the harmony of the piece, not the composer's marks." Offered only on a piece with a left hand. The "App plays the chords" switch is a device setting, kept. On a short stage (under 420px) Notes shown is one line, caption and choice side by side, like You play; the mode line is dropped and the chord switch and its line share a row; under 260px the row is hidden. A run at a Notes shown level above Full is not a run of the piece: heat only, no Best, no Ready day, no review box, and the results say so.
- **Touch block:** a velocity histogram from soft to hard with the average marked, one line (average and band word, spread, hand means, low, middle and high keys when played).
- **Evenness block:** a 396x74 strip, one bar per struck note above or below a centre line for how much louder or softer it was than its neighbours, the allowed band shaded (Wash), bars inside the band Edge, bars outside it Ink, a line of words ("Evenness: Even, 92% of 24 notes within ±8", plus one hint). No hue is spent on it.
- **Coach lines:** below the blocks, Ink Soft sentences with Ink figures, one fact each: timing ("your gaps vary by about 14 ms; you run 9 ms behind the beat", Learn and Technique; in Perform it replaces the lean caption), legato or staccato length, voicing (right hand against left), a Fixed key touch note, and "A test run: no touch marks while you played." after a quiet test run.
- **Follow-the-score lines:** on a song with written dynamics or articulation, up to two coach lines come first, each a pattern seen at least three times ("You played the crescendo in bars 5 to 8 as a flat line.", "4 of 4 accents came out no louder than the notes around them.", "8 of 8 staccato notes were held long (about 95% of their value)"). Plain Ink Soft sentences with Ink figures, no score, no red; absent with Touch feedback Off, in Read, when waiting and for exercises, which keep the evenness block.
- **Pedal line:** when the sustain pedal (CC64, down at 64 or more) was used in a Perform or Learn run without Wait or a loop, the coach lines gain one sentence, "Pedal: ...", in the same paragraph style: how many changes of the bass it was changed with, and the bars where the old chord was still ringing under the new one. Plain words, no score, no colour, nothing when the pedal was not used. The sampler honours the player's pedal (a released key keeps ringing until it comes up); the app's own notes ignore it. Technique's chooser has "Pedal changes" (Key and Tempo only): four bars of I IV V I triads.
- **Listen back and Compare:** the results card of a piece gets two quiet buttons before Songs, "Listen back" (with a play icon) and, from the second run, "Compare with last time" (`aria-expanded`). Listen back plays the run through the app's piano; the card steps aside and the Listen bar shows (below). Compare opens `.cmp` between the stats and the actions: a key (last time, this run), then a strip per bar. Right keys are two thin columns per bar, last time in Ink Faint at 55% and this run in Ink, turning Great mint when 15 points or more better and Miss red when worse; mean timing is two ticks about a beat line (late above). One line names the bars that changed and both runs' mean timing; a small "Hear last time" plays the previous take. The card scrolls when taller than the stage. A mint or red column is colour on a strip, with the line beside it saying the same in words (see debt).
- Drill and Sight run results are a fixed overlay under the bar. The title and completion state sit opposite a plain count ("24 of 26", captioned "right first try" or "on the beat"); the internal card abstraction never appears. Below: a like-for-like accuracy comparison when a prior result exists, "Personal best" only for a strictly higher recorded result, then two labelled facts. Drill shows typical response and mastery before to after, its meter, the solid rule and weakest notes. Sight run shows typical response and longest run, then weak notes; the per-note time-and-miss strip is behind "Note-by-note detail". Continue or Again leads; Back to Read stays apart. Speed is context, never a record or comparison that rewards rushing.

### Song results card
- **Place.** `.results.on-stage`: absolute over `#stage` (the falling-notes pane), Scrim, 10px inset; the card is centred in it and scrolls inside it when taller (a phone, the Mark list open), with the footer row sticky at its foot (a Line hairline above it) so the next step is never scrolled away. The staff pane is never covered, and it opens on the run's first slip (the first wrong key or miss, else the first mark), not on the last bar played. The staff-only and falling-only views open as Both while the card is up (`game.reviewing`, the saved view untouched) and go back when it closes. The HUD's live percentage hides while the card is up: the card's count is the run's figure.
- **Order.** Display 30px headline (`h2`, a sentence: "Clean at 70% tempo.", "Clean, with the song waiting.", "Not clean yet: 3 slips in bars 7 and 8.", never "wrong" or "fail"); the figure at the right of it, Display 40px, a count with a caption: "45 of 48" over "notes right", or "right first time" in a waiting run. The percentage is only in Details (and the Over time chart). Under the headline, when there were slips and some bars had none, what went right in one Ink Soft 17px sentence: "Bars 1, 3 to 5 and 8 had no slips." (past three runs of bars: "26 of 32 bars had no slips."). Then one line for each thing measured (`dl.measures`: Ink Faint 15px name, Ink Soft 17px sentence with Ink figures, and at the right "counts" or "not counted yet" in Ink Faint 14px): Notes (what went wrong and where: wrong keys and missed notes with their bars when there are up to three; the figure already says how many were right, so the line does not repeat it; "No wrong key, none missed." on a clean run), Time (on the beat out of the hits, then the lean, "neither early nor late on average" under 8 ms, and the spread; in a waiting run "The song waited, so time is not measured." and no status), Holds, Touch (the evenness sentence, spread, notes in range). What counts follows the rules the app has, at the standard the run was judged at (practice path phase 3): Notes always; Time in Perform (its windows are Auto's at your level, or the Timing you picked); Touch in Perform on a technique exercise that asks for targets, and from Path level 2 the evenness of a scale or an exercise (decision 5: at level 1 an uneven scale still counts, shown and "not counted yet"); Holds not yet, and absent at Easy, which grades none. Then the coaching points (`ol.points`, a Line hairline above, Ink 17px), up to three, by priority: why the lamp loops the bars it does ("Bars 6 and 7 had 4 of the 6 slips. Bar 6, beat 2, right hand. Played G♯4 where F♯4 is written." over Continue and its line "Loop bars 6 to 7 at 70%"; "Bars 2 and 3 held you up longest." when the loop's bars had no slip, only a long wait), then a lean of 30 ms or more ("Most notes came about 34 ms late. If they felt on the beat, calibrate Delay in Set up."), then a tendency repeated in at least two of the three compatible, non-waiting takes the app keeps ("Bar 7 was late in 2 of your 3 recent runs.", or "all 3"). A clean run gets no run-local point; a repeated pattern can still appear. The loop is not a second button on its point: one action, one place, the footer's lamp. Then the coach lines (no voicing line when every note came in equally loud), then one row: Review on the score and the two disclosures, Mark list and Details (each opens to the full row; the list scrolls past 168px).
- **Footer.** Continue (see "Results cards" above). After a run that was not clean it is the loop of its worst bars with its tempo, in place, with the loop icon and "Loop bars 6 to 7 at 70%" under it, so the first coaching point already says why; at most three times a day for a piece, then it moves on and the loop waits in More. After a clean run it moves to the day's next thing (decision 6) and the pace step ("Try 75% tempo", "Try it without waiting") waits in More and on Today's piece row. The loop's bars are the two neighbouring bars with most slips, the same wrong keys and misses the headline counts; only a run with no slip, held up by long waits, loops on its heat.
- **Phone (560px and under).** One column: the headline, then the count with its caption on one baseline, then the lines, each with its name and its status on one row and the sentence under them.
- **Review.** Review on the score, or a tap on a mark on the paper (30px from its middle), folds the card: the paper takes the room (`game.reviewing = 'sheet'`, the Staff view's layout) from bar 1 at the size that fits the whole piece (the dock's Fit, for the review only: not saved; Results puts the size back), and the bar is the strip of keys under it (Panel, a Line hairline above; the finished run's keys say nothing, so it covers them). The bar: the Results button, previous and next mark around "4 of 13" (Ink Faint, tabular), the mark's sentence in Ink 15px (`#markSay`, `aria-live="polite"`: words go in the bar, never over the music), Show all timing (Perform, only when some notes were Great) and one legend line that draws the paper's own marks small (× missed, the crossed dashed head a wrong key at the pitch played, ◂ a little early, ▸ a little late, ▹ late). It opens on the first slip. The Mark list is an ordered list of buttons, one sentence per mark in reading order, from the same data as the paper ("Bar 7, beat 2, right hand. Played E4 where F4 is written, about 180 ms early."); a row, a tap on a mark or the bar's arrows (← and → too, while folded) ring that mark (a 34px Paper Ink circle, kept on it when the window turns) and mark its row current. Escape takes the ring away first, then unfolds the card. A long piece steps through the marks by bringing their bar into the window. The paper's description (`aria-label`) ends with one sentence of the run: "2 wrong keys in bars 7 and 12, 1 missed note in bar 12."

### Judgement popup
- `#judge`: Newsreader 650 42px sentence case, centred over the stage, colour by grade (mint, pale mint, neutral, faded neutral for Late, crimson), its glyph before the word and the word always present. Beneath it a 15px early/late or touch line (none for Late: the word says it) in Ink at 85%. Ground halo, no offset.

### Ghost note
- What the player is pressing, drawn on the staff: hollow notehead, dashed Paper Ink 72% stroke 1.5, ledger/accidental text the same, ignores the pointer. Hit: slides onto the written note, fills 40% in the paper grade colour (no glow), fades by 0.52s. Wrong key: stroke Paper Miss, an X, a 0.5s shake. Released unscored: fades 0.25s. Max 12.

### Target pips (falling bar)
- On Technique exercises, a bar at least 22px wide and 26px tall carries 3 squares (8px, 10px pitch) 6px under its top in Ground: 1, 2 or 3 lit (90%) for soft, medium, hard; unlit 22%. Level and count, not colour, carry the meaning.

### Score marks (staff)
- A piece's own articulation, slurs, hairpins and dynamic letters are drawn in `layout.ts` (pure) and painted by `staff.ts` with class `mk`: Ink at 70%, so they sit under the notes in weight. They come from MusicXML only; a MIDI file or a score that writes none shows none.
- **Staccato, tenuto, accent:** Bravura articulation glyphs on the side of the head away from the stem (outward on the stem side of a two-voice staff), always in a space, never on a staff line or a ledger line, and past a finger number. They sit inside the chord's group, so they dim and hide with it.
- **Slurs:** a filled crescent per hand and part, from the first to the last note of a slurred run. It goes under the notes only when the stems at both ends point up, and rises to clear every head, stem and mark under it (capped at 4 spaces, then the ends move out). Where the window or a line break cuts it, it stays open at the system edge.
- **Hairpins:** two thin 1.3 round-capped lines, one piece per system, the opening at a cut end matching the time already passed. **Dynamic letters** are Bravura at the note's time. Both sit between the staves, or under a lone staff, clear of the heads and marks over their stretch; hairpins stop short of a letter in their way.
- In a read-through they are masked with the chords (`.mk.ahead`).

### Run marks (staff)
- What a run leaves on the paper, drawn by `staff.ts` from the judge (`marks.ts` lists the same marks in words): a missed note, a Good or Late note, and a wrong key. Position and shape carry it, hue only adds: a missed note is a Paper Miss × under its head; a Good note is a filled triangle under its head pointing the way the key missed the beat, **◂ early, ▸ late**, and a Late one an outlined ▹; all are centred under the head, so in a run of quick notes a mark never sits between two of them (decision 10, settled 1 Nov 2026: the plan's shift of 5 units left or right was about 3px at the review's size, unreadable from the stand, and put a shape under the gap to the next note; the pointing glyph says the same thing at any size and matches the live ‹ early / late › word; the milliseconds are in the Mark list and the review bar, never on the paper). A wrong key is a hollow dashed head with a × through it, Paper Miss, at the pitch played and the time it was played (ledger lines and an accidental as the ghost has them), after the run only, so the live ghost's shake is not repeated while playing. How far left or right of the written note it sits is how early or late; where it lands on a written head's column a step or less from it, it stands beside that head as an engraver sets a second (14 units, on the side it was played, right when on the beat), its accidental left of the written head.
- After the run a missed head stays Paper Played: a rebuild (Review, a step to a mark) does not flash it crimson again.
- Bandwidth: once the run is over the Great ● is hidden (`#play.resopen:not(.alltiming) .gshape.great`); Perfect never had a mark. Nothing on a note means it was fine. Show all timing in the review bar puts the ● back. During a run nothing changes.
- A wrong key that is a written note's own pitch within a beat of it is that note early or late, so it is a mark of its note (a miss or a Late), and it is not charged twice (`docs/changes/practice-path-1.md`).

### Dynamics marks (staff)
- Aim-for dynamic on Technique: p, mf, f are Bravura dynamic glyphs (40px, Ink Soft); cresc. and dim. are 17px Newsreader italic 500 words in Ink Soft. Once per system between the staves at the left, or above a lone staff past the bar number. Accents are a 1.6 round-capped chevron beside notes above C4, opposite the stem. `aria-hidden`.

### Hold feedback (staff)
- After a held note is judged, its head keeps a 1.4px outline: dashed Paper Good when held too long, solid Paper Miss when released early (the two differ by line, not hue). Perform results report the same fact in words as "held n%".

### Held-chord readout
- Absolute at the right of the play view, 16px in: Scrim, Edge border, 12px, min 120px, right-aligned. Chord name in Display 34px (an open fifth is "C fifth", never "C5", which the keyboard strip uses for a key); a 13px Ink Faint line under it. Pointer-transparent, `aria-hidden`.

### Count-in numeral
- 160px Newsreader 400 in Lamp, 36% from the top, centred, over a soft Shade, pointer-transparent. One numeral per beat.

### Listen bar
- `.takebar` floats at the top centre of the stage while a take plays back: a pill (Scrim, Edge border, soft drop shadow), a Newsreader 650 22px word ("Listening back" or "Last time"), a 13px Ink Faint "Tap or press any key to stop" and a small Stop with an x icon. The staff cursor, falling notes and scrubber head follow the take. A piano key, a tap or Escape stops it; Escape does not leave the piece while it plays.

### Drawer row
- Settings is grouped as iOS Settings is: a quiet heading (`.sgh`, 13px 600 Ink Faint), then the group's rows on one Panel Hover surface (`.sgroup`: Line Strong border, 14px radius, rows split by Line Strong hairlines). Every row (`.srow`: a 6rem label in Ink Soft, then the control; a switch row is the name at the left and the switch at the right) carries one plain line under it (`.note`, 13px Ink Faint, full width) saying what the setting does, in the player's terms, never the code's. Segmented controls inside a group pad their cells 9px so four choices fit beside the label in the 440px drawer. The iPad app adds a Reminder group after Display (hidden on the web): one row, "Remind me", an Off / On segment and a native time field (`type=time`, 19:00 to start, disabled while Off), with a note in the same plain terms ("One note a day at this time, never on a day you have already practised. It stops after three days you do not open the app, and it says what is next, not what you might lose."); turning it On asks the iPad for notification permission, and a refusal puts the segment back to Off with one line under the row saying where to allow it.

**The iPad menu bar** (`AppDelegate.buildMenu`, `src/menu.test.ts` keeps it with the page's keys): the system's "Page to Hand Settings…" (⌘,) opens the app's page in iPadOS Settings and keeps its slot; "In-App Settings…" (⌥⌘,) sits beneath it in the same group and opens the drawer. The View menu begins with the seven tabs on ⌘1 to ⌘7, then Zoom In and Out (⌘= ⌘-), Next View (⌥⌘V), Note Names (⌥⌘N) and Hide or Show Controls (⌥⌘M); Practice has Play or Pause (⌘↩), Metronome (⌘B), Slower and Faster (⌘[ ⌘]); Help has Keyboard Shortcuts (⌘?). Every command is a shortcut shown beside it, and each sends the page the key it already handles (the digits 1 to 7 and the comma are now page keys too, so the website has the same set); a menu command works with Settings > Advanced > Keyboard shortcuts off. Escape is the page's own and has no menu item: a menu key would take it from dialogs and text fields.

**App Shortcuts (iPad app)**: two foreground App Intents, no generic navigation list. **Today's Practice** opens the exact unit offered by Today's lamp and stops at its ordinary ready state; **Sight Run** opens Read with the Sight Run builder selected. Both are available from Shortcuts, Spotlight and Siri after install. The native intent persists one action id across a cold launch and sends it through the existing Capacitor plugin; the page waits until its local record and Today plan are loaded, then calls the same route a tap calls. The intents do not own practice state, duplicate recommendation logic, require an account or start sound without the player's tap.

**Dynamic Type (iPad app)**: the system text size reaches the page as a content size category and becomes `--ts` on `<html>` (Apple's body size over 17 pt, never below 1, at most 2). Every font size is `calc(Npx * var(--ts))`; the staff, the highway, the covers and the music glyphs keep their own zoom. The top bar stops at 110% (`--ts-bar`, as iOS's tab bars and toolbars do: seven tabs and the keyboard chip have no room for more), the Settings drawer widens in step with the text, and the stage tables' column widths follow it.
- **Playing**: Timing (Auto | Easy | Standard | Strict: how close to the beat a note must land; In Perform, Standard and Strict also grade how long a note is held; Easy does not), Touch feedback (Auto | Off | Gentle | Standard | Strict: how big a jump in loudness the coach marks), Delay. Auto is the default of both and follows the lower of the Songs repertoire ceiling (the highest level with three Ready pieces) and the Read frontier; Theory, Scales and Technique wait for phase 5's per-strand model (`AUTO` in `src/settings.ts`: Timing Easy at level 1, Standard at 2 to 4, Strict at 5; Touch feedback Gentle at 1 to 3, Standard at 4, Strict at 5). Each row's line opens with what Auto is doing now, in bold Ink Faint: "Auto: Easy, from the lower of your Songs and Read levels (1)." A value picked by hand stays. Touch feedback's five choices, and on a phone (480px and under) every choice row, go under the name across the row instead of beside it. (field, ms, Calibrate; a Bluetooth output adds a line).
- **Sound**: Sound from (Keyboard | This device), Instrument and Volume only under This device, Click (count-in and metronome volume).
- **Display**: Appearance (Auto | Dark | Light, Auto the default: sets `data-theme` on `<html>` and the iPad window's style, `src/theme.ts`; `public/theme.js` applies a saved choice before first paint), Effects (Off | Calm), Pulse (Off | Beat lines | Ball: the beat seen while the metronome runs, the Ball standing in for the lines when only the staff shows; Silent in the Practice menu gives it without the click).
- **Your data**: Sync (Use iCloud Drive in the iPad app, Choose folder on the web; once on, Sync now and Stop; one status line names permission, failure or last success) and Backup (Export, Import and a ⋯ More holding Summary for a teacher and Delete all data). Sync merges progress, pieces and packs; keyboard and display settings stay on each device. Export remains the complete manual recovery path, including settings.
- **Advanced**, a Disclosure: Note names, "Fade names I know" (indented, disabled while names are off), Finger numbers (on by default; the fingering drawn on scales, with a line saying a pack can turn it off for one item), All 88 keys, On-screen keys, "Always show touch marks", Aim for the file's dynamics, Fall speed, Hand split, Key touch (the keyboard's own setting, explained: runs are labelled with it and Fixed turns evenness off), and "Keyboard shortcuts" (on by default: N, M, V, B, ? , [ ], - + and the computer keys that play; off for voice control and switch users, WCAG 2.1.4). Calibrate needs a keyboard: with none it is disabled and the line says so.
- No keyboard row: connecting lives only in the keyboard chip. Footer: Set up, Help, Credits, Support and Privacy links. The last two open the public pages outside the iPad web view. The markup is `src/ui-drawer.ts`, loaded the first time Settings opens. The header is the title and a ghost ✕ ("Close settings"). The drawer is a modal dialog (`role=dialog`, `aria-modal`, named "Settings"): Tab and Shift+Tab wrap inside it, and the page and the top bar behind it are inert except the Settings button, which closes it; Escape closes it and returns focus to that button. A tap outside closes it.

### Keyboard chip and its panel
- The chip in the bar (`#dev`) names the connected keyboard, or "No keyboard", and is the one place that connects one. A tap opens a panel under it (`#kbMenu`, the shared ⋯ menu behaviour: one open at a time, outside tap or Escape closes it, focus returns to the chip): "Connected" and the keyboard's name, or a select of All and each input when there are several; on the iPad "Pair a Bluetooth keyboard" (the system's pairing sheet), on the web Connect until MIDI is allowed; and, with none connected, the one sentence "Plug in a USB keyboard and switch it on; it connects by itself." (`PLUG` in `src/guide.ts`, said the same on the banner, Set up and the Connect lines), with Connect a bordered button. The chip's accessible name is "Keyboard: " and its state. Under 760px the name gives way to a keyboard glyph and the state dot. Elsewhere (Set up, the play screen's No keyboard banner) a Connect button only opens this panel (`data-kb`).

### Scrubber
- 44px Ground well, Line border, per-bar miss heat (Miss Red). Learn: slider with an A-B loop region (Ink 14% fill, 2px Ink edges) and a Lamp playhead. Perform: 18px non-interactive progress bar. The Learn slider has a name, `aria-valuemin`, `aria-valuenow` and `aria-valuetext` "Bar n of m". Keyboard: the arrows step a bar, Page Up and Down four, Home and End the ends (from the bar it is on, not from the clock); with Shift an arrow stretches a loop from the bar it started at. Touch has an equivalent without dragging: tap a bar, choose Practice > Set start, tap the last bar and choose Set end. Whole-page swipe navigation is deliberately absent: it would collide with VoiceOver, the scrubber, staff gestures and iPad edge gestures while duplicating the persistent section tabs.

### Streak line
- `.streak`: one 15px Ink Faint line under the week meter, "12-day streak · 1 freeze", with "· a freeze covered yesterday" after a spent freeze. Absent at zero, never styled louder, never a loss message. One freeze is earned per seven practised days in a row, at most two are held; today is not judged until it is over.

### Break toast
- `.rest`: a quiet toast fixed 68px from the top, centred: Panel Raised, Edge border, 12px, "Stretch your wrists" and a small ghost Dismiss, gone after 90 seconds. It appears after 30 minutes of playing with no pause over 5 minutes. It carries no claim about injury.

### Library tools
- The Open library on Songs: an `h2.sec` "Open library" with the match count beside it, then the faceted list (`src/facets.ts` the engine, `src/library-view.ts` the page; the home shelves of docs/research/library-and-profile.md option D will be saved selections over it).
  - **Row 1:** the search field (a 420px max pill-less input, 8px radius, a magnifier inside at the left; placeholder "Title, composer or opus") and the **kind** segment: All, Pieces, Songs with voice, Studies, each with its count. Pieces is the default; typing in the search box looks in every kind unless one was chosen by hand, and emptying it returns to Pieces. Songs with voice (the 1,299 Lieder, piano part under a voice) and Studies (Hanon and the other technique collections) are lanes of their own, off the piece list and off the recommended piece, still searchable, each with a one-line note under the row in Ink Soft ("The piano part of songs ..."; "Studies and technique collections ... never offered as your next piece"); they list by composer and number, not by level. A fragment (under 16 bars or 10 seconds) is a piece with a "Fragment" tag in its row.
  - **Row 2:** the Level segment (All levels, 1 to 5; counts beside the numbers from 720px), selects for Length, Key signature and Period, and a ghost **More** (`aria-expanded`) that opens Form and Composer in the same row (open by itself while one of them is chosen). Every value shows its count against all the other choices ("Baroque (277)"), and a value with nothing behind it is disabled (a select option, a segment cell at 45%), never hidden. Below 640px the kind segment is a 2 by 2 grid and the selects share the row.
  - **Chosen filters** are chips (`.chip-btn.on`, the value and an x icon, named "Remove Baroque") with a ghost "Clear filters", on a row of their own that is absent when nothing besides the kind is chosen.
  - **A result of nothing** is a table cell in Ink Soft: "No piece matches "fuga", Baroque and Pieces." and up to three ghost buttons, each taking away one thing and saying what it brings back: "Remove Baroque (+34)", "Show every kind (+120)", "Clear the search (+12)"; a removal that would bring back nothing is not offered. Focus goes to the search box after Clear.
  - Rows are the Songs row: the Cover (the piece's first bars from the sidecar, or its file's); name with "composer, Level n, licence" and the length; Ready and Fragment tags; the same ghost actions as the Songs row. Fifty rows a page; "Show 50 more" and a "n of m" count at the right. When a Level is chosen and some of what is listed is not on the device a ghost "Save level n for offline" shows ("Saving 12 of 40", "Saved for offline", "n not saved. Try again"); it saves what the list shows, so Pieces at Level 3 does not pull the Lieder.
- A Skip button follows the Level filter, `.btn.ghost` visually hidden until it takes focus, then in the tools row at the right: "Skip the 50 pieces listed". It moves focus to the end of the list (the Show more row). Hidden when no piece is listed.

### Packs
- A pack is a short list that names what the app already has (pieces, exercises, Read and Scales stages) in an order, with a note for each (`src/pack.ts`, `docs/changes/studies-packs.md`). On the page a pack is a plan row with no lead: its title as a name of music (`.pn`, Newsreader 560), a sub-line that says where you are ("Next: No. 4, La Petite Réunion · 3 of 18 ready"; a warm-up says "Today: No. 5 and No. 6", and "Done for today" once both are played, and never counts the book), then a ghost **All n** (opens the list) and **Start** (the next item, with the play icon). The pack you last started something in, while it has a next step, is what Technique's head Start starts ("Hanon warm-up · Today: No. 5 and No. 6"); its row's Start stays ghost, like every other. The last rows are **Bring a pack**, with a ghost Choose file, and **Page to Hand packs**, with a ghost Browse.
- **Page to Hand packs** opens the existing sheet with the checked public index as plan rows: title, description, item count and CC0 / CC BY licence, then a ghost Add (disabled and named Added when kept). Add downloads the file, passes it through the same pack parser as a file or link, moves to its Technique or Songs page and opens its list with “Added from Page to Hand.” The index is a convenience, not authority; a bad index or pack gets one plain status line and never gets stored.
- **The list** is a `dialog.sheet`: the title, an Ink Soft line "By Page to Hand · CC0" (a pack you brought adds "From a file" or "From a link"), the about text, an optional status line ("Added from a link.", "Link copied."), and the items as an ordered list in the plan-row grammar with the lead column (a ring to do, a check when done by the item's own rule: a piece Ready, an exercise or stage Solid). Each item: its name, a sub-line of its state word, "Level n" (never for a study: decision 26) and its note, and a ghost Start. An id the app does not know is a greyed row with no action ("Not in the library yet"). The footer's one primary starts the next item ("Start No. 4, La Petite Réunion"). The header's More holds Share as a file, Share as a link and, for a pack you brought, Remove this pack.
- Starting an item opens it as its own page would (a piece in Learn, an exercise in Perform, a stage as a drill) at the pack's tempo (the dock's Tempo shows it) and with the aids it turns off (note names on the falling notes and keys, finger numbers on the staff).

### Over time card
- A sentence under the heading gives the axis: accuracy per session, up to the last 24, drawn from 40% to 100%, the dashed line being 100%. The chart sits 4px above its figure.
- On Progress, one card per kind of practice with two or more sessions (Reading drills, Sight run, Scales, Theory, Songs, Technique), in an auto-fill grid (260px min, 12px / 24px gaps): a Label, a 52px sparkline of accuracy over the last 24 sessions (a 40 to 100 percent axis, a dashed line at 100, a 2px Ink Soft line and no dots), then the average of the last five in 24px tabular system 650 with "up 4 points on the five before", "down n points", "steady" or "n sessions" in 14px Ink Faint. Before any kind has two sessions one sentence says the charts start after two.

### Notes you know
- A 600x62 strip of one bar per semitone from C2 to C7: Ink at an opacity that rises with how often the note was met, how cleanly and how fast, and a Line Strong outline for notes never drilled. C labels sit under the bars; each bar has a title with its percentage. Ink, not a hand hue, by the Semantic Hue Rule.

### Where it goes wrong and Stuck
- Progress places two profile cards after Notes you know. **Where it goes wrong** names the three pitches with the highest miss rate after shrinkage toward the player's overall reading rate; a pitch is absent below ten attempts. **Practise these** starts a reading set made of exactly those pitches. Open map shows every eligible pitch as note name, shrunk percentage, and raw missed / attempts, plus the most common played-for-written confusions from the attempt log. The shade is redundant with the printed figures. A new player gets one sentence about when the evidence appears.
- **Stuck** appears only when a unit has five counted sessions below target with no upward first-try trend and, where all five are timed, no faster response trend. It names the unit and “5 sessions, no gain”; the same pure rule changes the next recommended task. Assisted sessions do not count.

### Path requirement
- Five levels, each a Disclosure ("Level 3", count beside it "4 of 6 solid, 2 coming"). A requirement is a row of its own grid: name 18px 650 over a 15px Ink Faint detail, a state word (Not started, Learning, Solid, Coming) over a meter (none for Coming, which sits at 75% opacity), and at the right a Start with the play icon on the level's next requirement (primary only on the overall next, otherwise ghost). Scales requirements start the Scales stage, Technique ones the exercise, reading ones the stage, Theory ones the trainer. Under a level's requirements a Label "Pieces to work towards" heads the repertoire ladder: 3 or 4 named pieces a level as the same row (title, then composer and one-phrase reason in the sub-line, a state word Not started, Learning or Ready with no meter, and a ghost Start with the play icon). Start fetches a piece that is not on the device (the state word reads Downloading, the button is disabled; a failure is one line under the list) and opens it in Learn. The level's summary adds "2 of 3 pieces ready". Pieces the catalogue has not loaded yet are left out.

### Sight run builder and Theory cards
- Both are `.tcard.run`. The Sight run card: no title (the Read segment names it) and no sentence (the selects say how it runs), the Technique form grid (Clef, From, To, Notes, Cards, Length, Reading ahead, and two range sliders, Jumps from Leaps to Steps and Focus from Even to Weak notes, each with end labels), range chips, one switch ("Widen as I improve"), ghost Save this run and primary Start; saved runs below as plan rows with Start and a remove icon. A Theory trainer is a plan row with its level as a pop-up button (`Level n: name`) under the blurb and a ghost Start. A Theory or quiz card is a fine line ("Ear: intervals, card 3 of 15, streak 4"), the prompt as h2, one status line (Yes. / Not quite. and the answer), a ghost Replay on ear cards, and Stop or Next. Rhythm echo shows the bar after the answer as eight 40px cells counted 1 & 2 & 3 & 4 &, a beat to each pair, a tapped cell filled Lamp.

- **Paced Sight run:** the builder's Pace select (Waits for me, Steady beat). Steady beat adds a Tempo slider (a plain range, 30 to 100, its value in a right-aligned `small.bpm`) and an "A card every" select (Beat, Two beats); Length drops the 10-card choice; Reading ahead offers 2, 3 or 4 notes; the Widen switch gives way to one fine line saying which tempo is offered and why. On the play screen the HUD shows Cards n/N and On the beat n in place of Streak, the dock Tempo control is hidden, and judgement words are not shown, only the staff marks. Results lead with "14 of 16", captioned "on the beat", then the prior-run comparison, pace, timing, missed notes and tempo rule. "Run detail" holds the strip (`.pstrip`: 14 x 22 px cells, 2px Edge border, Radius 4; on the beat filled Ink, missed an empty outline, not reached dotted at half opacity). No streak or record tag.
### Highway and keyboard (signature)
- Notes the app plays in accompaniment fall at 40% (Listen's treatment). A Ghost of last run adds a hairline trace per key in its lane. Alternating lane tints per white key, brighter line at each C and bar, a bright receptor line over the keys with a small lamp per white key (Lamp when lit, muted otherwise), on-screen keyboard (Key White / Key Black). Held keys pulse a lane gradient in the hand's hue (a key struck with no hand to name, a wrong one, pulses ivory). Awaited notes get a pulsing Lamp outline.

### Grand staff (signature)
- **The page.** `#staff` is a sheet of `--paper` (Nocturne #efece4, Matinée #fbf8f1) across the play column in every view (Both, Staff only) and for every reading drill, Sight run, Read through, Memorise, Scales and Theory card that draws a staff: one `Staff`, one host. A margin of paper around the staves: `--pg` 12 to 36px at the sides and `--pgy` 8 to 18px above and below, the staves measured inside it (`Staff.box()`), the svg overflow visible so a bar number a hair above the viewBox is not cut. A hairline (Paper Ink at 18%) under it, then the divider; no radius, no shadow, no glow: a page, not a card. The library's mini-staff thumbnails (`thumb.ts`) are not part of this; they become covers.
- SVG painted from a pure layout module (`layout.ts`: analysis, window, positions; `staff.ts` only draws and animates). Bravura at 40px (10-unit staff space; grace notes 26px), Paper Ink on Paper, 1.1 staff lines and 1.4 bar lines in Paper Line, Paper Cursor line. Bar numbers Newsreader 600 15px tabular in Paper Ink at 60%. The layout draws rests, ties (Ink), tuplets (numeral plus 1.2 bracket), grace notes, 8va / 15ma (17px Newsreader italic Ink Soft word over a dashed 1.2 bracket), key and time signature changes, and meter-aware beams. Horizontal spacing is a monotone time-to-x map: onset columns never closer than 14 units, wider bars get more room. A bar too crowded at full spacing shows "Too dense: tap to thin" in Newsreader italic Ink Soft beside its number; tapping it steps Simplify up one level. The staff's SVG is a `role="img"` labelled from what is known: "Greensleeves, A minor, 3/4, bars 1 to 2 of 16, grand staff" (the key and metre only where the source states them; refreshed when the window changes, not live). A played chord (head, stem, accidental, dot) settles as one to Paper Played after its hit flash (a beam settles with the last note it joins, by the same timeline); hits flash 0.8s in the grade colour then settle, with no glow. When the app plays a part, those heads are dimmed to 50% and never judged. Great, Good and Late leave a persistent shape under the head at 85% (great a filled dot, good a filled triangle, late an outlined right-pointing triangle; perfect none); Miss a crimson cross, the head flashing crimson then settling to Paper Played after 2s. The glyphs match the palette's (●, ▲, ▸, ×), so a grade reads the same on the staff, the highway and the results with no hue. In Staff view the grade also shows as a Newsreader 600 21px sentence-case word above the notation, one at a time (the newest replaces the last, so a fast run never stacks them into a smear) (Paper Perfect, Great or Good; late is Paper Good with its word), on a Paper halo, fading in about 1s. Beams are flat Ink rectangles, Paper Played once played. Hide played clips the notation at the cursor so played notes vanish. Note names fade per pitch once known (Fade names I know). In a reading drill the awaited card is every notehead of the next chord in Paper Awaited, staff lines 1.7. In a read-through the bars beyond the next two are masked (chords, beams and rests) once the music moves. On Scales exercises each note carries its finger number (15px 700, Paper Ink at 72%) on the side away from the stem; the system grows to keep the numbers inside it. Touch coach marks: a note struck louder or softer than its neighbours gets a small Paper Ink triangle over (louder) or under (softer) the head, 85% opacity, never colour; after three even runs in a row the triangles drop to 35%, and every fourth run of an exercise is a quiet test run with none at all (a flash at the start says so, and results repeat it). "Always show touch marks" turns the fading and the test runs off; Touch feedback Off turns the marks off.

## Do's and Don'ts

### Do:
- **Do** keep notation Ink on Panel and let it ignite only for state.
- **Do** pair every judgement colour with a word or position.
- **Do** differentiate hands by hue, fill style (solid vs. tinted with a lighter outline) and lane edge.
- **Do** reserve Lamp (#ffc83d) for the verb and the now-markers, and use the 2px/2px Accent focus ring everywhere.
- **Do** draw control borders in Edge (#727a8b), a floating surface's in Line Strong, and keep Line for hairlines.
- **Do** use Ink 2, not Ink 3, for text read mid-song (HUD captions, bar numbers, dock labels, scrub labels): Ink 3 is 5.9:1 and Apple asks 7:1 for small dark-mode text. Ink 3 stays for icons, grabbers and menus read at arm's length.
- **Do** keep the staff at print size (staff space about 1.9 mm); the divider's 26% minimum guards it.
- **Do** build controls from `--control` and the four radii (6, 10, 14, pill) so touch sizing follows.
- **Do** start every non-play page with the page head and the 1100px measure.
- **Do** write plan, song and stage rows in the same row grammar.
- **Do** build every modal as `dialog.sheet`; header with close, scrolling body, a pinned footer when there is an action besides closing.
- **Do** mark every disclosure with the shared +/− marker.
- **Do** show tags as outlined Ink Soft words; only Next is plain Ink with no outline, on the primary's row.
- **Do** use Newsreader (upright, sentence case) for what is announced and for names of music, and the system font for everything read or tapped; repeat `font-variant-numeric: tabular-nums` on any counter whose rule uses the `font` shorthand (`src/css.test.ts` lists the counters and fails if one loses it; add a new counter to that list).
- **Do** mirror any new colour in `src/palette.ts` if Pixi draws it.
- **Do** show mastery and effort as Ink meters, cells, charts and dots plus a number or word.
- **Do** collapse CSS motion under `prefers-reduced-motion`; on the canvas the hit glow fades at one size and the waiting ring and ghost key hold steady (Calm is the only tier).

### Don't:
- **Don't** add glow on chrome, or a frosted-glass imitation.
- **Don't** add a hard offset shadow or a hard text-shadow; use Shade.
- **Don't** colour notation permanently; colour is a transient state.
- **Don't** use amber for focus, selection, links, switches, slider thumbs, the Pause / Lid mark in the bar or the HUD numerals, and never for a judgement grade.
- **Don't** use `backdrop-filter`, or an Accent fill larger than a control.
- **Don't** reuse a hand or judgement colour for chrome (the on-screen keys, a chart of grades, a connection dot).
- **Don't** set text dimmer than Ink Faint (#8a90a0) on Panel, or smaller than 12px.
- **Don't** invent a second dialog layout, an inline-styled modal or a coloured tag.
- **Don't** put a Label-style kicker above a heading.
- **Don't** add paragraphs, parentheticals or explanatory sentences to controls, headers or drawers.
- **Don't** show points, ranks, lives, a score or a loss-framed counter; effort only goes up. The day streak is the one counter allowed, small, absent at zero, with freezes.

## Design Grammar

### Token table

| Group | Token | Value | Use |
|---|---|---|---|
| Colour | ground / panel / panel-2 / panel-3 | #0c0e12 / #13161c / #1b1f27 / #222731 | well, surface, raised and floating, hover and selected |
| Colour | line / line-2 / edge | #262a33 / #363d4e / #727a8b | hairline, floating-surface and selected ring, control border |
| Colour | accent | #78a9ff | focus ring, selected text, links, text selection |
| Colour | specular / specular-lamp | white at 7% / 28% | the top hairline of a raised surface / of the lamp fill |
| Colour | ink / ink-2 / ink-3 | #f4f2ed / #a6abb8 / #8a90a0 | text primary, secondary, caption floor |
| Colour | lamp / lamp-hi / lamp-ink | #ffc83d / #ffd466 / #14110a | verb and now |
| Colour | R / L / L-edge | #f27d52 / #2ab7b0 / #6fd6d0 | hands |
| Colour | perfect / great / good / bad | #3dd68c / #a7e8c4 / #c9ccd6 / #ff3d6e | judgement, with ● ○ ▲ ▸ × |
| Type, Newsreader | 19 / 20 / 28 / 34 / 42 / 44 / 52 | top title / piece name / big button, Listening back / results verdict / judge / page h1 / ready title | announced, names of music |
| Type, Newsreader, stage | 160 / 88 | count-in / results figure | announced |
| Type, system numeral (tabular) | 22 / 24 / 28 / 30 / 32 | Memorise digits / Over time / tempo / HUD / chord readout | counters |
| Type, system | 12 / 13 / 15 / 18 / 20 / 22 | HUD caption / label, kbd, fine, sub-line / body, controls / row name, ready sentence | read |
| Spacing | 4 / 8 / 12 / 16 / 24 / 32 | gaps, card gaps, bar padding, section gaps, page top | rhythm |
| Spacing | 6, 10, 14, 18, 20 | inside controls, rows and cards | local |
| Page | `32px clamp(16px,6vw,96px) 64px`, measure 1100px | every non-play page | One Measure |
| Radii | 6 / 10 / 14 / pill | small parts / controls / cards / pills | shape |
| Control | 40 (44 coarse) | buttons, selects, chips, icon buttons, switch row | height |
| Control | 36 (44 coarse) / 52 | small / big button | height |
| Control | cell 32 (38 coarse) in 3px well | segmented | height |
| Control | switch 46x26; slider track 6, thumb 22 (32 coarse); meter 10; scrub 44 (18 progress) | | |

### Page templates

All seven pages are `section.view` with the One Measure.
- **Page head:** `h1` Display 40px; optional lede (Ink Soft, below, full width); actions pushed right (`head-actions`, 8px gap). **Start** (practice path phase 3; `lamp` in `src/next.ts`): on Songs, Read (Stages and Sight run), Scales (Stages only: Choose a scale and the Quiz keep their own lamp), Technique and Theory (not during a session) the head's last row, under the lede, is the page's one lamp, a primary Start with the play icon and beside it, in Ink Soft 17px, what it starts and why (`.dest`, tied by `aria-describedby`, id `<page>Start`): "Bass landmarks · 12 cards due", "Triads on the white keys · Next on your Path, level 1". It wraps under the button when long. It is `nextUp()` kept to the page's strand (the first week's step, the plan's next row, the most due, the Path's first requirement of that strand not solid, the strand's own row); Technique takes the pack in hand first, Theory, when Today has nothing for it, the first trainer not started at its level. Every other lamp on the page (a stage row's Practise, Songs' Learn on the last piece, the builders' Start) steps down, a row's to ghost and a form's to a plain button, and the Next tags go. If its code does not load, the page keeps its old row lamp. Title is the tab name, one word. 20px below. At most one short lede line, and none where the page explains itself: only Scales (Stages) and Theory carry one. There are no first-time tab notes (removed 31 Oct 2026: a lede plus a Got it note was two blocks of words before any content; the Help sheet says what each tab is for).
- **Loading and failing:** a page opened on a slow link shows its `h1` and, after 400ms, one quiet Ink Faint "Loading…" line (`.loading`; it goes when the body arrives). A page or sheet whose code cannot load says so in words with the one recovery, "Check the connection, then reload the page.", and a Try again on a page. The window's title follows the page ("Songs · Page to Hand") and the open piece.
- **List and plan rows:** Label-style heads over a fixed-layout table on Songs, Read and Scales (on Songs its section is an `h2.sec` with the count beside it, as on Progress); rows use 10px 12px padding with a Line rule and a faint hover wash. A tap outside a row's controls invokes its visible default action: Learn on Songs, Practice on Read and Scales, Start on Today, Technique and Theory, and Start on a saved Sight run. More, remove, select, link and action controls keep their own behaviour. Empty tables draw no header row.
  - **Songs:** the head says "Bring your own MIDI or MusicXML. Files stay on this device." Head actions are **Packs** (a button with the count beside it, `aria-expanded`: it shows or hides the repertoire packs and the ones you brought, as plan rows under the head; see Packs) and the keyboard-focusable **Add files** (which also takes a `.pthpack`); then three groups. Starter pieces and Your files share a table: the 56x42 Cover thumbnail (composer token and the opening bars; the first column is 68px at every width), name 18px 650 (Newsreader 20px for the names of pieces) with a Ready tag once played on two days and a 13px sub-line (starter: author and level; file: date and "n of m tracks"; library: composer's surname, level and licence in sentence case; all end with the length), Best (only after the first score, as a percentage), actions in a 2x2 grid below 1100px wide and one row of four from 1100px (a 432px column; rows 73px tall instead of 113): one action everywhere, named Learn with the play icon (primary on the one next row, otherwise ghost); ghost Perform; ghost Read through; ghost Memorise; and on every user file a ghost Options (opens the Options sheet) that wraps below. A local file that cannot be parsed is omitted from this table and named in a neutral notice with **Remove damaged copy**; that action removes only its unreadable bytes, keeps its practice history for a same-file re-import, and returns focus to Add files. The row hover wash shows only with a hover-capable pointer. Your files empty state: one sentence naming the action. Open library: the Library tools block (search, Level, composer, pages of 50, Save level for offline). Library rows are shorter by the Best column. Credits live in a sheet.
  - **Read:** head with a Stages | Sight run segment and, on Stages, the head action "Review weak notes" when any are due. Sight run: the builder card then saved runs (see Sight run builder). Stages: a table with Label band rows per group (Treble clef, Bass clef, Both clefs, Accidentals and keys, Melodies, Chords), name with blurb, mastery meter with percent and, always, a sub-line ("n of m seen" or "Solid · Fluent at n s"; the head is "Mastery", as on Scales); one `tbody` to a band, typical time (only after the first card), Practice. At 520px and under the typical-time column hides so the name, mastery and action remain readable. The next row's Practise is ghost like the rest: the head's Start is the lamp; "n due" is an outlined tag; all other actions ghost. Reading drills show no score and no lives: the HUD has Cards, and in a Sight run an In a row counter; the top-bar button reads Finish, and Back to Read once the results are up.
  - **Scales:** head with a Stages | Choose a scale | Quiz segment; the one-line lede "Solid after three clean runs in a row, in time, and from level 2 even; a miss starts the count again." shows on Stages. Stages: the Read table's grammar, set in the interface's voice, not Newsreader (name, blurb with tempo, and on the lamp row the next scale, a Mastery meter with "n of m solid", Practice, ghost: the head's Start is the lamp). Choose a scale: a card of five selects (Scale, Key, Hands, Octaves, Tempo), a line giving the right-hand and left-hand fingering in bold, fine lines for why the fingering is what it is, a quiet line naming any hand whose fingering is unchecked against a printed book, and a primary Start. Quiz: a card, "which degree takes the 4th finger", seven number chips answered by tap or by pressing the note, then the reason and the fingering up the scale; results "n of m" with a best streak. On the staff a finger number sits on the side away from the stem. Evenness: a small ink triangle over (louder) or under (softer) a note struck outside the band, and in results a bar strip around a zero line with the band shaded; no hue is spent on it.
- **Form page (Technique):** head with no lede; first **Studies** (`h2.sec`, the packs whose `kind` is study, as plan rows: see Packs), then an `h2.sec` **Exercises** over the builder: a `.tcard.run` like Choose a scale and the Sight run builder: an auto-fit grid (min 150px, 16px gap, align end) of six labelled selects (Pattern, Key, Hands, Dynamics, Articulation, Tempo; the Rhythm pattern swaps Key, Hands, Dynamics and Articulation for Level), then a foot row with the exercise engraved on paper at the left (the 300x200 cover: "Technique" and the key and metre at the top, the exercise's title, the opening bars; `preview` in `src/app/technique-ui.ts`) and the one primary Start at its foot, right; the touch-range card (Set touch range needs a keyboard: with none it is disabled and a line says so); then the syllabus: an `h2.sec` "Syllabus" with "n of m solid" beside it, the next five unsolved exercises as plan rows (ghost Start; outlined Due tag; Learning, Solid or Not started as the sub-line), and the rest folded under a Disclosure "n more". Scales and arpeggios also live on the Scales page; Technique keeps its own recipes beside it.
- **Theory:** head with the one-line lede "Answer on your keyboard, in any octave." The trainer list is plan rows: name, blurb, the level as a pop-up button under the blurb (see Pop-up button), ghost Start. The Connect line sits under the lede. Trainers, fourteen plan rows: chords, key signatures, intervals, cadences, scale degrees; ear: play it back, intervals, scale degrees, chords, question and answer; rhythm echo; and the pulse trainers Keep the beat, Subdivisions and Hold a rhythm against the beat. A card is read from the music stand: its prompt is an announcement (Newsreader 56px), the card centred in the room above the on-screen keys, its status line 20px. A card's answer is said through the page's one live region and focus moves to the next card's prompt (or, after a miss, to Next). A session is 15 cards, one at a time (see Sight run builder and Theory cards) and ends in "n of 15 first time" (the results verdict, Newsreader 34px, as on every results card), the best streak, the median time (rhythm, question and answer and the pulse trainers show bias and spread in milliseconds instead, and Keep the beat the drift as well), the misses, and All trainers | Again. Ear cards sound their prompt on the app's own piano and click whatever the Sound setting says, and the keyboard is deaf until the prompt ends; Replay counts. Pulse cards always click, whatever Count-in click says, and take taps on any key; a card shows its bars as Pulse bars, and a miss claps the answer on the click (Keep the beat gives a sentence, "You sped up by 6 ms a beat."). Chord ear cards say "Chord" or "Note" with a step count; question and answer cards say whether to answer or ask back, then judge the two bars on form only and say plainly what held, with no score.
- **Plan page (Today):** head with the "Plan" caption and the plan length switch (5 / 10 / 20 / 30 / 45 min); during the first week the Start here card; the last-week recap card (Monday and Tuesday: "Last week: 45 min on 4 days. Most improved: Treble clef", and a ghost "Aim for N min" after a met goal); the week strip card (days, goal meter, "n of m min", the day streak under them); then the plan as rows with a lead column. Rows, in practice order, drawn from what exists: the last Technique exercise (Due for review when it is), the next reading stage (with a meter; Review when cards are due), the Scales stage with its next scale and meter, a Theory session with cards due, the piece (Continue or Start), a piece "Due for another go" (spaced review, Play), the worst bars of the piece played last ("Bars 4 to 6 of Piece", Loop), the Path's next requirement when Scales has no row for it, a Sight run and a second reading review. A slot lists alternatives and the first that exists wins, and the minutes of an empty slot go to the piece (`src/plan.ts`): 5 min is warm-up and reading; 10 adds the piece; 20 adds Theory or reading, and one of due piece, worst bars or review; 30 adds a scale, the worst bars and one of due piece, Theory, Path or review; 45 gives scale, reading, one of Theory, Path or Sight run, the piece, the worst bars and review. Unfinished steps first, done steps (check, no time) sink below. Once every row is done the plan is one line, "Today's plan is done." (Ink Soft, a Line rule above) with a ghost "Make it 20 min" (the next length; none at 45), and under it the lamp row: that row's title with the Next tag (no ring: it is not a plan step), its reason and its action, from the day-done cascade (most due, the Path's next requirement, the piece): there is never a Today without a lamp. The piece row, after a clean run that left a pace step, reads that step ("Try 75% tempo") and its Continue opens the piece there (decision 6). A Read-through row (4 min, "Read through, no stopping") takes the `sight` slot in the 20, 30 and 45 minute plans.
- **Progress page:** head, then `h2.sec` blocks (a count, where there is one, sits beside the heading in 15px Ink Faint, as a Path level's does, not in a sentence under it): This week (Today's week card, `.tcard.span`, with the goal select 30 to 180 min under it), Over time (Over time cards), Notes you know (strip), Reading ("n of m stages solid" beside it, mastery cells grouped by the six reading groups), Technique ("n of m exercises solid, k due" beside it, cells grouped by path group), Path (five levels, see Path requirement), Touch (sparkline of average velocity over 30 runs with dashed soft/hard guides, then a Songs-grammar table of the last 8). Empty states carry one sentence: before the first drill the Reading and Technique sections are one line each ("Cells fill as you practise each stage."), not a wall of blank cells. A mastery cell has a 1px Edge ring, so an empty one is still a button.

### Play screen and focus states

Layout is under Layout. States:
- **Ready:** full bar, Perform | Learn, the pane divider, dock; Scrim ready card with title and one sentence; legend once.
- **Paused:** the dock's Play and a quiet "Paused" (Newsreader 56px, Ink Soft, over a soft Shade, 36% from the top like the count-in, pointer-transparent, no animation) on the stage; gone on Play.
- **The way back:** a ghost button after the mark on the bar, a chevron and where it goes ("Songs", "Today", "Technique", "Scales"; a drill's is "All stages", Sight run's "Finish"), named for a screen reader "Back to Songs". Under 400px wide only the chevron shows. The mark stays a second route; leaving with Escape puts focus on the page's title.
- **Running:** count-in numeral, then play. Two and a half seconds into a run (not ready, paused or done) the top bar children go to opacity 0 and stop taking pointer events over 0.35s (hushed). The bar and the dock are also `inert` while hushed, so a screen reader finds no invisible, dead controls; any pointer move, press or key restores them (and focus that was in them). The 56px band stays.
- **Hushed:** HUD, title, chip and settings fade together; staff, highway and dock keep their place.
- **Zen:** the dock focus button (any pointer) or M toggles; the bar and the dock aids row are removed, the grid becomes one row, the highway re-lays out. The first dock row stays, so the focus button restores it.
- **Look-through:** the read-through start card counts 30 seconds down, then the count-in starts by itself; Start now, Play or Space starts early. The pass is Perform with the music carrying on past late notes.
- **Results:** the song's Results card sits over the falling notes only (a labelled region, not a dialog), so the staff above it is the review; dock Play and Restart, the bar's back button and the Memorise strip hidden. Drill, Sight run, read-through and Memorise cards fix the overlay below the bar, over the staff too.

- **Quiet:** in Learn and Technique, after 8 clean notes in a row the judgement words stop; a slip speaks again and resets the run. Perform always speaks.
- **Test run:** every fourth run of a Technique or Scales exercise hides the touch marks; "A test run: no touch marks this time" flashes on the start card and results say so.

HUD by mode: Perform shows Accuracy (a percentage, a dash until a note is judged) and In a row; Read shows Cards, and a Sight run adds In a row; Learn shows none. Numerals 30px, captions 15px stacked above (read mid-run from the stand).

### Motion

- Ease `cubic-bezier(0.16, 1, 0.3, 1)`; buttons, switch thumb, ghost shift 0.14-0.22s; drawer slide 0.22s; bar fade 0.35s. Dialogs and the Aids popover appear without animation.
- Staff: ignite 0.8s ease-out, miss fade 1.2s after 0.8s, grade word 1s, ghost snap 0.52s, ghost shake 0.5s, thud 0.35s.
- Motion reports state or a state change, never decorates. Effects Off or Calm: Calm gives lane pulses, glows and sparks; Off gives none. A saved Arcade setting reads as Calm.
- Reduced motion: CSS durations 0.01ms, except the staff's judgement: a hit's grade colour (a change of fill) runs as normal and a grade word stays for its second without the drift, then goes (`gradeword-still`), so a Perfect still answers the key. The canvas glow does not swell and the waiting ring and ghost key do not pulse. The query is live (`reduced.matches`), not read once at boot.

### Copy rules

- Label, value, nothing else. A control that names itself gets no sentence.
- Sentence case everywhere, in both voices; nothing is uppercased by CSS, with one exception: the header of a Cover (composer left, key and metre right) is set in capitals with 0.12em tracking, a title-page convention from the approved identity (`design/identity/SPEC.md`). The text itself stays sentence case ("Your file · MIDI") and CSS does the capitals; it applies to covers only.
- No parentheticals, no "please", "simply", "note that", no hedging.
- One fact once. A number or state is not repeated in a header, a caption and a note.
- Empty states carry one action in one sentence ("Add a MIDI or MusicXML file, or drop one anywhere on this page.").
- Status sentences state the fact: "7 of 12 seen", "3 of 10 min", "about 3 min", "Last week: 45 min on 4 days". No loss framing; the day streak is a fact, not a threat.
- Tags are one word ("Next", "Due"). Dialog and group titles are one or two words ("Options", "Open library"). Disclosures read "n more".
- Hints state the action, not an apology: "Too dense: tap to thin".
- Praise goes quiet when playing is clean; only slips are spoken.
- Touch-aware verbs: "Tap Play" on coarse pointers, "Press Space" otherwise.
- Words. One word for one thing, so copy does not drift:
  - **piece** for music (the Songs tab is a place); **run** for one play-through, **set** for fixed reading practice, **session** for a Theory trainer and the Over time charts; **bar**; **keyboard** is the piano, **computer keys** is the QWERTY. A reading result names the outcome ("right first try", "on the beat") without calling its mixed note, chord and fragment units cards.
  - **Perform**, **Learn**, **Memorise**; **Read through** as a verb or button, **Read-through** as a noun or heading; **Sight run**.
  - **Mark** for what a run leaves on the staff (a wrong key, a missed note, a note early or late); **Mark list**; **Review on the score**; **notes right**; **counts** and **not counted yet** on a results line.
  - **Practise** is the verb (British), "practice" the noun. **Again** restarts; **Back to <place>** returns; **Loop** loops; **Review** is a due card or piece.
  - **Timing** (Auto, Easy, Standard, Strict) and **Touch feedback** (Auto, Off, Gentle, Standard, Strict) are the two Settings, and **Auto** follows **your level**, the Path's; **Auto tempo**; **staff** is the notation.
  - **in a row** for consecutive right answers (**streak** is the day streak only); **first try**; **typical** (never median); **N bpm** whenever a tempo is shown; **loudness**, never velocity; bands **soft, medium, hard** for touch, **loud** in dynamics names and live pop-ups; **on the beat**, **early**, **late**, **spread** for timing (never bias).
  - **Syllabus** heads Technique's exercise list; **Path** is Progress's five levels; **Studies** heads Technique's packs and **Exercises** its builder. **Notes shown** is never a "level".
  - **pack** for a list you can share (never course or playlist); **Bring a pack**; **All n** opens one; **Finger numbers** is the switch.

### Named Rules (pages)

**The One Measure Rule.** Every non-play page shares the same padding, the 1100px column, and the same page head. No page invents its own left edge.

**The Plan Rows Share Songs Grammar Rule.** A plan row, a song row, a stage row and a path row are one row: optional lead, name over sub-line, optional meter, one action at the right, one primary per view. Rows take the cards' 20px inset (`.plan .prow`, the Path's `.rq`, and the Read and Scales stage tables above 760px), so a name starts at the same x on every page. A row's action is ghost unless it is the view's one primary.

**The Touch Floor Rule.** Targets are 40px with a fine pointer and 44px with a coarse one; sizes come from `--control`, not literals.

**The Dialog Sheet Rule.** Every modal is `dialog.sheet`: header with close, scrolling body, and a pinned footer only when there is an action besides closing (never a second Close). One primary at most, in the footer; three footer actions at most, the rest in the header's ⋯ More. No modal invents its own frame.

**The Tag Rule.** A tag is one outlined Ink Soft Label word. Only Next drops the outline (Ink, not lamp), and only on the row with the primary; a page whose head carries Start has none. Tags never use a hand or judgement hue.

**The One Marker Rule.** Every disclosure uses the same +/− marker in Ink Faint.

**The Quiet Bar Rule.** Chrome fades during a run and returns on any input; it never carries information the player needs mid-run.

## Code structure

`src/main.ts` is boot and navigation (about 100 lines): it imports the feature stylesheets in their cascade order and the modules in `src/app/`, and registers `showSection`. Each page and the play screen live in `src/app/`; the pure logic, layout and painters stay in `src/`. Shared state is `app/state.ts` (the open piece, drill, run, read-through and memorise state, the highway, staff and dock, their setters, `hooks` and small helpers); a module imports only from lower ones and the pure modules, and a call to a higher module goes through `state.hooks`. In rough order, low to high: `state`; `osk-ui` (the on-screen keys) and `take-ui` (the recorder: takes, Listen back, Compare, Ghost); `banner` (banner, keyboard chip, MIDI connect, which also re-syncs the on-screen keys); `stage` (views, divider, zoom, frame loop, practice time); `library` (Songs, tracks dialog, import); `play` (open, leave, start card, game events); then the features on the stage and pages: `readthrough-ui`, `memorise-ui`, `calibration`, `drill` (drills and Sight run), `read`, `scales-ui`, `technique-ui`, `theory-ui` (the trainers, ear, rhythm and pulse cards), `results` (the end of a piece; imported by main for its side effect), `today` (Today, Progress, the Path and ladder, the Start here card; it gathers `snapshot()` and provides `hooks.next`, Continue's what-next and its start, from the pure, lazy `src/next.ts`; the rows and page it draws are the lazy `src/today-view.ts`); and last `drawer` (settings, Set up, Credits) and `input` (MIDI and computer-key routing, shortcuts). Details and the rules to keep are in `docs/changes/split.md`.

## Known quirks and design debt

Recorded from the build; none of these is a rule for new surfaces.
- Hushed bar keeps its 56px band; the stage does not reclaim it. Only Zen reclaims it.
- Display sizes drifted from the earlier 22/28/34/54 ramp to 22/24/28/30/34/40 (+54 on the ready title, 190 on the results figure). 30 (HUD) and 40 (h1, judge) were added ad hoc; there is no 26.
- Learn results show a 150px stroked check icon where Perform shows the accuracy percentage; the icon has no word beside it.
- Staff hit marks: Perfect and the "ok" touch hit are colour only and decay to Ink Faint after 0.8s; only Great, Good and Miss leave a shape. The "ok" hit still reuses the hand hues on the staff, against the Semantic Hue Rule.
- Hold outlines on staff heads differ by hue only (orange held too long, red released early), against the Word And Shape Rule; the words exist only as the Perform "held n%" figure.
- The inline file-error message is Miss Red text on chrome.
- The Sight run record tag uses the Next style away from its button (the rhythm echo's struck cells are Ink now).
- The Theory and Scales ledes and the Sight run card carry sentences, against the copy rule.
- Progress mastery cells are 30px wide with a fine pointer (44px on touch), under the 40px floor.
- Memorise's larger stage digits (22px) differ from other segments, on purpose.
- The metronome's beat dots are unlabelled.
- The HUD shows a dash and "In a row 0" before a note is played; the two "In a row" counters (notes in Perform, cards in Read) are accuracy runs, kept on purpose.
- The Compare strip colours a column Great mint or Miss red for better or worse; the line beside it says the same in words, but the colour is spent on a bar, against the Semantic Hue Rule (the sentence now carries a ring or a cross, so it is no longer hue alone). The Start here card ringed in Lamp is a now-marker that is not a button.
- A wrong key held down pulses its lane ivory and bright, louder than the hand-coloured pulse beside it.
- The Help and Start here copy are sentences, against the copy rule, as the one-line Theory and Scales ledes are.
- The Listen bar is a floating pill with a drop shadow, a fourth floating surface beside the banner, drawer and Aids popover.
- Literals remaining, not tokens: 12px/13px/14px/15px sizes in results and drill inline styles, touch-range chips and histograms, the 88px results figure.
- At 1180x820 the song card with slips opens with its Review on the score row half under the sticky footer, which is two lines since Continue's line (the card scrolls; the footer is never scrolled away).
- Continue is the button's word for every next step, the loop included, so the loop's own verb is in the line under it, not on the lamp (decision 7); judge from the stand whether that line reads.
- In Matinée the disabled Perform | Learn segment under a results card reads pale (45% of Accent on Panel Hover).
- On a phone (390px) the Read and Scales stage tables keep their Mastery and action columns, so a stage's name and blurb get about 110px and wrap a word a line (found in the practice path phase 3 renders; it predates them). Stacking the meter under the name below 480px would fix it.
- On Read's Sight run tab the head's Start and the builder's plain Start start the same run until the form is changed; the head's line repeats "Sight run" beside the tab of that name.
- No hard offset shadow exists on the primary button in `src/style.css` (grep of `box-shadow` and `text-shadow` finds only soft shadows, glows and inset rings); the Soft Shade Rule holds as built.
