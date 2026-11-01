# Urtext: the design direction (decided 2026-11-01)

The owner chose "Urtext", from a design-language brief answered by Gemini (31 Oct 2026), over the neon-cabinet look. In one line: the tactile authority of a German engraving house (Henle, Bärenreiter: cream pages, dark ink) with the precision of a concert grand and native iPadOS. Calm and adult, never arcade.

This file records what was taken from that brief, what was corrected, and the order of the rollout. The tokens themselves live in `src/style.css` (`:root`) and `src/palette.ts`; DESIGN.md describes them.

## Decisions

1. **The score is always dark ink on warm paper**, in both modes: `--paper` #efece4 (Nocturne; dimmed so a lit page in a dark room is not a lamp) with `--paper-ink` #161513 and `--paper-line` #524e46. White-on-dark notation halates at 60-90 cm (thin staff lines vibrate); every engraving program shows paper. A bright page at night is the open question: the owner judges it on the iPad.
2. **Two modes**: Nocturne (dark, the default) and Matinée (light, warm stone). Appearance follows the system unless Settings says Dark or Light. Matinée tokens are in the table below.
3. **One lamp stays.** Brass amber #ffc83d means only "play this, now" (the primary verb, the cursor, the awaited note). On paper it darkens to `--paper-cursor` #a85a00 and `--paper-awaited` #8f4e00 to hold contrast.
4. **An interface tint**: slate blue `--accent` #78a9ff (Matinée #0058d0) for selection, the focus ring and links. Never on the staff or in the lanes.
5. **Hands**: right warm terracotta #f27d52, left cool verdigris #2ab7b0 (Matinée #c94a22, #0e7c77).
6. **Judgement, changed from the brief**: perfect mint #3dd68c ●, great pale mint #a7e8c4, good neutral #c9ccd6 ▲, late the good faded ▸, miss crimson #ff3d6e ×. Every judgement carries its glyph or a word, never hue alone. On paper: #13794b, #3e8f69, #6e6a61, the played ink, #c8164b.
7. **Type**: Newsreader (variable serif with optical sizes, SIL OFL) replaces Barlow Condensed for what is announced (page titles, the results figure, the count-in) and for the names of music (piece titles), in sentence case, upright, never tracked capitals. The system font for everything tapped or read. Tabular numerals for every counter. Bravura stays for notation.
8. **Radii** grow to 6 / 10 / 14 px (`--r-1..3`), sheets keep theirs; depth by luminance steps and a hairline, no glows on chrome.
9. **Covers** are the piece's own opening bars engraved on paper, drawn from the score, with the composer and catalogue number above and the title below. No illustrations (the AI covers were removed on 31 Oct).

## Corrected from the brief

- **Contrast figures it got wrong**: the staff cursor #d97706 on paper is 2.7:1, not 3.6 (now #a85a00, 4.3:1); the awaited #b86e00 is 3.4:1, not 4.5 (now #8f4e00, 5.5:1); Matinée "late" #b26200 is 4.2:1, not 4.7.
- **Hue collisions in its palette**: right hand coral next to miss coral (ΔE 12 under deuteranopia), left hand teal next to perfect cyan (ΔE 16), late ochre next to the lamp (ΔE 9). The judgement set above was chosen by scoring candidates for distance in normal vision, deuteranopia and protanopia (script in the session scratchpad; worst remaining pairs are perfect and miss under deuteranopia at ΔE 13, carried by ● and ×).
- **Not taken**: imitation Liquid Glass (`backdrop-filter` over the WebGL highway costs frames on a 60 Hz iPad Air, and real Liquid Glass is not available to web content); `showsLargeContentViewer` (UIKit, not reachable from the web view); features its mockups invented (audition tonic chord, a measure stability map).

## Matinée (light) tokens

| Token | Nocturne | Matinée |
|---|---|---|
| ground | #0c0e12 | #f3efe6 |
| panel | #13161c | #faf7f0 |
| panel-2 | #1b1f27 | #eae4d7 |
| panel-3 | #222731 | #ffffff |
| line | #262a33 | #e2ddd2 |
| line-2 | #363d4e | #c7c0b3 |
| edge | #666d7d | #7d776b |
| ink | #f4f2ed | #181715 |
| ink-2 | #a6abb8 | #524f49 |
| ink-3 | #8a90a0 | #666259 |
| lamp / lamp-hi | #ffc83d / #ffd466 | #f5b316 / #e09f08 |
| lamp-ink | #14110a | #14110a |
| accent | #78a9ff | #0058d0 |
| R / L | #f27d52 / #2ab7b0 | #c94a22 / #0e7c77 |
| perfect / great / good / miss | #3dd68c / #a7e8c4 / #c9ccd6 / #ff3d6e | #13794b / #3e8f69 / #67635a / #c8164b |
| paper | #efece4 | #fbf8f1 |

