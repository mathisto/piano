// Mutopia's search table, every page, for a set of instruments: one row per piece (id, title, composer, instruments, licence, links).
// 10 rows a page; cached, so a rerun costs no requests.
import { get, text } from './lib.mjs'

export async function mutopiaIndex(cache, instruments = ['Piano', 'Harpsichord', 'Clavichord']) {
  const rows = new Map()
  for (const ins of instruments) {
    for (let at = 0; ; at += 10) {
      const html = (await get(`https://www.mutopiaproject.org/cgibin/make-table.cgi?startat=${at}&Instrument=${ins}`, cache)).toString()
      const tables = html.split('<table class="table-bordered result-table">').slice(1)
      for (const t of tables) {
        const td = [...t.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) => m[1])
        const id = Number(/piece-info\.cgi\?id=(\d+)/.exec(t)?.[1])
        if (!id) continue
        rows.set(id, {
          id,
          title: text(td[0]),
          composer: text(td[1]).replace(/^by /, ''),
          opus: text(td[2]),
          instruments: text(td[4]).replace(/^for /, ''),
          licence: text(td[9]),
          midi: /href="([^"]+\.mid)"/.exec(t)?.[1],
          zip: /href="([^"]+-mids\.zip)"/.exec(t)?.[1],
        })
      }
      if (!html.includes(`startat=${at + 10}&`)) break
    }
  }
  return [...rows.values()].sort((a, b) => a.id - b.id)
}

// Solo keyboard: every listed instrument is one of these (no organ: its pedal line is a third staff; no duets, no voice)
const SOLO = new Set(['piano', 'harpsichord', 'clavichord', 'fortepiano', 'pianoforte', 'virginal', 'virginals', 'spinet'])
export const soloKeyboard = (instruments) => instruments.split(/\s*(?:,|\band\b|&|\bor\b)\s*/i).every((x) => SOLO.has(x.trim().toLowerCase()))
