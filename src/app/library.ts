// Songs: the library page, the tracks dialog, importing files, and sharing them.
import * as lib from '../catalog'
import type { Piece } from '../catalog-types'
import { autoSelect, inspectMidi } from '../midi-tracks'
import { settings } from '../settings'
import { fromSpec } from '../song'
import { noteName } from '../spell'
import { STARTERS } from '../starters'
import * as store from '../store'
import { thumb } from '../thumb'
import { $, library, type Row, starterRows, tracksDialog, userRows } from '../ui'
import { current, hooks, starters } from './state'

export const lens = new Map<string, { bars: number; len: number; tracks?: { all: number; used: number } }>()

const thumbs = new Map<string, string>(STARTERS.map((st) => [st.spec.id, thumb(fromSpec(st.spec))]))

export async function libraryData() {
  const [stored, prog] = await Promise.all([store.listSongs(), store.allProgress()])
  for (const s of stored) {
    if (!lens.has(s.id)) {
      try {
        const song = await store.toSong(s, settings.split)
        let tracks
        if (s.kind !== 'xml') {
          const r = inspectMidi(s.bytes)
          tracks = { all: r.tracks.filter((t) => !t.percussion).length, used: (s.pick ?? autoSelect(r)).tracks.length }
        }
        lens.set(s.id, { bars: song.bars.length, len: song.end, tracks })
        thumbs.set(s.id, thumb(song))
      } catch {
        lens.set(s.id, { bars: 0, len: 0 })
      }
    }
  }
  const starts = starterRows(STARTERS, starters, prog, thumbs)
  const mine = userRows(stored, prog, lens, thumbs)
  // one row carries the lamp: the piece you played last, or the first warm-up if you have not played yet
  const libRows: Row[] = [...prog.keys()].flatMap((k) => {
    const p = k.startsWith('lib:') && lib.piece(k.slice(4))
    return p ? [{ id: `lib:${p.id}`, title: p.title, sub: `${lib.catalog.composers[p.composer]?.name} · Level ${lib.gradeOf(p)}`, bars: p.bars, len: p.sec, prog: prog.get(k), user: false, thumb: '' }] : []
  })
  const last = [...starts, ...mine, ...libRows].filter((r) => r.prog?.last).sort((a, b) => b.prog!.last - a.prog!.last)[0] ?? starts[0]
  return { starts, mine, last, all: [...starts, ...mine, ...libRows] }
}

export async function showLibrary(err = '') {
  const { starts, mine, last } = await libraryData()
  last.cont = true
  library($('#library'), starts, mine, err)
  const [{ mountLibrary }, prog] = await Promise.all([import('../library-view'), store.allProgress()])
  mountLibrary($('#library'), prog, libSong)
}

export async function libSong(p: Piece) {
  return store.toSong({ id: `lib:${p.id}`, title: p.title, bytes: await lib.pieceBytes(p), added: 0, kind: p.format === 'midi' ? 'midi' : 'xml', pick: p.pick }, settings.split)
}

/** Choose which tracks of a stored MIDI file to read, with a live count of how crowded the staff will be. */
export async function openTracks(id: string) {
  const s = (await store.listSongs()).find((x) => x.id === id)
  if (!s) return
  const midi = s.kind !== 'xml'
  const r = midi ? inspectMidi(s.bytes) : undefined
  let pick = s.pick ?? (r ? autoSelect(r) : { tracks: [], hands: {} })
  const song = await store.toSong(s, settings.split)
  const f = song.fifths
  const facts: [string, string][] = [
    ['Notes', String(song.notes.length)],
    ['Bars', String(song.bars.length)],
    ['Length', `${Math.floor(song.end / 60)}:${String(Math.round(song.end % 60)).padStart(2, '0')}`],
    ['Key', f === 0 ? 'No sharps or flats' : `${Math.abs(f)} ${f > 0 ? 'sharp' : 'flat'}${Math.abs(f) > 1 ? 's' : ''}`],
    ...(r ? ([['Drums', r.tracks.some((t) => t.percussion) ? 'Present, left out' : 'None']] as [string, string][]) : []),
  ]
  const dlg = $('#tracks') as HTMLDialogElement
  const order = [...pick.tracks] // the tracks in use first, fixed while the dialog is open
  const draw = () => {
    dlg.innerHTML = tracksDialog(s.title, r, pick, noteName, facts, order)
    dlg.querySelectorAll<HTMLInputElement>('input[data-tk]').forEach((c) => {
      c.onchange = () => {
        const i = Number(c.dataset.tk)
        pick = { ...pick, tracks: c.checked ? [...pick.tracks, i] : pick.tracks.filter((x) => x !== i) }
        draw()
      }
    })
    dlg.querySelectorAll<HTMLSelectElement>('select[data-tkh]').forEach((sel) => {
      sel.onchange = () => {
        const i = Number(sel.dataset.tkh)
        const hands = { ...pick.hands }
        if (sel.value === 'auto') delete hands[i]
        else hands[i] = sel.value as 'R' | 'L'
        pick = { ...pick, hands }
      }
    })
    dlg.querySelector<HTMLButtonElement>('#tkAuto')?.addEventListener('click', () => {
      if (r) pick = autoSelect(r)
      draw()
    })
    $('#tkCancel', dlg).onclick = () => dlg.close()
    $('#tkRemove', dlg).onclick = async () => {
      if (!confirm(`Remove ${s.title} from this browser?`)) return
      await store.removeSong(id)
      dlg.close()
      void showLibrary()
    }
    $('#tkShare', dlg).onclick = () => void shareFile(new File([s.bytes], `${s.title}${midi ? '.mid' : '.musicxml'}`, { type: midi ? 'audio/midi' : 'application/xml' }))
    const apply = dlg.querySelector<HTMLButtonElement>('#tkApply')
    if (apply)
      apply.onclick = async () => {
        if (!pick.tracks.length) return
        await store.setPick(id, pick)
        lens.delete(id)
        thumbs.delete(id)
        dlg.close()
        void showLibrary()
      }
  }
  draw()
  dlg.showModal()
}

/** Save or share a file: the iPad has no downloads folder, so it uses the share sheet. */
export async function shareFile(file: File) {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: file.name }).catch(() => {})
    return
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  URL.revokeObjectURL(a.href)
}

async function importFiles(files: FileList | File[]) {
  const errs: string[] = []
  for (const f of files) {
    if (!/\.(mid|midi|xml|musicxml|mxl)$/i.test(f.name)) {
      errs.push(`${f.name}: only MIDI (.mid) and MusicXML (.musicxml, .mxl) files.`)
      continue
    }
    try {
      await store.addFile(f)
    } catch (err) {
      errs.push(`${f.name}: ${(err as Error).message || 'could not read this MIDI file.'}`)
    }
  }
  if (!current) await hooks.showSection('songs', errs.join(' '))
}

$('#library').addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement
  if (t.id === 'file' && t.files) void importFiles(t.files).then(() => (t.value = ''))
})
addEventListener('dragover', (e) => {
  e.preventDefault()
  document.querySelector('#library')?.classList.add('over')
})
addEventListener('dragleave', () => document.querySelector('#library')?.classList.remove('over'))
addEventListener('drop', (e) => {
  e.preventDefault()
  document.querySelector('#library')?.classList.remove('over')
  if (e.dataTransfer?.files.length) void importFiles(e.dataTransfer.files)
})
