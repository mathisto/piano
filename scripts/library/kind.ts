// What the Songs page sorts by besides the grade (docs/research/library-and-profile.md, 4.4 and 5.3): the kind of a piece, its period and its form.
// Cheap rules over what the pipeline already holds (the Song, the tags, the flags, the title, the composer's dates); every threshold is a starting point,
// checked by hand on the catalogue (docs/changes/library-c1-s1.md) and pinned by fixtures in src/library-pipeline.test.ts.
import type { Form, Period, Piece } from '../../src/catalog-types'

/** The composer's period from the birth year (the dates are all the catalogue has): before 1720 Baroque, to 1785 Classical (Beethoven, b. 1770), to 1859 Romantic, later Modern
 *  (Debussy, Satie, Rachmaninoff, Bartok). A composer with no birth year is placed by the death year less 60. */
export function periodOf(c: { born?: number; died: number }): Period {
  const b = c.born ?? c.died - 60
  return b < 1720 ? 'baroque' : b < 1785 ? 'classical' : b < 1860 ? 'romantic' : 'modern'
}

// ordered: the first rule that matches the title wins, so the specific forms come before the broad ones ("Prelude and Fugue" is a prelude)
const FORMS: [Form, RegExp][] = [
  ['study', /\b(etude|etudes|study|studies|studie|exercise|exercises|ubung|ubungen|ubungsstuck|ubungsstucke)\b/],
  ['prelude', /\b(prelud\w*|praelud\w*|praeambulum)\b/],
  ['fugue', /\b(fug\w+|fuga)\b/],
  ['invention', /\b(invention|inventio|sinfonia)\b/],
  ['sonata', /\b(sonat\w+)\b/],
  ['variations', /\b(variations?|variationen|variazioni|theme and)\b/],
  ['suite', /\b(suite|partita|overture|ouverture)\b/],
  ['nocturne', /\bnocturne\b/],
  ['ballade', /\bballade\b/],
  ['impromptu', /\bimpromptu\b/],
  ['scherzo', /\bscherzo\b/],
  ['rondo', /\b(rondo|rondeau)\b/],
  ['march', /\b(march|marsch|marche)\b/],
  ['dance', /\b(minuet\w*|menuet\w*|waltz\w*|walzer|valse|gavotte|gigue|jig|sarabande|allemande|courante|bourree|polonaise|mazurka|landler|ecossaise|polka|tarantella|galop|hornpipe|musette|rigaudon|passepied|loure|canarie|pavane|tango|bolero|contredanse|anglaise|czardas|csardas|dance|danse|tanz|tanze|rag|cakewalk|gopak|hopak|reel|sicilienne|siciliana|siciliano|forlane|gaillarde|galliard)\b/],
  ['song', /\b(song|lied|lieder|romance|romanze|melody|melodie|air|aria|berceuse|lullaby|barcarolle|barcarole|chanson|cradle|ave maria|ballad|cantabile|hymn|chorale|choral)\b/],
  ['toccata', /\b(toccata|fantasi\w+|fantasy|rhapsody|rhapsodie|capriccio|caprice)\b/],
  ['character', /\b(bagatelle|arabesque|intermezzo|album|moment|novelette|scene|scenes|kinderszenen|humoresque|elegy|elegie|serenade|reverie|pastorale|pastoral|fairy|dream|bird|waves|bells|prayer|rose)\b/],
]

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** The form a title names, if it names one: "Sonatina in C, Op. 36 No. 1: Allegro" is a sonata, "Minuet in G" a dance. */
export function formOf(title: string): Piece['form'] {
  const t = fold(title)
  return FORMS.find(([, re]) => re.test(t))?.[0]
}

/** Study books whose Mutopia style is not Technique, by title: Czerny's 50 melodic studies, Op. 840 (owner, 1 Nov 2026: studies, with Hanon and Op. 821). */
const STUDY_BOOKS = /\b(melodische ubungsstucke|melodic study)\b/

/** `accomp`: a Lied (the vocal line is folded or dropped, the piano part is the accompaniment); `study`: a piece tagged technique (Hanon, the Virtuoso Pianist, the Eight-Measure
 *  Exercises); `fragment`: under 16 bars or under 10 seconds; otherwise a piece (no field). A rule that called any piece of one repeated figure a study was tried on the
 *  catalogue and took Bach's C major Prelude and Chopin's Op. 28 No. 8, which are repertoire, so it is not here (docs/changes/library-c1-s1.md). The plan's other fragment
 *  rule, the bar-length flag, marks 60 full Chopin works whose bars are uneven, so it is not here either. */
export function kindOf(o: { source: Piece['source']; tags: string[]; bars: number; sec: number; title?: string }): Piece['kind'] {
  if (o.source === 'openscore-lieder') return 'accomp'
  if (o.tags.includes('technique') || STUDY_BOOKS.test(fold(o.title ?? ''))) return 'study'
  if (o.bars < 16 || o.sec < 10) return 'fragment'
  return undefined
}
