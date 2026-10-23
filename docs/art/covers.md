# Cover art: style guide and prompts

One illustration per starter piece and per open-library piece (46). Made in ChatGPT's image generation by the owner, wired in by us. Own-file imports never get art; they keep the generated mini-staff.

## How to run it

1. Open **one** ChatGPT conversation and paste the **style header** below as the first message. Say "Reply only OK" so it does not start drawing.
2. For each piece, send `Cover for: <subject line>` from the table. Same conversation every time, so the style holds. If the style drifts after about 10 images, start a new conversation, paste the header again, and attach the best image so far as the reference ("match this style").
3. Do the 8 starters first. If they look like one family, do the rest. If not, change the header, not the individual prompts.
4. Save each result as `<id>.png` (the id is the first column). Drop them in `art/` at the repo root and tell Claude; it converts them to 600x400 WebP in `public/art/` and wires them into the start card and the Today card.

## Style header (paste once)

> You are making cover art for a piano practice app called Piano Forte. Every image must belong to one series. Style: flat vector illustration with hard edges, a slight risograph grain, and neon glow only as a thin rim light on shapes (never blurry haze). Dark night-blue ground (#090b17) filling the frame, a slightly lighter navy (#10132a) for large background shapes. Only these accent colours: amber #ffc83d (the focal point, at most one shape), cyan #3fe0ff, magenta #ff4fa3, and a little lime #d7ff3d for sparks. Off-white #ecebf5 for small details. Nothing else: no browns, no greens, no photographic colour. Composition: one simple subject, centred, filling about 60% of the frame, with generous empty margin on all four sides because the image will be cropped to wide and square. Subject drawn from the mood of the piece, always silhouette-led and slightly stylised; falling vertical bars of light (like falling notes in a piano roll) may appear in the background, subtle, at most five. No text, letters, numbers, logos or watermarks. No people's faces, no real people, no sheet music or piano keys (the app already shows those). Landscape 3:2.

## Prompts

Send as: `Cover for: <subject>`.

### Starters

| id | piece | subject |
|---|---|---|
| starter-five-finger | Five-finger warm-up | five round stepping stones rising like stairs across dark water, the third lit amber |
| starter-twinkle | Twinkle, Twinkle, Little Star | one large four-point star over a tiny sleeping hill, a few small stars in cyan |
| starter-ode-to-joy | Ode to Joy | a wide sunrise made of concentric arcs, amber sun, cyan and magenta rays |
| starter-minuet-g | Minuet in G (first strain) | two elegant paper-cut fans, one cyan one magenta, overlapping in a dance pose |
| starter-arpeggio-c | Arpeggio study in C | a harp-like fan of eight rising curved lines, one amber |
| starter-greensleeves | Greensleeves | a lone willow branch drooping over a still pond, cyan reflections, amber lantern |
| starter-canon-d | Canon in D | three nested spirals chasing each other, cyan, magenta and amber |
| starter-fur-elise | Für Elise | a single wilted-looking rose in a glass, amber petal, magenta stem |

### Open library: beginner

| id | piece | subject |
|---|---|---|
| mutopia-75 | Minuet in G | a small music-box dancer silhouette on a round stage, cyan spotlight |
| mutopia-1613 | Minuet in C minor | the same dancer silhouette from behind, magenta spotlight, long shadow |
| mutopia-1612 | Minuet in A minor | a folded paper swan, cyan, on dark water, amber moon |
| mutopia-79 | Musette in D | a bagpipe-shaped bellows silhouette puffing small circles of light |

### Open library: elementary

| id | piece | subject |
|---|---|---|
| mutopia-202 | La Candeur | a white-ish daisy with cyan petals, amber centre |
| mutopia-2146 | Melodic Study | a long ribbon winding through the frame in a gentle S, cyan with amber edge |
| mutopia-354 | Of Foreign Lands and People | a small sailing ship silhouette, distant magenta sunset stripes |
| mutopia-2032 | Morning Prayer | a window arch with an amber sunrise and cyan light rays |
| mutopia-214 | Innocence | a single feather floating, cyan, with an amber dot below |
| mutopia-218 | La Pastorale | a rolling hill with a lone tree, magenta sky stripes, amber sun |
| mutopia-232 | Sonatina in C: Allegro | a bright paper kite, cyan and amber, on a long string |
| mutopia-1806 | March of the Wooden Soldiers | three toy-soldier hat silhouettes in a row, cyan, one amber |
| mutopia-221 | Tendre Fleur | a tulip bud just opening, magenta petals, amber stamen |
| mutopia-203 | L'Arabesque | an ornate looping line pattern forming a knot, cyan and magenta |
| mutopia-2080 | Old French Song | an old streetlamp in fog-less dark, amber glow, cyan cobble lines |
| mutopia-647 | Melodie | a single music-note-free wave of sound as a smooth cyan curve, amber dot on it |
| mutopia-470 | Prelude in A major | a small calm lake and a crescent moon, cyan moon path |
| lieder-lc5701612 | Wiegenlied (Lullaby) | a crescent moon hung like a cradle with a tiny star in it, amber star |
| lieder-lc5004731 | Das Wandern | a winding path over hills with a small walking-stick silhouette, magenta dusk |

### Open library: intermediate

| id | piece | subject |
|---|---|---|
| mutopia-998 | Sonata Facile | a neat geometric sunburst on a small classical pediment, cyan and amber |
| mutopia-67 | Invention No. 4 | two interlocking cyan and magenta gear-like loops, amber where they meet |
| mutopia-61 | Invention No. 8 | two parallel curling lines answering each other, cyan and magenta |
| mutopia-37 | Gymnopédie No. 1 | a single empty chair in a vast dark room, one amber window |
| mutopia-2035 | Gnossienne No. 1 | a crescent-moon desert dune, a lone magenta camel-free ridge, amber star |
| mutopia-469 | Prelude in B minor | a lone rainy window, cyan drops, a magenta glow outside |
| mutopia-468 | Prelude in E minor | a descending spiral staircase seen from above, cyan, amber at the bottom |
| mutopia-504 | Träumerei | a sleeping crescent moon with closed eye lines, a tiny cyan cloud |
| mutopia-931 | Für Elise | a single rose, magenta, with an amber highlight (a more detailed sibling of the starter) |
| lieder-lc4976849 | Die Rose, die Lilie | a rose and a lily side by side, magenta and cyan, amber stars |
| lieder-lc6917116 | Hochländisches Wiegenlied | a mountain range silhouette with a cradle-shaped moon |
| lieder-lc6180725 | An die Musik | a small glowing lantern held up in the dark, cyan halo ring |
| mutopia-263 | The Entertainer | a carnival marquee of round bulbs, amber lit, cyan and magenta alternating |
| mutopia-1540 | Elite Syncopations | a zig-zag of bouncing balls, offset beat, cyan and magenta, amber top ball |
| mutopia-1888 | In the Hall of the Mountain King | a cave mouth with a crown of jagged magenta crystals, amber glow inside |
| mutopia-1777 | Première Arabesque | a flowing curved arabesque scroll, cyan, with amber seed |
| mutopia-1778 | Clair de lune | a full moon over calm water, cyan moon path, amber reflection |
| mutopia-471 | Prelude in D-flat (Raindrop) | one big raindrop making cyan concentric ripples, amber droplet falling |
| mutopia-463 | Bethena | an ornate waltz-hall chandelier, amber bulbs, magenta and cyan crystals |

## Wiring (Claude, after the images arrive)

- `art/*.png` to `public/art/<id>.webp`, 600x400, quality 80, about 25 KB each (about 1.2 MB in all, fetched lazily).
- Shown on the start card (top, 16:5 crop), on the Today "Continue" card and in the Songs rows as a 72x52 tile beside the mini-staff, which stays. Pieces without art (your own files) show the mini-staff only.
- Check each against the palette in `DESIGN.md` (Ground, Panel, Lamp, hands, Perfect) and reject any with off-palette colour; the amber rule is one amber shape per image, as on the staff.
- Credit: the images are ours, made with ChatGPT image generation; nothing to attribute. Do not use them with names of living artists in the prompt.
