// The big library's catalogue: catalog.json, written by the pipeline (scripts/library/) and read by the app (src/catalog.ts).

export interface Catalog {
  v: 1
  built: string
  incipits?: string // i/<sha16>.json: the first three bars of every piece, compact (src/incipit.ts); the covers' notes
  composers: { name: string; born?: number; died: number; period?: Period }[]
  licences: { id: string; url: string }[]
  aliases?: Record<string, string>
  pieces: Piece[]
}

export type Period = 'baroque' | 'classical' | 'romantic' | 'modern' // from the composer's birth year (scripts/library/kind.ts)
export type Form = 'study' | 'prelude' | 'fugue' | 'invention' | 'sonata' | 'variations' | 'suite' | 'nocturne' | 'ballade' | 'impromptu' | 'scherzo' | 'rondo' | 'march' | 'dance' | 'song' | 'toccata' | 'character'

export interface Piece {
  id: string
  title: string
  composer: number
  opus?: string
  fifths: number
  mode?: 'major' | 'minor' // only when the source states it (MusicXML <mode>, a MIDI key event): absent for a key that is only estimated
  keys?: number[]
  meter?: string // only when the source states it (a MusicXML <time>, a MIDI time-signature event): a MIDI with none is quantized as 4/4 and the cover must not say so
  bars: number
  sec: number
  bpm: number
  tempo?: number // quarter-note bpm the app plays at instead of the file's own (a MusicXML score that names none too): from the .ly's tempo word or the score's form (a guess, flagged 'tempo-estimated') or its metronome mark; the file is unchanged, so its sha256 and any copy kept on a device stay valid
  pickup?: number // quarter notes in the short first bar, read from the .ly (0 = it states none); the app lays its barlines from it instead of guessing them from the notes. Absent: the guess stays
  notes: number
  lo: number
  hi: number
  tracks: number
  pick?: { tracks: number[]; hands: Record<number, 'R' | 'L'> }
  kind?: 'accomp' | 'study' | 'fragment' // absent: a piece. accomp: a Lied (the piano part under a voice); study: Hanon and the like, off the ladder; fragment: under 16 bars or flagged length or bar-length
  form?: Form // from the title, when it names one
  grade: number
  gradeWhy: number[]
  gradeOverride?: number
  tags: string[]
  source: 'mutopia' | 'openscore-lieder' | 'pdmx' | 'chopin' | 'github'
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
