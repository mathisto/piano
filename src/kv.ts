import * as idb from 'idb-keyval'

// IndexedDB with a way out. A browser that blocks site data (a private window, "block all cookies", a full disk) refuses every call,
// and a page that waits on one stays blank. A write that fails is kept in memory for this visit instead, and `lost()` tells the pages to say so.

const mem = new Map<string, unknown>() // writes IndexedDB refused, read back before it
let failed = false

let wrote: (() => void) | undefined
/** Called after each write of the player's record (not a cached copy): the iPad app's backup to Files (src/native-midi.ts). */
export const onWrite = (f: () => void) => (wrote = f)

/** True once a write has been refused: what was done since will not survive closing the tab. */
export const lost = () => failed

/** Try one write at boot, so the page can say up front that nothing will be kept. */
export async function probe() {
  try {
    await idb.set('probe', 1)
    await idb.del('probe')
  } catch {
    failed = true
  }
}

export async function get<T = unknown>(k: IDBValidKey): Promise<T | undefined> {
  if (mem.has(String(k))) return mem.get(String(k)) as T
  try {
    return await idb.get<T>(k)
  } catch {
    return undefined // idb-keyval throws at once, not as a rejection, when indexedDB itself is denied: hence try, not .catch
  }
}

/** `cache`: a copy that can be fetched again (the catalogue, a library file); a refusal is ignored rather than kept and reported. */
export async function set(k: IDBValidKey, v: unknown, cache = false): Promise<void> {
  try {
    await idb.set(k, v)
    mem.delete(String(k))
    if (!cache) wrote?.()
  } catch {
    if (cache) return
    failed = true
    mem.set(String(k), v)
  }
}

export async function del(k: IDBValidKey): Promise<void> {
  mem.delete(String(k))
  try {
    await idb.del(k)
    wrote?.()
  } catch {
    /* nothing stored to delete */
  }
}

export async function keys(): Promise<IDBValidKey[]> {
  let on: IDBValidKey[] = []
  try {
    on = await idb.keys()
  } catch {
    /* none stored */
  }
  return [...new Set([...on.map(String), ...mem.keys()])]
}
