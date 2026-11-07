# Native capture cleanup

**TL;DR (7 Nov 2026):** the CoreMIDI startup closure now states its one-shot strong capture explicitly. This removes four Xcode 27.1 `ImplicitStrongCapture` warnings without changing the weak lifetime of the MIDI, notification or timer callbacks.

## Root cause

`start()` moves CoreMIDI client creation to the main queue so later device notifications arrive on a thread with a run loop. That outer queue closure used `self` implicitly and therefore captured it strongly, while the four long-lived callbacks inside it deliberately captured `self` weakly. Xcode 27.1 diagnosed the mismatch four times.

The outer closure is one-shot work owned by the plugin call, so an explicit `[self]` is the existing lifetime made visible rather than a new retention policy. The inner callbacks remain `[weak self]`.

## Verified

- A clean iPad simulator compile reproduced all four warnings before the change and none after it.
- The complete Vitest run passed: 87 files passed, 1 skipped; 1,077 tests passed, 4 skipped.
- TypeScript and the production Vite build passed; the unchanged 223,000-byte boot gate passed.
- A signed generic-iOS Release archive completed with no source warning.
- The full end-to-end run passed 49 of 50 under load; its one shell-navigation timeout passed immediately when rerun alone, leaving every one of the 50 features passing.

## Device boundary

After the connected iPad was unlocked, the direct signed Hackronomicon build completed with no source warning. That proves the physical-device compiler and signing path; the existing owner checklist still covers behavior with the iPad and FP-10.

## Shipped

Runtime `3e47cd1b` is live and byte-matches local `main`, GitHub and `app.pagetohand.com/version.txt`. App Store Connect accepted TestFlight build 712, and Apple's readiness email confirms it is available to install. The live catalogue at the app's actual `/corpus/catalog.json` endpoint reports build `44a4bc80bf5e2109`, 2,347 pieces and 185 composers.
