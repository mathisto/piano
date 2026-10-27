// Bundles pipeline.ts with the app's importers into one plain Node module: npx vite build --config scripts/library/vite.config.mjs
const root = new URL('../..', import.meta.url).pathname
export default {
  publicDir: false,
  ssr: { noExternal: true },
  build: { ssr: `${root}scripts/library/pipeline.ts`, outDir: `${root}.cache/library/bin`, emptyOutDir: true, target: 'node22', rollupOptions: { output: { entryFileNames: 'pipeline.mjs' } } },
  logLevel: 'warn',
}
