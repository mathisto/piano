import { expect, it } from 'vitest'
import { earNote, earTap, newEar } from './ear-play'
import { pulseTap } from './pulse-play'
import { settings } from './settings'
import type { TCard } from './theory-cards'

it('rhythm, pulse and answer taps have the calibration offset taken off, as presses in a piece do', () => {
  settings.offset = 80 // this setup runs 80 ms late
  const e = newEar()
  earTap(e, { play: { kind: 'rhythm', onsets: [0, 2, 4, 6] } } as unknown as TCard, 1000)
  pulseTap(e, { play: { mode: 'keep', want: [] } } as unknown as TCard, 2000)
  earNote(e, 60, 1500)
  expect(e.taps).toEqual([920, 1920])
  expect(e.notes).toEqual([{ p: 60, t: 1420 }])
  settings.offset = 0
})
