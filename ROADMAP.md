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
