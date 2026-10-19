# Roadmap and known gaps

v1 (Perform, Learn, MIDI import, staff strip) is built. This file tracks what is next and what is known to be rough.

## v2

Done:
- [x] Sight-reading drills ("Read music"): 13 stages from treble landmarks through bass, both clefs, intervals and triads. Falling notes and key names hidden by default; the song waits; per-card first-try accuracy and response time feed a weighted deck and a mastery meter per stage.
- [x] MusicXML import (.musicxml and compressed .mxl): exact pitch spelling via the file's key, real rhythm, ties merged, hands from the two staves, tempo changes, pickup measures. Plain partwise scores only (see gaps).

- [x] View modes: Staff (two systems of bars, turns a system at a time), Both, Falling. Switch in the top bar or press V. Click or touch the on-screen keys to play them, with sound.

Still to do:
- [x] Accidentals and keys in the drills: Sharps, Flats, Key of G, Key of F (stats keep F sharp and G flat apart).
- [ ] More keys (D, B flat, minor keys), accidentals in the bass clef and in chords, then rhythm reading (a card stream you play in time, not waiting).
- [ ] A reading-ahead mode: the next bar stays hidden until the current one ends, to train eye-hand span.
- [ ] Full score view for imported MusicXML (more bars, rests, beams, ties, repeat signs). The staff strip still shows two bars with rhythm drawn simply.
- [x] Sampled grand piano (Salamander V3, CC BY 3.0, bundled in public/samples, loaded when first wanted) with a simple-synth fallback and an instrument choice in Settings.
- [ ] More instruments: General MIDI sounds from a soundfont (check each pack's licence), electric piano, organ. `src/audio.ts` has one voice factory per instrument; add another and a Settings option.
- [ ] Note names that fade as mastery grows (today: a plain on/off toggle in Settings and in the drill dock).

## Known gaps in v1

- Staff clips ledger lines below about C2 and above about C7 (needs 8va/15ma marks or a taller strip).
- No beams, rests, ties, tuplets or dynamics on the staff. Durations are rounded to the nearest standard value.
- Hands for single-track MIDI are split at one pitch (settings). No per-note override.
- Key signature from the file is trusted when present; a wrong "C major" default in a transposed file is not corrected.
- Timing windows (45 / 80 / 125 ms) and scoring weights are tuned by feel, not by testing with real players.
- Bluetooth MIDI adds jitter that calibration cannot remove, only offset.
- Web MIDI needs Chrome, Edge or Firefox on a computer. Safari and iOS have none.
- Cloudflare injects a Web Analytics beacon at the edge for the zone. The app itself sends nothing; exclude `piano.mattkelly.io` in the dashboard if that matters.

## Known gaps in MusicXML import

- Repeats, voltas and da capo are ignored: the score plays straight through once.
- Grace notes and unpitched percussion are skipped. Transposing instruments are not transposed. Dynamics do not set velocity.
- Time-wise scores are rejected (export partwise). Multi-part scores use the stated staff for the hand; single-staff parts split at middle C.

## Content

- Starter pieces are public-domain compositions with arrangements written for this project. Copyrighted pieces (game music, pop) are never committed. Users import their own MIDI; it stays in their browser.

## Design debt (from the finish review and DESIGN.md)

- [ ] Primary button uses a hard offset shadow (`0 2px 0`), and the combo slam and count-in use hard `text-shadow` offsets. Replace with soft depth or drop.
- [ ] Learn-mode results show a `✓` text glyph as the grade; draw it as an icon.
- [ ] Staff-hit marks are colour-only on the staff itself (only the miss has a shape); the results legend carries word and shape.
- [ ] Radius scale has four near-duplicates (4/6/8/10px); collapse to two.
- [ ] No third review pass after the last two fixes (bass stem direction, histogram labels); they were checked in captures by the builder only.

## iPad app (developer mode, for one person)

The iPad app is the web build in a Capacitor web view (`ios/`), plus one native piece: `ios/App/App/PianoNative.swift` reads MIDI through CoreMIDI and `src/native-midi.ts` fakes `navigator.requestMIDIAccess` over it, so `src/midi.ts` is unchanged. Researched 2026-10-18: native SwiftUI rewrite is about 125-150 h, the wrapper is about a day; JavaScriptCore with a native UI is the later path if the wrapper is not enough.

Run it: `npm run ios` (builds the web app, syncs, opens Xcode); pick the iPad; Run. Bundle id `io.mattkelly.piano`, team `TC8XUVBATG` (free Personal Team: the install expires after 7 days; run again from Xcode with the same bundle id, and do not delete the app, which would wipe its songs and progress).

- [x] Capacitor 8 project, CoreMIDI plugin, JS shim (tested in a desktop browser against a faked plugin), playback audio session, screen kept awake, landscape, safe areas, share-sheet export, hash without `crypto.subtle`.
- [ ] Run on the iPad and check: FP-10 over USB (notes, timing; use Calibrate), sound with the silent switch, saved songs surviving a relaunch, file import from Files (`.mid`, `.musicxml`, `.mxl`), Stage Manager resize.
- [ ] Known limits: web view is capped at 60 Hz; the app starts with its own empty storage (not shared with the website); Bluetooth MIDI pairing screen reportedly crashes on iPadOS 27.0, so pair in another app or use USB.

## Next: input fidelity and touch (designed 2026-10-18, not built)

Ideas from the first real session on the iPad with the FP-10. Everything below needs the same plumbing first: note-off, pedal and velocity must reach `Game` and `Judge` with their timestamps (today `midi.ts` forwards note-offs and velocity, but `Judge` grades onsets only and ignores releases, and CC64 pedal is only counted in the monitor).

### Phase A: see and hold (about 6-8 h)

- [ ] **Ghost note on the staff.** When a key goes down, draw a translucent hollow notehead (dashed outline, Ink-2, not a hand or judgement colour) at the pitch pressed, at the staff x of the moment you pressed it, spelled by the song's key (with an accidental sign). Because it sits at your real press time, its distance from the written note is your timing error, early or late, made visible.
  - Hit: the ghost snaps to the written note and flashes its grade colour (Perfect lime, Great mint, Good orange) with the same glow and streak-scaled sparkle as the key; Great/Good keep their persistent shape.
  - Miss (note passed unplayed): the written note does a short downward 'thud' and settles red with the existing miss triangle.
  - Wrong note (nothing written there): the ghost turns red with an X, wobbles once, fades.
  - Effects level scales it (Off: colour only; Calm: no motion; Arcade/Max: sparkle and thud). Reduced motion caps at Calm. Optional soft thud sound, off by default.
  - Open: ghost colour (proposal: Ink-2 outline so it is clearly 'not the score'); whether a held ghost should stretch into a duration bar (ties to hold scoring).
- [ ] **Held-chord readout**, bottom right of the stage, above the keyboard, never over the falling lanes. Names what is held right now: pitch-class set matched against triads, sevenths, sus, dim, aug, power fifths, with inversions and slash bass ('C/E', 'G7', 'Dm'); two notes show the interval ('C and G: fifth'); one note shows its name. Spelled by the key. Settings switch, default on. Pure function of held pitches: easy to unit test.
- [ ] **Hold scoring** (note length and release timing). Today only onsets are graded.
  - Judge records each hit note's release time (note-off matched by pitch). Target release is the written end (the quantized note value in the staff, else the file's duration), capped at the next onset of the same hand so legato and rests are not punished.
  - Grades per note: held (released within about 120 ms or 15% of the length, whichever is larger), short (released early), long (held into the next note). Held full value keeps the note's points; short or long scales its points down (floor 50%). A broken hold does not break the combo. Results show a Hold % next to Accuracy.
  - Sustain pedal (CC64): while the pedal is down, an early release is not penalised. Needs CC64 parsing in `midi.ts`.
  - Strictness setting: Off, Lenient (default in Perform), Strict. Learn keeps it Off unless switched on.
  - Visual: the lit lane bar drains as you hold; an early release leaves a red remainder; a too-long hold tints the next note.
  - Optional Learn mode 'hold to advance': the wait does not release until the note's length has been held.
  - Open: how harsh the penalty feels for a beginner, and whether a long hold should score at all with the pedal down.

