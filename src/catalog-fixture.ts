import type { Catalog, Piece } from './catalog-types'

// A made-up catalogue of n pieces for the search test and the dev hook (__piano.catalog); nothing here is real data.

const COMPOSERS: [string, number, number][] = [
  ['Johann Sebastian Bach', 1685, 1750], ['Carl Czerny', 1791, 1857], ['Friedrich Burgmüller', 1806, 1874], ['Robert Schumann', 1810, 1856],
  ['Frédéric Chopin', 1810, 1849], ['Antonín Dvořák', 1841, 1904], ['Béla Bartók', 1881, 1945], ['Gabriel Fauré', 1845, 1924],
  ['Erik Satie', 1866, 1925], ['Edvard Grieg', 1843, 1907], ['Anton Diabelli', 1781, 1858], ['Muzio Clementi', 1752, 1832],
  ['Ludwig van Beethoven', 1770, 1827], ['Wolfgang Amadeus Mozart', 1756, 1791], ['Franz Schubert', 1797, 1828], ['Pyotr Ilyich Tchaikovsky', 1840, 1893],
]
const FORMS = ['Minuet', 'Étude', 'Prelude', 'Waltz', 'Sonatina', 'Nocturne', 'Mazurka', 'Bagatelle', 'Arabesque', 'Lied ohne Worte', 'Scherzo', 'Gavotte', 'Écossaise', 'Polonaise', 'Romance', 'Invention']
const KEYS = ['C major', 'G major', 'A minor', 'F major', 'D minor', 'E minor', 'B-flat major', 'D major']
const TAGS = ['etude', 'dance', 'lyrical', 'baroque', 'romantic', 'classical', 'scales', 'left hand', 'legato', 'staccato']

export function synthetic(n: number): Catalog {
  let seed = 7
  const rnd = (k: number) => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) >>> 12) % k
  const pieces = Array.from({ length: n }, (_, i): Piece => {
    const c = rnd(COMPOSERS.length)
    const grade = 1 + rnd(8)
    const bars = 8 + rnd(120)
    return {
      id: `syn-${i}`,
      title: `${FORMS[rnd(FORMS.length)]} in ${KEYS[rnd(KEYS.length)]}${rnd(3) ? '' : `, No. ${1 + rnd(24)}`}`,
      composer: c,
      opus: rnd(4) ? `Op. ${1 + rnd(120)} No. ${1 + rnd(12)}` : undefined,
      fifths: rnd(9) - 4,
      meter: ['4/4', '3/4', '2/4', '6/8'][rnd(4)],
      bars,
      sec: bars * (2 + rnd(3)),
      bpm: 60 + rnd(80),
      notes: bars * (4 + grade * 2),
      lo: 36 + rnd(12),
      hi: 72 + rnd(16),
      tracks: 1,
      grade,
      gradeWhy: [],
      tags: [TAGS[rnd(TAGS.length)], TAGS[rnd(TAGS.length)]],
      source: rnd(5) ? 'mutopia' : 'pdmx',
      sourceUrl: `https://example.org/piece/${i}`,
      licenceEvidence: `https://example.org/piece/${i}`,
      licence: rnd(3),
      edition: 'Synthetic',
      typesetter: 'Test Typesetter',
      quality: rnd(100) / 100,
      flags: [],
      format: 'midi',
      file: `p/${i.toString(16).padStart(16, '0')}.mid`,
      bytes: 4000,
      sha256: '0'.repeat(64),
    }
  })
  return {
    v: 1,
    built: 'synthetic',
    composers: COMPOSERS.map(([name, born, died]) => ({ name, born, died })),
    licences: [
      { id: 'Public Domain', url: 'https://creativecommons.org/publicdomain/mark/1.0/' },
      { id: 'CC-BY-4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
      { id: 'CC-BY-SA-3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
    ],
    pieces,
  }
}
