# iOS / iPadOS native: architecture, audio, MIDI, platform integration, App Store

Research date: 2026-10-30. Builds on `docs/research/ios-ux.md` (19 Oct: HIG numbers, touch polish, divider, Liquid Glass "does not apply", haptics, 60 Hz, free-provisioning limits). This note does not repeat those. It asks a different question: how native should Piano Forte become, and how. Code read on 30 Oct: `ios/App/App/*.swift`, `Info.plist`, `Main.storyboard`, `capacitor.config.ts`, `src/native-midi.ts`, `src/audio.ts`, `src/app/take-ui.ts`, `package.json`.

Evidence tags, as in ios-ux.md: **[V]** read on the primary page this session; **[S]** secondary (forum, blog, vendor, search snippet, a subagent's reading of a page); **[M]** memory or inference, verify on the device; **[C]** read or computed from this repo.

**The calendar moved.** The brief says "iOS 26 era", but iPadOS 27 shipped in September 2026 [52][S]. The owner's iPad Air 4 (A14) runs it, and it is the oldest model iPadOS 27 supports: the floor rose to A14/M1 [52][S]. It has no Apple Intelligence [52][S], so Foundation Models and the AI parts of Siri are out. Expect iPadOS 28 to drop it. App Store uploads have had to use Xcode 26 and the iOS 26 SDK since 2026-04-28 [39][V].

---

## 0. Headline findings

1. **Keep the web core and make the edges native.** Stay on Capacitor and add a short list of native pieces where the platform has a contract a web view cannot meet: Bluetooth pairing, MIDI timing, file open-in, menu bar, backup, and later the audio engine. A full SwiftUI rewrite or React Native would fork a product whose web build is a promise ("open, free, in-browser", PRODUCT.md), and no evidence says users would feel the difference on a 60 Hz Air. Confidence: high.
2. **Bluetooth MIDI pairing is fixable now.** The README's "BLE pairing crashes on iPadOS 27.0" is a known Apple bug: `CABTMIDICentralViewController` crashes in `loadView` with a NaN table height on iOS 27.0 and 27.0.1, whether presented from UIKit or SwiftUI. DTS gave a two-line workaround that a developer shipped on an iPad Pro, and one poster says 27.2 fixes it [7][S, Apple forum with DTS replies]. Every peer with an iPad keyboard flow has its own pairing screen (Simply, flowkey, Yousician, Skoove, forScore) [P][S]. The app has none.
3. **The MIDI timestamps have three faults.** [C] (a) `PianoNative.swift` stamps a whole `MIDIEventList` with its first packet's time, the same flaw people have reported in JUCE [9][S]. (b) The "age" is measured on the main thread before `notifyListeners`, so bridge transit and a busy JS thread are not counted: every event arrives stamped late by that much. (c) It calls `mach_absolute_time()`, which Apple lists as a required-reason "system boot time" API [43][V], so App Store uploads need a privacy-manifest reason unless it moves to `clock_gettime_nsec_np(CLOCK_UPTIME_RAW)`. Fix all three with absolute host times plus a min-RTT clock sync (section 3).
4. **Web Audio in WKWebView is better than its reputation.** It is also unmeasured on this iPad. While a Web Audio context is live, WebKit asks for a 128-frame hardware buffer (about 2.7 ms at 48 kHz) [12][V, WebKit source]. The risks are the extra cross-process hop to the GPU process [13][S], the main-thread hop for every MIDI note, and timers on the JS thread. Measure before building a native engine. Listen back still schedules notes with `setTimeout` [C], which can be fixed on the web side today.
5. **Native audio is the second step.** AVAudioEngine plus AVAudioUnitSampler can play straight from the CoreMIDI thread, skipping the bridge and the JS thread, and can schedule app notes sample-accurately [18][V]. This matters for monitoring with "browser piano" on, and for the metronome under load. It matters little in the owner's default setup (FP-10 speakers). Effort: about 4-6 days.
6. **The 7-day profile is the costliest constraint, and $99 a year removes it.** A paid membership gives 1-year development profiles [36][V][S], TestFlight builds that last 90 days [38][V], iCloud and CloudKit [37][V], and App Store distribution. Free teams *do* get App Groups and Background modes [37][V], so widgets are possible without paying. iCloud and push are not.
7. **iPadOS 26/27 windowing is now required.** `UIRequiresFullScreen` is deprecated. From the iOS 27 SDK it no longer opts out of resizing; a launch screen and all orientations are required for submission [1][V]. The UIScene life cycle is mandatory when building with the iOS 27 SDK [3][V]. The app already meets all three [C]. Two small shell faults remain: a leftover `Main.storyboard` that names a second `CAPBridgeViewController` [C], and window controls that may overlap web content in windowed mode, because web content does not get the window-control inset [6][S].
8. **The menu bar is a free win.** iPadOS 26 shows a menu bar on a swipe down, with or without a keyboard [2][V]. A dozen `UIKeyCommand`s forwarded to JS (Play, Loop, Tempo, Wait, the seven tabs) make the app discoverable the way Apple now expects. Apple: "keep functionality accessible without the menu bar" [2][V], which the app already does.
9. **Data safety beats sync.** IndexedDB in a WKWebView has no 7-day cap [32][S], but one delete wipes it and iOS 17.4 had an IndexedDB data-loss bug [32][S]. A native auto-backup of the existing JSON export, to a Files-visible folder now and to iCloud Drive once paid, protects more than CloudKit sync would, at a tenth of the cost.
10. **A free web-wrapped app can pass review, but expect a 4.2 fight.** 4.2 rejections of Capacitor apps with "a few plugins" are on record [41][S]. CoreMIDI hardware input, offline use, BLE pairing, Files open-in, the menu bar and App Intents are the native case. Public-domain content needs documentation ready for 5.2 [42][S].

---

## 1. Architecture

Scale [C]: about 16.2k lines of non-test TypeScript (23k with tests), 171 lines of Swift, no framework (DOM plus PixiJS WebGL plus SVG). Velocity [C]: 359 commits from 18 to 30 Oct, the whole app in 12 days with agents. Native work is slower, because each round trip needs the iPad, and every free-team build needs a re-sign within 7 days.

| Option | What it is | Gains | Costs, for one developer plus an agent | Verdict |
|---|---|---|---|---|
| **A. Capacitor plus targeted native plugins** (today, extended) | One WKWebView; native plugins for MIDI, pairing, audio, files, menu, backup | One codebase for web and iPad; the web build stays the product; each native piece is about a day; Capacitor and Ionic Framework "remain free and open source" after Ionic wound down its commercial products in Feb 2025 [21][S] | Bridge hop on the main thread; no Liquid Glass chrome; WKWebView 60 Hz cap (moot on the Air, ios-ux.md); Capacitor 8 not yet on Swift 6 [21][S]; storage tied to the `capacitor://localhost` origin | **Do this.** High confidence |
| A'. Plain WKWebView or SwiftUI `WebView` without Capacitor | iOS 26 has `WebView`/`WebPage` and a `URLSchemeHandler` [24][S] | Drops a dependency and the Cordova shim (`Package.swift` pulls `Cordova`) [C]; full control of the WKWebView setup | About 2-3 days to rebuild the bridge, scheme handler and plugin plumbing. **Changing the scheme or host changes the origin and orphans IndexedDB** [M], so the origin would have to stay `capacitor://localhost` | Not now. Revisit if Capacitor 9 gets in the way. Medium confidence |
| B. Native SwiftUI chrome around a web play surface | Tabs, sheets and settings in SwiftUI; the play screen and staff stay web | Liquid Glass tab bar and sidebar, native sheets | State split across the bridge; two UIs to design; the web build still needs its own navigation. HIG keeps glass off the content layer (ios-ux.md [5]), and this app is mostly content. 1-2 weeks, then a tax on every feature | No. Medium-high confidence |
| C. Full native rewrite (SwiftUI plus Metal or Canvas) | Port `layout.ts` (1.5k lines of engraving), the importers, the judge and the drills | Best audio and MIDI path, 120 Hz on a Pro, the full Apple stack (SwiftData, App Intents, widgets) | 4-8 weeks to parity at this velocity [M], then **every feature twice**, or the public web app dies. Peers that went native also had native teams (Skoove: SwiftUI plus KMP plus a C++ audio engine [P]) | No, unless the web product is dropped. High confidence |
| D. React Native or Expo | Reuse the TS logic; redraw UI in RN; audio via `react-native-audio-api` (C++ on CoreAudio, "sample-accurate scheduling") [26][S] | Native audio with a Web Audio-shaped API | The app is not React. The SVG staff, the Pixi highway and every page get redrawn (Skia or similar). A third runtime. flowkey and Musora (Pianote) use RN [P], but with teams | No. High confidence |
| E. Unity, Flutter, Tauri 2 | Yousician and Tomplay use Unity with C++ audio [P]; Tauri 2 on iOS is also a WKWebView [M] | None that A lacks | Rewrite (Unity, Flutter) or a sideways move (Tauri) | No |

**Why A holds up against the peers.** No peer is a plain web wrapper. The only peers with web versions that use Web MIDI (flowkey, Piano Marvel, Pianu) ship separate native iPad apps, because Safari has no Web MIDI [P][11]. Piano Forte already has that split, but with one codebase. The parts the peers built natively (pairing UI, audio engine, recognition) are exactly the edges A makes native. Mic recognition is not in scope.

**How to keep A tidy (ponytail).** One plugin class, `CoreMidiPlugin`, already exists. Add methods to it (`pair`, `now`, `backup`) rather than new plugins, until `PianoNative.swift` passes about 300 lines; then split it by concern (MIDI, audio, files). No `@capacitor/*` plugins are needed for any of this. `navigator.share` already works in the web view [C].

---

## 2. Audio

### What the web path does today
- `new AudioContext({ latencyHint: 'interactive' })`; resumes on any state other than `running`; sets `navigator.audioSession.type = 'playback'`; the native side sets `.playback` with `.mixWithOthers` and keeps the screen awake [C].
- **Buffer.** WebKit's `MediaSessionManagerCocoa::updateSessionState` sets `bufferSize = AudioUtilities::renderQuantumSize` (128 frames) whenever `webAudioCount` is nonzero [12][V]. On its own, Web Audio gets the `AmbientSound` category, which the silent switch mutes [12][V][14][S]. The JS `audioSession.type = 'playback'` is the WebKit-endorsed override [14][S]. The iPad Air 4 has no side switch; silencing is in Control Center [M].
- **Process hop.** Web Audio renders in the web process into shared memory that the GPU process reads (an old source shows a 2 s ring buffer) [13][S]. WebKit bugs report latency in multiples of the preferred buffer [13][S]. No published key-to-sound figure exists for Web Audio in WKWebView on any iPad. **Not found; must be measured.**
- **Clocks.** `audioTime()` uses `getOutputTimestamp()` [C]. `outputLatency` has been supported in Safari and WKWebView since 18.4 [15][S] but is never read [C]. It is the cheap way to shift the click and visuals when the output is Bluetooth.
- **Listen back.** It plays through `setTimeout` per note [C], so jitter is a JS-timer tick plus any main-thread stall. Scheduling with `start(when)` on the audio clock fixes it in the web build, with no native work.

### Native alternative: AVAudioEngine plus AVAudioUnitSampler
- **Sampler.** One stereo bus. It loads an instrument file (.aupreset, .exs), SF2 or DLS soundbanks, or audio files [18][V]. There is no SFZ: use an SF2 of Salamander (CC BY 3.0, as now) or `loadAudioFiles` with the existing samples [M]. AudioKit's DunneAudioKit sampler reads SFZ [19][S]; licence not confirmed.
- **Scheduling.** `scheduleMIDIEventBlock` takes a sample time, or immediate plus an offset under 4096 frames, inside the next render cycle [18][V]. iOS 27 adds `AVMIDIEventListBlock` for UMP [18][S]. Live notes can be played from the CoreMIDI receive block without touching the main thread or JS [M: thread safety of calling the schedule block from the MIDI thread is the documented real-time pattern for AUs; verify with Thread Sanitizer]. App notes (accompaniment, Listen back, chord play-along) are sent as a batch with times and scheduled ahead.
- **Buffer.** `preferredIOBufferDuration` is a request; read `ioBufferDuration` back [16][V]. Forum reports: output-only sessions stuck at 1024 or 4096 frames, and buffers that grow with the screen off [16][S]. The latency properties have been called "inaccurate" [16][S]. Superpowered: the default session mode adds about 30 ms on mic round trips; use the `measurement` mode for minimum round trip [20][S]. Old native figures: iPad Air 10 ms, Air 2 13 ms round trip (2015) [20][S]. No current Air 4 figure was found.
- **Bluetooth output.** AirPods report about 160 ms `outputLatency` but measure 180-220 ms, and the value drifts (193 to 260 ms within a minute) [17][S]. Live play through a Bluetooth speaker is not workable on any stack. The app should detect `AVAudioSession.currentRoute` port type `.bluetoothA2DP` (or a jump in `outputLatency`) and say "Bluetooth speakers add about 0.2 s; use the keyboard's own speakers" [M].
- **Interruptions.** Observe `AVAudioSession.interruptionNotification` and `routeChangeNotification`; on `.ended`, reactivate and restart the engine. Nothing native does this today [C]. The JS resume covers Web Audio only (ios-ux.md R1).
- **Metronome.** An `AVAudioPlayerNode` scheduling click buffers at `AVAudioTime(hostTime:)` keeps time through JS jank and layout rebuilds. Today's click is already on the audio clock (`audioTime`) [C], so a native metronome earns its keep only together with the native engine.

### Recommendation
1. **Measure first (half a day).** On the iPad, with browser piano on: record the FP-10's key thump and the iPad speaker on the Mac mic at 48 kHz, 20 notes over USB and 20 over BLE, and read the onset gaps in Audacity. Log `ctx.baseLatency`, `ctx.outputLatency`, and Instruments' Audio System Trace (section 9). Below about 20 ms key-to-sound with no audible jitter, stay on Web Audio [M: 10-20 ms is the commonly cited range where pianists start to notice; not researched here]. Confidence that the measurement decides the question: high.
2. **Web-side fixes regardless (half a day).** Schedule Listen back on the audio clock. Read `outputLatency` into the timing offset when it jumps (a Bluetooth route). Show the Bluetooth-speaker warning.
3. **Native engine if the measurement says so, or when accompaniment becomes central (4-6 days).** Plugin methods `noteOn`/`noteOff` (live, called natively from MIDI too), `schedule(events, atHostTime)`, `click`, `setInstrument`, `latency()`. Keep Web Audio for the website and as the fallback. Confidence that it would improve key-to-sound: medium-high; by how much: unknown until measured.

---

## 3. MIDI

### State
- CoreMIDI client, port on `._1_0` UMP, connects every source, skips "Network Session", re-lists on any setup change [C]. Correct and current; `MIDIInputPortCreateWithProtocol` is the modern API.
- **Web MIDI in WebKit:** bug 107250 is still NEW and unassigned; no 2026 commitment [11][S]. The shim stays.
- **MIDI 2.0/UMP:** nothing to gain. The FP-10 is MIDI 1.0 [M], and the port already receives MIDI 1.0 inside UMP. Keep the `._1_0` protocol.

### Pairing (do first)
- `CABTMIDICentralViewController` (CoreAudioKit) lists BLE MIDI peripherals, pairs on tap, and dismisses itself. Present it modally; on iPad it shows as a popover [8][V]. On iOS 27.0 and 27.0.1 it crashes (`CALayerInvalidGeometry ... [0 0; 1032 nan]`). The working DTS workaround [7][S]:
  ```swift
  let c = CABTMIDICentralViewController()
  if #available(iOS 27, *) { c.tableView = UITableView(frame: .zero, style: .grouped); c.viewDidLoad() }
  ```
  The first DTS version, without `viewDidLoad()`, stops the crash but never scans [7][S]. Add `NSBluetoothAlwaysUsageDescription` to Info.plist [M: CoreBluetooth requires it; confirm the controller needs it]. Since iOS 16, paired BLE MIDI peripherals reconnect on their own [7][S, quoting Apple's MIDI Bluetooth page, which rendered empty here].
- **Where.** A "Pair Bluetooth keyboard" button in Set up and on the MIDI chip, iPad app only. Simply Piano no longer supports connections made through other apps [P][S], a hint that pairing done outside the app is fragile.
- **Latency.** BLE-MIDI requires a connection interval of 15 ms or less [10][S]. iOS floors are cited as 11.25 ms generally and 7.5 ms for the MIDI service [10][S]. The FP-10 manual's BLE latency is not published. Keep USB as the recommendation (PRODUCT.md already does).

### Timestamps: best practice and the fix
`MIDITimeStamp` is host time (mach absolute time) at the moment the event occurred; 0 means now [9][V]. Best practice: carry each event's own host time across the bridge and map it into `performance.now()` with an offset, rather than an age measured before an asynchronous hop.

1. Native: per packet, `t = ns(packet.timeStamp)` (with 0 meaning `clock_gettime_nsec_np(CLOCK_UPTIME_RAW)`), sent in ms. Same clock as mach time, not on Apple's required-reason list [43][V][S]. (Correction, 30 Oct: the packet's own stamp is in mach ticks, so `mach_timebase_info` still converts it; only reading the time moved off `mach_absolute_time()`.)
2. Native method `now()` returns the same clock in ms.
3. JS: on start, and every 30 s while playing, call `now()` five times; for each, `offset = (t0 + t1)/2 - native`; keep the offset from the call with the smallest `t1 - t0`. Then `timeStamp = t + offset`. Error is at most RTT/2 of the best sample.
4. Assumption [M]: WebKit's `performance.now()` runs on the same monotonic uptime clock, so the offset does not drift. Re-syncing every 30 s covers any drift. Safari coarsens `performance.now()` to about 1 ms [S, Chrome blog's survey of other browsers], far below the 45 ms judging window.

