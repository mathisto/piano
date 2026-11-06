import { expect, it } from 'vitest'
import { library } from './library-view'
import type { Row } from './ui'
import { setupDialog } from './ui-sheets'

it('a catalogue id cannot break out of its data attribute', () => {
  const el = { innerHTML: '' } as HTMLElement
  const bad = 'lib:x"><img src=x onerror=alert(1)>'
  library(el, [], [{ id: bad, title: 't', sub: '', bars: 1, len: 0, user: true, cover: {}, tracks: true } satisfies Row])
  expect(el.innerHTML).not.toContain('<img')
  expect(el.innerHTML).toContain('data-open="lib:x&quot;&gt;&lt;img')
})

it('Songs names own-file import and offers narrow damaged-file recovery', () => {
  const el = { innerHTML: '' } as HTMLElement
  library(el, [], [], '', [{ id: 'bad', title: 'Broken score' }])
  expect(el.innerHTML).toContain('Bring your own MIDI or MusicXML')
  expect(el.innerHTML).toContain('Broken score could not be read, so it was skipped.')
  expect(el.innerHTML).toContain('data-forget-damaged')
})

it('first-run Set up makes own-file import a direct action', () => {
  const html = setupDialog('No keyboard', false, 0)
  expect(html).toContain('Five steps')
  expect(html).toContain('Bring your own MIDI or MusicXML')
  expect(html).toContain('id="suFiles"')
})
