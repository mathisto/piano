import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('../app-store/', import.meta.url)
const meta = JSON.parse(readFileSync(new URL('metadata.json', root), 'utf8')) as Record<string, unknown> & {
  name: string
  subtitle: string
  promotionalText: string
  description: string
  keywords: string
  urls: Record<string, string>
}

describe('App Store package', () => {
  it('fits every Apple metadata limit and points at the launch domain', () => {
    expect([...meta.name]).toHaveLength(12)
    expect([...meta.name].length).toBeLessThanOrEqual(30)
    expect([...meta.subtitle]).toHaveLength(30)
    expect([...meta.promotionalText].length).toBeLessThanOrEqual(170)
    expect([...meta.description].length).toBeLessThanOrEqual(4000)
    expect(Buffer.byteLength(meta.keywords)).toBeLessThanOrEqual(100)
    expect(new Set(meta.keywords.split(',')).size).toBe(meta.keywords.split(',').length)
    expect(Object.values(meta.urls).every((url) => url.startsWith('https://pagetohand.com'))).toBe(true)
    expect(meta.description).toContain('Page to Hand in iCloud Drive')
    expect(meta.description).not.toContain('folder you choose')
  })

  it('has six opaque 13-inch iPad landscape screenshots', () => {
    const dir = new URL('screenshots/13-inch/', root)
    const files = readdirSync(dir).filter((file) => file.endsWith('.png')).sort()
    expect(files).toEqual([
      '01-practice-next.png',
      '02-real-piano.png',
      '03-fix-the-bars.png',
      '04-import-your-score.png',
      '05-build-the-skill.png',
      '06-own-your-practice.png',
    ])
    for (const file of files) {
      const png = readFileSync(new URL(file, dir))
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([2752, 2064])
      expect(png[25]).toBe(2) // truecolour, no alpha channel
    }
  })
})