The highway (lanes, keys) stays dark in both modes, as the brief advised: the falling notes read best on a dark field.

Beyond the table (all in `src/style.css` `:root`, as `light-dark(Matinée, Nocturne)`): scrim rgba(243,239,230,.92), scrim-hi rgba(250,247,240,.95), backdrop rgba(24,23,21,.4), drop rgba(58,46,28,.2), wash rgba(24,23,21,.045), specular white .9 and on the lamp white .5, loop rgba(24,23,21,.14), great-ring rgba(62,143,105,.3), L-fill rgba(14,124,119,.3) with L-edge #0e7c77, late = good at 80%, and `--lamp-line` #a85a00 (the lamp as a line or border, where brass is 1.7:1). `--lamp-glow` was unused and is gone.

### Matinée, verified (1 Nov 2026)

Every pair was computed (WCAG relative luminance) and is now a test in `src/palette.test.ts`. What the brief's numbers did to Matinée:

- **Edge #8a8478** is 3.5:1 on Panel but 2.9:1 on Panel Raised, where the drawer's inputs and buttons sit: now #7d776b (3:1 or better on all four surfaces).
- **Good #6e6a61** is 4.25:1 on Panel Raised as text: now #67635a (4.7:1). `--paper-good` stays #6e6a61 (5.1:1 on the paper).
- **Late** "Good faded": at 60% it is 2.4:1 on Panel. Now Good at 80%, 3.2:1 on Panel Raised and 3.6:1 on Panel, as a glyph (3:1). It is never text.
- **Great #3e8f69** is 3.7:1 on Panel, 3.1:1 on Panel Raised: a mark only (the ring, the chip dot), never text. Perfect #13794b is 5.1:1 on Panel but 4.3:1 on Panel Raised, so it too is for glyphs there.
- **Right hand #c94a22** (4.4:1 on Panel, 3.7:1 on Raised) and **left hand #0e7c77** (4.7:1, 4.0:1) pass 3:1 as swatches and fail 4.5:1 as text; they are never text, so unchanged.
- **Brass lamp #f5b316** is 1.7:1 on Panel: fine as a fill under Lamp Ink (10.2:1; #e09f08 8.2:1) but not as a line, so the scrubber head and the Start-here step ring use Paper Cursor #a85a00 (4.4:1 on Ground, 4.0:1 on Raised).
- Held: ink 14.1:1 or better, ink-2 6.4:1, ink-3 4.8:1 on Raised, accent 5.0:1 on Raised, bad 4.5:1 on Raised, paper inks on #fbf8f1 all higher than on #efece4 (played ink 4.4:1, cursor 4.8:1, awaited 6.1:1).
- The paper #fbf8f1 sits 1.08:1 from the Ground: the page edge is held by the Line hairline and the specular edge, not by contrast.

How it is built: one `light-dark()` per token rather than a second block (the Nocturne and Matinée values sit on one line and cannot drift); the root says `color-scheme: light dark`, Settings' Appearance sets `data-theme` (`dark` or `light`; Auto removes it). `light-dark()` needs Chrome 123, Safari 17.5 or Firefox 120; the iPad runs iPadOS 27. The grade word and the count-in take `color-scheme: dark` because they sit on the highway. The on-screen keys under Theory use the paper's ivory and ebony in both modes. The web view, launch screen and theme-color follow the mode (`Ground` colour asset, `index.html`).

## Rollout (agents in parallel, merged one at a time)

1. Tokens (done first, on main): `:root`, `palette.ts`, DESIGN.md front matter.
2. Type: Newsreader in, Barlow out (also the Pixi key labels).
3. The staff on paper, with the paper colours for cursor, awaited, played, grades and miss.
4. The highway, keyboard and judgement colours with glyphs, the results and HUD.
5. Covers from the opening bars.
6. Chrome: top bar, dock, sheets and radii against the new surfaces.
7. Matinée and the Appearance setting, after 2 to 6 land. Done (`feature/matinee`).
