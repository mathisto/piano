#!/usr/bin/env node
// Find catalogue pieces that may occur in official exam-board repertoire PDFs.
// The output is a review queue, never training truth: every row still needs an
// exact identity check against the cited PDF page.
// Usage: node scripts/library/grade-overlap.mjs CATALOG.json RAW_TEXT_DIR
import { readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const norm = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/\b([0-9]+)(?:st|nd|rd|th)\b/g, '$1').replace(/\bmovt\b/g, 'movement')
  .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\b(?:number|no)\s+/g, ' no ')
  .replace(/\b(bwv)\s+anh\s+([0-9]+)/g, '$1 $2').trim()
const STOP = new Set('a an and anh at bwv by d de der die en first for from hob hwv in k kv l la le les major minor movement movt no of on op part piano piece pour s sz the to und woo'.split(' '))
const words = (s) => [...new Set(norm(s).split(' ').filter((x) => x.length > 2 && /[a-z]/.test(x) && !STOP.has(x)))]
const refs = (s) => {
  const n = norm(s).replace(/\bkv\b/g, 'k')
  const strong = [...n.matchAll(/\b(op|bwv|hwv|hob|woo|k|d|sz|s|l)\s*(?:anh\s*)?([0-9]+)/g)].map((m) => `${m[1]} ${m[2]}`)
  const item = [...n.matchAll(/\b(no|lesson|movement|variation)\s*([0-9]+)\b/g)].map((m) => `${m[1]} ${m[2]}`)
  return { strong: [...new Set(strong)], item: [...new Set(item)] }
}
const surname = (s) => words(s).at(-1) ?? ''

function pages(file) {
  return readFileSync(file, 'utf8').split('\f').map(norm)
}

const ranges = (labels, starts, end) => labels.map((label, i) => ({ label, from: starts[i], to: starts[i + 1] ?? end }))

export function candidates(catalog, dir) {
  const systems = [
    { name: 'abrsm', pages: pages(join(dir, 'abrsm-2025-26-raw.txt')), grades: ranges(['Initial', ...Array.from({ length: 8 }, (_, i) => `${i + 1}`)], [19, 22, 25, 28, 31, 34, 37, 40, 43], 47) },
    { name: 'trinity', pages: pages(join(dir, 'trinity-2023-2026-raw.txt')), grades: ranges(['Initial', ...Array.from({ length: 8 }, (_, i) => `${i + 1}`)], [2, 6, 10, 14, 18, 22, 26, 30, 34], 39) },
    { name: 'rcm', pages: pages(join(dir, 'rcm-2022-raw.txt')), grades: ranges(['Preparatory A', 'Preparatory B', ...Array.from({ length: 10 }, (_, i) => `${i + 1}`)], [8, 13, 18, 24, 30, 37, 44, 52, 60, 68, 78, 89], 100) },
  ]
  const out = []
  for (const piece of catalog.pieces) {
    if (piece.kind === 'accomp' || piece.kind === 'fragment') continue
    const composer = catalog.composers[piece.composer].name
    const who = surname(composer)
    if (who.length < 4) continue
    const titleWords = words(piece.title).filter((x) => x !== who)
    const identity = refs(`${piece.opus ?? ''} ${piece.title}`)
    for (const system of systems) for (const grade of system.grades) {
      let best
      for (let page = grade.from; page < grade.to; page++) {
        const text = system.pages[page - 1] ?? ''
        for (let at = text.indexOf(who); at >= 0; at = text.indexOf(who, at + who.length)) {
          // Raw PDF extraction keeps each composer's entry in reading order.
          const entry = text.slice(at, at + 600)
          const strongHits = identity.strong.filter((x) => entry.includes(x))
          const itemHits = identity.item.filter((x) => entry.includes(x))
          const titleHits = titleWords.filter((x) => entry.includes(x))
          const titleShare = titleHits.length / Math.max(1, titleWords.length)
          const exactItems = identity.item.every((x) => itemHits.includes(x))
          const distinctiveTitle = titleWords.length >= 2 && titleShare >= .8
          const exactIdentity = identity.strong.length
            ? strongHits.length === identity.strong.length && exactItems && titleShare >= .5
            : distinctiveTitle
          const score = 6 * strongHits.length + 2 * itemHits.length + 5 * titleShare
          if (exactIdentity && (!best || score > best.score)) best = { score, page, strongHits, itemHits, titleHits }
        }
      }
      if (best) out.push({ system: system.name, grade: grade.label, id: piece.id, composer, title: piece.title, opus: piece.opus, ...best })
    }
  }
  return out.sort((a, b) => a.system.localeCompare(b.system) || a.grade.localeCompare(b.grade, undefined, { numeric: true }) || a.page - b.page || a.id.localeCompare(b.id))
}

function main() {
  const [catalogFile = '.cache/library/out-src1/catalog.json', dir = '.cache/library/grade-systems'] = process.argv.slice(2)
  const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'))
  const found = candidates(catalog, dir)
  console.log(['system', 'grade', 'page', 'id', 'score', 'composer', 'title', 'opus', 'refs', 'items', 'words'].join('\t'))
  for (const c of found) console.log([c.system, c.grade, c.page, c.id, c.score.toFixed(2), c.composer, c.title, c.opus ?? '', c.strongHits.join('|'), c.itemHits.join('|'), c.titleHits.join('|')].join('\t'))
  console.error(`${found.length} candidates; ${new Set(found.map((x) => x.id)).size} catalogue pieces; verify every row against the cited PDF page`)
}

if (process.argv[1] && basename(process.argv[1]) === basename(new URL(import.meta.url).pathname)) main()
