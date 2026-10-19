# Products and UX patterns: what the best do, and what piano should change

Research date: 2026-10-19. Scope: practice products, rhythm-game design, settings and focus UX, progression UX, measured against the current app (PRODUCT.md, ROADMAP.md, `src/ui.ts`, `src/settings.ts`).

Evidence tags used throughout:

- **[V]** read on the primary page or paper in this session.
- **[S]** secondary: a review, aggregator or search-result snippet. Treat as plausible, not proven.
- **[M]** from memory, not re-checked this session. Verify before quoting.

Gaps up front: sightreading.training is a client-rendered app and returned no content, so nothing below describes it beyond its README. Apple's HIG pages are JavaScript-rendered and could not be read. Yousician's help centre, Simply Piano and flowkey store pages blocked fetching (403). The "Master Studies" feature named in the brief did not turn up on Piano Marvel's pages or in any review; I could not confirm it exists under that name.

---

## 1. TL;DR: the ten lessons that matter most

1. **Separate effort from skill.** Melodics keeps two measures: Stardom/XP says "time and effort, not skill", Stages say skill. XP has no daily or weekly cap, and it replaced an older Levels-and-Stars system [V]. Effort numbers that only go up cannot shame anyone; skill numbers are allowed to be honest. Piano today shows only skill (mastery meters) and has nowhere to put effort.
2. **Offer a recommended session, never a gate.** Melodics' Weekly Goals are "a suggestion, not a requirement" and called "your first stop when you open the app" [V]. Duolingo's single forced path drew its loudest complaint from losing the choice of what to learn next [S]. Build a "Today" session that is one tap, with free choice one tap beside it, and lock nothing.
3. **Show diagnostics after play, not during.** The flowkey reviewer who asked for "a summary of errors after finishing a piece rather than being stopped at each mistake" [V, App Store reviews page], Rocksmith+'s post-track feedback and Phrase Banner [V], and osu!'s average-hit-error and Unstable Rate on the results graph [V] all point the same way. During play, show only what can be acted on inside a note.
4. **Scoring must be legible.** Melodics' points-above-100 scoring draws "why do I now have 1,599 points?" and "penalizes you so much for even the slightest error" [S]. Piano's accuracy %, hold % and touch % are already easy to read; keep them as percentages with a word, and do not add a second currency.
5. **Practice tools are table stakes, and one is missing.** Loop, slow-down, wait mode and hand separation are everywhere. Melodics also ships **Auto BPM**: after you slow a track, the tempo rises 10 BPM each time you play well until it reaches the natural tempo [V]. Piano has the tempo slider but no automatic ramp.
6. **Wait mode needs an exit ramp.** Reviews warn it "can weaken rhythmic accountability" and suggest the ladder wait, 50%, 75%, full speed [S: pract.is, pianodreamers]. Suggest the next rung when a section is cleared.
7. **Juice follows a Goldilocks curve.** Kao (2020), N = 3,018 in an action RPG: no juice and extreme juice both reduced play time, experience, motivation and performance versus medium and high [S: abstract via search; paper paywalled]. Piano's "Max" effects tier sits on the wrong side of that curve and conflicts with "notation is sacred".
8. **Streaks work and also harm.** Duolingo's own numbers: a 7-day streak correlates with 3.6x course completion; two streak freezes added only +0.38% relative daily actives [V, Duolingo blog]. The L@S 2022 study of 357 forum posts, 30,618 comments and 15 interviews found leagues and streaks pushing users to farm points, cheat, and feel anxious or guilty [V]. If piano has any streak, make it weekly and forgiving.
9. **Settings: few rows, strong defaults, context for the rest.** Google's Android guidance: "contain a manageable number of options", frequently accessed actions "should be contextual to the feature they most affect", and defaults should represent "the default most users would choose" [V]. Piano's drawer has 12 controls plus six explanatory paragraphs. The proposal in section 5 has 6 rows and 4 collapsed.
10. **Copy: label, value, nothing else.** Material: "brief and meaningful" labels in sentence case, and no generic verbs such as Set, Change, Manage, Choose [V]. Google: no "please", "simply", "please note" [V]. Every parenthetical and every "Off by default:" paragraph in the drawer is a rewrite candidate (section 4.4).

---

## 2. Comparison table

