import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { Catalog } from './catalog-types'
import { parsePack, unknown } from './pack'

const dir = 'public/packs'
const names = readdirSync(dir).filter((name) => name.endsWith('.pthpack')).sort()
const packs = names.map((name) => ({ name, text: readFileSync(`${dir}/${name}`, 'utf8') })).map((f) => ({ ...f, pack: parsePack(f.text) }))

test('the public pack index is complete, deterministic and licensed', () => {
  const index = JSON.parse(readFileSync(`${dir}/index.json`, 'utf8'))
  expect(index).toEqual({
    pth: 1,
    packs: packs.map(({ name, text, pack }) => ({ id: pack.id, title: pack.title, by: pack.by, about: pack.about, licence: pack.licence, items: pack.items.length, file: name, sha256: createHash('sha256').update(text).digest('hex') })),
  })
  expect(new Set(packs.map(({ pack }) => pack.id)).size).toBe(packs.length)
  for (const { pack } of packs) expect(pack.licence, pack.id).toMatch(/^(CC0-1\.0|CC-BY-4\.0)$/)
})

test('every public pack item resolves against this app and the live catalogue', () => {
  const file = process.env.LIBRARY_CATALOG ?? '.cache/library/out-fermata/catalog.json'
  const catalog = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Catalog) : undefined
  const ids = new Set([...(catalog?.pieces.map((p) => p.id) ?? []), ...Object.keys(catalog?.aliases ?? {})])
  for (const { pack } of packs) expect(unknown(pack, (id) => ids.has(id)), pack.id).toEqual([])
})

test('the association file opens only pack fragments in the signed app', () => {
  const aasa = JSON.parse(readFileSync('public/.well-known/apple-app-site-association', 'utf8'))
  expect(aasa.applinks.details).toEqual([{ appIDs: ['TC8XUVBATG.io.mattkelly.piano'], components: [{ '/': '/', '#': 'pack=*', comment: 'Open Page to Hand pack links' }] }])
})
