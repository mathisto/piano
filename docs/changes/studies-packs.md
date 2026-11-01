# Studies and packs

Phase K1 and most of K2 of `docs/research/horizon.md` (section 3), with the owner's decisions of 1 Nov 2026: the word is **Pack** (24); first-party packs ship in the bundle, then import by file and by link, never accounts, ratings, comments or uploads (25); Hanon Nos. 1 to 20 as a warm-up pack, two a day, slow, "stop if it tenses or hurts", no level shown (26); a Finger numbers switch, and a pack item may turn note names and finger numbers off (28). Decision 23 (where the studies live) is open: placement A is built; screenshots of A and of a throwaway B (an eighth tab) are in the session's scratch folder for the owner to compare. Branch `feature/studies1`.

## The format

A pack is a small JSON text file, `.pfpack` (a `.json` is read too). It **names** things the app already has and never carries music, so it cannot carry a licence problem or code. `src/pack.ts` reads it (`parsePack`) and refuses anything it does not know, with the item number and the field in the message.

```json
{
 "pf": 1,
 "id": "week-one",
 "title": "Week one",
 "by": "Ms Lee",
 "about": "Ten minutes a day. Slowly, and stop if anything hurts.",
 "licence": "CC0-1.0",
 "items": [
  {"piece": "mutopia-647", "title": "Melody", "note": "Left hand alone first.", "rate": 0.7, "view": {"names": false}},
  {"read": "t-land"},
  {"drill": {"pattern": "scale", "tonic": 7, "dyn": "medium", "hands": "both", "bpm": 60}},
  {"scale": "s1", "rate": 0.8, "view": {"fingers": false}}
 ]
}
```

