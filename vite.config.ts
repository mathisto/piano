import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return '' // built outside a checkout
  }
})()

export default defineConfig({
  define: { __COMMIT__: JSON.stringify(commit) },
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
  test: { include: ['src/**/*.test.ts'] },
})
