# Polish, fourth pass (branch feature/polish4)

An impeccable critique and polish of the surfaces added since polish3: Start here, tab notes and Help; Path ladder rows;
the pulse trainers, chord ear and question and answer; the on-screen keys; the start card (You play, Ghost); the results card
(Listen back, Compare); staff marks. Headless Chrome, touch emulated, 1180x820 and 820x1180; axe on the new states.

## Fixed
- **A one-hand piece never counted as a run of the piece.** `yourPart` called any piece with notes in one hand "your part"
  (the right hand), so its Perform runs set no Best, never counted for Ready or review, and results said "Judged on your part
  only: the right hand." Now a part needs both hands in the piece (`accomp.ts`, test in `accomp.test.ts`).
- **Results card: too many blocks.** The sentences stay in view (stat line, timing, evenness, the follow-the-score, legato,
  voicing and touch lines, the accompaniment note); the counts, timing and touch histograms, the touch figures and the evenness
  strip fold under one More disclosure. The stats are one column beside the grade, so the accompaniment note no longer lands
  under the percentage and opening More does not shift the grade.
- **Theory cards:** Replay sits at the left of the Stop row, not a row of its own. Pulse bars flex, so four bars of Keep the
  beat share a row at 820 px; captions are sentence case ("Eighths") at 13 px. The chord ear prompt lost its parenthetical.
- **On-screen keys:** the strip is a labelled region with a screen-reader description (the keys cannot be pressed with one;
  the computer keys can); the key shapes are `aria-hidden`; the octave range is announced. While the strip shows, the stage's
  "No keyboard yet" banner yields (it covered the falling notes in reading drills; the chip still connects).
  On-screen keys is also in Settings > Advanced: Hide in a reading drill was otherwise undoable only from Theory or Sight Run.
- **Staff view strip (no keyboard):** the banner covered the start card; in a strip under 260 px the Connect banner yields to
  the card, and a card with You play drops its title (the bar carries it) so it fits.
- **Songs at 1000 px and under:** a file with no cover drew its 140 px thumbnail over its title; it is cropped to the column.
- Copy: "play the on-screen keys" (not "tap", which is wrong with a mouse); "0 of 1 piece ready".

## Not fixed, and why
- Reading drills show two keyboards, the stage's canvas keys and the strip. Hiding the canvas keys while the strip shows
  needs a highway layout change in `stage.ts`/`highway.ts` (outside this pass).
- At 590 px (split view) the strip's 2 octaves give 37 px white keys, under 44. One octave would not hold the cards' ranges.
- Compare with last time colours better and worse bars mint and red: judgement hues outside a grade, but each comes with words.
- A dynamic letter is centred on its note, so the cursor crosses it as it passes: standard engraving, left as is.
- The start card in a Both pane of a landscape iPad drops onto the keys while the banner shows (as polish3).
- Theory with a card open still repeats the No keyboard line and the On-screen keys switch above the card.

## Not verified
- The iPad itself (WKWebView, real touch and safe areas); VoiceOver reading of the strip's description.
