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
- [ ] Second critique pass (`impeccable` re-review is running); apply its polish list.
- [ ] DESIGN.md: document the grammar (tokens, components, page templates, copy rules, the new pages, target pips, dynamics). A documenter pass is owed.
- [ ] Perform and Learn as a choice on a start sheet instead of a bar switch.
- [ ] A start sheet per song: mode, tempo, hands, split, tracks (see Phase F).
- [ ] Auto-hide bar reclaims its space without a layout jump (today it only fades; `M` reclaims).
- [ ] Today: use the empty lower half for the generated plan (Phase E), not decoration.
- [ ] Design debt carried over: hard offset shadows on the primary button and slam text, the Learn `✓` glyph, colour-only hit marks on the staff, radius scale of four near-duplicates.
- [ ] Update PRODUCT.md (iOS is no longer out of scope; five tabs; iPad is the main screen).

## Phase E: progression and practice model (after the design pass)

Order follows `docs/STRATEGY.md`. Nothing locks; every plan row can be skipped.

- [ ] Error-targeted loop after every run: the two worst bars, 2 to 4 bars of context, one tap to loop at a lower tempo; count clean passes in a row per bar.
- [ ] Automatic tempo ramp (Melodics-style Auto BPM): +5% after three clean passes, -10% after two failed.
- [ ] After a clean Learn pass with Wait on, suggest the exit ramp: wait, 50%, 75%, full speed.
- [ ] Review scheduling: Leitner boxes (1, 2, 4, 8, 16 days) per Read card and per exercise; states New, Learning, Solid, Due; a miss drops one box.
- [ ] Today plan generator: warm-up (last exercise, about 2 minutes), reading (due cards first), piece (its worst bars); 5, 10 or 20 minute chips; skip anywhere.
- [ ] Effort and skill kept apart: days and minutes only rise; mastery can fall to Due.
- [ ] Weekly summary on Monday (minutes, the measure that improved most, a suggested goal).
- [ ] Fading feedback: judgement words and the note-name training wheels fade as mastery grows in Learn and Technique; mastery is graded on unaided runs.
- [ ] Reading stages: cap isolated note-name drills at the landmark stages; add short melodic fragments in key, then rhythm reading (a card stream played in time) and a reading-ahead mode.
- [ ] Technique breadth in syllabus order: five-finger, C G D F scales hands separate, contrary motion, arpeggios, remaining keys, minor keys; evenness, melody over accompaniment, staccato and legato by hold length; mastery per exercise with the Read meter.
- [ ] Touch: per-pitch-region velocity, "play as written" for MIDI with dynamics, evenness before absolute level.

## Phase F: content and import quality (research under way)

- [ ] `docs/research/public-domain-sources.md`: sources, licences, a graded 40-piece list, a fetch-and-manifest pipeline (agent running).
- [ ] `docs/research/midi-import-audit.md`: why a fan MIDI of Aerith's Theme rendered as clutter; root causes and a fix plan (agent running). Needs the original file from the owner, or an in-app import report.
- [ ] Import report and per-track selection (drums, pads, bass) at import time.
- [ ] Quantization with tuplet detection, voice separation, a simplify control.
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
