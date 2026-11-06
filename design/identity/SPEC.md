# Piano Forte identity specification

## Direction

The selected mark is **The Pause / Lid**: a fermata reduced to an arch and a dot. It is immediately musical, but avoids the generic treble-clef category. The arch also recalls the raised lid of a concert grand without drawing a piano. The result is calm, adult, edition-like, and unusually legible at 29 px.

The two alternatives retained in the exploration board are:

- **Key / note counterform** — precise and strongly piano-specific, but busier and less distinctive at 29 px.
- **Brace / staff** — communicates engraving and grand staff, but loses too much detail at Settings size.

## App icon construction

- Artboard: 1024 × 1024 units, full bleed, square. Do not bake in a corner radius.
- Safe visual inset: 160 units.
- Arch outer contour: `M168 612 C240 290 784 290 856 612`.
- Arch inner contour, reversed to close the mass: `C751 480 649 424 512 424 C375 424 273 480 168 612 Z`.
- Dot: circle centred at `(512, 638)`, radius `76` (diameter 152).
- Minimum vertical negative-space gap between arch and dot: 94 units.
- Foreground is a single compound visual layer: arch plus dot. Background is a separate full-square layer.
- No shadow, gradient, texture, outline, or baked iOS mask.

Appearances:

| Appearance | Background | Foreground | Notes |
|---|---:|---:|---|
| Default | `#FBF8F1` | `#161513` | Primary shipping icon |
| Dark | `#13161C` | `#EFECE4` | Quietly separated from the `#0C0E12` home screen |
| Clear preview | `#20242C`, plus 13% `#EFECE4` surface | `#F4F2ED` | Composer-ready clear treatment; supply the same foreground mask |
| Tinted preview | `#15233A` | `#78A9FF` | Preview only; the OS owns the final tint |

Rationale: the mark uses only two masses, survives 29 px, and has one concept rather than combining initials, keys, and notation. The cream/ink default ties the icon directly to the score surface.

## Mark and wordmark

The top-bar mark uses the same 1024-unit foreground geometry with no square. Set it in one surface-appropriate colour: `#F4F2ED` on Nocturne, `#181715` on Matinée, and `#161513` on score paper. Nominal size is 24–32 px; never go below 20 px.

The wordmark is **Newsreader Variable**, optical size 60, weight 540, tracking `-0.012em`, title case. Align the cap height to 54% of the mark box and use a gap equal to 0.36× the mark width. Below a 132 px lockup width, remove the wordmark and retain the symbol.

Rationale: Newsreader supplies literary authority without faux-historic ornament, while the symbol handles small-size recognition.

## Favicon and web icon

- 16 and 32 px: use the default paper/ink square; snap the dot to whole pixels after scaling.
- 180 px: use the default icon unchanged.
- 192 and 512 px maskable: keep all critical geometry within the central 68% safe zone. The supplied mark already complies.
- PWA background: `#FBF8F1`; theme colour may follow the current app mode.

## Library cover system

### Grid

- Ratio: 3:2 at all three sizes.
- Horizontal margin: 7% of width.
- Top margin: 7% of height.
- Header: system sans, 650, small capitals, tracking `0.12em`.
- Header left: composer plus catalogue. Header right: key plus metre.
- Divider: 1 px `#161513` at 42% opacity.
- Title: Newsreader, weight 560, tracking `-0.018em`, maximum two lines.
- Secondary line: Newsreader, weight 410.
- Incipit: Bravura, `#161513`, no tinting. Preserve original beaming, clefs, key signature, metre, and voices.

### Sizes

| Surface | Outer size | Margins | Title | Minimum staff space | Content |
|---|---:|---:|---:|---:|---|
| Start card | 600 × 400 pt | 42 pt | 42 pt | 8 pt | Full header, title, secondary line, 1–2 bars |
| Card | 300 × 200 pt | 20 pt | 17 pt | 5 pt | Full header, title, secondary when it fits, 1–2 bars |
| List thumbnail | 56 × 42 pt | 4 pt | Omitted | 2.5 pt effective | Composer token plus incipit only |

Fit the largest number of **complete beats** that meet the minimum staff size. End at a beat boundary or barline. Never horizontally compress notation. For a dense opening, show fewer beats before reducing staff size.

Grand staff is the default. A single-line instrument receives 1.45× staff size and vertical centring. Voice plus piano uses three staves on the 600 pt card. At 300 pt, retain the vocal staff and a reduced grand staff; at 56 pt, retain the vocal contour and piano bass contour as the recognition signature. Lyrics appear only at 600 pt and only when the first syllables fit cleanly.

Long titles receive two lines. If the second line still overflows, move collection information to the secondary line and ellipsize only in the 56 pt list row—not on cards.

### Colour and difficulty

Use no era or difficulty colour. Covers stay `#FBF8F1` and `#161513` in both app modes. Difficulty is a five-segment, 1 pt ink rule: active segments are 68% ink, inactive segments 18% ink.

Rationale: the incipit is the unique visual data, and the monochrome system scales to 2,241 pieces without competing with blue selection or amber “play now” state.

### Missing metadata

- Composer header: `Your file · MIDI` or `Your file · MUSICXML` (sentence case; the cover's CSS sets the capitals).
- Title: sanitized filename stem; if empty, `Untitled MIDI` or `Untitled score`.
- Key/metre: `KEY — · METRE —`.
- Secondary line: localized import date.
- Infer key or metre only when confidence is high enough to label it as analysis elsewhere; never silently present inference as source metadata on the cover.

## Empty states

Only two graphics are defined:

1. **No keyboard connected** — two 44 × 56 unit key/device rectangles with a centred 7-unit connection dot. Stroke: 7 units, square caps.
2. **No music here yet** — five staff lines between two 6-unit end bars with a centred 18%-ink notehead placeholder.

Both sit on `#FBF8F1` paper and use `#161513` ink. Use them at 120–180 px. If animated, use only a single 180 ms opacity transition.

Rationale: both graphics convey actionable system state; neither tries to entertain or decorate an absence.

## Palette

- Nocturne ground `#0C0E12`
- Nocturne panel `#13161C`
- Nocturne ink `#F4F2ED`
- Dim score paper `#EFECE4`
- Matinée ground `#F3EFE6`
- Matinée panel `#FAF7F0`
- Matinée ink `#181715`
- Score paper `#FBF8F1`
- Score ink `#161513`
- Slate blue, dark `#78A9FF`
- Slate blue, light `#0058D0`
- Play-now amber, dark `#FFC83D`
- Play-now amber, light `#F5B316`

Amber and slate blue are not decorative identity colours. Amber remains exclusively “play this, now”; blue remains selection and links.
