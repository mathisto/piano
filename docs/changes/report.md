# Report a problem and the practice summary

## Report a problem
- A quiet "Report a problem" link on the start card of any library piece (kept on the short card too) and under each piece in Settings > Credits. `src/report.ts`, `src/report.css`.
- It is a plain `<a target="_blank">`, the same as the Credits links, so on the iPad the app hands it to the system. The app sends nothing: it opens a page or the mail app.
- `REPORT_TO` in `src/report.ts` is the GitHub new-issue URL (title and body in the query). No owner address is in the public docs, so none is used. Put an address there (anything containing @) and the link becomes a `mailto:` with subject and body.
- The text carries: piece id and title, credit line (composer, source, typesetter, licence), source URL, file sha256, app version, catalogue build date, the piece's importer flags, the bar, and the prompt "What is wrong? (wrong note, wrong rhythm, wrong key, wrong hand, missing bars, other)".
- App version is the git short hash baked in by `vite.config.ts` (`__COMMIT__`), so the iPad build has one too; the deployed `version.txt` is the same commit. There is no separate importer version: the catalogue build date and the flags stand in for it.
- Bar: the start card shows before play, so the bar is "not started" unless the transport was moved; the player can type it in. A link in the pause or results views would give a real bar (not done).

## Practice summary
- Settings > Data > Practice summary writes `piano-practice-summary.txt` through the same `shareFile` as Export (share sheet on the iPad, download elsewhere). Plain text with `#` and `-` markers, no emoji, no points.
- `buildSummary(data, titles, now)` in `src/report.ts` is pure; `data` is the parsed `exportAll()` object, `titles` maps song ids to names. Tests: `src/report.test.ts` (fixture to expected text).
- Contents: period, days practised (a minute or more) and minutes, last 28 days, streak; accuracy and trend per area (reading, Sight Run, scales, theory, songs, technique: last five against the five before, as on Progress); reading stages solid and the weakest notes; scale stages solid; technique exercises solid; Ready songs; touch averages over the last 20 keyboard sessions (velocity, spread, hands, soft/medium/hard share).

## Not verified
iPad share sheet, `mailto:` and the GitHub link in the WKWebView. Checked in headless Chrome at 1180x820 and 820x1180: link href, popup, the generated text.
