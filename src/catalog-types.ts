// The big library's catalogue (catalog.json), written by scripts/library/pipeline.ts. Types only.

export interface Catalog {
  v: 1
  built: string // hash of the source pins (piece id + upstream sha256), so the same inputs give the same value
  composers: { name: string; born?: number; died: number }[]
  licences: { id: string; url: string }[] // id: 'Public Domain', 'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-3.0', 'MutopiaBSD', ...
  aliases?: Record<string, string>
  pieces: Piece[] // sorted by id
}

export interface Piece {
  id: string // stable, source-native: 'mutopia-75', 'lieder-lc6180725'
  title: string
  composer: number // index into composers
  opus?: string
  fifths: number // declared key signature, -7..7
  keys?: number[] // estimated key changes (fifths), when there is more than one
  meter: string // '3/4', from the first full bar
  bars: number
  sec: number
  bpm: number
  notes: number
  lo: number
  hi: number
  tracks: number // MIDI tracks with notes, or MusicXML parts
  pick?: { tracks: number[]; hands: Record<number, 'R' | 'L'> } // three or more MIDI tracks: hands pinned at ingest, pass to fromMidi
  grade: number // 1..5, gradeOverride when set
  gradeWhy: number[] // 7 terms: speed, density, chords, span, range, accidentals, rhythm
  gradeOverride?: number
  tags: string[] // 'ties', 'triplets', the source's style ('baroque')
  source: 'mutopia' | 'openscore-lieder' | 'pdmx'
  sourceUrl: string
  licenceEvidence: string // the page the licence was read from
  licence: number // index into licences
  edition: string
  typesetter?: string
  arranger?: string
  nc?: true
  quality: number // 0..100: 100 - 10 per review reason - 3 per flag
  flags: string[] // review reasons and flags, see scripts/library/pipeline.ts GATES
  format: 'midi' | 'musicxml'
  file: string // 'p/<sha256[0:16]>.mid' or '.mxl', relative to catalog.json
  bytes: number
  sha256: string
}
