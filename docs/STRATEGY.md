# Product model: progression, sessions and feedback

Synthesis of `docs/research/learning-science.md`, `docs/research/products-and-ux.md` and `docs/research/ui-critique.md` (19 Oct 2026). This is the decision record. The roadmap carries the work; DESIGN.md carries the look.

Later decisions that change it (October 2026): row 7 is relaxed, a quiet day streak with freezes is allowed on Today and Progress (Silverman and Barasch 2023); the arcade is gone, so the effects tiers are Off and Calm and Perform shows accuracy and notes in a row, not score and combo; there are now seven places, not five (Scales and Theory were added); the Settings list has gained Touch coach, Key touch and Count-in click, plus a first-run Set up sheet.

## The one-sentence product

A practice tool that tells you what to practise today, lets you play it on your own keyboard, shows you the one thing to fix, and gets out of the way.

## What the evidence changes

| # | Finding | Decision |
|---|---|---|
| 1 | Strategy beats minutes; the effective move is stop, isolate, slow, repeat, put back | After every run, offer a loop on the two worst bars at a lower tempo. Count clean passes in a row, not minutes, as the quality signal |
| 2 | Live feedback helps now and can cap learning later (guidance hypothesis) | Live judgement stays in Perform, where it is a game. In Learn and Technique it fades; mastery is graded on unaided runs only |
| 3 | Spacing is the most robust finding | Review of read-music cards and exercises is scheduled per item (Leitner boxes 1, 2, 4, 8, 16 days), not only weighted by weakness |
| 4 | Reading is pattern recognition; isolated note names only help for landmarks | Cap the name drills at the first stages. Move to short fragments in key, then rhythm and reading ahead |
| 5 | Interleave after first exposure | First encounter of a stage is blocked; reviews mix |
| 6 | Points, badges and leaderboards do not raise intrinsic motivation; expected rewards undermine it | None of them. Reward information: your own trend, personal bests, a weekly goal |
| 7 | Streaks have no peer-reviewed support and measurably add anxiety | No streak counter. Days this week and minutes against a goal the player sets. No loss framing |
| 8 | Effort and skill need separate measures (Melodics) | Effort: days and minutes, which only go up. Skill: mastery states, which can honestly go down to Due |
| 9 | A recommended session beats a forced path; choice must stay one tap away | Today screen with one Start and a short plan, free choice beside it, nothing locked |
| 10 | Juice has a Goldilocks curve; extreme hurts | Delete the Max effects tier. Notation stays sacred |
| 11 | Wait mode needs an exit ramp | After a clean Learn pass offer the ladder: wait, 50%, 75%, full speed. Later: automatic tempo ramp |
| 12 | Velocity feedback has no controlled evidence | Keep it, frame it as measurement, target evenness before absolute level |

## Information architecture

Five places, in the order a practice day uses them (Scales and Theory were added between Read and Technique later):

**Today · Songs · Read · Technique · Progress**

- **Today** is the home screen: Continue, the next reading stage, the last technique exercise, the week.
- **Songs** is the library, unchanged in job, leaner in layout.
- **Read** is the sight-reading ladder.
- **Technique** holds the exercises and, as a settings strip, touch calibration.
- **Progress** holds this week, mastery per stage, the touch history and the data export. Touch is no longer a tab.
- Perform and Learn stay as a switch for now but show only while paused or ready.

## The session model

Today builds a short plan from data already stored: a warm-up (the last technique exercise), reading (cards that are due first), a piece (its worst bars). Each row can be skipped, nothing locks, any play counts toward the week. The plan generator and the due-state come after the design pass (roadmap Phase E).

## Feedback diet

- **During play:** judgement on the note (shape and colour plus a tick for early or late), combo above 5, the hold bar, the touch verdict on exercises. Accuracy, score and median wait for the results screen, except Perform keeps score and combo because it is a game mode.
- **After play:** one grade line, the distribution, the two worst bars with a loop button, and the next step.
- **Chrome:** the top bar fades once play starts and returns on pointer movement, Esc or Space.

## Gamification rules

1. Reward information, not currency. No points, badges, levels or leaderboards.
2. Progress numbers that can fall are allowed to fall (Solid decays to Due). Numbers that only rise are effort.
3. The week is the unit, not the day. A missed day costs nothing.
4. Nothing is ever locked. Recommendation is a default, not a gate.
5. Effects are tiered Off, Calm, Arcade. The staff never competes with them.

## Technique ordering (from ABRSM and RCM syllabi)

Five-finger patterns, then C, G, D, F major scales hands separate, then contrary motion as the first hands-together item, then arpeggios, then the remaining keys. Dynamics begin steady, then crescendo and decrescendo, then accents; evenness comes before absolute level. These unlock as suggestions, never as gates.

## Settings: six rows

Effects, Sound (Keyboard or This device, with Instrument and Volume under the second), Strictness (Easy, Standard, Strict), Keyboard (read-only, a picker only with more than one device), Timing (delay and Calibrate), Data (Export, Import, Clear). Advanced, collapsed: delay as a number, fall speed, all 88 keys, default hand split. Everything else is inline, on a key, per song, or deleted. Instant apply. No paragraphs.

## Copy rules

Label, value, nothing else. Sentence case. No parentheticals, no "please", "simply", "note that", no hedging, no explaining a control that names itself. Empty states carry one action. A fact appears once.

## Order of work

1. Settings and copy (design pass, now)
2. Play-screen diet: HUD, chrome fade, touch targets, iPad-aware layout
3. Navigation and page templates: Today, Progress, five tabs
4. Design grammar documented in DESIGN.md
5. Then, after the design is settled: exercise breadth, due-state scheduling, plan generator, tempo ramp (ROADMAP Phase E)
