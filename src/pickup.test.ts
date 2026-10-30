// The pickup detector on 37 Mutopia MIDI files from the pipeline's cache (.cache/library/*/p/; not in the repo, so a case with no file passes untested).
// Ground truth is the piece's own .ly (\partial). Bar counts have no empty bar after the last note (docs/changes/datafix.md). Each row: id, file, bars, pickup in quarters (0 for none), notes in bar 1.
// The detector before docs/changes/tempo2.md gets 13 of these rows wrong (pickups of 2 to 5.5 beats where there is none or an eighth, and the reverse).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { autoSelect, fromMidi, inspectMidi } from './midi-tracks'

const SAMPLE: [string, string, number, number, number][] = [
  ['mutopia-70', '602579a39b5b0e13', 60, 0.5, 2],
  ['mutopia-85', '105ad1d771fa7712', 97, 1, 1],
  ['mutopia-100-2', 'f92ba8de93f239e3', 57, 0.5, 1],
  ['mutopia-151', 'b1941eb846d10637', 41, 1, 2],
  ['mutopia-163', '15b5e41811ae48a6', 33, 0.5, 3],
  ['mutopia-185', '2460dccf81f9536e', 201, 0.5, 1],
  ['mutopia-223', '4df722747c392323', 42, 1.5, 3],
  ['mutopia-239', 'e1c05226489f5c50', 77, 0.5, 1],
  ['mutopia-378', '4af5ea2c88ce2604', 29, 1, 4],
  ['mutopia-487', '873b2934c4daaeda', 63, 2, 4],
  ['mutopia-519', '9de3cb52a3ef8a11', 34, 1, 1],
  ['mutopia-912', '3cf181311574b134', 144, 0.5, 1],
  ['mutopia-992', '7d89d43a5eba9773', 205, 0.5, 7],
  ['mutopia-1009', 'a7513a1e8d877766', 11, 0.5, 2],
  ['mutopia-1080-3', '7d07a373946a0e10', 113, 1, 3],
  ['mutopia-1276', 'ecb927974554efdf', 74, 1, 2],
  ['mutopia-4', 'e89f7d09096bbaf1', 27, 0, 8],
  ['mutopia-69', 'f054a135b9ca9925', 48, 0, 7],
  ['mutopia-128', '407d90786bcdbced', 15, 0, 27],
  ['mutopia-159', 'ee3deb64721651b2', 124, 0, 6],
  ['mutopia-192', 'a4e45b6544ed06fe', 56, 0, 7],
  ['mutopia-215', 'd28e280d333d8a97', 16, 0, 22],
  ['mutopia-241', '542717fb2462828b', 25, 0, 22],
  ['mutopia-357', '5e9d640ea30f33fa', 58, 0, 24],
  ['mutopia-474-1', 'b1708ead95c4c72e', 21, 0, 24],
  ['mutopia-496', '46ba1dba7ec7806a', 164, 0, 14],
  ['mutopia-605', '46c44b60d45df331', 86, 0, 10],
  ['mutopia-794', 'e081ef3fe7023cdf', 44, 0, 15],
  ['mutopia-963', '841f6f64113cadd8', 18, 0, 34],
  ['mutopia-1057', '9f7c19c9ea72c199', 83, 0, 6],
  ['mutopia-1379', '52ef514bf46fd437', 156, 0, 9],
  ['mutopia-1407', '8577b91b1359701d', 64, 0, 9],
  ['mutopia-1476', 'c915cfb8ab5fb3b7', 139, 0, 7],
  ['mutopia-1598', '881e7825e882d074', 108, 0, 1],
  ['mutopia-1895', '3a307179dc100e22', 67, 0, 5],
  ['mutopia-2061', '2e1c2f560c5fecf1', 8, 0, 12],
  ['mutopia-1590', 'e202d3941ce5f263', 38, 0.5, 1],
]

const find = (f: string) => (existsSync('.cache/library') ? readdirSync('.cache/library').map((d) => `.cache/library/${d}/p/${f}.mid`).find(existsSync) : undefined)

describe('pickups in cached Mutopia MIDI', () => {
  it.each(SAMPLE)('%s', (id, f, bars, pickup, first) => {
    const path = find(f)
    if (!path) return // no cache here
    const b = readFileSync(path)
    const buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
    const s = fromMidi(buf, id, id, 60, autoSelect(inspectMidi(buf)))
    expect(s.bars).toHaveLength(bars)
    expect(s.bars[0].ql ?? 0).toBe(pickup)
    expect(s.notes.filter((n) => n.bar === 0)).toHaveLength(first)
  })
})
