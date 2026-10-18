export interface MidiMsg {
  on: boolean
  p: number
  v: number // 0..1
  ts: number // performance.now() clock
}

export interface Input {
  id: string
  name: string
}

type Handler = (m: MidiMsg) => void

let access: MIDIAccess | undefined
let handler: Handler = () => {}
let want = ''

export const midiSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator

export function onMidi(h: Handler) {
  handler = h
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
  if (!d || d.length < 3) return
  const s = d[0] & 0xf0
  if (s === 0x90 && d[2] > 0) handler({ on: true, p: d[1], v: d[2] / 127, ts: e.timeStamp })
  else if (s === 0x80 || s === 0x90) handler({ on: false, p: d[1], v: 0, ts: e.timeStamp })
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
    handler({ on: true, p: p + shift, v: 0.75, ts: e.timeStamp })
  })
  addEventListener('keyup', (e) => {
    const p = KEYMAP[e.key]
    if (p === undefined || !down.delete(e.key)) return
    handler({ on: false, p: p + shift, v: 0, ts: e.timeStamp })
  })
}
