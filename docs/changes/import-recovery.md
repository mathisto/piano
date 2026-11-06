# Own-file discovery and damaged-file recovery

**6 November 2026.** The first launch now offers **Your music** as a direct Set up step, and Songs says at its head that MIDI and MusicXML files can be brought in and stay on the device. Both Add files actions are real keyboard-focusable buttons.

A damaged local song no longer becomes a dead playable row. Songs parses each local file independently in its lazy path, leaves every readable file available, and reports only the skipped file. **Remove damaged copy** forgets that file's bytes while keeping its progress and takes; adding the original file again restores them because its content id is the same. Focus returns to Add files after recovery.

Backup restore now runs the real MIDI or MusicXML importer before storing each song. A cut-short, hand-edited or otherwise unreadable song is skipped instead of planting a record that breaks the library later. Recovery and parser inspection remain lazy; the 223,000-byte boot budget was not raised.

## Checked

- Unit coverage: a bad backup song is never stored; a malformed existing record is named for recovery; forgetting its bytes keeps its progress; Songs and first-run Set up expose the new actions.
- Browser feature 22: Set up and Options remain axe-clean; a seeded damaged IndexedDB song is skipped, cannot be played, can be removed alone, and leaves its practice history intact.
- Looked at in Nocturne and Matinée at 1180×820, 820×1180 and 390×844. The sheet scrolls at the phone size; the Songs notice and action reflow without horizontal overflow.

## Still open

- Report a problem still opens GitHub until the owner chooses the non-GitHub support address for `REPORT_TO`.
- The new first-run import and recovery paths still need one physical iPad Files/open-in and VoiceOver check.
