# The hosted web app works offline after the first visit

A service worker (`src/sw.ts`) does for the web what the bundle does for the iPad. Nothing else changed in the app.

## How it is built
- `vite.config.ts` has a small build-only plugin: it compiles `src/sw.ts` with Vite's own `transformWithOxc`, strips the `export`s (they exist for the tests) and prepends `PRECACHE` (`/` plus every file Vite built: JS, lazy chunks, CSS, fonts) and `VERSION` (sha1 of those names, 10 hex). Hashed names change with content, so a deploy with any change gets a new version; a rebuild of identical source keeps it. Output is `dist/sw.js` (about 4 KB). No dependency added.
- `src/main.ts` registers `/sw.js` only when `import.meta.env.PROD` and the protocol is `http(s):`. The iPad app is `capacitor:`, dev is not PROD, so neither registers. It then calls `registration.update()`, because browsers recheck `sw.js` on navigation only once a day.

## What is cached
`route()` in `src/sw.ts` (unit-tested in `src/sw.test.ts`). Same-origin GETs without a `Range` header only.

| request | strategy |
|---|---|
| navigation to `/` | network first; a good response replaces the cached `/`; offline, the cached `/` |
| other navigations, `/sw.js`, `/version.txt`, other origins | not touched |
| `/assets/*` (hashed), `/samples/*`, `/corpus/p/*` | cache first (names never change under their content, samples by convention) |
| `/corpus/catalog.json`, `/art/*`, `/library/*`, favicon | stale-while-revalidate |

Only status 200 is stored. `/assets/*` live in `pf-shell-<version>` (all precached at install, with `cache: 'reload'` so the HTTP cache cannot feed an old file); the rest live in `pf-data`, which survives deploys, so fetched pieces and instrument recordings are not downloaded again after an update.

## Updates
New `sw.js` installs, `skipWaiting`s, and on activate deletes every `pf-shell-*` but its own and claims open pages. The index is always network first, so a deploy shows on the next load and nobody is held on an old shell. Offline at the moment of deploy they keep the old one, which is the point.

Known edges:
- A tab open across a deploy that lazily imports an old hashed chunk after the new worker deleted the old cache goes to the network and gets a 404, the same as without a worker. A reload fixes it. No auto-reload on `controllerchange`; it could drop a practice in progress.
- Network-first on `/` has no timeout, so on a connection that hangs rather than fails, start-up waits. Add a race with the cache if that is ever seen.
- The catalogue is stale-while-revalidate, so after a corpus publish the first load still sees the old `built`; `src/catalog.ts` revalidates and keeps its own IndexedDB copy, so the next load has the new one. Pieces are content-addressed and never deleted, so a stale catalogue is safe.
- Instrument recordings are cached only as they are fetched (the piano is 4.6 MB). Offline you have the instruments you have used online. Precaching the default piano would add 4.6 MB to a first visit; not done.
- `public/samples` files are cache-first under their plain names. If a recording is ever replaced, rename it or change `DATA`'s name in `src/sw.ts`.

## Server (nothing applied; Caddy on quartz is not touched)
- `sw.js` must reach the browser fresh. Browsers already skip their HTTP cache for the worker script, but Cloudflare may hold a `.js` with no `Cache-Control` at the edge for hours (its default). Recommended in the site block, beside the corpus rules in docs/hosting.md:
  ```
  @sw path /sw.js
  header @sw Cache-Control "no-cache"
  ```
  Without it the worst case is an update delayed by the edge TTL; nothing breaks.
- `/` should also be `no-cache` (or stay uncached at the edge, as Cloudflare does for HTML by default). The worker already revalidates it with the network on every navigation.
- `scripts/deploy.sh` needs no change: `sw.js` is in `dist/` and goes with the tarball.

## Checked
- `npx tsc --noEmit`, `npx vitest run` (592 pass; `src/bundle.test.ts` budget holds, entry chunk 259 KB of 275 KB), `npm run build`.
- `scripts/offline.mjs` against `npx vite preview` in Chrome (playwright-core): first visit, the worker takes control, go offline, reload, the app boots on Today with the real title, Songs opens, a bundled piece opens (the lazy highway chunk and Pixi come from the cache), a fixture `/corpus/p/` file and `catalog.json` fetched while online come back offline, an unseen URL fails fast, no page errors. Without a worker the same offline reload is the browser error page.
- Update: a rebuild with a changed stylesheet, then a reload: a new `pf-shell-<version>` replaces the old one and `pf-data` stays.
- `npm run dev` serves and does not register (PROD only).

Not checked: Safari/WebKit, Firefox, a phone, the real Caddy and Cloudflare chain (header advice above is from their documented defaults), a real corpus (a two-file fixture stood in), a deploy over hours.