### Phase B: velocity statistics (about 5-6 h)

- [ ] Capture velocity (0-127) on every graded press and keep it on the result: per-note, mean, spread, per-hand, per-pitch region.
- [ ] Lifetime statistics in IndexedDB (same pattern as the drill stats: moving averages, per song and per exercise), a Touch page with session history and trend, and a velocity histogram plus left-versus-right balance on the results card. Include in the JSON export.
- [ ] **Personal calibration.** Velocity depends on the keyboard's touch setting and the player. A short exercise (ten soft, ten medium, ten loud notes) sets the player's own bands; defaults until then: soft 1-45, medium 46-85, hard 86-127, or the six dynamics pp to ff.
- [ ] Optional 'play as written' for MIDI files that carry dynamics: compare your velocity to the file's, relative to your calibrated range.

### Phase C: technique exercises (about 10-14 h)

- [ ] A **Technique** page next to Songs and Read music: generated scales, arpeggios and five-finger patterns with targets for timing (existing), hold (Phase A) and velocity (Phase B).
- [ ] Targets drawn on the note itself: soft, medium, hard as a coloured band or glow height on the falling bar and a dynamic mark on the staff; the judgement says 'soft ✓' or 'too hard'.
- [ ] Exercise kinds: steady soft/medium/hard; crescendo and decrescendo across a scale; accents on beat one; evenness (every note within a tight band of your own mean); melody over accompaniment (right hand louder than left); staccato and legato by hold length.
- [ ] Mastery and progress per exercise with the same meter used in Read music.

### Cross-cutting

- Event pipeline: carry `{ on, pitch, velocity, ts }` plus pedal into `Game.press/release` and `Judge.release`; keep `Judge` pure so it stays testable.
- Timing honesty: release timestamps go through the same calibration offset as onsets; Bluetooth jitter will blur short holds, so USB is recommended for Strict hold scoring.
- iPad: everything above works in the Capacitor app because MIDI arrives through the same shim (the native plugin already forwards note-offs and velocity; it drops controller messages today, so CC64 needs a one-line change in `PianoNative.swift`).
- Tests first for the pure parts: chord naming, hold grading, velocity banding.
