# A silent pulse (branch feature/pulse1)

Horizon decision 36 asks for a silent pulse on the staff first. The owner also asked for a soft glow at the screen's edges, and for "what others have done". (`changes/pulse.md` is the pulse *trainers* in Theory; this note is the metronome you see.)

## What the research says
The full note is in the session scratchpad (`pulse/research.md`); this is the part that decides the design.
- People tap far less precisely to a flash than to a click. The fastest rate they can follow a flash is under 2.5 Hz (Repp 2006).
- A bouncing ball, something moving to a point of impact, comes close to a click (Hove et al. 2013; Iversen et al. 2015). A realistic, gravity-like path is at least as good as a linear one (Gan et al. 2015).
- Conductors' beats are read from changes of speed, not changes of direction (Luck and Sloboda).
- So a beat is read from its approach. A glow that brightens on its own is in effect a slow flash: good for peripheral "the music is moving", poor for exact time.
- Rock Band and Guitar Hero use beat lines falling on the highway. The piano apps found (Synthesia, Piano Marvel, Yousician, Melodics) show no visual pulse beyond their notes and cursor. Soundbrenner and Pro Metronome flash the whole screen or the camera light, which is built for a stage, not a music stand.
- WCAG 2.3.1: a beat at 180 bpm is already 3 flashes a second. The pulse therefore stays below the general-flash threshold at every tempo, with no step, never a full-screen fill, and beats only, never eighths.

## Built
- **Settings > Display > Pulse**: Off (the default), Staff, Edges or Beat lines. The **Metronome** in the Practice menu gains **Silent**: Off, Beats, Eighths, Silent, and B steps through all four. Silent hands no click to the audio clock (`game.metronome`) but keeps the beat dots and the pulse. "Pulse instead of click" is therefore Silent, and the click and the pulse together is Beats with a Pulse chosen. The count-in keeps its own volume (Click), as before.
- **When it shows** (`look()` in `src/beatpulse.ts`): while the metronome runs (or a paced run) and the song moves. It does not show in the count-in (it has its numerals), while Wait for me holds the song (a held clock would light it forever), in calibration, or in an unpaced reading drill.
- **One timing function** (`src/beatpulse.ts`, lazy with the stage):
  - `swell(d)` gives a beat's strength d beats before it (eased in over 0.45 of a beat, as a fall speeds up) or after it (faded over 0.25 of a beat).
  - `between(bars, t)` gives the beats since the last beat and until the next, on the metronome's own grid (`grid()`: dotted quarters in 6/8, a pickup counted back from its end, tempo changes from the bars), and how strong each is (1 on a full bar's downbeat, 0.6 otherwise).
  - `pulse()` is the larger of the beat behind fading and the beat ahead swelling.
  - Everything reads `game.t`, the song clock the clicks are scheduled from (`(beat - t) / rate` ahead on the audio output clock), so the pulse and a click land together and the judge uses the same clock.
- **(a) Staff**: an ink ball (Paper Ink 60%, 0.9 staff space across) bounces on the cursor's top tip. It follows a ballistic arc, `4f(1-f)`, of 1.5 staff spaces into a downbeat and 0.9 into other beats, and lands on each beat. It sits under the notes, in the paper's top margin (the room there is about 21 px at the default size). Reduced motion: it stays on the tip and darkens into each beat.
- **(b) Edges**: a fixed `.pulse-edge` inset box-shadow, whose opacity is the pulse, written only when it changes by 0.01. `--pulse` peaks at Ink 22% in Nocturne (on the dark ground the luminance change is under 5%) and Ink 8% in Matinée (the darker state on paper stays above 0.8 relative luminance, so it is not a flash under WCAG). Opacity only, so reduced motion needs nothing.
- **(c) Beat lines** (my pick from the research: no new object, and the approach is the cue). The highway's beat lines now sit on the metronome's grid. Before, they were at quarter-note spacing from the bar start: three lines in a 6/8 bar instead of two, and a pickup's lines started at the bar start. Each line brightens in Ink, 3px, through its last beat of fall, then fades on the keys over 0.25 of a beat.
- Files: `src/beatpulse.ts` and `src/beatpulse.test.ts` (new); small edits to `settings.ts`, `metronome.ts`, `game.ts`, `dock.ts`, `staff.ts`, `highway.ts`, `ui-drawer.ts`, `app/drawer.ts`, `metronome.css`, `style.css` (`--pulse`), `bundle.test.ts` (`beatpulse` must stay out of boot) and e2e 17b (four metronome states) and 17c (new).
- Boot JS grew by 122 bytes (`node scripts/bootmods.mjs`: 221 525 to 221 647; the setting default, Silent and the drawer handler). The budget is not raised.

