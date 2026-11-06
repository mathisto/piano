// Owner-controlled folder sync. Each installation writes one export and only merges the other files, so cloud storage never has to resolve two writers of one file.
import { registerPlugin } from '@capacitor/core'
import { exportAll, importMany } from './backup'
import { del, get, onWrite, set } from './kv'
import { native } from './native-midi'

const ENABLED = 'sync:enabled'
const FOLDER = 'sync:folder'
const PREFIX = 'Piano Forte Sync '
const LAST = 'piano.sync-last'

interface SyncNative {
  syncAvailable(): Promise<{ available: boolean }>
  syncRead(): Promise<{ files: SyncFile[] }>
  syncWrite(o: SyncFile): Promise<void>
}
interface FileHandle {
  getFile(): Promise<File>
}
interface DirectoryHandle {
  queryPermission(o: { mode: 'readwrite' }): Promise<PermissionState>
  requestPermission(o: { mode: 'readwrite' }): Promise<PermissionState>
  values(): AsyncIterable<FileHandle & { kind: string; name: string }>
  getFileHandle(name: string, o: { create: boolean }): Promise<FileHandle & { createWritable(): Promise<{ write(text: string): Promise<void>; close(): Promise<void> }> }>
}
declare global {
  interface Window { showDirectoryPicker?: (o: { mode: 'readwrite' }) => Promise<DirectoryHandle> }
}

export interface SyncFile { name: string; text: string }
export interface SyncAdapter { read(): Promise<SyncFile[]>; write(file: SyncFile): Promise<void> }
type View = { on: boolean; busy: boolean; message: string; unsupported?: boolean }

const plugin = native ? registerPlugin<SyncNative>('CoreMidi') : undefined
const listeners = new Set<(s: View) => void>()
const wired = new WeakMap<HTMLElement, (s: View) => void>()
let view: View = { on: false, busy: false, message: '' }
let busy = false
let applying = false
let dirty = false
let timer = 0
let started = false
let localWrite = () => {}
let sessionDevice = ''

const publish = (next: Partial<View>) => {
  view = { ...view, ...next }
  listeners.forEach((f) => f(view))
}
const deviceId = () => {
  try {
    let id = localStorage.getItem('piano.sync-device')
    if (!id) localStorage.setItem('piano.sync-device', (id = crypto.randomUUID()))
    return id
  } catch {
    return sessionDevice ||= crypto.randomUUID()
  }
}
const ownName = () => `${PREFIX}${deviceId()}.json`
const isSyncFile = (name: string) => name.startsWith(PREFIX) && name.endsWith('.json')
const lastMessage = () => {
  try {
    const at = Number(localStorage.getItem(LAST))
    return at ? `Last synced ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(at)}.` : 'Ready to sync.'
  } catch { return 'Ready to sync.' }
}

/** The deterministic sync operation, separate from permissions and UI so every merge and failure path can be tested. */
export async function syncWith(adapter: SyncAdapter, name: string) {
  const files = (await adapter.read()).filter((f) => f.name !== name && isSyncFile(f.name))
  applying = true
  let result: Awaited<ReturnType<typeof importMany>>
  try {
    result = await importMany(files.map((f) => f.text))
  } finally {
    applying = false
  }
  await adapter.write({ name, text: await exportAll() })
  return result
}

const browserAdapter = async (ask: boolean): Promise<SyncAdapter | undefined> => {
  const folder = await get<DirectoryHandle>(FOLDER)
  if (!folder) return
  let permission = await folder.queryPermission({ mode: 'readwrite' })
  if (permission === 'prompt' && ask) permission = await folder.requestPermission({ mode: 'readwrite' })
  if (permission !== 'granted') throw new Error(ask ? 'Folder access was not allowed. Choose the folder again.' : 'Open Settings and tap Sync now to allow folder access.')
  return {
    async read() {
      const files: SyncFile[] = []
      for await (const entry of folder.values()) if (entry.kind === 'file' && isSyncFile(entry.name)) files.push({ name: entry.name, text: await (await entry.getFile()).text() })
      return files
    },
    async write(file) {
      const handle = await folder.getFileHandle(file.name, { create: true })
      const out = await handle.createWritable()
      await out.write(file.text)
      await out.close()
    },
  }
}
const nativeAdapter = (): SyncAdapter => ({ read: async () => (await plugin!.syncRead()).files, write: (file) => plugin!.syncWrite(file) })

