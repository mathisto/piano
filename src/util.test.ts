import { describe, expect, it } from 'vitest'
import { focusKey } from './util'

describe('focusKey', () => {
  it('finds a control by id first, else a radio by name and value', () => {
    expect(focusKey({ id: 'rClef', name: 'x', value: 'y' })).toBe('[id="rClef"]')
    expect(focusKey({ id: '', name: 'level', value: '2' })).toBe('[name="level"][value="2"]')
    expect(focusKey({ id: '', name: '', value: '' })).toBe('')
  })
  it('quotes what it cannot trust', () => {
    expect(focusKey({ name: 'you', value: 'a "b" \\c' })).toBe('[name="you"][value="a \\"b\\" \\\\c"]')
  })
})