| Product | IA / first screen | Session framing | Progression | In-play feedback | Settings | Main complaints |
|---|---|---|---|---|---|---|
| **Melodics** | Weekly Goals first, then courses, lessons, songs, Playground [V] | Optional weekly set resetting Monday; free play anywhere [V] | 15 Stages per instrument, unlock in order, gated by 3 dials (Warm-ups, same-grade lessons, songs); XP/Stardom for effort [V] | Per-note timing and note streak; hit, miss, early, late [S] | Not documented; practice mode panel (BPM, Auto BPM, loop, wait) [V] | Harsh scoring; points scale unclear; 5 min/day free cap, high price [S] |
| **Piano Marvel** | Dashboard: Library, Method, Technique, Sight-reading; trophy cabinet; reports [S] | Self-directed; monthly minutes goal; teacher logs [S] | SASR 100-1900 across 18 levels / 90 sublevels; bronze/silver/gold trophies; golden tickets for 100% [V/S] | SASR: red strike icon top left, score at end of piece [V] | Dropdown taskbar with MIDI setup [S] | Dated UI; a daily SASR stops being a valid measure (forum, hearsay) [S] |
| **Simply Piano** | Linear course path; two free courses; 5-minute workouts [V/S] | Linear lesson plus short workouts | Linear, two tracks after foundations (Soloist, Chords); points [S] | Mic or MIDI; green right, red wrong; Wait Mode [S] | Minimal; no desktop | Paywall mid-lesson, billing and refund disputes, mic misreads [S] |
| **flowkey** | Songs and courses; difficulty filter [S] | Song-led; learn, listen, play | Course ladder plus song levels; no strong skill meter [S] | Wait mode, 50/75/100% ladder, loop, hands apart | Small | Mic detection (top complaint), clicks to start, wait-mode skipping, songs removed [V/S] |
| **Yousician** | Home with a Daily Session shortcut into Learn > Path; Workouts tab [S] | Daily session; goal in stars or minutes [S] | Levels > missions > tasks; free skipping to any mission [S] | Perfect / early / late labels, then score and stars [S] | Not documented | Paywall, minutes cap, pitch detection [S] |
| **Synthesia** | Song list; falling notes core [V] | Free choice | None built in beyond per-play feedback and long-term tracking [V] | Falling notes, optional staff, finger hints [V] | Many display options; Free Play gear menu [V] | Most songs paid; dated feel (3.8 on App Store, aggregator) [S] |
| **Rocksmith+** | Lessons (video + Practice Track), songs, Riff Repeater [V] | Target per track: 80% accuracy at 100% speed [V] | Mastery per phrase; adaptive difficulty [S] | Notes thin out and return with performance; Phrase Banner after a track [V/S] | Practice presets, density presets [S] | Subscription, library, stability [S] |
| **Duolingo** | One vertical path; Quests tab [V] | Daily lesson; streak; leagues | Path ordered by spaced repetition; half-life regression behind it [V] | Instant right/wrong, celebration screens | Few | Lost choice, lost visible progress, league pressure and cheating [V/S] |
| **sightreading.training** | Not retrievable | Not retrievable | Not retrievable | Not retrievable | Not retrievable | Not retrievable |
| **Pianoforall** | 10 ebooks plus videos, chord-first [S] | Self-paced curriculum | Linear books | None (offline) | None | "Confusing structure", thin note reading, dated [S] |

---

## 3. Per-section detail

### A. Practice and learning products

**Melodics** (drums, keys, pads; MIDI required).

