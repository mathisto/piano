# Installable web app — 6 November 2026

## TL;DR

Piano Forte can now be installed from Chrome or Edge on a Mac as its own standalone app. It keeps the same website, local data, offline shell and no-account model; installation adds an app window and launcher icon, not another Piano Forte storage service.

## What changed

- The root page links one stable manifest identity (`id`, `start_url` and `scope` are `/`) named Piano Forte and displayed `standalone`. No orientation is forced: the existing responsive portrait, landscape and windowed layouts remain available.
- The approved Pause / Lid SVG now deterministically generates both 192 and 512 px maskable PNGs. The public files are byte-equal to those identity outputs; no icon geometry was redrawn.
- The manifest uses paper for the install background and Nocturne ground as its static default theme. The page's existing light/dark theme-colour metadata still follows the player's Appearance setting once open.
- The versioned offline shell now precaches the manifest, both install icons, the Apple touch icon, favicon and pre-paint theme script. An installed app can cold-launch with the same identity and forced appearance after its first online visit.

## Judgement calls

- The file is `/manifest.json`, not the recommended `.webmanifest`: the production Caddy path serves `.json` as `application/json`, while its default `.webmanifest` response has no media type. This fixes the response itself without a quartz configuration exception.
- There is no custom install banner. Chrome and Edge already expose their native install command; Piano Forte does not interrupt practice to advertise its own chrome.
- There are no manifest shortcuts yet. The single-page app has no stable URL routes for Today, Read or Songs, and inventing query routing here would couple this branch to the later App Intents / Shortcuts work.

## Verification

- `src/manifest.test.ts` fixes the manifest contract, PNG dimensions and identity-output hashes. The complete suite passes: 83 files and 1,062 tests, with one file and four tests skipped. The 223,000-byte boot-JS budget is unchanged.
- Chrome's DevTools protocol parses both the production build and the live site with no manifest errors, resolves the standalone root identity and both icons, and reports no installability error after ignoring only the unavoidable incognito status of the headless test context. End-to-end feature 27 preserves that check; the full default run passes 49 of 49 features.
- The production Caddy binary serves the manifest as `application/json` and both icon files as PNG. The built service worker names every startup asset in its precache.
- The offline production check passes: the worker controls the page, an offline reload opens Today, lazy song chunks open, and a server 502 falls back to the cached shell.
- Runtime `2e497bfa` is live and byte-matches the local and GitHub revisions. App Store Connect accepted TestFlight build 690 and began processing it.
- Current manifest and install guidance: [W3C Web Application Manifest](https://www.w3.org/TR/appmanifest/), [Chrome install criteria](https://web.dev/articles/install-criteria), [Chrome manifest guidance](https://web.dev/articles/add-manifest).

## Check on the Mac

1. Open the live app in Chrome, wait about 30 seconds and use the address-bar Install control or menu > Cast, save, and share > Install Piano Forte.
2. Confirm Piano Forte opens without browser tabs or an address bar and shows the approved cream-and-ink Pause icon in Applications, Launchpad and the Dock.
3. Practise or change Appearance in the installed window, quit it and reopen it. Confirm the same local progress and chosen appearance remain.
4. Disconnect the network after one complete online visit. Reopen the installed app and confirm Today loads and a bundled song opens.
5. Resize the installed window through narrow portrait and wide landscape proportions; confirm no orientation or fixed-size restriction appears.
