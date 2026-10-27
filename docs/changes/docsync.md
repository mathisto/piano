# Docs sync (branch feature/docsync)

Many parallel rounds edited the app and appended notes. This branch checks the lead documents (ROADMAP.md, DESIGN.md, PRODUCT.md) and `docs/README.md` against the code, the live catalogue and each other. Docs only, plus one guard test (`src/docs.test.ts`).

## Audit 2026-10-27

Method: read every Next, Known gaps and Decisions item against `docs/changes/*` and grep of `src/` and `scripts/`; read `catalog.json` from the live site; ran `npx vitest run`; counted e2e features from `scripts/e2e/run.mjs` (not run); checked every backticked class, id, custom property and file name in DESIGN.md and every file reference and relative link in the lead docs. Nothing was seen on a device.

### Counts, now stated in ROADMAP
- Live catalogue 2,241 pieces: 748 Mutopia, 1,299 OpenScore Lieder, 194 Chopin; grades 1: 60, 2: 293, 3: 673, 4: 645, 5: 570. The old "about 1,060 Lieder" and the 71/279/554/515/398 grades were from the 1,817-piece run.
- Tests: 54 files, 723 passed, 1 skipped. E2E: 33 features in the default run (35 with `E2E_PULSE=1`), watchdog 10 minutes (14 with the pulse lane; ROADMAP said 8).
- 38 bundled scores, 8 starters, 46 covers: correct as written.

### ROADMAP.md changed
- Decisions pending was an append log of resolved work. Resolved items moved into Shipped: held Lieder (237 released), catalogue re-analysis, `Piece.tempo` and `Piece.pickup`, D.C./D.S. unfolding, the form pace, the service worker, the hardening pass, paced Sight Run, the sustain pedal, voice on strings, word hairpins. What stays in "Decisions pending for the owner" is only what needs a call.
- Next items marked done and removed: Sight Run on-screen pace (beat dots, polish5), the Memorise strip over the staff (uifix), words `cresc.`/`dim.` not read (voice.md), the app's part sounding on the piano sample (voice.md), the BWV 827 repeat patch (1080-3, -5, -6 no longer carry `repeats` in the live catalogue), "practice-log export for a teacher" (Settings > Data > Practice summary), "pedal timing from CC64" (pedal.md), the 278 held Lieder (now 38).
- Known gaps removed as fixed: Theory level selects truncating, the banner over a short strip, Songs tab stops with no skip link, the highway under reduced motion "not measured", "bundled manifest has no pickup".
- Added: pedal follow-ups, paced follow-ups, layout calls that are the owner's, the Chopin offline-rebuild limit, perf hills.
- Decision dates written 2026-10-28 were committed on 2026-10-27; changed to 2026-10-27 here, in `docs/hosting.md` (Caddy edit) and in `docs/changes/touch.md`.

### DESIGN.md changed
- Front matter: `plan-row` padding is 12px 20px (was 14px 4px); the `next-strip` token had no CSS and no prose, removed (also from the 12px radius list).
- Plan row prose padding; Start here "24px lead" (is 20px); Connect line copy ("play the on-screen keys", not "tap"); Over time change line ("up 4 points on the five before"); Reading drill top-bar button (Finish, then Back to Read once results are up); Effects under reduced motion (the old "canvas effects cap to Calm" is now the glow/ring behaviour already stated further down); reading-drill row is 0 while the on-screen keys show; the stale "Theory Level selects truncate" quirk removed.
- All colours in the front matter match `:root` (guarded by the new test). Every class, id, custom property and file named in backticks exists.

### PRODUCT.md changed
Library composition (748 / 1,299 / 194), paced Sight Run, pedal wording ("hold and pedal grading" overclaimed: it is hold grading and a coaching line on pedal changes), and an Offline line. Tabs, starter and bundled counts, local-only storage and the principles were accurate.

### docs/README.md
22 of the 52 notes were missing (dc, fingers, formtempo, harden, kern, lieder-year, offline, op74, paced, partial, pedal, perf, pickup2, polish4 to 7, rebuild, tempo, tempo2, uifix, voice); all 52 notes are now indexed, grouped by area, plus this one. `src/docs.test.ts` fails when a note is added without an entry.

### Guard added
`src/docs.test.ts` (3 tests): README indexes every note and lists none that is missing; DESIGN.md front-matter colours exist in the stylesheet or `palette.ts`; relative markdown links between docs resolve.

### Remains inconsistent or needs an owner decision
- `docs/changes/uifix.md` says the Technique aim-for dynamic "sits under the lone staff"; `staff.ts` and DESIGN.md place it above (the code is the reference). Left as a dated record.
- Other notes quote counts of their day (1,810, 1,817, 1,988 pieces; 683 and 691 tests). They are dated records and were not rewritten.
- Whether the form pace is live is read from the catalogue (234 `tempo-estimated`, 62 `no-tempo`), not from a deploy log; `formtempo.md` still says "Publish steps (not run)".
- `docs/hosting.md` lists the Cloudflare cache rules but nothing records them as applied.
- `docs/research/midi-import-audit.md` names scratch files that do not exist in the repo (`src/import-report.ts`, `gen.mjs`, `results/*.json`, ...). It is a research record; left.
- The portrait drill-staff-too-large bug (readcur.md) has not been rechecked on purpose; ROADMAP says so.
