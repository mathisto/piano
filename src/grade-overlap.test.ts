import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { candidates } from '../scripts/library/grade-overlap.mjs'

const dirs: string[] = []
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true })))

it('cites a matching work on its actual board grade page and rejects a nearby work number', () => {
  const dir = mkdtempSync(join(tmpdir(), 'grade-overlap-'))
  dirs.push(dir)
  const pages = () => Array.from({ length: 100 }, () => '')
  const abrsm = pages()
  abrsm[24] = 'Bach Invention no. 7, BWV 779'
  abrsm[33] = 'J. S. Bach Invention no. 8 in F major, BWV 779'
  writeFileSync(join(dir, 'abrsm-2025-26-raw.txt'), abrsm.join('\f'))
  writeFileSync(join(dir, 'trinity-2023-2026-raw.txt'), pages().join('\f'))
  writeFileSync(join(dir, 'rcm-2022-raw.txt'), pages().join('\f'))

  const catalog = {
    composers: [{ name: 'J. S. Bach' }],
    pieces: [{ id: 'bach-779', composer: 0, title: 'Invention No. 8 in F major, BWV 779', opus: 'BWV 779' }],
  }
  expect(candidates(catalog, dir).map(({ system, grade, page, id }) => ({ system, grade, page, id }))).toEqual([
    { system: 'abrsm', grade: '5', page: 34, id: 'bach-779' },
  ])
})
