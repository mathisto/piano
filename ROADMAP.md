# Roadmap

Where the work stands, in the order it will be done. The reasoning is in `docs/STRATEGY.md`; the evidence is in `docs/research/`. Legend: [x] shipped and checked, [~] partly, [ ] not started.

## Shipped

- Play: Perform (scored falling notes, combo, judgement), Learn (wait mode, tempo, A-B loop, hands separate or dimmed or heard), Staff / Both / Falling views, count-in click, ghost notes on the staff, held-chord readout, hold and pedal grading, strictness (Easy, Standard, Strict), calibration.
- Read: 17 sight-reading stages from landmarks to triads, sharps, flats, keys of G and F, weighted deck, mastery meters.
- Technique: five-finger, scale and arpeggio in seven keys, either or both hands, with soft/medium/hard, crescendo, decrescendo and accent targets (pips on the falling bar, dynamics on the staff, a touch verdict per note).
- Touch: key velocity capture, histogram and hand balance on results, session log, personal calibration of soft/medium/hard.
- Content: MIDI and MusicXML (.musicxml, .mxl) import, eight starter pieces, sampled grand piano (Salamander, CC BY 3.0).
- Shell: five tabs (Today, Songs, Read, Technique, Progress); Today with Continue, next reading stage, last exercise and the week; Progress with the week, weekly goal, reading mastery and touch history; six-row settings in one screen; play-screen diet (score and combo only, top bar fades, `M` hides extras, touch-sized controls on coarse pointers).
- Deploy: static site at piano.mattkelly.io; iPad app via Capacitor with a CoreMIDI plugin (developer install, expires every 7 days).

## Phase D: design pass (in progress, branch `design/overhaul`)

- [x] Research: learning science, products and UX patterns, independent UI critique (`docs/research/`).
- [x] Decision record (`docs/STRATEGY.md`).
- [x] Settings: six rows plus Advanced, no paragraphs; Max effects tier deleted; Hold folded into Strictness; chord names always on; Import and Clear added; shortcuts moved to a `?` dialog.
- [x] Play screen: HUD cut to score and combo with captions over the numbers; legend shown once; "Tap Play" on touch; top bar fades; `M`; coarse-pointer sizing.
- [x] Navigation and page templates: Today and Progress added, Touch folded away, one page head, trimmed Songs and Read tables, themed selects.
- [x] Second critique pass: 29/40 (from 26); zen layout bug, bar-fade band, one page measure, Today plan list, Technique form, Progress cells, copy cuts, miss decay all fixed. Projected 32-33 once polished further.
- [x] DESIGN.md and sidecar rewritten from the shipped build: grammar, components, page templates, play states, rules, known debt.
- [ ] Perform and Learn as a choice on a start sheet instead of a bar switch.
- [x] Start card per song: Perform or Learn, how much of the notes to show (Simplify, only when it would change something), credit line for library pieces; tempo and hands live in the dock, tracks and split in the song's Options.
- [x] Decided: the bar only fades while playing, because reclaiming its 56px mid-song would shift the falling notes; the dock's focus button (and `M`) hide the bar and extras on purpose, on touch too.
- [x] Today shows the generated plan (see Phase E).
- [~] Design debt (full list in DESIGN.md, Known quirks): dynamics are now Bravura glyphs and zen has a touch button. Still open by decision: Perfect hits are colour-only on the staff (the default state needs no shape), hand hues are reused for the OK and B grades, no portrait layout under 1024px (the iPad app is landscape), some literal values are not tokens.
- [x] PRODUCT.md platform facts updated (iPad app, iPad is the main screen). Five-tab navigation still to be described there.

## Phase E: progression and practice model (after the design pass)

Order follows `docs/STRATEGY.md`. Nothing locks; every plan row can be skipped.

