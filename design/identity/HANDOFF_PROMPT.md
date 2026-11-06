You are implementing the approved Page to Hand visual identity in the existing iPad-first app. Work directly in this repository:

`/Users/mathisto/projects/piano-roller`

Do not redesign the identity. The design direction has already been selected and translated into exact geometry. Your job is to integrate it carefully, preserve app behavior, and verify the result in the web/Capacitor/iOS build.

## Product and technical context

- Product: **Page to Hand**, an adult piano-practice app.
- Primary device: iPad in landscape, normally read from 60–90 cm away.
- Runtime: TypeScript + Vite inside a Capacitor WKWebView.
- iOS app ID: `io.mattkelly.piano`.
- Capacitor web output: `dist`.
- Native MIDI bridge: `ios/App/App/PianoNative.swift` and `src/native-midi.ts`.
- The current app UI is already partly migrated toward the Urtext palette in `src/style.css`; this is an identity integration, not permission to rewrite unrelated screens.
- The current repository may contain user changes. Preserve unrelated work and inspect `git status` before editing.

## Approved identity

The selected mark is **The Pause / Lid**: a fermata reduced to one arch and one dot. The arch also suggests the lid of a concert grand without drawing a piano. It is intentionally simple enough to survive at 29 px.

Use the identity files under `design/identity/`. Read `design/identity/SPEC.md` completely before editing production code.

Source-of-truth order:

1. `design/identity/SPEC.md` — authoritative construction, palette, typography and behavior rules.
2. SVG files in `design/identity/output/` — authoritative vector geometry.
3. `design/identity/boards.html` and `render.mjs` — reproducible presentation/render sources.
4. Presentation PNGs — visual references only; do not crop UI assets out of them.
5. `01-icon-concepts-exploration.png` — historical exploration only; Concepts B and C are not approved marks.

## Complete identity artifact tree

Everything in this tree was created during the identity pass. At handoff time, `git status --short` reports only `?? design/`; no existing application file was modified by the identity pass.

```text
design/identity/
├── HANDOFF_PROMPT.md
├── IMAGEGEN_PROMPT.md
├── SPEC.md
├── boards.html
├── render.mjs
├── fonts/
│   ├── Newsreader-Variable.ttf
│   └── OFL-Newsreader.txt
└── output/
    ├── 01-icon-concepts-exploration.png
    ├── 02-icon-system.png
    ├── 03-mark-wordmark-web.png
    ├── 04-library-covers-nocturne.png
    ├── 05-library-covers-matinee.png
    ├── 06-cover-responsive-rules.png
    ├── 07-empty-states.png
    ├── 08-identity-sheet.png
    ├── favicon-16.png
    ├── favicon-32.png
    ├── favicon-180.png
    ├── icon-background.svg
    ├── icon-clear-1024.png
    ├── icon-clear.svg
    ├── icon-dark-1024.png
    ├── icon-dark.svg
    ├── icon-default-1024.png
    ├── icon-default.svg
    ├── icon-foreground.svg
    ├── icon-tinted-1024.png
    ├── icon-tinted.svg
    ├── mark.svg
    ├── web-maskable-512.png
    └── web-maskable-512.svg
```

## Full file inventory and purpose

### Specifications and sources

- `design/identity/HANDOFF_PROMPT.md` — this implementation handoff.
- `design/identity/SPEC.md` — 6,527 bytes. Complete engineering specification: exact 1024-unit icon path, dot geometry, colours, wordmark settings, favicon rules, cover grid, responsive behavior, missing-metadata behavior, difficulty treatment, empty-state construction and rationale.
- `design/identity/IMAGEGEN_PROMPT.md` — 1,908 bytes. Records the built-in image-generation prompt used for the first concept board. It is provenance, not a production implementation instruction.
- `design/identity/boards.html` — 26,562 bytes. Deterministic HTML/SVG source for all presentation boards and sample library covers. Useful for inspecting layout logic and exact example copy. It is not app code.
- `design/identity/render.mjs` — 3,833 bytes. Uses `playwright-core` and the locally installed Google Chrome to regenerate the board PNGs, SVG exports, four 1024 px icon previews, favicon PNGs and maskable icon.
- `design/identity/fonts/Newsreader-Variable.ttf` — 451,664 bytes. Design-board font source. Do not duplicate this TTF into the shipping web app unless there is a proven reason; the app already depends on `@fontsource-variable/newsreader`.
- `design/identity/fonts/OFL-Newsreader.txt` — 4,394 bytes. SIL Open Font License for the design-board TTF.

### Presentation images — reference only

