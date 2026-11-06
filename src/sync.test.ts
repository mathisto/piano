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

  it('merges only other Piano Forte device files and writes only its own', async () => {
    const write = vi.fn()
    const adapter = {
      read: vi.fn().mockResolvedValue([
        { name: 'Piano Forte Sync mine.json', text: 'mine' },
        { name: 'Piano Forte Sync other.json', text: 'other' },
        { name: 'notes.txt', text: 'not an export' },
      ]),
      write,
    }
    await expect(syncWith(adapter, 'Piano Forte Sync mine.json')).resolves.toEqual({ merged: 1, skipped: 0 })
    expect(importMany).toHaveBeenCalledWith(['other'])
    expect(write).toHaveBeenCalledWith({ name: 'Piano Forte Sync mine.json', text: '{"version":1,"at":3}' })
  })

  it('does not overwrite its file when reading or merging fails', async () => {
    importMany.mockRejectedValue(new Error('read failed'))
    const write = vi.fn()
    await expect(syncWith({ read: vi.fn().mockResolvedValue([{ name: 'Piano Forte Sync other.json', text: 'x' }]), write }, 'Piano Forte Sync mine.json')).rejects.toThrow('read failed')
    expect(write).not.toHaveBeenCalled()
  })
})
