# Roadmap

Where the work stands, in the order it will be done. The reasoning is in `docs/STRATEGY.md`; the evidence is in `docs/research/`. Legend: [x] shipped and checked, [~] partly, [ ] not started.

## Shipped

- Play: Perform (scored falling notes, combo, judgement), Learn (wait mode, tempo, A-B loop, hands separate or dimmed or heard), a draggable divider between the staff and the falling notes (drag to an end for one pane alone), staff zoom (pinch, trackpad pinch, - and +, or the corner buttons, which can be dragged anywhere: smaller shows more bars, and a second line appears once two fit; a Fit button shows the whole piece, a double tap resets), portrait and split-view windows (no minimum width), count-in click, ghost notes on the staff, held-chord readout, hold and pedal grading, strictness (Easy, Standard, Strict), calibration.
- Read: 17 sight-reading stages from landmarks to triads, sharps, flats, keys of G and F, weighted deck, mastery meters. Sight Run (`src/run.ts`): a run you build yourself on the Read page: clef, range, naturals/sharps/flats or a key, notes/intervals/triads, a Jumps slider (leaps to steps), a Shuffle slider (even to weighted by your weak notes), endless or 10 to 100 cards, reading ahead (only the next 1 to 4 notes show), saved runs. Practice waits and scores nothing; Arcade scores each first-try card by speed times a combo (x2 every 5, up to x8) with a pace that tightens as the combo climbs, optional three lives, a clean set can widen the range, a best per range, and a results strip of speed and misses per note. It feeds the same per-card stats as the stages. Endless runs chain sets of 16 with a short seam.
- Technique: five-finger, scale and arpeggio in seven keys, either or both hands, with soft/medium/hard, crescendo, decrescendo and accent targets (pips on the falling bar, dynamics on the staff, a touch verdict per note).
- Touch: key velocity capture, histogram and hand balance on results, session log, personal calibration of soft/medium/hard.
- Content: MIDI and MusicXML (.musicxml, .mxl) import, eight starter pieces, sampled grand piano (Salamander, CC BY 3.0).
- Shell: five tabs (Today, Songs, Read, Technique, Progress); Today with Continue, next reading stage, last exercise and the week; Progress with the week, weekly goal, reading mastery and technique cells you can tap to practise, and touch history; Songs with covers, thumbnails and lengths for the open library too (46 ChatGPT-made covers in `public/art/`, see `docs/art/covers.md`); six-row settings in one screen; play-screen diet (score and combo only, top bar fades, `M` hides extras, touch-sized controls on coarse pointers).
- Deploy: static site at pianoforte.mattkelly.io; iPad app via Capacitor with a CoreMIDI plugin (developer install, expires every 7 days).

## Phase D: design pass (in progress, branch `design/overhaul`)

