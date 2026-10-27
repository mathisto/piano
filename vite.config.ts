import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin, transformWithOxc } from 'vite'

const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return '' // built outside a checkout
  }
})()

// dist/sw.js: src/sw.ts plus the list of built files. Hashed names change with content, so the hash of the names is the version.
const sw = (): Plugin => ({
  name: 'sw',
  apply: 'build',
  enforce: 'post',
  async generateBundle(_, bundle) {
    const files = ['/', ...Object.keys(bundle).filter((f) => !f.endsWith('.map')).map((f) => `/${f}`)].sort()
    const version = createHash('sha1').update(files.join()).digest('hex').slice(0, 10)
    const { code } = await transformWithOxc(readFileSync(new URL('./src/sw.ts', import.meta.url), 'utf8'), 'sw.ts')
    this.emitFile({ type: 'asset', fileName: 'sw.js', source: `const PRECACHE=${JSON.stringify(files)},VERSION=${JSON.stringify(version)};\n${code.replace(/^export /gm, '')}` })
  },
})

export default defineConfig({
  plugins: [sw()],
  define: { __COMMIT__: JSON.stringify(commit) },
  build: { target: 'es2022', chunkSizeWarningLimit: 330 },
  test: { include: ['src/**/*.test.ts'] },
})