- `output/01-icon-concepts-exploration.png` — 1,151,833 bytes; 1254×1254 RGB. Shows the three explored icon directions. Concept A, the fermata/lid, is selected. Do not implement Concepts B or C.
- `output/02-icon-system.png` — 94,662 bytes; 1600×1200 RGB. Shows default, dark, clear and tinted appearances, foreground/background separation, real-size legibility tests and construction notes.
- `output/03-mark-wordmark-web.png` — 110,792 bytes; 1600×1200 RGB. Shows the one-colour mark and Newsreader wordmark on Nocturne, Matinée and score-paper surfaces, plus favicon scale tests.
- `output/04-library-covers-nocturne.png` — 143,795 bytes; 1600×1200 RGB. Six sample covers on the Nocturne shell.
- `output/05-library-covers-matinee.png` — 150,429 bytes; 1600×1200 RGB. The same six covers on the Matinée shell; the covers themselves remain stable.
- `output/06-cover-responsive-rules.png` — 158,862 bytes; 1600×1200 RGB. Shows 600×400, 300×200 and real 56×42 cover densities plus fit rules.
- `output/07-empty-states.png` — 104,298 bytes; 1600×1200 RGB. Approved “No keyboard connected” and “No music here yet” constructions in both modes.
- `output/08-identity-sheet.png` — 108,736 bytes; 1600×1200 RGB. One-page summary with icon appearances, mark, wordmark, palette and two covers.

### Production candidate assets

- `output/icon-default.svg` — 287 bytes. Full-square default app/web icon: paper `#FBF8F1`, mark `#161513`.
- `output/icon-default-1024.png` — 11,941 bytes; 1024×1024 RGB. Ready default iOS app-icon raster. No rounded corners are baked in.
- `output/icon-dark.svg` — 287 bytes. Dark appearance: background `#13161C`, mark `#EFECE4`.
- `output/icon-dark-1024.png` — 12,287 bytes; 1024×1024 RGB. Raster preview/export of the dark appearance.
- `output/icon-clear.svg` — 423 bytes. Clear-appearance preview on `#20242C`, with a 13% cream surface and `#F4F2ED` mark. The OS/Icon Composer should own final clear rendering.
- `output/icon-clear-1024.png` — 12,558 bytes; 1024×1024 RGB. Clear-appearance preview, not a replacement for an actual Icon Composer layered asset.
- `output/icon-tinted.svg` — 287 bytes. Tinted preview using `#78A9FF` on `#15233A`; the OS owns the final user-selected tint.
- `output/icon-tinted-1024.png` — 12,283 bytes; 1024×1024 RGB. Tinted preview.
- `output/icon-background.svg` — 120 bytes. Full 1024-unit paper background layer, `#FBF8F1`.
- `output/icon-foreground.svg` — 238 bytes. Transparent foreground layer containing only the approved ink arch and dot.
- `output/mark.svg` — 238 bytes. Same approved foreground geometry as a standalone one-colour mark. Change its fill through a controlled build step or inline SVG/CSS when used on different surfaces; do not alter the path.
- `output/favicon-16.png` — 248 bytes; 16×16 RGB. Raster favicon size.
- `output/favicon-32.png` — 362 bytes; 32×32 RGB. Raster favicon size.
- `output/favicon-180.png` — 1,794 bytes; 180×180 RGB. Apple-touch/web icon size.
- `output/web-maskable-512.svg` — 312 bytes. 512-unit maskable web icon with critical geometry inside the safe region.
- `output/web-maskable-512.png` — 5,171 bytes; 512×512 RGB. Raster maskable web icon.

Important SHA-256 checksums:

```text
857d0eb32c2485ca96552c11d939257a89eb53f817e72fc67fb5e85cef27338a  icon-default-1024.png
e6c9f51928ec62924819ee9b626c1e59e0245a56811d40a30c186ed146cf616e  icon-dark-1024.png
061144cf3164dc83983a38345794504ff5510befbc877b02c36fb37833915da2  icon-clear-1024.png
f6d4f6eac0ea316dda8fa8abefedc52df9ca8dd6e0974641111f329bc7e53a09  icon-tinted-1024.png
c9a31798b7ba9c24b6e413f9e1fb4cd151e1d6767b36896212a07501e477e842  icon-foreground.svg
1a2246d4a35d89f59cafc242e2c27d57da954d87a6afffbef85d061a510605c7  icon-background.svg
c9a31798b7ba9c24b6e413f9e1fb4cd151e1d6767b36896212a07501e477e842  mark.svg
```

## Existing integration points you must inspect

These are current facts, not permission to overwrite blindly:

