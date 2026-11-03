# Reading results clarity (2 Nov 2026)

## What changed
- Reading drill, Sight run and paced Sight run results lead with the plain outcome: `24 of 26`, then `right first try` or `on the beat`. The internal “card” unit is gone from visible and spoken result copy because it can mean a note, chord, interval or fragment.
- The result hierarchy is now title and outcome, prior-run comparison, two labelled facts, next focus, then actions. Per-note and paced-run strips moved behind a disclosure.
- A like-for-like prior result is matched by stable id and display label. Accuracy reports points up, down or matched; `Personal best` appears only when the current accuracy is strictly above every matching recorded result. Time remains context, not a record that rewards rushing.
- Weak-note review no longer shows a meaningless `0% → 0%` stage-mastery line.
- Buttons no longer animate their background when a rerender moves the lamp. That transition briefly put ghost-button text over the old brass fill at 4.4:1; state changes are now immediately contrast-safe.

## Verified
- `npx tsc --noEmit -p .`
- `npx vitest run`: 1,035 passed, 4 skipped.
- `npm run build`: production build passed without changing the boot budget.
- `npm run e2e`: 47 of 47 passed, including reading drill, both Sight run modes and the state-dependent accessibility sweep.
- Nocturne and Matinée at 1180×820, 820×1180 and 390×844 in Chromium: all three result variants fit, preserve hierarchy and keep their actions reachable.

## Still to verify
- The result on a physical iPad with MIDI input.
