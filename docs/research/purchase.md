# One purchase, no account — launch design

**6 November 2026. Status: researched and designed; the owner must confirm the paid-up-front model and support address before App Store or runtime changes.**

## TL;DR

Sell the complete iPad app as a **$129.99 paid download**. Keep the browser edition free. Do not add StoreKit, a paywall, a trial clock, an entitlement server, a restore button or an account. The App Store is the purchase and restoration layer; once installed, Piano Forte stays the same complete, offline-first app it is now.

The product promise is **“One purchase. Everything included. No subscription, ads or account.”** Avoid “lifetime” in contractual copy: it implies an indefinite support obligation that a one-time licence cannot honestly guarantee. “One purchase” says exactly what the customer buys.

## Why this is the ownership-first model

| Model | What it adds | Fit |
|---|---|---|
| Paid app | One price before download; Apple restores the app from purchase history | **Recommended.** No in-app ownership state, server or locked feature |
| Free app + non-consumable unlock | StoreKit bridge, product loading, purchase and pending states, receipt/transaction verification, restore and Family Sharing edge cases, a paywall and a definition of what stays free | Rejected. It creates failure modes and contradicts “nothing is locked” |
| Subscription | Renewal, cancellation and server-backed entitlement expectations | Rejected by the owner and the product contract |
| Free app + tip | No required purchase and unpredictable revenue | Not the stated business model |

