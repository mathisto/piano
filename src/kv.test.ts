import { beforeEach, describe, expect, it, vi } from 'vitest'

// IndexedDB refused outright, as in a browser that blocks site data: the store keeps the visit in memory and says so.
vi.mock('idb-keyval', () => {
  const deny = () => {
    throw new DOMException('denied', 'SecurityError') // idb-keyval throws at once, not as a rejection
  }
  return { get: deny, set: deny, del: deny, keys: deny }
})

describe('kv without IndexedDB', () => {
  beforeEach(() => vi.resetModules())

  it('reads back what it wrote, lists it, deletes it, and reports the loss', async () => {
    const kv = await import('./kv')
    expect(kv.lost()).toBe(false)
    expect(await kv.get('prog:a')).toBeUndefined()
    await kv.set('prog:a', { plays: 1 })
    expect(kv.lost()).toBe(true)
    expect(await kv.get('prog:a')).toEqual({ plays: 1 })
    expect(await kv.keys()).toEqual(['prog:a'])
    await kv.del('prog:a')
    expect(await kv.get('prog:a')).toBeUndefined()
  })

  it('does not call a refused cache copy a loss', async () => {
    const kv = await import('./kv')
    await kv.set('catalog', { big: true }, true)
    expect(kv.lost()).toBe(false)
    expect(await kv.get('catalog')).toBeUndefined()
  })

  it('a boot-time probe finds the refusal before anything is written', async () => {
    const kv = await import('./kv')
    await kv.probe()
    expect(kv.lost()).toBe(true)
  })
})
