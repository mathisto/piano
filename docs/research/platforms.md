# Platforms beyond the iPad: iPhone, Mac, Apple Watch, Android, sync, distribution

Research date: 2026-10-30. Scope: every platform other than the iPad, which `docs/research/ios-native.md` (a parallel note) covers in depth; iPad points here are kept short. Read against the repo at `2788c25`: Capacitor 8.5, `capacitor.config.ts`, `ios/App/App/Info.plist`, `ios/App/App.xcodeproj/project.pbxproj`, PRODUCT.md, ROADMAP.md, `docs/research/ios-ux.md`.

Evidence tags, as in `ios-ux.md`:

- **[V]** read on the primary page in this session (Apple pages through Apple's JSON documentation endpoint, Google and Android docs, the Capacitor source on GitHub, App Store listings).
- **[S]** secondary: a blog, vendor page, forum thread, review or search-result snippet. Plausible, not proven.
- **[M]** from memory or inference. Verify before relying on it.
- **[C]** computed, or read from this repo.

Numbers in brackets point at the source list at the end. Effort is in working days for one developer with an AI agent, set against this repo's own pace (359 commits since the first one on 2026-10-18 [C]). At that pace code is rarely the bottleneck. The bottlenecks are devices nobody has tested on, store review, and Google's 14-day closed test, and an agent does not shorten any of them.

**Gaps up front.** I found no measured figures for Apple Watch haptic timing jitter, for WatchConnectivity latency, or for Web Audio output latency in an Android WebView. I found nothing primary on how peers lay out their apps on a phone. I could not confirm whether a free Personal Team can run the app on the Mac's "My Mac (Designed for iPad)" destination. Each gap is marked where it matters.

---

## 1. Headline findings

1. **The iPhone build already exists.** `TARGETED_DEVICE_FAMILY = "1,2"`, and the Info.plist lists iPhone orientations [C]. The app has never been run on an iPhone. iPhone support is therefore a layout and testing job, not a new app.
2. **Safari still has no Web MIDI in 2026.** caniuse lists desktop Safari as unsupported through 27.1 TP and iOS Safari through 27.2. WebKit bug 107250 is still NEW [1][2][V]. The only route is a third-party Safari extension that adds the API on macOS (Safari 18.4+); it is userland, not WebKit [1][V]. On the Mac the answer stays Chrome, Edge or Firefox, which is what the owner uses today.
3. **An Apple Watch cannot pair with an iPad.** It pairs only with an iPhone [21][S], and WatchConnectivity links a watch app only to its iPhone app [19][V]. watchOS blocks low-level networking (Network framework, Bonjour) outside audio streaming, VoIP and a tvOS case [20][V]. A watch therefore cannot share a tempo clock with the iPad on a local network. Whatever it learns from the iPad has to travel through an iPhone, CloudKit or HTTPS.
4. **Haptic metronome limits are documented.** `WKInterfaceDevice.play(_:)` has no effect when the app is in the background or inactive, except during an active workout session. A new call while the engine is still running stops it and waits at least 100 ms. It should not be called while HealthKit gathers heart rate, because heart-rate sampling pauses while the motor runs [16][V]. watchOS has no Core Haptics, so only the fixed `WKHapticType` set is available (click, start, stop and so on) [17][18][V]. No extended runtime session type fits music practice [15][V].
5. **The evidence for a wrist metronome is mixed.** Tactile synchronization comes close to auditory for simple rhythms, but auditory wins on complex rhythms, and only the auditory condition showed error correction [22][S]. Haptic-only cues lowered drummers' accuracy for less experienced players [23][S]. Users and reviewers report the Apple Watch motor is too weak for a metronome, or cuts out when the wrist drops [24][25][S]. A beginner pianist moves both wrists constantly. Value is low.
6. **Android may need almost no MIDI code.** MDN's compatibility data lists Android WebView as supporting Web MIDI, mirroring Chrome [7][V]. Chrome 124 and later put all MIDI access behind a permission prompt [8][S]. Capacitor's `BridgeWebChromeClient.onPermissionRequest` grants every resource it does not handle without prompting the user, MIDI among them [9][V]. The web code should therefore run unchanged in a Capacitor Android shell. This has not been run on a device. Chrome on Android also runs the existing website with Web MIDI today [1][V].
7. **Capacitor has no macOS platform.** Ionic ships no official macOS platform. The community Electron platform's last release was 5.0.1 in September 2023, and Capawesome sells a replacement [5][S]. The real Mac options are the iPad app run on the Mac, Catalyst, or the website in Chrome.
8. **A paid Apple account unlocks almost everything on this list.** It costs US$99 a year [11][V]. It removes the free team's 7-day expiry (the free team allows 3 devices and 10 App IDs) [12][V]. It unlocks TestFlight, the App Store, CloudKit, the iCloud key-value store (which only works for App Store distribution [26][V]), push and Mac Catalyst [11][V]. Google Play costs US$25 once [13][V], but a new personal account must run a closed test with at least 12 testers opted in for 14 days in a row [14][V].
9. **Sync matters to the owner already.** ROADMAP lists "storage separate from the website": progress on the iPad and progress in Chrome on the Mac are two islands today [C]. Of everything here, cross-device sync is the change with the most impact for the one real user. It also touches a product principle ("No accounts, no cloud"), so it is a decision for the owner, not a default.

---

## 2. iPhone

### What a phone at the piano can do

Geometry [C]: an iPhone 16 or 16 Pro is 393 x 852 pt at 460 ppi, which is 3x, so about 153 pt per inch. In landscape the screen is about 14.1 x 6.5 cm. The iPad Air 4 (2360 x 1640 at 264 ppi) is about 22.7 x 15.8 cm. The phone in landscape has about 62% of the iPad's width, 41% of its height and a quarter of its area. Each CSS px is also about 14% smaller physically (153 pt/in against 132). After the Dynamic Island and home-indicator insets [M], landscape leaves roughly 734 x 372 pt.

- A grand staff readable from a music stand at 60 to 90 cm needs about printed-score size: about 7 to 8 mm per stave [M]. A full system is about 30 mm, or about 180 pt on the phone [C]. One system fits in 372 pt with the chrome. A 12 cm line holds about 2 to 3 bars of easy music, against 4 to 5 on a printed line [M].
- **The staff plus falling notes does not fit.** The roadmap already reports overlap trouble on a stage 420 to 480 px tall [C], and the phone's stage is shorter. On a phone, Songs should open with the staff pane alone (the divider's collapsed end, which exists), never refuse. Falling notes alone are a choice, not the default.
- **These fit as they are:** a Read drill card or Sight Run (one card, landmark notes), Theory and ear trainers, pulse trainers, the metronome, Today, Progress and the streak. These are the parts that need the least screen. In portrait at 393 pt the on-screen keys show about 9 white keys at 44 pt, about an octave and a half [C]. That is enough to answer Theory and ear cards away from the piano with headphones.
- **These do not fit:** reading a whole piece with the highway, Compare with last time side by side, Songs browsing with four actions per row (the known item 3 in ROADMAP Next).
- Phone on the piano: Simply Piano's own listing says to place the iPhone or iPad on the piano and play [27][S]. A reviewer finds the iPhone fine on the move and the iPad better at home because it shows more notes [27][S]. That matches the geometry above.
- MIDI: iPhone 15 and later have USB-C. Older Lightning phones need Apple's camera adapter [M]. CoreMIDI and the existing Swift plugin are the same on iPhone [M]. Bluetooth LE MIDI pairing reportedly crashes on iPadOS 27.0 (ROADMAP); recheck it on iOS.
- The phone has a Taptic Engine, unlike the iPad Air [ios-ux.md]. That is no reason to build anything (YAGNI).

