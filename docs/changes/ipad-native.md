# iPad native polish (31 Oct 2026)

What makes the web view feel like an iPad app, item by item: what Apple and the best apps do, what Piano Forte did, and the decision. Builds on `docs/research/ios-ux.md` (19 Oct) and `ios-native.md` (30 Oct); items those settled are listed only when this pass changed them. Nothing here has been seen on the iPad: the Swift compiles for the simulator, the web side passes `tsc`, `vitest` and the e2e. The checks owed are in `docs/device-checks.md`, "iPad shell".

## Done

| Item | What the best do | Before | Now |
|---|---|---|---|
| Screen sleep | Apple: disable the idle timer only when "the app needs to continue displaying content when user interaction is minimal", and reset it when the need ends [1]. The idle timer counts touches; a piano is played without one. | Auto-lock off only while a run counts in, plays or waits. Theory, the ear and pulse trainers, the Scales quiz and the start card dimmed after the system's Auto-Lock (2 min by default) while the keys were being played. | Off while a run plays **and for two minutes after the last MIDI message**, then the system's own Auto-Lock counts from there (`stayAwake` in `PianoNative.swift`, a 15 s check). "Whenever a keyboard is connected" was rejected: an FP-10 left on keeps a stand-mounted iPad lit all night. Two minutes is a guess, marked `ponytail:`. |
| Screen edges | Immersive apps (games, video) return the edges from `preferredScreenEdgesDeferringSystemGestures`, so the first swipe shows the indicator and only a second one acts [2]. Apple: allow the system gestures "whenever possible". | System gestures everywhere. | All edges deferred **while a run plays** only; menus keep the system's single swipe. |
| Home indicator | `prefersHomeIndicatorAutoHidden` during immersive playback; it fades after a few seconds without a touch [3]. | Always lit. | Faded while a run plays, through Capacitor 8's own `SystemBars.hide({ bar: NavigationBar })` (`src/native-app.ts`). Capacitor overrides the property as `public`, not `open`, so the app's view controller cannot (the Swift build said so). |
| Audio interruptions | HIG: a game resumes on its own after an interruption; media playback pauses. When headphones come out, "playback [should] pause immediately" [4]. Reactivate the session when an interruption ends [5]. | A call, Siri or an alarm silenced Web Audio while the run's clock kept going; nothing paused. | The plugin watches `AVAudioSession` interruptions and route changes and sends `interrupt`; the page pauses a run (as on leaving the app) and stops Listen back. Interruptions iOS reports for a suspended app are skipped (the run paused on leaving). On the end, the session is made active again; `src/audio.ts` already resumes a context that reports `interrupted`. |
| Listen back in the background | | rAF stops while hidden; on return every note it missed was scheduled at once. | Stops on `visibilitychange` hidden and on `interrupt` (`src/app/take-ui.ts`). |
| Link previews | `allowsLinkPreview = false` in wrappers that want no web tells (Tauri, Flutter webview) [6]. | Default true: a long press on Credits or Report a problem could open a web page preview. | `ios.allowsLinkPreview: false` in `capacitor.config.ts` (Capacitor's own key). |
| Drag out of links and images | iPad WebKit lifts links and images for drag and drop on a long press. | Draggable. | `a, img { -webkit-user-drag: none }` in `style.css`. |
| Launch screen | HIG: not a splash, no text or logo, match the first screen [7]. | Already a flat Ground image, as three 2732 px PNGs in an image view whose fallback was white. | A plain view in Ground (#090b17) in `LaunchScreen.storyboard`; the image set is deleted. |

## Already right (checked in the code)

- Audio session: `.playback` with `.mixWithOthers` (`AppDelegate.swift`). Playback ignores silent mode, right for a piano you play; it mixes, so a backing track from Music plays on. Ambient would mute the piano in silent mode. Mode `.default`: WebKit picks its own buffer.
- Tap highlight, callout, text selection on chrome, double-tap zoom, rubber-band overscroll: `body` rules in `style.css` and Capacitor's `scrollEnabled: false` (zoom is off by default). Text fields keep selection.
- Status bar hidden (`UIStatusBarHidden`); safe areas through `env(safe-area-inset-*)` with `viewport-fit=cover`; all four orientations; one scene; no width refused.
- ⌘ shortcuts: `buildMenu` in `AppDelegate.swift`; on iPadOS 26 and later a held ⌘ or a swipe down shows the menu bar, which is the discoverability.
- Backgrounding: a run pauses on `visibilitychange` (`src/app/play.ts`) and its scheduled sound is hushed; iOS suspends the web view's process without a background audio mode, which the app does not declare.
- App-switcher snapshot: shows the last frame; nothing private on screen, so no blur.
- Pointer: hover rules are plain `:hover` (one row rule waits for `hover: hover`), so a trackpad gets them; iPadOS 26's pointer tracks 1:1 and no longer morphs.

## Decided against, for now

| Item | Why |
|---|---|
| Input accessory bar on text fields | Only the song search and the delay field take text, and the iPad's shortcut bar is what Safari and native apps show too. A hardware keyboard hides it. |
| Long press on a song row opening its ⋯ menu | Right per HIG (a context menu repeats actions reachable elsewhere), but the Songs page belongs to the content-pages work this round. In ROADMAP. |
| Window-control inset in windowed mode | Whether `env(safe-area-inset-top)` includes iPadOS 26's window controls in a web view is unknown, and Obsidian and PWA users report the overlap [8]. UIKit's answer is `directionalEdgeInsets(for: .margins(cornerAdaptation: .horizontal))` pushed into a CSS variable; built blind it risks a double inset. Device check first; in ROADMAP. |
| Low Power Mode | WebKit caps `requestAnimationFrame` at 30 fps in Low Power Mode by design [9]; there is no public switch. The highway will look half as smooth; nothing to build. Noted on the device sheet. |
| `UIApplicationSupportsIndirectInputEvents` | Changes how a trackpad click reaches the web view; untestable without a trackpad on the iPad. |
| Dynamic Type, VoiceOver pass | Settled in `ios-ux.md` (one `:root` scale if ever needed) and `ios-native.md` N6 (a VoiceOver pass with a live region needs the device). |
| Staff rebuilt only on release during a Stage Manager resize (`isInteractivelyResizing`) | Already ROADMAP (ios-ux R2e): measure first. |

## Sources

1. `UIApplication.isIdleTimerDisabled`: https://developer.apple.com/documentation/uikit/uiapplication/isidletimerdisabled
2. `preferredScreenEdgesDeferringSystemGestures`: https://developer.apple.com/documentation/uikit/uiviewcontroller/preferredscreenedgesdeferringsystemgestures
3. `prefersHomeIndicatorAutoHidden`: https://developer.apple.com/documentation/uikit/uiviewcontroller/prefershomeindicatorautohidden
4. HIG, Playing audio: https://developer.apple.com/design/human-interface-guidelines/playing-audio
5. Handling audio interruptions: https://developer.apple.com/documentation/avfaudio/handling-audio-interruptions
6. `WKWebView.allowsLinkPreview`: https://developer.apple.com/documentation/webkit/wkwebview/allowslinkpreview ; Tauri's option: https://github.com/tauri-apps/tauri/commit/c1cd0a2ddb5bc3e99451cbe399b5fc9f0035f571
7. HIG, Launching: https://developer.apple.com/design/human-interface-guidelines/launching
8. Window controls and web content: https://developer.apple.com/forums/thread/790994 ; https://dev.to/reinhart1010/pwa-in-ipados-26-is-a-joke-38g1 ; https://forum.obsidian.md/t/ui-overlap-issue-in-stage-manager-window-mode/108361
9. WebKit bug 215745 (30 fps in Low Power Mode is by design): https://bugs.webkit.org/show_bug.cgi?id=215745
