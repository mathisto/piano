# Touch and VoiceOver controls — 6 November 2026

## TL;DR

The two core practice gestures that excluded an iPad VoiceOver or switch user now have direct alternatives. The on-screen piano is a group of named note buttons, and an A–B loop can be made with taps through Practice instead of a drag. Interrupted pointers also release every key and gesture cleanly.

## What changed

- Every visible on-screen piano key is a real button named by pitch. Direct touch still supports chords and gliding; keyboard or VoiceOver activation uses the same note path. Theory allows four seconds between assistively activated chord notes so navigating to the next key does not submit early.
- Learn keeps its fast scrubber drag, and adds a tap-only route: select a bar on the timeline, choose Practice > Set start, select the last bar and choose Set end. The persistent banner says what to do next and confirms the resulting bar range.
- The on-screen piano, the play-screen keys, staff pinch/tap, pane divider and scrubber now clear transient pointer state when capture is lost or a gesture is cancelled. A system interruption cannot leave a note held or a drag half-active.
- Whole-page swipe navigation was considered and rejected. It would conflict with VoiceOver's navigation gestures, the scrubber and staff, and iPad edge gestures while duplicating the always-present section tabs.

## Why this shape

Apple recommends 44-point controls and interfaces that work with VoiceOver, and WCAG 2.5.7 requires a single-pointer alternative to dragging. A keyboard alternative alone does not satisfy that touch requirement. The implementation adds equivalent controls only where the gesture carried an action; it does not assign a second meaning to swipes across the whole app.

Sources: [Apple design tips](https://developer.apple.com/design/tips/), [Apple VoiceOver evaluation criteria](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/voiceover-evaluation-criteria), [WCAG 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements), [WCAG 2.5.1 Pointer Gestures](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures).

## Verification

- Focused unit and bundle tests cover the piano, theory, CSS and unchanged boot budget.
- End-to-end feature 14 activates a complete Theory chord through synthetic button clicks, verifies note names did not toggle, and answers a Scale Quiz by direct touchscreen taps.
- The Songs end-to-end flow verifies both scrubber drag and the tap/menu route produce exact A–B loops before completing the practice chain.
- Light portrait, dark landscape and the accessibility tree were inspected. The tree exposes the on-screen piano as named note buttons and the loop action with its current start/end state.

## Check on the iPad

1. Turn on VoiceOver, open Theory > Chords and enable On-screen keys. Swipe to C4 and activate it; confirm every key is announced by pitch and a chord can be entered without rushing.
2. Turn VoiceOver off and play a Theory chord with two fingers, then glide one finger across several keys. Confirm chords and gliding still sound once per key.
3. Open a piece in Learn. Tap bar 1 on the timeline, choose Practice > Set start, tap bar 3, then Practice > Set end. Confirm the banner and loop both say bars 1 to 3.
4. Drag across the timeline to replace that loop, then background and foreground the app while touching a key or dragging the sheet divider. Confirm no note, highlight or drag remains stuck.