### Peers

| App | Phone | Notes |
|---|---|---|
| Simply Piano | iPhone, iPad, Vision Pro; not offered on Mac; no watch app [10][V] | Built around the phone on the piano; microphone or MIDI |
| flowkey | iPhones and iPads from 2016 (iOS 15.6), Android phones and tablets (Android 11 with USB host), web [28][V] | Same app on every size; nothing found on phone-specific layout |
| Piano Marvel | iOS app (iOS 13, 2 GB RAM); web is the most reliable route; Android app in beta [29][S] | Tells Android users to use Chrome instead |
| Skoove | Launched iPad-only, later on iPhone; web in Chrome or Firefox, not Safari [30][S] | |
| Yousician | iPhone, iPad, Android, Mac, Windows; no watch app in an older listing [31][S] | |
| Tonestro | App Store listing says "designed for iPad" [31][S] | iPhone, Mac and Watch not confirmed |

No peer I found ships a separate phone app. They ship one universal app and accept that the phone is the smaller screen.

### Recommendation

Use **one universal binary** (it already is one) and a phone layout pass: staff-only Songs in landscape by default, Read, Theory, ear, pulse and the metronome full-featured, and no new features. Do not build a separate phone app or a "companion" mode. CSS breakpoints and the existing divider cover the difference.