- [x] Research: learning science, products and UX patterns, independent UI critique (`docs/research/`).
- [x] Decision record (`docs/STRATEGY.md`).
- [x] Settings: six rows plus Advanced, no paragraphs; Max effects tier deleted; Hold folded into Strictness; chord names always on; Import and Clear added; shortcuts moved to a `?` dialog.
- [x] Play screen: HUD cut to score and combo with captions over the numbers; legend shown once; "Tap Play" on touch; top bar fades; `M`; coarse-pointer sizing.
- [x] Navigation and page templates: Today and Progress added, Touch folded away, one page head, trimmed Songs and Read tables, themed selects.
- [x] Second critique pass: 29/40 (from 26); zen layout bug, bar-fade band, one page measure, Today plan list, Technique form, Progress cells, copy cuts, miss decay all fixed. Projected 32-33 once polished further.
- [x] DESIGN.md and sidecar rewritten from the shipped build: grammar, components, page templates, play states, rules, known debt.
- [x] Perform and Learn are chosen on the start card; the bar switch only shows while paused.
- [x] Start card per song: Perform or Learn, how much of the notes to show (Simplify, only when it would change something), credit line for library pieces; tempo and hands live in the dock, tracks and split in the song's Options.
- [x] Decided: the bar only fades while playing, because reclaiming its 56px mid-song would shift the falling notes; the dock's focus button (and `M`) hide the bar and extras on purpose, on touch too.
- [x] Today shows the generated plan (see Phase E).
- [~] Design debt (full list in DESIGN.md, Known quirks): dynamics are now Bravura glyphs and zen has a touch button; the portrait layout, token values and letter-grade hues are done. Still open by decision: Perfect hits are colour-only on the staff (the default state needs no shape), the Hold outlines and the "ok" hit reuse hues, some size literals are not tokens.
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
- [x] F0/F1: `src/midi-tracks.ts` (`inspectMidi`, `autoSelect`), an Options dialog per imported file (facts: notes, bars, length, key, drums; the track list with in-use tracks first and a hand per track; share the original file; remove), track names recovered from empty heading tracks. The owner's ff7aerith.mid (13 tracks, 5,082 notes, up to 35 a bar) opens as oboe plus harp, 1,373 notes, at most 10 a bar. Not built because it was not reproduced in a real file: sibling tracks split by a program change, a pad rule for the two-track hand split.
- [x] F1: track selection with a default that picks a lead and an accompaniment from crowded orchestral files and keeps whole piano scores; hands pinnable per track; single-track hand split follows the nearer line near the split pitch. Not reproduced in a real file, so not built: sibling tracks split by a program change.
- [x] F2: `src/quantize.ts` notation layer in the importer (ticks and quarters; chord clusters; per-hand grid over 16th, triplet 8th and 32nd by Viterbi; pickup detection; graces flagged; written value clipped to the voice and barline; ties; voice 2 for held notes; onset-weighted key estimate with `Song.keys`; windowed spelling). Open: a lone triplet quarter figure over two beats is written as sixteenths; no beat tracking for files without a tempo map; one-rule voice split; ornaments flagged, not a user option.
- [x] F3: `src/layout.ts` pure layout with tests (columns, voices, rests, ties across barlines, tuplet brackets, grace notes, 8va and 15ma brackets, meter-aware beaming, key and time signatures where they change, pickup widths, rhythmic spacing as a monotone time-to-x map so the cursor still sweeps evenly) and a thin SVG painter in `staff.ts`; sheet view picks bars per system by width and shows a calm 'Dense: simplify' hint. Open: stems of two-voice bars and wide chords run long, tuplet brackets never sit inside the group, a bar wider than a system is zoomed out and squeezed instead of wrapped, mid-bar tempo changes leave the cursor up to a third of a beat off, the painter is covered by browser checks only.
- [x] F4: Simplify per song (full, two hands, melody and bass, melody only) with an automatic level for busy arrangements, set on the start card and remembered per song.
- [x] A curated open library built from Mutopia and OpenScore (public domain, CC0, CC BY, CC BY-SA accepted; owner policy 19 Oct 2026) with a manifest, a licence allowlist test, per-piece credit lines and a Credits screen; CC BY-SA files stay under their licence in `public/library/`.
- [x] Full notation for MusicXML and MIDI: rests, ties, beams per meter, tuplets, graces, 8va, key and time changes, repeats and endings expanded, up to four bars a system in sheet view.
- [x] More instruments: electric piano (Sullivan Wurlitzer EP200, CC BY 3.0, three strengths), church organ and harp (Versilian VCSL, CC0; the harp at two strengths), strings (VSCO 2 CE section sustains, CC0), music box (MuseScore_General, MIT); about 4 MB between them, each loaded only when chosen, credited in Credits (`docs/sounds.md`, `src/instruments.ts`, `scripts/make-instruments.py`). Unverified: tone and loop seams were checked by measurement (levels, loop-seam steps), never by ear.

## iPad app (developer mode, one person)

