# Repertoire ladder on the Path

## Built
- **Ladder data** (`src/ladder-data.ts`): 19 pieces, 3 to 4 per Path level, `{level, id, why}` with a one-phrase reason. Every piece's catalogue grade equals its level.
  1: Bach Minuet in G (Anh. 114), Schumann Melodie Op. 68 No. 1, Tchaikovsky March of the Wooden Soldiers |
  2: Burgmueller La Candeur, Bach Musette in D, Satie Gymnopedie No. 1, Chopin Prelude Op. 28 No. 6 |
  3: Kuhlau Sonatina Op. 20 No. 1 (Allegro), Burgmueller L'Arabesque, Chopin Prelude Op. 28 No. 7, Bach Invention 4 |
  4: Beethoven Fuer Elise, Mozart Sonata Facile K. 545 (1st), Joplin The Entertainer, Chopin Prelude Op. 28 No. 4 |
  5: Joplin Maple Leaf Rag, Beethoven Moonlight (3rd), Grieg In the Hall of the Mountain King, Beethoven Pathetique (2nd).
- **`ladderState(ladder, progress, info)`** (`src/ladder.ts`): per level, each piece Not started / Learning (plays > 0) / Ready (clean on two days, as the Songs tag) and a ready count. A piece `info` does not know (catalogue not loaded) is left out.
- **Path page** (`pathSection` in `src/habit-ui.ts`, wired in `showProgress`): under each level's requirements, "Pieces to work towards": title, composer and why, status, Start. The level summary reads "0 of 6 solid . 2 of 3 pieces ready".
- **Start** (`startPiece` in `src/app/today.ts`): a piece not on the device is fetched first (status shows "Downloading", the button is disabled); on failure a plain line under the list says it could not be downloaded and to check the connection. Then it opens in Learn through `openById`.

## Tests and checks
`src/ladder.test.ts`: the state function, and the data: 2 to 4 distinct pieces a level; every id in the catalogue file (`.cache/library/out-final/catalog.json`, or `LIBRARY_CATALOG`) or the bundled manifest; grades within 1 of the level and the lowest grade per level never falls. Without the catalogue file only the bundled ids are checked.
Headless Chrome at 1180x820 and 820x1180 with seeded `prog:lib:*` records and the corpus served from the cache: counts, states, Downloading, offline message, Learn opens.

## Honest gaps
- Titles come from the runtime catalogue: before the corpus catalogue has been fetched once, only bundled pieces (16 of 19) show, and the counts follow.
- Ready counts the whole piece; "Moonlight (3rd)" and "Pathetique (2nd)" are single movements.
- Not run on the iPad. The Today plan does not suggest ladder pieces.
