// Lazy with Songs: inspect local file records without letting one broken value take down the rest of the library.
import { del, get, keys } from './kv'
import type { Stored } from './store'
import { toSong } from './store'

export interface DamagedSong {
  id: string
  title: string
}

export async function songRecords(): Promise<{ songs: Stored[]; damaged: DamagedSong[] }> {
  const ks = (await keys()).filter((k) => String(k).startsWith('song:'))
  const rows = await Promise.all(ks.map(async (k) => [String(k).slice(5), await get(k)] as const))
  const songs: Stored[] = []
  const damaged: DamagedSong[] = []
  for (const [id, value] of rows) {
    const r = value as Partial<Stored> | undefined
    if (r && r.id === id && typeof r.title === 'string' && r.bytes instanceof ArrayBuffer && Number.isFinite(r.added) && (r.kind === undefined || r.kind === 'midi' || r.kind === 'xml')) songs.push(r as Stored)
    else damaged.push({ id, title: typeof r?.title === 'string' && r.title.trim() ? r.title : 'Imported file' })
  }
  return { songs: songs.sort((a, b) => b.added - a.added), damaged }
}

/** Parse every uncached file independently: one failure cannot hide or disable the rest of the player's library. */
export async function readableSongs(split: number, lens: Map<string, { bars: number; len: number; tracks?: { all: number; used: number } }>, keep: (id: string, song: Awaited<ReturnType<typeof toSong>>) => void) {
  const { songs, damaged } = await songRecords()
  const readable: Stored[] = []
  for (const stored of songs) {
    try {
      if (!lens.has(stored.id)) {
        const song = await toSong(stored, split)
        let tracks
        if (stored.kind !== 'xml') {
          const { autoSelect, inspectMidi } = await import('./midi-tracks')
          const r = inspectMidi(stored.bytes)
          tracks = { all: r.tracks.filter((t) => !t.percussion).length, used: (stored.pick ?? autoSelect(r)).tracks.length }
        }
        lens.set(stored.id, { bars: song.bars.length, len: song.end, tracks })
        keep(stored.id, song)
      }
      readable.push(stored)
    } catch {
      damaged.push({ id: stored.id, title: stored.title })
    }
  }
  return { readable, damaged }
}

/** Forget only unreadable bytes. A clean re-import has the same id and finds its progress and takes again. */
export const forgetDamagedSong = (id: string) => del(`song:${id}`)

export function wireRecovery(root: ParentNode, damaged: DamagedSong[], redraw: () => void | Promise<void>) {
  root.querySelector<HTMLButtonElement>('[data-forget-damaged]')?.addEventListener('click', async () => {
    if (!confirm(`Remove ${damaged.length === 1 ? damaged[0].title : `${damaged.length} damaged files`} from this device? Practice history is kept for a clean re-import.`)) return
    await Promise.all(damaged.map((s) => forgetDamagedSong(s.id)))
    await redraw()
    root.querySelector<HTMLButtonElement>('#addFiles')?.focus()
  })
}
