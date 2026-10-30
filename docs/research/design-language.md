# A native-feeling design language for the iPad app (research, 30 Oct 2026)

What Apple's HIG asks that a web-view app can honour, the icon-library choice (SF Symbols' licence rules it out for the web build), how web-built apps feel native, how practice apps end a session, and rules to audit every screen against. Gathered by a research agent; claims carry their sources, [S] marks a search snippet only.

I've finished the research and wrote nothing in the repo. Two existing notes, `docs/research/ios-ux.md` and `ios-native.md`, already cover Liquid Glass and the SF Symbols question. This report agrees with them and adds the primary licence text, the icon-library comparison and a set of design rules. Sources are numbered and listed at the end; [S] marks a claim I saw only in a search snippet, not on the page itself.

**Short answer:** yes to one standard icon set, but used Apple's way, not to strip out words. Use the system font for all UI text, and keep the Barlow italic type and the amber lamp for the brand.

## 1. Apple's guidance a web-view app can follow (HIG pages current to June 2026)

- **Typography.** The iPadOS default text size is 17 pt and the minimum is 11 pt [4]. Apple says to prefer system fonts, which bring Dynamic Type and Bold Text for free [4]. A custom font is allowed if it stays legible and honours the same accessibility settings [4]. In WebKit, `font-family: -apple-system` gives you San Francisco, and the keywords `font: -apple-system-body`, `-apple-system-headline` and so on follow the user's Dynamic Type size [18]. A display font for brand moments is fine; using it for chrome is what makes the app feel non-native.
- **Navigation.** On iPad the tab bar sits near the top and can optionally turn into a sidebar. Apple prefers a tab bar, wants a symbol plus a text label on every tab, and warns against overflow tabs [7].
- **Toolbars.**
  - Apple prefers "simple, recognizable symbols for items instead of text, except for actions like edit that aren't well-represented by symbols" [6].
  - Back and Close should be the standard symbols with no word on them [6].
  - Only one primary (prominent) action, placed at the trailing end [6].
  - Toolbars may hide for a distraction-free view, as long as there is a reliable way to bring them back [6].
- **Menus.** Use icons in menus "sparingly and with purpose", give icons to every item in a group or to none, and leave an icon out if none clearly fits [10].
- **Segmented controls.** Don't mix text and icons in one control; Apple says that "can lead to a disconnected and confusing interface" [11]. That is close to the owner's own word for the app.
- **Liquid Glass.** It is for the control layer only: never in the content layer, and "sparingly" on custom controls [8].
  - CSS can't really reproduce it. The refraction trick needs `backdrop-filter: url(#svg)`, which only Chromium renders. Safari accepts the syntax and then draws nothing, so `@supports` reports success when it shouldn't [19].
  - Recommendation: don't fake it. At most, use a plain `backdrop-filter: blur()` on floating pop-overs.
- **Colour.**
  - Put the accent colour on the background of a primary action, not on its text or icon [9].
  - Never use one colour for two meanings [9]. The existing One Lamp Rule already matches both points.
  - A dark-only appearance is allowed for immersive apps; Apple cites Stocks [12].
- **Sizes and motion.** Hit regions must be at least 44×44 pt [5]. Animation should be purposeful, short and precise [13].
- **Haptics.** On iPad the only haptic sources are Apple Pencil Pro, some trackpads and game controllers [14]. Design none.
- **Menu bar.** On iPad the menu bar mirrors the Mac's menu order and keyboard shortcuts [15]. `ios-native.md` already recommends `UIKeyCommand` for this.

## 2. Icon library

**SF Symbols: not allowed on the website, and very risky even inside the app.**
- The Xcode and Apple SDKs Agreement, §2.10, says system-provided images "are licensed to You solely for the purpose of developing Applications for Apple-branded products". They may not be used in "app icons, logos" [1].
- The same agreement defines "Application" as software "specifically for use on Apple-branded products" [1].
- Apple's SF Symbols notice classes every symbol as one of these system-provided images [3].
- A community answer on Apple's forums (July 2026, not Apple staff) says putting them on a website is "against the license included with the SF Symbols download" [2].
- So the public site is out. Inside the WKWebView, the iPad app is arguably an Application, but the same `src/` serves the public web build. Bundling the SVGs there would put them on the website too, so treat the web code as off-limits.
- Native `UIMenu` and `UIKeyCommand` items may use SF Symbols.

