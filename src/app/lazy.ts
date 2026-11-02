// Features that load on first use, not at boot (docs/changes/perf.md). A key handler reads `theoryUi` without waiting:
// not loaded yet means no Theory card is open.
export let theoryUi: typeof import('./theory-ui') | undefined
export let covers: typeof import('../cover') | undefined // the covers' code (cover.ts), fetched when the first page that shows one is built
let memoriseUi: typeof import('./memorise-ui') | undefined
export const cover = async () => (covers ??= await import('../cover'))
export const theory = async () => (theoryUi ??= await import('./theory-ui'))
export const memorise = async () => (memoriseUi ??= await import('./memorise-ui'))
