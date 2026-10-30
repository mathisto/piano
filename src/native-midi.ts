// In the iPad app (a Capacitor web view) WebKit has no Web MIDI, so fake it on top of the native CoreMidi
// plugin (ios/App/App/PianoNative.swift). Imported first in main.ts: midi.ts reads `requestMIDIAccess` when it loads.
// Elsewhere (desktop browsers) this does nothing, and @capacitor/core never loads: it is fetched only inside the app.

interface Source {
  id: string
  name: string
}
interface Native {
  start(): Promise<{ sources: Source[] }>
  pairBluetooth(): Promise<void>
  setAwake(o: { on: boolean }): Promise<void>
  now(): Promise<{ t: number }>
  addListener(event: 'sources', cb: (d: { sources: Source[] }) => void): Promise<unknown>
  addListener(event: 'm', cb: (d: { id: string; d: number[][] }) => void): Promise<unknown> // [host ms, status, data1, data2]
}
interface Port extends Source {
  state: 'connected' | 'disconnected'
  onmidimessage: ((e: { data: Uint8Array; timeStamp: number }) => void) | null
}

/** Running in the iPad app: the same test as Capacitor.isNativePlatform() in @capacitor/core (its iOS branch), without loading it. */
export const native = !!(globalThis as { webkit?: { messageHandlers?: { bridge?: unknown } } }).webkit?.messageHandlers?.bridge

const inputs = new Map<string, Port>()
const access = { inputs, onstatechange: null as null | ((e: unknown) => void) }
const sync = (list: Source[]) => {
  const live = new Set(list.map((s) => s.id))
  for (const p of inputs.values()) if (!live.has(p.id)) p.state = 'disconnected'
  for (const s of list) {
    const p = inputs.get(s.id)
    if (p) Object.assign(p, { name: s.name, state: 'connected' })
    else inputs.set(s.id, { ...s, state: 'connected', onmidimessage: null })
  }
  access.onstatechange?.({})
}

/** performance.now() minus the native clock, from [page before, native, page after] samples: the one with the shortest round trip, off by half of it at most. */
export function offsetOf(samples: [number, number, number][]): number | undefined {
  const best = samples.reduce<[number, number, number] | undefined>((b, s) => (!b || s[2] - s[0] < b[2] - b[0] ? s : b), undefined)
  return best && (best[0] + best[2]) / 2 - best[1]
}

let offset: number | undefined
let syncing = false
async function syncClock(n: Native) {
  if (syncing) return
  syncing = true
  try {
    const s: [number, number, number][] = []
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now()
      const { t } = await n.now()
      s.push([t0, t, performance.now()])
    }
    if (offset === undefined) console.info(`MIDI clock: offset ${offsetOf(s)?.toFixed(2)} ms, round trip ${Math.min(...s.map((x) => x[2] - x[0])).toFixed(2)} ms`) // the first sync, for a console-attached launch
    offset = offsetOf(s)
  } finally {
    syncing = false
  }
}

const plugin = native
  ? import('@capacitor/core').then(({ registerPlugin }) => {
      const n = registerPlugin<Native>('CoreMidi')
      void n.addListener('sources', (d) => sync(d.sources))
      void n.addListener('m', (d) => {
        const port = inputs.get(d.id)
        if (!port?.onmidimessage) return
        const at = performance.now()
        for (const [t, ...m] of d.d) {
          // the key went down at its packet's host time, on the page's clock: a busy main thread no longer makes it late
          let timeStamp = offset === undefined ? at : t + offset
          if (timeStamp > at + 1 || at - timeStamp > 500) {
            timeStamp = at // the clocks have moved apart (the host clock stops in sleep): arrival time until they are synced again
            void syncClock(n).catch(() => {})
          }
          port.onmidimessage({ data: Uint8Array.from(m), timeStamp })
        }
      })
      void syncClock(n).catch(() => {}) // no offset yet: arrival times
      setInterval(() => void syncClock(n).catch(() => {}), 30_000)
      return n
    })
  : undefined

/** Apple's Bluetooth MIDI sheet: lists the keyboards in range and pairs one on a tap. The app only. */
export const pairBluetooth = () => void plugin?.then((n) => n.pairBluetooth()).catch((e) => console.warn('Bluetooth pairing', e))

let awake = false
/** Keep the screen on while a run plays; normal auto-lock otherwise. The app only (a browser tab has no say). */
export function setAwake(on: boolean) {
  if (on === awake || !plugin) return
  awake = on
  plugin.then((n) => n.setAwake({ on })).catch(() => {}) // an older app build without it: the screen just follows auto-lock
}

if (plugin && !Reflect.has(navigator, 'requestMIDIAccess')) {
  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: async () => {
      sync((await (await plugin).start()).sources)
      return access
    },
  })

  // main.ts auto-connects when the midi permission is already granted; native MIDI has no prompt
  const perms = navigator.permissions
  const query = perms?.query.bind(perms)
  if (perms && query) {
    perms.query = ((d: PermissionDescriptor) =>
      (d as { name: string }).name === 'midi' ? Promise.resolve({ state: 'granted' } as PermissionStatus) : query(d)) as typeof perms.query
  }
}
