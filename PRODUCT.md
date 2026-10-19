# Product

<!-- impeccable:product-schema 1 -->

## Platform

web, plus an iPad app (Capacitor web view with a CoreMIDI plugin, developer install). The iPad in landscape is the main screen.

## Stack

Vite + TypeScript + PixiJS (WebGL highway). Fully static build, no backend. Desktop Chrome on macOS is the web target (Web MIDI); Firefox 108+ and Chromium also work. Safari and iOS have no Web MIDI, so the iPad uses the native app.

## Users

Primary: Matt, an adult beginner with a Roland FP-10 (USB MIDI to a Mac, Chrome), still learning treble clef and not yet fluent in bass clef. Practices at the keyboard, on the iPad (USB to the FP-10) or the Mac. Secondary: anyone with a MIDI keyboard who finds the public site. Design for Matt's learning first; nothing may break for strangers (first-run, no-MIDI-device state, bring-your-own files).

## Product Purpose

Turn any MIDI file (v2: MusicXML) into a falling-notes game on the keyboard you own, and make it a real practice tool, not only a game. Success: the player improves at reading and playing, and wants to come back daily.

## Positioning

Open, no-account, in-browser. Combines what is split across other tools: Synthesia-style falling notes from arbitrary files, learn-oriented controls (wait mode, tempo, loop, hands separate) and, in v2, sight-reading drills in the spirit of sightreading.training, with rhythm-game scoring and juice. Not a walled catalog like Simply Piano or Flowkey; not desktop-only like Synthesia.

## Operating Context

- Keyboard: Roland FP-10 over USB (Bluetooth MIDI works but adds latency). Keyboard's own speakers are the default sound; browser piano is an opt-in toggle, default off.
- No lit keys, no hardware lighting. "Lighting" means on-screen visual effects only.
- Audio and display latency are real; a one-time calibration sets a user offset. Screen mirroring to an iPad adds display lag.
- Content: users import their own MIDI files (stay in the browser); a few public-domain pieces ship (Mutopia / OpenScore, license checked per piece). The repo is public, so no copyrighted MIDI is committed.

## Capabilities and Constraints

- Five places: Today (a generated plan, the week, a weekly goal), Songs (starter pieces, your files, an open library of credited public-domain and openly licensed scores), Read (sight-reading stages), Technique (a syllabus of scales, arpeggios, rhythm and touch exercises), Progress (mastery, touch history).
- Play: Perform (scored, count-in) and Learn (wait mode, tempo ladder with Auto tempo, A-B loop, hands, hold to advance, hide played); ghost notes, chord readout, hold and pedal grading, key-velocity targets and calibration; judgement words go quiet as playing gets clean and note names fade as reading improves.
- Import: MIDI and MusicXML (.musicxml, .mxl) with repeats and dynamics; a notation layer (quantization, tuplets, ties, voices) so imperfect performance MIDI reads as music; track selection, hands per track and Simplify levels for busy arrangements; credits for library pieces and sounds.
- Sound: sampled grand piano plus five lazy-loaded instruments; the keyboard's own speakers by default.
- Local only: progress, settings, practice time and imported songs in IndexedDB, JSON export and import. No accounts, no cloud.
- Web MIDI called directly in browsers; the iPad app reaches CoreMIDI through a small plugin that fakes the same API.
- Deploys to piano.mattkelly.io as a static site on quartz behind the existing Cloudflare tunnel and Caddy. Public GitHub repo `piano`.
- Undecided: exact judgement windows (tuned by feel; Easy, Standard and Strict scale them); name beyond "piano".

## Brand Commitments

- Visual direction is neon arcade (user-pinned).
- Sheet music must stay clearly readable. The staff is the learning objective; effects must never fight it.
- Binding anti-goals: not a kids' game, not a sterile music app, effects never obscure notation, no strobing or excess flash.

## Evidence on Hand

No existing assets, brand, copy, or song content. Nothing to fabricate from; starter songs must come from verified public-domain sources.

## Product Principles

1. Practice first, game second: juice rewards learning behaviour, it never replaces it.
2. Notation is sacred: neon is for state and feedback, the staff stays calm and legible.
3. Friendly to a learner: training wheels (note names, wait mode, slow tempo) are on by default and fade as mastery grows.
4. Timing honesty: calibrate for the real chain (keyboard, USB/BLE, audio, display) and be explicit about what is measured.
5. Local and open: no accounts, user files stay in the browser, nothing copyrighted ships.

## Accessibility & Inclusion

Feedback uses shape and position as well as colour. A chill/effects slider, `prefers-reduced-motion` support, and a cap on flash rate (no strobing). Full keyboard operability of menus; the highway itself is MIDI-driven. Note-name labels optional for learners.
