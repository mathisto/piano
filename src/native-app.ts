// The iPad app's side of src/native-midi.ts, loaded only inside the app: the CoreMidi plugin's events stamped on the page's
// clock, files opened from other apps, and a daily backup to Files.
import { registerPlugin } from '@capacitor/core'
import { onWrite } from './kv'
import type { Port, Source } from './native-midi'

interface Native {
  start(): Promise<{ sources: Source[] }>
  pairBluetooth(): Promise<void>
  setAwake(o: { on: boolean }): Promise<void>
  now(): Promise<{ t: number }>
  saveBackup(o: { text: string }): Promise<void>
  addListener(event: 'sources', cb: (d: { sources: Source[] }) => void): Promise<unknown>
  addListener(event: 'file', cb: (d: { name: string; data: string }) => void): Promise<unknown>
  addListener(event: 'm', cb: (d: { id: string; d: number[][] }) => void): Promise<unknown> // [host ms, status, data1, data2]
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

export function connect(inputs: Map<string, Port>, sync: (list: Source[]) => void) {
  const n = registerPlugin<Native>('CoreMidi')
  void n.addListener('sources', (d) => sync(d.sources))
  // opened from Files, Mail or AirDrop: into the library as a dropped file goes
  void n.addListener('file', (d) => void import('./app/library').then((l) => l.importFiles([new File([Uint8Array.from(atob(d.data), (c) => c.charCodeAt(0))], d.name)])))
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

  // the record to Files (On My iPad > Piano Forte) half a minute after the last save, or on leaving the app with one pending
  let timer = 0
  const backup = () => {
    clearTimeout(timer)
    timer = 0
    void import('./store')
      .then((s) => s.exportAll())
      .then((text) => n.saveBackup({ text }))
      .catch((e) => console.warn('Backup to Files', e))
  }
  onWrite(() => {
    clearTimeout(timer)
    timer = window.setTimeout(backup, 30_000)
  })
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && timer && backup())
  return n
}
