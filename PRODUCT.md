# Product

<!-- impeccable:product-schema 1 -->

## Platform

web, plus an iPad app (Capacitor web view with a CoreMIDI plugin, developer install). The iPad is the main screen, landscape or portrait on the music stand; narrow windows (split view) reflow rather than being refused.

## Stack

Vite + TypeScript + PixiJS (WebGL highway). Fully static build, no backend. Desktop Chrome on macOS is the web target (Web MIDI); Firefox 108+ and Chromium also work. Safari and iOS have no Web MIDI, so the iPad uses the native app.

## Users

Primary: Matt, an adult beginner with a Roland FP-10 (USB MIDI to a Mac, Chrome), still learning treble clef and not yet fluent in bass clef. Practices at the keyboard, on the iPad (USB to the FP-10) or the Mac. Secondary: anyone with a MIDI keyboard who finds the public site. Design for Matt's learning first; nothing may break for strangers (first-run, no-MIDI-device state, bring-your-own files).

## Product Purpose

A practice tool for a piano or MIDI keyboard you already own. Any MIDI or MusicXML file becomes falling notes on a calm grand staff, and around that sit the other things a learner needs: sight-reading stages and runs, scales with fingering, theory and ear trainers, touch and timing coaching, and a big open library of credited scores, each with a Report a problem link. It tells you what to practise today and shows the one thing to fix. Success: the player improves at reading and playing, and wants to come back daily.

## Positioning

Open, free, no-account, in-browser. Combines what is split across other tools: Synthesia-style falling notes from arbitrary files, learn-oriented controls (wait mode, tempo, loop, hands separate), sight-reading drills in the spirit of sightreading.training, scale fingering, theory and ear trainers, and read-through of real pieces. Free with no subscription and no ads, which the Credits and Set up sheets say. Not a walled catalog like Simply Piano or Flowkey; not desktop-only like Synthesia.

## Operating Context

- Keyboard: Roland FP-10 over USB (Bluetooth MIDI works but adds latency). Keyboard's own speakers are the default sound; browser piano is an opt-in toggle, default off.
- No lit keys, no hardware lighting. "Lighting" means on-screen visual effects only.
- iPad facts (docs/research/ios-ux.md): the Air is 60 Hz and has no haptics, so neither is designed for; the screen is read from a music stand at 60-90 cm; the app is dark-only by decision (Apple allows it for immersive apps). The divider between staff and falling notes is the one view control: drag it, tap it to cycle, or use the arrow keys.
- Audio and display latency are real; a one-time calibration sets a user offset. Screen mirroring to an iPad adds display lag.
- Content: users import their own MIDI and MusicXML files (they stay in the browser). Eight starter pieces and 38 curated public-domain or openly licensed scores ship in the app; a corpus of 1,810 pieces (about 750 from Mutopia, about 1,060 OpenScore Lieder), graded 1 to 5, is served at pianoforte.mattkelly.io/corpus/ and can be saved for offline. Licences are checked per piece and credited (any free licence with credit is accepted; see docs/library.md). The repo is public, so no copyrighted MIDI is committed.

## Capabilities and Constraints

