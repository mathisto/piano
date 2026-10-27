# docs/

The top-level files are `PRODUCT.md` (what the app is and for whom), `DESIGN.md` (the design system and every screen) and `ROADMAP.md` (shipped, next, known gaps, research). This folder holds the rest.

## Decisions and operations

- `STRATEGY.md`: the product model (progression, sessions, feedback diet, gamification rules, copy rules) and the evidence behind each decision.
- `library.md`: the curated library policy (allowed licences, what a piece must carry, rebuild and add-a-piece steps).
- `hosting.md`: serving the big library corpus on quartz (Caddy, Cloudflare cache rules, publishing and takedown).
- `sounds.md`: every sample set, its source and licence, and how the piano and instruments are built.

## Change notes (`changes/`)

One file per feature branch: what it built, how it was checked, what is open.

- `changes/catalog.md`: the catalogue-driven Songs page, search, offline saving, piece loader, credits.
- `changes/pipeline.md`: the library batch pipeline, grade fit, the 500-piece run and its open items.
- `changes/importer.md`: importer fixes for mass ingestion (key changes, spelling, D.C./D.S., tuplets, tempo).
- `changes/readthrough.md`: Read through (look-through, no-stop pass, piece picker, summary).
- `changes/scales2.md`: contrary motion, chromatic and arpeggio scales, and the fingering table to verify.
- `changes/ear.md`: the ear and rhythm trainers in Theory.
- `changes/touch.md`: timing evenness, legato and staccato, voicing, fading marks, key-touch setting.
- `changes/habit.md`: 30 and 45 minute plans, break reminder, day streak, the Path.
- `changes/polish.md`: the critique of the whole app, the Set up sheet, fixes and what was left.

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
