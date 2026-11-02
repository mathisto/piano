#!/usr/bin/env node
// Clean titles in a published output: node scripts/library/retitle.mjs <base-out> <result-out> [titles.json]
// scripts/library/titles.json maps a piece id to its new title, or { title, opus }. Files, shas, ids and order stay; `form` and `kind` are worked out again
// (a Czerny book is a study whatever its Mutopia style says). catalog-diff.mjs reads the same file to tell a wanted title change from a broken identity.
import { readFileSync } from 'node:fs'

const ROOT = new URL('../..', import.meta.url).pathname
const [base, out, list = `${ROOT}scripts/library/titles.json`] = process.argv.slice(2)
if (!out) throw new Error('usage: retitle.mjs <base-out> <result-out> [titles.json]')
const { retitle } = await import(`${ROOT}.cache/library/bin/pipeline.mjs`)
const changed = retitle(base, out, JSON.parse(readFileSync(list, 'utf8')))
console.log(`${changed.length} pieces changed (title, opus, form or kind) -> ${out}`)
