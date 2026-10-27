# Polish 6 (branch feature/critique)

An impeccable critique, then polish, of what was added since polish4: Theory (all trainers, ear, pulse, rhythm, question and answer), Scales (page, quiz, stage), Read (Stages, Sight Run, builder with Paced, results), Today, Progress, the Songs open library (2,241 pieces), Technique with Pedal, the results card and its coach lines, the Settings drawer and Credits. Headless Chrome only (Playwright, the dev harness, `window.__piano`, swiftshader), at 820x1180, 1180x820 and 590x1000, touch emulated, on an empty profile and on a seeded one (24 days of practice, 70 history entries, nine solid reading stages, tech and scale stats, a Ready piece). Nothing here was run on the iPad, with VoiceOver, with the silent switch or with the FP-10.

Method: single context, not the two isolated assessors the critique playbook asks for (this pass ran inside a delegated agent). The design review was done from screenshots first; the detector was run after.

## Critique

Design specificity: the neon-cabinet identity holds. The staff is calm, lamp amber is one verb per view, Ink carries every meter and chart, and the rows share one grammar. The surfaces added since polish4 are consistent with the older ones; the defects found were in the seams (narrow widths, shared selectors, a label that lied), not in the system. Heuristics, honestly: 29 of 40 (Good). Weakest: consistency (a Back button named for the wrong page, selects that clip) and recognition on Progress charts (no axis words). Strongest: status words, copy, the empty states (every one carries one sentence).

Detector (`impeccable detect --json src index.html`): 14 advisories before and after, none new: ten `design-system-font-size` in `style.css`, one each in `guide.css` and `report.css`, two `design-system-radius` (`style.css`, `readthrough.css`). They are the literal sizes DESIGN.md already lists as debt. A clean scan is not the judgement; the screenshots found everything below.

### Defects found and fixed
- **P1, Technique preview shrank to 78 px under 1000 px wide.** The polish4 rule `.thumb svg:first-child { width: 78px }` (a song row's first-bars thumbnail) also matched the Technique notation preview, `.tprev.thumb`, and beat `.tprev svg` on specificity. At 820 and 590 px the preview was an unreadable 78x29 smudge. Now `table.songs .thumb svg:first-child`; the preview is 260 px again.
- **P1, the results card's Back button said "Songs" after a scale or a Technique exercise** and went to Scales or Technique; the heading said "Song complete" for a scale. `results()` takes `from` (Songs, Scales or Technique): the button names the page it returns to, a scale or exercise reads "Run complete".
- **P2, level selects clipped on Theory** under 1000 px ("Level 1: Major and minor or", "Quarters and halve", "Major or minor on (": six of nine) because the select column was 220 px. Under 1000 px the select now sits under the blurb at up to 380 px, left-aligned with the name; the blurb also gets the whole row, so the long ones (Rhythm echo, Keep the beat) lose a line.
- **P2, Technique Dynamics select clipped at 820 px** ("Steady mediu"): the form grid's minimum is 150 px (was 130), so it is four columns at 820.
- **P2, stage tables at 590 px** (Read, Scales): three or four equal columns left the name 115 to 160 px wide, a Read blurb nine lines tall, the Fluent tag indented 10 px under the name. Under 760 px: meter column 130 px, typical time 64 px, action 110 px; the name keeps about 215 to 280 px. Tags drop under the name flush left (they did for Next only).
- **P2, Songs and library rows at 590 px:** the Best figure took a third of the row (the narrow-window rule set every column to auto) and floated between Learn and Read through. It keeps 60 px.
- **P2, library sub-line separator:** "Public Domain· 1:24" (the leading space inside an inline-block collapsed). The length is now `<span class="len">· 1:24</span>` after a real space, in the render and in the lazy update.
- **P2, copy:** the paced builder said "A clean run on two days raises it 4." (now "by 4 bpm"); Over time said "up 9 on the five before" (now "up 9 points", as the practice report already did).
- **P3, Sight Run builder:** slider labels (Tempo, Jumps, Shuffle) sat 3 px off the select labels beside them (grid `align-items: end` with a shorter control). The slider is `--control` tall.

## Not fixed, filed
- **Theory, Quiz and Technique cards are top-aligned with the on-screen keys at the bottom:** at 820x1180 a 190 px card, then 600 px of empty page, then the keys. Known layout; centring the card or pulling the keys up is a layout decision for the iPad.
- **Replay in a Theory card** sits 17 px in from the card's text edge (the ghost button's padding), against Stop at the right with the same inset. Optical, not wrong; a negative margin on the first ghost button of `.tcard .row` would do it.
- **Today plan rows:** a row that is not done leaves the 24 px lead column empty, so names start 56 px in while the cards above start text at 20 px; the piece's cover sits before the action (a trailing thumbnail), not as a lead image as DESIGN.md says.
- **Over time charts:** the dashed line is 100% and unlabelled; the 40 to 100% range is not stated; about 30 px of dead space between the curve and the figure. Evidence-led means saying the axis.
- **Credits:** source URLs are plain text, not links, and the MuseScore one breaks mid-path at the edge.
- **Copy rule:** the paced offer line has a parenthetical ("a little under your usual 1.2 s a card"); the paced results heading is the range name alone, with no status word, and the top bar keeps "Finish" over the results; Theory blurbs for Rhythm echo, Keep the beat and Question and answer run three to four lines.
- **Staff:** the "mf" letter touches the lowest head of a stacked chord in the Pedal exercise at the start card (notation layout, not touched).
- The 14 detector advisories above.

## Checks
`npx tsc --noEmit` clean; `npx vitest run` 54 files, 721 passed (1 skipped, as before); impeccable detector 14 advisories, the same 14 as before. E2E with `E2E_ONLY`, the full run not made: `^(1|2|2b|3|6|7|7b|8|11) ` and `^(1|2|3|4|6|8) ` (all Theory lanes except the pulse lane, which needs `E2E_PULSE`), 13 of 13 and 7 of 8 passed; the one failure in the first set was feature 8 asking for a Theory chart that feature 4 had not been run to make, and it passed in the second set. Screenshots were taken before and after at the three sizes for Songs and the library, Theory, Technique, Read and Scales at 590 px, and the results card for a Technique exercise.

## DESIGN.md lines to change (not applied here)
- Responsive (Layout): add "Under 760px a stage table sets the meter column to 130px, typical time to 64px and the action to 110px so the name keeps most of the row, and a tag sits under the name; a songs table keeps the Best column at 60px. Under 1000px a Theory level select sits under the blurb, up to 380px."
- Form page (Technique): "an auto-fit grid (min 150px, ...)" in place of 130px; the notation preview is 260px at every width.
- Results card (Banner, Ready card, Results card): "The Back button names the page it returns to (Songs, Scales or Technique); a scale or exercise run reads 'Run complete', a song 'Song complete'."
- Plan page: replace "with its cover as a lead image" with "its cover stands before the action".
- Over time: "the change line reads 'up n points on the five before'".
- Known quirks: delete "Theory Level selects truncate at 820px (native select)" and "Song rows ... " is unchanged; add the Not fixed list above that is still true (empty page below a Theory card, no axis words on Over time, Credits URLs not links, paced offer parenthetical).