- Effort: **3 to 6 days.** Each of the seven pages at 393 x 852 and 852 x 393, safe areas, the on-screen keys, the start card on a short stage, and one session on a real iPhone with the FP-10.
- Confidence: **medium.** The geometry is computed, but no peer layout evidence was found, and nobody has opened the app on an iPhone.
- Depends on: an iPhone to test on (the owner's device list names only the iPad Air 4 and the M1 Max Mac). The paid account is needed only to ship to others.

---

## 3. Mac

| Option | What it is | MIDI | Windows and menus | Work | Verdict |
|---|---|---|---|---|---|
| (a) Designed for iPad on Apple silicon | The iPad binary runs unmodified on M-series Macs; the hardware here is an M1 Max [C] | CoreMIDI exists on macOS, so the Swift plugin should work [M, unverified] | Fixed-size window unless the app adopts iPad multitasking. This app supports all iPad orientations and does not set `UIRequiresFullScreen`, so it should resize [4][V][C]. Standard menu bar only; a Touch Alternatives tab is added; only one pointer touch at a time [4][V] | 0 code; 0.5 to 1 day of testing. Opt-in keys exist for full screen on Mac (`UILaunchToFullScreenByDefaultOnMac`, `UISupportsTrueScreenSizeOnMac`) [4][V] | **Yes, as a bonus once on the App Store.** Apple offers iPad apps on Apple silicon Macs unless you opt out in App Store Connect [4][V] |
| (b) Mac Catalyst | The iOS target rebuilt for macOS with Mac idioms | CoreMIDI, same plugin [M] | Real menus and windowing. WKWebView under Catalyst has a run of forum-reported bugs: text selection, paste doubling, a `<select>` that works only once [6][S]. This app uses selects (Theory levels) | 2 to 5 days plus the WKWebView bug risk. Capacitor 3 and later removed the UIWebView code that broke Catalyst builds [6][S] | No, unless a Mac user asks for menus. One App Store record can carry either (a) or (b), not both [3][S] |
| (c) Native SwiftUI multiplatform | Rewrite | CoreMIDI | Native | Months | No. See `ios-native.md` for the iPad case; the Mac would ride on that |
| (d) The website in Chrome, Edge or Firefox | What the owner uses now | Web MIDI works in Chrome 43+, Edge 79+ and Firefox 108+; Safari has none [1][V] | Browser window; can be installed as an app from Chrome [M] | 0 | **Yes, now.** Already the documented web target |
| (e) Electron | Chromium wrapper | Web MIDI built in | Native window and menus | 2 to 4 days, plus Developer ID notarization (paid account) and over 100 MB per download [M] | No. Chrome already runs the site with MIDI |
| (e) Tauri | Rust shell over the system WKWebView | No Web MIDI in WKWebView; needs `tauri-plugin-midi`, a midir-backed polyfill [32][S] | Native | 3 to 5 days | No. It rebuilds the CoreMIDI shim for no gain |

**Recommendation: (d) now and (a) later for free.** The web app in Chrome is the Mac app today. Once the App Store record exists, leave "Make this app available on Mac" on, check it once on the M1 Max (MIDI, audio unlock, window resize, IndexedDB), and fix only what breaks.

- Effort: **0 now; 0.5 to 1 day** when the App Store build exists.
- Confidence: **medium-high** for (d). **Medium** for (a): CoreMIDI and Web Audio inside a WKWebView running as an iPad app on a Mac were not found in Apple's pages and are not verified.
- Side effect worth having: (a) puts the Mac and the iPad in the same Apple world. CloudKit sync (section 6) then covers the Mac without the web.
- Unverified: whether the free Personal Team can run the app on "My Mac (Designed for iPad)" from Xcode. If it can, the owner can try (a) today without paying. Five minutes in Xcode would settle it.

---

## 4. Apple Watch

### What the platform allows

- **Pairing.** A watch pairs only with an iPhone [21][S]. A watch app's data link (WatchConnectivity) runs between it and its iPhone app [19][V]. `sendMessage` reaches the watch only while the watch app is in the foreground. A message from the watch can wake the iPhone app [33][S]. No latency figures are published. A 2015 forum log shows values arriving in steps of about 200 ms [33][S]. watchOS allows HTTPS through URLSession to any app [20][V], so an iPad-to-watch path could run through CloudKit or a server.
- **No shared tempo clock.** watchOS blocks low-level networking and Bonjour for ordinary apps [20][V]. The workable design is for the watch to run its own clock and take only the tempo and meter from the iPad or iPhone. It cannot hold phase with the iPad's audio clicks to musician precision without a clock-sync protocol, which these links do not support [M].
- **Haptics.**
  - Only the fixed `WKHapticType` cases are available; `.click` is the shortest [17][V]. There is no Core Haptics on watchOS [18][V].
  - Haptics play only while the app is active, or in the background during a workout session [16][V].
  - A new call while the engine is running stops it and waits at least 100 ms [16][V]. Quarter notes at 240 bpm (250 ms) should be possible. Sixteenths at 120 bpm (125 ms) are at or past the edge [C from [16]]. One developer reports that the motor "can't keep up", so users feel 2/4 instead of 4/4 at fast tempos [24][S]. Conducto claims accuracy up to 240 bpm [25][S].
  - Haptics pause heart-rate sampling, so a haptic metronome and heart-rate tracking conflict [16][V].
- **Staying alive.**
  - Extended runtime sessions come in four types: self care (10 min, frontmost), mindfulness (1 h, frontmost), physical therapy (1 h, background) and smart alarm (30 min) [15][V]. Apple says to choose the type "based on the app's intended use, not based on the features that the session provides" [15][V]. A practice metronome fits none of them.
  - The alternative is `HKWorkoutSession`, which allows background haptics [16][V]. But it needs HealthKit, collects heart rate at high frequency, and ends if any other workout starts [34][V]. Using it for a metronome is an App Review risk [M].
  - Store reviews of watch metronomes report haptics stopping when the wrist drops or the screen sleeps [24][35][S]. Conducto says it "stays running with the screen off" and does not say how [25][S].
- **Battery.** Apple warns that heavy haptic use drains the battery noticeably [16][V]. No figures were found.

### Value for this app

- **Wrist metronome: low.**
  - The app's metronome is audio from the iPad or the keyboard's own speakers. Its click is timed from the audio output timestamp [C]. A wrist tap would be less precise than that, not more.
  - The evidence above says touch is close to sound only for simple pulses.
  - The pulse trainers already measure keeping a beat, and they need sound.
  - A pianist's wrists move, and many players take their watch off to play [M].
- **Practice timer: none.** The app already counts minutes, and the Watch has a Timer app.
- **Streak complication: some**, but it needs data on the watch, so it needs an iPhone app or CloudKit.
- **"Practice now" reminder: real, and needs no watch app.** Local notifications from the iPhone app appear on a paired watch [M]. From the iPad they cannot, because the watch is not paired to the iPad.
- **Heart rate: no.** The product is evidence-led, and nothing links heart rate during practice to learning. It also conflicts with haptics [16][V].

### What it would take

The paid account, an iPhone app (the universal binary from section 2), a SwiftUI watchOS target in the same Xcode project, a WidgetKit complication, a data path (WatchConnectivity from the iPhone, or CloudKit), and a workout-session decision with its review risk.

- Effort: **6 to 12 days**, plus watch hardware the owner may not have.
- Confidence: **medium** on the platform facts (primary docs). **Low** on how well a wrist metronome works in practice (only vendor claims and reviews).

**Recommendation: do not build it.** Ship reminders as local notifications from the iPhone app when the iPhone exists. Look again only if the owner wears a watch while practising and asks for it.

---

## 5. Android

- **Shell.** Capacitor Android supports API 24 (Android 7) and later, about 99% of devices. It needs a WebView with Chrome 60 or later; Android 10 and later use the Android System WebView [36][V].
- **MIDI.**
  - Android has had a MIDI API (`android.media.midi`) since 6.0, over USB host, USB peripheral and BLE. BLE is always on where the hardware has it [37][V]. MIDI 2.0 came over USB in Android 13 [37][V].
  - Web MIDI inside the WebView is listed as supported [7][V], and Capacitor's chrome client auto-grants the MIDI permission request [9][V]. If that holds on a device, the existing Web MIDI code runs unchanged.
  - The fallback is a small Kotlin plugin over `MidiManager` that fakes the same API, mirroring `src/native-midi.ts`: **1 to 2 days**.
  - The device needs USB host support, as flowkey requires [28][V], and a USB-C cable to the FP-10's USB-B port [M].
  - Bluetooth LE MIDI through Chrome on Android is murky. Guides have it pairing through Chrome's own Bluetooth chooser or a tunnelling app such as MIDI BLE Connect [38][S]. Treat it as unverified, and keep USB as the advertised route, as on the iPad.
- **Audio.**
  - Android sets out two feature flags: `android.hardware.audio.low_latency` (continuous output latency of 45 ms or less) and `android.hardware.audio.pro` (round trip of 20 ms or less). Latency varies widely by device. Native low-latency audio is AAudio or Oboe [39][40][V].
  - No figures were found for Web Audio inside a WebView. Old reports describe Chrome on Android choosing large buffers on some phones, up to about 300 ms [41][S].
  - It matters less here than in peers, because the default sound is the keyboard's own speakers and the browser piano is opt-in [C]. The existing delay calibration covers a fixed offset. Jitter it cannot fix.
- **Tablets.** Android tablets are a small market, and flowkey's Yamaha bundle supports only some Samsung and Amazon Fire models [28][S] (flowkey's own page excludes Fire tablets [28][V]). The web app's narrow layouts already exist.
- **Peers on Android:**
  - flowkey: phones and tablets [28][V].
  - Piano Marvel: an Android app still in beta, and it tells Android users to use Chrome instead [29][S].
  - Yousician: yes [31][S].
  - Synthesia: a one-time unlock that also covers Android [42][V].
  - Simply Piano and Skoove: Android apps by repute [M].
