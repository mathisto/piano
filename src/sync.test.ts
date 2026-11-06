import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const importMany = vi.fn()
const exportAll = vi.fn()
vi.mock('./backup', () => ({ importMany, exportAll }))
vi.mock('./kv', () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(), onWrite: vi.fn() }))
vi.mock('./native-midi', () => ({ native: false }))
vi.mock('@capacitor/core', () => ({ registerPlugin: vi.fn() }))

const { syncWith } = await import('./sync')

describe('folder sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    importMany.mockResolvedValue({ merged: 1, skipped: 0 })
    exportAll.mockResolvedValue('{"version":1,"at":3}')
  })

  it('merges old and new Page to Hand device files and writes only its new-name file', async () => {
    const write = vi.fn()
    const adapter = {
      read: vi.fn().mockResolvedValue([
        { name: 'Page to Hand Sync mine.json', text: 'mine' },
        { name: 'Page to Hand Sync other.json', text: 'new' },
        { name: 'Piano Forte Sync old.json', text: 'old' },
        { name: 'notes.txt', text: 'not an export' },
      ]),
      write,
    }
    await expect(syncWith(adapter, 'Page to Hand Sync mine.json')).resolves.toEqual({ merged: 1, skipped: 0 })
    expect(importMany).toHaveBeenCalledWith(['new', 'old'])
    expect(write).toHaveBeenCalledWith({ name: 'Page to Hand Sync mine.json', text: '{"version":1,"at":3}' })
  })

  it('does not overwrite its file when reading or merging fails', async () => {
    importMany.mockRejectedValue(new Error('read failed'))
    const write = vi.fn()
    await expect(syncWith({ read: vi.fn().mockResolvedValue([{ name: 'Page to Hand Sync other.json', text: 'x' }]), write }, 'Page to Hand Sync mine.json')).rejects.toThrow('read failed')
    expect(write).not.toHaveBeenCalled()
  })

  it('keeps old iCloud sync and recovery files readable while native writes the new name', () => {
    const swift = readFileSync(new URL('../ios/App/App/PianoNative.swift', import.meta.url), 'utf8')
    expect(swift).toContain('"Page to Hand Sync "')
    expect(swift).toContain('"Piano Forte Sync "')
    expect(swift).toContain('name.hasPrefix("Page to Hand Sync ")')
    expect(swift).toMatch(/hasPrefix\("Page to Hand "\).*hasPrefix\("Piano Forte "\)/s)
    expect(swift).toContain('String($0.suffix(15))')
    expect(swift).toContain('left == right ? $0.hasPrefix("Piano Forte ")')
  })
})
