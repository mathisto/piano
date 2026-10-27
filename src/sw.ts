// The service worker for the hosted web app (never registered in the iPad app, whose bundle is already on the device).
// vite.config.ts compiles this file, strips the `export`s and prepends PRECACHE (every built file) and VERSION (a hash of their names).
declare const PRECACHE: string[]
declare const VERSION: string

export const DATA = 'pf-data'
export const shellCache = (version: string) => `pf-shell-${version}`

export type Route = 'nav' | 'cache-first' | 'revalidate' | 'network'

/** How a request is served. Only same-origin GETs are touched; the index is never cached for good (network first), so a deploy is seen on the next load. */
export function route(u: URL, origin: string, navigate = false): Route {
  const p = u.pathname
  if (u.origin !== origin || p === '/sw.js' || p === '/version.txt') return 'network'
  if (navigate) return p === '/' ? 'nav' : 'network'
  // hashed build files, content-addressed corpus pieces and the instrument recordings never change under their name
  return /^\/(assets|samples|corpus\/p)\//.test(p) ? 'cache-first' : 'revalidate' // catalog.json, covers, bundled scores, favicon
}

/** Build files go with their version and are dropped with it; everything else outlives a deploy. */
export const cacheFor = (path: string, version: string) => (path.startsWith('/assets/') ? shellCache(version) : DATA)

declare const ServiceWorkerGlobalScope: unknown
if (typeof ServiceWorkerGlobalScope !== 'undefined') {
  const sw = self as any
  const keep = async (name: string, key: RequestInfo, res: Response) => {
    if (res.status === 200) await caches.open(name).then((c) => c.put(key, res.clone()))
    return res
  }
  const cached = (req: Request) => caches.match(req, { ignoreVary: true })

  sw.addEventListener('install', (e: any) =>
    e.waitUntil(
      caches
        .open(shellCache(VERSION))
        .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
        .then(() => sw.skipWaiting()),
    ),
  )
  sw.addEventListener('activate', (e: any) =>
    e.waitUntil(
      caches
        .keys()
        .then((ks) => Promise.all(ks.filter((k) => k.startsWith('pf-shell-') && k !== shellCache(VERSION)).map((k) => caches.delete(k))))
        .then(() => sw.clients.claim()),
    ),
  )
  sw.addEventListener('fetch', (e: any) => {
    const req: Request = e.request
    if (req.method !== 'GET' || req.headers.has('range')) return
    const url = new URL(req.url)
    const how = route(url, sw.location.origin, req.mode === 'navigate')
    if (how === 'network') return
    const name = cacheFor(url.pathname, VERSION)
    e.respondWith(
      (async () => {
        if (how === 'nav') return fetch(req).then((r) => keep(shellCache(VERSION), '/', r)).catch(async () => (await caches.match('/')) ?? Response.error())
        const hit = await cached(req)
        if (how === 'cache-first') return hit ?? keep(name, req, await fetch(req))
        const net = fetch(req).then((r) => keep(name, req, r))
        if (!hit) return net
        e.waitUntil(net.catch(() => {}))
        return hit
      })(),
    )
  })
}
