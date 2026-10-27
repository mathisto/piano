# The curated library

`public/library/` holds a small set of free and open scores that ship with the app (about 240 KB, 38 pieces). The larger library of 500 pieces is built by `scripts/library/` and served from `/corpus/` (`docs/changes/pipeline.md`, `docs/hosting.md`); this page covers the bundled set. The app loads `library/manifest.json` (see `src/credits.ts`) and shows a credit for every piece.

## Policy

- Allowed licences: Public Domain, CC0, CC BY and CC BY-SA. The list lives in `scripts/library-sources.json` (`allow`). Anything else makes `fetch-library` fail.
- Non-commercial licences (CC BY-NC, CC BY-NC-SA) are refused unless the piece carries `"nc": true` in the sources and the licence is one of the `NC_OK` names in the script. The owner decides case by case. The manifest keeps `nc: true` and the credit line says "(non-commercial)".
- Scores are **data, not code**. The app is MIT. Each score stays under its own licence, recorded in `manifest.json` and `public/library/LICENSES.md`.
- **CC BY-SA files stay CC BY-SA**, including any converted or edited copy. Do not mix them into the MIT code, into hand-written starter specs in `src/starters.ts`, or into another score. The credit block prints a share-alike notice for them.
- Only Mutopia and OpenScore Lieder are fetched by script. IMSLP is never scripted (its terms); PDMX and MuseScore are not used. See `docs/research/public-domain-sources.md`.

## What a piece must have

Every entry in `manifest.json` carries: `id`, `title`, `composer` (with dates), `collection`, `licence`, `licenceUrl`, `licenceEvidence` (the page that states the licence), `sourceUrl`, `sourceEdition`, `format`, `file`, `level`, `bytes`, `sha256`; plus `typesetter` and `arranger` when the source states them, and `nc` when non-commercial. `src/library.test.ts` checks all of it, the files on disk, and that every file parses with `fromMidi` or `fromMusicXml`.

## Rebuild

```
npm run library:fetch
```

Needs Node 22.2 or newer and network access. It reads `scripts/library-sources.json`, fetches at one request per second with a descriptive User-Agent, and rewrites the files, `manifest.json` and `LICENSES.md`.

- Mutopia: the licence, source edition, typesetter, arranger and `.mid` link are read from the piece's own page and the licence must equal the one in the sources. The composer dates in the sources must equal the page's.
- OpenScore Lieder: the file must say CC0 in `<rights>`. The voice part (`dropParts`) is removed, because the importer would put a single-staff voice line into the hands, and its tempo marking is moved to the piano part, because the importer reads tempo from the first part only.
- Each upstream file's sha256 is pinned in the sources. A mismatch stops the run: upstream changed, so re-verify the licence and clear the pin to re-pin.

## Add a piece

1. Find it on Mutopia (`https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=N`) or in `OpenScore/Lieder`. Read the licence on the page. Mutopia pieces that offer only a `.zip` of MIDI files (multi-movement works) are not supported.
2. Add an entry to `scripts/library-sources.json`: `src`, `id` (`mutopia-N` or `lieder-<lcID>`), `piece` (Mutopia) or `path` and `dropParts` (OpenScore), `level` (Beginner, Elementary or Intermediate), `title`, `composer` with dates, and the expected `licence` (`Public Domain`, `CC0-1.0`, `CC-BY-4.0`, `CC-BY-SA-3.0`, ...). Keep the array ordered easiest to hardest.
3. `npm run library:fetch`, then `npx vitest run`. Commit the sources, the new file, `manifest.json` and `LICENSES.md` together.
4. Listen to it. Mutopia MIDI ignores repeats it did not typeset out, and the importer ignores `<repeat>`.

## Known gaps

- A pickup (anacrusis) first bar makes `Song.spb` wrong, because it divides the first bar's length by the nominal bar length (Brahms Wiegenlied reads as 450 bpm there). The notes and timing are right.
- Fixed since this list was written: key changes inside a MIDI file are now read (`docs/changes/importer.md`); the pickup item above has not been rechecked. Mutopia works offered only as a zip of MIDI files are handled by the batch pipeline, not by `library:fetch`.
- Several OpenScore songs have no tempo marking, so they play at 100 bpm.
- The Satie Gymnopedie page cites only "Dover Edition" without a date. Mutopia tags the piece Public Domain, and the work is from 1888.
