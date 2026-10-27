# Hosting the big library

The app (`dist/`) and the library corpus are separate on quartz: `/opt/piano/dist` (scripts/deploy.sh) and `/opt/piano/corpus` (scripts/deploy-library.sh). Both sit behind the Cloudflare tunnel and Caddy at pianoforte.mattkelly.io. The corpus is served at `/corpus/`:

```
/corpus/catalog.json      the catalogue (src/catalog-types.ts); replaced on every publish
/corpus/LICENSES.md       every piece and its licence
/corpus/p/<sha16>.mid     one file per piece, named by its content: never changes, never deleted
/corpus/p/<sha16>.mxl
```

The web app fetches `/corpus/` on its own origin. The iPad app's origin is `capacitor://localhost`, so it fetches `https://pianoforte.mattkelly.io/corpus/` and needs CORS. Requests are plain GETs with no custom headers, so there is no preflight; `Access-Control-Allow-Origin *` is enough.

## Caddy

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

## Publishing

`scripts/deploy-library.sh` (not run by CI) copies new `p/` files with `--ignore-existing`, then `LICENSES.md`, then writes `catalog.json` last by an atomic rename. It never deletes a piece. To withdraw one, remove it from the catalogue and publish; for a takedown, also delete its `p/` file on quartz by hand at once and purge that URL in Cloudflare (clients that hold an older catalogue then get a 404 for it and say it could not be loaded).