async function adapter(ask: boolean) {
  if (native) {
    if (!(await plugin!.syncAvailable()).available) throw new Error('iCloud Drive is not available. Turn it on in iPad Settings, then try again.')
    return nativeAdapter()
  }
  return browserAdapter(ask)
}

export async function syncNow(ask = false) {
  if (busy || !(await get<boolean>(ENABLED))) return
  clearTimeout(timer)
  busy = true
  publish({ on: true, busy: true, message: 'Syncing…' })
  try {
    const a = await adapter(ask)
    if (!a) throw new Error('Choose the shared folder again.')
    const result = await syncWith(a, ownName())
    const at = Date.now()
    try { localStorage.setItem(LAST, String(at)) } catch { /* the status can stay in memory */ }
    const skipped = result.skipped ? ` ${result.skipped} damaged sync file${result.skipped === 1 ? ' was' : 's were'} skipped.` : ''
    publish({ busy: false, message: `Synced ${new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(at)}.${skipped}` })
  } catch (e) {
    publish({ busy: false, message: (e as Error).message })
  } finally {
    busy = false
    if (dirty) {
      dirty = false
      schedule()
    }
  }
}

async function enable() {
  try {
    if (native) {
      if (!(await plugin!.syncAvailable()).available) throw new Error('iCloud Drive is not available. Turn it on in iPad Settings, then try again.')
    } else {
      if (!window.showDirectoryPicker) return publish({ unsupported: true, message: 'Folder sync needs Chrome or Edge. Export still works.' })
      const folder = await window.showDirectoryPicker({ mode: 'readwrite' })
      await set(FOLDER, folder)
    }
    await set(ENABLED, true)
    publish({ on: true, message: 'Ready to sync.' })
    await syncNow(true)
  } catch (e) {
    if ((e as DOMException).name !== 'AbortError') publish({ busy: false, message: (e as Error).message })
  }
}

async function stop() {
  clearTimeout(timer)
  await del(ENABLED)
  await del(FOLDER)
  try { localStorage.removeItem(LAST) } catch { /* no localStorage */ }
  publish({ on: false, busy: false, message: '' })
}

const schedule = () => {
  localWrite()
  if (applying) return
  if (busy) return void (dirty = true)
  clearTimeout(timer)
  timer = window.setTimeout(() => void syncNow(), 30_000)
}

/** The native shell keeps its seven daily local backups through the same one record-write hook. */
export const nativeWrites = (f: () => void) => (localWrite = f)

/** Starts background sync after boot. Permission prompts remain behind the Settings button. */
export async function autoSync() {
  if (!started) {
    started = true
    onWrite(schedule)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void syncNow())
  }
  const on = !!(await get<boolean>(ENABLED))
  publish({ on, message: on ? lastMessage() : '' })
  if (on) await syncNow()
}

/** Wires the already-rendered Settings row; importing this module while the drawer opens preserves the picker click's user gesture. */
export async function wireSync(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('#sSync')!
  const stopButton = root.querySelector<HTMLButtonElement>('#sSyncStop')!
  const status = root.querySelector<HTMLElement>('#sSyncStatus')!
  const render = (s: View) => {
    button.textContent = s.on ? 'Sync now' : native ? 'Use iCloud Drive' : 'Choose folder'
    button.disabled = s.busy || !!s.unsupported
    stopButton.hidden = !s.on
    stopButton.disabled = s.busy
    status.textContent = s.message
  }
  const old = wired.get(root)
  if (old) listeners.delete(old)
  wired.set(root, render)
  listeners.add(render)
  await autoSync()
  if (!native && !window.showDirectoryPicker) publish({ unsupported: true, message: 'Folder sync needs Chrome or Edge. Export still works.' })
  render(view)
  button.onclick = () => void (view.on ? syncNow(true) : enable())
  stopButton.onclick = () => void stop()
}

if (typeof document !== 'undefined') void autoSync()
