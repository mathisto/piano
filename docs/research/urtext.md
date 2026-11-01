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
| edge | #666d7d | #8a8478 |
| ink | #f4f2ed | #181715 |
| ink-2 | #a6abb8 | #524f49 |
| ink-3 | #8a90a0 | #666259 |
| lamp / lamp-hi | #ffc83d / #ffd466 | #f5b316 / #e09f08 |
| lamp-ink | #14110a | #14110a |
| accent | #78a9ff | #0058d0 |
| R / L | #f27d52 / #2ab7b0 | #c94a22 / #0e7c77 |
| perfect / great / good / miss | #3dd68c / #a7e8c4 / #c9ccd6 / #ff3d6e | #13794b / #3e8f69 / #6e6a61 / #c8164b |
| paper | #efece4 | #fbf8f1 |

The highway (lanes, keys) stays dark in both modes, as the brief advised: the falling notes read best on a dark field.

## Rollout (agents in parallel, merged one at a time)

1. Tokens (done first, on main): `:root`, `palette.ts`, DESIGN.md front matter.
2. Type: Newsreader in, Barlow out (also the Pixi key labels).
3. The staff on paper, with the paper colours for cursor, awaited, played, grades and miss.
4. The highway, keyboard and judgement colours with glyphs, the results and HUD.
5. Covers from the opening bars.
6. Chrome: top bar, dock, sheets and radii against the new surfaces.
7. Matinée and the Appearance setting, after 2 to 6 land.