- Seven places: Today (a generated plan of 5, 10, 20, 30 or 45 minutes, the week, a weekly goal, a day streak with freezes, and for the first week a Start here card of seven suggested days), Songs (starter pieces, your files, a searchable open library with level and composer filters, offline saving and Read through), Read (sight-reading stages and Sight Run, a run you build yourself), Scales (stages, a chooser and a quiz, with fingering numbers on the staff), Theory (chord, key, interval and cadence trainers; ear trainers for notes, intervals, scale degrees, chords and question and answer; rhythm echo and pulse trainers for keeping the beat, subdivisions and holding a rhythm; all answered on the keyboard or on-screen keys), Technique (a syllabus of patterns, arpeggios, rhythm and touch exercises), Progress (this week, accuracy over time, notes you know, mastery, the Path of five levels with a ladder of named pieces to work towards at each level, touch history).
- Play: Perform (count-in, accuracy and notes in a row, no points or ranks) and Learn (wait mode, tempo ladder with Auto tempo, A-B loop, hands, hold to advance, hide played); Read through (a 30-second look-through, then one no-stop pass of an easy piece); Memorise (Learn with the score fading by bars, five stages); a practice metronome with a tempo ladder; ghost notes, chord readout, hold and pedal grading, key-velocity targets and calibration; judgement words go quiet as playing gets clean and note names fade as reading improves.
- Accompaniment practice: on a piece with several parts (a Lied's voice and piano, a duet) or two hands, choose what you play and the app plays the rest at the tempo; only your part is judged, and a part run does not count as a clean run of the piece.
- Recorder and ghost: every Perform and Learn run is kept (the last three per piece, on the device). Listen back plays a run through the app's piano; Compare with last time sets two runs side by side bar by bar; a Ghost of the last run shows faintly on the staff and in the lanes.
- Ear and pulse training: chords by ear, question and answer judged on form only, keeping a beat through silence (with drift, bias and spread apart), subdivisions and a rhythm against a click. Measurement in plain words; no claim about transfer to playing.
- Repertoire ladder: three or four named pieces for each Path level, from the library, with Not started, Learning and Ready, and a Start that fetches the piece if needed.
- On-screen keys: a tappable keyboard under Theory, the Quiz, Sight Run and reading drills when no MIDI keyboard is connected, so an iPad alone can answer; it never judges touch.
- Touch coaching: evenness of loudness, timing evenness with bias apart from spread, legato and staccato length, voicing between the hands, and on a MusicXML piece whether the written dynamics and articulation (crescendos, accents, staccato, slurs) were followed, in at most two plain lines, live marks that fade as the touch evens out, and an occasional quiet test run; a key-touch setting and a first-run Set up sheet.
- Import: MIDI and MusicXML (.musicxml, .mxl) with repeats, D.C./D.S./Fine/Coda, key changes, spelling, dynamics, and the score's own articulation, slurs, hairpins and dynamic letters drawn on the staff; a notation layer (quantization, tuplets, ties, voices) so imperfect performance MIDI reads as music; track selection, hands per track and Simplify levels for busy arrangements; credits for library pieces and sounds.
- Sound: sampled grand piano plus five lazy-loaded instruments; the keyboard's own speakers by default.
- Local only: progress, settings, practice time, imported songs and the last three runs of each piece in IndexedDB, JSON export and import. No accounts, no cloud.
- Web MIDI called directly in browsers; the iPad app reaches CoreMIDI through a small plugin that fakes the same API.
- Deploys to pianoforte.mattkelly.io as a static site on quartz behind the existing Cloudflare tunnel and Caddy. Public GitHub repo `piano` (the app is Piano Forte, PF for short: a play on "pianoforte", and on finding your forte).
- Undecided: exact judgement windows (tuned by feel; Easy, Standard and Strict scale them).

## Brand Commitments

- Visual direction is the neon cabinet at night (user-pinned): the dark room, lit lanes and the amber lamp stay. The arcade scoring went in October 2026: no points, ranks, lives, combos or fireworks.
- Sheet music must stay clearly readable. The staff is the learning objective; effects must never fight it.
- Binding anti-goals: not a kids' game, not a sterile music app, effects never obscure notation, no strobing or excess flash.

## Evidence on Hand

No existing assets, brand, copy, or song content. Nothing to fabricate from; starter songs and library scores must come from verified public-domain or openly licensed sources. Cover art is generated by the owner (docs/art/covers.md).

The product follows evidence, kept in docs/research/ and docs/STRATEGY.md. The sources by name:
- Learning science: a review of practice research (testing and spacing are strong; "guidance hypothesis" says live feedback helps now and can cap learning later, so marks fade and some runs are unaided); Duke, Simmons and Cash 2009 for stop, isolate, slow, repeat and put back; Mishra 2014 (sight-reading grows with volume of new easy music, so Read through points at real pieces); Silverman and Barasch 2023 (streaks with repair or freeze); Hanus and Fox 2015 and Deci 1999 (points and expected rewards do not raise intrinsic motivation).
- Products and UX: leafo's open source sightreading.training, a survey of 16 apps (Melodics' separation of effort from skill among them), an independent UI critique and iPad UX notes.
- Syllabi: ABRSM, RCM and Trinity graded requirements for the order and tempi of scales and technique, used with generic level names and no implied endorsement.
- Theory, ear and rhythm survey for the trainers.
Beliefs the evidence does not support are not built on: more minutes alone, learning styles, "more feedback is always better", slow practice as proven, gamification as a sure motivator, music making you smarter. Key velocity feedback has no controlled evidence, so touch features are measurement, not pedagogy.

## Product Principles

1. Practice first, game second: juice rewards learning behaviour, it never replaces it.
2. Notation is sacred: neon is for state and feedback, the staff stays calm and legible.
3. Friendly to a learner: training wheels (note names, wait mode, slow tempo) are on by default and fade as mastery grows.
4. Timing honesty: calibrate for the real chain (keyboard, USB/BLE, audio, display) and be explicit about what is measured.
5. Local and open: no accounts, user files stay in the browser, nothing copyrighted ships, every library score is credited under its own licence.
6. Free: no subscription, no ads, no account, and the app says so.
7. Skill over points: reward information (your own trend, mastery that can fall, a weekly goal, a quiet day streak), never points, ranks, lives or leaderboards. Effort only goes up; nothing is locked; a recommended plan is a default, not a gate.
8. Evidence-led: choices cite research or say they are bets; features that measure (touch, timing) are framed as measurement.

## Accessibility & Inclusion

Feedback uses shape and position as well as colour. An Effects switch (Off or Calm), `prefers-reduced-motion` support, and a cap on flash rate (no strobing). Full keyboard operability of menus; the highway itself is MIDI-driven. Note-name labels optional for learners.