- `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` declares one universal iOS 1024×1024 icon named `AppIcon-512@2x.png`.
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` is the current/old app icon and must be replaced with the approved default icon after preserving unrelated asset-catalog changes.
- `ios/App/App.xcodeproj/project.pbxproj` sets `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon` in both relevant configurations.
- `public/favicon.svg` is still the retired neon PF identity and must be replaced.
- `index.html` still uses `<meta name="theme-color" content="#090b17">`; Nocturne ground is `#0C0E12`.
- `capacitor.config.ts` still uses iOS `backgroundColor: '#090b17'`; update it to the Nocturne ground after checking whether launch-screen assets use the same colour.
- `src/style.css` already contains many Urtext tokens, including `--ground: #0c0e12`, `--panel: #13161c`, `--ink: #f4f2ed`, `--accent: #78a9ff`, `--lamp: #ffc83d`, and score-paper tokens.
- `src/style.css` sets `--display: 'Newsreader', ...`, but the installed Fontsource family is named `Newsreader Variable`.
- `package.json` already includes `@fontsource-variable/newsreader`.
- `src/main.ts` currently imports Barlow Condensed files and does not import Newsreader. Do not assume the current Newsreader CSS is actually loaded. Verify with computed styles and offline loading.
- There are still deliberate Barlow references in `src/highway.ts`, `src/app/play.ts`, and existing CSS. Do not remove the dependency until every remaining use is audited and intentionally migrated. Identity integration does not authorize breaking Pixi text or the play stage.
- Bravura is already bundled as `src/assets/bravura.woff2` with its license in `src/assets/BRAVURA-OFL-LICENSE.txt`.
- `src/thumb.ts` already generates a lightweight two-bar SVG grand-staff preview from parsed `Song` data.
- `src/library-view.ts` lazily parses only local/visible pieces; preserve this performance property. Never eagerly parse or render all 2,241 library files.
- The existing Songs UI is table-based and uses 140×52 previews. The approved identity adds explicit 56×42 list thumbnails, 300×200 cards, and 600×400 start cards. Adapt progressively and do not destroy keyboard navigation, skip links, lazy loading, or action menus.
- The app currently exposes only the dark/Nocturne colour scheme. The identity defines Matinée references, but do not invent or ship a theme switch unless the product already has one or the user explicitly expands scope.
- `DESIGN.md` still contains the retired arcade/DDR/Barlow direction and is stale relative to `src/style.css` and this identity. Once implementation is verified, update or replace the conflicting identity portions so future work does not regress to the old brand. Preserve any still-valid behavioral/accessibility guidance.

## Implementation requirements

### 1. Native and web icon plumbing

- Replace the current Xcode 1024 icon with `design/identity/output/icon-default-1024.png`.
- Keep the art square and full bleed. Do not add a rounded mask; iOS applies it.
- Preserve the existing AppIcon set name and valid asset-catalog JSON.
- If the installed Xcode/Icon Composer toolchain supports layered iOS 26 icons, construct the layered icon from `icon-background.svg` and `icon-foreground.svg`, then map dark, clear and tinted appearances according to `SPEC.md`. Do not pretend the preview PNGs are a true layered Icon Composer artifact.
- If layered packaging cannot be done safely from the available toolchain, ship the correct default icon, retain the layer SVGs, and document the exact remaining Xcode/Icon Composer step rather than inventing unsupported asset-catalog metadata.
- Replace the retired `public/favicon.svg` with the approved icon geometry. Add 16, 32, 180 and 512 references/manifest assets where the current web/PWA structure supports them. Do not bake rounded corners.
- Update `index.html` theme colour and Capacitor background to `#0C0E12`.
- Run the normal Capacitor sync so the generated iOS public copy reflects web changes; do not hand-edit generated `ios/App/App/public/` files as the source of truth.

### 2. Mark, wordmark and font

- Add the approved one-colour mark to the app’s appropriate top-bar/brand location at 24–32 px. It must use surface ink: `#F4F2ED` on Nocturne, `#181715` on Matinée, `#161513` on paper.
- Use inline SVG or a reusable component so colour can follow `currentColor`; preserve the exact path and dot geometry from `mark.svg`.
- Wordmark: Newsreader variable, optical size 60, weight 540, tracking `-0.012em`, title case. At narrow widths below a 132 px lockup, drop the words and retain the symbol.
- Load Newsreader locally/offline from the existing Fontsource dependency. Verify the actual CSS family name. Prefer the variable file that supports optical size and weight, and set `font-optical-sizing: auto` where appropriate.
- Do not ship the design TTF in addition to Fontsource unless a measured browser limitation demands it.
- Keep Bravura for notation and system San Francisco for UI controls/body text.

### 3. Library cover system

- Treat the score incipit as the cover image. Do not add illustrations, gradients, textures, era colours, or decorative amber/blue.
- Implement a reusable, data-driven cover component with three density modes:
  - list thumbnail: 56×42 pt;
  - card: 300×200 pt;
  - large start card: 600×400 pt.
