import { expect, it } from 'vitest'
import { library } from './library-view'
import type { Row } from './ui'

it('a catalogue id cannot break out of its data attribute', () => {
  const el = { innerHTML: '' } as HTMLElement
  const bad = 'lib:x"><img src=x onerror=alert(1)>'
  library(el, [], [{ id: bad, title: 't', sub: '', bars: 1, len: 0, user: true, thumb: '', tracks: true } satisfies Row])
  expect(el.innerHTML).not.toContain('<img')
  expect(el.innerHTML).toContain('data-open="lib:x&quot;&gt;&lt;img')
})
