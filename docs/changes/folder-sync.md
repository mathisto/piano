# Folder sync — 6 November 2026

## TL;DR

Piano Forte can now merge progress, imported pieces and packs through one folder the player controls. The iPad app uses its public iCloud Drive Documents container; Chrome and Edge use a folder chosen through the File System Access API. There is no Piano Forte account or server, and no service run by the project can read the folder.

## What changed

- Each installation owns one `Piano Forte Sync <device-id>.json` file. It reads the other installation files and writes only its own, so cloud storage never resolves two writers of one file.
- The existing backup merge is the one merge law. Device files are applied oldest first; more-seen learning records, maxima, timestamped logs and unique imported files still merge as before. One pre-merge backup is kept locally.
- Sync carries progress, pieces and packs. Keyboard calibration, sound, appearance and other device settings do not travel. Explicit Backup > Import still restores settings.
- The iPad plugin discovers remote documents with `NSMetadataQuery`, starts placeholder downloads and coordinates reads and writes. Chrome persists the player-granted directory handle and asks again only when the browser requires permission.
- Sync runs when enabled, when the app becomes visible and 30 seconds after local record changes. Writes caused by a merge do not form a loop; a genuine write during sync schedules a follow-up.
- Settings > Your data has one Sync row with success, permission, unsupported-browser and failure states. Backup remains directly below it. Stopping sync removes the saved folder choice but not any file in the player's folder.

## Boundaries

- The merge is monotonic at the app's existing record granularity, not a counter CRDT. Two devices incrementing the same aggregate before either sees the other can retain the larger value rather than the sum. Timestamped logs, distinct days, pieces and packs merge independently.
- Safari and Firefox do not expose a persistent writable directory picker; they keep Export and Import. Chrome or Edge on the Mac is the web route.
- A device check is still required for iCloud placeholder download, two-device propagation and the Files-visible container name.

## Verification

- Focused unit coverage exercises multi-file merge with a damaged peer, device-setting isolation, own-file exclusion and failed-merge write safety.
- TypeScript and Vite production build pass with `sync.ts`, `backup.ts` and `@capacitor/core` outside the fixed 223,000-byte boot budget.
- The signed archive, App Store provisioning profile and uploaded binary carry `iCloud.io.mattkelly.piano` as both the iCloud and ubiquity container. TestFlight build 683 uploaded successfully.
- The Settings row was rendered in light and dark at 1180×820, 820×1180 and 390×844 with no horizontal overflow; the Impeccable detector returned no findings.
- The merged release passed 1,056 unit tests and all 47 end-to-end browser journeys; local main, GitHub main and the live `version.txt` matched `84533dc` after deployment.

## Check on the iPad

1. In Settings > Your data, tap Use iCloud Drive. Confirm Sync now replaces it and Files shows a Piano Forte folder with one device file.
2. Practise or import one piece, wait 30 seconds, then tap Sync now. Confirm the success time changes.
3. In Chrome on the Mac, choose that Piano Forte folder, sync, and confirm the iPad progress and piece appear without the iPad's appearance, sound or delay changing.
4. Make different progress on both devices before syncing either; sync both twice and confirm neither side loses a piece, pack, practice day or result.
5. Turn iCloud Drive off or deny the folder once. Confirm Settings names the recovery and Backup > Export still works.