- **Distribution.**
  - US$25 once [13][V], then the 12-tester, 14-day closed test for a new personal account [14][V]. An organization account skips the test [14][S].
  - Google's developer verification also applies to sideloaded apps. It started in select markets (Brazil, Indonesia, Singapore, Thailand) in September 2026 and goes worldwide in 2027 and later [43][S]. A sideloaded APK will soon need a verified developer too.

**Recommendation: first test the website in Chrome on an Android tablet.** That takes 0.5 day and needs a device. Build a Capacitor Android app only if Android users appear.

- Effort for the app: **3 to 6 days** of work: `cap add android`, MIDI check or Kotlin plugin, file import through the system picker, the back button, storage persistence, audio unlock, icons. Plus **14 calendar days** and 12 real testers for Play.
- Confidence: **medium-low.** The WebView MIDI path rests on compatibility data and source reading, not a device. Audio latency is unknown.

---

## 6. Data across devices

Today everything sits in IndexedDB on each device. JSON export and import exist [C]. The iPad app and the website do not share storage (ROADMAP Deploy).

| Option | Covers | Account | Server | Work | Notes |
|---|---|---|---|---|---|
| Export and import through the share sheet (Files, iCloud Drive, AirDrop) | All | None | None | 0.5 to 1 day | Manual. It exists as a file download; the work is the share sheet on iOS and a "Restore" that merges instead of replacing |
| iCloud key-value store | Apple only | The user's Apple account | Apple's | 1 to 2 days (Swift plugin) | 1 MB total, 1,024 keys, values unencrypted, App Store distribution only [26][V]. Fits settings and a summary, not the takes (recordings) |
| CloudKit private database, with `CKSyncEngine` (iOS 17 and later) [44][S] | iPad, iPhone, Mac (a or b) | The user's Apple account; no app account | Apple's; free to the developer, data counts against the user's iCloud quota [M] | 4 to 8 days | Needs the paid account and a native plugin. CloudKit JS can reach it from the web [45][V], but needs an Apple sign-in in the browser, which is an account in all but name. Nothing for Android |
| Google Drive app data folder | Android and web | Google sign-in | Google's | 3 to 5 days | Hidden per-app folder, non-sensitive `drive.appdata` scope [46][V]. A second silo beside iCloud |
| **Sync code on a tiny server** (the owner's quartz, behind the existing Cloudflare tunnel) | All, web included | **None.** A random 128-bit code, shown once as text or a QR code | One small endpoint that stores opaque blobs | **2 to 4 days** | The client encrypts with a key derived from the code, so the server holds ciphertext keyed by a hash. Merge on the client: counters take the larger, sets take the union, each card and piece takes the newer by timestamp |
| CRDT libraries (Automerge, Yjs) | All | | Any | More | Overkill: the progress data is mostly grow-only, so a hand-written merge is a few dozen lines [M] |

**Privacy.**
- Apple defines "collect" as storing data off the device "in a readable form" [47][V]. Data processed only on the device is not collected [47][V]. The page does not say whether end-to-end-encrypted blobs count as collected. Treat the label as unverified, and lean towards disclosing "not linked to identity".
- The sync-code design stores no name, email or device identifier. Cloudflare sees IPs; it already injects a beacon at the edge (ROADMAP).
- A lost code means lost sync. The local copy stays, and export stays.

**Recommendation: the sync code**, if the owner agrees to change "No cloud" to "no account, and nothing we can read". It is the only option that covers the iPad, the iPhone, Chrome on the Mac, and later Android, with one piece of code and no sign-in. CloudKit is the better fit only if the product goes Apple-only and drops the web, which contradicts the positioning in PRODUCT.md.

- Confidence: **medium.** The design is standard; the merge rules need a pass over every IndexedDB store, and the takes are big blobs that may need excluding or a size cap.

---

## 7. Business and distribution

- **Apple Developer Program: US$99 a year** [11][V]. It gives:
  - App Store distribution and TestFlight. Tester limits are reported as 100 internal and 10,000 external [48][S].
  - CloudKit (up to 1 PB per app), push, StoreKit, Mac Catalyst [11][V].
  - Development profiles that do not expire weekly [M; the free team's 7-day limit is [12][V]]. That alone fixes the "rebuild every 7 days, never delete the app" hazard in ROADMAP.
  - The App Store commission is 30%, or 15% for the small business programme [11][V]. It is irrelevant for a free app.
- **Google Play: US$25 once** [13][V], with identity verification, verifying access to an Android device, and the 12 testers for 14 days [13][14][V].
- **Peer pricing.** Subscriptions run US$119 to US$170 a year: Piano Marvel 129.99, flowkey 119.88, Yousician 119.99, Skoove 149.99, Simply Piano 169.90 [49][S]. Simply Piano's own in-app purchase list runs from US$19.99 to US$179.99 [10][V]. One-time purchases: Synthesia (one unlock covers every platform when bought on its site [42][V]), Tenuto US$4.99, Note Rush US$8.99 [50][S].
- **Is a free app with a small one-time price viable?** As a business, almost certainly not at the scale of one developer with no marketing. One-time apps in this niche price at US$5 to US$40 [42][50][S], and nothing here gives sales volumes. That is a guess [M].
- **And as a product?** A price contradicts what the app says in Credits and Set up ("Free, no subscription, no ads, no account") and Product Principle 6. The coherent options:
  1. **Free everywhere.** The US$99 a year is the owner's cost of an App Store presence.
  2. **Free, plus an optional tip** as a consumable in-app purchase. Apple permits tip jars as in-app purchases [M].
  3. A price on the stores, with the website staying free. That works: Synthesia and Piano Marvel both run free and paid channels side by side [29][42][S]. But the app's own copy would need to change.
- Before any public store release, ROADMAP already lists a legal read of the library allow and ban lists, a DMCA agent and a takedown address, and an email for `REPORT_TO`. Add a privacy policy URL; App Store Connect requires one [M]. App Review's "minimum functionality" rule against thin web wrappers is a low risk for an app with native MIDI, offline content and a large library [M].

---

## 8. Recommended platform roadmap after the iPad

| Phase | What | Why this order | Depends on | Effort |
|---|---|---|---|---|
| 0, now | Mac: Chrome, Edge or Firefox. Android: try the website in Chrome on a tablet | Already works; costs nothing | An Android device for the check | 0 to 0.5 day |
| 1 | **iPad device checks (ROADMAP Next 1), then the Apple Developer Program** | Every Apple step below needs the paid account. It also ends the 7-day expiry on the owner's own iPad | US$99; the owner's Apple ID; enrolment takes days [M] | 0.5 day of setup |
| 2a | **Sync decision, then sync code** | Most impact for the real user: the iPad and the Mac's Chrome hold different progress today. It is platform-agnostic, so every later phase inherits it | Owner sign-off on rewording Principle 5 ("Local and open") and the "No cloud" line; a quartz endpoint | 2 to 4 days |
| 2b | **iPhone layout pass** in the existing universal binary; TestFlight to the owner | The binary already targets iPhone; Theory, ear and Read work on a phone; the cheapest new platform | Phase 1; an iPhone to test on | 3 to 6 days |
| 2c | **Mac Designed for iPad**, left on in App Store Connect; one test on the M1 Max | Free once the App Store record exists; Safari users get MIDI through CoreMIDI | Phase 1; an App Store (or TestFlight) build | 0.5 to 1 day |
| 3 | App Store release (free or tip jar) | Only after the legal list in section 7 | Privacy policy, DMCA agent, `REPORT_TO`, screenshots | 2 to 3 days plus review |
| 4, on demand | Capacitor Android and Play | Only if Android users appear; Chrome on Android covers the curious until then | US$25; 12 testers for 14 days; an Android tablet with USB host; Phase 2a so Android joins the same sync | 3 to 6 days plus 14 calendar days |
| Not planned | Apple Watch app; Mac Catalyst; Electron or Tauri; a native Mac rewrite | Low value or duplicated by Chrome (sections 3 and 4). Each has a stated trigger to revisit | | |

Order of dependencies: device checks, then the paid account, then sync and the iPhone (in either order, both in phase 2) and the Mac (free), then the store release, then Android on demand. Sync comes before Android so a second ecosystem never needs a second sync design.

**Unverified items that could change this plan:**
- Web MIDI and audio inside an Android WebView on a real device (section 5).
- CoreMIDI and Web Audio in the iPad app running on a Mac (section 3).
- Whether a free Personal Team can run the app on "My Mac (Designed for iPad)".
- Apple's privacy label for end-to-end-encrypted sync data.
- Haptic timing on a real watch.
- The owner's device inventory: an iPhone? an Android tablet? a watch?

---

## Sources

1. caniuse, Web MIDI API: https://caniuse.com/midi (read 2026-10-30) [V]
2. WebKit bug 107250, Web MIDI API: https://bugs.webkit.org/show_bug.cgi?id=107250 [S, status from search]
3. Apple Developer Forums, Catalyst to Designed for iPad: https://developer.apple.com/forums/thread/757558 [S]
4. Apple, Running your iOS apps in macOS: https://developer.apple.com/documentation/apple-silicon/running-your-ios-apps-in-macos ; Adapting iOS code to run in the macOS environment: https://developer.apple.com/documentation/apple-silicon/adapting-ios-code-to-run-in-the-macos-environment [V]
5. Capawesome, Capacitor Electron platform: https://capawesome.io/blog/announcing-the-capacitor-electron-platform/ ; Capgo: https://capgo.app/blog/capacitor-electron-desktop-app/ [S, vendor]
6. Ionic forum, Capacitor and Mac Catalyst: https://forum.ionicframework.com/t/capacitor-and-mac-deployment-maccatalyst/199725 ; WKWebView on Catalyst bugs: https://developer.apple.com/forums/thread/762698 , https://developer.apple.com/forums/thread/725483 [S]
7. MDN browser-compat-data, MIDIAccess: https://github.com/mdn/browser-compat-data/blob/main/api/MIDIAccess.json [V]
8. Chrome, Web MIDI permission prompt: https://developer.chrome.com/blog/web-midi-permission-prompt [S, via search]
9. Capacitor source, BridgeWebChromeClient.java: https://github.com/ionic-team/capacitor/blob/main/android/capacitor/src/main/java/com/getcapacitor/BridgeWebChromeClient.java [V]
10. App Store, Simply Piano: https://apps.apple.com/us/app/simply-piano-learn-piano-fast/id1019442026 [V]
11. Apple, Membership details: https://developer.apple.com/programs/whats-included/ [V]
12. Apple, Compare memberships: https://developer.apple.com/support/compare-memberships/ [V]
13. Google Play, Developer account registration: https://support.google.com/googleplay/android-developer/answer/6112435 [V]
14. Google Play, App testing requirements for new personal accounts: https://support.google.com/googleplay/android-developer/answer/14151465 [V]; organization exemption: https://www.rapidnative.com/deploy/google-play-12-tester-requirement [S]
15. Apple, Using extended runtime sessions: https://developer.apple.com/documentation/watchkit/using-extended-runtime-sessions [V]
16. Apple, WKInterfaceDevice.play(_:): https://developer.apple.com/documentation/watchkit/wkinterfacedevice/play(_:) [V]
17. Apple, WKHapticType: https://developer.apple.com/documentation/watchkit/wkhaptictype [V]
18. Apple, Core Haptics (platforms: iOS, iPadOS, Mac Catalyst, tvOS, visionOS): https://developer.apple.com/documentation/corehaptics [V]
19. Apple, Watch Connectivity: https://developer.apple.com/documentation/watchconnectivity [V]
20. Apple, TN3135 Low-level networking on watchOS: https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchos [V]
21. Apple Community, Apple Watch and iPad: https://discussions.apple.com/thread/255470162 , https://discussions.apple.com/thread/253333255 [S]
22. Russo, Ammirante and Patel, auditory and tactile metronomes, Acoustics Week in Canada 2016: https://awc.caa-aca.ca/index.php/AWC/awc16/paper/viewPaper/326 [S, abstract only]
23. Bickmore et al. 2025, metronome devices for drummers: https://www.ioa.org.uk/system/files/publications/T%20Bickmore%20et%20el%20%20PRECISION%20VS.%20PROTECTION%20A%20COMPARATIVE%20STUDY%20OF%20METRONOME%20DEVICES%20ON%20TEMPORAL%20ACCURACY%20AND%20SOUND%20EXPOSURE%20RISKS%20FOR%20DRUMMERS%20IN%20LIVE%20MUSIC.pdf ; Tranchant et al. 2017: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5601036/ [S]
24. Soundbrenner Pulse review (Apple Watch haptics too weak): https://ask.audio/articles/review-soundbrenner-pulse ; Quest for Groove forum: https://questforgroove.discourse.group/t/soundbrenner-haptic-metronome/1787 ; "2/4 instead of 4/4": https://apps.apple.com/app/id1498255169 [S]
25. App Store, Conducto: https://apps.apple.com/ro/app/conducto/id6748840117 [S, vendor claims]
26. Apple, NSUbiquitousKeyValueStore: https://developer.apple.com/documentation/foundation/nsubiquitouskeyvaluestore [V]
27. Simply Piano iPhone against iPad, review snippets: https://www.musicianwave.com/?p=604914 [S]
28. flowkey, compatible devices: https://help.flowkey.com/en/articles/650972-which-devices-are-compatible-with-flowkey [V]; Yamaha flowkey bundle: https://usa.yamaha.com/products/contents/pianos/flowkey/index.html [S]
29. Piano Marvel, supported devices: https://support.pianomarvel.com/portal/en/kb/articles/requirements ; Android beta: https://support.pianomarvel.com/portal/en/kb/articles/android-beta [S]
30. Skoove: https://9to5mac.com/guides/piano/ ; https://www.bonedo.de/?p=296380 [S]
31. Yousician platforms: https://www.commonsense.org/education/app/yousician ; Tonestro: https://apps.apple.com/us/app/tonestro-aulas-de-m%C3%BAsica/id1365630760?l=pt-BR [S]
32. tauri-plugin-midi: https://docs.rs/crate/tauri-plugin-midi/0.3.0/source/src/lib.rs [S]
33. Apple Developer Forums, WatchConnectivity reachability and latency: https://developer.apple.com/forums/thread/788376 , https://developer.apple.com/forums/thread/9368 [S]
34. Apple, HKWorkoutSession: https://developer.apple.com/documentation/healthkit/hkworkoutsession [V]
35. App Store, Pulse metronome (MuseScore) reviews: https://apps.apple.com/us/app/pulse-haptic-metronome-for-watch/id1097323003 ; Apple forum on watchOS background audio for a metronome: https://developer.apple.com/forums/thread/821905 [S]
36. Capacitor, Android: https://capacitorjs.com/docs/android [V]
37. Android, MIDI: https://source.android.com/docs/core/audio/midi [V]
38. OffGrid Android BLE MIDI guide: https://uploads-ssl.webflow.com/60fc328d7214f6b87c58ad7d/6330bb22e239120aeadfa3a1_OffGrid%20-%20Android%20Connectivity.pdf [S]
39. Android NDK, Audio latency: https://developer.android.com/ndk/guides/audio/audio-latency [V]
40. Android, Audio latency for app developers (Oboe, AAudio): https://source.android.com/devices/audio/latency_app.html [S, via search]
41. Construct forum on Chrome Android baseLatency: https://www.construct.net/en/forum/users/netone-269819/posts/page-2 [S]
42. Synthesia unlock: https://www.synthesiagame.com/unlock [V via search snippet]
43. Android developer verification timeline: https://www.androidauthority.com/android-sideloading-changes-timeline-3679204/ [S]
44. WWDC23 10188, Sync to iCloud with CKSyncEngine: https://developer.apple.com/videos/play/wwdc2023/10188/ [S, page title and chapters]
45. Apple, CloudKit JS: https://developer.apple.com/documentation/cloudkitjs [V]
46. Google, Drive application data folder: https://developers.google.com/workspace/drive/api/guides/appdata [V]
47. Apple, App privacy details: https://developer.apple.com/app-store/app-privacy-details/ [V]
48. TestFlight tester limits: https://studio.adalo.com/blog/apple-developer-program-guide [S]
49. ArtMaster, what piano apps cost in 2026: https://www.artmaster.com/articles/what-piano-apps-actually-cost-in-2026 [S]
50. Tenuto: https://www.musictheory.net/buy/tenuto ; Note Rush: https://apps.apple.com/gb/app/note-rush-learn-to-read-music/id1083801827 [S]
