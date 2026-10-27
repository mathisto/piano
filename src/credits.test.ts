import { describe, expect, it } from 'vitest'
import { builtin } from './catalog'
import { creditBlock as block, creditLine as line, licenceName, loadManifest, libraryUrl, type LibraryEntry } from './credits'

const creditLine = (e: LibraryEntry) => { const c = builtin([e]); return line(c, c.pieces[0]) }
const creditBlock = (e: LibraryEntry) => { const c = builtin([e]); return block(c, c.pieces[0]) }

const E: LibraryEntry = {
  id: 'mutopia-647',
  title: 'Melodie, Op. 68 No. 1',
  composer: 'Robert Schumann (1810–1856)',
  collection: 'Mutopia Project',
  typesetter: 'Philippe Hézaine',
  licence: 'CC-BY-SA-2.5',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.5/',
  licenceEvidence: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=647',
  sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=647',
  sourceEdition: 'Peters',
  format: 'midi',
  file: 'mutopia-647.mid',
  level: 'Elementary',
  bytes: 2883,
  sha256: '0'.repeat(64),
}
const PD: LibraryEntry = { ...E, licence: 'Public Domain', typesetter: undefined, arranger: 'Edvard Grieg' }
const json = (body: unknown, ok = true) => (async () => ({ ok, json: async () => body })) as unknown as typeof fetch

describe('credits', () => {
  it('names licences', () => {
    expect(licenceName('CC-BY-SA-2.5')).toBe('CC BY-SA 2.5')
    expect(licenceName('CC0-1.0')).toBe('CC0 1.0')
    expect(licenceName('CC-BY-NC-SA-4.0')).toBe('CC BY-NC-SA 4.0')
    expect(licenceName('Public Domain')).toBe('Public Domain')
  })

  it('writes a one-line credit', () => {
    expect(creditLine(E)).toBe('Robert Schumann (1810–1856) · Mutopia Project, typeset by Philippe Hézaine · CC BY-SA 2.5')
    expect(creditLine(PD)).toBe('Robert Schumann (1810–1856) · Mutopia Project, arr. Edvard Grieg · Public Domain')
    expect(creditLine({ ...E, nc: true })).toMatch(/\(non-commercial\)$/)
    expect(creditLine(E)).not.toContain('\n')
  })

  it('writes a credits block with the share-alike notice only for SA licences', () => {
    const b = creditBlock(E)
    for (const s of [E.title, E.composer, 'Typeset by Philippe Hézaine, Mutopia Project', 'Source edition: Peters', E.licenceUrl, E.sourceUrl, 'Share-alike']) expect(b).toContain(s)
    expect(creditBlock(PD)).not.toContain('Share-alike')
    expect(creditBlock(PD)).toContain('Arranger: Edvard Grieg')
  })

  it('names what was changed from an OpenScore song, once', () => {
    const L: LibraryEntry = { ...E, collection: 'OpenScore Lieder Corpus', typesetter: undefined, licence: 'CC0-1.0', sourceEdition: 'Transcribed from #1; the vocal line is folded into the right hand' }
    expect(creditLine(L)).toBe('Robert Schumann (1810–1856) · OpenScore Lieder Corpus, vocal line folded into the right hand · CC0 1.0')
    expect(creditBlock(L).match(/folded/g)).toHaveLength(1)
    expect(creditLine({ ...L, sourceEdition: 'OpenScore Lieder Corpus' })).toContain('voice part left out')
  })

  it('resolves library files against the base', () => {
    expect(libraryUrl('manifest.json', 'https://pianoforte.mattkelly.io/')).toBe('https://pianoforte.mattkelly.io/library/manifest.json')
    expect(libraryUrl('a.mid', 'capacitor://localhost/index.html')).toBe('capacitor://localhost/library/a.mid')
    expect(libraryUrl('a.mid', 'http://localhost:5173/sub/')).toBe('http://localhost:5173/sub/library/a.mid')
  })

  it('loads the manifest, dropping malformed entries, and returns [] on any failure', async () => {
    expect(await loadManifest(json([E, { id: 'x' }, null]), 'http://h/')).toEqual([E])
    expect(await loadManifest(json({ not: 'a list' }), 'http://h/')).toEqual([])
    expect(await loadManifest(json([E], false), 'http://h/')).toEqual([])
    expect(await loadManifest((async () => Promise.reject(new Error('offline'))) as unknown as typeof fetch, 'http://h/')).toEqual([])
  })
})

describe('loadManifest inside the iPad app', () => {
  it('accepts a bundled file that reports status 0', async () => {
    const entry = { id: 'a', title: 'A', composer: 'B', licence: 'Public Domain', file: 'a.mid', level: 'easy', format: 'midi' }
    const fake = (async () => ({ ok: false, status: 0, json: async () => [entry] })) as unknown as typeof fetch
    expect(await loadManifest(fake, 'capacitor://localhost/')).toHaveLength(1)
  })
})
