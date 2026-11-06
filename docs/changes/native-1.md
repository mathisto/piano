# Native 1: menu bar, practice reminder, Dynamic Type, pack files (1 Nov 2026)

Horizon decisions 29, 31 and 32 (`docs/research/horizon.md` sections 4.2 to 4.4), and the `.pthpack` open-in route for the Studies work. Built and checked in the iPad Pro 13-inch (M5) simulator (iPadOS 26.0 and 26.3 runtimes) and the browser; nothing run on the physical iPad.

## The menu bar (decision 31)

- Seen in the simulator: iPadOS already shows an application menu with **"Piano Forte Settings…" on ⌘,** (the system's item, which opens the app's page in iPadOS Settings). The old build also put its own "Settings…" on ⌘, (a duplicate; keeping ⌘, while placing it in the system's group crashed the simulator at launch, "Replacement elements contain duplicates"), so the app's own item is now **"In-App Settings…" on ⌥⌘,**, appended to the system's Settings group (`builder.replace(menu: .preferences …)`), as the HIG asks. If a build ever has no system item it goes at the end of the application menu.
- The **Go menu is gone: the seven tabs are the first group of View**, ⌘1 to ⌘7. Then Zoom In and Out, Next View (⌥⌘V), Note Names (⌥⌘N) and **Hide or Show Controls (⌥⌘M, new: the page's `M` had no menu item)**. Practice: Play or Pause (⌘↩), Metronome (⌘B), Slower and Faster (⌘[ ⌘]). Help: Keyboard Shortcuts (⌘?).
- **Audit.** Every menu command now sends the page a key the page handles, and every single-key shortcut of the page has a menu command (Escape excepted: it is the page's own back, and a menu key would take it from dialogs and text fields). To keep them one set, the menu no longer has special `tab:` and `settings` messages: the digits **1 to 7 (tabs, while the tab bar shows) and `,` (Settings) are now page keys** in `src/app/input.ts`, so the website has the same set, and `src/native-app.ts` just forwards the key. `src/menu.test.ts` reads `AppDelegate.swift`, `input.ts`, `ui.ts` and the Help sheet and fails on a command whose key the page does not handle, a page shortcut without a menu command, a duplicate shortcut, or a tab list that differs from the page's.
- **Bug fixed on the way:** a menu command sent a synthetic key that the Keyboard shortcuts switch (Settings > Advanced) then discarded, so the menu did nothing for exactly the people who turn single keys off. A synthetic key (`isTrusted` false) now passes the switch.
- Not done: items are never disabled when they do not apply (the HIG says to disable, not hide; the page ignores them instead). Disabling needs the page's state in Swift; filed here.

## The practice reminder (decision 29)

- Settings > **Reminder** > "Remind me": Off or On and a time (`settings.remind`, minutes after midnight, unset = off). **iPad app only** (the group is not rendered on the web), **off by default**, and the permission is asked when the player turns it **On**, never at launch. A refusal sets it back to Off and says where to allow it; a later revoke in iPadOS Settings shows the same line under the row.
- The rule is `reminders()` in `src/reminder.ts` (pure, unit-tested): at the chosen time on each of the next three days not yet past, **skipping a day with a minute of practice** (the streak's own line). `src/native-reminder.ts` sets them as local notifications (`@capacitor/local-notifications` 8.3.1, ids 1 to 3, replaced each time) **on each trip to the background and when the setting changes**, so an app left unopened for three days falls silent after its third, and a day already practised is skipped. No server, no push entitlement.
- Words: title "Time for the piano", body "10 minutes? Next up: Treble landmarks." (the plan length, then the Read stage Today names, "Review: …" when cards are due). Never the streak, never what is at risk (`reminderText`, tested).
- Known edges: if the app is killed in the foreground after practising, the previous day's schedule stands until the next background trip (so a practised day can still get its note). Notifications are not shown while the app is in front. The sound and Focus settings are the system's.
- Boot size: all of it is lazy (`native-reminder.ts` loads when the app first goes to the background or Settings opens in the app). The boot JS is 222 627 bytes against the 223 000 budget, up 396 from the menu keys and the drawer's one line; the budget is not raised, and the next boot addition anywhere will need something moved out first.

## Dynamic Type (decision 32)

- `PianoNative.swift` `textSize()` and a `textSize` event carry the system content size category; `textScale()` in `src/native-app.ts` turns it into Apple's body size over 17 pt, **never below 1** (the type is read from a music stand; smaller text is not honoured, flag if you want it) **and 2 at most**, and sets `--ts` on `<html>`. Every font size in the CSS is now `calc(Npx * var(--ts))` (`--ts: 1` by default, so the website and the default size are unchanged); the covers' type, the staff, the highway and the music glyphs keep their own zoom.
- Checked in the simulator end to end at Accessibility L (about 194%): the text scales on the Today page and the Set up sheet; and in the browser with `--ts` 1.94 at 1180 by 820 and 820 by 1180 on every tab, the Settings drawer and a piece's start card.
- **The 200% pass fixed:** the top bar (seven tabs and the keyboard chip) scrolled sideways, so it is **capped at 110%** (`--ts-bar`, as iOS's tab bars and toolbars are); the Settings drawer let its segmented controls run off the edge, so it **widens in step with the text** and its label column too; the stage tables' action and mastery columns overlapped (Read, Scales), so their widths follow the text; the Technique selects truncated ("Five-fing"), so their minimum width does.
- **Still rough at 200%, not fixed:** the Learn start card in landscape at 820 px tall is cramped and scrolls inside itself (the "Show" row can be cut at the side); in portrait the card spills a little over the on-screen keys; Theory's level pick sits tight under its line. **Larger Text is therefore not claimed.** The staff and the falling notes do not scale by design.
- Not done: the Newsreader names are scaled by the same ratio and have not had their own check (the system-font plan in `horizon.md` 4.4 said they might need one).

## `.pthpack` files open the app

- `Info.plist` exports the type **`io.mattkelly.pagetohand.pack`** (conforms to `public.json`, extension `pthpack`, mime `application/vnd.page-to-hand.pack+json`) and lists it as a document type at rank Owner, so Mail, Messages, AirDrop and Files offer "Open in Page to Hand" for a pack, and a pack is still readable as JSON.
- `public.json` itself is **not** registered as a document type: it would put the app in the share sheet of every JSON file, and the JS handler would answer each with "not a MIDI or MusicXML file" (and our own backups are `.json` too). Add it only with a JS side that recognises a plain JSON file.
- **The route is the existing open-in path, unchanged:** `capacitorOpenURL` in `PianoNative.swift` reads the file (in place, security-scoped) and notifies the page with the plugin event

```
CoreMidi event "file":  { name: string, data: string }
  name: the file's name with its extension, e.g. "Chopin preludes.pthpack"
  data: the file's bytes, base64
```

  `src/native-app.ts` turns it into `new File([bytes], name)` and calls `importFiles([file])` (`src/app/library.ts`), exactly as for a dropped or picked file. **The Studies importer reads the pack with `file.text()` and must accept the `.pthpack` extension in `importFiles`**, whose extension check currently answers "… is not a MIDI or MusicXML file" for it; that is the only change needed there. The event is held until the page listens (a cold start from a pack works).

## Check on the iPad

1. **Menu bar** (swipe down, or hold ⌘): the application menu shows the system's "Piano Forte Settings…" and, below it in the same block, "In-App Settings…" (⌥⌘,). View begins with Today to Progress on ⌘1 to ⌘7. Practice, Help and the rest show their shortcuts. If the swipe-down shows no menu, or a Go menu, report it.
2. ⌘1 to ⌘7 switch tabs; ⌥⌘, opens Settings; ⌘↩, ⌘B, ⌘[ and ⌘] work in a piece; ⌥⌘M hides the controls. Then turn Settings > Advanced > Keyboard shortcuts **off** and check the menu commands still work.
3. **Reminder:** Settings > Reminder > On asks for permission once; allow it, set a time two minutes ahead, leave the app (the Home gesture) and wait: one note, "Time for the piano", "10 minutes? Next up: …". Practise a minute, leave again: nothing the rest of that day. Turn it Off: none. Deny the permission once (iPadOS Settings > Piano Forte > Notifications off) and check the line under the row.
4. **Dynamic Type:** iPadOS Settings > Display & Brightness > Text Size, or Control Center > Text Size for this app only, with Larger Accessibility Sizes. Switch back to the app: the text grows without a relaunch. Look at Today, Songs, Read, Settings and a piece's start card at the largest size; the top bar stays at about 110%.
5. **A pack:** AirDrop or Mail a `.pthpack` file (rename a JSON file) to the iPad: "Page to Hand" is offered, and the app opens. Also check a `.mid` and a `.musicxml` still open as before.
6. The system Settings item (⌘,): note what it opens in iPadOS Settings (there is no Settings.bundle, so Piano Forte's page may only show Notifications and Bluetooth).