| Field | | |
|---|---|---|
| `pf` | required | the format version, 1; a newer one says "Update the app" |
| `id` | required | lower-case letters, digits and dashes, up to 64: progress and a re-import go by it; an app pack's id is refused |
| `title`, `by` | required | up to 80 characters; `by` is shown as written, never trusted |
| `about` | | up to 300 |
| `licence` | | `CC0-1.0` or `CC-BY-4.0`, of the list, its order and notes only |
| `kind` | | `"study"`: on Technique with the studies; otherwise on Songs |
| `warmup` | | 1 to 5: a warm-up of that many a day, a rotation through the list, never a book to finish |
| `items` | required | 1 to 200, each naming exactly one of `piece` (a catalogue id; an alias resolves), `drill` (a Technique exercise's settings, range-checked against what the page offers), `read` (a Read stage id) or `scale` (a Scales stage id) |
| item `title` | | up to 60: the name in this pack (the catalogue's own title otherwise) |
| item `note` | | up to 140 |
| item `rate` | | 0.4 to 1, a share of the written tempo (a scale stage's tempo for `scale`) |
| item `view` | | `{"names": false, "fingers": false}`: aids off for this item |

Text holding a web address is refused; every string reaches the page through `esc` or `textContent`. A file is at most 64 KB. An id the app does not know (a piece not in this catalogue, a stage from a newer version) is not an error: its row is greyed with "Not in the library yet", the rest of the pack works.

**Done** is each item's own rule, nothing new: a piece is done at Ready (a clean run on two days), an exercise when its syllabus state is Solid or Due, a Read or Scales stage at Solid. **Next** is the first item not done. A warm-up instead offers today's `warmup` items: those played today, then the ones played longest ago (never played first, in order); once today's are played it says "Done for today".

## The packs that come with the app

`src/packs/*.pfpack`, read by the same parser (`import.meta.glob`, in the lazy chunk). Generated from `out-c1/catalog.json`; `src/pack.test.ts` checks every id against the catalogue when one is on the machine (`LIBRARY_CATALOG`, default `.cache/library/out-c1/catalog.json`).

| Pack | Where | Items | Notes |
|---|---|---|---|
| Hanon warm-up | Technique | Nos. 1 to 20 (`mutopia-2037-*`) | `warmup: 2`, rate 0.6, "Two a day, slow, both hands. Stop if it tenses or hurts."; no level (they are `kind: study`) |
| Burgmüller: 25 studies, Op. 100 | Technique | Nos. 1 to 18 | rate 0.7; the about says 19 to 25 are not in the library |
| Czerny: eight-bar exercises, Op. 821 | Technique | Nos. 1 to 19 | note names off on every item: they are for reading |
| Czerny: melodic studies, Op. 840 | Technique | Nos. 1 to 10 | |
| Clementi: first lessons, Op. 42 | Technique | the 76 movements, in order | titled "Movement k" until the catalogue has the lesson names (below) |
| Schumann: Album for the Young, Op. 68 | Songs | the 20 in the library, by number | English titles in the pack |
| The notebook for Anna Magdalena Bach | Songs | the 14 of BWV Anh. 113 to 131 | |

## On the page (placement A)

- **Technique**: Studies at the top (the packs of `kind` study, then Bring a pack), then Exercises (the builder, the touch range and the syllabus as before). The pack you last started something in holds the lamp; the builder's Start then steps down.
- **Songs**: a Packs button in the head (with the count) shows the other packs and the ones you brought, and Bring a pack. The Studies lane's note links to Technique.
- **A pack's list**: a sheet (DESIGN.md, Packs), with Share as a file, Share as a link and Remove in its More.
- **Finger numbers**: Settings > Advanced. Off, or off for a pack item, the numbers are neither drawn nor made room for (`staff.ts` lays out the song without them).

## In and out

- **By file**: Bring a pack, Add files on Songs, a drop anywhere, and a file opened from Mail, AirDrop or Files on the iPad: the native `file` event already hands every opened file to `importFiles` (`src/native-app.ts`), which now sends anything that is not MIDI or MusicXML to the pack reader; a `.pfpack` or `.json` that is not a pack says so. The iPad document type for `.pfpack` is the native branch's.
- **By link**: `https://pianoforte.mattkelly.io/#pack=<base64url(deflate-raw(JSON))>`. The fragment never reaches a server and nothing is fetched (the CSP allows only the site itself). Read at boot and on `hashchange`, then taken off the address. The example above makes a link of about 400 characters (its fragment is 357); inflation is capped at 64 KB.
- **Share**: as a file through the share sheet (or a download), as a link through the share sheet where there is one, else copied ("Link copied."; over 2,000 characters it says a file is safer), else shown in a field to copy by hand. The iPad app shares the site's address, not its own.
- **Kept** under `pack:<id>`: a pack you brought (`pack`, `from`, `added`) and, for any pack, `opened` (when you last started something in it). In the export (`EXTRA` in `src/backup.ts`), merged on import (the file's pack, the later `opened`), and removed by Delete all data.

## Judgement calls

- **Two Czerny packs**, not one interleaved: one book each reads plainly; interleaving is a pack anyone can write.
- **`hands` and `sha` from the horizon draft are left out**: hands apart is a note ("Hands apart first"); the advisory `sha` warns about something the app cannot act on. Add `hands` when the dock can be set from a pack without a second hands control.
- **`title` per item**: the catalogue's titles for Hanon, Czerny and Clementi are "Movement k" and the French Op. 68 titles carry "Album pour la jeunesse - 2."; the pack names them for its own list. The catalogue fix is still owed (Clementi below).
- **A warm-up rotates** instead of being finished: decision 26's "never finish the book" as a rule, not a sentence.
- **Pack code reaches the play screen through `hooks`** (`openById`, `openSong`, `startDrill`, `shareFile`): importing those modules from the lazy chunk made Rolldown split the boot chunk, about 5 KB over budget. Boot is 222,992 of 223,000 bytes (was 222,231): the budget was not raised; the drawer's plain switches became one table to make room.
- **A link adds its pack at once** and opens its list with "Added from a link." and Remove in More, instead of asking first: a pack can only add one list, and removing it is one tap.

## Catalogue data owed (for the sourcing branch)

- **Clementi Op. 42**: all 76 are titled "Clementi's Art of Playing on the Piano Forte: Movement k" (ids `mutopia-1938-1` to `-78`, 19 and 66 absent). The lesson names (the 1801 edition names each by its composer or form) are not in the cached Mutopia page; they need the `.ly` or the scan. 17 of the 76 are fragments of 4 to 12 bars.
- **Czerny Op. 840** as studies: `scripts/library/kind.ts` now makes a title naming "Melodische Übungsstücke" or "Melodic Study" a `study` (and "Übungsstücke" a study form); a `reanalyse.mjs` run and a publish carry it to the live catalogue. Until then the ten list as pieces with a level.
- **Hanon and Czerny Op. 821 titles** ("Movement k", "160 Eight-Measure Exercises, No. 4") and the French Op. 68 titles are named in the packs; the catalogue could carry "No. k" itself.

## Not done

- **Today**: a pack's next item as a `nextUp()` candidate waits for practice-path phase 2 (`piano-wt-path2`).
- **The `packs/` folder in the public repo** with a CI validator and an index page (K2's second half): `parsePack` and `unknown` are the validator; the folder, the CI step and the page are not built.
- **Universal links**: a pack link opens Safari, not the iPad app, until Associated Domains are set up.
- **Generated packs** (the syllabus as drills, Read stages in order) and the ladder's levels as packs: the format takes them; none ships.
- Not checked on the iPad.