Cost: about 30 lines of Swift and TS. Gain: judged timing stops including main-thread stalls, which is what the delay calibration cannot remove. Whether CoreMIDI's BLE driver rebuilds sender-side timestamps from the BLE-MIDI header is not known [M]. Measure the spread of judged timing over USB against BLE after the fix.

---

## 4. iPadOS platform integration

| Feature | What Apple says now | Fit for Piano Forte | Rec. and confidence |
|---|---|---|---|
| **Resizable windows, Stage Manager** | Every iPad on iPadOS 26+ gets windowing and Stage Manager (the Air 4 included; external display needs M1) [53][S]. `UIRequiresFullScreen` deprecated, ignored from the 27 SDK; all orientations and a launch screen required [1][V]. `sizeRestrictions.minimumSize` is a preference, not a guarantee [1][V]. Use `windowScene(_:didUpdateEffectiveGeometry:)` and `isInteractivelyResizing` to defer costly redraws [1][V] | Info.plist lists all four orientations, there is a LaunchScreen, scenes are adopted, the web layout reflows at any width [C]. Window controls (top left) "contribute to the top safe area" in UIKit [6][S], but one report says web content in windowed iPadOS 26 is covered by them [6][S]. The app's top bar starts at the top left | Device check in windowed mode. If covered: read the corner-adapted layout margins natively and push a `--win-top` CSS variable (half a day). Optional: pass `isInteractivelyResizing` to JS so the staff rebuilds on release only (ios-ux.md R2e). High confidence on the requirements; the overlap is unknown |
| **Menu bar** | iPadOS 26 menu bar via `UIMainMenuSystem.shared.setBuildConfiguration`, set once at launch; show every command, disabled ones included; storyboard menus no longer supported; not always present [2][5][V]. Beta reports of the View menu refusing changes [5][S]. iOS 27 hides menu images by default (`preferredImageVisibility`) [3][V] | Commands: Play/Pause, Restart, Loop A-B, Wait, Tempo up and down, Hands, Hide extras (M), Calibrate, the seven tabs, Settings, Help. Each is a `UIKeyCommand` with a `discoverabilityTitle` whose action sends `notifyListeners('cmd', {id})` to the same handler as the keyboard shortcut. Set non-repeating on Play [2][V] | Do it (1 day). Use Cmd-modified keys in the menu; plain keys (Space, V, M) stay in JS so text inputs keep them [M]. Medium-high |
| **Keyboard shortcuts** | Holding Cmd now shows the menu bar instead of the old HUD [M; one beta-era report says the HUD no longer appears [S]] | The menu bar is the discoverability | Covered by the menu bar |
| **Pointer** | 1:1 pointer in 26 (ios-ux.md) | CSS hover already | Nothing |
| **Apple Pencil, Scribble** | WebKit reports pen input as Pointer Events with `pointerType: 'pen'` [M]; Scribble works in web text fields [M] | forScore and Newzik make annotation central [P], but on PDFs. Here the score is re-engraved SVG and bars shift with zoom, so ink would need anchoring to bars and notes | Not now. If a teacher-marking need appears: per-bar pen marks stored by bar index (2-3 days, web only). Medium |
| **Files, open-in, drag and drop, Share** | Declare `CFBundleDocumentTypes` with `LSItemContentTypes`, and export UTIs for types the system lacks [33][V archive]. MusicXML's spec gives `com.recordare.musicxml.uncompressed` (the compressed `.mxl` UTI was not confirmed) [33][S]. MIDI is `public.midi-audio` [M] | `<input type=file>` and a drop handler exist [C]; `navigator.share` exports [C]. Missing: "Open in Piano Forte" from Files, Mail or Safari. The SceneDelegate already forwards `openURLContexts` [C] | Do it (1 day): document types plus `UTImportedTypeDeclarations`; in `openURLContexts`, read the file (security-scoped) and send bytes to the existing import path. Medium-high |
| **App Intents, Shortcuts, Spotlight** | `openAppWhenRun` deprecated; use `supportedModes` (iOS 26) with `.foreground` [28][V/S] | "Start today's practice (10 min)", "Open piece …" (an AppEntity over the catalogue later), "Start Sight Run" | Next (1 day for 2-3 intents that open the app and route a URL into JS). App Shortcuts need no Siri entitlement [M]; Siri the capability is not available to free teams [37][V]. Medium |
| **Widgets, Live Activities** | Live Activities on iPad since the iOS 17 cycle [29][S]. Widgets need an extension plus an App Group to share data, which free teams can use [37][V] | A Home Screen streak or "today's plan" widget is a daily cue, which fits the habit research (streak with freeze); a Live Activity for a 20-minute session is noise for someone at the keys | Widget: later bet (1-2 days; another App ID against the free 10-a-week limit [36][V]). Live Activity: no. Medium |
| **Focus filters** | — | No content to filter | No. High |
| **Multiple windows** | `UIApplicationSupportsMultipleScenes` false [C] | One player, one keyboard | Keep false |

