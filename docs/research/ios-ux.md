# iOS / iPadOS UX: what current Apple guidance and the web-view shell mean for piano

Research date: 2026-10-19. Scope: Apple HIG as it stands after the Liquid Glass release (iOS/iPadOS 26), resizable panes on touch, WKWebView/Capacitor polish, practice-app UX at the instrument, and dev-install facts. Measured against the code as read on 19 Oct 12:40 (`src/style.css`, `src/main.ts`, `src/audio.ts`, `capacitor.config.ts`, `ios/App/App/*`). Not a plan to rebuild the shell: a decision record.

Evidence tags:

- **[V]** read on the primary page in this session (Apple HIG pages were read through Apple's own JSON endpoint behind developer.apple.com/design, which the earlier research note said was unreadable).
- **[S]** secondary: a mirror, blog, forum thread, vendor write-up or a search-result snippet. Plausible, not proven.
- **[M]** from memory or inference; verify on the device before relying on it.
- **[C]** computed or read from this repo by me.

Numbers in brackets point at the source list at the end.

**Moving target.** While this note was being written another session landed a draggable staff/highway divider (`#split`, `settings.pane`, `setPane`, `nudge` in `main.ts`, 18px bar in `style.css`, modified 12:39). Section 3 audits that code, not a hypothetical. It has not been run on the iPad.

Gaps up front: Apple's own HIG Split Views page returned an empty shell; the text used is a mirror of it [2]. Material 3's bottom-sheet spec page was empty, so no Material numbers are quoted as spec. The Logic Pro iPad page on resize handles was only seen as a search snippet. I found nothing primary on how Simply Piano, flowkey, Yousician, Skoove or Piano Marvel combine falling notes and notation; `products-and-ux.md` already holds what is known. Ableton Note, Notion and Apple Maps were not researched beyond the HIG sheets page.

---

## 1. Headline findings

1. **The iPad Air has no haptics, so haptics is a non-feature here.** iPads lack a Taptic Engine; haptics reach an iPad only through Apple Pencil Pro and some trackpads [28][S]. Capacitor's Haptics calls resolve silently as no-ops on hardware without one [26]. Do not install `@capacitor/haptics`; carry snap feedback in the grabber's look and in sound instead.
2. **The iPad Air is almost certainly 60 Hz, so the "60 Hz web view cap" is moot.** Apple's Air spec page lists no ProMotion or refresh rate [29][V: absence]. The WKWebView cap is real and has no public switch (WebKit bug 294338, open) [30][S], which matters only on an iPad Pro.
3. **One real bug risk in audio.** `audio.ts` resumes the context only when its state is `suspended`. On iOS Safari-family engines a context paused by a call, Siri, lock or backgrounding reports `interrupted`, and needs `resume()` too [31][V]. One-line fix, no new code paths.
4. **Touch polish is mostly missing and cheap.** No `user-select: none` outside `.switch`, no tap-highlight or callout suppression, no `overscroll-behavior`, no `touch-action: manipulation`. Capacitor's `scrollEnabled: false` and `zoomEnabled` (default false) already cover the big two [27].
5. **The divider already follows most of the research.** 48x5 grabber, 46px hit area, pointer capture, `touch-action: none`, persisted position, ends collapse to one pane, tap restores, arrow keys, `role="separator"` with `aria-valuenow`. Gaps are small: tap-to-cycle on the grabber, Enter to collapse (APG), a touch-safe reset (double-tap is untested on iPad), and a visible snap cue [1][23].
6. **44pt is Apple's default, not its minimum.** HIG accessibility: default 44x44pt, minimum 28x28pt on iOS/iPadOS, about 12pt padding around bezelled controls [4][V]. WCAG 2.2 AA asks for 24 CSS px [25][V]. The app's coarse 44px controls meet Apple's default; the 38px coarse segment cells sit between the two and are acceptable with their spacing.
7. **Dark-mode contrast: one tier is thin.** `--ink-3` (#8a8fbd) is 5.9:1 on panel [C]. Apple's Dark Mode page asks for 4.5:1 minimum and 7:1 for small custom text [11][V]. 38 rules use `--ink-3`; it passes the floor and misses the aim at 13-15px.
8. **Distance is the real iPad constraint.** Apple's iPadOS page says to size content for viewing within about three feet [6][V], which matches the 60-90 cm music stand. Body text at 15px is fine in menus and too small to glance at mid-song; play-screen text should be at or above Apple's 17pt default [10][V].
9. **Windowing is a design decision, not a bug.** HIG: "even landscape-only apps should resize well" [3][V]; iPadOS 26 adds a resize handle on every multitasking-capable app and floating windows [19][V]. The app already has `ResizeObserver`s, but replaces itself with a full-screen notice under 1024px. For a one-user dev app that is defensible; see Decided against.
10. **Liquid Glass does not apply to this app.** Apple limits it to the functional layer (bars, sidebars, controls) and says to keep it out of the content layer [5][V]. This app is a dark-only immersive surface with no system bars; the only place it would apply is native sheets, which it does not use. The Dark Mode page itself allows an immersive dark-only app (Stocks on iPhone is the cited example) [11][V].

---

## 2. Principle, today, gap, recommendation

"Today" is checked against the code, not the docs. R = recommendation id in section 4.

### HIG and platform

| Principle | Today | Gap | Recommendation |
|---|---|---|---|
| Hit targets 44pt default, 28pt min, 12pt padding [4] | `--control: 44px` under `pointer: coarse`; small buttons 44; segment cells 38; slider thumb 32; divider hit 46px | Segment cells 38 | Keep. Re-check cell spacing on the iPad; no change needed |
| Safe areas [3] | `viewport-fit=cover`, `#app` pads `env(safe-area-inset-*)`, `contentInset: never`, `100dvh` | None in full screen. Windowed iPadOS 26: window controls sit at the top-left and the system adds a safe area above the toolbar for apps not updated [19][V]; whether this reaches a WKWebView app is unknown [M] | Test windowed on device (R10). Nothing to build until seen |
| Status bar / home indicator | `UIStatusBarHidden` true, view-controller-based appearance off; bottom pad from env() | Home indicator stays lit; harmless. Dock sits above the padded strip so the system swipe-up never meets a touchable key | None. Auto-hide is cosmetic (R13) |
| Typography: 17pt default, 11pt min, Dynamic Type or another way to resize, no thin weights [10] | Fixed px; body 15, labels 13, bar numbers 12; Hanken 400-800, Barlow 800 | No Dynamic Type; 13px labels in ink-3; nothing resizes UI text | Raise play-screen text (R7). Dynamic Type itself: decided against |
| Contrast 4.5:1 min, 7:1 for small custom text in dark [11][4] | ink 15.5, ink-2 8.3, ink-3 5.9 on panel; edge border 3.1; lane grid 2.3 (decorative); key-muted 3.2 on ground [C] | ink-3 text below 7:1; muted key names 3.2:1 | R5, R6 |
| Don't rely on colour alone [12] | Shape plus word plus hue (hand fill style, judgement words, shape swatches) | None. Strong | Keep |
| Dark mode: elevated vs base, avoid app-only appearance setting [11] | Dark only, `color-scheme: dark`, `theme-color` | Violates "support both" in letter; the page carves out immersive dark-only apps | Keep dark-only; say so in DESIGN.md |
| Reduce Motion: fades over movement, tighter springs, no motion as the only signal [4][9] | CSS durations to 0.01ms, canvas capped to Calm, default fx Calm if reduced | Doesn't react live if the setting changes mid-session (`settings.ts` reads it once at load; `highway.ts` re-reads) | Fine. Optional: listen to `change` |
| Haptics: only for discrete events, optional, never the only cue [8] | None | iPad Air cannot play them | Decided against (headline 1) |
| Sheets and detents: grabber on resizable sheets, tapping it cycles detents, VoiceOver can resize with it, `largestUndimmedDetent` for a nonmodal sheet [1][22] | Dialogs are centred sheets (page-sheet style, matches HIG iPad advice [1]); the new `#split` is the in-app analogue | Tap-to-cycle on the grabber missing | R2 |
| Split views on iPad: design at narrow, compact and intermediate widths; let people hide a pane; offer more than one way to reveal it; keep the divider visible [2] | Divider ends collapse a pane; tap on a collapsed edge restores; top-bar Staff/Both/Falling switch also reveals | Hiding works; second reveal route is the view switch, which hides in Zen | R2: Zen keeps the grabber visible |
| Multitasking: save and restore state, pause on leave [7] | `visibilitychange` pauses the game; `pagehide` ends the pass; settings and songs persist | Resume of audio (headline 3); Slide Over / Split View hit the 1024px notice | R1; R11 |
| Gestures: custom gestures must not be the only way; offer button alternatives [16] | Drag divider plus view switch, scrub bar plus bar tap, dock buttons | Scrub drag has no stepper; fine for a pointer | Keep |
| Pointer: iPadOS 26 pointer tracks 1:1, no magnetism; highlight effect on controls [19][15] | Hover styles from CSS only; `cursor: row-resize` on the divider | Nothing needed | Keep |
| Keyboard: Cmd as main modifier, few custom shortcuts, Esc cancels [17] | Plain-letter shortcuts (Space, V, M, [ ], H), no menu bar | Plain letters are fine for a play surface; no menu bar entries | Decided against a menu bar |
| Launching: launch screen is not a splash, no text, match the first screen and orientation [14] | Dark splash image with the logo, `scaleAspectFill`, storyboard fallback white | Logo on launch screen is "don't"; fill is a near match for ground (#090b17), confirm exact hex | R12 |
| App icon: 1024 layered, no text, dark and tinted variants generated by the system [18] | One flat 1024 PNG, dark, three bars and a lamp bar | Fine. Liquid Glass layering optional | Keep |

### Divider and panes (details in section 3)

| Principle | Today | Gap | Recommendation |
|---|---|---|---|
| Grabber visible, big enough, hit area bigger than the glyph [1][2] | 48x5 glyph in an 18px bar, `::after` hit area 46px tall, full width | Good. Flutter's default handle is 32x4 [42][S] so 48x5 is in range | Keep |
| Snap points | Continuous between 0.26 and 0.72; past 0.17 collapses staff, past 0.80 collapses highway; default 0.4 | No detent at 0.4 while dragging; no hysteresis around the stops | R2 (optional) |
| Velocity-based settle [20] | None; position only | Matters for flicks only | Decided against |
| Rubber-banding [20] | Hard clamp at min/max, jump at the stop | Acceptable on a 2-position-plus-free control | Decided against |
| Persist state | `settings.pane` + `settings.view`, saved on pointer up | Good | Keep |
| Non-drag alternative [24][23] | Top-bar view switch; arrow keys; tap on collapsed edge | Double-click reset is untested on iPad touch [M]; no Enter-collapse | R2 |
| Haptic on snap | None | iPad has none | Decided against |

### WKWebView and Capacitor shell

| Principle | Today | Gap | Recommendation |
|---|---|---|---|
| No rubber-band overscroll [33][27] | `scrollEnabled: false` | `overscroll-behavior` unset. Safe because nothing scrolls at the web-view level; pages scroll inside `.view` | R3 (belt and braces; scrolling pages inside `.view` can still chain) |
| No selection, callout, tap highlight | `user-select: none` only on `.switch` | Long-press on staff text, HUD, buttons can start a selection with a loupe | R3 |
| `touch-action` [32] | `none` on `#stage canvas`, `.scrub`, `#split` | Rest of UI uses `auto`: double-tap can delay clicks | R3 (`manipulation` on `body`) |
| Zoom off | Capacitor `zoomEnabled` defaults to false [27]; `user-scalable=no` is ignored by modern iOS anyway [44][S] | None | Keep |
| `100dvh`, `env(safe-area-inset-*)` [3] | Both used on `#app` | Done | Keep |
| Pointer events with capture | Used on canvas keys, scrub bar and divider | Good. `getCoalescedEvents` only from iOS Safari 18.2 [34][V]; not needed here | Keep |
| 120 Hz | 60 Hz on the Air | n/a | Decided against |
| Keep awake | Native `isIdleTimerDisabled = true` in AppDelegate | Always on, even in menus; battery cost on a plugged-in stand is nil | Keep |
| Audio session (silent switch) [13] | Native `.playback` + `mixWithOthers`; JS also sets `navigator.audioSession.type` | `audioSession` is experimental on the web [31 note]; harmless in the app, useful on iPad Safari | Keep |
| Audio interruption [31][13] | `ctx.state === 'suspended'` check | Misses `interrupted` | R1 |
| MIDI and Bluetooth lifecycle | CoreMIDI client re-lists sources on any change; ports reconnect after replug; Web MIDI path fakes `onstatechange` | Foreground return needs nothing if CoreMIDI notifies; README already notes BLE pairing crashes on iPadOS 27.0 | Keep USB; add to device checklist |
| Offline / PWA | No service worker, no manifest | App bundles its assets so it is offline in the shell. Web build needs the network on first visit | Decided against (iPad Safari has no Web MIDI anyway) |
| Orientation | iPad landscape left/right only; portrait keys for iPhone family still listed | Matches HIG "landscape-only must work rotated either way" [14] | Keep |

---

## 3. Resizable panes on touch: what the research says, and the landed divider

### What the references do

- **iOS sheets (HIG).** Detents are rest heights: system `large` and `medium`, plus custom ones. A resizable sheet should show a grabber; tapping it cycles through the detents, and it works with VoiceOver so people can resize without seeing the screen [1][V]. `largestUndimmedDetentIdentifier` leaves the content behind interactive up to that detent: the nonmodal pattern [22][V]. In iOS 26 partial sheets are inset with a glass background that turns opaque as they grow to full height [40][S]; irrelevant to a canvas app, relevant only as the current look of the thing users already know.
- **Fluid-interface motion (WWDC18 803).** Project momentum: use the release velocity and a deceleration rate to find where the gesture would come to rest, then snap there, not to the nearest edge of the release point. Rubber-band softly at hard boundaries; use springs with no overshoot (100% damping) for tap-driven transitions and about 80% for swipe dismissals; keep gestures interruptible [20][V]. It gives no hit-target number; it advises an extra margin around tap areas to avoid accidental cancels [20][V].
- **Split views (HIG, mirror).** On iPad, resizable windows mean a split must work at narrow, compact and intermediate widths. For resizable panes: set sensible min and max sizes "that keep the divider visible", prefer the thin one-point divider style, let people hide a pane, and offer more than one way to bring it back [2][S: mirror of Apple text]. No numeric grabber sizes appear.
- **Window splitter (ARIA APG).** `role="separator"`, focusable, `aria-valuenow/min/max`, arrow keys move it, **Enter collapses and restores** the primary pane, Home/End go to the extremes [23][V]. The page notes the pattern is under review.
- **Dragging needs an alternative (WCAG 2.5.7, AA).** Anything operated by dragging must be achievable by a single pointer without dragging; a text input, buttons or a menu qualify. Keyboard alone does not [24][V]. The page does not name resizing; applying it there is an inference.
- **Logic Pro for iPad.** A resize handle on an area's local menu bar: drag vertically, tap toggles default and maximum size, drag all the way to close [35][S: snippet]. This is the closest touch-DAW precedent for "tap the handle to toggle, drag to resize".
- **Newzik and forScore half-page turn.** Newzik: a blue dot marks the split, drag to move it, apply to one page or all, drag it to the very bottom to switch it off for that page [36][V]. forScore stores the divider position per page of score [36][S]. Precedent for "drag to an end = off" and for persisting the position.
- **Synthesia.** Offers falling notes or sheet music for any song, with sheet music added later at user request and paid [37][V]. A forum user reports both at once [S]; Synthesia's own page treats them as alternatives. No evidence that any competitor lets the player draw the line between the two. That is a gap piano can own.

### Audit of the landed divider (code as of 12:40)

What is there: 18px bar between `#staff` and `#stage`, 48x5 grabber in `--ink-3`, 46px hit area from `::after`, `touch-action: none`, `row-resize`, pointer capture, `setPane` clamps the staff share to 0.26-0.72 and switches to Falling-only below 0.17 and Sheet-only above 0.80, `nudge` by keyboard in 6% steps through the same stops, double-click resets to 0.4, a tap on a collapsed edge brings the other pane back, state in `settings.pane` and `settings.view`, `role="separator"` with `aria-valuenow` and `aria-valuetext`, hidden in Read drills.

It matches the HIG sheet advice on the grabber, the WCAG alternative (the top-bar view switch is a single-pointer, no-drag route) and the APG on arrows. Concerns, in order:

1. **Double-tap reset on touch is unproven.** Whether `dblclick` fires from a double tap on an element with `touch-action: none` in WKWebView is not something I could confirm [M]. The HIG pattern is a single tap on the grabber. Make a tap (no movement) cycle: Both, then Sheet only, then Falling only, then Both, or simply reset-to-default, then collapse on the next tap. The existing "tap on a collapsed edge restores" is half of it.
2. **Per-move relayout.** Each pointer move rewrites two CSS variables; a `ResizeObserver` then calls `staff.render()` (a full SVG rebuild through `layout()`) and the highway resizes its PixiJS renderer. One observer callback per frame is fine on an M-class iPad; on an older iPad Air with a dense bar the rebuild is the thing to measure. If it drops frames, preview with the CSS variables only and rebuild the staff on release [M].
3. **No snap cue.** Crossing 0.17 or 0.80 swaps the whole layout in one frame with no feedback. Cheapest cue: the grabber turns lamp-coloured while it is past a collapse threshold, so the player sees "release here collapses". (Lamp amber is the "play this now" colour in DESIGN.md; ink-2 to Ink is the on-brand alternative.)
4. **Zen hides the way back.** Zen removes the bar, and the view switch with it. The grabber stays in the grid, so it is the single route back from a collapsed pane; make sure it is visible there too, which it is unless `v-falling` puts it at the very top where the 46px hit area overlaps the system's swipe-down zone for the menu bar [19][V: swipe down reveals it].
5. **VoiceOver.** `role="separator"` with `aria-valuenow` is the APG shape; whether iOS VoiceOver offers swipe-up/down adjustment for it is unknown [M]. A `role="slider"`-style fallback is not warranted until tested.

---

## 4. Prioritised changes

**Status, 19 Oct:** R1, R2 (a-d), R3, R4, R5 and R7 for mid-song text, R8, R9 and R12 are done. The top-bar Staff/Both/Falling switch described above no longer exists (the divider replaced it), so the single-pointer alternative to dragging is a tap on the grabber, which cycles both, staff only, falling only; Enter does the same and double-click reset was dropped. Open: R2(e) drag frame time, R6, R10, R11, R13, all device checks.

Ranked by impact for the owner's actual use (iPad on the stand, FP-10 over USB, landscape). Each is small and independent. Verification is on the device unless noted.

**P1: do next**

- **R1. Resume the audio context on `interrupted` as well as `suspended`.** `audio.ts` `ready()`: `if (ctx.state !== 'running') void ctx.resume()`. Also call it when the page becomes visible again. Reason: [31]. Check: lock the iPad mid-session, wake it, tap Play, count-in click and browser sound return. Confidence the bug exists in the shell: medium [S: WebKit bugs describe `resume()` failures; the native session is `.playback`, which may already keep it running].
- **R2. Finish the divider.** (a) Tap on the grabber cycles Both, Sheet, Falling, Both (HIG [1]); keep drag. (b) Enter or Space on the focused separator collapses and restores (APG [23]). (c) Grabber colour change past a collapse threshold. (d) Keep the grabber visible in Zen. (e) Measure frame time during a drag on the iPad. Reason: section 3.
- **R3. One touch-polish block in `style.css`.** `html, body { overscroll-behavior: none; }`, `body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }`, then `input, select, textarea, .selectable { user-select: text; }` for the delay field and anything copyable. Reason: [32][33]; the prefixed forms are from memory [M] and cost nothing. Check: long-press on the HUD, the staff and a song title; double-tap a button fast.
- **R4. Update the Info.plist `UIRequiredDeviceCapabilities` from `armv7` to `arm64`.** Stale from the template; harmless today, wrong for any modern device filter [M]. One line. (File it if it turns out to break the free-account install.)

**P2: next session**

- **R5. Contrast: stop using `--ink-3` for text under 17px.** Use `--ink-2` (8.3:1) for labels, captions and bar numbers; keep `--ink-3` for icons, grabbers, 18px and larger text. Do not brighten `--ink-3` itself: #a0a5d0 would reach 7.65:1 and collapse into `--ink-2`, erasing a tier [C]. Reason: [11][4].
- **R6. Check non-text and muted pairs.** Muted key names (#5b5f8a on ground) are 3.2:1 [C]; they are labels the player may read at a glance. Raise to 4.5:1 or drop the names that are not needed (middle C only). Lane grid at 2.3:1 is decoration, not information.
- **R7. Raise play-screen text to the 17pt default.** At 60-90 cm, one pixel on this panel is 0.19 mm, so a 15px label has about 2.0 mm cap height, which is 9-10 arcminutes at 75 cm [C]; secondary sources put preferred character height at 20-22 arcminutes and the minimum at 16 for sustained reading at desktop distance [41][S]. Menus are read at arm's length, so only what must be read mid-song needs this: dock labels, tempo and loop readouts, hand names, bar numbers (12px). HUD numerals (30px) and judgement words (40px) already land near the preferred band.
- **R8. Keep the staff at print size.** The staff space is 10px = 1.9 mm; a typical printed staff space is about 1.75-2 mm [M]. Do not shrink it when the divider squeezes; the 0.26 minimum share already guards this. State it as a rule in DESIGN.md.
- **R9. Write the iPad facts back into PRODUCT.md and DESIGN.md.** The critique already flagged drift [ui-critique]. Add: iPad Air is 60 Hz and has no haptics; dark-only by decision; divider behaviour.

**P3: when the device checklist comes round**

- **R10. Device checklist additions** (README already lists some): windowed Stage Manager resize and Slide Over (what does the 1024px notice do, where do the window controls land); long-press behaviour after R3; audio after lock, Siri and a call; unplug and replug the FP-10 mid-song; divider drag frame time; Magic Keyboard / trackpad hover on the divider.
- **R11. Decide the small-window policy.** Option A, cheap: in `SceneDelegate`, `windowScene.sizeRestrictions?.minimumSize = CGSize(width: 1024, height: 700)` [21][V: property exists; Stage Manager behaviour not stated on the page]. Option B, real: a compact layout below 1024. HIG says do B eventually [3]; for one landscape user A is enough. Verify what the system does when A is set and the user picks a half-screen tile [M].
- **R12. Launch screen.** Replace the logo on `Splash` with a flat `#090b17` fill, matching the first screen (HIG [14]). Keep the icon; it already follows the "simple shapes, no text" rule [18].
- **R13. Home indicator auto-hide** via `prefersHomeIndicatorAutoHidden` in `PianoViewController`: cosmetic, three lines of Swift, add only if the lit bar distracts [M].

**Free-provisioning facts that matter (Apple Account Help, via search snippet [38][S]):** profiles expire after 7 days and need a rebuild and reinstall; 3 apps per device; 10 App IDs per rolling week; Apple's DTS advises reusing one bundle ID. `io.mattkelly.piano` is already reused. The README's rule "never delete the app" stands (wipes IndexedDB).

---

## 5. Practice-at-the-instrument UX

What the sources support, and what is inference.

- **Viewing distance.** Apple's iPadOS page: decide size and density from viewing distance, typically within about three feet, and from the input mode [6][V]. A music stand is 60-90 cm, so 2-3 ft: at the edge of that rule.
- **Seated reach is the open question.** Hands are on the keys; a touch means lifting one hand and reaching forward. No source in this round measured that for an iPad on a music stand [M]. Design consequence that does not depend on a number: everything touched during play should be a single tap in the lower half or at the far-right and left edges, and nothing during play should require precision.
- **Focus.** HIG: use the large display to elevate content and minimise modal interfaces [6][V]. The app's hush/zen modes and the "reclaim the screen" list in `ui-critique.md` already agree. Keep the staff, highway and a big Play as the only things that stay.
- **Transport.** Dock Play is the one amber fill and is 52px tall; keep every transport control at or above the 44 default.
- **Pedals and external keys.** A Bluetooth page-turn pedal appears to the iPad as a keyboard in the reviews found [S: AirTurn reviews]; no source confirms arrow-key mapping for that brand. Current Space/V/M/H shortcuts work with any keyboard; map left/right arrows to "previous / next bar" only if the owner buys a pedal.
- **Competitors.** Falling notes and notation as alternatives (Synthesia) [37]; notation-first with video (flowkey, [S]); other combinations not verified. The piano `Both` view with a player-controlled split has no checked precedent in this set.

---

## 6. Decided against

| Idea | Why not |
|---|---|
| Capacitor Haptics on snap, hit or miss | iPad Air has no Taptic Engine; the plugin no-ops [26][28]. Revisit only for an iPhone build. |
| Unlocking 120 Hz in the web view | The Air is 60 Hz [29]; the only known routes are private API [30]. Not App Store-safe, and unneeded here. |
| Liquid Glass chrome | Apple limits it to the functional layer and says use it sparingly [5]; the app has no system bars and a neon-arcade look the owner pinned. Native sheets are not used. |
| Light mode or an auto appearance | HIG allows dark-only for immersive media apps [11]; the stage and staff are designed for dark; the owner's room is dim. |
| Dynamic Type via `font: -apple-system-body` | Works in WKWebView [39][S] but ties every size in a tuned condensed/grotesque system to a system scale and breaks the fixed layout grid. HIG allows another way to adjust text size [10]; if ever needed, add a single "UI size" scale on `:root`. |
| Velocity-projected snap and rubber-banding on the divider | Correct for a free-floating sheet [20]; here the control has two ends and one default, and a clamp reads fine. Adds an animation loop to a canvas app that already animates. |
| Animating the pane change | The staff is an SVG rebuilt per size; animating grid rows would rebuild it every frame. |
| A menu bar and Cmd shortcuts | iPadOS 26 gives every app a menu bar [19], but the play surface is plain keys and one player. Add a View menu entry for the three views only if a hardware keyboard becomes a real input. |
| Pointer hover effects beyond the CSS | iPadOS 26's pointer tracks 1:1 and no longer magnetises [19]; nothing to adapt. |
| Service worker and manifest for the web build | iPad Safari has no Web MIDI [PRODUCT.md]; offline matters only in the shell, which is already offline. |
| Alternate app icon, Icon Composer layers | One person installs it; the flat icon passes the HIG rules [18]. |
| `UIRequiresFullScreen` | Would block Stage Manager and Slide Over; HIG says every app should support multitasking [7]. Keep multitasking on, handle small windows by R11. |
| Core Haptics, Pencil support, widgets | No cause-and-effect fit; the instrument provides the touch. |

---

## 7. Confidence

| Claim | Confidence | Basis |
|---|---|---|
| HIG numbers (44/28pt, 17/11pt, 4.5:1 and 7:1, grabber, detents, 12/24pt padding) | High | Read on Apple's pages [V] |
| HIG split-view text | Medium-high | Mirror of Apple's page [2]; Apple's own render empty |
| iPad Air has no haptics | Medium-high | Vendor write-up and forum thread [28][S] plus Capacitor's own no-op note [26] |
| iPad Air is 60 Hz | Medium | Apple spec page silent on refresh rate [29]; this is from knowledge of the product line |
| `interrupted` needs `resume()` | High on the web side [31][V]; medium on whether the native `.playback` session already avoids it | WebKit bug threads [S] |
| `-webkit-` prefix needed for `user-select`, `-webkit-touch-callout`, tap highlight | Medium | Memory; caniuse table could not be read |
| `dblclick` from a double tap with `touch-action: none` | Unknown | Not found; test |
| Windowed iPadOS 26 adds a safe area for window controls in a WKWebView app | Unknown | Applies to UIKit apps per [19]; effect on `env()` not found |
| Distance legibility numbers | Low-medium | Secondary sources for ISO 9241 / Bond rule [41]; my arithmetic from 264 ppi |
| Logic Pro tap-to-toggle handle | Medium | Search snippet of Apple's guide [35] |
| Competitor piano apps' combined views | Low | Not found beyond Synthesia [37] |

---

## 8. Sources

Apple HIG (all `https://developer.apple.com/design/human-interface-guidelines/<page>`; read via the same path under `/tutorials/data/design/human-interface-guidelines/<page>.json`):

1. `sheets`
2. `split-views` (text from the mirror `github.com/tmaasen/apple-dev-mcp`, `content/universal/split-views.md`)
3. `layout`
4. `accessibility`
5. `materials`
6. `designing-for-ipados`
7. `multitasking`
8. `playing-haptics`
9. `motion`
10. `typography`
11. `dark-mode`
12. `color`
13. `playing-audio`
14. `launching`
15. `pointing-devices`
16. `gestures`
17. `keyboards`
18. `app-icons`

Apple sessions and docs:

19. WWDC25 208, Elevate the design of your iPad app: https://developer.apple.com/videos/play/wwdc2025/208/
20. WWDC18 803, Designing Fluid Interfaces: https://developer.apple.com/videos/play/wwdc2018/803/
21. UISceneSizeRestrictions: https://developer.apple.com/documentation/uikit/uiscenesizerestrictions
22. largestUndimmedDetentIdentifier: https://developer.apple.com/documentation/uikit/uisheetpresentationcontroller/largestundimmeddetentidentifier

Standards and platform references:

23. ARIA APG window splitter: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
24. WCAG 2.5.7 Dragging Movements: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
25. WCAG 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
26. Capacitor Haptics: https://capacitorjs.com/docs/apis/haptics
27. Capacitor config (iOS): https://capacitorjs.com/docs/config
28. Haptics on iPad vs iPhone (vendor write-up, secondary): https://nutrient.io/blog/haptic-feedback-across-ipad-and-iphone
29. iPad Air tech specs: https://www.apple.com/ipad-air/specs/
30. WebKit bug 294338 and forum: https://www2.webkit.org/show_bug.cgi?id=294338 ; https://developer.apple.com/forums/thread/773222
31. MDN BaseAudioContext.state: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state ; MDN Navigator.audioSession (experimental): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/audioSession
32. MDN touch-action: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
33. MDN overscroll-behavior: https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior ; WebKit bug 275947: https://bugs.webkit.org/show_bug.cgi?id=275947
34. caniuse getCoalescedEvents: https://caniuse.com/mdn-api_pointerevent_getcoalescedevents
35. Logic Pro for iPad guide (snippet): https://support.apple.com/guide/logicpro-ipad/lpip878dfe7e/ipados
36. Newzik half-page turn: https://support.newzik.com/en/support/solutions/articles/77000152013 ; forScore (snippet): https://forscore.co/?p=377
37. Synthesia about: https://synthesiagame.com/about
38. Apple membership comparison (free account limits, snippet): https://developer.apple.com/support/compare-memberships/
39. Dynamic Type in web views: https://useyourloaf.com/blog/using-dynamic-type-with-web-views/ ; https://webkit.org/?p=3709
40. WWDC25 323, SwiftUI sheets (snippet): https://developer.apple.com/videos/play/wwdc2025/323/
41. Legibility angle figures (secondary): https://lists.w3.org/Archives/Public/public-low-vision-a11y-tf/2019Sep/0041.html
42. Flutter BottomSheet drag handle default 32x4 (secondary): https://api.flutter.dev/flutter/material/BottomSheet/dragHandleSize.html
44. WebKit bug 159668 on `user-scalable`: https://bugs.webkit.org/show_bug.cgi?id=159668

Internal: `PRODUCT.md`, `DESIGN.md`, `docs/research/ui-critique.md`, `docs/research/products-and-ux.md`.
