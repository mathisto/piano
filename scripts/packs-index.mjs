#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const dir = new URL('../public/packs/', import.meta.url)
const file = new URL('index.json', dir)
const packs = readdirSync(dir)
  .filter((name) => name.endsWith('.pthpack'))
  .sort()
  .map((name) => {
    const text = readFileSync(new URL(name, dir), 'utf8')
    const p = JSON.parse(text)
    return { id: p.id, title: p.title, by: p.by, about: p.about, licence: p.licence, items: p.items.length, file: name, sha256: createHash('sha256').update(text).digest('hex') }
  })
const text = JSON.stringify({ pth: 1, packs }, null, 1) + '\n'
if (process.argv.includes('--check')) {
  if (readFileSync(file, 'utf8') !== text) throw new Error('public/packs/index.json is stale; run npm run packs:index')
} else writeFileSync(file, text)
