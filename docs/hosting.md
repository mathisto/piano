# Hosting the big library

The app (`dist/`) and the library corpus are separate on quartz: `/opt/piano/dist` (scripts/deploy.sh) and `/opt/piano/corpus` (scripts/deploy-library.sh). Both sit behind the Cloudflare tunnel and Caddy at pianoforte.mattkelly.io. The corpus is served at `/corpus/`:

```
/corpus/catalog.json      the catalogue (src/catalog-types.ts); replaced on every publish
/corpus/LICENSES.md       every piece and its licence
/corpus/p/<sha16>.mid     one file per piece, named by its content: never changes, never deleted
/corpus/p/<sha16>.mxl
```

The web app fetches `/corpus/` on its own origin. The iPad app's origin is `capacitor://localhost`, so it fetches `https://pianoforte.mattkelly.io/corpus/` and needs CORS. Requests are plain GETs with no custom headers, so there is no preflight; `Access-Control-Allow-Origin *` is enough.

## Caddy (applied on quartz 2026-10-27)

The Caddyfile on quartz was edited on 2026-10-27 and the block shape changed: the live site block now holds `handle_path /corpus/*` for the corpus and a `handle { ... }` for the app, with the security `header` block shared above them. The previous Caddyfile is `/etc/caddy/Caddyfile.bak-<stamp>`; restore it if a reload misbehaves. The snippet below is the corpus part.

Inside the existing site block for pianoforte.mattkelly.io, before the app's `file_server`:

```
handle_path /corpus/* {
	root * /opt/piano/corpus
	encode zstd gzip
	header Access-Control-Allow-Origin *
	@pieces path /p/*
	header @pieces Cache-Control "public, max-age=31536000, immutable"
	@catalog path /catalog.json
	header @catalog Cache-Control "no-cache"
	file_server
}
```

- `handle_path` strips `/corpus`, so the matchers see `/p/...` and `/catalog.json`.
- `file_server` sends `ETag` and `Last-Modified` and answers `If-None-Match` with 304. `no-cache` makes the browser revalidate the catalogue every time (src/catalog.ts fetches it with `cache: 'no-cache'`), so an unchanged catalogue costs a 304.
- `encode` compresses `catalog.json` and `LICENSES.md`. MIDI is small and `.mxl` is already a zip, so they go as they are. If the pipeline writes `catalog.json.br`, add `precompressed br zstd gzip` to `file_server` to serve brotli.
- Reload with `caddy reload` (or `systemctl reload caddy`), then check: `curl -sI https://pianoforte.mattkelly.io/corpus/catalog.json` shows `access-control-allow-origin: *`, `cache-control: no-cache` and an `etag`; a `p/` file shows `immutable`.

## Cloudflare

Two cache rules on the zone (Caching > Cache Rules), in this order:

1. `http.host eq "pianoforte.mattkelly.io" and starts_with(http.request.uri.path, "/corpus/p/")`: Eligible for cache; Edge TTL and Browser TTL "use cache-control header from origin". By default Cloudflare caches `.mid` but not `.mxl`, so the rule is needed for MusicXML.
2. `http.host eq "pianoforte.mattkelly.io" and http.request.uri.path eq "/corpus/catalog.json"`: Bypass cache, so a publish is visible at once. Cloudflare passes `If-None-Match` through and keeps the ETag (weakened when it recompresses), so revalidation still ends in a 304.

Nothing to purge after a publish: piece names change when their content does, and the catalogue is not cached at the edge.

## Publishing a corpus

The live corpus is 2,241 pieces (748 Mutopia, 1,299 OpenScore Lieder, 194 Chopin first editions; graded 1 to 5; `docs/changes/libgrow.md`, `lieder-year.md`, `kern.md`). Each step reads and writes `.cache/library/` directories; none touches quartz until the last.

1. Build. `npm run library:build` writes `.cache/library/out` (the Mutopia set). It now ships every grade with no limit (`--grades` and `--limit` still narrow it); the grown run was `--set mutopia --out .cache/library/out-m-grow --merge-with <published out>`, then `--set lieder --out .cache/library/out-grow --merge-with .cache/library/out-m-grow`, and a warm rerun takes about 80 s. `npm run library:build -- --set lieder --out .cache/library/out-lieder --merge-with <published out>` adds the Lieder on top of an output and leaves every base piece untouched (docs/changes/lieder.md). `node scripts/library/repeats-patch.mjs --from <published out> --out <dir>` re-runs only the pieces flagged `repeats` (docs/changes/repeats.md).
2. Combine, when the changes came from different runs. `node scripts/library/combine.mjs <base-out> <overlay-out> <result-out>` lays the overlay over the base: a piece in both takes the overlay's entry (new file, sha, bars, flags), every `p/` file from both is kept (files are content-addressed, so nothing is removed), `LICENSES.md` follows the new file names, and `built` is recomputed from what ships so clients refetch. It prints the piece count and how many came from the overlay.
3. Nothing to hold back by hand. `refusals()` in `scripts/library/lib.mjs` refuses any piece whose composer died after 1930 and in or before 1955 unless its id is in `scripts/library/published-by-1930.json` with one line of evidence (21 are listed; a Mutopia work by page id, `mutopia-N`). That applies to every set. `scripts/library/hold-lieder.json` is a record of the 36 Lieder an earlier run had shipped; a test (`src/library-pipeline.test.ts`) checks that none is allow-listed. 278 more Lieder wait for a first-publication year (docs/changes/libgrow.md, Open). Check the piece count in the build's summary against what you expect before publishing.
4. Publish. `LIBRARY_OUT=<result-out> scripts/deploy-library.sh` (below), then the `curl` checks under Caddy.

## Publish script

`scripts/deploy-library.sh` (not run by CI) copies new `p/` files with `--ignore-existing`, then `LICENSES.md`, then writes `catalog.json` last by an atomic rename. It never deletes a piece. `LIBRARY_OUT=<dir>` publishes another output, for example a `--merge-with` build (docs/changes/lieder.md). To withdraw one, remove it from the catalogue and publish; for a takedown, also delete its `p/` file on quartz by hand at once and purge that URL in Cloudflare (clients that hold an older catalogue then get a 404 for it and say it could not be loaded).
