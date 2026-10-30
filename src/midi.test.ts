import { beforeAll, expect, it, vi } from 'vitest'

const bt = { id: 'bt-uid', name: 'FP-10 Bluetooth', state: 'connected', onmidimessage: null as unknown }
const access = { inputs: new Map([[bt.id, bt]]), onstatechange: null }
const ask = vi.fn(async () => access)
vi.stubGlobal('navigator', { requestMIDIAccess: ask })
let midi: typeof import('./midi')
beforeAll(async () => {
  midi = await import('./midi')
  await midi.connect(() => {})
})

it('listens to every keyboard when the saved one is not plugged in, and only to it when it is', () => {
  midi.chooseInput('usb-uid') // settings.device from an earlier USB session
  expect(bt.onmidimessage).not.toBeNull()
  const usb = { id: 'usb-uid', name: 'FP-10', state: 'connected', onmidimessage: null as unknown }
  access.inputs.set(usb.id, usb)
  midi.chooseInput('usb-uid')
  expect(usb.onmidimessage).not.toBeNull()
  expect(bt.onmidimessage).toBeNull()
  access.inputs.delete(usb.id)
  midi.chooseInput('usb-uid')
})

it('a second Connect reuses the MIDI access', async () => {
  await midi.connect(() => {})
  expect(ask).toHaveBeenCalledTimes(1)
})

it('the pedal goes down at 64 and up only below 40', () => {
  const seen: boolean[] = []
  midi.onPedal((d) => seen.push(d))
  for (const v of [50, 64, 50, 40, 39, 63, 20, 64]) midi.feed([0xb0, 64, v])
  expect(seen).toEqual([true, false, true])
})
