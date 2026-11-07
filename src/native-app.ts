// The iPad app's side of src/native-midi.ts, loaded only inside the app: the CoreMidi plugin's events stamped on the page's
// clock, the menu bar's commands, files opened from other apps, the sound taken away, a daily backup to Files, the system text
// size, App Shortcuts and the practice reminder.
import { registerPlugin, SystemBars, SystemBarType } from '@capacitor/core'
import type { Port, Source } from './native-midi'

interface Native {
  start(): Promise<{ sources: Source[] }>
  pairBluetooth(): Promise<void>
  setPlaying(o: { on: boolean }): Promise<void>
  setAppearance(o: { theme: string }): Promise<void>
  now(): Promise<{ t: number }>
  saveBackup(o: { text: string }): Promise<void>
  textSize(): Promise<{ category: string }>
  addListener(event: 'sources', cb: (d: { sources: Source[] }) => void): Promise<unknown>
  addListener(event: 'menu', cb: (d: { key: string }) => void): Promise<unknown>
  addListener(event: 'file', cb: (d: { name: string; data: string }) => void): Promise<unknown>
  addListener(event: 'link', cb: (d: { url: string }) => void): Promise<unknown>
  addListener(event: 'textSize', cb: (d: { category: string }) => void): Promise<unknown>
  addListener(event: 'interrupt', cb: () => void): Promise<unknown>
  addListener(event: 'shortcut', cb: (d: { action: string }) => void): Promise<unknown>
  addListener(event: 'm', cb: (d: { id: string; d: number[][] }) => void): Promise<unknown> // [host ms, status, data1, data2]
}

/** performance.now() minus the native clock, from [page before, native, page after] samples: the one with the shortest round trip, off by half of it at most. */
export function offsetOf(samples: [number, number, number][]): number | undefined {
  const best = samples.reduce<[number, number, number] | undefined>((b, s) => (!b || s[2] - s[0] < b[2] - b[0] ? s : b), undefined)
  return best && (best[0] + best[2]) / 2 - best[1]
}

const n = registerPlugin<Native>('CoreMidi')

/** Only the one universal-link action the app owns; the pack parser still validates its payload. */
export function packLink(value: string): string | undefined {
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && u.hostname === 'app.pagetohand.com' && u.pathname === '/' && /^#pack=[\w-]+$/.test(u.hash) ? u.hash : undefined
  } catch {
    return undefined
  }
}

export type ShortcutAction = 'practice' | 'sight-run'
export const shortcutAction = (value: string): ShortcutAction | undefined => (value === 'practice' || value === 'sight-run' ? value : undefined)

// Apple's body sizes by content size category (Dynamic Type), in points
const BODY: Record<string, number> = { XS: 14, S: 15, M: 16, L: 17, XL: 19, XXL: 21, XXXL: 23, AccessibilityM: 28, AccessibilityL: 33, AccessibilityXL: 40, AccessibilityXXL: 47, AccessibilityXXXL: 53 }

/** The root font scale (--ts, src/style.css) for a content size category: Apple's body size over the default Large's 17 pt. Never below 1 (the type is read from a music stand at 60 to 90 cm), and 2 at most, the largest the pages are made to hold. */
export const textScale = (category: string) => Math.min(2, Math.max(1, (BODY[category.replace('UICTContentSizeCategory', '')] ?? 17) / 17))

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

/** The Appearance setting (Auto, Dark, Light) for the window: PianoNative.swift. */
export const setAppearance = (theme: string) => n.setAppearance({ theme })

export function connect(inputs: Map<string, Port>, sync: (list: Source[]) => void) {
  void n.addListener('sources', (d) => sync(d.sources))
  // opened from Files, Mail or AirDrop: into the library as a dropped file goes
  void n.addListener('file', (d) => void import('./app/library').then((l) => l.importFiles([new File([Uint8Array.from(atob(d.data), (c) => c.charCodeAt(0))], d.name)])))
  // a Messages or Mail universal link: one validated pack fragment, through the same parser as a web link
  void n.addListener('link', ({ url }) => {
    const fragment = packLink(url)
    if (fragment) void import('./app/pack-ui').then((p) => p.fromLink(fragment))
  })
  // the menu bar: one of the page's own keys (src/app/input.ts; src/menu.test.ts keeps the two lists together)
  void n.addListener('menu', ({ key }) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))
  // the system text size: one root scale for the type (src/style.css), the staff and the highway keep their own zoom
  const text = (category: string) => document.documentElement.style.setProperty('--ts', String(+textScale(category).toFixed(2)))
  void n.addListener('textSize', (d) => text(d.category))
  void n.textSize().then((d) => text(d.category)).catch(() => {})
  // a call, Siri or an alarm took the sound, or the headphones came out: src/app/play.ts pauses a run, take-ui.ts stops Listen back
  void n.addListener('interrupt', () => dispatchEvent(new Event('interrupt')))
  // App Intents only name the action; after this module's dynamic import has yielded, main.ts owns navigation and practice logic.
  void n.addListener('shortcut', ({ action }) => {
    const valid = shortcutAction(action)
    if (valid) setTimeout(() => dispatchEvent(new CustomEvent('native-shortcut', { detail: valid })))
  })
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

  // the record to Files (On My iPad > Page to Hand) half a minute after the last save, or on leaving the app with one pending
  let timer = 0
  const backup = () => {
    clearTimeout(timer)
    timer = 0
    void import('./backup')
      .then((s) => s.exportAll())
      .then((text) => n.saveBackup({ text }))
      .catch((e) => console.warn('Backup to Files', e))
  }
  void import('./sync').then((m) => m.nativeWrites(() => {
    clearTimeout(timer)
    timer = window.setTimeout(backup, 30_000)
  }))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return
    if (timer) backup()
    void import('./native-reminder').then((r) => r.scheduleReminders()) // leaving the app is when the next three are set, skipping a day practised
  })
  /** A run plays or not: auto-lock and the screen edges (PianoNative.swift), and the home indicator fades (Capacitor's SystemBars). */
  const playing = (on: boolean) => {
    void n.setPlaying({ on })
    void SystemBars[on ? 'hide' : 'show']({ bar: SystemBarType.NavigationBar })
  }
  return { n, playing } // not n itself: Capacitor's proxy answers every property, `then` too, so a promise resolved with it waits forever
}
