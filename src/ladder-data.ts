/** The repertoire ladder: per Path level, well-known teaching pieces from the library (ids in the catalogue; `why` is one short phrase). */
export interface Rung {
  level: number
  id: string
  why: string
}

export const LADDER: Rung[] = [
  { level: 1, id: 'mutopia-75', why: 'The first Bach most players meet' },
  { level: 1, id: 'mutopia-647', why: 'A singing right hand over a quiet left' },
  { level: 1, id: 'mutopia-1806', why: 'A march: steady beat, small hand shifts' },

  { level: 2, id: 'mutopia-202', why: 'Even legato in a flowing right hand' },
  { level: 2, id: 'mutopia-79', why: 'A Bach dance over a drone bass' },
  { level: 2, id: 'mutopia-37', why: 'Slow chords and a floating melody' },
  { level: 2, id: 'mutopia-469', why: 'Chopin on one page of steady chords' },

  { level: 3, id: 'mutopia-232', why: 'Your first sonatina movement' },
  { level: 3, id: 'mutopia-203', why: 'Quick, light, even finger work' },
  { level: 3, id: 'mutopia-470', why: 'A tiny Chopin prelude with a lilt' },
  { level: 3, id: 'mutopia-67', why: 'Two voices, one in each hand' },

  { level: 4, id: 'mutopia-931', why: 'The famous repeated-note theme' },
  { level: 4, id: 'mutopia-998', why: 'Mozart: clean scales over an Alberti bass' },
  { level: 4, id: 'mutopia-263', why: 'Ragtime syncopation over a steady left' },
  { level: 4, id: 'mutopia-468', why: 'A slow melody over pulsing chords' },

  { level: 5, id: 'mutopia-23', why: 'The rag that started it all, left-hand leaps' },
  { level: 5, id: 'mutopia-276-3', why: 'Fast arpeggios and a big finish' },
  { level: 5, id: 'mutopia-1888', why: 'Speed built from a slow-growing theme' },
  { level: 5, id: 'mutopia-295', why: 'A long singing line with inner voices' },
]
