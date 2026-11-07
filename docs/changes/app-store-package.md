# App Store submission package

**TL;DR (6 Nov 2026):** the first Page to Hand TestFlight email verified the outward rename. A complete, tested local App Store package now holds the English listing copy, privacy answers, review notes, score-rights dossier, submission gates and six reproducible 13-inch iPad screenshots. Nothing was submitted to App Store Connect in this branch.

## Built

- `app-store/metadata.json`: name, 30-character subtitle, promotional text, description, 88-byte keywords, URLs, categories and paid-download facts.
- `app-store/privacy.md`: conservative App Store privacy answers for the current Cloudflare request path, separate from the bundle privacy manifest.
- `app-store/review-notes.md`: a no-hardware review path and the exact account/purchase boundary.
- `app-store/rights.md`: the inspected 2,347-file catalogue by licence and the location of its per-file evidence manifest.
- `app-store/submission-checklist.md`: the remaining account and real-device gates, without treating them as complete.
- `scripts/render-app-store.mjs`: deterministic screenshots from real app states. It connects a synthetic MIDI device, performs a scripted demonstration run, imports and opens a real MIDI file, seeds Read progress and opens the iPad local-data controls. The ownership capture fails if its native preview does not expose the reminder and `Use iCloud Drive` controls.
- `src/app-store.test.ts`: metadata limits plus PNG count, dimensions and no-alpha checks.

## Screenshot story

The first three images tell the search-result story in order: know what is next, play it on a real piano, then fix the exact bars that slipped. Import, curriculum and ownership follow. The frame extends the approved Urtext identity; the app remains the majority of each image. No private grader, dynamic fingering, AI or unshipped feature appears.

## Verified

- Six PNGs at 2752 × 2064, truecolour with no alpha.
- The screenshot renderer completed from a clean local app state.
- Listing limits pass in Vitest; full test results are recorded in the milestone commit.

## Left

- Wait for or inspect the current DSA state, then enter and preview the package in App Store Connect.
- Confirm `support@pagetohand.com` delivery before publishing that address.
- Complete the owner iPad checklist and the cautious accessibility labels.
- Record a physical-keyboard review video for App Review if requested.
