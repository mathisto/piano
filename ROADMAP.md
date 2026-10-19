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
- [ ] A start sheet per song: mode, tempo, hands, split, tracks (see Phase F).
- [ ] Auto-hide bar reclaims its space without a layout jump (today it only fades; `M` reclaims).
- [ ] Today: use the empty lower half for the generated plan (Phase E), not decoration.
- [ ] Design debt carried over (full list in DESIGN.md, Known quirks): the Learn `✓` glyph, colour-only hit marks on the staff, hand hues reused for grades, Georgia italic dynamics, no portrait layout, literal values that are not tokens, the bar fade keeps its 56px band, zen is keyboard-only (no touch toggle).
- [x] PRODUCT.md platform facts updated (iPad app, iPad is the main screen). Five-tab navigation still to be described there.

## Phase E: progression and practice model (after the design pass)

Order follows `docs/STRATEGY.md`. Nothing locks; every plan row can be skipped.

- [x] Error-targeted loop after every run: the results card offers the next step (loop the two worst bars at 70%, or lose the wait, or climb the tempo ladder). Clean passes are counted per loop pass, not per bar.
- [x] Automatic tempo ramp in Learn loops (switch in the dock): +5% after three clean passes, -10% after two messy ones (`pace.ts`).
- [x] Exit ramp suggested after a clean pass: lose the wait, then 50%, 75%, full tempo.
- [~] Review scheduling: Leitner boxes (1, 2, 4, 8, 16 days) per Read card, due cards dealt more often, Due tag on Read, Today points at due review first. Not yet per exercise.
- [x] Today plan: warm-up, reading (due first), piece, the worst-bars loop and a second review, by 5, 10 or 20 minutes; steps tick off through the day; every row stands alone.
- [ ] Effort and skill kept apart: days and minutes only rise; mastery can fall to Due.
- [x] Monday recap of last week (minutes, days) with a goal suggestion after a met goal. The 'measure that improved most' is not built.
- [ ] Fading feedback: judgement words and the note-name training wheels fade as mastery grows in Learn and Technique; mastery is graded on unaided runs.
- [ ] Reading stages: cap isolated note-name drills at the landmark stages; add short melodic fragments in key, then rhythm reading (a card stream played in time) and a reading-ahead mode.
- [ ] Technique breadth in syllabus order: five-finger, C G D F scales hands separate, contrary motion, arpeggios, remaining keys, minor keys; evenness, melody over accompaniment, staccato and legato by hold length; mastery per exercise with the Read meter.
- [ ] Touch: per-pitch-region velocity, "play as written" for MIDI with dynamics, evenness before absolute level.

## Phase F: content and import quality (research under way)

- [ ] `docs/research/public-domain-sources.md`: sources, licences, a graded 40-piece list, a fetch-and-manifest pipeline (agent running).
- [x] Research: `docs/research/midi-import-audit.md` (the staff is not a notation engine: no quantization, voices, rests, ties, tuplets; tracks merged into two hands; plus real importer bugs: pad track labelled right hand, program change splitting a piano into two tracks, pickup bar shifting barlines, wrong enharmonic, key estimate dominated by long notes). Original Aerith file still needed; the snippet to recover it is in section 10 of the audit.
- [x] Research: `docs/research/public-domain-sources.md` (Mutopia as MIDI, OpenScore Lieder as MusicXML, IMSLP manual only; 40-piece graded list; fetch script outline).
- [~] F0/F1 first slice shipped 19 Oct: `src/midi-tracks.ts` (`inspectMidi`, `autoSelect`), a Tracks button on every multi-track MIDI row with a live crowding count, hands pinnable per track, track names recovered from empty heading tracks. The owner's ff7aerith.mid (13 instrument tracks, 5,082 notes, up to 35 a bar) now opens as oboe plus harp, 1,373 notes, at most 10 a bar. Still open here: sibling tracks split by a mid-file program change, the pad rule for the two-track hand split, a Share original MIDI button, a fuller import report (overlap, drums by note number, pickup, key margin). Original F0 text: `inspectMidi` import report per song from the stored bytes (tracks, density, overlaps, drums, pickup, key margin) and a Share original MIDI button.
- [ ] F1 (2-3 days): track and channel selection with sensible defaults (skip drums, pads, tiny tracks), hand rule rewrite, program-change siblings merged; non-destructive options stored with the song.
- [ ] F2 (4-6 days): notation layer in the importer: tick-based quantization with tuplet detection, chord clustering, written values clipped to the voice, tied segments across barlines, pickup detection, onset-weighted key estimate, windowed spelling.
- [ ] F3 (5-7 days): staff upgrades: pure layout function with tests, rests, ties, tuplet brackets, two voices, 8va, meter-aware beaming, rhythmic spacing, a too-dense fallback.
- [ ] F4 (2-3 days, high value for a beginner): Simplify per song: full, two hands, melody and bass, melody only.
- [ ] A curated open library built from Mutopia and OpenScore (public domain, CC0, CC BY, CC BY-SA accepted; owner policy 19 Oct 2026) with a manifest, a licence allowlist test, per-piece credit lines and a Credits screen; CC BY-SA files stay under their licence in `public/library/`.
- [ ] Full score view for MusicXML (more bars, rests, beams, ties, repeats).
- [ ] More instruments (General MIDI soundfont, electric piano, organ); check each pack's licence.

## iPad app (developer mode, one person)

Web build in a Capacitor web view (`ios/`), CoreMIDI through `ios/App/App/PianoNative.swift`, and `src/native-midi.ts` faking `navigator.requestMIDIAccess`. Bundle id `io.mattkelly.piano`, free Personal Team: reinstall every 7 days with the same bundle id, never delete the app (that wipes its songs and progress). Last installed 19 Oct 2026 with ghost notes, hold scoring, count-in and the first Technique page; it does not yet have Touch, the design pass or anything after.

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
- Hold scoring: no tint for a too-long hold, no "hold to advance" in Learn.

MusicXML import:
- Repeats, voltas and da capo ignored; grace notes and unpitched percussion skipped; transposing instruments not transposed; dynamics do not set velocity; time-wise scores rejected.

Evidence:
- Key velocity feedback has no controlled evidence behind it; treat the Touch features as measurement, not proven pedagogy.
- The learning-science report took some details from search summaries; each such citation is marked in its bibliography. ABRSM and RCM syllabus pages were unreachable, so keys and order came from third-party charts.

## Content and licences

Starter pieces are public-domain compositions with arrangements written for this project. Copyrighted pieces (game music, pop) are never committed; users import their own files and they stay in the browser. Piano samples: Salamander Grand Piano, CC BY 3.0, credited in Settings.