- Preserve the existing `thumb(song)` idea where useful, but extend it without regressing parsing performance. Use already-available catalogue metadata before file parsing; lazily refine notation only for visible/local items.
- Cover paper is `#FBF8F1`; cover ink is `#161513` in both modes.
- Header: composer/catalogue at left; key/metre at right; small caps with `0.12em` tracking.
- Divider: 1 px ink at 42% opacity.
- Title: Newsreader 560, `-0.018em`, maximum two lines.
- Notation: Bravura/deterministic SVG from the actual opening one or two bars. Preserve clefs, key signature, metre, beaming and voices when data permits.
- Fit complete beats. End at a beat boundary or barline. Never horizontally squash notation.
- Grand staff is default. Solo staff uses 1.45× staff size and vertical centring. Voice+piano keeps three staves at 600 pt; use the reduced rules from `SPEC.md` at smaller sizes.
- Difficulty uses five 1 pt ink segments: 68% active, 18% inactive. Do not use semantic colour.
- Missing metadata fallback:
  - `LOCAL IMPORT · MIDI` or `LOCAL IMPORT · MUSICXML`;
  - sanitized filename stem, otherwise `Untitled MIDI`/`Untitled score`;
  - `KEY — · METRE —`;
  - localized import date.
- Do not present inferred key/metre as source metadata without an explicit “analysed/inferred” distinction elsewhere.
- Maintain accessibility: meaningful row/card labels, keyboard operation, sufficient contrast, no duplicated noisy notation in the accessibility tree, and existing skip behavior for long result sets.

### 4. Empty states

- Implement only the two approved diagrams if their real app states exist:
  - No keyboard connected.
  - No music here yet.
- Rebuild them as inline SVG/currentColor components from the construction in `SPEC.md` or `boards.html`; do not crop them from the board PNG.
- Place them on paper, use one ink colour, and size at 120–180 px.
- If animated, use only one 180 ms opacity transition and respect reduced motion.

### 5. Palette semantics

- Paper and ink define the identity.
- Amber `#FFC83D` dark / `#F5B316` light means only **play this, now**. Do not use it for brand decoration, selected navigation, links or cover difficulty.
- Slate blue `#78A9FF` dark / `#0058D0` light means selection, focus and links. Do not use it as decorative notation colour.
- Score notation remains dark `#161513` on warm paper in both modes.
- Distinguish cover paper `#FBF8F1` from the dimmer Nocturne practice-score paper `#EFECE4` where the existing UI intentionally uses the latter.

## Recommended execution order

1. Inspect `git status`, the relevant existing files and the full `SPEC.md`.
2. Integrate the default native icon, favicon, theme colour and Capacitor background.
3. Load Newsreader correctly and add a reusable mark/wordmark component without breaking the play-stage Barlow/Pixi text.
4. Implement the cover component and its metadata adapter behind tests; preserve lazy parsing and pagination.
5. Add the two empty-state graphics only where real states already exist.
6. Update stale identity documentation after code and visual behavior are correct.
7. Render and test at iPad landscape, at a narrower split-view width, and at real 29/24/16 px identity sizes.

## Validation

- Run the existing test suite: `npm test`.
- Run the production build: `npm run build`.
- Run `npm run ios:sync` after web assets build successfully.
- Do not run `npm run ios:beta`, archive, upload, or change signing/provisioning unless explicitly authorized.
- Confirm the generated Xcode asset catalog contains the approved default icon and no baked rounded corners.
- Confirm `public/favicon.svg` no longer contains neon cyan/magenta/amber PF geometry.
- Confirm Newsreader is actually loaded offline in the WKWebView, not silently falling back to Georgia/Iowan.
- Confirm the mark is legible at 24 px and icon at 29 px.
- Confirm covers do not parse all 2,241 pieces on load and do not create thousands of DOM nodes.
- Confirm list/card/start-card covers remain readable at their exact target sizes.
- Confirm both existing keyboard navigation and touch targets still work.
- Confirm the cover is paper/ink only and amber remains reserved for the immediate play action.
- Report every changed file, tests run, visual checks performed, and any remaining manual Icon Composer step.

## Non-goals and hard bans

- Do not resurrect the condensed italic neon PF logo.
- No generic treble-clef logo, flying notes, sound waves, gradients, glow, faux paper texture, sepia, mascots, photoreal pianos, or decorative piano-key swooshes.
- Do not add text inside the app icon.
- Do not use the presentation PNGs as shipping UI assets.
- Do not rewrite unrelated practice mechanics, MIDI behavior, grading, audio, storage or library licensing logic.
- Do not add a Matinée mode switch without explicit product authorization.
- Do not erase unrelated local changes or use destructive git commands.

Begin by reading `design/identity/SPEC.md`, checking `git status`, and inspecting the existing AppIcon, favicon, font imports and library thumbnail pipeline. Then implement and verify the integration end to end.
