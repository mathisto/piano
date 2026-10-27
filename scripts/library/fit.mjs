#!/usr/bin/env node
// The grade's cut points and how well it agrees with the hand labels: node scripts/library/fit.mjs
// (after npm run library:build -- --set mutopia, and -- --set current for the OpenScore labels).
// CUTS are the 8th, 30th, 60th and 85th percentile of D over the analysed Mutopia pieces (grade 1: 8%, 2: 22%, 3: 30%,
// 4: 25%, 5: 15%); paste them into pipeline.ts. The seven terms are not refitted: their sum already ranks the labels
// at Spearman 0.85, and a weight search gained under 0.01.
import { readFileSync } from 'node:fs'

const ROOT = new URL('../..', import.meta.url).pathname
const read = (f) => JSON.parse(readFileSync(`${ROOT}${f}`, 'utf8'))
const set = read('.cache/library/report-mutopia.json').filter((r) => r.d !== undefined)
const rows = new Map([...read('.cache/library/report-current.json'), ...set].filter((r) => r.d !== undefined).map((r) => [r.id, r]))
const labels = Object.entries(read('scripts/library/labels.json')).filter(([id]) => rows.has(id))

const ranks = (v) => v.map((x) => v.filter((y) => y < x).length + (v.filter((y) => y === x).length + 1) / 2)
function spearman(x, y) {
  const [a, b] = [ranks(x), ranks(y)]
  const m = (a.length + 1) / 2
  const cov = a.reduce((s, v, i) => s + (v - m) * (b[i] - m), 0)
  return cov / Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) * b.reduce((s, v) => s + (v - m) ** 2, 0))
}

const ds = set.map((r) => r.d).sort((a, b) => a - b)
const cuts = [0.08, 0.3, 0.6, 0.85].map((p) => ds[Math.floor(ds.length * p)])
const grade = (d) => 1 + cuts.filter((c) => d >= c).length
const hand = labels.map(([, [g]]) => g)
console.log(`CUTS = ${JSON.stringify(cuts)}`)
console.log(`Spearman over ${labels.length} labels: D ${spearman(hand, labels.map(([id]) => rows.get(id).d)).toFixed(3)}, grade ${spearman(hand, labels.map(([id]) => grade(rows.get(id).d))).toFixed(3)}`)
console.log('distribution', [1, 2, 3, 4, 5].map((g) => `${g}: ${ds.filter((d) => grade(d) === g).length}`).join(', '))
console.log('hand label -> grade', [1, 2, 3, 4, 5].map((h) => `${h}: [${labels.filter(([, [g]]) => g === h).map(([id]) => grade(rows.get(id).d)).sort().join('')}]`).join(' '))
