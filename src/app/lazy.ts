// Features that load on first use, not at boot (docs/changes/perf.md). A key handler reads `theoryUi` without waiting:
// not loaded yet means no Theory card is open.
export let theoryUi: typeof import('./theory-ui') | undefined
export const theory = async () => (theoryUi ??= await import('./theory-ui'))
