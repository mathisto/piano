# Boot headroom: Memorise on first use

## TL;DR

Memorise and its memory engine now load when Memorise starts, not with Today. Test-build boot JavaScript fell from 222,113 to 220,403 bytes; `BUDGET` stays 223,000, leaving 2,597 bytes of headroom.

## Change

`scales.ts` is still needed at boot: Today computes the next scale and run completion scores scale mastery. The narrower correct boundary is Memorise. All three entry points (a Songs row, Start here, and a clean Learn result) share `app/lazy.ts`; the loaded module registers the existing stage-card hooks before it sets memory state. `app/play.ts` no longer imports `memory.ts` just to draw a card that cannot exist outside a Memorise session.

The bundle ratchet now refuses both `app/memorise-ui.ts` and `memory.ts` in the static boot graph. The budget was not raised.

## Checked

- `node scripts/bootmods.mjs`: 220,403 bytes (was 222,113).
- `npx tsc --noEmit -p .`: clean.
- `npm test -- --run`: 77 files passed, 1 skipped; 1,023 tests passed, 4 skipped.
- `E2E_ONLY='^17 Memorise' npm run e2e`: 1 of 1 passed.

