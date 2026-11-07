# Launch discovery and sharing — 6 November 2026

## TL;DR

The public Page to Hand site now identifies one canonical address to browsers, search engines and link previews. It has a reproducible 1200×630 product-proof share card, declared icons, a sitemap and crawler policy. The browser app and retained Piano Forte origin are explicitly `noindex` at the server, so the marketing site is the public search result.

## What changed

- Added canonical, Open Graph and large-card metadata to the marketing page; Support, Privacy and the browser app each declare their own canonical URL.
- Declared the existing Pause / Lid favicon and Apple touch icon on the marketing page.
- Added `robots.txt` and a sitemap containing only the public marketing, Support and Privacy pages.
- Added `scripts/render-marketing-share.mjs` and `npm run marketing:share`. It renders the real approved first viewport at its native 1440 layout and downsamples it to the required 1200×630 PNG; the share card therefore stays coupled to the product proof instead of becoming a separate ad composition.
- Corrected the Support mail draft's stale “Piano Forte support” subject. Cloudflare Email Routing is ready for `support@pagetohand.com` through its one verified destination; the existing mailbox remains visible until delivery is confirmed end to end.
- Added `X-Robots-Tag: noindex, nofollow` to the shared browser-app/old-origin Caddy block. The marketing host has no such header.
- Kept the native wrapper unit isolated from its unrelated lazy sync graph, eliminating a Vitest teardown race exposed by the release run.

## Verification

- The share card was opened at its original 1200×630 size; its score, analysis and Today panel are legible without the 1200-pixel row collision found in the first render.
- The refreshed Impeccable desktop and mobile captures remain visually unchanged. The responsive gate passed at 81% and recorded `ship` for the current inputs.
- All 1,075 unit tests pass, including checks for the canonical links, social image declaration, exact PNG dimensions, robots policy, sitemap URLs and corrected mail subject. TypeScript and the production build pass, and all 50 end-to-end journeys pass.
- The release process still requires live response checks after deployment.

## Still open

- Confirm delivery through `support@pagetohand.com`, then replace the existing public mailbox in the app, Support and Privacy pages.
- Submit the sitemap to search consoles only if their ownership workflows become useful; the sitemap and robots discovery path do not require an account.
