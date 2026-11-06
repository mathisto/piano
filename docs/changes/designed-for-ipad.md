# Designed for iPad on Mac — 6 November 2026

## TL;DR

Piano Forte now builds, signs, installs and runs through Xcode's real **My Mac (Designed for iPad)** destination. First-run setup, Today, Songs, the 902-piece piano library, Settings, relaunch persistence and full-, half- and quarter-screen layouts were exercised on the owner's Apple-silicon Mac. The pass also removed four undefined Mac keyboard-shortcut collisions and completed the file-type declarations that macOS validates.

## What changed

- The app removes UIKit's irrelevant rich-text **Format** menu before adding Piano Forte's menu commands. That keeps `⌘B`, `⌥⌘V` and `⌘-` owned by Metronome, Next View and Zoom Out instead of colliding with Bold, Paste Style and Smaller.
- The Help menu replaces the unused compatibility-app help item with Piano Forte's **Keyboard Shortcuts**, so `⌘?` has one owner.
- MIDI, MusicXML and Piano Forte pack document declarations now identify the app as a `Viewer`, matching its import behavior and satisfying macOS document validation.

## Verification

- Signed Debug build for `platform=macOS,arch=arm64,variant=Designed for iPad` succeeded with the app's Apple Development identity and provisioning profile.
- Xcode installed and ran the compatibility app. The repaired launch produced no duplicate-shortcut or `CFBundleTypeRole` warnings; the menu bar visibly omitted Format, showed Practice, and Help contained only Keyboard Shortcuts.
- Clean first launch showed Set up. After Done, Today rendered; Songs showed all eight starters and the 902-piece Pieces lane; Settings opened; the native CoreMIDI bridge started and returned an empty source list with no keyboard attached.
- The app remained readable and operable at the regular window size and macOS half- and quarter-screen sizes. Relaunch skipped Set up, proving the local first-run state persisted.
- `npm test`: 84 files and 1,065 tests passed; one file and four tests skipped. `npm run build` passed. Boot JavaScript remains 222,030 bytes under the unchanged 223,000-byte gate.

## Still requires hardware or distribution

- Connect the FP-10 to the Mac and confirm it appears and plays through the native CoreMIDI bridge.
- The Xcode compatibility sandbox cannot register App Shortcuts with macOS `linkd`; the iPad metadata is still present, but Shortcuts on a distributed Mac build is not claimed from this run.
- The owner's iPad touch, VoiceOver, iCloud, Shortcuts and Siri checklist remains the release truth for those paths.
