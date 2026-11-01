---
name: Piano Forte
description: Urtext. A piano practice room at night around a lit page of music: dark ink on warm paper, one brass lamp for play this now.
colors:
  ground: "#0c0e12"
  panel: "#13161c"
  panel-2: "#1b1f27"
  panel-3: "#222731"
  line: "#262a33"
  line-2: "#363d4e"
  edge: "#666d7d"
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
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-line}"
    rounded: "{rounded.xs}"
    width: "140px"
    height: "52px"
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

**Creative North Star: "The DDR Cabinet at Night"**

A dark, cool-blue room with lit lane panels, a bright receptor line over the keys, and judgement words in Newsreader. The cabinet lives on the stage (highway, receptor, lane pulses, sparks); there are no points, ranks, lives or fireworks, and the shell never scores you. The notation does not live there either: the grand staff is the scoreboard, set in near-white Bravura on a flat panel, and it ignites only to report state (awaited note, hit grade, miss). The shell around the stage is plain web controls (segmented switch, sliders, buttons, rows) and stays quiet. Reading drills reuse the same room with the stage turned down: the staff takes the screen and the highway shrinks to a strip.

The iPad in landscape is the main screen, a desktop browser the second. The player sits 1-2 m away with busy hands, so state is carried by word, shape, and hue together, never hue alone, and every target is thumb-sized on a coarse pointer. Density is moderate and fixed: a 56px top bar, one view, a docked transport. One control height (40px, 44px on touch) and four radii run through the whole shell. Seven tabs live in the top bar until a piece opens: Today, Songs, Read, Scales, Theory, Technique, Progress. Today is a generated plan, not a menu. Progress is the reward: accuracy over time, mastery, a quiet day streak.

