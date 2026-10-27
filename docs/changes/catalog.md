# Catalogue: the app side of the big library

Branch `feature/catalog`. Not deployed; `scripts/deploy-library.sh` has not been run.

## What changed

- `src/catalog-types.ts`: the `Catalog` / `Piece` schema shared with the pipeline (identical text expected from `feature/pipeline`).
- `src/catalog.ts`: the bundled `manifest.json` becomes a built-in catalogue (Beginner, Elementary, Intermediate -> grades 1, 2, 3; ids unchanged, so `lib:<id>` progress carries over). The stored network catalogue (IndexedDB `catalog`) is merged over it, then `catalog.json` is revalidated in the background (`cache: 'no-cache'`, the browser sends the ETag; no custom headers, so no CORS preflight). Bundled pieces the network catalogue lacks stay. Corpus base: `/corpus/` on the web, `https://pianoforte.mattkelly.io/corpus/` in the iPad app, `VITE_CORPUS` overrides.
- Piece loader `pieceBytes`: IndexedDB `libfile:<id>`, then the bundled file (`served()`, status 0 on the iPad), then the corpus (kept in IndexedDB). A wrong sha256 is skipped at every step; without `crypto.subtle` the bytes are trusted.
- Search: NFD, diacritics stripped, words and numbers split (`Op.46` -> op, 46), every typed word must prefix a word of title, composer, opus or tags. Rank: title 4, composer and opus 3, tags 1, +1 exact, +1 first title word; ties by grade, quality, catalogue order. 5,000 rows in a few ms (test asserts under 50 ms).
- `src/library-view.ts` + `.css`: the Open library on Songs is a search field, a Level segment (All, 1..n), a composer select with counts, and 50 rows a page with "Show 50 more". Lengths from `sec`; thumbnails and covers only for bundled or cached pieces, otherwise key, metre and bars. "Save level N for offline" appears when a level is chosen and some of it is not on the device. Starter pieces and Your files are unchanged. The level disclosures (`libraryTable`, `.libgrp`) are gone.
- Credits: `creditLine` / `creditBlock` take `(catalog, piece)` and add the changes made (flags `voice-folded`, `voice-dropped`). The Credits sheet lists pieces played or saved, plus links to both LICENSES.md files (app bundle and corpus).
- `art()` only draws a cover for bundled ids; Today's Continue row finds library pieces by progress key, not by scanning the catalogue.
- `scripts/deploy-library.sh`, `docs/hosting.md` (Caddy and Cloudflare).
- Dev hook: `__piano.catalog(5000)` loads a synthetic catalogue (`src/catalog-fixture.ts`, dev only) and opens Songs.

## Verified

- `npx tsc --noEmit`, `npx vitest run` (search, ranking, filters, merge, loader order with a mock fetch, sha mismatch rejected, catalogue validation).
- `npm run smoke` against the dev server: all checks pass, including axe on Songs.
- Headless Chrome at 1180x820 and 820x1180, bundled and 5,000-row catalogues: 50 rows rendered, search keeps focus, Show more adds 50.
- End to end against a local CORS server standing in for the corpus: catalogue revalidated and merged, a piece fetched, cached in IndexedDB and opened again with the corpus blocked, a tampered file refused with a message, start card and Credits show the piece's credit.

## Not verified / open

- The iPad (capacitor://localhost to the real host, CORS, WKWebView IndexedDB quota) and the real server: Caddy and Cloudflare config is written, not applied.
- Contract guesses the pipeline must match: `aliases` read as old id -> new id (lookup only; progress under an old id is not migrated); change flags `voice-folded` / `voice-dropped`; grades are integers, the bundle uses 1 to 3.
- Clear all data does not remove cached files or the stored catalogue (caches, not user data).
- At 820px the composer select wraps to a second row under the search field.
