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
  addListener(event: 'sources', cb: (d: { sources: Source[] }) => void): Promise<unknown>
  addListener(event: 'm', cb: (d: { id: string; d: number[][]; age: number }) => void): Promise<unknown>
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

const plugin = native
  ? import('@capacitor/core').then(({ registerPlugin }) => {
      const n = registerPlugin<Native>('CoreMidi')
      void n.addListener('sources', (d) => sync(d.sources))
      void n.addListener('m', (d) => {
        const port = inputs.get(d.id)
        if (!port?.onmidimessage) return
        // native sends how long ago the key went down; stamp it on the page's clock
        const timeStamp = performance.now() - d.age
        for (const m of d.d) port.onmidimessage({ data: Uint8Array.from(m), timeStamp })
      })
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