**Key Characteristics:**
- Cool navy ground with one warm voice, the lamp amber, that means only "play this / now". Everything else in the shell is neutral Ink.
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
| Edge | #666d7d | #7d776b | control borders (3:1 on Ground, Panel, Raised and Hover) |
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
- **Brass Lamp** (#ffc83d): the verb and the "now" markers only. Primary buttons (at most one per view: the Continue / Start row on Songs, the Next row's Practice on Read and Scales, the first undone plan row on Today, Start in the Technique head, Sight Run, Choose a scale and the quiz's Next, Again or Finish, the Start of the Path's overall next requirement, the dock Play and the big action on results, Use these in Options, Done in Set up), the lamp Next tag on the same row as its primary, the staff cursor, scrubber playhead, awaited notehead (in a drill, every head of the next card), receptor lamps over lit keys, awaited-note outline on the highway, the "Play this" legend swatch, the count-in numeral, the lit cells of a rhythm echo, the focus ring and text selection. Hover is **Lamp Bright** (#ffd466). The PF mark in the bar, selected segments, switches, slider thumbs and the HUD numerals are Ink, not lamp.
- **Lamp Ink** (#14110a): text on any lamp fill (more than 10:1).
- **Accent Slate** (#78a9ff, `--accent`): the interface's own tint (selection, links, the on-screen keys under a finger). Never on the staff or in the lanes.

### Secondary (hands)
- **Right-Hand Terracotta** (#f27d52, `--R`): right-hand notes, solid filled bars with a pale top light. Warm.
- **Left-Hand Verdigris** (#2ab7b0, `--L`) with **Left-Hand Edge** (#6fd6d0, `--L-edge`): left-hand notes are a 60% verdigris fill (`--L-fill`) with a 2px lighter outline, so the hands differ by fill style and lightness as well as hue (legend and dock swatches use the same recipe). Cool. A note's key name is Ground on the terracotta body and Ink on the verdigris one (checked in `src/palette.test.ts`). Neither hue is near mint, crimson or the lamp.

### Tertiary (judgement spectrum)
- **Perfect Mint** (#3dd68c) ●, **Great Pale Mint** (#a7e8c4) ○, **Good Neutral** (#c9ccd6) ▲, **Late** (Good at 60%, `--late`) ▸, **Miss Crimson** (#ff3d6e, `--bad` in CSS) ×. Late is the right key up to a beat after the window, the worst hit. On paper (the staff) the same grades are #13794b, #3e8f69, #6e6a61, the played ink and #c8164b (`--paper-*`); crimson also takes that darker value for the wrong-key cross on an ivory key (`C.missOnKey`), which the bright crimson cannot hold 3:1 against.
- **The glyphs** are drawn by `jg()` in `src/icons.ts` (CSS shapes, `.jg` in `style.css`, coloured by their grade), not typed characters, so every font and size draws the same shape. Perfect is a filled circle, Great a ring (its own glyph, because pale mint beside mint is a lightness step, not a safe cue), Good a triangle, Late a right-pointing chevron, Miss a cross. Each sits beside its word in the judge popup and the results counts; the Read drill and Sight Run strip puts a cross over every note you missed, the scrubber heat puts a cross over bars you missed in, and the Compare line names the bars with a ring (more right) or a cross (fewer right). Mint additionally marks MIDI connected (chip dot), a state, not a grade (open: see Known quirks).

### Interface tint
- **Accent** (#78a9ff; Matinée #0058d0): the focus ring, the selected state (text on a raised fill), links, text selection. 6.4:1 on Panel Hover, 7.7:1 on Panel. See the Accent Rule.

### Neutral
- **Ground** (#0c0e12): page, stage clear colour, wells (segmented, scrubber, inputs, kbd).
- **Panel** (#13161c): top bar, staff strip, dock, cards, results card.
- **Panel Raised** (#1b1f27): buttons, chips, band chips, mastery-cell track, and every floating surface (drawer, dialog sheets, popovers, banner).
- **Panel Hover** (#222731): hover, a selected segment, a button resting on a floating surface.
- **Line** (#262a33): hairlines, row dividers, meter track, scrubber border.
- **Line Strong** (#363d4e): a floating surface's border, the selected ring, switch track, table-head rule.
- **Edge** (#666d7d): every control border (3:1 on its surface), slider track. Line stays hairline-only.
- **Specular** (white at 7%; at 28% on the lamp fill): the 1px inset top edge of a raised surface.
- **Scrim** (rgba 12,14,18 at .82): ready card, results overlay, chord readout. **Shade** (rgba 0,0,0 at .6): the soft shadow under stage words. Named tokens for the other translucent values, all in `:root`: `--scrim-hi` (the start card), `--backdrop` (behind a dialog), `--drop` (shadow under a raised surface), `--wash` (row hover), `--loop` (the A-B span), `--great-ring`, `--L-fill`, `--lamp-line`, `--night` (the highway's ground, behind the canvas, the same in both modes).
- **Ink** (#f4f2ed), **Ink Soft** (#a6abb8), **Ink Faint** (#8a90a0): primary, secondary, and caption/label text. Ink Faint is the floor for text on Panel.
- Stage-only (palette.ts mirrors the CSS custom properties; the highway is Nocturne in both modes): lane tints #161a22 / #0e1015 alternate per white key, octave and bar grid #3a4152, receptor #fff3d6, key white #eae6df, key black #1b1d22, muted key names and unlit receptor lamps #5e6472.

### Named Rules
**The Neutral Progress Rule.** Mastery and effort are measured in Ink, not in a judgement hue: meter and mastery-cell fill is Ink Soft, and Ink once solid; a practised day is an Ink dot. State is also stated in words ("Solid", "7 of 12 seen") and as a percentage.

**The Calm Staff Rule.** The score is Paper Ink on Paper (`--paper-ink` on `--paper`, staff lines `--paper-line`), in both modes. Colour appears on a staff glyph only as state, and every state also has a shape or a word: Paper Cursor for the cursor and Paper Awaited for the notehead being waited for; a grade colour for the 0.8s flash of a hit (`--paper-perfect`, `--paper-great`, `--paper-good`), then the chord settles to Paper Played (a colour change, not a fade, so its grade mark stays at full strength). The grade lives on in a shape under the head, readable with no hue: perfect none (a clean note just goes quiet), great a filled dot, good a filled triangle, late an outlined right-pointing triangle, miss a crimson `--paper-miss` cross (the head flashes crimson, then settles to played). A hold outline is the one state that stays on the head: released early a solid crimson outline, held too long a dashed neutral one. Aids that are not score (ghost notes, the Technique aim-for dynamics, 8va brackets, the Dense hint, bar numbers, chord symbols, fingering numbers, the dots of a Ghost of last run) are Paper Ink at 72% or 60% (`--paper-ink-2`, `--paper-ink-3`, mixed on `#staff`); the notes the app plays in accompaniment are the same heads at 40%. The score's own marks (articulation, slurs, hairpins, dynamic letters) are Paper Ink at 70%. No glow on paper: light on a page would be a lie.

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
- **HUD numeral** (system 650, 30px, 1, tabular): accuracy, notes in a row, run streak, cards, in Ink, with a 12px Label caption stacked above (15px in Read). The Over time figure on Progress, the tempo value and the Memorise stage digits are the same numeral at 24, 28 and 22px.
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
3. **Icons, Apple's way.** One family, Lucide (`src/icons.ts`, path data copied in; ISC, credited): 24px grid, 2px round stroke; play and pause filled. Tabs carry an icon and their word. Universal verbs may be icon-only with an accessible name (restart, loop, close, back, more, settings, zoom). App verbs keep their word, with the icon where one fits (Start, Practice, Learn take the play icon on every row, not only the lamp one). A menu's items have icons on all or none; a segmented control never mixes words and icons.
4. **One icon family.** No icon drawn by hand next to Lucide's.
5. **Three actions at most** on show on any summary or end surface, sheet or settings row (a primary, Again, a More menu, and the way back apart); the rest go in a ⋯ More menu (`rowMenu` in `src/ui.ts`).
6. **The right container.** Choices go in a pop-up anchored to their button (Tempo, Practice, a row's More), tasks in a sheet, playing full screen with the controls fading.
7. **Touch.** 44pt targets, nothing hover-only (hover styles sit in `@media (hover: hover)`, so a tap never leaves one stuck), reduced motion honoured, no imitation glass (`backdrop-filter` is banned: it costs frames over the WebGL highway), chrome never glows. Pressed is a 0.97 scale.
SF Symbols are not used: Apple's licence ties them to apps for Apple platforms and the same code is the public website.

## Layout

A single-column app grid: 56px top bar (safe-area insets padded for the iPad), then one view, then an auto row that is empty except while the on-screen keys show (see On-screen keys; Zen drops it). Top bar, left to right: the PF mark (40x30, Ink), the seven-tab section switch (hidden on the play screen), the song title (play), "All stages" (drills) or the Perform | Learn switch (hidden on the start card, which carries the choice, and for a read-through) (songs), a spacer, the HUD, the MIDI chip, the settings icon button. The seven tabs fit a window 820px wide; a narrower one (a 590px split view) scrolls the tab row sideways and keeps the selected tab in view, so Settings never leaves the bar.

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
- **In the bar**: the symbol in `currentColor` (Ink on Nocturne, Matinée Ink on Matinée), 36x18 cropped to its bounds, in a 44px-tall button back to Today. From 1180px wide, off the play screen, the wordmark "Piano Forte" follows it: Newsreader optical size 60, 540, -0.012em, 21px, a gap of 0.36 of the mark's width. Narrower, or on the play screen (the song's title takes the bar), the symbol alone.
- **App icon**: ink #161513 on paper #fbf8f1, full bleed, no baked corners (`ios/App/App/Assets.xcassets/AppIcon.appiconset`): default, a dark appearance (#efece4 on #13161c) and a tinted one (white on black, which iOS recolours). The clear appearance of iOS 26 needs an Icon Composer `.icon` file, not built yet (ROADMAP).
- **Web**: `public/favicon.svg` (the default icon), `apple-touch-icon.png` (180), `icon-512.png` (maskable, unused until there is a manifest).
- Amber and slate blue are never part of the identity: amber stays "play this, now", blue stays selection.

### Staff zoom

Two fingers on the staff zoom it, a double-tap resets it, ⌘-wheel or a trackpad pinch on a computer, the - and = keys, and ⌘= and ⌘- in the app's menu bar. The single-pointer alternative WCAG 2.5.1 asks for is Staff minus, Fit and plus in the dock's Practice menu (Fit pressed again goes back to the normal size). Nothing floats over the staff.

### Segmented control
- Ground well, Edge border, 10px, 3px padding, 2px gap; cells 32px at 6px radius (38 coarse), Ink Soft text 650. Radio inputs are visually hidden over the cell.
- Selected: the one selected treatment above (Panel Hover fill, Accent text, Line Strong ring). Hover on unselected: Ink text, Panel Raised fill.
- **Section tabs** (`#nav`) are the same control as a solid capsule: pill well, pill cells, an icon and the word. Not a floating blurred pill: the top bar stays a full-width Panel band (title, HUD, keyboard chip and Settings share it at 590px, and the capsule scrolls sideways there, keeping the selected tab in view).
- Used for: section tabs, Perform | Learn (bar and start card), view, hand modes and the Metronome (Practice menu), plan length (5 / 10 / 20 / 30 / 45 min), Read (Stages | Sight Run), Scales (Stages | Choose a scale | Quiz), the Songs Level filter (All levels, 1 to n), Notes shown (Full, Thin chords, Melody and bass, Melody, Lead sheet) and every drawer choice row.

### Switch
- 46x26 pill, 20px thumb; label 600 beside it, min-height 40px. Off: Line Strong track, inset Edge ring, Ink Faint thumb. On: Ink Soft track, thumb Ground, 20px travel. Never amber.

### Buttons
- 10px radius, 40px high (44 coarse), 1px Edge border, 650 weight, a specular top hairline, no offset shadow; pressed scales to 0.97.
- **Default (secondary):** Panel Raised fill; hover Panel Hover fill and Ink Faint border; pressed Panel. On a floating surface (drawer, sheet, popover) it rests on Panel Hover and hovers a step lighter.
- **Primary:** Lamp fill and border, Lamp Ink text, 800, a `--specular-lamp` hairline; hover Lamp Bright; pressed Lamp. One per view. A leading 20px solid play icon marks "start/continue".
- **Big:** primary at 52px, Newsreader 600 28px, min 124px; results and the dock Play.
- **Ghost:** transparent, no hairline, Ink Soft; hover Ink on Panel Raised (no border); pressed Panel Hover. Row actions (Learn on song rows, Practice on non-next stage rows), the More button and its menu items, icon buttons (close, focus).
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
- A piece's own opening bars engraved on paper (decision 9 in `docs/research/urtext.md`; the AI illustrations went on 31 Oct). A box of `--paper` with a header strip and the incipit under it: the header's left is the composer's surname and the catalogue number when the catalogue has them ("Bach · BWV 846"); 600 system sans in small capitals with 0.07em tracking, `--paper-line`, an ellipsis when long. The key and metre are not written out: the engraved signatures just below say them. The title is never on the paper: it sits in the row or the card, in the display voice. Radius `--r-1`, no border, no shadow: a lit page on the dark ground.
- **Sizes** are `COVER` in `src/cover.ts` and nowhere else: lead 60x40 (Today's piece row; no header, notes only), row 140x52 (Songs rows; 12px header at 7.5px; the box crops to 78px at 1000px wide and under, the scale does not change), card 272x116 (the start card; 22px header at 10.5px). Ink is `--paper-ink`, staff and barlines `--paper-line`, drawn as 0.8px and 1px hairlines that do not thin with the scale (`vector-effect`); the rules are in `src/cover.css`.
- **The engraving** is the play screen's own: `src/cover-draw.ts` hands the first three bars to the same `analyze`, `windowFor`, `layout` and `Staff` painter on an off-screen page and keeps the SVG, so the cover and the staff cannot drift apart. Nothing is laid out or drawn twice in different code. Bar numbers, the cursor, slurs, hairpins, dynamics, fingerings and chord names are dropped: an opening's silhouette, not a score.
- **Scale and crop.** One scale per size (px per layout unit: 0.5 on the small boxes, 0.62 on the card), never fitted per piece, so every cover in a list has the same staff size (5px a space in a row). The layout is asked for a page as wide as the box, so it shows one bar or two, whichever read comfortably, and a box too narrow for a bar (the lead) is given a wider page and shows its left edge. A grand staff shows whole only when it fits with 14 units above and below (the card); a smaller box shows the one staff the notes of the opening are mostly on (treble on a tie), and only that staff's notes and rests, so the other hand never leaves stray marks at the edge. The window then slides toward the notes, up to the staff's own edge, so a ledger-line opening is seen; whatever still does not fit is cropped, never shrunk. A one-hand piece is a single staff, as on the play screen.
- **Not on the device.** A library piece that has not been downloaded is never fetched for its cover. It shows the paper with its header (composer and opus from the catalogue) and an empty staff with the clef, key signature and time signature the catalogue gives, no notes and no rests: blank manuscript paper in the piece's key. When the file is downloaded (or was bundled) the notes are written in on the same paper. A piece the catalogue knows nothing of (the bundled list before its first read) shows the header and bare paper until its score is read.
- **Your files.** The header's left says "MIDI" or "MusicXML" (on the start card, "Your file"): a file has no composer, and a made-up one would be worse than none. A file that will not parse keeps its bare paper.
- **Drawing.** Lazily and one at a time: a cover is drawn when its row scrolls within 200px of the screen (an IntersectionObserver), or when its score is read; the SVG is kept by score and size for the session, so a redrawn row or card shows it at once, and every empty staff of the same signature is drawn once. The covers' code (`cover.ts`, `cover-draw.ts` and the staff painter) loads after boot, never in it. Not persisted across launches.
- The start card's cover shows over the title when the stage is taller than 420px, and, with the keyboard banner over it, only when taller than 560px: a landscape iPad with no keyboard has no room (Roadmap).

### Plan row
- Flex, gap 8px 20px, padding 12px (12px 20px on Today, below), Line rule above (and below the last). Today rows start with a 20px lead column (`.plead`): a 20px ring in Line Strong when to do, a 20px check in Ink Soft when done; rows take the card's 20px inset (padding-inline 20px, column gap 16px), so ring and name line up with Start here (ring at 20, name at 56); title 18px 650 over a 15px Ink Faint sub-line ending "about N min"; optional 260px mastery row; action at the right. The piece row carries its Cover (lead, 60x40, `--r-1`) between the ring and the name, so its name starts 76px later than its neighbours'. Only the first undone row's action is primary; every other row's is ghost, as on Read and Songs, and every Start, Practice, Play and Loop carries its icon. Done rows sink to the bottom, title Ink Soft, no time, ghost action. Technique Path rows are the same row without the lead column. Nothing locks; every row stands alone.

### Card
- Panel fill, Edge border, 12px radius, padding 18px 20px, gap 12 (`.tcard`). Variants: week strip (`.span`: days and goal meter side by side, 32px column gap, 24px below, the day-streak line under them), the Progress week, the strip (flex, space-between, 16px gap: touch range) and the last-week recap (flex, space-between, Ink Soft sentence with Ink figures, optional ghost "Aim for N min"). Results card: 28px 32px, 880px max.

### Touch-range card
- Strip card: a Label "Touch range" over three value chips (Soft 1-n, Medium n-m, Hard m+), 4px apart, max 600px, each flex-proportional to its velocity range. Chip is outlined (1px Edge, transparent, 4px radius), 650 14px Ink Soft, nowrap; `role="img"` states the ranges. Beside it a ghost "Use defaults" once set and "Set touch range". While calibrating the chips are replaced by "Play 10 soft notes: k of 10" and Cancel; a status line (`p.note`) may follow the card.

### Tag
- A Label-style word (13px 600, sentence case) outlined 1px Edge, 4px radius, padding 3px 6px 2px, Ink Soft, 10px left of the name. "Due" on a Technique path row, "n due" on a Read row, "Ready" on a starter piece or your file once it has been played on two days. `.tag.next` ("Next") drops the outline and the padding and takes Lamp; it sits only on the row that holds the primary.

### Disclosure
- One marker for every `<details>`: a 1.2em slot holding "+" (closed) or "−" (open) in Ink Faint, native triangle removed. Summary is Ink Faint (Progress Path levels: 18px 650 Ink with a 15px Ink Faint count beside it), 44px row on coarse pointers. Used by drawer Advanced, the Progress Path levels (the first with work left is open) and the Technique Path "n more".

### Dialog sheet
- `dialog.sheet`: Panel Raised, Line Strong border, 14px, a specular hairline and a soft `0 24px 64px` shadow, `min(680px, 94vw)` wide, max 86vh, flex column over a dark backdrop. Header (20px 22px 8px 26px): a 22px 600 system-font h2, optional Ink Soft line under it, an optional ghost ⋯ More and the ghost icon close at the right. Body scrolls (4px 26px 12px); `h3` is a 13px 600 label in Ink Faint; `.fine` is Ink Soft; rows inside line up with the title (no card inset). Footer is pinned, and only when the sheet has an action besides closing (the header's close is the one way out): Line rule above, actions right-aligned, 8px gap, `.grow` spacer to split left and right actions, nowrap buttons. Used by Options (facts list; Tracks with "n of m in use" and a ghost Pick for me on one line, then track switches with a hand select each; More holds Share file and Remove file; footer Cancel and primary Use these, only for a file with several tracks), Credits (no footer), Set up (footer Done) and Help (no footer). The settings drawer is a side panel, not a sheet: Panel Raised, a Line Strong left edge with a specular hairline, `-18px 0 40px` shadow.

### Set up sheet
- A `dialog.sheet` that opens once on a first launch with no saved settings, and again from Settings > Set up. Title Set up, line "Four checks. Skip any of them." The body is plan rows, not a wizard: Keyboard (MIDI status in words, updated live, a Connect button until one is found), Touch range (hands over to the touch calibration), Delay (hands over to Calibrate) and Key touch (the same select as the drawer, with its hint). Footer: the free line at the left in 13px, primary Done at the right. Escape, the close button or Done skips it; nothing blocks.

### Credits
- Links open outside (`target=_blank`, `noopener`): a licence's name is the link to its text ("Licence: CC BY 3.0"), and a bare URL (a score's source) shows its site's name, so no raw URL is printed.
- A `dialog.sheet`, no footer. It opens with the line "Free, no subscription, no ads, no account." (Ink Soft, 13px), then Sounds (one `pre` block each: grand piano, electric piano, harp, organ and strings, music box, with their licences), then Scores: a fine line that scores are public domain or openly licensed and keep their own licence, links to the licence lists for the pieces in the app and for the whole library, and one block per piece you have played or saved, with the changes made to it (voice folded or dropped). With none: "Pieces you play or save for offline appear here." The same free line closes the Set up sheet.

### Start here card
- `.tcard.guide` on Today, between the head and the last-week recap, for the first seven days of use (`src/guide.ts`; day 8 is the last it can show, after that or once every step is done or skipped it is gone). Header: 22px "Start here", an Ink Soft line "Day n of 7, in any order.", and a ghost Hide at the right. Below it an ordered list in the plan-row grammar (a Line rule between steps): the lead is a 20px ring with the step number (Line Strong; the day's own step ring is Lamp, with an Ink numeral) or a check in Ink Soft once done. The day's step shows its title at 18px with a sub-line and a button Start (a plain button: Today's one lamp stays on the plan) and a quiet Skip; earlier undone steps show a ghost Start and Skip; later steps are Ink Faint titles with no action; a skipped step reads "Skipped". Seven steps: Read Treble landmarks, C major right hand, chord triads on white keys, a read-through, five-finger Technique, Memorise a short piece, Review and look at Progress. Under 760px the actions wrap under the title.

### Empty states
- Two drawings, `src/empty.ts` and `src/empty.css`, from `design/identity/SPEC.md` and the geometry of `boards.html`: **No keyboard connected** (two 44x56-unit key rectangles, 7-unit square-capped stroke, a dashed link and a centred 7-unit dot) and **No music here yet** (five 3-unit staff lines between two 6-unit end bars, a centred notehead placeholder at 18% ink). Inline SVG in `currentColor`, one ink (`--paper-ink`), on a 120px square of cover paper (`var(--cover-paper, #fbf8f1)`: the same lit page as a Cover, radius `--r-1`). `aria-hidden="true"`: the sentence beside it carries the meaning, and the sentence and its action are the state's own, not new copy. No motion at all (the spec allows one 180ms opacity change; nothing here needs it).
- **Where.** Songs, "Your files" while empty: the drawing at the left, the sentence beside it in Ink Soft (the page's Add files button stays in the head). Set up sheet, the Keyboard row while Connect shows: the drawing leads the row (Keyboard, "Not connected. Plug it in over USB, then Connect.", Connect), and goes the moment a keyboard appears (`:has(#suConnect[hidden])`). **Not used** in the Connect line (a 50px row for a one-line status; the drawing would triple it, and the on-screen keys are the answer there), in the play screen's "No keyboard yet" banner (it floats over the highway; Directive: effects never obscure notation), or in Songs' "No piece matches" (a filtered result, not an empty library: the drawing would say there is no music).

### Connect line
- `.kbline` heads Theory, the Scales Quiz and the Sight Run builder while no MIDI keyboard is connected: a Panel row with a Line Strong border, "No keyboard connected." in Ink and "Play the on-screen keys, or the computer keys A to ;." in Ink Soft, then the On-screen keys switch (below) and a Connect keyboard button, which wrap together to the right under the words in a narrow window. It hides, switch and all, when an input appears (the drawer's Advanced keeps the switch) and returns when it goes, and on Theory and the Quiz it shows on the trainer list only, not over a card.

### Help sheet
- `dialog.sheet` named Help (the old Shortcuts sheet), opened by `?` or Settings > Help, on touch devices too. Header with close and a scrolling body, no footer. A `dl` (Ink name, Ink Soft text, a two-column grid that stacks under 760px) says what each tab is for; Label `h3` groups follow in Ink Faint with `.fine` paragraphs: how the touch coach works and what it cannot see, how a scale counts as solid (three clean runs in a row), how review spacing works (1, 2, 4, 8, 16 days; the days are a choice, not a proven best), the keyboard shortcuts as a `kbd` grid, No keyboard (the computer-key piano) and Hearing every note twice? (Local Control).

### On-screen keys
- `#osk` (`src/osk.ts`, `src/app/osk-ui.ts`, `src/osk.css`), the third row of `#app`, under the page: a Panel strip with a Line Strong top rule. Top bar: octave down and up buttons (44px), the range in words ("C3 to C5"), a Names toggle (`aria-pressed`, an Ink Soft inset ring when on) and a hide button. Keys: as many whole white keys as keep each at least 44px wide (12 at 590px, 17 at 820px, 25 at 1180px), 124px to 190px tall; in a reading drill it opens on the C below the lowest note the cards ask for, and while it shows the stage's own key strip collapses and the Falling notes switch hides (with a MIDI keyboard the stage keys show as before); white keys Ink, with a letter on every C (C4 is middle C) and on every white key with Names on; black keys Ground at 62% height with an Edge inset ring. A key under a finger is Accent Slate (never a hand hue: the strip answers a question, it does not play a hand). Several fingers play a chord; dragging across keys glides.
- Shown while a Theory card or Quiz card is open, and while a reading drill or Sight Run is open on the play screen; never on menus, results or a song, whose stage has its own keys. On by default when no MIDI keyboard is connected; the "On-screen keys" switch (in the Connect line on Theory, the Quiz and the Sight Run builder, and in the drawer's Advanced) or the hide button overrides that and the choice is remembered. The keys are `aria-hidden` shapes: the computer keys are the non-touch route.

### Pulse bars
- `.pulse` on a pulse-trainer card (Theory): one bar per figure, 170px wide (300px for Hold a rhythm), 40px tall, a Line Strong border, a Line rule on every beat, and a 10px Ink Soft dot where a tap is wanted, placed along the bar by its beat. A silent bar (Keep the beat) is a dashed border with hollow dots and a 12px Ink Faint caption under it. Ink, not Lamp: the card's Next is the one lamp. The click is the prompt; the bars give the count.

### Aids popover
- `.pop` in the Learn dock: an "Aids" button (`aria-expanded`) opening `.popmenu` upward: Panel Raised, Line Strong border, 14px, 200px min, 10px 14px padding, 8px gap, specular hairline and a soft shadow; the button that opened it shows the selected treatment while it is open. Two switches: Hide played, Hold to advance (Auto tempo is the Ladder button on the tempo group). Closes on an outside click or Escape (focus returns to the button).

### Learn dock
- One row (30 Oct 2026; Apple's toolbars keep to a few groups and one prominent action): Play, Restart, the bar scrubber, the beat dots (metronome on), Loop worst bars and Clear loop (Learn, when there is something to loop), a Tempo pop-up (Learn and reading: a 13px "Tempo" and the value in Display 22px; inside, a slider between minus and plus, presets 50%, 75%, 100% and the Ladder when looping) and a Practice pop-up (Wait for me, Hide played, Hold to advance, the reading switches, the Metronome (Off | Beats | Eighths), the two hands' Play, Listen, Hide, and Staff minus, Fit, plus; each segmented row is a 13px caption at the left and its control at the right: pinch, double-tap, the keys and the menu bar do the same). The pop-ups open upwards from their button's right edge, one at a time; an outside tap or Escape closes them. The row fades with the top bar 2.5 s into a run and comes back on any touch or key (a MIDI key is not one); playing and waiting taking turns in Learn do not restart that clock. No floating zoom buttons on the staff and no Hide controls button (M still hides the top bar).
### Metronome
- A segmented Off | Beats | Eighths captioned Metronome in the dock's Practice menu, Perform and Learn only (hidden in Read drills); it shows its state, and the B key steps through the three. The beat dots in the dock row follow the bar (`aria-hidden`; they carry no label, left as built). It is plain chrome, no Lamp. The click accents a full bar's first beat; 6/8, 9/8 and 12/8 count dotted quarters.
- In a paced Sight Run the beat is shown in `.beat-bar`, a row of its own between the header and the staff (13px: four 4px segments across the full width, 6px gaps, Radius 2, Line Strong; the segment on the beat is Ink; nothing transitions). The count-in lights the four in turn. The dock shows no Metronome block in a drill. Never over the notation: it is a grid row, like the Memorise strip. Perform's own dots stay in the dock.

### Start card
- The ready card holds, top to bottom: title (54px; the card is the full `min(720px, 92%)` wide so titles and the Simplify labels do not wrap), a Cover (272x116, over the title; drawn from the opening bars, hidden on a short stage), a credit line for open-library pieces (with a quiet Report a problem link) (15px Ink Faint, with the changes made to the score when there are any), Perform | Learn with a one-line hint, the "You play" row (below), the "Notes shown" Label and four-level Simplify switch (only when Melody would drop at least 10% of notes), the "Ghost of last run" switch (below), the start hint, and the colour legend once per device. The hint hides only on a card under 260px tall. Background is near-opaque Ground (`--scrim-hi`). It centres between the banner and the keys, drops onto the keys when the room above them runs out, and scrolls when it is taller than the stage. On a split-view stage (340 px tall and 700 px wide or less) with the banner, a card with You play or Notes shown drops its title. Reading drills and calibration show only a title and the start hint.

### You play row
- `.accomp` on the start card under Perform | Learn (`src/accomp.ts`): a Label "You play" over a segmented control, one cell per choice. A piece with several source parts offers Everything plus one cell per part (a folded Lied: Everything, Voice, Piano); a two-hand piece offers Both hands, Right hand, Left hand; a one-hand or single-part piece shows no row. Choosing a part adds a hint under it, "The app plays the voice part. Only your part is judged.", capped at 46ch. On a stage 420px tall or less the caption and the choice share one line and the hint hides; while the "No keyboard yet" banner shows, the taller card drops onto the keys and its mode line hides.
- The notes the app plays are dimmed to 40% on the staff (`#staff .head.app`) and in the falling lanes (Listen's existing 40%), so they stay readable but are plainly not yours. Results add one line, "Judged on your part only: the piano part. The app played the voice part."

### Ghost switch
- `.ghostsw`, a Switch labelled "Ghost of last run" on the start card, centred at the foot of the card, before the Report a problem link. It appears once a piece has a take, is remembered per device (`piano.ghost`), and hides on a card under 260px tall. Never offered in Read drills or the special runs.
- On: each key of the last run is a dim dot behind its head on the staff (Ink Soft at 50%; an on-time key hides under its note, an early or late one shows beside it), and in the lanes a bright tick where the key went down (Ink at 70%) with a thin hairline while it was held (Ink at 40%).

### Memorise card and strip
- The start card of a Memorise session hides Perform | Learn (the stage is the choice) and shows a "Stage" segment of five digits 0 to 4 (system 650 22px tabular, min 44px wide; each radio is named, "Stage 2, every 2nd bar hidden"), the stage's name (kept on the short card) and a "Look first" facts list (key, time, bars, each hand's range, bars that repeat an earlier bar).
- While playing, `.mem-bar` is its own row above the staff, never over notation: Scrim, Line border, 8px radius, 13px Ink Soft with Ink figures: "Stage 2 · Every 2nd bar hidden" and "n right · k slips · clean j of 2", and from stage 1 a small Peek button (page icon) that shows the awaited bar for 2 seconds. At stage 4 (no staff) it is the same row at 15px.
- The pass card is the results card's single column: the stage played, slips, peeks, a strip of bars and up to three weak spots; a loop pass reports in the banner. Songs rows show a "Memorised n/4" tag.

### Look-through card
- The start card of a read-through: title, one hint line ("Look it through: the key, the time, the bars that look hard. Nothing counts yet."), a 4px meter that drains over 30 seconds beside "0:27" (15px Ink Faint, `role="timer"`), then one wrapped row: Tempo with - and + icon buttons around a 28px tabular percentage (default 70%), the switch "Only the next two bars", and a plain "Start now". A 13px Ink Faint line says why this piece was offered, and a second carries the credit. No Perform | Learn switch shows for the pass. The staff shrinks to fit the piece (not below zoom 0.6) and goes back afterwards.

### Read-through summary
- The results card in its single-column grammar: accuracy percentage as the big figure, "Read through at 70% tempo", one line (accuracy, notes caught of total, wrong notes), a strip of one cell per bar (slipped bars Miss Red and taller, the rest Line Strong 8px; height says it as well as colour) with a sentence naming the slipped bars, the weakest two bars, the next piece and why. Actions: primary Next piece, Fix these (opens Learn on those bars looped at 70%), Songs.

### Banner, Ready card, Results card
- The banner and the start card share one column over the stage (`.stagecol`, 14 px from the top, 4% each side, 10 px from the bottom): the card centres between the banner and the keys (24% of the stage); short of room it drops onto the keys, then scrolls. They never overlap.
- Start from the piano: on the start screen any key is the Play button. The first note to play starts the piece there and then (no count-in, the key judged on time); any other key starts the count-in. Calibration and a paced Sight Run always count in.
- Keyboard strip labels: the Cs always carry their octave (C3, C4, C5), as Synthesia's Octaves labels do; the other letters come with Note names.
- Lines turn, not bars: a window of several lines (reading drills and Sight Run always show two at least, six bars a line; a zoomed-out piece) keeps its lines until the top line's last note is played, then the second line eases up into its place (350 ms) and a new one comes in under it (`docs/changes/sightroll.md`).
- Staff cursor: Paper Cursor (the lamp darkened to hold 3:1 on paper), 1.5px, round-capped, at 70%, no glow, the bottom layer of the staff (under the staff lines as well as the notes). In Learn and the reading drills it stands on the awaited note, through the middle of its head. It stays at the same opacity as on the dark panel: on paper the 70% line still reads as a brown-gold rule behind the ink and does not compete with the awaited head.
- MIDI chip: the keyboard's name only; a key lights its ring for a moment, it never shows the key.
- Play: the first Escape pauses a run (count-in, playing, waiting); the next leaves. Leaving returns to the page the piece was opened from; a reading drill returns to Read. The results button names that page.
- iPad app: with no keyboard connected the banner reads "No keyboard connected. Plug it in over USB, or pair it over Bluetooth." with "Connect a Bluetooth keyboard" (Apple's pairing sheet); the same button is in Settings' Keyboard row and Set up, and the MIDI chip opens the sheet. The screen stays awake only during a run.
- Results actions, every card: one primary (`btn primary`, the standard size: the big Display-caps button is the dock's Play only), Again, a More button (three dots) whose menu holds what else the run offers (Listen back, Compare with last time, Try it from memory; no icons in it), and the way back (Songs, Today, Read) as a ghost at the right end. The stats disclosure is Details, not More.
- Results cards (song, read-through, memorise): a grid of the words (`.stats`: the Display 34px title, the lines, the bar strip with "Bar 1" and the last bar under it, the advice) on the left and the figure top right, 88px; the actions span the bottom. Over six slipped bars the sentence counts them ("Slipped in 12 of 32 bars") instead of listing them. A read-through where nothing came in from the keyboard says so, draws its bars neutral and offers no Fix these.
- Song rows: one line each. One action (the lamp Start or Continue on the one row that carries it, Learn on the rest; the whole row opens Learn too) and a More button (three dots, 44px) whose menu opens down from it: Perform, Listen, Read through, Memorise, and Options on your files. One menu open at a time; a choice, a tap elsewhere or Escape closes it, and focus goes back to the More button.
- Listen (a row's menu): the piece opens in Learn with both hands on Listen and Wait off and plays straight away through the app's piano, whatever Sound says; nothing is judged or kept. At the end the start card is back with the hands yours.
- Banner: Panel Raised, 12px, floats at stage top above the canvas (`z-index: 3`; not capped at half the stage). It carries loop verdicts, test-run notes and the "No keyboard yet" line with Connect. Ready card: Scrim, 12px, title (54px), one sentence ("Tap Play to start." on coarse, "Press Space to start." otherwise; Learn adds "The song waits for you."), legend once per device (Right hand terracotta swatch, Left hand tinted with a lighter verdigris outline, Play this lamp). Results card: the accuracy percentage at 190px (Learn shows a check), "Song complete" or "Cleared" with the tempo when slower, one stat line (accuracy, longest run in Perform, wrong notes, spread and touch in range, held %), then in Perform the counts, each with its glyph, and the timing histogram (centre line Ink), then the blocks below, then actions (the next step as the primary, Again, Songs). The overlay covers the whole play area and scrolls when the card is taller than the stage; histograms are 76px.
- Results: the Back button names the page it returns to (Songs, Scales or Technique); a song is "Song complete", a scale, exercise or Sight Run "Run complete" with the range in bold under it. Under 760px a stage table sets the meter column to 130px, typical time to 64px and the action to 110px so the name keeps most of the row, and a tag sits under the name; a songs table keeps the Best column at 60px. In a Theory card Replay is optically aligned with the text (-16px margin) while Stop and All trainers keep a 16px inset. Staff letters and hairpins between the staves clear the lowest head above (gap edge to edge, letter 20 units tall); the Technique aim-for dynamic uses the same row.
- **Lead sheet:** a Notes shown level: the melody on one staff and a chord symbol (`.cname`: Ink Soft, bold 18px) above it where the chord changes (none over a pickup bar or a figure of fewer than three pitch classes), clear of the highest ink and above the bar numbers. Chords are read from the harmony (triads, sevenths, slash basses), so Ink Soft, never Ink, and never claimed as the composer's. The start card adds an "App plays the chords" switch (the Ghost switch's style, a block chord with its bass on each half bar, not judged) and the line "Chords from the harmony of the piece, not the composer's marks." Offered only on a piece with a left hand. The "App plays the chords" switch is a device setting, kept. On a short stage (under 420px) Notes shown is one line, caption and choice side by side, like You play; the mode line is dropped and the chord switch and its line share a row; under 260px the row is hidden. A run at a Notes shown level above Full is not a run of the piece: heat only, no Best, no Ready day, no review box, and the results say so.
- **Touch block:** a velocity histogram from soft to hard with the average marked, one line (average and band word, spread, hand means, low, middle and high keys when played).
- **Evenness block:** a 396x74 strip, one bar per struck note above or below a centre line for how much louder or softer it was than its neighbours, the allowed band shaded (Wash), bars inside the band Edge, bars outside it Ink, a line of words ("Evenness: Even, 92% of 24 notes within ±8", plus one hint). No hue is spent on it.
- **Coach lines:** below the blocks, Ink Soft sentences with Ink figures, one fact each: timing ("your gaps vary by about 14 ms; you run 9 ms behind the beat", Learn and Technique; in Perform it replaces the lean caption), legato or staccato length, voicing (right hand against left), a Fixed key touch note, and "A test run: no touch marks while you played." after a quiet test run.
- **Follow-the-score lines:** on a song with written dynamics or articulation, up to two coach lines come first, each a pattern seen at least three times ("You played the crescendo in bars 5 to 8 as a flat line.", "4 of 4 accents came out no louder than the notes around them.", "8 of 8 staccato notes were held long (about 95% of their value)"). Plain Ink Soft sentences with Ink figures, no score, no red; absent with Touch coach Off, in Read, when waiting and for exercises, which keep the evenness block.
- **Pedal line:** when the sustain pedal (CC64, down at 64 or more) was used in a Perform or Learn run without Wait or a loop, the coach lines gain one sentence, "Pedal: ...", in the same paragraph style: how many changes of the bass it was changed with, and the bars where the old chord was still ringing under the new one. Plain words, no score, no colour, nothing when the pedal was not used. The sampler honours the player's pedal (a released key keeps ringing until it comes up); the app's own notes ignore it. Technique's chooser has "Pedal changes" (Key and Tempo only): four bars of I IV V I triads.
- **Listen back and Compare:** the results card of a piece gets two quiet buttons before Songs, "Listen back" (with a play icon) and, from the second run, "Compare with last time" (`aria-expanded`). Listen back plays the run through the app's piano; the card steps aside and the Listen bar shows (below). Compare opens `.cmp` between the stats and the actions: a key (last time, this run), then a strip per bar. Right keys are two thin columns per bar, last time in Ink Faint at 55% and this run in Ink, turning Great mint when 15 points or more better and Miss red when worse; mean timing is two ticks about a beat line (late above). One line names the bars that changed and both runs' mean timing; a small "Hear last time" plays the previous take. The card scrolls when taller than the stage. A mint or red column is colour on a strip, with the line beside it saying the same in words (see debt).
- Drill and Sight Run results are single column in a fixed overlay under the bar. Drill: stage, cards, first try, median, mastery before and after as a meter, the weakest notes. Sight Run: cards, first try, best streak, median, a per-note bar strip (height is time, redder is missed more), the notes that need most work, Run again, Back to Read. A record shows an outlined "Longest yet on this range" tag in the Next style (see debt).

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

### Dynamics marks (staff)
- Aim-for dynamic on Technique: p, mf, f are Bravura dynamic glyphs (40px, Ink Soft); cresc. and dim. are 17px Newsreader italic 500 words in Ink Soft. Once per system between the staves at the left, or above a lone staff past the bar number. Accents are a 1.6 round-capped chevron beside notes above C4, opposite the stem. `aria-hidden`.

### Hold feedback (staff)
- After a held note is judged, its head keeps a 1.4px outline: dashed Paper Good when held too long, solid Paper Miss when released early (the two differ by line, not hue). Perform results report the same fact in words as "held n%".

### Held-chord readout
- Absolute at the right of the play view, 16px in: Scrim, Edge border, 12px, min 120px, right-aligned. Chord name in Display 34px; a 13px Ink Faint line under it. Pointer-transparent, `aria-hidden`.

### Count-in numeral
- 160px Newsreader 400 in Lamp, 36% from the top, centred, over a soft Shade, pointer-transparent. One numeral per beat.

### Listen bar
- `.takebar` floats at the top centre of the stage while a take plays back: a pill (Scrim, Edge border, soft drop shadow), a Newsreader 650 22px word ("Listening back" or "Last time"), a 13px Ink Faint "Any key stops" and a small Stop with an x icon. The staff cursor, falling notes and scrubber head follow the take. A piano key, a tap or Escape stops it; Escape does not leave the piece while it plays.

### Drawer row
- `.srow`: grid 6.5rem label (Ink Soft) + control, 12px gap, min-height 40px (44 coarse). Controls: a segmented control for choices, a select, a range, or read-only bold text. Instrument and Volume appear only under Sound "This device". Keyboard shows a select only with more than one input. Delay and Data hold inline fields and small buttons. Rows in four groups split by a Line hairline: Keyboard and Delay; Sound, Instrument and Volume, Click volume; Strictness, Touch coach (Off | Gentle | Steady | Strict), Key touch (a select, "Match the setting on your keyboard." under it), Appearance (Auto | Dark | Light, Auto the default: sets `data-theme` on `<html>` and the iPad window's style, `src/theme.ts`; `public/theme.js` applies a saved choice before first paint), Effects (Off | Calm); Data (Export, Import and a ⋯ More holding Summary for a teacher and Delete all data). Advanced is a Disclosure holding Note names, "Fade names I know" (indented, disabled while names are off), All 88 keys, "Always show touch marks", Play the file's dynamics, Fall speed (Slow to Fast slider), Hand split. Footer: Set up, Help and Credits links, 24px apart, open dialog sheets. The drawer is a side panel; Tab and Shift+Tab wrap inside it while it is open (the page behind is inert), and Escape closes it and returns focus to its button. `.fine` lines (13px Ink Faint) sit under the control column: the Key touch hint, and a line on a fault.

### Scrubber
- 44px Ground well, Line border, per-bar miss heat (Miss Red). Learn: slider with an A-B loop region (Ink 14% fill, 2px Ink edges) and a Lamp playhead. Perform: 18px non-interactive progress bar.

### Streak line
- `.streak`: one 15px Ink Faint line under the week meter, "12-day streak · 1 freeze", with "· a freeze covered yesterday" after a spent freeze. Absent at zero, never styled louder, never a loss message. One freeze is earned per seven practised days in a row, at most two are held; today is not judged until it is over.

### Break toast
- `.rest`: a quiet toast fixed 68px from the top, centred: Panel Raised, Edge border, 12px, "Stretch your wrists" and a small ghost Dismiss, gone after 90 seconds. It appears after 30 minutes of playing with no pause over 5 minutes. It carries no claim about injury.

### Library tools
- The Open library on Songs: a Label "Open library" with the match count beside it, then one wrapped row of a search field (a 420px max pill-less input, 8px radius, a magnifier inside at the left; placeholder "Title, composer or opus"), a composer select ("Name (count)", sorted by surname, shown only with more than one composer) and the Level segment (All levels, 1 to n), so the tools take two rows at 820px. Rows are the Songs row: the Cover (the first bars for a file already on the device, otherwise an empty staff in the piece's key, with the composer and opus above it); name with "composer, Level n, licence" and the length; a Ready tag once played on two days; the same four ghost actions as the Songs row. Fifty rows a page; "Show 50 more" and a "n of m" count at the right. When a Level is chosen and some of it is not on the device a ghost "Save level n for offline" shows ("Saving 12 of 40", "Saved for offline", "n not saved. Try again"). An empty result says "No piece matches. Try fewer words".
- A Skip button follows the Level filter, `.btn.ghost` visually hidden until it takes focus, then in the tools row at the right: "Skip the 50 pieces listed". It moves focus to the end of the list (the Show more row). Hidden when no piece is listed.

### Over time card
- A sentence under the heading gives the axis: accuracy per session, up to the last 24, drawn from 40% to 100%, the dashed line being 100%. The chart sits 4px above its figure.
- On Progress, one card per kind of practice with two or more sessions (Reading drills, Sight Run, Scales, Theory, Songs, Technique), in an auto-fill grid (260px min, 12px / 24px gaps): a Label, a 52px sparkline of accuracy over the last 24 sessions (a 40 to 100 percent axis, a dashed line at 100, a 2px Ink Soft line and no dots), then the average of the last five in 24px tabular system 650 with "up 4 points on the five before", "down n points", "steady" or "n sessions" in 14px Ink Faint. Before any kind has two sessions one sentence says the charts start after two.

### Notes you know
- A 600x62 strip of one bar per semitone from C2 to C7: Ink at an opacity that rises with how often the note was met, how cleanly and how fast, and a Line Strong outline for notes never drilled. C labels sit under the bars; each bar has a title with its percentage. Ink, not a hand hue, by the Semantic Hue Rule.

### Path requirement
- Five levels, each a Disclosure ("Level 3", count beside it "4 of 6 solid, 2 coming"). A requirement is a row of its own grid: name 18px 650 over a 15px Ink Faint detail, a state word (Not started, Learning, Solid, Coming) over a meter (none for Coming, which sits at 75% opacity), and at the right a Start with the play icon on the level's next requirement (primary only on the overall next, otherwise ghost). Scales requirements start the Scales stage, Technique ones the exercise, reading ones the stage, Theory ones the trainer. Under a level's requirements a Label "Pieces to work towards" heads the repertoire ladder: 3 or 4 named pieces a level as the same row (title, then composer and one-phrase reason in the sub-line, a state word Not started, Learning or Ready with no meter, and a ghost Start with the play icon). Start fetches a piece that is not on the device (the state word reads Downloading, the button is disabled; a failure is one line under the list) and opens it in Learn. The level's summary adds "2 of 3 pieces ready". Pieces the catalogue has not loaded yet are left out.

### Sight Run builder and Theory cards
- Both are `.tcard.run`. The Sight Run card: no title (the Read segment names it) and no sentence (the selects say how it runs), the Technique form grid (Clef, From, To, Notes, Cards, Length, Reading ahead, and two range sliders, Jumps from Leaps to Steps and Shuffle from Even to My weak notes, each with end labels), range chips, one switch ("Widen as I improve"), ghost Save this run and primary Start; saved runs below as plan rows with Start and a remove icon. A Theory trainer is a plan row with its level as a pop-up button (`Level n: name`) under the blurb and a ghost Start. A Theory or quiz card is a fine line ("Ear: intervals, card 3 of 15, streak 4"), the prompt as h2, one status line (Yes. / Not quite. and the answer), a ghost Replay on ear cards, and Stop or Next. Rhythm echo shows the bar after the answer as eight 40px cells counted 1 & 2 & 3 & 4 &, a beat to each pair, a tapped cell filled Lamp.

- **Paced Sight Run:** the builder's Pace select (Waits for me, Steady beat). Steady beat adds a Tempo slider (a plain range, 30 to 100, its value in a right-aligned `small.bpm`) and an "A card every" select (Beat, Two beats); Length drops the 10-card choice; Reading ahead offers 2, 3 or 4 notes; the Widen switch gives way to one fine line saying which tempo is offered and why. On the play screen the HUD shows Cards n/N and On the beat n in place of Streak, the dock Tempo control is hidden, and judgement words are not shown, only the staff marks. Results: one line "Hit 14 of 16 on the beat at 50 bpm", the card strip (`.pstrip`: 14 x 22 px cells, 2px Edge border, Radius 4; on the beat filled Ink, missed an empty outline, not reached dotted at half opacity), the timing line, the missed notes by name and one line for the tempo rule; no streak, no record tag.
### Highway and keyboard (signature)
- Notes the app plays in accompaniment fall at 40% (Listen's treatment). A Ghost of last run adds a hairline trace per key in its lane. Alternating lane tints per white key, brighter line at each C and bar, a bright receptor line over the keys with a small lamp per white key (Lamp when lit, muted otherwise), on-screen keyboard (Key White / Key Black). Held keys pulse a lane gradient in the hand's hue (a key struck with no hand to name, a wrong one, pulses ivory). Awaited notes get a pulsing Lamp outline.

### Grand staff (signature)
- **The page.** `#staff` is a sheet of `--paper` (Nocturne #efece4, Matinée #fbf8f1) across the play column in every view (Both, Staff only) and for every reading drill, Sight Run, Read through, Memorise, Scales and Theory card that draws a staff: one `Staff`, one host. A margin of paper around the staves: `--pg` 12 to 36px at the sides and `--pgy` 8 to 18px above and below, the staves measured inside it (`Staff.box()`), the svg overflow visible so a bar number a hair above the viewBox is not cut. A hairline (Paper Ink at 18%) under it, then the divider; no radius, no shadow, no glow: a page, not a card. The library's mini-staff thumbnails (`thumb.ts`) are not part of this; they become covers.
- SVG painted from a pure layout module (`layout.ts`: analysis, window, positions; `staff.ts` only draws and animates). Bravura at 40px (10-unit staff space; grace notes 26px), Paper Ink on Paper, 1.1 staff lines and 1.4 bar lines in Paper Line, Paper Cursor line. Bar numbers Newsreader 600 15px tabular in Paper Ink at 60%. The layout draws rests, ties (Ink), tuplets (numeral plus 1.2 bracket), grace notes, 8va / 15ma (17px Newsreader italic Ink Soft word over a dashed 1.2 bracket), key and time signature changes, and meter-aware beams. Horizontal spacing is a monotone time-to-x map: onset columns never closer than 14 units, wider bars get more room. A bar too crowded at full spacing shows "Too dense: tap to thin" in Newsreader italic Ink Soft beside its number; tapping it steps Simplify up one level. A played chord (head, stem, accidental, dot) settles as one to Paper Played after its hit flash (a beam settles with the last note it joins, by the same timeline); hits flash 0.8s in the grade colour then settle, with no glow. When the app plays a part, those heads are dimmed to 40% and never judged. Great, Good and Late leave a persistent shape under the head at 85% (great a filled dot, good a filled triangle, late an outlined right-pointing triangle; perfect none); Miss a crimson cross, the head flashing crimson then settling to Paper Played after 2s. The glyphs match the palette's (●, ▲, ▸, ×), so a grade reads the same on the staff, the highway and the results with no hue. In Staff view the grade also shows as a Newsreader 600 21px sentence-case word above the notation, one at a time (the newest replaces the last, so a fast run never stacks them into a smear) (Paper Perfect, Great or Good; late is Paper Good with its word), on a Paper halo, fading in about 1s. Beams are flat Ink rectangles, Paper Played once played. Hide played clips the notation at the cursor so played notes vanish. Note names fade per pitch once known (Fade names I know). In a reading drill the awaited card is every notehead of the next chord in Paper Awaited, staff lines 1.7. In a read-through the bars beyond the next two are masked (chords, beams and rests) once the music moves. On Scales exercises each note carries its finger number (15px 700, Paper Ink at 72%) on the side away from the stem; the system grows to keep the numbers inside it. Touch coach marks: a note struck louder or softer than its neighbours gets a small Paper Ink triangle over (louder) or under (softer) the head, 85% opacity, never colour; after three even runs in a row the triangles drop to 35%, and every fourth run of an exercise is a quiet test run with none at all (a flash at the start says so, and results repeat it). "Always show touch marks" turns the fading and the test runs off; Touch coach Off turns the marks off.

## Do's and Don'ts

### Do:
- **Do** keep notation Ink on Panel and let it ignite only for state.
- **Do** pair every judgement colour with a word or position.
- **Do** differentiate hands by hue, fill style (solid vs. tinted with a lighter outline) and lane edge.
- **Do** reserve Lamp (#ffc83d) for the verb and the now-markers, and use the 2px/2px Accent focus ring everywhere.
- **Do** draw control borders in Edge (#666d7d), a floating surface's in Line Strong, and keep Line for hairlines.
- **Do** use Ink 2, not Ink 3, for text read mid-song (HUD captions, bar numbers, dock labels, scrub labels): Ink 3 is 5.9:1 and Apple asks 7:1 for small dark-mode text. Ink 3 stays for icons, grabbers and menus read at arm's length.
- **Do** keep the staff at print size (staff space about 1.9 mm); the divider's 26% minimum guards it.
- **Do** build controls from `--control` and the four radii (6, 10, 14, pill) so touch sizing follows.
- **Do** start every non-play page with the page head and the 1100px measure.
- **Do** write plan, song and stage rows in the same row grammar.
- **Do** build every modal as `dialog.sheet`; header with close, scrolling body, a pinned footer when there is an action besides closing.
- **Do** mark every disclosure with the shared +/− marker.
- **Do** show tags as outlined Ink Soft words; only Next is lamp, on the primary's row.
- **Do** use Newsreader (upright, sentence case) for what is announced and for names of music, and the system font for everything read or tapped; repeat `font-variant-numeric: tabular-nums` on any counter whose rule uses the `font` shorthand (`src/css.test.ts` lists the counters and fails if one loses it; add a new counter to that list).
- **Do** mirror any new colour in `src/palette.ts` if Pixi draws it.
- **Do** show mastery and effort as Ink meters, cells, charts and dots plus a number or word.
- **Do** collapse CSS motion under `prefers-reduced-motion`; on the canvas the hit glow fades at one size and the waiting ring and ghost key hold steady (Calm is the only tier).

### Don't:
- **Don't** add glow on chrome, or a frosted-glass imitation.
- **Don't** add a hard offset shadow or a hard text-shadow; use Shade.
- **Don't** colour notation permanently; colour is a transient state.
- **Don't** use amber for focus, selection, links, switches, slider thumbs, the PF mark in the bar or the HUD numerals, and never for a judgement grade.
- **Don't** use `backdrop-filter`, or an Accent fill larger than a control.
- **Don't** reuse a hand or judgement colour for chrome (the on-screen keys, a chart of grades, a connection dot).
- **Don't** set text dimmer than Ink Faint (#8a8fbd) on Panel, or smaller than 12px.
- **Don't** invent a second dialog layout, an inline-styled modal or a coloured tag.
- **Don't** put a Label-style kicker above a heading.
- **Don't** add paragraphs, parentheticals or explanatory sentences to controls, headers or drawers.
- **Don't** show points, ranks, lives, a score or a loss-framed counter; effort only goes up. The day streak is the one counter allowed, small, absent at zero, with freezes.

## Design Grammar

### Token table

| Group | Token | Value | Use |
|---|---|---|---|
| Colour | ground / panel / panel-2 / panel-3 | #0c0e12 / #13161c / #1b1f27 / #222731 | well, surface, raised and floating, hover and selected |
| Colour | line / line-2 / edge | #262a33 / #363d4e / #666d7d | hairline, floating-surface and selected ring, control border |
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
| Radii | 4 / 8 / 12 / pill | small parts / controls / cards / pills | shape |
| Control | 40 (44 coarse) | buttons, selects, chips, icon buttons, switch row | height |
| Control | 36 (44 coarse) / 52 | small / big button | height |
| Control | cell 32 (38 coarse) in 3px well | segmented | height |
| Control | switch 46x26; slider track 6, thumb 22 (32 coarse); meter 10; scrub 44 (18 progress) | | |

### Page templates

All seven pages are `section.view` with the One Measure.
- **Page head:** `h1` Display 40px; optional lede (Ink Soft, below, full width); actions pushed right (`head-actions`, 8px gap). Title is the tab name, one word. 20px below. At most one short lede line, and none where the page explains itself: only Scales (Stages) and Theory carry one. There are no first-time tab notes (removed 31 Oct 2026: a lede plus a Got it note was two blocks of words before any content; the Help sheet says what each tab is for).
- **List page (Songs, Read, Scales):** Label-style caption and heads over a fixed-layout table; rows 10px 12px padding with a Line rule and a faint hover wash. The whole row opens Learn. Empty tables draw no header row.
  - **Songs:** head action "Add files"; then three groups. Starter pieces and Your files share a table: the 140x52 Cover (cropped to 78px at 1000px and under), name 18px 650 with a Ready tag once played on two days and a 13px sub-line (starter: author and level; file: date and "n of m tracks"; both end with the length), Best (only after the first score, as a percentage), actions in a 2x2 grid below 1100px wide and one row of four from 1100px (a 432px column; rows 73px tall instead of 113): Continue / Start primary on the one next row, otherwise ghost Learn; ghost Perform; ghost Read through; ghost Memorise; and on every user file a ghost Options (opens the Options sheet) that wraps below. The row hover wash shows only with a hover-capable pointer. Your files empty state: one sentence naming the action. Open library: the Library tools block (search, Level, composer, pages of 50, Save level for offline). Library rows are shorter by the Best column. Credits live in a sheet.
  - **Read:** head with a Stages | Sight Run segment and, on Stages, the head action "Review weak notes" when any are due. Sight Run: the builder card then saved runs (see Sight Run builder). Stages: a table with Label band rows per group (Treble clef, Bass clef, Both clefs, Accidentals and keys, Melodies, Chords), name with blurb, mastery meter with percent and "Solid" or "n of m seen", typical time (only after the first card), Practice. The next row gets the lamp Next tag and the primary; "n due" is an outlined tag; all other actions ghost. Reading drills show no score and no lives: the HUD has Cards, and in a Sight Run a Streak; the top-bar button reads Finish, and Back to Read once the results are up.
  - **Scales:** head with a Stages | Choose a scale | Quiz segment; the one-line lede "Solid after three clean runs in a row, in time and even; a miss starts the count again." shows on Stages. Stages: the Read table's grammar (name, blurb with tempo, and on the lamp row the next scale, Solid meter with "n of m solid", Practice with the lamp on the next stage). Choose a scale: a card of five selects (Scale, Key, Hands, Octaves, Tempo), a line giving the right-hand and left-hand fingering in bold, fine lines for why the fingering is what it is, a quiet line naming any hand whose fingering is unchecked against a printed book, and a primary Start. Quiz: a card, "which degree takes the 4th finger", seven number chips answered by tap or by pressing the note, then the reason and the fingering up the scale; results "n of m" with a best streak. On the staff a finger number sits on the side away from the stem. Evenness: a small ink triangle over (louder) or under (softer) a note struck outside the band, and in results a bar strip around a zero line with the band shaded; no hue is spent on it.
- **Form page (Technique):** head with no lede; a `.tcard.run` like Choose a scale and the Sight Run builder: an auto-fit grid (min 150px, 16px gap, align end) of six labelled selects (Pattern, Key, Hands, Dynamics, Articulation, Tempo; the Rhythm pattern swaps Key, Hands, Dynamics and Articulation for Level), then a foot row with the notation preview (max 260px) at the left and the one primary Start at the right; the touch-range card; then the Path: an `h2.sec` "Path" with "n of m solid" beside it, the next five unsolved exercises as plan rows (ghost Start; outlined Due tag; Learning, Solid or Not started as the sub-line), and the rest folded under a Disclosure "n more". Scales and arpeggios also live on the Scales page; Technique keeps its own recipes beside it.
- **Theory:** head with the one-line lede "Answer on your keyboard, in any octave." The trainer list is plan rows: name, blurb, the level as a pop-up button under the blurb (see Pop-up button), ghost Start. The Connect line sits under the lede. Trainers, fourteen plan rows: chords, key signatures, intervals, cadences, scale degrees; ear: play it back, intervals, scale degrees, chords, question and answer; rhythm echo; and the pulse trainers Keep the beat, Subdivisions and Hold a rhythm against the beat. A session is 15 cards, one at a time (see Sight Run builder and Theory cards) and ends in "n of 15 first time", the best streak, the median time (rhythm, question and answer and the pulse trainers show bias and spread in milliseconds instead, and Keep the beat the drift as well), the misses, and All trainers | Again. Ear cards sound their prompt on the app's own piano and click whatever the Sound setting says, and the keyboard is deaf until the prompt ends; Replay counts. Pulse cards always click, whatever Count-in click says, and take taps on any key; a card shows its bars as Pulse bars, and a miss claps the answer on the click (Keep the beat gives a sentence, "You sped up by 6 ms a beat."). Chord ear cards say "Chord" or "Note" with a step count; question and answer cards say whether to answer or ask back, then judge the two bars on form only and say plainly what held, with no score.
- **Plan page (Today):** head with the "Plan" caption and the plan length switch (5 / 10 / 20 / 30 / 45 min); during the first week the Start here card; the last-week recap card (Monday and Tuesday: "Last week: 45 min on 4 days. Most improved: Treble clef", and a ghost "Aim for N min" after a met goal); the week strip card (days, goal meter, "n of m min", the day streak under them); then the plan as rows with a lead column. Rows, in practice order, drawn from what exists: the last Technique exercise (Due for review when it is), the next reading stage (with a meter; Review when cards are due), the Scales stage with its next scale and meter, a Theory session with cards due, the piece (Continue or Start), a piece "Due for another go" (spaced review, Play), the worst bars of the piece played last ("Bars 4 to 6 of Piece", Loop), the Path's next requirement when Scales has no row for it, a Sight Run and a second reading review. A slot lists alternatives and the first that exists wins, and the minutes of an empty slot go to the piece (`src/plan.ts`): 5 min is warm-up and reading; 10 adds the piece; 20 adds Theory or reading, and one of due piece, worst bars or review; 30 adds a scale, the worst bars and one of due piece, Theory, Path or review; 45 gives scale, reading, one of Theory, Path or Sight Run, the piece, the worst bars and review. Unfinished steps first, done steps (check, no time) sink below. A Read-through row (4 min, "Read through, no stopping") takes the `sight` slot in the 20, 30 and 45 minute plans.
- **Progress page:** head, then `h2.sec` blocks (a count, where there is one, sits beside the heading in 15px Ink Faint, as a Path level's does, not in a sentence under it): This week (Today's week card, `.tcard.span`, with the goal select 30 to 180 min under it), Over time (Over time cards), Notes you know (strip), Reading ("n of m stages solid" beside it, mastery cells grouped by the six reading groups), Technique ("n of m exercises solid, k due" beside it, cells grouped by path group), Path (five levels, see Path requirement), Touch (sparkline of average velocity over 30 runs with dashed soft/hard guides, then a Songs-grammar table of the last 8). Empty states carry one sentence.

### Play screen and focus states

Layout is under Layout. States:
- **Ready:** full bar, Perform | Learn, the pane divider, dock; Scrim ready card with title and one sentence; legend once.
- **Running:** count-in numeral, then play. Two and a half seconds into a run (not ready, paused or done) the top bar children go to opacity 0 and stop taking pointer events over 0.35s (hushed). Any pointer move, press or key restores them. The 56px band stays.
- **Hushed:** HUD, title, chip and settings fade together; staff, highway and dock keep their place.
- **Zen:** the dock focus button (any pointer) or M toggles; the bar and the dock aids row are removed, the grid becomes one row, the highway re-lays out. The first dock row stays, so the focus button restores it.
- **Look-through:** the read-through start card counts 30 seconds down, then the count-in starts by itself; Start now, Play or Space starts early. The pass is Perform with the music carrying on past late notes.
- **Results:** Scrim overlay over the stage with the Results card; dock Play and Restart hidden. Drill and Sight Run results fix the overlay below the bar.

- **Quiet:** in Learn and Technique, after 8 clean notes in a row the judgement words stop; a slip speaks again and resets the run. Perform always speaks.
- **Test run:** every fourth run of a Technique or Scales exercise hides the touch marks; "A test run: no touch marks this time" flashes on the start card and results say so.

HUD by mode: Perform shows Accuracy (a percentage, a dash until a note is judged) and In a row; Read shows Cards, and a Sight Run adds Streak; Learn shows none. Numerals 30px, captions 12px stacked above (15px in Read).

### Motion

- Ease `cubic-bezier(0.16, 1, 0.3, 1)`; buttons, switch thumb, ghost shift 0.14-0.22s; drawer slide 0.22s; bar fade 0.35s. Dialogs and the Aids popover appear without animation.
- Staff: ignite 0.8s ease-out, miss fade 1.2s after 0.8s, grade word 1s, ghost snap 0.52s, ghost shake 0.5s, thud 0.35s.
- Motion reports state or a state change, never decorates. Effects Off or Calm: Calm gives lane pulses, glows and sparks; Off gives none. A saved Arcade setting reads as Calm.
- Reduced motion: CSS durations 0.01ms; the canvas glow does not swell and the waiting ring and ghost key do not pulse.

### Copy rules

- Label, value, nothing else. A control that names itself gets no sentence.
- Sentence case everywhere, in both voices; nothing is uppercased by CSS.
- No parentheticals, no "please", "simply", "note that", no hedging.
- One fact once. A number or state is not repeated in a header, a caption and a note.
- Empty states carry one action in one sentence ("Add a MIDI or MusicXML file, or drop one anywhere on this page.").
- Status sentences state the fact: "7 of 12 seen", "3 of 10 min", "about 3 min", "Last week: 45 min on 4 days". No loss framing; the day streak is a fact, not a threat.
- Tags are one word ("Next", "Due"). Dialog and group titles are one or two words ("Options", "Open library"). Disclosures read "n more".
- Hints state the action, not an apology: "Too dense: tap to thin".
- Praise goes quiet when playing is clean; only slips are spoken.
- Touch-aware verbs: "Tap Play" on coarse pointers, "Press Space" otherwise.

### Named Rules (pages)

**The One Measure Rule.** Every non-play page shares the same padding, the 1100px column, and the same page head. No page invents its own left edge.

**The Plan Rows Share Songs Grammar Rule.** A plan row, a song row, a stage row and a path row are one row: optional lead, name over sub-line, optional meter, one action at the right, one primary per view. Rows take the cards' 20px inset (`.plan .prow`, the Path's `.rq`, and the Read and Scales stage tables above 760px), so a name starts at the same x on every page. A row's action is ghost unless it is the view's one primary.

**The Touch Floor Rule.** Targets are 40px with a fine pointer and 44px with a coarse one; sizes come from `--control`, not literals.

**The Dialog Sheet Rule.** Every modal is `dialog.sheet`: header with close, scrolling body, and a pinned footer only when there is an action besides closing (never a second Close). One primary at most, in the footer; three footer actions at most, the rest in the header's ⋯ More. No modal invents its own frame.

**The Tag Rule.** A tag is one outlined Ink Soft Label word. Only Next is lamp, and only on the row with the primary. Tags never use a hand or judgement hue.

**The One Marker Rule.** Every disclosure uses the same +/− marker in Ink Faint.

**The Quiet Bar Rule.** Chrome fades during a run and returns on any input; it never carries information the player needs mid-run.

## Code structure

`src/main.ts` is boot and navigation (about 100 lines): it imports the feature stylesheets in their cascade order and the modules in `src/app/`, and registers `showSection`. Each page and the play screen live in `src/app/`; the pure logic, layout and painters stay in `src/`. Shared state is `app/state.ts` (the open piece, drill, run, read-through and memorise state, the highway, staff and dock, their setters, `hooks` and small helpers); a module imports only from lower ones and the pure modules, and a call to a higher module goes through `state.hooks`. In rough order, low to high: `state`; `osk-ui` (the on-screen keys) and `take-ui` (the recorder: takes, Listen back, Compare, Ghost); `banner` (banner, keyboard chip, MIDI connect, which also re-syncs the on-screen keys); `stage` (views, divider, zoom, frame loop, practice time); `library` (Songs, tracks dialog, import); `play` (open, leave, start card, game events); then the features on the stage and pages: `readthrough-ui`, `memorise-ui`, `calibration`, `drill` (drills and Sight Run), `read`, `scales-ui`, `technique-ui`, `theory-ui` (the trainers, ear, rhythm and pulse cards), `results` (the end of a piece; imported by main for its side effect), `today` (Today, Progress, the Path and ladder, the Start here card); and last `drawer` (settings, Set up, Credits) and `input` (MIDI and computer-key routing, shortcuts). Details and the rules to keep are in `docs/changes/split.md`.

## Known quirks and design debt

Recorded from the build; none of these is a rule for new surfaces.
- Hushed bar keeps its 56px band; the stage does not reclaim it. Only Zen reclaims it.
- Display sizes drifted from the earlier 22/28/34/54 ramp to 22/24/28/30/34/40 (+54 on the ready title, 190 on the results figure). 30 (HUD) and 40 (h1, judge) were added ad hoc; there is no 26.
- Learn results show a 150px stroked check icon where Perform shows the accuracy percentage; the icon has no word beside it.
- Staff hit marks: Perfect and the "ok" touch hit are colour only and decay to Ink Faint after 0.8s; only Great, Good and Miss leave a shape. The "ok" hit still reuses the hand hues on the staff, against the Semantic Hue Rule.
- Hold outlines on staff heads differ by hue only (orange held too long, red released early), against the Word And Shape Rule; the words exist only as the Perform "held n%" figure.
- The inline file-error message is Miss Red text on chrome.
- The Sight Run record tag uses the Next style away from its button, stretching the One Lamp Rule (the rhythm echo's struck cells are Ink now).
- The Theory and Scales ledes and the Sight Run card carry sentences, against the copy rule.
- Progress mastery cells are 30px wide with a fine pointer (44px on touch), under the 40px floor.
- Memorise's larger stage digits (22px) differ from other segments, on purpose.
- The metronome's beat dots are unlabelled.
- The HUD shows a dash and "In a row 0" before a note is played; the "In a row" and "Streak" counters are accuracy runs, kept on purpose.
- The Compare strip colours a column Great mint or Miss red for better or worse; the line beside it says the same in words, but the colour is spent on a bar, against the Semantic Hue Rule (the sentence now carries a ring or a cross, so it is no longer hue alone). The Start here card ringed in Lamp is a now-marker that is not a button.
- A wrong key held down pulses its lane ivory and bright, louder than the hand-coloured pulse beside it.
- The Help and Start here copy are sentences, against the copy rule, as the one-line Theory and Scales ledes are.
- The Listen bar is a floating pill with a drop shadow, a fourth floating surface beside the banner, drawer and Aids popover.
- Literals remaining, not tokens: 12px/13px/14px/15px sizes in results and drill inline styles, touch-range chips and histograms, the 88px results figure.
- No hard offset shadow exists on the primary button in `src/style.css` (grep of `box-shadow` and `text-shadow` finds only soft shadows, glows and inset rings); the Soft Shade Rule holds as built.
