import { noteName } from './spell'

export interface MidiMsg {
  on: boolean
  p: number
  v: number // 0..1
  ts: number // performance.now() clock
  virtual?: boolean // from the computer keyboard or the on-screen keys, not a piano
}

export interface Input {
  id: string
  name: string
}

type Handler = (m: MidiMsg) => void

/** What the keyboard last sent, so the app can show that notes are arriving. */
export const monitor = { n: 0, text: '' }

let access: MIDIAccess | undefined
let handler: Handler = () => {}
let pedalHandler: (down: boolean) => void = () => {}
let want = ''

export const midiSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator

export function onMidi(h: Handler) {
  handler = h
}

export function onPedal(h: (down: boolean) => void) {
  pedalHandler = h
}

export function inputs(): Input[] {
  return access ? [...access.inputs.values()].filter((i) => i.state === 'connected').map((i) => ({ id: i.id, name: i.name ?? i.id })) : []
}

function bind() {
  if (!access) return
  for (const i of access.inputs.values()) {
    i.onmidimessage = !want || want === i.id ? msg : null
  }
}

function msg(e: MIDIMessageEvent) {
  const d = e.data
  if (!d || d.length < 3) return // active sensing and clock ticks are one byte
  const s = d[0] & 0xf0
  // Some drivers stamp 0 or a stale clock; a bad stamp would make every press land far from its note.
  const now = performance.now()
  const ts = e.timeStamp > 0 && e.timeStamp <= now + 50 && now - e.timeStamp < 1500 ? e.timeStamp : now
  if (s === 0x90 && d[2] > 0) {
    monitor.n++
    monitor.text = `note on ${noteName(d[1])}, velocity ${d[2]}`
    handler({ on: true, p: d[1], v: d[2] / 127, ts })
  } else if (s === 0x80 || s === 0x90) {
    monitor.n++
    monitor.text = `note off ${noteName(d[1])}`
    handler({ on: false, p: d[1], v: 0, ts })
  } else if (s === 0xb0 || s === 0xe0 || s === 0xc0) {
    monitor.n++
    if (s === 0xb0 && d[1] === 64) pedalHandler(d[2] >= 64)
    monitor.text = s === 0xb0 ? `controller ${d[1]} = ${d[2]}` : s === 0xc0 ? 'program change' : 'pitch bend'
  }
}

export function chooseInput(id: string) {
  want = id
  bind()
}

/** Resolves with the connected inputs; rejects with a reason a human can act on. */
export async function connect(onChange: () => void): Promise<Input[]> {
  if (!midiSupported) throw new Error('This browser has no Web MIDI. Use Chrome, Edge or Firefox on a computer.')
  try {
    access = await navigator.requestMIDIAccess()
  } catch {
    throw new Error('MIDI access was blocked. Allow it in the address bar, then reload.')
  }
  access.onstatechange = () => {
    bind()
    onChange()
  }
  bind()
  return inputs()
}

// Computer keyboard as a stand-in piano: bottom row white keys, row above black keys.
const KEYMAP: Record<string, number> = {}
'awsedftgyhujkolp;'.split('').forEach((k, i) => (KEYMAP[k] = 60 + i))
let shift = 0

export function typingKeyboard() {
  const down = new Set<string>()
  addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /INPUT|SELECT|TEXTAREA|BUTTON/.test(t.tagName)) return
    if (e.key === 'z') shift = Math.max(-24, shift - 12)
    if (e.key === 'x') shift = Math.min(24, shift + 12)
    const p = KEYMAP[e.key]
    if (p === undefined || down.has(e.key)) return
    down.add(e.key)
    handler({ on: true, p: p + shift, v: 0.75, ts: performance.now(), virtual: true })
  })
  addEventListener('keyup', (e) => {
    const p = KEYMAP[e.key]
    if (p === undefined || !down.delete(e.key)) return
    handler({ on: false, p: p + shift, v: 0, ts: performance.now(), virtual: true })
  })
}