- [x] Error-targeted loop after every run: the results card offers the next step (loop the two worst bars at 70%, or lose the wait, or climb the tempo ladder). Clean passes are counted per loop pass, not per bar.
- [x] Automatic tempo ramp in Learn loops (switch in the dock): +5% after three clean passes, -10% after two messy ones (`pace.ts`).
- [x] Exit ramp suggested after a clean pass: lose the wait, then 50%, 75%, full tempo.
- [x] Review scheduling: Leitner boxes (1, 2, 4, 8, 16 days) per Read card and per Technique exercise; due cards dealt more often; Due tags on Read and the Technique path; Today points at due review first.
- [x] Today plan: warm-up, reading (due first), piece, the worst-bars loop and a second review, by 5, 10 or 20 minutes; steps tick off through the day; every row stands alone.
- [x] Effort and skill kept apart: days and minutes only rise; mastery states (New, Learning, Solid, Due) can fall.
- [x] Monday recap of last week (minutes, days) with a goal suggestion after a met goal. The 'measure that improved most' is not built.
- [x] Fading feedback: in Learn and Technique the judgement words go quiet after a run of eight clean notes (slips still speak), and a note's name fades from the falling bars once the Read drills show you know it (switch in Advanced). Mastery is graded on Perform runs.
- [x] Reading: four-note melody stages in C, G, F and the bass clef; rhythm reading as Technique levels 1 to 3 (played in time, scored for timing); a Hide played switch in Learn trains reading ahead. The isolated-note stages stay (they are the landmark stages and the base for review).
- [x] Technique breadth in syllabus order (31 exercises): five-finger, scales, hands together, contrary motion, arpeggios, dynamics, minor keys, legato and staccato (graded by hold), evenness, melody over accompaniment, rhythm; mastery per exercise.
- [x] Touch: velocity by register (low, middle, high keys), 'Play the file's dynamics' (Advanced) maps a file's own dynamics onto your soft and hard, evenness as an exercise.

## Phase F: content and import quality (research under way)

- [x] Research: `docs/research/midi-import-audit.md` (the staff is not a notation engine: no quantization, voices, rests, ties, tuplets; tracks merged into two hands; plus real importer bugs: pad track labelled right hand, program change splitting a piano into two tracks, pickup bar shifting barlines, wrong enharmonic, key estimate dominated by long notes). Original Aerith file still needed; the snippet to recover it is in section 10 of the audit.
- [x] Research: `docs/research/public-domain-sources.md` (Mutopia as MIDI, OpenScore Lieder as MusicXML, IMSLP manual only; 40-piece graded list; fetch script outline).
- [~] F0/F1 first slice shipped 19 Oct: `src/midi-tracks.ts` (`inspectMidi`, `autoSelect`), a Tracks button on every multi-track MIDI row with a live crowding count, hands pinnable per track, track names recovered from empty heading tracks. The owner's ff7aerith.mid (13 instrument tracks, 5,082 notes, up to 35 a bar) now opens as oboe plus harp, 1,373 notes, at most 10 a bar. Still open here: sibling tracks split by a mid-file program change, the pad rule for the two-track hand split, a Share original MIDI button, a fuller import report (overlap, drums by note number, pickup, key margin). Original F0 text: `inspectMidi` import report per song from the stored bytes (tracks, density, overlaps, drums, pickup, key margin) and a Share original MIDI button.
- [x] F1: track selection with a default that picks a lead and an accompaniment from crowded orchestral files and keeps whole piano scores; hands pinnable per track; single-track hand split follows the nearer line near the split pitch. Not reproduced in a real file, so not built: sibling tracks split by a program change.
- [~] F2 importer side shipped on feature/f2-notation: `src/quantize.ts` (ticks and quarters only; chord clusters at 40 ms of local tempo; per-hand grid over 16th, triplet 8th and 32nd by Viterbi with drift read from beat onsets; pickup detection; graces flagged; written value clipped to the next onset in the voice and the barline; ties via `tieNext`/`qrest`/`tiedSegments`; voice 2 for long notes under a moving line), onset-weighted key estimate with `Song.keys` per stretch, `spellWindow` + `Note.acc`; MusicXML and spec songs fill the same `Note` fields. Open: the staff must consume them (F3); a lone triplet figure spanning two beats is written as sixteenths; no beat tracking for files without a tempo map (transcriptions); voice split is a one-rule heuristic; ornaments are flagged, not yet a user option; `Bar.ql` (pickup length) is ignored by `staff.ts`.
- [ ] F3 (5-7 days): staff upgrades: pure layout function with tests, rests, ties, tuplet brackets, two voices, 8va, meter-aware beaming, rhythmic spacing, a too-dense fallback.
- [x] F4: Simplify per song (full, two hands, melody and bass, melody only) with an automatic level for busy arrangements, set on the start card and remembered per song.
- [x] A curated open library built from Mutopia and OpenScore (public domain, CC0, CC BY, CC BY-SA accepted; owner policy 19 Oct 2026) with a manifest, a licence allowlist test, per-piece credit lines and a Credits screen; CC BY-SA files stay under their licence in `public/library/`.
- [ ] Full score view for MusicXML (more bars, rests, beams, ties, repeats).
- [x] More instruments: electric piano, church organ, harp, strings, music box from MuseScore_General (MIT, rendered from FluidR3), about 1.5 MB, loaded only when chosen, credited in Credits (`docs/sounds.md`, `src/instruments.ts`). Unverified: tone and loop seams were checked by decoding, never by ear.