**Shell cleanup found on the way [C].** `Info.plist` has both `UIMainStoryboardFile` and `UISceneStoryboardFile` = `Main`, and `Main.storyboard`'s initial controller is a `CAPBridgeViewController`. `SceneDelegate` then builds its own window with `PianoViewController`. UIKit may instantiate the storyboard controller before `willConnectTo` [M], which is wasted and confusing at best and a second bridge at worst. Delete both keys and the storyboard (Directive 7); check in Safari's Web Inspector that one web view remains. 15 minutes.

---

## 5. Liquid Glass and design language

What changed since ios-ux.md:
- Building with the iOS 27 SDK ignores `UIDesignRequiresCompatibility`: everything native becomes Liquid Glass [27][S]. For this app that means only system UI it presents: the document picker, the share sheet, alerts, the menu bar, the pairing popover. Nothing to do; they are correct by default.
- iOS 27 scroll-edge and bar-minimisation changes apply to native bars only [3][V]; the app has none.
- **Web dialogs versus native sheets.** Keep web dialogs for content (start card, results, Credits); they carry the app's own neon voice and work on the website. Use native only for platform contracts: pairing, the document picker, share, and later the iCloud account prompts. Do not fake glass with `backdrop-filter` over the WebGL highway: it costs GPU on an A14, and HIG keeps glass off content (ios-ux.md [5]). High confidence.
- **SF Symbols.** Licensed for apps on Apple platforms. The same web assets serve the public site, so do not embed SF Symbols in web code [54][S]. Native menu items can use them; iOS 27 hides menu images by default anyway [3][V].
- **App icon.** Building with Xcode 26+ lets the system tint and darken; optional Icon Composer layers (ios-ux.md kept the flat icon). No change.

