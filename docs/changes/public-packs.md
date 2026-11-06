# Public packs — 6 November 2026

## TL;DR

Piano Forte now has a small, checked public pack shelf without accounts or a marketplace. Two CC0 packs build ordered practice from generated Technique exercises and Read stages. The app can browse and add them, and a shared pack link is associated with the iPad app while still opening the website when the app is absent.

## What changed

- `public/packs/` holds one `.pthpack` file per plan, a deterministic `index.json` and a plain download page. The first plans are Technique first steps (nine five-finger and scale exercises) and Reading foundations (all eighteen Read stages in order).
- `npm run packs:check` parses every file with the app's real validator, checks unique ids, licences and catalogue or stage references, and refuses a stale index or changed hash. The Packs GitHub Action runs the same check against the live catalogue for every relevant pull request and main push.
- Technique and Songs keep the existing plan rows. Their final Piano Forte packs row opens the existing sheet; Add fetches one same-origin file and passes it through `parsePack` again before storing it. A bad index or file produces one status line. File and inline-link sharing remain independent of the index.
- The iPad target now carries `applinks:pianoforte.mattkelly.io`. The association file admits only root URLs with a `pack=` fragment; native and TypeScript handlers validate HTTPS, exact host, root path and fragment again, then route through the existing compressed-pack parser. Capacitor's scene proxy already preserves a cold-start universal link until plugins load.

## Judgement calls

- This is a maintained shelf, not a marketplace: no account, ratings, comments, upload service or remote music. A pull request is the contribution path and CC0 / CC BY is required for the list text and order.
- The index is discovery metadata, never trust. The downloaded pack must still pass the same size, schema, text, URL and recipe checks as a file from Mail or Files.
- The browser sheet uses the app's plan-row grammar and quiet ghost Add action. No new visual language or promotional card was introduced.
- Universal links retain the existing whole-pack fragment, so the server never receives the plan and a recipient without Piano Forte still has the web route.

## Verification

- `npm run packs:check`, 1,060 unit tests, TypeScript, the production build and a native simulator compile pass. The unchanged 223,000-byte boot-JS gate passes.
- End-to-end feature 25c browses the public index, passes its sheet through axe, adds the generated Technique plan, starts its first exercise and verifies its stored origin.
- The UI is checked in both themes at 1180×820, 820×1180 and 390×844 before release. The Impeccable detector's standalone-page findings were inspected: its named Newsreader font was corrected to the documented family and size; the remaining Matinée colours are the exact documented Ground, Line and Accent tokens rather than palette drift.
- The merged release passed all 48 end-to-end browser journeys. Local main, GitHub main and live `version.txt` matched runtime commit `6012c2f4` after deployment; the live index matched the checked file byte for byte.
- The origin serves the extensionless association file directly over HTTPS. Apple's CDN returned the same 201-byte body as `application/json` with `Apple-Origin-Format: json`. The signed archive contains the exact associated-domain entitlement, its profile authorizes the capability, and TestFlight build 687 uploaded successfully. The remaining proof is the device tap below. Sources: [Supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains), [Supporting universal links in your app](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app), [TN3155](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links).

## Check on the iPad

1. Open Technique, tap Piano Forte packs > Browse, add Technique first steps and start the first C five-finger exercise.
2. Add Reading foundations and confirm its first item opens the treble-landmarks Read stage.
3. Share either pack as a link into Notes or Messages, tap it with Piano Forte closed, and confirm the app opens the pack list with “Added from a link.”
4. Long-press the same link in Notes and confirm iPadOS offers both Piano Forte and the browser; choose each once.
5. Turn off the connection after adding a pack and confirm its exercises still start; only browsing the shelf should need the network.
