# Page to Hand launch site and domain cutover — 6 November 2026

## TL;DR

Page to Hand now has one launch-ready public surface: `pagetohand.com` introduces the product, `app.pagetohand.com` runs the free browser app and corpus, and `pagetohand.app` redirects to the public site. The iPad app uses the new app origin for its catalogue, public packs and pack links. The old Piano Forte origin stays live until the owner verifies the new TestFlight build.

## What changed

- Built the approved Urtext launch page from the product itself: imported score, written-versus-played evidence, timing and note-length analysis, and the resulting Today curriculum. It uses the canonical Pause / Lid geometry, palette and type system rather than a second web brand.
- Kept every claim inside the shipped product boundary: MIDI and MusicXML import, a real MIDI keyboard, local files and progress, more than 2,300 open or public-domain scores, a free browser edition and the confirmed $129.99 one-time iPad price. The unreleased iPad offer says “Coming soon to the App Store” and is not a link.
- Added `marketing/index.html` as its own Vite entry with no runtime JavaScript. CSS motion is finite and disabled by reduced-motion preferences.
- Moved the iPad shell's corpus, public-pack and universal-link origins to `app.pagetohand.com`; Support and Privacy now use `pagetohand.com`. The bundle ID, iCloud container and storage keys remain unchanged.
- Routed the two Cloudflare zones through the existing quartz tunnel. Caddy serves the browser app and corpus at `app.pagetohand.com`, rewrites only the marketing root at `pagetohand.com`, and redirects `www` plus the `.app` domain to the canonical marketing URL.
- Preserved `pianoforte.mattkelly.io` as a working app origin for the cutover. Redirect it only after the owner confirms the new TestFlight build can load the catalogue and shared pack links.

## Verification

- The Impeccable responsive gate passed at 81% against the approved composition; its independent finish review closed every requested correction and recorded `ship`.
- Desktop, tablet and phone renders have no horizontal overflow or missing images. Axe reports no WCAG A/AA violations.
- The production build contains the marketing page and its hashed CSS, font and proof plates without a marketing JavaScript entry.
- 1,073 unit tests, TypeScript, the production build and all 50 end-to-end journeys pass; the boot JavaScript gate remains unchanged at 223,000 bytes.
- Caddy and tunnel configurations validated before installation. Origin checks kept the previous Piano Forte host and unrelated quartz sites healthy through the one tunnel restart.

## Still open

- Owner: verify the new TestFlight build on the iPad before the old origin redirects.
- App Store: finish Page to Hand metadata after the Digital Services Act review, then replace the marketing page's “Coming soon” state with the real listing URL.
- Brand the public support mailbox at the new domain once its delivery route is verified; until then the already-working `pianoforte@mattkelly.io` address remains truthful.