---

## 6. Accessibility

- **What Apple checks now:** Accessibility Nutrition Labels on the App Store. Claim a feature only if "every common task" can be done with it; App Review can ask for corrections [34][V/S]. Larger Text means 200% or more [34][S].
- **What the app could honestly claim [C]:** Dark Interface (dark-only), Reduced Motion (Effects Off or Calm, highway still under reduced motion), Differentiate Without Color (shape, word and hue), probably Sufficient Contrast after R5/R6. **Not** VoiceOver: the play surface is a canvas with no accessibility tree, and the on-screen keys are `aria-hidden` (ROADMAP Known gaps). **Not** Larger Text: fixed px. ios-ux.md decided against Dynamic Type; if the label matters at release, one `:root` scale driven by `font: -apple-system-body` in the app only would earn it [M; WebKit maps that font to Dynamic Type, per ios-ux.md [39]].
- **VoiceOver in music apps.** Users expect the play surface marked "allows direct interaction" so key touches sound at once; GarageBand and The Piano are the cited good examples [35][S]. A WKWebView cannot set that trait on a DOM region [M]. For this app the real VoiceOver path is MIDI: a blind player plays the FP-10 and hears results read out. Cheapest real gain: an `aria-live="polite"` region for the results summary and the coaching line, with menus labelled (axe already runs on every page [C]). 1 day with a VoiceOver pass on the device. Medium.

---

## 7. Data and iCloud

