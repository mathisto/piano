# Ownership-first purchase design — 6 November 2026

Purchase and App Store research is complete in `docs/research/purchase.md`. The recommendation is one $129.99 paid App Store download, matching Piano Marvel's verified current annual price once, while the browser edition remains free. There is no StoreKit runtime, subscription, trial, paywall, entitlement server or Piano Forte account.

The design fixes the ownership promise, price economics, platform-specific launch copy, public Support and Privacy surfaces, network-data disclosure, account-side App Store gates and the release verification order. Runtime and App Store state are unchanged pending two owner decisions: confirm the paid-up-front model and provide the public support address.

Verification: official current Apple payment, pricing, privacy, support-metadata and Small Business guidance; Piano Marvel's current store price; the live Piano Forte Caddy and Cloudflare path; `src/docs.test.ts`; `git diff --check`.
