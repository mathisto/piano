import { defineConfig } from 'vite'

export default defineConfig({
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
  test: { include: ['src/**/*.test.ts'] },
})
