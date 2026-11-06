# App Shortcuts — 6 November 2026

## TL;DR

The iPad app exposes two useful actions to Shortcuts, Spotlight and Siri: **Today's Practice** opens the same next unit as Today's lamp, and **Sight Run** opens its existing builder. They reuse the app's local plan and routes, work without an account and never begin playing on their own.

## What changed

- **Start Today's Practice** opens the app, reads the local practice record, asks the existing Today planner for its next unit and stops at that unit's ordinary ready state.
- **Open Sight Run** opens Read with Sight Run selected and the saved run setup intact.
- A native pending action survives a cold launch. Once Capacitor loads, the plugin delivers it to the page; a running app receives the same event immediately.
- Only the two common, meaningful actions are donated. Piano Forte does not turn every tab or button into a shortcut.

## Why this shape

Apple recommends App Shortcuts for a small set of common actions that are meaningful to the user. Foreground App Intents may configure the app's UI directly, and the provider is discovered from the app bundle without a registration flow. The intent therefore names one action and opens the app; Piano Forte's existing page remains the sole owner of navigation, recommendations and practice state.

Sources: [Apple: Bring your app's core features to users with App Intents](https://developer.apple.com/videos/play/wwdc2024/10210/), [Apple: Configuring the runtime behavior of your app intents](https://developer.apple.com/documentation/appintents/configuring-the-runtime-behavior-of-your-app-intents), [Apple: App Shortcuts](https://developer.apple.com/documentation/AppIntents/app-shortcuts).

## Verification

- Xcode's App Intents metadata processor extracted exactly two discoverable actions, four spoken phrases, foreground launch behavior, titles and symbols from an iOS 15 deployment target build.
- End-to-end feature 0c invokes the same browser event as the native bridge. It verifies Sight Run opens its builder and Today's Practice reaches a ready play screen without starting the run.
- Unit tests reject every native action id except `practice` and `sight-run`.
- The complete unit, build and end-to-end suites are run before release; the 223,000-byte boot budget is unchanged.

## Check on the iPad

1. After installing the build, open Shortcuts and search for Piano Forte. Confirm **Today's Practice** and **Sight Run** are the only two actions.
2. Force-quit Piano Forte, run **Today's Practice**, and confirm it opens the same item Today's lamp offers and waits for Play.
3. Force-quit again, run **Sight Run**, and confirm Read opens directly on the builder with your saved setup.
4. Repeat both while Piano Forte is already open on a different page. Confirm each arrives once and no practice data or setup is reset.
5. Ask Siri to “Start today's practice in Piano Forte” and “Open Sight Run in Piano Forte.”