## iPad app (developer mode, one person)

Web build in a Capacitor web view (`ios/`), CoreMIDI through `ios/App/App/PianoNative.swift`, and `src/native-midi.ts` faking `navigator.requestMIDIAccess`. Bundle id `io.mattkelly.piano`, free Personal Team: reinstall every 7 days with the same bundle id, never delete the app (that wipes its songs and progress). Installed 19 Oct 2026 (device was locked at launch, so the app was installed but not started) with everything up to the library and simplify; rebuild after the staff upgrade and the sounds.

- [x] Capacitor project, CoreMIDI plugin, JS shim, playback audio session, wake lock, landscape, safe areas, share-sheet export.
- [ ] Check on the iPad: FP-10 over USB (timing, use Calibrate), sound with the silent switch, saved songs surviving a relaunch, file import from Files, Stage Manager resize, the sound of the piano samples, the count-in click.
- [ ] Rebuild and reinstall after the design pass.
- Limits: 60 Hz cap in the web view; storage is separate from the website; Bluetooth MIDI pairing reportedly crashes on iPadOS 27.0, so use USB.

## Known gaps

Play and staff:
- Staff clips ledger lines below about C2 and above about C7 (needs 8va marks).
- No tuplets or dynamics from the file on the staff; durations round to the nearest standard value.
- Hands for single-track MIDI split at one pitch, no per-note override.
- Timing windows (45, 80, 125 ms) and scoring weights are tuned by feel.
- Bluetooth MIDI adds jitter that calibration cannot remove.
- Web MIDI needs Chrome, Edge or Firefox on a computer; the iPad app has its own path.
- Cloudflare injects a Web Analytics beacon at the edge; the app sends nothing itself.

MusicXML import:
- Repeats and first/second endings are expanded and dynamics marks set velocity; da capo and segno are ignored; grace notes and unpitched percussion are skipped; transposing instruments are not transposed; time-wise scores are rejected (export partwise). Not planned.

Evidence:
- Key velocity feedback has no controlled evidence behind it; treat the Touch features as measurement, not proven pedagogy.
- The learning-science report took some details from search summaries; each such citation is marked in its bibliography. ABRSM and RCM syllabus pages were unreachable, so keys and order came from third-party charts.

## Content and licences

Starter pieces are public-domain compositions with arrangements written for this project. Copyrighted pieces (game music, pop) are never committed; users import their own files and they stay in the browser. Piano samples: Salamander Grand Piano, CC BY 3.0, credited in Settings.