| Mechanism | Limits | Needs | Fit |
|---|---|---|---|
| IndexedDB in WKWebView (today) | No 7-day ITP cap in apps [32][S]; tied to the origin; lost on app delete; iOS 17.4 IndexedDB connection bug lost data in Capacitor apps [32][S] | — | Keep as the live store |
| JSON export to Files (local) | — | `UIFileSharingEnabled` plus `LSSupportsOpeningDocumentsInPlace` so the app's Documents folder shows in Files [M] | **Do first:** auto-write `PianoForte-backup.json` at session end via a plugin `backup(json)`; free team OK. Survives profile expiry, not app delete [M] |
| iCloud Drive document (ubiquity container) | Normal file; Apple-account sync; no server | iCloud capability = paid [37][V] | **Next once paid:** the same backup file in iCloud Drive; the web build imports the same JSON, so the Mac in Chrome can share progress by hand |
| `NSUbiquitousKeyValueStore` | 1 MB total, 1024 keys [30][V] | Paid | Settings plus streak only; the takes and imported songs will not fit |
| CloudKit private DB, or SwiftData with CloudKit | All properties optional, no unique constraints, remote-notification background mode [31][S] | Paid | **Bigger bet:** real merge across iPad, iPhone and Mac. The model merges well: days and minutes only rise (max-merge); mastery and boxes are per-card records (last writer wins by timestamp); takes are append-only. 4-6 days including conflict tests. The web build would not sync, unless CloudKit JS is added, which needs a web sign-in and goes against "no account" in spirit |

Bridge from IndexedDB: the export and import code already round-trips the whole profile (e2e covers it [C]). Every option above rides that JSON; no second schema. Confidence: high for backup-first; medium that sync is wanted at all for a one-iPad user.

---

## 8. App Store and distribution

- **Free versus paid [36][37][V].** Free: 7-day profiles, 3 devices, 3 apps per device, 10 App IDs a week; capabilities include App Groups and Background modes; no iCloud, push, Associated Domains, Siri, In-App Purchase or Game Center. Paid ($99 a year; individual fee waivers do not exist [S]): 1-year development and ad hoc profiles (100 devices per family), TestFlight (100 internal and 10,000 external testers, builds expire after 90 days, the first external build needs Beta App Review) [38][V], App Store. **Recommendation:** pay before any further native work; the 7-day re-sign is a recurring tax on every device check. High confidence.
- **Upload rules [39][V].** Xcode 26 and the iOS 26 SDK since 2026-04-28. With the iOS 27 SDK (no deadline published yet [39][V]): launch screen required [1][V], UIScene required [3][V], Liquid Glass forced [27][S].
- **Privacy manifest [43][22][V].** Required-reason APIs since May 2024. Capacitor core ships its own empty manifest [22][S]. The app needs `PrivacyInfo.xcprivacy` with `NSPrivacyTracking` false, no collected types, and a reason for any listed API it calls: `mach_absolute_time` → SystemBootTime 35F9.1, or switch the clock (section 3) and declare nothing. Add `ITSAppUsesNonExemptEncryption` = NO (HTTPS only) [45][V]. The nutrition label can be "Data Not Collected" if the corpus server keeps no request logs beyond serving [44][V; the server logs are an inference to check]. A privacy policy URL is required even then [44][V].
- **Guideline risks [40][V].**
  - **4.2.** Needs "app-like" features beyond a repackaged site. Rejections are on record for a Capacitor app with geolocation, share and maps plugins; Voyager got through by adding a native watch app [41][S]. The case for Piano Forte: CoreMIDI keyboard input (the website cannot do it on iPad), in-app BLE pairing, offline bundled library, Files open-in, menu bar, App Intents, and later native audio. Write these in the Review Notes. Medium confidence it passes first time.
  - **4.2.3(ii).** If the app needs a download before it can work, it must disclose the size and ask. The corpus is optional and the starters are bundled, so fine. Keep "Save level n for offline" showing a size [M].
  - **2.5.2.** No downloaded code. JS chunks are bundled in `public/` [C]; the corpus is MIDI and MusicXML data [M: data, not code, is the common reading]. Never load JS from pianoforte.mattkelly.io in the app.
  - **2.5.19 (new, Oct 2026).** No hidden or undocumented features [40][V]. The e2e hooks and any debug panels must not ship in a release build.
  - **5.2.** Only content you made or are licensed to use; reviewers ask for documentation in App Review Information [42][S]. Attach the generated `LICENSES.md` and manifest (source URL, licence, death and publication years per piece) and point at in-app Credits. Salamander CC BY 3.0 credit is already in Credits [C].
- **Pricing among peers [P].** Subscriptions dominate: Simply about $150 a year, flowkey $150 a year, Skoove $30 a month, Piano Marvel $130 a year, Yousician $120-180 a year. One-time outliers: Synthesia $29 unlock, forScore $24.99 (Pro add-on), Piascore $5.99. Piano Forte stays free (PRODUCT principle 6), so no In-App Purchase and no 3.1 exposure. A free App Store app still needs the $99 membership.

---

## 9. Testing on the device

- **Inspectable web view.** iOS 16.4+ needs `isInspectable`; Capacitor sets it in debug builds (`webContentsDebuggingEnabled` defaults true for development) [46][23][V/S]. Safari Web Inspector attaches today [M: used before, per ios-ux.md].
- **Appium XCUITest driver, hybrid mode.** Switch from `NATIVE_APP` to `WEBVIEW_x` and drive the DOM with the same selectors as `scripts/e2e`. Requires Web Inspector on in Safari's settings. `startAutomationSession` is simulator-only; real devices use the device transport or remote XPC on iOS 18+ [47][V/S]. Whether `ios-webkit-debug-proxy` is still needed: unverified [S]. Cost: about 1-2 days to stand up a five-feature on-device smoke run (boot, Songs, start a piece, synthetic MIDI via a plugin `inject()` method in debug builds only, export). Medium value: the 33-feature headless suite already covers logic; the device lane catches WKWebView-only faults (IndexedDB quota, `capacitor://` CORS, audio unlock).
- **XCUITest alone** sees only the accessibility tree inside a web view; canvas and WebGL are invisible [S/M]. Use it for native pieces only (pairing sheet appears, menu items exist).
- **safaridriver** drives Safari, not third-party WKWebViews; no WebDriver BiDi in Safari [48][S].
- **Playwright WebKit** is patched WebKit with device emulation: no Capacitor bridge, CoreMIDI or iOS audio session [51][V/S]. Good for layout, useless for the shell.
- **Instruments.** The Audio System Trace template has Audio Client, Audio Statistics (engine jitter: green up to 30 µs, red over 100 µs) and Audio Server (I/O cycle load, overloads) tracks, plus Points of Interest for `os_signpost` [49][V]. Add signposts at MIDI receive, bridge emit and native note-on to see the hop costs. `AVAudioSession.outputLatency` is in seconds (AirPlay adds about 2 s) [50][V].
- **Latency truth** comes from the recording method in section 2 (key thump against speaker onset). It is cheap and needs no loopback hardware.

---

## 10. Plan for this app

Days are for one developer plus an agent at this repo's pace, **including device round trips**; under free provisioning add a re-sign whenever 7 days pass.

