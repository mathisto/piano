// In the iPad app (a Capacitor web view) WebKit has no Web MIDI, so fake it on top of the native CoreMidi
// plugin (ios/App/App/PianoNative.swift). Imported first in main.ts: midi.ts reads `requestMIDIAccess` when it loads.
// Elsewhere (desktop browsers) this does nothing.

interface Source {
  id: string
  name: string
}
interface Native {
  start(): Promise<{ sources: Source[] }>
  addListener(event: 'sources', cb: (d: { sources: Source[] }) => void): Promise<unknown>
  addListener(event: 'm', cb: (d: { id: string; d: number[][]; age: number }) => void): Promise<unknown>
}
interface Port extends Source {
  state: 'connected' | 'disconnected'
  onmidimessage: ((e: { data: Uint8Array; timeStamp: number }) => void) | null
}

const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; registerPlugin: <T>(n: string) => T } }).Capacitor

if (cap?.isNativePlatform?.() && !Reflect.has(navigator, 'requestMIDIAccess')) {
  const native = cap.registerPlugin<Native>('CoreMidi')
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

  void native.addListener('sources', (d) => sync(d.sources))
  void native.addListener('m', (d) => {
    const port = inputs.get(d.id)
    if (!port?.onmidimessage) return
    // native sends how long ago the key went down; stamp it on the page's clock
    const timeStamp = performance.now() - d.age
    for (const m of d.d) port.onmidimessage({ data: Uint8Array.from(m), timeStamp })
  })

  Object.defineProperty(navigator, 'requestMIDIAccess', {
    value: async () => {
      sync((await native.start()).sources)
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
