# Page to Hand

6 Nov 2026. The owner locked **Page to Hand** as the product name after the Piano Forte collision. The Pause / Lid mark, Urtext palette, typography and icon geometry stay unchanged.

## Clearance checked

This was a preliminary product-name clearance, not a legal opinion.

- The official USPTO search returned no exact `PAGE TO HAND` mark and no live `PAGE TO HAND`, `PAGE TWO HAND` or `PAGE2HAND` variant. A broad live Class 9/41/42 query found one unrelated children's-education design because its long image description happened to contain both “page” and “hand,” not because those words were its mark.
- Apple's Search API returned no exact or close `Page to Hand`, `Page2Hand` or `Page-to-Hand` title in the US, Canada, UK or Australia. Exact web and Google Play searches found no product using the name.
- Registry lookups returned no current record for `pagetohand.com`, `pagetohand.app` or `pagetohand.io`. That is not a purchase reservation; availability must be checked again at checkout.

## Built

- Changed every current user-facing product name in the web app, PWA manifest, support and privacy pages, pack shelf, reports, native menu copy, App Shortcuts, iPad display name, document names and accessibility labels to Page to Hand.
- Changed the package and archive labels to `page-to-hand` / `PageToHand` without changing the public repository, Apple record or installed-app identity.
- Preserved the bundle ID `io.mattkelly.piano`, iCloud container `iCloud.io.mattkelly.piano`, existing `piano.*` storage keys, `.pfpack`, its legacy MIME type and the current `pianoforte.mattkelly.io` origin. Those are compatibility identifiers, not visible branding.
- New sync and daily-recovery files use Page to Hand. Both the browser and iPad still read the old Piano Forte filenames so the owner's existing TestFlight data survives the rename.
- Updated the current product, design, identity, roadmap and handoff sources. Historical research, audits and shipped change notes keep the name they had when written.

## Deliberately separate

- The canonical domain, support alias and redirect cannot change until the owner buys the domain. The old origin must continue serving the corpus, packs, support, privacy and universal links used by TestFlight build 705.
- The App Store Connect product-page name and metadata are account-side changes. The bundle ID and Apple ID must not change.
- A new marketing landing page is the next brand surface; this branch only makes the existing product internally consistent.

## Checks

- `npx vitest run`
- `npx tsc --noEmit -p .`
- `npm run build`
- `npm run e2e`
- No boot-JS budget increase.