### First: cheap, high impact (about 3-4 days total)
| # | Item | Days | Why first |
|---|---|---|---|
| F0 | **Decision for the owner: pay the $99.** | 0 | Ends 7-day expiry; unlocks TestFlight and iCloud; needed for any App Store future |
| F1 | **Built 30 Oct, not yet tried on the iPad.** **Bluetooth pairing sheet** with the iOS 27 workaround; button in Set up and the MIDI chip; `NSBluetoothAlwaysUsageDescription` | 0.5 | Unblocks the owner's Bluetooth path on iPadOS 27; every peer has it |
| F2 | **Done 30 Oct.** **MIDI timestamps**: per-packet host times, `CLOCK_UPTIME_RAW`, `now()` plus min-RTT offset; unit-test the offset maths | 0.5 | Judging stops absorbing main-thread stalls; also removes the privacy-manifest reason |
| F3 | **Built 30 Oct, not yet seen on the iPad:** a file a day (`Piano Forte YYYY-MM-DD.json`, the last 7 kept), 30 s after the last save or on leaving the app with one pending. **Auto-backup** of the JSON export to Documents (Files-visible) at session end; `UIFileSharingEnabled`, `LSSupportsOpeningDocumentsInPlace` | 0.5 | Protects against "never delete the app" and data loss |
| F4 | **Shell hygiene**: delete the `Main.storyboard` keys and file; add `PrivacyInfo.xcprivacy` and `ITSAppUsesNonExemptEncryption`; native audio interruption and route observers (reactivate the session; tell JS on Bluetooth A2DP) | 0.5 | One-time, prevents review and lifecycle bugs |
| F5 | **Web side done 30 Oct** (Listen back on the audio clock; Settings says when the output adds over 80 ms; the click needs no shift, `audioTime()` already maps through `getOutputTimestamp()`, which places a sound when the device plays it, if WebKit's figure includes Bluetooth, which is unmeasured). The measurement itself is owed. **Audio measurement** (section 2, step 1) plus web-side fixes: Listen back on the audio clock, `outputLatency` read, Bluetooth-speaker warning | 1 | Decides whether native audio is worth building |
| F6 | **Windowed-mode check** on the device; inject a window-controls inset only if content is covered | 0.25-0.5 | iPadOS 26+ requirement already met; this closes the one unknown |

### Next (about 5-8 days)
| # | Item | Days |
|---|---|---|
| N1 | **Built 30 Oct, not yet seen on the iPad:** `buildMenu` (Go ⌘1-7, Practice, View additions, Settings ⌘,, Keyboard Shortcuts ⌘?), each command handed to the page as its own key; plain keys stay the page's. **Menu bar** via `UIMainMenuSystem` and forwarded `UIKeyCommand`s | 1 |
| N2 | **Built 30 Oct, not yet seen on the iPad:** MIDI and MusicXML (`com.recordare.musicxml`, `.uncompressed`, the spec's UTIs; not `.xml`) open into the library, the event held until the page listens. **Open-in from Files, Mail and Safari** (document types, UTIs, `openURLContexts` → import) | 1 |
| N3 | **Native audio engine** (AVAudioEngine plus AVAudioUnitSampler with SF2, MIDI-thread monitoring, scheduled playback, native click), if F5 says over about 20 ms or jitter is audible; Web Audio stays for web | 4-6 |
| N4 | **iCloud Drive backup** (paid) plus `NSUbiquitousKeyValueStore` for settings and streak | 1-1.5 |
| N5 | **App Intents**: Start today's plan, Open Sight Run (foreground mode, URL into JS) | 1 |
| N6 | **VoiceOver pass** plus live region for results and coaching | 1 |

### Bigger bets (decide later)
| # | Item | Days | Condition |
|---|---|---|---|
| B1 | **App Store release** (privacy policy page, Review Notes for 4.2, rights dossier for 5.2, screenshots, nutrition and accessibility labels, TestFlight first) | 4-6 | After F and N1-N3; owner wants strangers on the iPad |
| B2 | **CloudKit sync** across iPad, iPhone and Mac (per-record merge as in section 7) | 4-6 | A second Apple device in real use |
| B3 | **Streak or plan widget** (extension plus App Group) | 1-2 | The habit features are proven on the owner |
| B4 | **Appium on-device smoke lane** | 1-2 | Once device regressions recur |
| B5 | **Drop Capacitor for a plain WKWebView**, keeping the `capacitor://localhost` origin | 2-3 | Only if Capacitor 9 or its Swift 6 move costs more than this |
| B6 | **Native play surface** (Metal highway plus native staff inside the web app) | 15-25 | Only for 120 Hz Pro hardware or if measured frame drops survive the web fixes; the Air is 60 Hz |
| — | Full SwiftUI rewrite, React Native, native tab chrome | — | Not recommended (section 1) |

---

## 11. Not verified (check before relying on it)

- Key-to-sound latency of Web Audio in WKWebView on the Air 4, over USB or BLE MIDI. Not found anywhere; F5 measures it.
- Whether the iOS 27.2 fix for `CABTMIDICentralViewController` is real (one forum poster), and whether the workaround is needed on the owner's exact build.
- Whether `env(safe-area-inset-top)` in a WKWebView includes the iPadOS 26 window-control region.
- Whether UIKit loads the storyboard's `CAPBridgeViewController` before `SceneDelegate` replaces the window (it is wasteful either way).
- That WebKit's `performance.now()` shares the uptime clock with `CLOCK_UPTIME_RAW` (the min-RTT re-sync makes it moot).
- Whether CoreMIDI's BLE driver turns BLE-MIDI header timestamps into sender-accurate `MIDITimeStamp`s.
- The compressed MusicXML (`.mxl`) UTI, and `public.midi-audio` for MIDI.
- Whether App Shortcuts need any entitlement unavailable to free teams.
- The privacy label: depends on whether the corpus host or Cloudflare keeps request logs.
- Peer stacks marked U in [P] (Piano Marvel, forScore, Newzik, Piascore, Melodics: unknown).

---

## 12. Peer apps: stack, MIDI, audio, price [P]

Strength: S = company job ad, help page or store page; M = indirect; W = anecdotal; U = not found. All from one subagent's survey on 30 Oct; URLs in the sources.

| App | Stack | MIDI and audio | Price |
|---|---|---|---|
| Simply Piano | Native Swift (M); in-house MusicSense recognition on Accelerate (M) | Mic first; in-app BLE pairing, iOS only, no connections via other apps (S); no web version (S) | About $150 a year (S, dated) |
| flowkey | React Native on iOS and Android, React and Next.js on web (S); Core Technologies team for detection | Web app uses Web MIDI in Chrome (S); in-app BLE pairing on iOS only (S) | $16-25 a month, $150 a year (S/W) |
| Skoove | SwiftUI plus Kotlin Multiplatform plus a C++ audio engine (S; moved off RN, W) | Wired and in-app BLE (S) | $30 a month; free tier (S) |
| Yousician | Unity C# shell, own C++ audio engine, thin native glue (S, job ads) | In-app BLE pairing (S) | $120-180 a year (W) |
| Tomplay | Unity (S, job ad) | — | — |
| Synthesia | C++ with its own OpenGL renderer (S) | MIDI and MusicXML; iPad since 2012 (S) | $29 one-time unlock across platforms (S) |
| Piano Marvel | U; native iOS app plus a Chrome web app | Web MIDI in Chrome (M); "the web app doesn't work on iOS" (S) | $130 a year (S) |
| Pianote (Musora) | React Native (S) | — | — |
| Playground Sessions | Desktop rewritten in Electron (W) | Lost low-latency driver choice (W) | — |
| forScore | U (assumed native) | BLE MIDI and pedals; Pencil; iCloud sync (S) | $24.99 one-time, Pro $14.99 a year (S) |
| Newzik | U | Pencil annotation; PDF to MusicXML (S) | $45 a year or $179 lifetime (S) |
| Piascore | U | IMSLP library; head-gesture page turns (S) | Free plus $5.99 (S) |
| GarageBand | Apple native | Learn to Play lessons on Mac only (S); iOS never had them (M) | Free |

Pattern: no peer ships a plain web wrapper on iPad; the web-MIDI peers keep a separate native iPad app; every keyboard-first peer pairs BLE inside the app; mic recognition drives the native C++ engines; one-time prices are the exception.

---

## Sources

Apple platform (developer.apple.com unless noted):
1. TN3192, UIRequiresFullScreen migration (rev. 2026-10-09): https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key (read via `/tutorials/data/documentation/technotes/…md`)
2. WWDC25 243, What's new in UIKit: https://developer.apple.com/videos/play/wwdc2025/243/
3. WWDC26 278, Modernize your UIKit app: https://developer.apple.com/videos/play/wwdc2026/278/
4. WWDC25 282, Make your UIKit app more flexible: https://developer.apple.com/videos/play/wwdc2025/282/ ; notes https://wwdcnotes.com/documentation/wwdc25-282-make-your-uikit-app-more-flexible/
5. UIMainMenuSystem: https://developer.apple.com/documentation/uikit/uimainmenusystem ; forums https://developer.apple.com/forums/thread/798762 , https://developer.apple.com/forums/thread/799058
6. Window controls: https://developer.apple.com/forums/thread/789303 ; https://juniperphoton.substack.com/p/adopting-the-new-window-controls ; https://dev.to/reinhart1010/pwa-in-ipados-26-is-a-joke-38g1
7. CABTMIDICentralViewController on iOS 27: https://developer.apple.com/forums/thread/850584
8. QA1831 BLE MIDI UI: https://developer.apple.com/library/ios/qa/qa1831/_index.html ; https://developer.apple.com/documentation/coreaudiokit/cabtmidicentralviewcontroller
9. MIDITimeStamp: https://developer.apple.com/documentation/coremidi/miditimestamp ; JUCE thread https://forum.juce.com/t/midi-timestamp-in-coremidi-midiportandcallback/20850
10. BLE-MIDI spec (RP-052 copy): https://github.com/ncassetta/NiCMidi/files/7835341/rp52public.pdf ; https://www.cme-pro.com/the-truth-about-bluetooth-midi/ ; https://devzone.nordicsemi.com/f/nordic-q-a/29350/reducing-latency---ble-nano-as-midi-controller/116761
11. WebKit Web MIDI bug: https://bugs.webkit.org/show_bug.cgi?id=107250 ; https://caniuse.com/midi
12. WebKit `MediaSessionManagerCocoa.mm`: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/MediaSessionManagerCocoa.mm
13. WebKit audio latency bugs: https://bugs.webkit.org/show_bug.cgi?id=231110 , https://bugs.webkit.org/show_bug.cgi?id=236363 ; RemoteAudioDestinationProxy: https://opensource.apple.com/source/WebKit2/WebKit2-7611.2.7.0.4/WebProcess/GPU/media/RemoteAudioDestinationProxy.cpp.auto.html
14. Silent switch and `navigator.audioSession`: https://bugs.webkit.org/show_bug.cgi?id=251532 ; https://bugs.webkit.org/show_bug.cgi?id=204261 ; https://developer.apple.com/forums/thread/24464
15. `outputLatency` support: https://caniuse.com/mdn-api_audiocontext_outputlatency ; https://web.dev/articles/audio-output-latency
16. AVAudioSession buffer: https://developer.apple.com/documentation/avfaudio/avaudiosession/preferrediobufferduration ; https://developer.apple.com/documentation/avfaudio/avaudiosession/iobufferduration ; forums https://developer.apple.com/forums/thread/672323 , https://developer.apple.com/forums/thread/708168 , https://developer.apple.com/forums/thread/12432
17. Bluetooth output latency: https://developer.apple.com/forums/thread/679274 ; https://developer.apple.com/forums/thread/126277
18. AU MIDI scheduling: https://developer.apple.com/documentation/audiotoolbox/auaudiounit/schedulemidieventblock ; https://developer.apple.com/documentation/avfaudio/avaudiounitsampler ; https://developer.apple.com/documentation/avfaudio/avmidieventlistblock
19. DunneAudioKit: https://swiftpackageindex.com/AudioKit/DunneAudioKit
20. Superpowered latency: https://superpowered.com/latency ; Gigazine 2015: https://gigazine.net/gsc_news/en/20150304-audio-latency-test-app
21. Capacitor 8: https://ionic.io/blog/announcing-capacitor-8 ; Ionic Feb 2025: https://ionic.io/blog/?p=6282 ; SPM traits and Swift 6: https://capawesome.io/blog/how-to-use-spm-package-traits-in-capacitor
22. Capacitor privacy manifest: https://capacitorjs.com/docs/ios/privacy-manifest ; https://raw.githubusercontent.com/ionic-team/capacitor/main/ios/Capacitor/Capacitor/PrivacyInfo.xcprivacy
23. Capacitor config: https://capacitorjs.com/docs/config
24. WWDC25 231, Meet WebKit for SwiftUI: https://developer.apple.com/videos/play/wwdc2025/231/
25. Ionic Portals: https://github.com/ionic-team/ionic-portals-ios
26. react-native-audio-api: https://docs.swmansion.com/react-native-audio-api/
27. UIDesignRequiresCompatibility and iOS 27: https://developer.apple.com/forums/thread/832543 ; https://developer.apple.com/forums/thread/832710
28. App Intents: https://developer.apple.com/documentation/appintents/appintent/supportedmodes ; https://developer.apple.com/documentation/appintents/appintent/openappwhenrun ; https://developer.apple.com/forums/thread/804015
29. ActivityKit (WWDC23 10184): https://developer.apple.com/videos/play/wwdc2023/10184
30. iCloud key-value store: https://developer.apple.com/library/ios/documentation/Cocoa/Conceptual/UserDefaults/StoringPreferenceDatainiCloud/StoringPreferenceDatainiCloud.html ; https://developer.apple.com/forums/thread/785350
31. SwiftData sync: https://developer.apple.com/documentation/swiftdata/syncing-model-data-across-a-persons-devices
32. WKWebView storage: https://ionic.io/blog/is-apple-trying-to-kill-pwas ; https://bugs.webkit.org/show_bug.cgi?id=273827 ; https://developer.apple.com/forums/thread/750682
33. File types: https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/DocumentInteraction_TopicsForIOS/Articles/RegisteringtheFileTypesYourAppSupports.html ; MusicXML container UTI: https://w3c.github.io/musicxml/container-reference/elements/container
34. Accessibility Nutrition Labels: https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels
35. Direct Touch in music apps (AppleVis): https://applevis.com/comment/22810
36. Memberships: https://developer.apple.com/support/compare-memberships/ ; https://developer.apple.com/programs/whats-included/ ; devices https://developer.apple.com/help/account/devices/devices-overview/
37. Capabilities by membership: https://developer.apple.com/help/account/reference/supported-capabilities-ios/
38. TestFlight: https://developer.apple.com/testflight/ ; https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
39. Upcoming requirements: https://developer.apple.com/news/upcoming-requirements/
40. App Review Guidelines (updated 2026-10-16): https://developer.apple.com/app-store/review/guidelines/ ; https://developer.apple.com/news/?id=92th7e5i
41. 4.2 cases: https://developer.apple.com/forums/thread/812889 ; Voyager (mirror of lemmy.world/post/2923321) https://scribe.disroot.org/post/7369014 ; https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper
42. 5.2 documentation: https://developer.apple.com/forums/thread/128141 ; https://developer.apple.com/forums/thread/698176
43. Required-reason APIs: https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype ; protobuf switch: https://github.com/protocolbuffers/protobuf/pull/15554
44. App privacy details: https://developer.apple.com/app-store/app-privacy-details/
45. Export compliance: https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations
46. Inspectable web views: https://webkit.org/blog/13936/enabling-the-inspection-of-web-content-in-apps/
47. Appium hybrid: https://appium.github.io/appium-xcuitest-driver/latest/guides/hybrid/
48. WebDriver on iOS Safari: https://webkit.org/blog/9395/webdriver-is-coming-to-safari-in-ios-13/ ; https://caniuse.com/wf-webdriver-bidi
49. Instruments audio: https://developer.apple.com/documentation/audiotoolbox/analyzing-audio-performance-with-instruments
50. outputLatency: https://developer.apple.com/documentation/avfaudio/avaudiosession/outputlatency
51. Playwright browsers: https://playwright.dev/docs/browsers
52. iPadOS 27 devices: https://www.macrumors.com/2026/06/08/ipados-27-drops-support-for-a-wave-of-ipads/ ; https://www.tomsguide.com/computing/ipads/the-ipados-27-developer-beta-is-live-heres-how-to-download-it-on-your-ipad
53. Stage Manager on iPadOS 26: https://appleosophy.com/2025/06/11/psa-apple-extends-stage-manager-to-all-ipads-supported-by-ipados-26/ ; https://support.apple.com/105075
54. SF Symbols licence: https://developer.apple.com/forums/thread/757407 ; https://developer.apple.com/forums/thread/706089
55. WWDC26 204, What's new in WebKit for Safari 27 (nothing on Web Audio or Web MIDI): https://developer.apple.com/videos/play/wwdc2026/204/

[P] Peer apps:
- Simply: https://medium.com/feed/hellosimply ; https://medium.com/hellosimply/a-look-under-the-hood-of-simply-piano-part-2-3ba3cafa1bbf ; https://piano-help.hellosimply.com/en/articles/8147838-connect-to-midi-over-bluetooth ; https://piano-help.hellosimply.com/en/articles/6719540-can-i-use-simply-on-more-than-one-device ; https://help.joytunes.com/en/articles/2728030-subscribe-to-simply-piano
- flowkey: https://builtin.com/job/software-engineer-product-led-growth-mfd/3636653 ; https://help.flowkey.com/en/articles/412925-connect-your-instrument-with-your-pc-mac ; https://help.flowkey.com/en/articles/412853-connect-your-instrument-to-your-ipad
- Skoove: https://startupjobs.htgf.de/companies/skoove/jobs/68150938-mobile-engineer-ios-kotlin-multiplatform-with-focus-on-audio-music-education-at-music-tech-company ; https://help.skoove.com/en/articles/5417607-what-is-skoove-premium-and-how-much-does-it-cost
- Yousician: https://thehub.io/jobs/5d2c6022a160e903068c1925 ; https://jobs.trueventures.com/companies/yousician-2/jobs/62837949-c-audio-engineer ; https://support.yousician.com/hc/en-us/articles/204799551-Choosing-your-set-up-for-piano
- Tomplay: https://wellfound.com/jobs/3093561-unity-app-developer
- Synthesia: https://en.wikipedia.org/wiki/Synthesia_(video_game) ; https://synthesia.app/About ; https://www.synthesiagame.com/unlock
- Piano Marvel: https://support.pianomarvel.com/portal/en/kb/articles/requirements ; https://apps.apple.com/us/app/-/id1016751878
- Pianote and Musora: https://ca.talent.com/en/jobs/k-c---developer-l-abbotsford-bc
- Playground Sessions: https://jp.trustpilot.com/review/playgroundsessions.com
- forScore: https://forscore.co/kb/category/03-before-you-buy/ ; https://forscore.co/kb/how-to-buy/
- Newzik: https://apps.apple.com/app/id966963109
- Piascore: https://apps.apple.com/mx/app/piascore/id406141702
- GarageBand: https://support.apple.com/guide/garageband/gbnd50355d19/mac ; https://www.macworld.com/article/231510/garageband-10-3-update-makes-artist-lessons-free-and-adds-1-000-new-loops.html

Internal: `docs/research/ios-ux.md`, `PRODUCT.md`, `ROADMAP.md`, `ios/App/App/PianoNative.swift`, `ios/App/App/Info.plist`, `ios/App/App/Base.lproj/Main.storyboard`, `src/native-midi.ts`, `src/audio.ts`, `src/app/take-ui.ts`.
