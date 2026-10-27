import type { Catalog, Piece } from './catalog-types'
import { served } from './net'
// The curated library: public/library/manifest.json (built by scripts/fetch-library.mjs) and the credit text it must carry.

export interface LibraryEntry {
  id: string
  title: string
  composer: string // with dates
  collection: string // 'Mutopia Project' | 'OpenScore Lieder Corpus'
  arranger?: string
  typesetter?: string
  licence: string // 'Public Domain' | 'CC0-1.0' | 'CC-BY-4.0' | 'CC-BY-SA-2.5' ...
  licenceUrl: string
  licenceEvidence: string // the page that states the licence
  sourceUrl: string
  sourceEdition: string
  format: 'midi' | 'musicxml'
  file: string // relative to library/
  level: string // Beginner | Elementary | Intermediate
  bytes: number
  sha256: string
  nc?: true // non-commercial licence: show it in Credits
}

const valid = (e: unknown): e is LibraryEntry => {
  const x = e as Partial<LibraryEntry> | null
  return !!x && [x.id, x.title, x.composer, x.licence, x.file, x.level].every((v) => typeof v === 'string' && v) && (x.format === 'midi' || x.format === 'musicxml')
}

/** Where a library file lives, for any host: Vite dev, the static site, the Capacitor web view. */
export const libraryUrl = (file: string, base: string = document.baseURI) => new URL(`library/${file}`, base).href

/** The manifest, or [] when it cannot be fetched or read. */
export async function loadManifest(fetchFn: typeof fetch = fetch, base?: string): Promise<LibraryEntry[]> {
  try {
    const r = await fetchFn(libraryUrl('manifest.json', base))
    if (!served(r)) return []
    const list: unknown = await r.json()
    return Array.isArray(list) ? list.filter(valid) : []
  } catch {
    return []
  }
}

/** 'CC-BY-SA-2.5' -> 'CC BY-SA 2.5', 'CC0-1.0' -> 'CC0 1.0'; 'Public Domain' stays. */
export const licenceName = (l: string) => l.replace(/^CC-/, 'CC ').replace(/-(\d+(\.\d+)?)$/, ' $1')

export const SOURCE: Record<Piece['source'], string> = { mutopia: 'Mutopia Project', 'openscore-lieder': 'OpenScore Lieder Corpus', pdmx: 'PDMX', chopin: 'Fryderyk Chopin Institute (chopinscores.org)' }
const CHANGES: Record<string, string> = { 'voice-folded': 'vocal line folded into the right hand', 'voice-dropped': 'voice part left out' }

const who = (c: Catalog['composers'][number]) => `${c.name}${c.died ? (c.born ? ` (${c.born}–${c.died})` : ` (d. ${c.died})`) : ''}`
/** What we changed from the source, from the piece's flags; empty when it is as published. */
export const changes = (p: Piece) => p.flags.map((f) => CHANGES[f]).filter(Boolean).join(', ')

/** One line for the start card: who wrote it, who typeset it where, what we changed, under what licence. */
export function creditLine(cat: Catalog, p: Piece): string {
  const by = [SOURCE[p.source], p.typesetter && `typeset by ${p.typesetter}`, p.arranger && `arr. ${p.arranger}`, changes(p)].filter(Boolean).join(', ')
  return `${who(cat.composers[p.composer])} · ${by} · ${licenceName(cat.licences[p.licence].id)}${p.nc ? ' (non-commercial)' : ''}`
}

/** Several lines (joined with \n) for the Credits sheet. */
export function creditBlock(cat: Catalog, p: Piece): string {
  const l = cat.licences[p.licence]
  return [
    p.title,
    who(cat.composers[p.composer]),
    p.arranger && `Arranger: ${p.arranger}`,
    `${p.typesetter ? `Typeset by ${p.typesetter}, ` : ''}${SOURCE[p.source]}`,
    p.edition && `Source edition: ${p.edition}`,
    changes(p) && `Changes: ${changes(p)}`,
    `Licence: ${licenceName(l.id)} (${l.url})`,
    /-SA-/.test(l.id) && `Share-alike: this score, and any copy or edit of it, stays under ${licenceName(l.id)}.`,
    p.nc && 'Non-commercial licence: not for commercial use.',
    `Source: ${p.sourceUrl}`,
  ]
    .filter(Boolean)
    .join('\n')
}