Web build in a Capacitor web view (`ios/`), CoreMIDI through `ios/App/App/PianoNative.swift`, and `src/native-midi.ts` faking `navigator.requestMIDIAccess`. Bundle id `io.mattkelly.piano`, free Personal Team: reinstall every 7 days with the same bundle id, never delete the app (that wipes its songs and progress). Installed 19 Oct 2026 (device was locked at launch, so the app was installed but not started) with everything up to the library and simplify; rebuild after the staff upgrade and the sounds.

- [x] Capacitor project, CoreMIDI plugin, JS shim, playback audio session, wake lock, landscape, safe areas, share-sheet export.
- [ ] Check on the iPad: FP-10 over USB (timing, use Calibrate), sound with the silent switch, saved songs surviving a relaunch, file import from Files, Stage Manager resize, the sound of the piano samples, the count-in click.
- [x] Rebuilt and reinstalled 19 Oct 2026 after the sounds and polish merges; rebuild once more after the final review (a 7-day profile).
- Limits: 60 Hz cap in the web view; storage is separate from the website; Bluetooth MIDI pairing reportedly crashes on iPadOS 27.0, so use USB.

## Next: curriculum, scales and touch (planned 2026-10-27, research by three Sonnet agents)

1. **Touch evenness engine** (`src/even.ts`, pure, tested). Per note: velocity minus the median of its neighbours (window 5 to 7, same hand, single line, runs of 6 or more, first and last note and octave boundaries ignored, velocity under 15 ignored). Spread is MAD x 1.48, so one loud thumb does not wreck it. Bands are a share of the player's calibrated soft-to-loud range, not raw numbers: beginner about plus or minus 12, intermediate 8, advanced 5 of 127 as a starting point, adjustable as Coach strictness. Show: noteheads tinted by deviation (never red), a per-note strip with the median line and band in results, one coaching line after 3 or more repeats of a pattern ("thumb landings run about 10 louder"). Timing evenness (inter-onset interval spread, legato gap) uses the same shape. Log the keyboard's key-touch setting with each session; Fixed makes it unmeasurable. Apply to Technique and Scales first, then songs with a clear single line.
2. **Scales tab** (sixth tab; it takes over the scale and arpeggio recipes of Technique, which keeps the pattern builder). Fingering table for 12 major and natural/harmonic minor keys from pianoscales.org, checked against a second source only in part; open conflicts to settle against a printed book before shipping: B flat major right hand (both 2-1-2-3-1-2-3-4 and 4-1-2-3-1-2-3-4 accepted), G sharp minor right hand, arpeggio fingerings, melodic minor. MIDI cannot see fingers, so only pitches are checked; the recommended fingering is shown on the noteheads. Stages: C G F a d; two octaves; D A E e g; black-key family starting B and D flat (Chopin's order); all 24 keys together with chromatic and contrary motion; speed and extras. Hands separately, then together; tempo targets from the exam boards (ABRSM grade 1 q=60 rising to 100 at grade 4; RCM eighths at q=69 at level 1); pass is three clean runs with even timing, legato and touch; mastery feeds the same spaced review as Read.
3. **Read curriculum fill** (stages stay first on the page): octave anchors (C3, C5, G2, G5), one-ledger-line stages, mixed-clef cards before the grand staff, 8va, minor keys, more keys, reading-ahead stages; a Fluent tier that tightens the goal from about 2.5 s toward 1 to 1.5 s. Evidence is thin: teachers agree on landmarks then neighbours and on mixed-clef cards; nothing settles treble-first against bass-first.
4. **Sight Run follow-ups**: key-aware intervals and triads, an on-screen pace.

## Known gaps

- Sight Run: not yet tried on the iPad or with a real keyboard (headless Chrome with synthetic key presses only); the pace tightening is a scoring threshold, not an on-screen timer or a moving tempo; "widen when a set goes well" and "stay a note or two past comfort" are design bets, not research findings; intervals and triads are white-key only and ignore the key; the results strip is a bar chart per note, not a keyboard heatmap; Read's stage table is cramped at about 820px wide.

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