Apple describes the paid model as paying once to download and use all functionality. In-app purchase is required only when functionality is unlocked *inside* an app. A paid download therefore needs no StoreKit runtime at all. [Apple business models](https://developer.apple.com/app-store/business-models/), [App Review Guidelines 3.1.1](https://developer.apple.com/app-store/review/guidelines/)

The free website is the trial: it offers the same practice model on a compatible browser without an account. The paid iPad app provides native CoreMIDI, Files/open-in, iCloud-folder sync, App Shortcuts and the music-stand form factor. The app contains no link or call to buy elsewhere.

## Price and economics

- **Recommended US launch price: $129.99.** Piano Marvel currently charges $129.99 for one year of Premium, the anchor the owner chose. Piano Forte charges it once. [Piano Marvel 12-month Premium](https://store.pianomarvel.com/product/piano-marvel-premium-12-month-1-account/)
- Let Apple generate localized storefront prices and taxes. Do not maintain a second hand-priced territory table. Apple provides hundreds of price points and automated storefront pricing. [App pricing](https://developer.apple.com/help/app-store-connect/reference/pricing-and-availability/app-pricing-and-availability/)
- Enrol in the App Store Small Business Program before launch. The stated rate is 15% for paid apps below its eligibility ceiling; approximate proceeds on a US $129.99 sale are $110.49 before applicable taxes, refunds and adjustments. Without it, the standard rate is 30%, or about $90.99 on the same basis. [Small Business Program](https://developer.apple.com/app-store/small-business-program/), [program membership](https://developer.apple.com/programs/whats-included)
- No launch discount, countdown or introductory tier. A stable price is calmer, easier to explain and fair to the first buyers.
- Leave App Store purchase sharing available if the app record offers it. Do not invent a Piano Forte household account.

The Paid Apps Agreement, banking/tax setup, Small Business enrolment and current app price could not be verified without an App Store Connect sign-in. They remain account-side launch gates, not assumed facts.

## Product contract

The purchase includes every feature and every bundled/openly licensed item in the app. It also includes ordinary app updates while Piano Forte remains maintained. It does **not** promise that every future operating system will run the binary forever, that a network catalogue will remain reachable forever, or that third-party copyrighted music will appear.

Ownership is made concrete:

- Practice history, settings, imported music, packs and takes stay on the device or in the folder the player chooses.
- Export and import remain available. Removing the app still erases its local container, so the app continues to say that plainly and points at Backup first.
- No Piano Forte login, activation key, device limit, receipt server or periodic entitlement check exists.
- The installed shell, bundled material and saved library pieces work offline. New optional catalogue downloads need the catalogue host once, then remain local.
- The public repository, open score licences and portable backup format remain the protection against a service rug-pull.
- Sharing a `.pfpack` remains free and never carries paid music.

## Copy at launch

The current “Free, no subscription, no ads, no account” line is true during TestFlight and on the website. At App Store launch it becomes platform-specific:

- **iPad/Mac app:** “One purchase. Everything included. No subscription, ads or account.”
- **Website:** “Free in your browser. No subscription, ads or account.”
- **App Store opening:** “A complete piano practice system for a real keyboard. Buy once; everything is included.”

Do not show a purchase screen inside the app. Set up remains about connecting a keyboard and bringing music, not defending the price after the customer already paid it.

## Support and privacy surfaces

Publish two small, durable pages on the existing origin and link both from Settings/Credits:

- `https://pianoforte.mattkelly.io/support/`: the support address, what to include in a report, Backup/Export before reinstalling, and the current app/version location. Apple requires the Support URL to lead to real contact information. [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/)
- `https://pianoforte.mattkelly.io/privacy/`: the data inventory, storage locations, network requests, retention and deletion choices. Apple requires a public privacy-policy URL and an easily accessible in-app link. [Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/), [App Review Guidelines 5.1.1(i)](https://developer.apple.com/app-store/review/guidelines/)

The privacy claim must be precise, not “nothing ever leaves the device”:

- MIDI input, imported scores, practice history, settings, takes and the player profile stay local or in the player-chosen sync folder.
- Optional catalogue, score, pack and update requests cross Cloudflare. Caddy has no access-log directive, but Cloudflare retains sampled HTTP-request analytics for at least 31 days; those requests can include IP-derived coarse location and diagnostic/network metadata. App Store privacy answers must disclose the applicable non-tracking categories rather than claim “Data Not Collected.” [Apple app privacy details](https://developer.apple.com/app-store/app-privacy-details/), [Cloudflare analytics retention](https://developers.cloudflare.com/observability/logs/datasets/)
- The Cloudflare browser-performance beacon is injected into the public website, not the bundled app. Cloudflare says it discards source IP at the edge but retains unsampled beacon data for seven days and aggregates some longer. The web privacy page names it; turning it off remains the cleaner follow-up. [Cloudflare RUM beacon](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
- Apple processes the paid download; Piano Forte never sees payment-card details. Apple explicitly excludes payment data the developer cannot access from the developer's collection disclosure. [Apple app privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- A support email is sent only when the player chooses it. This infrequent, optional support path can qualify for Apple's optional-disclosure rule if the composer clearly shows what will be sent; the privacy policy still names it.

The exact App Store privacy questionnaire is an account-side attestation. Record the selected answers in the release checklist after the support page and network audit are final; do not guess them in App Store Connect.

## Implementation

One runtime branch after the owner confirms the two decisions below:

1. Add the support and privacy pages as static, no-script documents using the Urtext colours and readable system type. Both must work without the app shell and return 200 at their final URLs.
2. Set `REPORT_TO` to the chosen address. Keep the current prefilled subject, piece identity, catalogue build, bar and app version; do not attach practice data or files.
3. Add Support and Privacy links to Settings/Credits. Keep them ordinary system-browser links on iPad.
4. Replace the shared “Free” sentence with the native/web-specific copy above. Do not change it in TestFlight until the paid launch is being prepared.
5. Add tests for the platform copy, support destination, privacy/support links and static response bodies. Keep every addition lazy or static; the 223,000-byte boot gate does not move.
6. Exercise Nocturne/Matinée at iPad landscape, portrait and phone widths, then run the full suite, deploy, upload TestFlight and perform the short real-device check.

No StoreKit dependency, native purchase plugin, receipt code, backend or database is planned. If Apple rejects a paid-up-front build for an evidenced reason, reconsider a non-consumable unlock then—not pre-emptively.

## App Store launch gates

1. Owner confirms **paid download at $129.99** and supplies the support address.
2. Account Holder accepts the current Paid Apps Agreement, completes tax/banking and enrols in Small Business. A paid app cannot be sold without the Paid Apps Agreement. [App pricing](https://developer.apple.com/help/app-store-connect/reference/pricing-and-availability/app-pricing-and-availability/)
3. Publish and verify Support and Privacy URLs; complete the privacy questionnaire from the final inventory.
4. Set category, age rating, content rights, tax category, territories and $129.99 base price. Use manual release.
5. Prepare truthful screenshots and metadata from the release binary. No “lifetime”, “AI”, licensed-song or unshipped grader/fingering claims.
6. Give App Review a no-account path and explain that on-screen keys let them inspect the app without MIDI hardware; include a small public-domain import fixture if review needs the file path.
7. Run `docs/device-checks.md` on the iPad/FP-10, including purchase-copy, Support, Privacy, backup/export and offline relaunch.
8. Submit one release candidate, resolve review findings, then manually release it only after the approved binary and public pages are rechecked.

## Decisions needed from the owner

1. Confirm the recommendation: **paid App Store download, $129.99 US, browser edition remains free**.
2. Provide the public support email used by `REPORT_TO` and the Support page.

Everything else above follows from the existing offline/no-account contract and can proceed once those two are answered.
