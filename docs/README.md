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
- `changes/pedal.md`: the sustain pedal from CC64: the sampler, the results line, the Technique exercise.

**Importer and library pipeline**
- `changes/importer.md`: importer fixes for mass ingestion (key changes, spelling, D.C./D.S., tuplets, tempo).
- `changes/catalog.md`: the catalogue-driven Songs page, search, offline saving, piece loader, credits.
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
- `changes/formtempo.md`: a pace from the form for scores that name none.
- `changes/rebuild.md`: re-analysing the published catalogue without changing an id, file or hash.

**Shell, speed, tests, polish**
- `changes/split.md`: `main.ts` split into the `src/app/` modules, and the rules to keep.
- `changes/e2e.md`: the end-to-end suite and the bugs it found.
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
- `changes/prune.md`: dead code and duplicate helpers removed (`src/util.ts`), one dependency dropped.
- `changes/docsync.md`: the 2026-10-27 audit of ROADMAP, DESIGN, PRODUCT and this index.

## Research (`research/`)

Dated reports behind the decisions; read the ratings before relying on a claim.

- `research/learning-science.md`: what the evidence says about piano practice.
- `research/products-and-ux.md`: practice products, rhythm-game design, settings and progression UX.
- `research/ui-critique.md`: the independent UI critique of 19 Oct 2026, before the overhaul.
- `research/ios-ux.md`: Apple guidance, the web-view shell and practice at the instrument.
- `research/midi-import-audit.md`: why a fan MIDI rendered as clutter, and the importer bugs found.
- `research/public-domain-sources.md`: free and open score sources, licences and the fetch plan.

## Art

- `art/covers.md`: the style header and prompts for the cover illustrations.
