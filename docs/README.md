# docs/

The top-level files are `PRODUCT.md` (what the app is and for whom), `DESIGN.md` (the design system and every screen) and `ROADMAP.md` (shipped, next, known gaps, research). This folder holds the rest.

## Decisions and operations

- `STRATEGY.md`: the product model (progression, sessions, feedback diet, gamification rules, copy rules) and the evidence behind each decision.
- `library.md`: the curated library policy (allowed licences, what a piece must carry, rebuild and add-a-piece steps).
- `hosting.md`: serving the big library corpus on quartz (Caddy, Cloudflare cache rules, corpus publish steps and takedown).
- `sounds.md`: every sample set, its source and licence, and how the piano and instruments are built.

## Change notes (`changes/`)

One file per feature branch: what it built, how it was checked, what is open. They are dated records; the current state is in `ROADMAP.md`.

**Play and practice**
- `changes/practice-path-1.md`: the practice path, phase 1: a wrong key costs what a miss costs, marks that stay on the staff, the song results card over the falling notes only, and the attempt log.
- `changes/practice-path-2.md`: the practice path, phase 2: one "what next" (`next.ts`), Continue on every results card, Today's lamp always present (the first week's step, the plan, Up next once it is done), `by` on the attempt log.
- `changes/practice-path-3.md`: the practice path, phase 3: Timing and Touch feedback default to Auto, following the Path level; uneven touch counts from level 2 on scales and technique; a Start in every page head from `nextUp()` kept to the page's strand, one lamp a page; Theory's levels kept.
- `changes/practice-path-4.md`: the practice path, phase 4: drop back after two low sessions, change a stalled task, give the furthest-behind learning strand the free slot, show the reading error map and Stuck evidence, and name timing repeated across the three kept takes.
- `changes/per-strand-standard.md`: Auto Timing and Touch feedback use the lower of the Read frontier and the Songs repertoire ceiling; Theory, Scales and Technique no longer hold the standard down.
- `changes/habit.md`: 30 and 45 minute plans, break reminder, day streak, the Path.
- `changes/guide.md`: the Start here card, tab notes, the Help sheet and the Connect line.
- `changes/ladder.md`: the repertoire ladder on the Path.
- `changes/readthrough.md`: Read through (look-through, no-stop pass, piece picker, summary).
- `changes/memory.md`: Memorise, Learn with the score fading by bars.
- `changes/metro.md`: the practice metronome and the visible tempo ladder.
- `changes/accomp.md`: accompaniment practice: you play one part, the app plays the rest.
- `changes/voice.md`: a voice part sounds on strings; `cresc.` and `dim.` words become hairpins.
- `changes/recorder.md`: takes, Listen back, Compare with last time and the Ghost.
- `changes/paced.md`: paced Sight Run (a steady beat, cards scored on the beat, the offered tempo).
- `changes/report.md`: Report a problem on library pieces and the practice summary.
- `changes/truth.md`: the truthfulness pass: melody-hand voicing, unchecked fingerings said so, the score multiplier removed, and the Ready rule.

**Read, Scales, Theory, Technique**
- `changes/readcur.md`: the 37 Read stages, the Fluent tier and keyed Sight Run.
- `changes/read-results.md`: plain reading-result counts, accuracy comparison and personal best, the quieter detail disclosures, and removal of the internal “card” term from results.
- `changes/row-shortcuts.md`: whole-row default actions across the main indexes, protected inner controls and readable phone-width stage tables.
- `changes/scales2.md`: contrary motion, chromatic and arpeggio scales, and the fingering table to verify.
- `changes/fingers.md`: the paper cross-check of arpeggio, contrary and chromatic fingerings, with the Alfred checklist.
- `changes/ear.md`: the ear and rhythm trainers in Theory.
- `changes/pulse.md`: the pulse trainers: keep the beat, subdivisions, hold a rhythm against the beat.
- `changes/chordear.md`: the chord ear and question-and-answer trainers.
- `changes/osk.md`: on-screen keys for Theory, the Quiz, Sight Run and reading drills.

**Touch, marks, pedal**
- `changes/touch.md`: timing evenness, legato and staccato, voicing, fading marks, key-touch setting.
- `changes/realtouch.md`: touch coaching on real pieces: written dynamics and articulation followed or not.
- `changes/marks.md`: staccato, tenuto, accents, slurs, hairpins and dynamic letters drawn on the staff.
- `changes/lead.md`: the Lead sheet level of Notes shown: melody and chord symbols read from the harmony, the app playing the chords.
- `changes/lead2.md`: Lead sheet round two: Notes shown on a short stage, the chord switch kept, runs at a reduced level not counting toward Ready, e2e feature 21.
- `changes/chordeval.md`: the Lead sheet chords against written harmony: the corpus has one chord symbol in one piece, so no evaluation was possible; the count and where ground truth could come from.
- `changes/chordeval2.md`: the Lead sheet chords against 256 analysed pieces (When in Rome): scores, baselines, and a retuned chord match checked on held-out pieces.
- `changes/pedal.md`: the sustain pedal from CC64: the sampler, the results line, the Technique exercise.

