# Handoff: Piano Forte, 2 Nov 2026

You are picking up Piano Forte, a piano-learning app for adults on real MIDI keyboards (web + iPad). This file is the complete state at handoff: what exists, how to work here, what the owner has decided, and what to do next, in order. Read it top to bottom once before touching anything.

- Repo: `/Users/mathisto/projects/piano-roller` (GitHub `mathisto/piano`, branch `main`).
- Live web app: https://pianoforte.mattkelly.io (served from the owner's server "quartz").
- iPad app: Capacitor 8 shell, bundle `io.mattkelly.piano`, Apple team `TC8XUVBATG` (paid Individual account since 31 Oct 2026), shipped as a TestFlight beta.
- Current state: the owner superseded the proposed trained grading model. G1 is now a deterministic, score-only difficulty algorithm: explicit score facts and math, no learned model, with published grades used only for evaluation. Its mechanism, constants and results live only in the nested local `private-research` repository pending the patent/publication decision; do not copy them into this public repository. No catalogue grade or grader code has shipped. The last runtime deployment is verified at `5d5347c1`, whose iPad upload succeeded as TestFlight build 551; later commits may be documentation-only.

## 1. Read these first, in this order

1. `PRODUCT.md`: who it is for, the principles (calm, adult, no account, no ads, on-device).
2. `ROADMAP.md`: the public tracking system. Its fitted-model G1 text is historical; the current private G1 tracker is the specification below.
3. `DESIGN.md`: the design system ("Urtext": Nocturne dark and Matinée light, paper staff, brass lamp = "play now" only, Newsreader type, Bravura notation), copy rules, every screen's spec. Large; read the parts you touch.
4. The three plans written this session (each ends with numbered owner decisions, all now answered):
   - `docs/research/practice-path.md`: graded results, marks on the score, one "what next" (`nextUp()`), five phases. Decisions 1 to 10.
   - `docs/research/library-and-profile.md`: no Apple Intelligence (the owner's iPad Air 4 / A14 cannot run it), the long-term player profile, one difficulty scale, the Songs page, a thumbnail for every piece. Decisions 11 to 22. Its section 7 is the combined phase plan.
   - `docs/research/horizon.md`: traps and loves of 14 rival apps, Studies and Packs, Apple platform guidance now, iPhone / Mac / Watch. Decisions 23 to 36. Its section 6 is the combined phase list.
5. `docs/README.md`: the index of every doc; `docs/changes/*.md` is one note per shipped branch (what was built, judgement calls, what is left).
6. `private-research/difficulty-grader-spec.md`, then its `changes/position-law.md` and `changes/route-oracles.md`: the private deterministic-grader contract and exact current starting point. This is a separate local Git repository and has no remote by design.

## 2. The owner and how they want you to work

- The owner dictates by voice (speech-to-text). Expect transcription slips ("sauna agents" = Sonnet agents, "court's/claw" = quartz, "Hannon" = Hanon, "Apple Glass" = Liquid Glass). Read through them to the plain meaning; ask only when a misreading would be costly.
- For a long dictated message, open your reply with a short parse: decisions (act on them), bugs, ideas/questions (discuss), superseded bits. Then act on the clear decisions.
- Pushback and better ideas are wanted, briefly, with the reason. They decide.
- Report reality only: say what you verified and how; "should work" is not done. Tests failing? Say so with the output.
- Engineering style ("ponytail"): fewest lines that work, build on what exists, stdlib and platform features first, delete over add, root-cause fixes, no speculative abstractions, no compat shims. Every non-trivial change leaves one runnable check (a unit test or an e2e feature).
- Design work is done to a high bar: look at the rendered result in both themes (Nocturne, Matinée) at iPad landscape 1180×820, portrait 820×1180 and phone 390×844 before calling UI done. (If your harness has the "impeccable" design skill, the owner wants it used for UI: critique, then polish.)
- Holes get filled or filed: anything broken you notice is either fixed or written into `ROADMAP.md` with enough detail to pick up.
- Git: branch, merge to `main`, deploy, push is pre-approved for this project. Commit messages plain, NO attribution or co-author footers. NEVER commit secrets, credentials or `.env` files.
- Do not change the owner's server configuration (Caddy, cloudflared on quartz) without asking. Restarting cloudflared drops every *.mattkelly.io site.
- Use they/them for the owner and anyone else unless told otherwise. A screenshot the owner once shared contained their phone number and home address: never repeat or store such details.
- Pricing (for later, not now): at launch, a one-time purchase (about $100), never a subscription, fully offline; sharing packs stays free. Until launch it is a TestFlight beta plus the free website. `PRODUCT.md` principle 6 ("Free") and the Credits / Set up wording change at launch, not before.

## 3. How to work in this repo

### Build, test, verify
- Stack: Vite + TypeScript + vitest; PixiJS falling-notes "highway" (`src/highway.ts`), SVG staff (`src/staff.ts`, `src/layout.ts`), app shell in `src/app/*.ts`, shared state in `src/app/state.ts` (with a `hooks` object for calls up the import graph).
- Unit tests: `npx vitest run` (1,034 passing, 4 skipped). Typecheck: `npx tsc --noEmit -p .`.
- End-to-end: `npm run e2e` (47 features, about 7 minutes, headless Chrome via `playwright-core`). Filter with `E2E_ONLY='^(2b|25) '`. Do NOT edit files while it runs (its dev server reloads). Under heavy machine load a feature can time out; rerun that feature alone before calling it a failure.
- `playwright-core` and `axe-core` are installed with `--no-save`, so ANY `npm i <pkg>` removes them. After installing anything, run `npm i --no-save playwright-core axe-core`.
- Boot JS budget: `src/bundle.test.ts`, `BUDGET = 223_000` bytes. NEVER raise it. Boot is 221,923 bytes: Memorise, the player profile and repeated-take analysis load on first use. New UI goes in lazy chunks and on the test's `lazy` list.
- `src/docs.test.ts`: every `docs/changes/*.md` must be listed in `docs/README.md`, and DESIGN.md front-matter colours must exist in the CSS.
- Dev server: `npx vite --port <free port>`; in dev, `window.__piano` exposes `game`, `open`, `drill`, `setView`, `key(p, v, ts)`, `up(p, ts)` and more for driving the app.

### Deploy the web app
- `./scripts/deploy.sh` from a clean, committed tree. It runs the tests, builds, writes `version.txt` and ships to quartz. Never pipe it through `tail` (that hid a failed gate once); check its exit code and its `deployed <sha>` line.
- Then `git push origin main` and verify all three match: `git rev-parse --short=8 HEAD`, `gh api repos/mathisto/piano/commits/main --jq .sha`, `curl -s https://pianoforte.mattkelly.io/version.txt`.

### iPad / TestFlight
- TestFlight upload: `npm run ios:beta` (cap sync, archive, upload). The build number is the git commit count, so one upload per commit. Look for `Upload succeeded`.
- Direct install on the owner's iPad (iPad Air 4 "Hackronomicon", iPadOS 26.5, must be plugged in and unlocked): `npm run ios:sync`, then in `ios/App`: `xcodebuild -project App.xcodeproj -scheme App -configuration Debug -destination id=00008101-0015648C119B001E -derivedDataPath ../DerivedData -allowProvisioningUpdates -quiet build`, then `xcrun devicectl device install app --device 519A9391-203D-5F96-B744-D292011F15B1 ios/DerivedData/Build/Products/Debug-iphoneos/App.app`. To see JS console logs: `xcrun devicectl device process launch --device 519A9391-203D-5F96-B744-D292011F15B1 --terminate-existing --console io.mattkelly.piano`.
- `npm run ios:sync` can rewrite `ios/App/CapApp-SPM/Package.swift`; the local-notifications plugin path must stay `../../../node_modules/@capacitor/local-notifications`. Commit any sync change it makes.
- Native code: `ios/App/App/*.swift` (AppDelegate menu, PianoNative plugin for CoreMIDI, open-in files, text size). JS side: `src/native-app.ts` (lazy), `src/native-midi.ts`, `src/native-reminder.ts`.

### The music library (catalogue)
- Pipeline: `scripts/library/*` (build, reanalyse, combine, delta, catalog-diff, retitle, kind rules). Build cache and outputs live in `.cache/library/` (not in git). The live catalogue is `.cache/library/out-src1`, build `9b71a88520e8c3a1` (2,347 pieces).
- Publish a catalogue: `LIBRARY_OUT=.cache/library/<dir> scripts/deploy-library.sh` (adds score files, then swaps `catalog.json` atomically). Check `catalog-diff` first.
- Licence policy: public domain, CC0, CC BY and CC BY-SA with visible credit; NC only with an explicit flag; never copyrighted arrangements. Details: `docs/research/public-domain-sources.md`.

### Parallel agent work (if your harness supports sub-agents)
- One git worktree per branch: `git worktree add ../piano-wt-<name> -b feature/<name>`, then `ln -s /Users/mathisto/projects/piano-roller/node_modules ../piano-wt-<name>/node_modules`. Agents never run `npm i`. Merge into `main` one at a time, run unit tests + full e2e on `main` after each merge, then deploy.
- Frequent merge-conflict spots: `src/bundle.test.ts` (the lazy list: keep both sides' entries), `src/app/state.ts` (the `hooks` type: keep both), `src/settings.ts` migrations, `src/ui-drawer.ts`, `DESIGN.md`, `docs/README.md`, `ROADMAP.md`.

## 4. What this session shipped (all live, TestFlight build 547)

In order. Each line points to its change note in `docs/changes/`.

1. Read drills: the line now jumps straight to the next card instead of walking at tempo, so a quick right note is never judged wrong; reading time counts from when the card is up (`src/game.ts` frame()).
2. Practice path phase 1 (`practice-path-1.md`): accuracy counts wrong keys (they used to cost nothing); wrong keys drawn on the staff after a run at the pitch played; early/late shown by a pointing triangle under each note (◂ early, ▸ late; decision 10 as amended); the results card moved off the staff with a headline ("Not clean yet: 6 slips in bars 2, 6 and 7"), "53 of 56 notes right", separate Notes / Time / Holds / Touch lines marked "counts" or "not counted yet"; Review mode and Mark list; the attempt log (history rows with ids, per-card rows by month `log:cards:<YYYY-MM>`, `got`, `sp`; in export, merge and Clear all data). Then an Opus polish pass (critique 23/40 → the five priority issues fixed).
3. Catalogue C1 + library S1 (`library-c1-s1.md`): `mode` (major/minor) on 723 pieces, `kind` (piece / study / accompaniment / fragment), `form`, `period`; an incipit sidecar so every library row engraves its opening bars (about 370 KB compressed, lazy); Songs facets (lanes Pieces / Songs with voice / Studies, level, length, key, period; form and composer under More; a zero state that names its filter). Catalogue `2d91850b0dd7c479` published.
4. Practice path phase 2 (`practice-path-2.md`): `src/next.ts` `nextUp()` cascade; Continue as the primary on every results card (loops the worst bars after a run that wasn't clean, at most three times a day per piece; moves on after a clean run); Today always has one lamp, including after the plan is done; the first-week Start here step; `by` and `then` on history rows.
5. iPad native (`native-1.md`): the menu bar per Apple's guidelines (tabs in View, ⌘1 to ⌘7; "In-App Settings…" ⌥⌘,), the opt-in practice reminder (local notifications), Dynamic Type in the iPad app (a root `--ts` scale; not claimed as full Larger Text support), the `.pfpack` document type.
6. Studies and Packs (`studies-packs.md`): the `.pfpack` format (`src/pack.ts`, small JSON naming catalogue ids, generated exercises, Read stages; never carries music); seven first-party packs in `src/packs/` (Hanon warm-up 1 to 20 two a day, Burgmüller Op. 100, Czerny Op. 821 and 840, Clementi Op. 42; Schumann Op. 68 and Anna Magdalena on Songs); Studies at the top of Technique (decision 23: A); import by file (and the iPad's open-in) and by link (`#pack=` compressed in the URL fragment); share as file or link; a Finger numbers switch; per-item aids off.
7. Silent pulse (`beatpulse.md`): Settings > Display > Pulse: Off · Beat lines · Ball (the owner's choice: both looks kept; Edges dropped). The Ball stands in for Beat lines when only the staff shows. Metronome gains Silent. The highway's beat lines now sit on the real beats.
8. Practice path phase 3 (`practice-path-3.md`): Timing (strictness) and Touch feedback default to Auto by Path level (1 Easy / no holds / Gentle; 2–3 Standard / lenient / Gentle; 4 Standard / lenient / Standard; 5 Strict); evenness counts from level 2 on scales and technique, never on pieces; a Start in every page head from `nextUp(snapshot, strand)`, one lamp per page; Theory levels stored.
9. Test reliability: `scripts/e2e/run.mjs` `perform()` now presses each key at its song time on the game's live clock and passes that time as the key's timestamp, like a MIDI packet (fixed the "2b Sight Run paced" full-run flake).
10. Docs brought current: the Apple notes (`ios-native.md`, `ios-ux.md`, `platforms.md`) now reflect the paid account, iPadOS 26.5 on the owner's iPad, and the shipped light mode and menu bar.
11. Library source expansion (`library-sources-2.md`): the owner approved PDMX with credit and the public-domain Czerny LilyPond files. The live catalogue grew 2,241 → 2,347 without changing an old score file; Czerny Op. 599 and Op. 299 packs joined the app.
12. Boot headroom (`perf5.md`): Memorise and its memory engine load on first use. Boot fell 222,113 → 220,403 bytes; `BUDGET` stayed 223,000.
13. Per-strand Auto standard (`per-strand-standard.md`): Auto uses the lower of the Read frontier and the Songs repertoire ceiling (three Ready pieces at one level). Theory, Scales and Technique no longer hold the standard down; phase 5 still replaces this interim rule with Elo per strand.
14. Practice path phase 4 (`practice-path-4.md`): low-session drop-back, plateau task changes, the furthest-behind learning strand, Progress's shrunk reading error map and Stuck panel, and repeated bar timing across the three takes the app keeps. The impossible “4 of 5” plan sample was corrected to truthful `2 of 3` / `all 3` wording.
15. G1 anchor review (`regrade-g1-anchors.md`): 80 complete live-catalogue pieces matched to published Henle 1–9 levels; seven current ABRSM placements; exact identity validation; the two Anna Magdalena BWV numbers checked; grouped holdout required to prevent collection leakage. This changes no grade and waits for owner approval.
16. G1 anchor expansion (`regrade-g1-anchor-expansion.md`): after owner approval, 20 exact matches from eleven additional works or collections brought the table to 100. Grouped holdout fell to Spearman 0.789 and 74.0% within one Henle level, below the unchanged 0.9 / 85% release gate. No fitted grade or experimental feature code shipped.
17. G1 corpus feasibility (`regrade-g1-corpus.md`): 53 further exact matches from ten official Henle sources brought the research table to 153 pieces across 32 independent groups. Grouped holdout still failed: additive 0.785 / 66.7% within one, forest 0.774 / 67.3%, neighbours 0.762 / 57.5%. No grade or model code shipped.
18. G1 existing systems (`regrade-g1-existing-systems.md`): replaced commissioned grading with existing ABRSM, RCM, Trinity, Henle and Piano Syllabus ranks. A conservative research join found 497 catalogue scores, 338 labels and 188 work groups; eight aggregate features reached Spearman 0.707, 26 technical features 0.706, and fold-only composer/form priors 0.780, all below the 0.9 gate. Corrected the CIPI evidence: its whole-piece pitch/fingering/expression ensemble reached 87.3% within one level. The next algorithm preserves each grading system's thresholds in a whole-score ordinal sequence ensemble; its existing labels need commercial permission or independent official citations before production use.
19. G1 prior art (`regrade-g1-prior-art.md`): automatic score grading, local passage difficulty, fingering cost, whole-piece performance dimensions, multi-system heads and explainable white-box models all have prior art. Deterministic inference is not a novelty claim. Public commit `51b96db` already disclosed the broad shared-ordering / system-threshold direction on 2 Nov 2026. Keep any further mechanism and results private; patentability and freedom-to-operate review precede another enabling public disclosure.
20. G1 deterministic pivot (private): the owner rejected training and label-permission dependencies. The local private specification is at v0.8; its dependency-free law generator has exact fixed-point, representation, rejection, span, aggregation, hand-position and first route-order oracles. A fresh suite contains 2,046 valid MusicXML fixtures. No app or catalogue output changed.
21. Reading results (`read-results.md`): result copy now says notes rather than internal cards, separates first-try accuracy from timing, compares like-for-like prior attempts, marks a strict personal best, and keeps diagnostic detail collapsed.
22. Row shortcuts (`row-shortcuts.md`): a tap anywhere on a Today, Read, saved Sight Run, Scales, Technique or Theory row invokes its visible default action; inner controls retain their own behavior. Phone Read and Scales tables drop the typical-time column.

Research reports behind the plans (raw, for depth) were in a temporary session folder and may be gone; the plans in `docs/research/` contain their substance and sources.

## 5. Owner decisions (all 36 answered)

- 1 to 10 (practice path): all as recommended in `practice-path.md` section 6. Amendment: decision 10 became the pointing triangle under the note.
- 11 to 22 (library and profile): all as recommended in `library-and-profile.md` section 8. That includes: no Apple Intelligence for now; one difficulty scale 0 to 9 Henle-aligned shown as Level 1 to 5 (this also settles audit item CP-29); Lieder in their own lane; studies off the piece ladder; Songs page Option D (shelves "Fits you now", "A step up", "To sight-read" over the faceted list); composer as a facet; an optional "Easier / About right / Harder" rating after a first read.
- 23 to 36 (horizon), from the owner's replies:
  - 23: A, Studies at the top of Technique (decided after comparing renders).
  - 24: the word is "Pack" (not Course).
  - 25, 26, 28, 29, 31: as recommended (first-party packs first, then import by file and link and a `packs/` folder in the public repo by pull request, never accounts or uploads; Hanon as a warm-up pack; aids you can switch off; opt-in reminder; menu bar and keyboard controls). The owner also wants more attention to touch and swipe gestures.
  - 27: yes, source the missing study books; keep growing the open library with anything free and machine-readable.
  - 30, 32: as recommended (stay on iPadOS 26.5 until 27.2; Dynamic Type in the iPad app).
  - 33: the owner does not usually wear a watch while playing. Watch: skipped for now.
  - 34: yes, sync through each device writing its backup file into an iCloud Drive folder and merging the others' (Chrome on a Mac can pick the same folder; Google Drive or Dropbox folders work the same way).
  - 35: iPad, browsers and Mac are the targets; iPhone deferred (screen too small for full scores; if ever, a companion for theory, ear, drills, progress and packs). Mac: a web manifest now, the "Designed for iPad" app once sync exists.
  - 36: silent pulse built (see above); watch skipped. The FP-10 headphone click needs MIDI output, which the app lacks: `docs/changes/beatpulse.md` has a console snippet for a 10-minute test on the owner's Roland FP-10.

## 6. Waiting on the owner

1. Device checks on the iPad (the owner is the only tester; give them a short list with each TestFlight build):
   - results card and Review from the music stand; the ◂ ▸ triangles readable;
   - Continue's destination line; the first-week Today (about ten Start buttons on day 1: too busy?);
   - Songs: first visit loads the thumbnail sidecar (about 370 KB): slow?;
   - the View menu and shortcuts with a hardware keyboard; the reminder end to end; the largest text size; AirDrop a `.pfpack` to themself;
   - Pulse: Beat lines vs Ball from the stand;
   - Auto rows in Settings and the page-head Start lines;
   - phase 4: Progress's Where it goes wrong / Open map / Practise these and Stuck cards; a two-low-run step-back reason; repeated bar timing says `2 of your 3` or `all 3`;
   - the FP-10 MIDI-out click test (console snippet in `docs/changes/beatpulse.md`).

## 7. What to do next, in order

Do each as its own branch, with its tests, its `docs/changes/` note (listed in `docs/README.md`), DESIGN.md updates for any UI, then merge, full e2e, deploy, push, TestFlight, and a short owner check list.

1. **Done:** library sourcing, live corpus build `9b71a88520e8c3a1`, TestFlight 524.
2. **Done:** boot headroom through lazy Memorise, 220,403 bytes under the unchanged budget, TestFlight 526.
3. **Done:** Auto from the lower of the Songs repertoire ceiling and the Read frontier, ignoring Theory, Scales and Technique until phase 5; TestFlight 529.
4. **Done:** practice path phase 4: low-session drop-back, plateau task changes, the furthest-behind learning strand, reading error map, Stuck evidence, and timing patterns across the three kept takes; TestFlight 532.
5. **In progress, private deterministic G1:** continue from `private-research/difficulty-grader-spec.md` and its change notes. Build the lossless canonical MusicXML graph next, against the existing law suite, then deterministic hand allocation/fingering, the six cost families, serialization and the sealed grouped benchmark. Published human grades remain evaluation evidence only; there is no commercial-training or label-permission dependency. Retain the 0.9 / 85% evaluation gate and keep complete works/editions in one fold. Keep all mechanism, constants, results and ablations private until patentability/FTO and publication decisions. No grade or grader code has shipped; do not start G2/S2 until G1 passes. After G1 passes: G2 + S2 adds skill tags, `needs`, `fit()` and Songs Option D; then count the Level 1–2 windows before deciding whether G3 generated first-rung pieces are needed.
6. Horizon items (`horizon.md` section 6), roughly in this order:
   - T1 trap fixes: own-file import findable on first run; `REPORT_TO` for Report a problem; skip damaged records instead of forcing Clear all data.
   - K2 rest: the public `packs/` folder with CI validation and an index; packs made of generated exercises; universal links so a pack link opens the iPad app.
   - A web manifest (installable in Chrome on a Mac).
   - A5 sync through an iCloud Drive folder (decision 34): each device writes its backup file and merges the others' with the existing import/merge code; on the web, the File System Access API folder picker.
   - Touch and swipe gestures review (the owner asked for more attention to touch UI).
   - A6 App Intents / Shortcuts. X2: test "Designed for iPad" on the owner's Mac (Xcode lists "My Mac (Designed for iPad)") only after sync exists.
7. Player profile (`library-and-profile.md` section 3): R1 habit panel on Progress from `practice:days` now; R3 skills table after about 3 weeks of log; R4/R5 error map and retention after 6 to 12 weeks. Move the streak number off Progress (it stays on Today); add Clear profile beside Clear all data.
8. Older ROADMAP items still open: 10 (note names by tradition: Do Ré Mi, German H), 11 to 14 (Urtext staff, type, highway and identity leftovers, including the iOS 26 layered icon via Icon Composer), 15 (audit leftovers: several now resolved by phases 2 and 3 and decision 12; re-check and prune), 16 (later ideas).

## 8. Known open items and gotchas

- Boot JS margin 2,597 bytes (see section 3).
- The Path level is coarse (section 7, item 3).
- Results/marks quirks listed in DESIGN.md "Known quirks": wrong keys in the densest bars stay cramped at the fitted size; the disabled Perform | Learn segment reads pale under the card in Matinée; an unlabelled input in the tab order outside the results card; the Holds line shows although holds do not count yet.
- Dynamic Type at 200%: the Learn start card is cramped in landscape and spills over the on-screen keys in portrait; Theory's level line sits tight.
- Reminder: if the app is killed in the foreground after practising, the old schedule stands until the next background trip.
- The catalogue: other "Movement k" titles remain (Bach partitas, Dussek, Moonlight, Pictures, Chopin first-edition sonatas); composer rows are split (Burgmüller, Schumann, Czerny); MusicXML repeats and D.C./D.S. are not unfolded for 19 new pieces (`dc-ds`).
- The e2e "note: localStorage after Clear still has piano.guide" line is benign (Today writes the guide state again on first boot).
- Cloudflare injects an analytics beacon into the live site; its SSL error in headless Chrome is not the app's.
- The app has no MIDI output yet (inputs only, on web and iPad).
- `.impeccable/design.json` is stale against DESIGN.md (regenerate with the impeccable skill's `document` command if you have it).

## 9. Where things live (quick map)

- Judge and scoring: `src/judge.ts`, `src/game.ts` (`cfg()`, `finish()`), marks `src/marks.ts`, results UI `src/ui-results.ts`, `src/app/results.ts`, `src/app/review-ui.ts`.
- What next: `src/next.ts`, Today `src/app/today.ts` + `src/today-view.ts`, plan `src/plan.ts`, guide `src/guide.ts`, Path `src/grades.ts`.
- Storage and backup: `src/store.ts`, `src/backup.ts` (export `EXTRA` regex, merge rules, Clear all data prefixes: any new stored key must be added to all three).
- Reading drills: `src/drill.ts`, `src/app/drill.ts`, `src/run.ts`. Scales `src/scales.ts`. Technique `src/technique.ts`, `src/syllabus.ts`. Theory `src/theory.ts`, `src/app/theory-ui.ts`.
- Library: `src/catalog.ts`, `src/facets.ts`, `src/library-view.ts`, `src/app/library.ts`, covers `src/cover.ts`, `src/cover-draw.ts`, `src/incipit.ts`.
- Packs: `src/pack.ts`, `src/packs/*.pfpack`, `src/app/pack-ui.ts`.
- Pulse: `src/beatpulse.ts`. Metronome `src/metronome.ts`. Settings `src/settings.ts`, drawer markup `src/ui-drawer.ts` (lazy), drawer logic `src/app/drawer.ts`.
- e2e: `scripts/e2e/run.mjs` (features in order; `window.__e2e` helpers at the top).
