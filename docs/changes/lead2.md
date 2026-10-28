# Lead sheet, round two (the four open items of lead.md)

Branch `feature/lead2`. Headless Chrome only: no iPad, FP-10 or speakers.

## 1. Notes shown on a short stage

Cause: the compact start card rule (e2e bug 5, stage under 420 px) hid `.cap` and every `.seg ~ .seg`, so at 1180x820 in the default Both view the card had no Notes shown row.
Fix: the row stays, laid out like You play already is on a short stage: caption and segmented choice on one line, no new control. The cap and seg are wrapped in `<div class="shows">` (`play.ts`); `accomp.css` gives `.shows` the same one-line flex rule as `.accomp`; `style.css` no longer hides `.seg ~ .seg`.
To keep the card inside the stage once it carries three rows plus Lead sheet's switch:
- on a short stage with a Notes shown row, the mode line ("Scored. The song does not wait.") goes: the Play button says it;
- the chord switch and its "Chords from the harmony..." line are wrapped in `.chords` and sit side by side on a short stage (one row, not two);
- a Lead sheet card with the Connect banner up drops onto the keys like the You play card (`accomp.css`, `:has(:is(.accomp, .chords))`), because Lead sheet has no You play row and was left at 38% centred, under the banner (seen at 820x1180).
- under 260 px (the staff-only strip, 123 px at 1180x820) Notes shown is hidden again, as before; V reaches it.
Measured with the banner up, Die Rose, die Lilie at 1180x820 (stage 403 px): card 273 px with Lead sheet chosen; the stage above the keys is 298 px. At 820x1180 (stage 619 px): card 449 px. Screenshots looked at: both sizes, Notes shown on Melody and bass and on Lead sheet, with and without the banner (1180x820), the 123 px strip. Not looked at with a real keyboard connected, or on an iPad.
e2e 7b no longer presses V first.

## 2. "App plays the chords" is kept

`Settings.comp` (default false, in `piano.settings`, so Export, Import and Clear already cover it). `Game.comp` is gone; `game.ts` reads `settings.comp`. Only a lead sheet has chords, so on any other level it plays nothing. The switch still shows only on Lead sheet.

## 3. What a run at a reduced Notes shown level records

Before: `results.ts` ignored the level, so a Melody (and Thin chords, Melody and bass, Lead sheet) run counted as a run of the piece: Best, plays, the review box, and Ready (clean on two different days). Melody counted; this is a fix for it too.
Now: any level above Full is a partial run, the same as a part run (`who`): heat is kept, but no Best, no play count, no box step, no day toward Ready, no `clean` flag. The history row is labelled "<title>: Lead sheet" (as "<title>: your part"). The results card says "Notes shown: Lead sheet, not the whole piece, so this run does not count toward Ready."
Why every level and not only Melody and Lead sheet: Ready is "clean on two different days at 90% of the written tempo" of the piece as written. Thin chords and Melody and bass also leave notes out. Two consequences to know: a busy piece that opens at an automatic level above Full will not count until the player chooses Full (the results line says why), and the ladder's Ready, the practice report's Ready and the review boxes are fed by Full runs only. To narrow it to Melody and Lead sheet, change `lv > 0` in `app/results.ts` to `lv >= 3`.
Not done: the Ready tag still carries no title saying so (open in truth.md).

## 4. e2e feature 21

`E2E_ONLY='^21 '` (32 s, in the third lane): Die Rose, die Lilie (bundled melody and piano Lied) opens with a left hand; no chord switch before Lead sheet; Lead sheet chosen from the card in the default Both view at 1180x820; no left-hand note in the song; `#staff .cname` count above 0; axe clean on the Lead sheet card; the switch kept in `piano.settings` and ticked on reopening; a Perform run at 125% says it does not count toward Ready and leaves no `days`, `best`, `plays` or `box` in `prog:lib:lieder-lc4976849`.

## Tested

`npx tsc --noEmit`; `npx vitest run` (56 files, 748 passed, 1 skipped; `lead.test.ts` sets `settings.comp`); E2E_ONLY for 21, 7b, 7, 11, 15, 1, 2, 5, 13, 16 all pass. Not the full suite. 9a, 9b and 10 need the day's earlier features (run alone they fail on "nothing stored under drill:stats", which is not this change).

## Still open

- Nobody has listened to the chords (lead.md 1), and the chords are guesses (3); the accessible name of the staff does not carry them (5); root-fifth pattern and a different voice are not built.
- Notes shown stays hidden on the staff-only strip (under 260 px).

## Lines for ROADMAP.md and DESIGN.md (for the lead to apply)

ROADMAP: close the lead.md items 2 (Notes shown on a short stage), 4 (Lead sheet and Melody runs counted) and 7 (e2e feature), and the per-device switch in 6. Add: "Ready tag title: say that only full-piece runs count (levels above Full do not)".
DESIGN.md:
- Start card: "On a short stage (under 420 px) Notes shown is one line, caption and choice side by side, like You play; the mode line is dropped and Lead sheet's chord switch and its line share a row. Under 260 px the row is hidden."
- Lead sheet line: add "The 'App plays the chords' switch is a device setting, kept."
- Ready rule / results: "A run at a Notes shown level above Full is not a run of the piece: heat only; no Best, no Ready day, no review box; the results say so."