**Importer and library pipeline**
- `changes/importer.md`: importer fixes for mass ingestion (key changes, spelling, D.C./D.S., tuplets, tempo).
- `changes/catalog.md`: the catalogue-driven Songs page, search, offline saving, piece loader, credits.
- `changes/studies-packs.md`: packs, a small JSON file that names pieces, exercises and stages in an order with notes and never carries music; Studies at the top of Technique and a Packs button on Songs, nine packs that come with the app (Hanon warm-up, Burgmüller, four Czerny books, Clementi, Schumann, Anna Magdalena), import by file, by the iPad's open-in and by a link that carries the pack in its fragment, sharing, and the Finger numbers switch.
- `changes/fingering-roadmap.md`: the locked product contract for offline-generated library fingering, immutable source notation, named route alternatives, display density, per-piece memory, player fit, licensing and the unchanged boot budget.
- `changes/library-c1-s1.md`: the catalogue fix (`mode`, a stated metre, `kind`, `form`, `period`, the raw grade features) and the incipit sidecar; covers for every library row from the sidecar, and the Songs facet engine with its kind lanes and zero state.
- `changes/library-sources-2.md`: the missing study books: sources checked one by one, 106 pieces added (Lemoine Op. 37, Duvernoy Op. 176, Czerny Op. 599, 299, 740 and more) from PDMX and a LilyPond repository, Clementi Op. 42's lesson titles, Czerny Op. 840 as studies, and new Op. 599 and 299 packs.
- `changes/regrade-g1-anchors.md`: the G1 owner-review gate: 80 live catalogue pieces matched to published Henle 1–9 levels, seven current ABRSM placements, exact identity validation and collection-grouped holdout required before the model.
- `changes/regrade-g1-anchor-expansion.md`: 20 approved exact-work additions broaden the G1 table to 100 anchors; grouped holdout exposed the planned fit as below its unchanged release gate, so no grade changed.
- `changes/regrade-g1-corpus.md`: the 153-piece, 32-group corpus test and model feasibility result; no tested model meets the fixed gate, so no grade changed and G2/S2 remains blocked.
- `changes/regrade-g1-existing-systems.md`: existing board and consensus grades replace commissioned grading; 497 matched scores disprove aggregate formulas and establish the whole-score multi-system sequence model as the next G1 experiment.
- `changes/regrade-g1-prior-art.md`: academic and patent prior art narrows G1 to a cross-system experiment and puts patent/FTO review before any further enabling public disclosure.
- `changes/grader-handoff-sync.md`: the private deterministic G1 pivot replaces the trained-model/label-rights next step in the handoff without disclosing its mechanism publicly.
- `changes/roadmap-2nov.md`: reconciles shipped work, current priorities and private G1 phase status across ROADMAP and the handoff without publishing the grader mechanism.
- `changes/recognition-provenance-status.md`: records completion of private G1 recognition provenance and its conflict gate without publishing the mechanism.
- `changes/grader-phase3-complete.md`: records completion of private G1's canonical, played and acquisition graph phases without publishing the mechanism.
- `changes/fingering-oracle-status.md`: records the private phase-4 route-oracle milestone without publishing the fingering mechanism.
- `changes/fingering-enumerator-status.md`: records the private production event/state milestone without publishing the fingering mechanism.
- `changes/fingering-evidence-status.md`: records the private named-transition-evidence milestone without publishing the fingering mechanism.
- `changes/fingering-dp-status.md`: records completion of private exact single-hand best/second search without publishing its mechanism.
- `changes/paired-oracle-status.md`: records the frozen private paired-hand allocation/collision oracle milestone without publishing its mechanism.
- `changes/paired-search-status.md`: records completion of the private certified paired-hand production search without publishing its mechanism.
- `changes/source-fingering-status.md`: records completion of private immutable source-fingering evidence without publishing its mechanism.
- `changes/canonical-route-status.md`: records completion of the private canonical fingering route artifact without publishing its mechanism.
- `changes/motor-status.md`: records completion of the private Motor component without publishing its mechanism.
- `changes/rhythm-status.md`: records completion of the private Rhythm component without publishing its mechanism.
- `changes/coordination-status.md`: records completion of the private Coordination component without publishing its mechanism.
- `changes/reading-status.md`: records completion of the private Reading component without publishing its mechanism.
- `changes/expression-status.md`: records completion of the private Expression component without publishing its mechanism.
- `changes/endurance-status.md`: records completion of the private Endurance component and phase 5 without publishing its mechanism.
- `changes/pipeline.md`: the library batch pipeline, grade fit, the 500-piece run and its open items.
- `changes/repeats.md`: LilyPond repeats unfolded at ingestion and the patch of the published catalogue.
- `changes/dc.md`: D.C., D.S., Fine, segno and mid-bar repeats unfolded at ingestion.
- `changes/lieder.md`: OpenScore Lieder in the pipeline, the fold gate and the 36 held-back songs.
- `changes/lieder-year.md`: first-publication years from IMSLP that released 237 held Lieder.
- `changes/libgrow.md`: the 1930 publication rule with an evidence allow-list, no ceiling on the library, movement `.ly` matching, and the grown 1,817-piece run.
- `changes/kern.md`: Humdrum **kern converter for the Chopin Institute's first editions.
- `changes/op74.md`: Chopin's Op. 74 songs as voice and piano.
- `changes/tempo.md`: tempo in imported scores (fixed and open).
- `changes/tempo2.md`: `Piece.tempo` from the .ly and the first pickup detector pass.
- `changes/pickup2.md`: the second pickup detector (not merged: no clear gain).
- `changes/partial.md`: `Piece.pickup` from the .ly `\partial`.
- `changes/lyreader.md`: the .ly reader covers 648 of 748 Mutopia pieces (was 444): zip includes, tags, `\parallelMusic`, unfold in place; `reanalyse.mjs --ly-only`, 34 more pieces' repeats played out.
- `changes/grace.md`: the two measured-and-left-out loosenings decided: a 1/64 onset tolerance from a reading's first grace on (the shift runs to the end of the voice, not beside the grace), 2 of 7 end-of-piece bar counts; 659 pickups (was 648), 276-3 played out.
- `changes/formtempo.md`: a pace from the form for scores that name none.
- `changes/rebuild.md`: re-analysing the published catalogue without changing an id, file or hash.

