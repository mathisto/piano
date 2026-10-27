// The big library's catalogue: catalog.json, written by the pipeline (scripts/library/) and read by the app (src/catalog.ts).

export interface Catalog {
  v: 1
  built: string
  composers: { name: string; born?: number; died: number }[]
  licences: { id: string; url: string }[]
  aliases?: Record<string, string>
  pieces: Piece[]
}

export interface Piece {
  id: string
  title: string
  composer: number
  opus?: string
  fifths: number
  keys?: number[]
  meter: string
  bars: number
  sec: number
  bpm: number
  notes: number
  lo: number
  hi: number
  tracks: number
  pick?: { tracks: number[]; hands: Record<number, 'R' | 'L'> }
  grade: number
  gradeWhy: number[]
  gradeOverride?: number
  tags: string[]
  source: 'mutopia' | 'openscore-lieder' | 'pdmx'
  sourceUrl: string
  licenceEvidence: string
  licence: number
  edition: string
  typesetter?: string
  arranger?: string
  nc?: true
  quality: number
  flags: string[]
  format: 'midi' | 'musicxml'
  file: string /* p/<sha16>.mid|.mxl */
  bytes: number
  sha256: string
}
