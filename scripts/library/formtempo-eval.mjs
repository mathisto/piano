#!/usr/bin/env node
// How well does a form word predict the pace? Over every piece of a published catalogue that STATES its pace (no no-tempo / tempo-estimated flag:
// a number in the .ly, a metronome mark, a <sound tempo>), compare the quarter-note bpm each guess gives with the stated one, as the median absolute
// log-ratio error and the share within +-25% (ln 1.25 = 0.223). Truth is the piece's tempo override, else the median bar's rate.
//   npx vite build --config scripts/library/vite.config.mjs && node scripts/library/formtempo-eval.mjs [--from DIR]
// Part 1: every candidate form, guessed from the other works' median (leave one work out, so a form is never tested on its own pieces) against 100.
// Part 2: the shipped estimator (formtempo.ts) by source. Its table was read off these same pieces: part 1 is the held-out evidence for it.
import { readFileSync } from 'node:fs'
import { sourceOf } from './lib.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const FROM = process.argv.includes('--from') ? process.argv[process.argv.indexOf('--from') + 1] : `${ROOT}.cache/library/out`
const { analyse, pickLy, formTempo, medianIoi, onsetsOf, MAX_RATE, MIN_BPM } = await import(`${ROOT}.cache/library/bin/pipeline.mjs`)
const cat = JSON.parse(readFileSync(`${FROM}/catalog.json`, 'utf8'))
// the forms looked at, shipped or not
const CANDIDATES = {
  mazurka: /mazurk/i, waltz: /waltz|walzer|valse/i, etude: /[eé]tude|\bstud(?:y|ies)\b/i, allemande: /allemande/i, bourrée: /bourr[eè]e/i,
  minuet: /men?uet|minuet/i, sarabande: /sarabande/i, gigue: /gigue|giga\b|jig/i, courante: /courante|corrente/i, gavotte: /gavotte/i, polonaise: /polonaise|polacca/i,
  nocturne: /nocturne/i, prelude: /pr[eé]lude|präludium/i, fugue: /\bfug(?:ue|a|hetta)/i, invention: /invention|sinfonia/i, sonata: /sonat/i, sonatina: /sonatina/i,
  march: /march|marsch/i, rag: /\brag(?:time)?\b/i, rondo: /rondo/i, impromptu: /impromptu/i, lullaby: /lullaby|wiegenlied|berceuse/i, hymn: /hymn|chorale|choral/i,
}
const med = (a) => [...a].sort((x, y) => x - y)[a.length >> 1]
const score = (e) => `${med(e.map(Math.abs)).toFixed(3)} / ${((e.filter((x) => Math.abs(x) <= Math.log(1.25)).length / e.length) * 100).toFixed(0)}%`
const work = (id) => id.split('-').slice(0, 2).join('-')
const rows = []
for (const p of cat.pieces) {
  if (p.flags.includes('no-tempo') || p.flags.includes('tempo-estimated')) continue
  const c = cat.composers[p.composer]
  const a = await analyse({ id: p.id, title: p.title, composer: `${c.name} (${c.born ?? ''}–${c.died})`, source: p.source, format: p.format, bytes: new Uint8Array(readFileSync(`${FROM}/${p.file}`)) })
  const s = a.song
  const ons = onsetsOf(s)
  if (!s || ons.length < 10) continue
  const rate = s.bars.map((b) => ((b.ql ?? (b.n * 4) / b.den) / (b.t1 - b.t0)) * 60).filter(isFinite)
  let text = p.title
  if (p.source === 'mutopia' && !/^mutopia-\d+-\d+$/.test(p.id)) text += ' ' + (await sourceOf(p.id, pickLy, `${ROOT}.cache/library/http`)).ly?.match(/\b(?:title|subtitle|piece|meter)\s*=\s*"[^"]*"/g)?.join(' ')
  rows.push({ id: p.id, source: p.source, text, ons, truth: p.tempo ?? med(rate) })
}
console.log(`${rows.length} pieces with a stated pace (${cat.pieces.length} in the catalogue)\n\nPart 1: form -> median of the other works vs 100 (median |ln err| / within 25%)`)
console.log('form'.padEnd(11), 'pieces works  form-guess      flat 100       (the form`s own median)')
const guard = (bpm, o) => Math.round(Math.max(MIN_BPM, Math.min(bpm, MAX_RATE * 60 * medianIoi(o))))
for (const [form, re] of Object.entries(CANDIDATES)) {
  const v = rows.filter((r) => re.test(r.text))
  const works = new Set(v.map((r) => work(r.id)))
  if (v.length < 4 || works.size < 3) continue
  const e = v.map((r) => Math.log(guard(med(v.filter((x) => work(x.id) !== work(r.id)).map((x) => x.truth)), r.ons) / r.truth))
  const f = v.map((r) => Math.log(guard(100, r.ons) / r.truth))
  console.log(form.padEnd(11), String(v.length).padStart(6), String(works.size).padStart(5), ' ', score(e).padEnd(14), score(f).padEnd(14), med(v.map((r) => r.truth)).toFixed(0))
}
console.log('\nPart 2: the shipped estimator (in-sample for its table) vs flat 100, by source')
for (const [name, pick] of [['mutopia', (r) => r.source === 'mutopia'], ['openscore-lieder', (r) => r.source === 'openscore-lieder'], ['chopin', (r) => r.source === 'chopin'], ['all', () => true], ['a table form named', (r) => formTempo(r.text, r.ons).form], ['no table form', (r) => !formTempo(r.text, r.ons).form]]) {
  const v = rows.filter(pick)
  console.log(name.padEnd(19), String(v.length).padStart(5), ' estimator', score(v.map((r) => Math.log(formTempo(r.text, r.ons).bpm / r.truth))).padEnd(14), 'flat 100', score(v.map((r) => Math.log(100 / r.truth))).padEnd(14), 'flat 60', score(v.map((r) => Math.log(60 / r.truth))))
}