## Captures (session scratchpad `pulse/`, iPad landscape 1180 x 820)
- `staff-nocturne.mp4`, `staff-matinee.mp4`, `edge-*.mp4`, `lines-*.mp4`: 15 s of Twinkle at real speed, metronome Silent. Headless Chrome on SwiftShader runs at about 15 to 20 fps, so the motion is choppier than on the iPad.
- `<look>-<mode>/f00..f16.png` and `<look>-<mode>-sheet.png`: 17 frames on a frozen clock, from the beat before a downbeat to the beat after it (Five-finger warm-up, 72 bpm). `staff-nocturne-still/` is reduced motion.

## Frame time (no added jank)
These are the milliseconds of work in each `requestAnimationFrame` callback (the Pixi ticker, which runs `game.frame`, the staff and the dock), over 60 s of Minuet in G at 112 bpm with the click on, at 1180 x 820, in headless Chrome:

| run | mean | p95 | p99 | max |
|---|---|---|---|---|
| before (main) | 0.31 | 1.3 | 2.2 | 4.3 |
| after, Pulse off | 0.31 | 1.3 | 2.1 | 4.1 |
| after, Staff | 0.28 | 1.0 | 1.8 | 3.8 |
| after, Edges | 0.27 | 0.9 | 1.7 | 4.3 |
| after, Beat lines | 0.32 | 1.4 | 2.2 | 4.5 |
| after, Pulse off again | 0.32 | 1.4 | 2.1 | 4.4 |

All are within the run-to-run noise. The interval between frames (42 to 68 ms on average) was set by SwiftShader and by other agents' runs on the same machine, not by this code, so it is not compared. The Edges overlay is a full-screen layer whose opacity changes. That is cheap in Chrome, but not measured on the iPad's GPU.

## The click in the FP-10's headphones: stopped at a note
Piano Forte has no MIDI output. `src/midi.ts` opens inputs only, and the iPad plugin (`native-midi.ts`, `PianoNative.swift`) lists CoreMIDI sources only, with no destinations and no `MIDISend`. As the brief asks, nothing was built. The ten-minute test needs no app code. In Chrome on the Mac, with the FP-10 on USB and headphones in it, paste this into the console of any page:

```js
const a = await navigator.requestMIDIAccess(), o = [...a.outputs.values()].find((x) => /FP-10/i.test(x.name)), dt = 60000 / 80, t0 = performance.now() + 500
for (let i = 0; i < 16; i++) { const t = t0 + i * dt; o.send([0x90, 108, i % 4 ? 24 : 48], t); o.send([0x80, 108, 0], t + 40) }
```

That plays 16 beats at 80 bpm on C8, accented on the bar. Then try other notes (96, 100), other velocities, and channel 10 (`0x99`/`0x89`) in case the FP-10 has a percussion part over MIDI (unverified). Listen for whether it reads as a click and whether it masks your own notes.

If it works, the app needs three things:
1. MIDI out in `midi.ts`: the chosen keyboard's output, and `send(data, performance.now() + after)` from `game.metronome` beside `audio.click`.
2. A destination and timestamped `MIDISend` in the plugin.
3. A Click from: This device | Keyboard choice.

## Not verified / open
- Everything was seen in headless Chrome only: no iPad, no real reader on a stand, no 60 to 90 cm viewing. Whether the Staff ball is too busy, and whether the Matinée Edges (capped at 8% by the flash rule) can be seen at all from the stand, are the questions the owner's trial answers.
- The Beat lines' landing is half hidden under the receptor's lamp band (the last 4px are under the receptor itself). The approach, the part that carries the time, is clear.
- The Staff ball can graze a bar number as it hops over the barline into a downbeat (seen in the captures, at the default size). In multi-line layouts it hops into the space between systems.
- Beat lines show only where the highway shows. In the Staff-only view, choose Staff.
- In a paced Sight Run the pulse also shows (if chosen) beside the beat bar, and the click still sounds. Silent applies only where the Metronome control is offered.
- Once the owner picks one look, delete the other two (`beatpulse.ts` keeps `swell`, `between`, `pulse` and `look`; drop the `.pulse-edge` CSS and `--pulse`, or the staff ball, or the `lines` branch in `highway.ts`) and turn the Pulse row into a switch.

## Decided, 1 Nov 2026

The owner liked Beat lines and asked to keep the choice. Pulse is now Off | Beat lines | Ball (stored `lines` and `staff`). Edges is removed (`.pulse-edge`, `--pulse`, the dock's swell), and a saved `edge` loads as `lines`. Beat lines need the falling notes, so with the staff alone the Ball stands in (`look()`). e2e 17c checks the Ball moves, Beat lines draw no ball, the Ball stands in on the staff alone, and Off shows nothing.
