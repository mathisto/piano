# Device checks: ten minutes on the iPad and the FP-10

Everything below was built and checked in headless Chrome only. Each line says what you should see or hear; anything else is a bug worth telling me about (say the line number).

## Before you start
1. In TestFlight, install the build named in `handoff.md` (currently 712). Confirm TestFlight says **Installed** and the Home Screen label says **Page to Hand**. An availability email is not proof that the iPad updated.
2. Open Page to Hand, FP-10 on, Bluetooth connected. The top bar's MIDI chip should name "FP-10 Bluetooth".
3. Settings, Sound on. Silent switch off.

## Sound and keys (2 min)
1. Play a few keys on the FP-10: the piano sounds with no obvious lag. If late, Settings, Calibrate.
2. Hold a key, then press the sustain pedal and lift the key: the note keeps ringing until the pedal comes up.

## Pedal coach (2 min)
3. Technique, pattern "Pedal changes", Start. Play the four chords, changing the pedal with each chord.
4. Results: one sentence starting "Pedal:" with how many changes matched. Hold the pedal down through everything and run again: it should name bars where the old chord was still ringing.

## Reading drills and Sight Run (3 min)
5. Read, Stages, start a set: only one keyboard shows (the on-screen keys), not two.
6. Read, Sight Run, Pace: Steady beat, Tempo about 50, Start. The count-in lights four segments in a slim bar above the staff; the click is audible; missing a card does not stop the run.
7. Results: "Hit n of N on the beat", a card strip, a tempo line. The button in the top bar reads "Back to Read".

## Lead sheet (2 min)
8. Songs, open a piece with two hands (for example a Lied marked "melody and piano"). On the start card pick Notes shown, Lead sheet.
9. One staff with chord symbols above it where the chord changes. Switch on "App plays the chords": play the melody and the app sounds a chord on each half bar.
10. Judge the chords by ear: are they roughly right? Wrong ones are expected now and then (about 70% of roots match an analyst on classical test pieces).

## Scales and fingerings (check against the Alfred book)
11. `docs/changes/fingers.md` has the arpeggio checklist in Alfred's page order, one line per fingering. Mark each line right or wrong; the listed alternatives are the places schools differ.

## Content Security Policy (`docs/changes/datafix.md`)
12. Launch the iPad app from Xcode with the console open: Today shows, the Songs list fills from the corpus, a piece opens and plays, and the console has no line saying "Refused" or "Content Security Policy".

## iPad shell (`docs/changes/ipad-native.md`, 3 min)
13. Set Auto-Lock to 2 minutes. Theory, any trainer: keep answering on the FP-10 without touching the screen for 4 minutes. The screen stays lit. Stop playing: it dims about 4 minutes later (two minutes of grace, then Auto-Lock).
14. Start a run. Swipe up from the bottom edge once: the home indicator appears and the run keeps going; a second swipe goes home. Swipe down from the top once: nothing opens. Back in the menus, one swipe goes home.
15. During a run the home indicator fades after a few seconds.
16. A run with Sound on and headphones in: pull the headphones out. The run pauses. Start a run and say "Hey Siri" (or let a Clock timer go off): the run pauses. Afterwards Play again sounds.
17. Listen back to a take, go to the Home Screen, come back: Listen back has stopped, with no burst of notes.
18. Long press on a link in Credits: no web page preview, nothing lifts out to drag.
19. Cold launch: a plain dark screen, no white flash, then Today.
20. Windowed mode (Stage Manager or windowed apps): do the window controls at the top left cover the Pause / Lid mark? Turn on Low Power Mode and play a run: the falling notes are expected to look less smooth (WebKit runs animation at 30 fps there).

## Report
Tell me line numbers that were wrong, plus anything that looked cramped or sounded odd. Nothing else needs doing.