**The alternatives** (checked against each package's icon list and licence):

| Library | Looks like SF Symbols? | Licence | Music icons | Size |
|---|---|---|---|---|
| **Lucide** 1.65, ~2,000 icons | 24px grid, 2px stroke, round caps and joins (the same style as `src/icons.ts`); stroke width can be changed | ISC, keep the notice; Feather-derived icons are MIT [20] | metronome, piano, keyboard-music, eighth-note, repeat, hand, gauge, ear, timer, sliders-horizontal | 350–560 B per raw SVG |
| **Phosphor** 2.1.1, 1,512 icons | Six weights including Fill, which matches SF's weight axis and its filled versions best [21] | MIT | metronome, piano-keys, music-note, repeat, hand-palm, gauge, speedometer, ear, waveform | ~400 B |
| **Tabler** 3.50, 5,203 icons | 2px stroke, slightly more geometric | MIT | metronome, piano, music, repeat, hand-stop, gauge, ear | ~550 B |
| **Heroicons** 2.2, 324 icons | Close enough | MIT | musical-note, arrow-path, hand-raised only; no metronome, piano, gauge or ear | — |
| **Material Symbols** | Google's look, the furthest from iOS | Apache-2.0 | piano, music_note, repeat, back_hand, speed, hearing; **no metronome** | — |

Sources: [20]–[24].

**Recommendation: Lucide, with no dependency.** Copy the path data for the icons you need into the existing `icons.ts` map. Its grid, stroke and caps already match the 14 hand-drawn icons, so there's no change in style. Try `stroke-width: 1.75` to sit closer to SF's regular weight; that number is my judgement, not checked against SF. Add the ISC notice to Credits. Choose Phosphor instead only if you want filled icons for selected states.

## 3. How web-built apps get a native feel

- **Ionic** switches each component's styling per platform ("ios" mode) rather than using one cross-platform look [25].
- **Capacitor guides** list the usual checklist: turn off `-webkit-touch-callout` and `user-select` outside text fields, use `overscroll-behavior` per scroll container, pad for `env(safe-area-inset-*)`, and keep 44px targets [26] [S, vendor blog].
  - The app already does all of these.
  - It also handles `prefers-reduced-motion`, hover-only `@media (hover)` styling and the tap highlight.
  - So the "jank" feeling doesn't come from this checklist.
- **Notion** replaced web-view screens with native ones "one piece at a time, starting with a new home tab", and claims iOS launch became 2× faster [27] [S].
- I found nothing primary on how Linear's or Figma's iPad apps are built.
- **What's left that a user notices**, in my judgement:
  - The chrome isn't in San Francisco.
  - Buttons are text-only.
  - Labels are tracked uppercase, a web convention; iOS uses sentence case.
  - Dialogs have many buttons where iOS would use a pop-over or a menu.
- An unverified idea: native `<select>` elements in a WKWebView should open the system menu. That would be free native chrome; check it on the iPad.

## 4. How practice apps end a session

Evidence here is thin. Most of it is snippets.
- **Yousician:** the score sits top right, with "Play again, Practice, Perfect it, or Continue, depending on how you played" [28] [S]. So 2–3 actions show, chosen by the result.
- **Melodics:** one, two or three stars per lesson [29] [S]. The post-play screen's shortcuts are documented only as a screenshot I couldn't read.
- **Piano Marvel (sight-reading test):** a score plus a progress chart after each attempt [30] [S].
- **flowkey:** a reviewer complains of "too many clicks" to repeat an exercise [32] [S].
- **Simply Piano:** its help centre says nothing about the end screen [31].
- forScore, Moises, Anytune and Tonal Energy are tools with no graded session end.

The common pattern is one big figure, then a forward action as the primary, a retry, and one context-dependent practice action. Piano Forte's results card currently offers up to 5 actions (next step, Again, Songs, Listen back, Compare).

## 5. Recommendation: keep the brand, make the chrome native

**Keep:**
- Barlow Condensed 800 italic for what is *announced*: page titles, big figures, judgements, results, count-in.
- The amber lamp, the dark navy, the hand and grade colours, and Bravura for notation.

**Change:**
1. Read UI text uses `font-family: -apple-system, system-ui, sans-serif` instead of Hanken Grotesk. That's one token change and one less webfont. Tabular numbers via `font-variant-numeric` should still work, but I haven't tested it with SF.
2. The uppercase tracked Label style becomes sentence case at 13–15px.
3. The seven tabs get a Lucide icon plus their word. Universal toolbar verbs go icon-only with `aria-label`: play/pause, restart, loop, metronome, close, back, more. App-specific verbs keep icon plus word: Wait for me, Learn/Perform, Listen back, Fix these.
4. End-of-run cards show one primary, Again, and a More menu that holds Listen back, Compare and Songs.

**Rules a designer can check each screen against:**
1. **Two voices.** Barlow italic only for announcements; everything tapped or read in a sentence is in the system font, in sentence case.
2. **One lamp.** At most one amber fill per screen, on the background of the primary verb.
3. **Icons, Apple's way.** Universal verbs are icon-only; app-specific verbs get icon plus label; tabs always get icon plus label; menus use icons for every item in a group or none; never mix text and icons in one segmented control.
4. **One icon family.** One stroke weight and size (20px glyph in a 44px target), no one-off drawings.
5. **Three actions at most** visible on any summary or end surface; the rest go under More.
6. **Right container for the job.** Options go in a pop-over anchored to their button, tasks in a sheet, playing is full screen; no centred dialog with five buttons.
7. **Touch rules.** 44pt targets, no hover-only affordances, reduced motion honoured, no fake glass, and chrome never glows.

**What I couldn't verify:**
- The licence file that ships inside the SF Symbols download. I relied on Xcode agreement §2.10 [1] instead.
- Lucide's design-guide page: it returned 404, so its rules come from a search snippet.
- Yousician's support page (blocked by Cloudflare).
- The Simply Piano and flowkey end screens, and how Linear's and Figma's iPad apps are built.
- How `<select>` looks in a WKWebView on iPadOS 27.

**Sources**
1. https://www.apple.com/legal/sla/docs/xcode.pdf (§2.10, definition of "Application")
2. https://developer.apple.com/forums/thread/837003
3. https://gist.github.com/applch/1147c949f11be203d71f362d24592a58
4. https://developer.apple.com/design/human-interface-guidelines/typography
5. …/buttons
6. …/toolbars
7. …/tab-bars
8. …/materials
9. …/color
10. …/menus
11. …/segmented-controls
12. …/dark-mode
13. …/motion
14. …/playing-haptics
15. …/the-menu-bar

(5–15 share the base URL of 4.)

18. https://webkit.org/blog/3709/using-the-system-font-in-web-content/
19. https://dev.to/devyatov/liquid-glass-on-the-web-6-ways-to-build-it-with-css-and-svg-3m07 and https://github.com/rizroze/liquid-glass
20. https://unpkg.com/lucide-static@1.65.0/LICENSE , https://unpkg.com/lucide-static@1.65.0/icon-nodes.json , https://lucide.dev/guide/design/icon-design-guide [S]
21. https://github.com/phosphor-icons/homepage , https://unpkg.com/@phosphor-icons/core@2.1.1/
22. https://unpkg.com/@tabler/icons@3.50.0/
23. https://unpkg.com/heroicons@2.2.0/
24. https://fonts.google.com/metadata/icons , https://unpkg.com/@material-symbols/svg-400/package.json
25. https://ionicframework.com/docs/theming/platform-styles
26. https://capgo.app/blog/basic-js-css-config-for-native-app-look/
27. https://www.notion.com/en-gb/releases/2022-07-20
28. https://support.yousician.com/hc/en-us/articles/208014795-How-song-score-is-calculated
29. https://www.melodics.com/support-articles/support-scoring
30. https://pianomarvel.com/sight-reading
31. https://piano-help.hellosimply.com/en/articles/7943490-learning-with-simply-piano-the-basics
32. https://deals.venturebeat.com/sales/flowkey-classic-plan-3-year-subscription
