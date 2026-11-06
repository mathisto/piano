# Platform ownership copy — 6 November 2026

## TL;DR

Set up and Credits now tell the truth about the surface they are running on. The paid iPad and Designed-for-iPad Mac app says, “One purchase. Everything included. No subscription, ads or account.” The website says, “Free in your browser. No subscription, ads or account.”

## What changed

- The existing native bridge check selects one of the two lines. It adds no StoreKit, receipt check, account, entitlement state or in-app paywall.
- Both Set up and Credits use the same function, so the promise cannot drift between them.
- The browser description, product contract and design specification now describe the confirmed $129.99 paid-download/free-browser model.

## Verification

- 1,071 unit tests pass; one file and four tests remain intentionally skipped.
- The production build and Capacitor sync pass. Both ownership lines are present in the iOS bundle, while the native bridge selects the paid-app line at runtime.
- Boot JavaScript is 222,100 bytes, 900 bytes under the unchanged 223,000-byte budget.
- Set up and Credits were rendered in Nocturne at the iPad landscape target. The browser line remains readable at its existing 13px secondary hierarchy without crowding either sheet.
- All 50 end-to-end journeys pass after updating the Credits assertion to require the browser-specific promise.
- The live entry and lazy sheet artifacts contain the exact browser and app promises; production `version.txt` names runtime `5ddee84`.
- TestFlight build 705 uploaded successfully. Its version 1.0 archive contains the paid-app promise and both App Intents metadata files.