- *Progress model [V].* Support pages "Your guide to progress" and "Stages" describe four connected systems. XP and Stardom reward time: "Stardom is your overall rank... a measure of how much time and effort you've put into your practice, not how skilled you are." Stages test: 15 per instrument, unlock in order, no skipping. Each Stage has three dials (that Stage's Warm-ups, lessons at the same Grade, songs at the same Grade); all green means you may attempt it. Passing is "roughly equivalent to earning at least three stars on a lesson". Retries are unlimited and the page tells a stuck player to go back to Warm-ups or use Rehearse to loop.
- *Weekly Goals [V].* Curated lessons matched to your Stage, new set every Monday at local midnight, bonus XP only for the first play that week, older goals stay playable, "You can play anything in Melodics at any time."
- *Scoring [V/S].* Timing precision per note plus a note streak that a miss resets. Stars are 1, 2, 3 and Platinum; scores run above 100, so a lesson is never "finished". This is the part users dislike: a paid subscriber says it "penalizes you so much for even the slightest error" that mostly-right playing still fails (omarimc.com review); an App Store reviewer preferred the old percentage display. Stars were partly retired for XP, Stardom and Stages [V].
- *Practice mode [V].* BPM slider (down to zero, or above natural tempo), Auto BPM (+10 BPM after each good pass up to natural tempo), loop with keyboard shortcuts `;` `'` `[` `]`, wait mode. Chunked steps inside each lesson.
- *Money [S].* Free tier is capped at about 5 minutes of practice a day; paid is quoted at $29.99 a month or $149.88 a year by one review, $9.99 by another; confirm before quoting.
- *Emulate:* the effort/skill split, optional weekly set, Stage dials as a readiness checklist, Auto BPM. *Avoid:* open-ended point scores, Platinum-as-never-finished.

**Piano Marvel** (closest relative of the Read music feature).

- *SASR [V].* Pick beginner, intermediate or advanced start; 20 seconds to look at the excerpt, then a countdown; 80% or more earns a harder piece; below 80% is a strike shown as "a red strike in the page's top-left corner"; three strikes end the test. Score 100-1900, "each increase of 100 represents one level"; the site lists an average of 405. Excerpts are 90 difficulty levels (1a to 18e) rated from averaged scores of a team of sight-readers, and next excerpts are chosen from your tracked scores.
- *Structure [S].* Dashboard areas: Music Library, Method, Technique, Sight-reading; separate trophy cabinets for Method and Technique; seven-day report cards; monthly practice-minutes goal; last 10 SASR tests listed.
- *Caveat [S, forum].* Users note that taking the test daily destroys its value as a measurement. A test needs to be rationed; a drill does not.
- *Emulate:* the 20-second preview (maps to the ROADMAP item "reading-ahead mode"), strike display as a tiny corner mark, an adaptive ladder with a stated pass line. *Avoid:* a single big score as the only progress readout.

**Simply Piano** (JoyTunes). App Store: 4.7 from about 858K ratings, two courses free, premium unlocks the rest, 5-minute personalised workouts, slow-down tool [V]. A review describes a linear path from middle C that splits after two foundation courses into Soloist and Chords tracks, green/red note feedback, Wait Mode, and "points" [S]. Annual price quoted at $169.90 with a 14-day trial [S]. Complaints cluster around paywalls mid-lesson, auto-renewal and refunds, and microphone misreads (Trustpilot and ComplaintsBoard, unverified, so weigh lightly). *Avoid:* mid-lesson interruptions and any billing pressure; none applies to piano as it has no accounts, but the lesson is that a pause that sells is the most-hated moment in the category.

**flowkey.** App Store: 4.7 from about 66K ratings [V, reviews page]. Praised: slow-down, repeat, wait mode, hands visible. Complained about: microphone note detection (most common), wait mode skipping or jumping the score, "too many clicks" to start exercises, price (about $120 a year), and the wish for an end-of-piece error summary. Third-party review: Free is 8 songs; paid tiers $99.99 to $149.99 a year [S]. A critique says the huge song library "can encourage sampling instead of finishing pieces" [S]. *Avoid:* click-to-start friction and per-mistake stops.

**Yousician.** Home tab has a **Daily Session** shortcut into the Learn path; missions grouped by difficulty and skippable; session goal can be set in stars or minutes; Workouts tab is where you replay for missing silver and gold stars [S: support-page snippets]. Instant "perfect", "late", "early" labels and an end-of-session score and star rating [S: StriveCloud marketing page; its 61% motivation statistic has no source]. Free play is time-capped and the category's top complaints are the paywall and pitch detection [S]. *Emulate:* one shortcut on Home for the day's session, and a session goal in minutes.

**Synthesia** [V, official page]. Melody Practice waits for the correct note; hands separately; falling notes are the core display; notation optional; finger hints; MusicXML import since 10.8; free version limited, one-time unlock. No progression system. Piano already exceeds it on feedback; the lesson is how much it gets away with by being a tool, not a course.

**Rocksmith+** (now includes piano [V]). Each lesson is a video plus a short **Practice Track**; target "80% accuracy at 100% speed"; a Phrase Banner shows trouble spots afterward; mastery is locked on Practice Tracks and the advice for a hard one is "slow the speed, use Riff Repeater, or use Note by Note" rather than lowering difficulty [V, Ubisoft dev diary]. Riff Repeater loops a passage with speed and difficulty options [V/S]. Adaptive difficulty adds and removes notes with performance (store listing [S]; forum posts on Rocksmith 2014 say mastery is scored separately from the difficulty setting, which is hearsay). Launch pricing $14.99 a month to $99.99 a year [S]. *Emulate:* one stated pass line per exercise, trouble-spot summary after the run.

**Pianoforall.** $49 one-time, 10 ebooks, about 24.5 hours of video, chord-first [S]. Reviews split on structure ("confusing", "doesn't create solid foundations") and note-reading depth; several pro-Pianoforall pages are promotional and ignored. Lesson: a curriculum without feedback needs a very clear order; piano's drills supply feedback, so order matters less than choice.

**Duolingo.**

- *Half-life regression [V, ACL 2016 paper].* Models the "half-life" of each item in memory, reduced recall-prediction error by 45%+ versus baselines, and raised daily student engagement by 12% in an operational study. Spaced-repetition ordering then drives the path.
- *Path [V, Duolingo blog].* A single vertical path of circles; practice is folded into it ("framed as forward progress rather than returning to old lessons"); a jump-to-current arrow; tapping a node opens a topic popup. Critics lost choice and the colour-coded view of what was mastered [S: NBC, UX Collective].
- *Streaks [V, Duolingo blog].* Milestone animation: +1.7% 7-day retention for new learners; two equippable freezes: +0.38% relative daily actives; 7-day streakers 3.6x more likely to finish a course (correlation). Duolingo itself says a broken streak "can feel demotivating" and frames freezes as slack. The widely repeated 21% churn and 14% wager lifts could not be traced to a primary source [S].
- *Harm [V, L@S 2022].* Leagues produced herding, cheating accusations and "I was literally seeing real learning as an obstacle"; one user: "My brother lost his 110-day streak, and now [he] is an abandoned account." Some users asked for a weekly streak. Interviewees would remove hearts outright [S].
- *Emulate:* the decay model (items return when due), the celebration on streak extension, slack. *Avoid:* leagues, hearts, any streak that can be lost in one day.

**sightreading.training.** Its README says it is "a tool for practicing sight reading, learning songs, and training other musical skills in your browser", with login and stats needing a backend. Nothing else retrievable; it remains the right positioning reference for piano but not a verified source for any pattern here.

### B. Rhythm games and juice

**What is verified.**

- *Clone Hero [V, manual].* Multiplier rises every 10 consecutive notes to 4x; star power doubles it; an optional **hit-window display** exists in the profile menu; practice mode lets you choose sections and change speed mid-play; quick play deliberately cannot change speed or difficulty. Star rating reflects average multiplier (3 stars at 1.0x, up to 7 at 4.4x).
- *Friday Night Funkin' [V, docs/wiki].* Four ratings (Sick, Good, Bad, Shit) with timing windows near 45, 90, 135, 160 ms; Bad and Shit give less health; a miss resets combo; a split health bar with character icons is the whole status display.
- *osu! [V].* Unstable Rate is the standard deviation of hit errors times 10; "UR reflects consistency, not the size of the errors"; average hit error and UR appear on hover over the results graph. The point for piano: accuracy and evenness are different numbers, and evenness is exactly the "touch" and timing consistency goal.
- *Early/late cues [S, forum posts].* Quaver uses an accuracy bar, Project DIVA tilts the judgement icon, IIDX flags notes fast or slow, and some games show only an end-of-song counter. Players disagree on whether an in-play cue helps or is invisible in dense passages.
- *DDR [S].* Marvelous/Perfect/Great/Good/Boo/Miss ladder; Full Combo ring on the grade shows the worst judgement earned.
- *Beat Saber [M/S].* Multiplier 1x to 8x dropping on a miss; score is mostly swing quality; community mods exist to add colour to the HUD [S]. From memory the stock HUD is a small score and combo cluster; I could not find a developer talk on HUD design, so treat "minimal HUD" as observation, not a stated principle.
- *Juice evidence [S/V].* Jonasson and Purho's talk argues juicier is more fun but gives no caveat on overuse [V]. Kao 2020 is the only controlled evidence found: medium and high beat none and extreme, N = 3,018 [S]. A CHI 2024 paper on juicy feedback exists but could not be read.
- *Distraction evidence.* No eye-tracking study of rhythm-game players turned up. Adjacent work says edge-placed HUD elements work with coarse peripheral vision and that fast players lean on peripheral vision [S].

**Implications for piano (inference, not source claims).**

- Judgement should be on the note, not in a popup. Peripheral vision catches colour and position change at the receptor; text needs a fixation.
- Show an early/late direction only on non-perfect hits, as a 2-3 px shift or a small tick, since a constant bar competes with the staff.
- Combo and multiplier read as numbers only at a glance; keep one.
- Results screens in the best games lead with one grade, then the distribution; osu!'s second-line detail (UR, average error) is where piano's touch spread belongs.
- Practice mode is separate from scoring in Clone Hero; Perform and Learn already follow this.
- Notation legibility rule: effects live on a layer behind and beside the staff, never over the noteheads, and the Calm tier is the benchmark for the staff view.

### C. Settings and focus UX

**Settings principles with sources.**

- Android/Material [V]: "Provide an overview", group related settings, for 15 or more settings use subscreens, add search "for complex or deep settings hierarchies", "Respect system settings", "Don't include frequently accessed actions. These should be contextual to the feature they most affect." Material 1 [V]: settings should hold "a manageable number of options", labels "brief and meaningful", sentence case, no negative terms like "Don't" or "Never", no generic verbs (Set, Change, Edit, Modify, Manage, Use, Select, Choose), group with dividers rather than a divider per row, no "Other" or "Miscellaneous", app version and licences belong on a Help or About screen, not Settings. Neither page addresses instant-apply.
- Apple [S: archived iOS guide via search]: most apps can avoid Settings by letting people choose in the main UI; preferences are "set once and rarely change"; "De-emphasize settings." Current HIG not read.
- NN/g and Moodle dev guide [S]: defer secondary options to a subsidiary screen; hidden options need defaults so the app "does the Right Thing"; show the default next to the control so it can be restored.
- Games [S]: apply and preview instantly, offer reset per tab and globally, one preset control over many knobs, an expandable advanced section (Game Developer checklist; indie guides).
- Linear [S]: "I don't think you can build the optimal tool for anything if it's very flexible or endlessly customizable." Opinionated defaults are the position, not an omission.
- VS Code [V]: a single search box over thousands of settings; **Zen Mode** hides all chrome, centres the editor, toggled by a chord, exits by double Esc.
- OBS [S]: a Simple/Advanced output mode switch hides detail by default. Ableton [S]: preferences are tabs by task (Look/Feel, Audio, Link/Tempo/MIDI, Record/Warp/Launch). Figma [S]: Show/Hide UI on Cmd+\\. MuseScore, Logic and Spotify were not verified.

**Screen focus during a session.**

- Auto-hide chrome after activity starts and bring it back on pointer move, Esc or pause. VS Code Zen and Figma Hide UI are the templates; both are one-key.
- Keep controls inside the stage as thin edge handles rather than a top bar.
- The Kao result supports a medium effects ceiling; the PRODUCT.md anti-goals already say "no strobing or excess flash".

**UI copy smells and rules.**

Verified smell list (Wikipedia "Signs of AI writing", written for article text; the underlying habits transfer to UI text) [V]: "serves as/stands as" for "is", negative parallelism ("not just X, it's Y"), the rule of three, hedging disclaimers, excessive boldface, title-case headings, tails like "highlighting...". Em-dash overuse has its own section I could not read, so it stays hearsay [M]. Smells specific to UI copy that come from reading piano's drawer, not from a source:

- Parenthetical asides: "Grand piano (samples)", "Calibrate… (ms)".
- Explaining the default: "Off by default: your keyboard's own speakers play."
- Semicolon chains: "Lenient allows a generous margin; Strict also marks..."
- Vague adjectives where a number would do: "generous margin", "well before".
- A paragraph under a control that restates what the control does.

Rules that good style guides share:

- Mailchimp [V]: lead with the main point, active voice, positive language, short words, avoid vague language, read it aloud.
- Google developer style [V]: conversational and respectful; "using please in a set of instructions is overdoing the politeness"; avoid "simply", "It's that simple", "quickly", and placeholders like "please note".
- Material [V]: brief labels, sentence case, no generic verbs.
- Stripe, Linear and Apple copy guides could not be fetched; do not attribute rules to them.

### D. Progression UX

**Models compared.**

| Model | Seen in | Strength | Weakness for piano |
|---|---|---|---|
| Linear path | Duolingo, Simply Piano | Zero decisions | Removes choice; adults with a repertoire goal rebel [S] |
| Skill tree | Old Duolingo | Visible breadth | Overwhelming, needs content volume piano lacks |
| Stage checkpoints | Melodics (15), SASR levels | Clear milestones, honest | Needs a pass line that feels fair |
| Daily generated session | Yousician, Simply workouts | Removes choosing | Must adapt or it feels random |
| Mastery meters with decay | Khan Academy levels (Attempted, Familiar, Proficient, Mastered; a miss lowers a level [S]), Duolingo half-life | Honest, self-correcting | Needs enough samples before showing a number |

**Honest progress for slow skills.**

- Sight-reading is slow to move and noisy. Meinz and Hambrick (57 pianists) found practice necessary but not sufficient, with working memory contributing independently [V, Science News]. The practical read: progress is real but uneven, so a single day's number will bounce.
- Show a trend over 4 weeks with sample counts, not a daily number; hide a stage's percentage until it has enough cards (the app already weights a deck and tracks first-try accuracy and median response time).
- Report accuracy and speed separately, as osu! separates accuracy and consistency.
- Offer personal bests per stage and per exercise; never compare to other people.
- Say plainly when a plateau is normal; do not invent a rising line.

**Streaks and goals without shame.**

- Lally et al. (UCL, 2010) is the usual citation for "a single missed day did not materially affect habit formation"; the primary page was not retrievable, and the 66-day median is secondary [S]. The abstinence-violation effect (one lapse leading to quitting) is the better-grounded mechanism for streak guilt [S].
- Apple's Activity app shows a Monday summary of last week and suggests an adjusted goal from past performance [V, Apple support via search]. That is the model: look back once a week, retune the goal, no daily alarm.
- Duolingo states that flexibility can beat rigid rules and ships freezes for that reason [V]. A system that needs freezes to be tolerable is a warning.

---

## 4. Steal this / avoid this

### 4.1 Steal

- Melodics: effort ladder separate from skill; optional weekly set; Stage readiness dials; Auto BPM; loop shortcuts.
- Piano Marvel: 20-second preview before play; 80% pass line; strike mark in the corner; adaptive next excerpt.
- Rocksmith+: one stated target per exercise; trouble-spot summary after.
- Duolingo: due-items return by decay; celebration on extension; the weekly-streak request from users.
- Apple Activity: Monday summary with a suggested goal.
- Clone Hero: hit-window display as an opt-in, section picker for practice.
- osu!: separate accuracy from consistency.
- VS Code Zen / Figma Hide UI: one-key chrome toggle.
- Android: contextual placement, manageable count, defaults that most would choose.
- Linear: opinionated defaults over options.

### 4.2 Avoid

- Hearts, leagues, public leaderboards, gems; they drove misuse in the L@S study [V].
- A single-day streak that can be lost.
- Open-ended point scores and "Platinum" states that are never finished.
- A hard-locked path.
- A pause or banner at the moment of mistake.
- A second top-level concept for every feature (Touch as its own tab).
- Explanatory paragraphs in settings.
- Counting tiny differences as progress.

### 4.3 Monetisation pressure points (for the record)

Free caps measured in minutes a day (Melodics 5, Yousician 10-15), mid-lesson paywalls, trial-to-annual conversions, auto-renew confusion, library removals with lost progress (flowkey). Piano has none of these. The nearest equivalent is "locked" content; do not create it.

### 4.4 Copy rewrites for the current drawer

| Current | Replace with |
|---|---|
| Play through the browser | Sound: Keyboard / This device |
| Grand piano (samples) | Grand piano |
| Name the chord I am holding | Chord names (delete the setting, see 5.5) |
| Show all 88 keys | (move to Advanced) All 88 keys |
| Perform mode takes points back when you let go well before the written length... | (delete) |
| Positive means your notes arrive late (display lag, Bluetooth). Calibrate by playing along to a click, or nudge by hand. | Delay 40 ms [Calibrate] |
| Off by default: your keyboard's own speakers play... | One-line notice, only when This device is chosen: "Hearing every note twice? Turn Local Control off on the keyboard." |
| Split point for single-track files / C4 (middle C) and up is the right hand | Right hand starts at C4 (per song) |
| Check that it is switched on... (a 45-word troubleshooting paragraph) | No keyboard found. Switch it on, use a data cable, replug. [More] |

---

## 5. Recommendations for piano

These are design proposals built on the evidence above. They are untested with real learners and should be checked with Matt's actual use before anything is deleted.

### 5.1 Navigation

Five tabs, replacing Songs / Read music / Technique / Touch:

**Today · Songs · Read · Technique · Progress**

- Touch stops being a tab. Calibration moves under Technique (it exists to set soft/medium/hard targets); the history chart and table move under Progress.
- Progress holds: this week, per-stage mastery, per-exercise mastery (when built), touch history, data export. One page, no sub-nav.
- Perform and Learn stop being a persistent bar toggle. They become a choice on the start sheet for a song ("Practice" or "Play"), remembered per song.
- The "All stages" button leaves the top bar and lives inside Read.

### 5.2 Home screen (Today)

Top to bottom:

1. One large button: **Start** with duration chips 5 / 10 / 20 min.
2. The plan as three short rows (what, in four words): *Warm-up: C major, right hand*; *Read: bass F, due*; *Piece: Minuet, bars 9-16*. Each row has Skip.
3. A row of free-choice entries: Continue last song, Songs, Read, Technique.
4. Week strip: seven dots for the days played and one line of minutes against the goal. No consecutive-day counter in the header.
5. Monday only: a collapsed card with last week's minutes, the one measure that improved most (for example median response time on treble landmarks), and a suggested goal for the week.

### 5.3 Session model

- Time-boxed, generated from data piano already stores: Warm-up from the last Technique exercise (about 2 minutes), Read from the weighted deck with items **due** first, Piece from the song's worst bars via the existing "Loop worst bars", slowed by Auto BPM.
- Skip anywhere. Nothing locks. Finishing a plan is not required; any play counts toward the week.
- Due logic: start with a five-box Leitner interval (1, 2, 4, 8, 16 days; a miss drops one box, not to zero). Duolingo's half-life regression is the heavier version; use it only if Leitner proves too coarse.
- Mastery states instead of raw percentages: New, Learning, Solid, Due. Solid decays to Due; that is the only "loss" in the system, and it is a prompt, not a penalty.
- Weekly goal in minutes chosen by the player, default modest; "weeks met" appears only after two in a row.

### 5.4 In-play HUD

During play:

- **Perform:** combo only, centred above the keyboard, hidden below 5; accuracy and score stay off screen until results. Judgement lives on the note (shape plus colour, already planned) with a small early/late tick on non-perfect hits only. Hold uses the existing draining bar.
- **Learn:** no numerals. A thin progress fill on the scrub bar; wrong notes counted silently.
- **Read:** card counter (7/20) and the card. Streak, first-try and median move to the end screen.
- **Effects:** three tiers: Off, Calm, Arcade. Delete Max.
- **Chrome:** top bar fades after the first note and returns on pointer move, Esc or Space. One key, `H`, hides and shows everything except the staff and keyboard. Esc once pauses and shows the dock.

After play (results): one grade line, then the distribution; keep the existing histogram and hold %, add "Next: try without waiting" when a Learn pass is clean and Wait was on.

### 5.5 Settings: exact list

**Settings (six rows, instant-apply, no paragraphs):**

1. Effects: Off, Calm, Arcade.
2. Sound: Keyboard, This device. Under This device only: Instrument, Volume.
3. Strictness: Easy, Standard, Strict. One control that sets timing windows and hold grading together (replaces the Hold 3-state; Standard maps to today's Lenient).
4. Keyboard: the connected device name, read-only. A dropdown appears only if more than one device is present.
5. Timing: current delay in ms and a Calibrate button.
6. Data: Export, Import, Clear.

**Advanced (collapsed):** Delay as a number, Fall speed, All 88 keys, Default hand split.

**Inline or on a key, not in Settings:** View (V, already there), Tempo, Hands, Loop, Wait, Note names (N, in the dock; later fade by mastery per ROADMAP), Hide HUD (H).

**Per song:** Hand split for single-track files, with its sibling controls on the song's start sheet.

**Deleted:**

- Chord names toggle (always on in Learn, silent elsewhere; the display is a single line above the keys).
- The six explanatory paragraphs and both troubleshooting `<details>` (the troubleshooting line appears only in the no-keyboard empty state).
- The Max effects tier.
- Shortcuts list (move to a `?` overlay).
- Sample credit line (move to an About line at the foot).

No settings search: six rows plus four advanced does not need one. Add it at about 30, per Android's "complex or deep" guidance.

### 5.6 Order of work

1. Settings and copy cleanup (smallest, immediately visible, no model change).
2. HUD diet and chrome auto-hide.
3. Progress page and effort tracking (minutes, days).
4. Today page with plan generation and Leitner due-state.
5. Navigation change (fold Touch, move Perform/Learn).
6. Auto BPM and "try without waiting" prompt.

---

## 6. Sources

Tags as defined at the top.

**Practice products**

- Melodics, Stages [V]: https://support.melodics.com/en/articles/15091931-stages
- Melodics, Weekly Goals [V]: https://support.melodics.com/en/articles/15091960-weekly-goals
- Melodics, Understanding your progress [V]: https://support.melodics.com/en/articles/15091765-understanding-your-progress-in-melodics
- Melodics, XP and Stardom [V]: https://support.melodics.com/en/articles/15091901-xp-and-stardom
- Melodics, Lesson scoring [V]: https://support.melodics.com/en/articles/15092017-lesson-scoring
- Melodics, Practice mode [V]: https://support.melodics.com/en/articles/6777027-practice-mode
- Melodics, The Melodics approach [V]: https://support.melodics.com/en/articles/8051176-the-melodics-approach
- Melodics review with scoring complaint and pricing [S]: https://www.omarimc.com/melodics-app-review/
- Piano Marvel SASR [V]: https://pianomarvel.com/en/feature/sasr and https://pianomarvel.com/en/article/the-ultimate-sight-reading-test
- Piano Marvel structure and trophies [S]: https://pianistscompass.com/?p=15455, https://pianomarvel.com/about-us
- Simply Piano App Store [V]: https://apps.apple.com/us/app/simply-piano-by-joytunes/id1019442026
- Simply Piano review [S]: https://beardedskeptic.com/review/simply-piano-review/
- Simply Piano complaints [S, unverified]: https://www.trustpilot.com/review/www.simplypiano.com
- flowkey App Store reviews [V]: https://apps.apple.com/us/app/flowkey-learn-to-play-piano/id1020357408?see-all=reviews
- flowkey review [S]: https://pract.is/blog/flowkey-review-good-for-adult-piano-learners
- Yousician [S]: https://yousician.com/piano, https://www.strivecloud.io/play/yousician-gamification-playbook
- Synthesia [V]: https://www.synthesiagame.com/
- Rocksmith+ dev diary [V]: https://www.ubisoft.com/en-us/game/rocksmith/plus/news-updates/7ncvKJE9PCWmNWNrqmU5WJ/rocksmith-dev-diary-late-may-2022-lessons
- Rocksmith+ piano page [V]: https://www.ubisoft.com/en-us/game/rocksmith/plus/piano-lessons
- Rocksmith+ pricing and features [S]: https://www.guitarworld.com/news/rocksmith-plus
- Pianoforall [S]: https://pianoers.com/pianoforall-review/
- sightreading.training README [V, partial]: https://github.com/leafo/sightreading.training

**Duolingo**

- Settles and Meeder, Half-life regression, ACL 2016 [V]: https://aclanthology.org/P16-1174.pdf
- Streak article [V]: https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- New home screen [V]: https://blog.duolingo.com/new-duolingo-home-screen-design/
- Gamification misuse, L@S 2022 [V]: https://arxiv.org/abs/2203.16175
- Path redesign criticism [S]: https://www.nbcnews.com/tech/tech-news/duolingos-update-redesign-luis-von-ahn-interview-rcna44655, https://uxdesign.cc/down-the-wrong-path-the-disaster-of-the-latest-duolingo-ui-update-a4cdd1e6ea1c

**Rhythm games and juice**

- Clone Hero manual [V]: https://wiki.clonehero.net/books/clone-hero-manual/page/how-to-play
- osu! Unstable Rate [V]: https://osu.ppy.sh/wiki/en/Gameplay/Unstable_rate
- Friday Night Funkin' docs [S]: https://mintlify.com/FunkinCrew/Funkin/playing
- Beat Saber scoring [S]: https://roadtovr.com/beat-saber-studio-shows-get-highest-score-new-video/
- Juice talk summary [V]: https://gamedeveloper.com/design/video-is-your-game-juicy-enough-
- Kao, effects of juiciness [S]: https://www.sciencedirect.com/science/article/pii/S1875952118300879
- Juicy feedback and motivation, CHI 2024 [unread]: https://dl.acm.org/doi/fullHtml/10.1145/3613904.3642656

**Settings, focus, copy**

- Android settings pattern [V]: https://developer.android.com/design/ui/mobile/guides/patterns/settings
- Material 1 settings [V]: https://m1.material.io/patterns/settings.html
- Archived Apple iOS guidance on preferences [S]: https://developer.apple.com/library/archive/referencelibrary/GettingStarted/RoadMapiOS-Legacy/chapters/RM_iHIG_Station/Fundamentals/Fundamentals.html
- VS Code UI (Zen mode, settings search) [V]: https://code.visualstudio.com/docs/getstarted/userinterface
- Game settings checklist [V]: https://www.gamedeveloper.com/design/create-better-game-settings-options-handy-checklist-
- Linear approach [S]: https://prototypr.io/news/linear-opiniated-software
- Mailchimp style guide [V]: https://styleguide.mailchimp.com/tldr/
- Google developer tone guide [V]: https://developers.google.com/style/tone
- Signs of AI writing [V, partial]: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing

**Progression**

- Apple Watch daily activity and Monday summary [S]: https://support.apple.com/guide/watch/track-daily-activity-with-apple-watch-apd3bf6d85a6/7.0/watchos/7.0
- Khan Academy mastery levels [S]: https://support.khanacademy.org/hc/bg/articles/5548760867853
- Meinz and Hambrick sight-reading coverage [V]: https://www.sciencenews.org/article/sight-reading-music-practice-doesnt-make-perfect
- Habit-formation and streak anxiety summaries [S, secondary only]: https://habitdoom.com/blog/streak-anxiety-habit-trackers

## 7. Open items

- Re-read Apple HIG (Settings, Writing) in a browser; the JavaScript-rendered pages did not load for the fetcher.
- Pull the Kao paper and the CHI 2024 juicy-feedback paper from a source with access, to confirm effect sizes.
- Open Melodics, Yousician and Piano Marvel trials and screenshot the first screen and the results screen; this report's first-screen claims for the last two are secondary.
- Find a developer source for Beat Saber and Taiko HUD choices; none found.
- Decide with Matt whether any streak counter is wanted at all; this report recommends days-this-week plus minutes and weeks-met, which is a judgment call.