**Shell, speed, tests, polish**
- `changes/split.md`: `main.ts` split into the `src/app/` modules, and the rules to keep.
- `changes/e2e.md`: the end-to-end suite and the bugs it found.
- `changes/enginefix.md`: engine audit fixes: the count-in on the bar's beat grid, calibration, the app's notes on the audio clock, late hits, the paced window, the pedal coach from the bass, MIDI input, takes, disconnect.
- `changes/harden.md`: the hardening pass: failure paths, big imports, narrow layouts.
- `changes/perf.md`: load time: the play screen and three features load on first use.
- `changes/offline.md`: the service worker that makes the hosted app work offline.
- `changes/polish.md`: the critique of the whole app, the Set up sheet, fixes and what was left.
- `changes/polish2.md`: the five polish findings closed (rests, focus, Progress cells, stale loop offer, Set up decision).
- `changes/polish3.md`: the critique of the newer surfaces: the play banner, start card width, song row actions, and what stayed open.
- `changes/polish4.md`: Start here, the ladder, pulse and chord ear, on-screen keys and the results card; the one-hand piece that never counted.
- `changes/uifix.md`: two keyboards in reading drills, the Memorise strip row, on-screen keys at 44 px, and smaller defects.
- `changes/polish5.md`: paced beat dots, the Songs Skip link, a calm highway under reduced motion, bundled pickups.
- `changes/polish6.md`: the critique of everything since polish4 (29 of 40) and the narrow-width fixes.
- `changes/polish7.md`: six polish6 findings closed (Replay, Today rows, Over time axis, Credits links, copy, staff letters).
- `device-checks.md`: ten minutes on the iPad and the FP-10, line by line, for everything checked only in headless Chrome.
- `changes/prune.md`: dead code and duplicate helpers removed (`src/util.ts`), one dependency dropped.
- `changes/perf3.md`: 33 kB off the boot JS (`ui.ts` split into lazy views, results and sheets); the pedal coach uses the tuned chord match (`src/chords.ts`).
- `changes/sheets.md`: e2e feature 22 (Credits, Set up and Options from Settings; slow and refused page and sheet chunks); a sheet whose code does not arrive says so instead of rejecting unhandled.
- `changes/beatmark.md`: the paced run beat shows in a slim bar between the header and the staff, not in the dock.
- `changes/beatpulse.md`: a silent visual pulse (Settings > Pulse: Staff, Edges or Beat lines, on trial) and a Silent metronome; the research behind it, captures and frame times; the FP-10 headphone click stops at a note (no MIDI out yet).
- `changes/docsync.md`: the 2026-10-27 audit of ROADMAP, DESIGN, PRODUCT and this index.
- `changes/datafix.md`: import merges per record and backs up first, exports carry imported songs, read-modify-write saves queue (and lock across tabs), stale heat, the service worker on a 502 and across a deploy, no empty last bar, MusicXML UTF-16, character references, mid-measure divisions and ties, simplify keeps short notes, CSP.
- `changes/perf4.md`: 19 kB off the boot JS: the ear and pulse decks and the trainers load with the Theory page or when a card is due (`src/theory-cards.ts` keeps the Path's decks); the Help text loads with the sheets.
- `changes/perf5.md`: Memorise and its memory engine load on first use; boot JS fell 1,710 bytes while the 223,000-byte budget stayed fixed.
- `changes/shellfix.md`: Escape pauses before it leaves, a stale piece open stays off the screen, leaving returns to where the piece was opened, redraws keep focus, the start card and banner share one column; the iPad app gets Bluetooth pairing, a privacy manifest, the screen awake only during a run, one root view controller, iPad only and a build number from git.
- `changes/ipad-native.md`: the iPad shell pass: the screen stays on for two minutes after the last key, a run holds the screen edges and fades the home indicator, a call, Siri or headphones coming out pause a run, Listen back stops in the background, no link previews or drags, a flat launch screen; what was decided against.
- `changes/native-1.md`: the iPad menu bar as the HIG asks (tabs in View on ⌘1 to ⌘7, the app's settings beneath the system's), the opt-in practice reminder, Dynamic Type through one root scale, and `.pfpack` files opening in the app; the event shape for packs and a Check on the iPad list.
- `changes/sightroll.md`: reading drills and Sight Run show two lines at least and turn a line at a time (the second eases up on the top line's last note), Sight Run deals three lines a set, the cursor stands on the note in every mode; the look-ahead and scrolling research behind it.

## Research (`research/`)

Dated reports behind the decisions; read the ratings before relying on a claim.

- `research/urtext.md`: the Urtext design direction (1 Nov 2026): what was taken from the brief, what was corrected, the Matinée tokens and the rollout order.
- `research/practice-path.md`: graded results, wrong-key and early or late marks kept on the score, Continue, and one "what next" behind Today, each section and the results card (1 Nov 2026): the design, the evidence, a phased plan and the owner's decisions.
- `research/library-and-profile.md`: Apple Intelligence (not on the iPad Air 4), a long-term player profile from raw logs, one difficulty scale with skill tags and a fit function for the next piece, four Songs page layouts, and a cover for every piece from a sidecar of opening bars (1 Nov 2026): the plan, how it slots into practice-path's phases, and decisions 11 to 22.
- `research/grade-anchors.md`: the approved 100-piece G1 Henle/ABRSM anchor table and the grouped-holdout failure that blocks the fitted re-grade.
- `research/difficulty-model.md`: the G1 feasibility results across Henle and multi-system labels, the corrected CIPI benchmark and licence boundary, and the whole-score ordinal ensemble design.
- `research/difficulty-prior-art.md`: what automatic score grading work and patents already cover, the public benchmark protocol, the existing disclosure date and the patent-before-further-publication gate.
- `research/horizon.md`: the traps and loves of piano apps checked against Piano Forte, a Studies section and a free course format (JSON naming catalogue pieces, generated drills and stages; import by file or link; a repo index), current Apple guidance (Liquid Glass, the menu bar, reminders, Dynamic Type, the icon), and what iPhone, Mac and Apple Watch versions would take (1 Nov 2026): one combined phase list and decisions 23 to 36.
- `research/learning-science.md`: what the evidence says about piano practice.
- `research/products-and-ux.md`: practice products, rhythm-game design, settings and progression UX.
- `research/ui-critique.md`: the independent UI critique of 19 Oct 2026, before the overhaul.
- `research/ios-ux.md`: Apple guidance, the web-view shell and practice at the instrument.
- `research/midi-import-audit.md`: why a fan MIDI rendered as clutter, and the importer bugs found.
- `research/public-domain-sources.md`: free and open score sources, licences and the fetch plan.

## Audits (`audit/`)

- `audit/2026-11-01-ux.md`: continuity and professional UX audit of every surface (46 findings, P0 to P3), with what was fixed overnight.
- `audit/2026-11-01-copy.md`: copy audit of every user-facing string (81 findings) and the glossary.
- `audit/2026-11-01-copy-decisions.md`: the decisions taken on the copy audit's judgement calls.
- `audit/2026-11-01-a11y.md`: accessibility audit (WCAG 2.2 AA, VoiceOver inferred from code, 25 findings).

## Art

