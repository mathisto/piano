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

const shareAlike = (e: LibraryEntry) => /-SA-/.test(e.licence)

/** One line for the start sheet: who made it, where from, under what licence. */
export function creditLine(e: LibraryEntry): string {
  const by = [e.collection, e.typesetter && `typeset by ${e.typesetter}`, e.arranger && `arr. ${e.arranger}`].filter(Boolean).join(', ')
  return `${e.composer} · ${by} · ${licenceName(e.licence)}${e.nc ? ' (non-commercial)' : ''}`
}

/** Several lines (joined with \n) for a Credits screen. */
export function creditBlock(e: LibraryEntry): string {
  return [
    e.title,
    e.composer,
    e.arranger && `Arranger: ${e.arranger}`,
    `${e.typesetter ? `Typeset by ${e.typesetter}, ` : ''}${e.collection}`,
    `Source edition: ${e.sourceEdition}`,
    `Licence: ${licenceName(e.licence)} (${e.licenceUrl})`,
    shareAlike(e) && `Share-alike: this score, and any copy or edit of it, stays under ${licenceName(e.licence)}.`,
    e.nc && 'Non-commercial licence: not for commercial use.',
    `Source: ${e.sourceUrl}`,
  ]
    .filter(Boolean)
    .join('\n')
}
