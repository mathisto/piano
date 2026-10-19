# Learning science for piano: what the evidence says we should build

Compiled 2026-10-19 for the piano practice tool. Sources were read or searched during this session; every citation below was seen in a search result or fetched page. Where a claim rests only on a secondary summary, or on my memory of a paper I did not re-open, the text says so.

Evidence ratings used throughout:

- **MA**: meta-analysis or large systematic review
- **EXP**: controlled experiment (lab or classroom, often small)
- **OBS**: observational or correlational study, survey, case study
- **REV**: narrative review or theory paper
- **PRAC**: practitioner opinion, teacher blog, syllabus
- **IND**: industry claim, not independently verifiable

Most of the music-specific evidence is OBS or small EXP. The strongest evidence (MA) is mostly from general learning science and motor learning, and transfers to piano by analogy, not by direct test. Treat that gap as real.

---

## (a) TL;DR: the ten most decision-relevant findings

1. **Practice quality beats practice quantity, and quality is mostly strategy.** Pianists who stopped at an error, fixed it, and repeated the passage until it was right outperformed those who simply played more. Time spent alone does not predict performance. Build the tool around the error-targeted loop, not around minutes logged.
2. **Deliberate practice explains less than its fans claim.** In music it accounts for about 21% of performance variance (meta-analysis), and the original violin study did not replicate cleanly. Do not sell "10,000 hours". Sell small, specific, repeatable fixes.
3. **Real-time feedback helps now and can hurt later.** The guidance hypothesis (frequent, easy-to-use feedback becomes a crutch) is well supported in simple lab tasks and contested elsewhere. Keep live judgement in Perform (it is a game mode), but in Learn and Technique show summary feedback at the end of a bar or phrase, and always grade mastery on an unaided run.
4. **Interleave after first exposure, not before.** Random or mixed practice slows acquisition and improves retention and transfer; the effect is larger in adults than in children. In the one music study (n = 10) the benefit was not statistically significant and 6 of 10 players still preferred blocked practice. Block the first encounter, then mix.
5. **Spacing is the most reliable finding in the whole report.** A meta-analysis of 317 experiments shows the best gap between sessions grows with how long you need to remember. Schedule review per item with a decaying memory estimate, and prefer two short sessions to one long one.
6. **Note reading is pattern recognition, not letter lookup.** Pianists who read well recognise chunks and intervals, and chunk-recognition tests track sight-reading skill. Isolated note-name drilling is defensible only for the first few landmarks; move to short melodic fragments in key context early. No controlled study compares flashcard and in-context drills for adult beginners, so this is a reasoned inference.
7. **Rhythm and continuity matter as much as pitch.** Drilling rhythm or pitch patterns before sight-reading improved the matching skill in the one chunking experiment. Rhythm-keeping and not stopping are central in the sight-reading models. A non-waiting rhythm stage should be treated as a core stage, not a bonus.
8. **Points, badges and leaderboards do not raise intrinsic motivation.** Gamification meta-analyses find small-to-moderate average gains (g about 0.25 to 0.5), but isolated elements (points, levels, leaderboards) changed behaviour without changing intrinsic motivation, and one classroom study found a leaderboard-and-badge course ended up less motivating. Rewards that carry competence information (your own mastery trend, personal bests) are the safe kind. Tangible, expected rewards undermine interest (d about -0.3 to -0.4).
9. **Streaks have no peer-reviewed evidence behind them.** The Duolingo numbers circulating online could not be traced to a primary source. Habit research says one missed day barely matters but many do. Prefer a weekly goal ("4 of 7 days") over an unbroken chain, and never use loss-framed messaging.
10. **Key velocity feedback has no controlled evidence yet.** There are small qualitative studies of visual dynamics feedback and a physics result that loudness depends on hammer speed, but no trial showing that showing velocity improves dynamic control. Build it as a measurement-and-awareness tool, target consistency (evenness) before absolute level, and expect to be generating evidence, not applying it.

---

## 1. Deliberate practice and effective practice for novices and adults

**Findings**

- Ericsson, Krampe and Tesch-Römer (1993) argued that expert performance tracks accumulated, structured, effortful practice aimed at specific improvements, in the original data estimated retrospectively for student violinists. [OBS, REV]
- Macnamara, Hambrick and Oswald (2014) pooled 88 studies (n = 11,135): deliberate practice accounted for about 26% of variance in games, 21% in music, 18% in sports, 4% in education, under 1% in professions. Ericsson disputed the operationalisation. [MA]
- Macnamara and Maitra (2019) re-ran the 1993 violin study double-blind and did not replicate the core pattern of practice amounts matching skill level; the effect was smaller. Teacher-designed practice was rated less relevant to improvement than practice done alone. [OBS replication]
- Williamon and Valentine (2000): 22 pianists at four levels learned a Bach piece. Practice quantity did not predict performance quality; those who worked in longer segments by the middle stage gave better performances. The authors conclude the content of practice must be examined. [OBS]
- Duke, Simmons and Cash (2009, JRME): expert pianists' strategy choice mattered more than time, and the effective strategies were stopping at errors, fixing them, and repeating the target passage until the error disappeared. I could not open this paper; the description comes from a thesis and a MusicMark summary citing it. [OBS, secondary only]
- Miksza (2011), a review of 119 studies, proposes an instruction model with choice, intentionality, action, achievement outcomes and rest and recovery as components. [REV]
- Hallam et al. (2012), 3,325 young players: use of systematic practice strategies, recordings and metronome, analytic strategies, concentration and immediate error correction were separable factors, and several rose with level. A secondary summary says repetitive early practice habits can become entrenched, stalling progress and driving drop-out. [OBS]
- Slow practice: I found no controlled comparison of slow versus at-tempo practice in pianists. Furuya and colleagues report that days of practice at submaximal speed progressively raised maximum speed (found only via an aggregator snippet, citation not confirmed). Practitioner sources argue both ways. [PRAC, thin]
- Hands separate versus together: the only direct studies are very old (Brown 1933; Rubin-Rabson 1939, reported secondhand), favouring hands together for efficiency in trained players; modern guidance uses hands separate diagnostically for notes and fingering and hands together for coordination. [PRAC, thin]
- Session length and frequency: no clean music-specific experiment found. The spacing and sleep-consolidation findings in section 2 are the best available guide. [thin]
- Chaffin, Imreh and Crawford (2002) tracked one concert pianist learning a Bach Presto: much of the practice went into building a mental "roadmap" of the piece's structure, not finger repetition. One subject. [OBS case study]

**What this says for a novice adult:** the transferable pattern is (1) find the exact bar that fails, (2) isolate it, (3) slow it only as far as it takes to play it correctly, (4) repeat until correct several times in a row, (5) put it back in context. Segment length mattered in Williamon and Valentine, so looping a phrase beats looping a single note and beats replaying the whole piece.

**Implication for piano:** Make the error-targeted loop the default after a run. At the end of any Learn or Perform run, show the two worst bars (by misses and timing spread), with a one-tap "loop these at 70%" button that pre-sets the A-B loop to the phrase containing them (aim for 2 to 4 bars, not 1 note). Auto-suggest tempo from accuracy: after 3 clean passes in a row, propose +5%; after 2 failed passes, propose -10%. Log "clean passes in a row" per bar and show that, not minutes played. Do not build a minutes-per-day total as the headline number. Add a hands-separate suggestion only when one hand's miss rate is clearly higher; otherwise default to hands together, since the thin evidence slightly favours it for efficiency.

---

## 2. Motor learning: contextual interference, spacing, feedback, guidance

**Contextual interference (blocked versus random)**

- Brady (2004) pooled 139 effect sizes from 61 studies: random practice typically hurts acquisition and helps retention and transfer. The effect was larger in basic lab research (.57) than applied settings (.19) and larger in adults than in children. [MA]
- A 2024 Frontiers systematic review reports random practice was favoured in adults and older adults, with a negligible effect in young participants (SMD = 0.12). [MA/systematic review; I read the search summary, not the full paper]
- Brunmair and Richter (2019), 59 studies, 238 effect sizes: interleaving had a moderate overall effect (Hedges g = 0.42), largest for visual categories like paintings (g = 0.67), with large heterogeneity. Interleaving helps most when the items are similar and easily confused. [MA]
- Carter and Grahn (2016): 10 advanced clarinetists practised two pieces blocked (12 min then 12 min) or interleaved (3-min alternations), rated blind by three professionals. Interleaved scores were numerically higher but not significant overall; inter-rater agreement was weak (r from 0.02 to 0.59). All 10 said blocked was closest to their usual practice, 6 judged interleaved most useful, yet 6 preferred blocked. [EXP, tiny]

**Spaced versus massed**

- Cepeda, Pashler, Vul, Wixted and Rohrer (2006): 839 assessments in 317 experiments. The optimal gap between study sessions increases as the required retention interval increases. This is verbal recall, not motor skill. [MA]
- For musicians, Simmons and colleagues and Duke and Davis (2006) report overnight consolidation and distributed practice benefits for keyboard sequences. I could confirm only that this line of work exists in JRME; I could not verify the exact titles, years or effect sizes in this session, so the details are omitted. [EXP, unverified details]
- Rowland (2014) meta-analysis of the testing effect (retrieving beats restudying) supports hiding note names so every response is a retrieval. [MA; seen via abstract page only]

**Feedback frequency and the guidance hypothesis**

- Salmoni, Schmidt and Walter (1984, Psychological Bulletin) reappraised knowledge-of-results research: more frequent, more precise feedback improves performance during practice but can degrade retention, because the learner stops processing intrinsic sensory feedback. This is the guidance hypothesis. [REV]
- Winstein and Schmidt (1990): 50% knowledge of results gave better retention than 100% despite worse acquisition. Reviews say the pattern is widely but not universally replicated; a small stroke study found no retention difference between 100% and 25%. [EXP, mixed replication]
- Sigrist, Rauter, Riener and Wolf (2013) review augmented feedback (visual, auditory, haptic, multimodal) and conclude it helps learning but optimal delivery is still debated; terminal feedback and bandwidth feedback are recurring suggestions. [REV]
- Wulf and Lewthwaite (2016), the OPTIMAL theory: motor learning improves with enhanced expectancies, learner autonomy and an external focus of attention. [REV]
- Self-controlled feedback (letting the learner choose when to see it): McKay et al. (2022) found g = .44 across 52 experiments, but after correcting for publication bias the estimate fell to g = .107, "not distinguishable from zero". A 2025 meta-analysis of 29 self-controlled feedback studies is positive. Contested. [MA, conflicting]
- Wulf and Shea (2002) argued that principles derived from simple lab tasks may not hold for complex skills like music. I am citing this from memory and did not re-verify it. It matters: most guidance-hypothesis work uses simple tasks.

**What this means for judgement words, combo and scores.** Perform mode is a game and its job is engagement; the combo, judgement words and streak counters there are fine. They are concurrent, every-note, easy-to-use feedback, the exact form the guidance hypothesis warns about. In practice modes, the evidence favours less, later and more informative feedback:

- Show the result after the bar or phrase, not on every note ("bar 5: late by 40 ms on beats 2 and 4"), which is bandwidth/terminal feedback.
- Keep the staff-ghost note, since it conveys error direction and size and is information, not praise.
- Fade the judgement words in Learn and Technique as accuracy rises, and require the final mastery check to be a run with feedback hidden.

**Implication for piano:**

1. Add a "Test run" at the end of each Learn and Read stage: no judgement words, no note names, no ghost, just a score at the end. Mastery meters (Read music, Technique) update only from test runs and from unaided cards, not from assisted practice. This separates performance during practice from learning, which Bjork and Bjork (2011) identify as the central trap. [REV: https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf]
2. Feedback fading schedule, tied to measured accuracy: 100% live feedback while first-try accuracy for a passage is under 70%; summary-only (per bar) at 70-90%; end-of-run only above 90%. Make it automatic and visible so the player understands why it faded; allow override (autonomy).
3. In the Read-music deck, interleave stages from day one but weight confusable items together (neighbouring lines and spaces, 2nds versus 3rds), since similarity is where interleaving pays most. Block only the very first exposure to a new stage (about 8 to 10 cards).
4. In Technique, block within a key to learn the pattern, then offer a "mixed" set (random key and pattern from the unlocked list) as a weekly challenge. Do not force interleaving on week one; the one music test showed musicians neither noticed nor preferred it.
5. Warm-up scheduling: open each session with 2 to 3 items due for review (from the oldest successful item), the cheapest implementation of expanding spacing.

---

## 3. Sight-reading: what the research says and what to teach in what order

**Findings**

- Kopiez and Lee (2006), 52 piano majors, five tasks of rising difficulty: sight-reading was predicted by practice-related skills (most strongly), working memory, and elementary speed measures such as trill and tapping speed. Rhythmic accuracy was the performance measure. The 2008 follow-up proposes a general model of component skills. [OBS]
- Lehmann and Ericsson (1996), reported secondhand: accumulated time on accompanying and the size of the accompanying repertoire were the best predictors of sight-reading. McPherson (1994): sight-reading ability correlated with rehearsed-repertoire performance only as students matured. [OBS, secondary]
- Mishra (2014, Psychology of Music) meta-analysis of 92 quasi-experimental studies: a small overall treatment effect, with training types that helped being aural training, controlled reading (externally paced), creative activities, and singing/solfege; sight-reading also improved from pre to post in control groups. [MA, small effects]
- Waters, Townsend and Underwood (1998): in pianists, a task requiring immediate recall of rapidly presented chords correlated most strongly with sight-reading skill, which the authors read as pattern recognition plus prediction plus auditory imagery. Waters, Underwood and Findlay (1997): faster pattern-matching in better readers, with fewer and shorter glances. [OBS]
- Furneaux and Land (1999): professionals' eye-hand span was about four notes versus two for amateurs. [OBS]
- Pike and Carter (2010), 43 beginning group-piano students over six classes: groups that first drilled rhythm patterns or pitch patterns (cognitive chunking) before reading improved in rhythm and continuity (rhythm group) or pitch, rhythm and continuity (pitch group), while the no-drill control improved only in pitch. Short, small sample, abstract-level reading only. [EXP, small]
- Penttinen and Huovinen (2011): 15 adult novices followed over 9 months. Over training their fixation patterns moved toward amateurs'; for larger skips, novices identified each symbol directly rather than comparing across the interval. [OBS]
- Stewart, Walsh and Frith (2004): learning to read and play keyboard music builds vertical-to-horizontal visuomotor mappings that automatically engage on seeing notation. [EXP]
- Leikvoll (2025, Journal of Eye Movement Research): a review of eight eye-tracking studies argues most used random or isolated notes that cannot be chunked, which may push readers to note-by-note reading and mask expert advantages, so findings from those stimuli should not be generalised to real music. [REV: https://pmc.ncbi.nlm.nih.gov/articles/PMC12821705/]
- Flashcard note-naming versus in-context reading: I found no controlled comparison. A teaching site recommends laying 2 to 6 cards in a hand position so the student reads groups, with the aim of linking written note to key location and sound, not to a name. [PRAC]
- Landmark versus intervallic reading: I found no experiment. Practitioner sources favour combining landmarks with interval reading and note that landmarks alone limit range. [PRAC]

**Is drilling isolated note names effective?** For the first encounter with the staff, yes, briefly: you must anchor the symbol to the key. Beyond that, the evidence (pattern-recognition correlates, chunking theory, the critique of isolated stimuli) says reading skill is built by seeing groups, intervals and rhythm in context, and that note-by-note identification is exactly what novices do and experts stop doing.

**Order (defensible, not proven):** (1) rhythm and steady pulse alongside (2) a small landmark set of notes mapped to keys, then (3) steps and repeats within a five-finger position, (4) skips and intervals read relative to the previous note, (5) simple key signatures, (6) chords and the second clef. Rhythm should run in parallel from the start, not wait until stage 10, because continuity (not stopping) is what turns drill into sight-reading.

**Implication for piano:**

1. Keep the first 3 to 4 stages of Read music as isolated-card landmark drills with a hard cap on time spent there (a "graduate when mastery crosses threshold" rule). After that, every stage shows 3 to 6 note fragments in a hand position and judges the whole fragment (as a chunk), not one note at a time.
2. Add a distinct intervals-from-previous-note measure (second, third, fourth, fifth, then 6th and above) to the stats so the player can see skip reading separately from step reading. Penttinen and Huovinen's skip finding says this is where novices struggle.
3. Build the rhythm-reading stage (already on the roadmap) as a scored, non-waiting stream and move it up the priority list; it is the continuity trainer. Add a pre-drill step as in Pike and Carter: clap/tap the rhythm on one key, then read pitches, then combine.
4. Ship the reading-ahead mode (next bar hidden until current ends). Eye-hand span is the best-characterised expert difference.
5. Reading in context: after any stage mastery milestone, serve one real short public-domain excerpt that uses only the unlocked notes. This tests transfer and keeps music in the loop.
6. Add paced reading (a moving cursor or metronome-driven bar advance): the "controlled reading" category was one of the few treatment types that significantly helped in the Mishra meta-analysis.

---

## 4. Dynamics and touch: velocity pedagogy and research

**Findings**

- Piano loudness and timbre of a single struck key are, in the acoustician view, determined by the speed with which the hammer hits the string. Goebl, Bresin and Fujinaga (2014, JASA) found that touch types producing the same hammer velocity were audibly distinguishable, mainly through finger-key and key-bottom noise, not through string tone, and note the effect may come from mechanical sounds of the action. [EXP]
- Bernays and Traube (2014, Frontiers in Psychology) recorded four expert pianists on a Bösendorfer CEUS with five timbral intentions: each pianist used a distinctive combination of dynamics, touch, articulation and pedalling. [OBS, n = 4]
- A physics study reports a nonlinear relation between key-press force impulse and key velocity, so velocity numbers are an imperfect proxy for loudness and for effort. [Secondary, from a search snippet; Kinoshita et al. 2007, JASA]
- Visual dynamics feedback: Hamond, Welch and Himonides (2019, Opus) and Hamond (2023, Orfeu) put teachers and students at a MIDI piano with a DAW showing note colour and velocity; they report greater awareness and clearer lesson focus. Small, qualitative, one research group. No learning-outcome test. [OBS, qualitative]
- A 2026 ACM paper argues MIDI's onset, duration and velocity miss expressive gestures, and proposes key-motion visualisation; its studies compare representations, not learning. [OBS]
- Searches for a controlled study of key-velocity feedback on learning outcomes returned none. **This is an evidence gap, not a negative result.**
- General motor-learning guidance: an external focus (the sound produced) tends to beat an internal focus (finger movement) for learning (Wulf and Lewthwaite 2016). [REV]

**Practical constraints specific to this product.** The FP-10's velocity curve and the player's technique both shift the numbers; the existing personal calibration (ten soft, ten medium, ten hard) handles that, which is the right instinct. What learners most plausibly need first is control and evenness, not exact decibel targets, because the ear is the real reference.

**Implication for piano:**

1. Give dynamics targets as relative to the player's calibrated range (already built), and present the first drill as evenness: ten notes within a tight band of your own mean (the open item in Phase C). Evenness is audible, so the ear can calibrate it, and it needs no absolute reference.
2. Show the outcome as sound, not numbers: a short bar-height strip for the last 8 notes, plus a verdict at the end of the pass. Avoid per-note number flashes (these invite the internal focus and the guidance-hypothesis crutch).
3. Fade the pips and bands once the player's `touch in range %` is over 85% on test runs: first remove the band while keeping the strip, then remove the strip.
4. Add a deliberate "same velocity, different tempo" and "crescendo over 8 notes" test run as a measurement of control. Log the results to the Touch page.
5. Be honest in the UI: velocity is the keyboard's reading of key speed, not tone. Frame it as "how hard you played" and keep the copy modest.
6. Treat this feature as a study. Log anonymised-locally the before/after evenness spread per player so Matt (and later anyone exporting JSON) can see whether feedback changed anything.

---

## 5. Motivation, gamification, spaced repetition, adaptive difficulty

**Self-determination theory (SDT) and music**

- Evans (2015, Musicae Scientiae) is a conceptual overview arguing SDT's three needs (autonomy, competence, relatedness) can unify fragmented music-education motivation research. [REV: https://selfdeterminationtheory.org/wp-content/uploads/2021/05/2015_Evans_SDT_MusicEdu.pdf]
- MacIntyre et al. (2017), cited in a 2026 Frontiers paper (second-hand): adult musicians show a loop where desire to learn drives effort, which builds perceived competence. [OBS, secondary]
- Learner choice and autonomy: in motor learning, the benefit of learner-controlled practice is contested (see section 2), but autonomy support remains a core component of OPTIMAL.

**Overjustification and extrinsic rewards**

- Deci, Koestner and Ryan (1999, Psychological Bulletin), 128 experiments: engagement-contingent, completion-contingent and performance-contingent rewards reduced free-choice intrinsic motivation (d = -0.40, -0.36, -0.28); tangible and expected rewards also reduced it; positive verbal feedback increased it. Effects were stronger for children than college students. [MA]

**Gamification meta-analyses**

- Hamari, Koivisto and Sarsa (2014, HICSS): gamification has positive effects, but they depend heavily on context and user. Koivisto and Hamari (2019) updated this across 800+ papers. [REV]
- Sailer and Homner (2020, Educational Psychology Review): cognitive g = .49 (k = 19), motivational g = .36 (k = 16), behavioural g = .25 (k = 9). Cognitive effects held in high-rigor subsets; motivational and behavioural effects were less stable. [MA]
- Bai, Hew and Huang (2020, Educational Research Review): g about 0.50 over 24 quantitative studies, with effects varying with sample size and duration; students liked feedback, recognition and goal-setting, and disliked lack of utility and anxiety or jealousy. Details are from a summary page. [MA]
- Zainuddin, Chu, Shujahat and Perera (2020, Educational Research Review): a systematic review, not a meta-analysis; I could not retrieve its findings. [Systematic review, findings unverified]
- Mekler, Brühlmann, Tuch and Opwis (2017, Computers in Human Behavior): points, leaderboards and levels increased the amount of work but did not change intrinsic motivation or competence. [EXP]
- Hanus and Fox (2015, Computers & Education): a gamified course (leaderboard and badges) showed lower motivation, satisfaction and empowerment over 16 weeks than the same course without; effect on exam scores was mediated by intrinsic motivation. Two intact classes, so causation is limited. [EXP, quasi]

**Goal-setting, flow, streaks, habits**

- Locke and Latham (2002, American Psychologist): 35 years of goal-setting research; specific, challenging goals beat vague "do your best" goals. I read only the abstract. [REV]
- Flow's challenge-skill balance: Engeser and Rheinberg (2008) found the balance only partially predicted flow, moderated by task importance and achievement motive; flow predicted performance in 2 of 3 studies. Balance makes flow more likely, not certain. [OBS]
- Wilson, Shenhav, Straccia and Cohen (2019, Nature Communications): for gradient-descent learners on binary classification, training is most efficient at about 85% accuracy (15.87% error). Human application is an extrapolation by the authors; the paper does not test piano. [theory + simulation]
- Lally, van Jaarsveld, Potts and Wardle (2010, European Journal of Social Psychology): 96 people formed a daily habit; the average time to peak automaticity was 66 days, with a range of 18 to a predicted 254 (the top end is an extrapolation past the 84-day study). One missed day had little effect on later gains, but many missed repeats lowered the automaticity ultimately reached. [OBS; read via BPS Research Digest]
- Streaks: Duolingo-adjacent writing attributes streak engagement to loss aversion. The widely quoted "+14% day-14 retention from streak wager" could not be traced to a primary document. I found no peer-reviewed study isolating a streak effect. [IND / PRAC only]

**Spaced-repetition scheduling**

- Settles and Meeder (2016, ACL): half-life regression models each item's memory half-life, p = 2^(-delta/h). It cut recall-prediction error by 45% or more against baselines and, in an operational Duolingo test, improved daily engagement 12%. Duolingo's own blog says it halves the error of the Leitner system. Language words, not motor skills. [IND/EXP, vendor-run]
- Cepeda et al. (2006) above gives the independent support for expanding gaps. [MA]

**Mastery learning and desirable difficulties**

- Bloom (1984) reported about a 2-sigma gain for tutoring with mastery learning in two dissertations; the figure is famous and disputed. Kulik, Kulik and Bangert-Drowns (1990) is a meta-analysis of mastery programmes; I confirmed only the citation, and secondary sources say effects were smaller in some settings. [REV, headline number contested]
- Bjork and Bjork (2011): spacing, interleaving, varying conditions and testing are "desirable difficulties" but become undesirable if the learner lacks the background to respond successfully. Short-term performance can mislead about learning. [REV]

**Implication for piano:**

1. **Reward information, not currency.** Keep mastery meters, personal bests, "your first-try accuracy on G-clef landmarks went 62% to 88% in 2 weeks" lines, and verbal-style acknowledgement. Do not add points, XP, coins, levels, badges for activity, or any leaderboard. This is the single clearest gamification call from the evidence (Mekler 2017; Hanus and Fox 2015; Deci 1999).
2. **Competence before novelty.** Set the stage-advance threshold near 85% first-try accuracy with the last 20 cards; below about 70% for two sessions, surface a "drop back one step" suggestion. 85% is a theoretical target from a neural-network paper, so treat it as a tunable default and log how long players sit above and below it.
3. **Streaks:** show "days practised this week" with a weekly target the player sets (autonomy; Locke and Latham). No streak-loss warnings, no push notifications, no guilt copy. A missed day should show nothing. This follows the habit data and the lack of streak evidence.
4. **Spacing model:** replace the current weighted-by-weakness deck with a per-card half-life estimate and a due list. Start simple: after each success, double the interval; after a miss, halve it; schedule cards due today first, then weakest. HLR (feature-based regression) is overkill with one user and no server; a Leitner or doubling schedule is the lazy correct version and can be replaced when data exists.
5. **Autonomy knobs the player owns:** note-name labels, feedback detail level, tempo, which hand, which exercise. Defaults chosen by the fade rules in section 2, but always overridable.
6. **Relatedness** (the third SDT need) is the one thing a no-account local app cannot provide. Offering an export of a weekly summary the player can send to a teacher or friend is the cheapest honest substitute. Do not add social features.

---

## 6. Exercise progression in established syllabi, and a defensible technique ordering

**What the syllabi require** (sources: a teacher's compilation of the ABRSM sheet and a third-party chart of the RCM 2022 requirements, both checked against the extracted text of the PDFs; the official ABRSM and RCM pages were not reachable, so verify against the syllabi before copying numbers) [PRAC]:

| Level | Keys and forms (ABRSM, teacher sheet; may be the pre-2021 syllabus) | Keys and forms (RCM 2022, chart) |
|---|---|---|
| Entry | none | Prep A: C, G, D, Am legato and staccato pentascales, hands separate (HS), ending on a blocked triad; broken and blocked triad sequences on white keys. Prep B: adds A, F, Em, Dm; 1-octave natural-minor scales HS; 1-octave contrary-motion scale hands together (HT); broken tonic triads with inversions HS. |
| 1 | ABRSM G1: C, G, D, F major and A, D minor, HS, 2 octaves; C major contrary motion, 1 octave; broken chords in C, G, F, Am, Dm | RCM L1: C, G, F, Am, Em, Dm two-octave scales HS (nat./harm. minor); contrary motion HT; chromatic 1 octave HS; tonic triads broken and blocked with inversions |
| 2 | ABRSM G2: G, D, A, F major HT and HS, 2 octaves; E, D, G minor; contrary motion C and E; chromatic from D HS; arpeggios G, D, A, Dm, Gm HS | RCM L2: adds B-flat and Gm; scales HS, formula pattern HT; chromatic; triads |
| 3 | ABRSM G3: A, E, B, B-flat, E-flat majors and B, G, C minors HT and HS, 2 octaves; arpeggios begin HT | RCM L3: adds D, Bm; 2-octave scales HT; triads over 2 octaves |

Both systems agree on three structural facts: (1) learners start with five-finger positions, not full scales; (2) hands separate precedes hands together, and the first hands-together item is contrary motion starting on a unison, because it is symmetric and the hands mirror each other; (3) keys proceed from few accidentals to many: C, G, D, F, then A, B-flat, E, then the black-key-heavy keys later (B, E-flat, A-flat, D-flat arrive at Grade 3 to 4 in ABRSM). Arpeggios and tonic triads arrive after scales, broken chords before arpeggios.

**Hanon, Czerny and the evidence.** I found no controlled study showing that Hanon or Czerny-style exercise books improve outcomes relative to scales plus repertoire. They persist by tradition and teacher consensus. Take Hanon's value, if any, as finger-pattern fluency; it has no demonstrated advantage over scales and arpeggios graded to a syllabus. [PRAC; evidence gap]

**Minimum effective technique curriculum (reasoned, not trialled):**

1. Five-finger patterns in 4 to 6 keys, both hands, legato and staccato, ending on a tonic triad.
2. One-octave scales in the same keys, hands separately then together in contrary motion (the easiest coordinated start).
3. Two-octave major scales, parallel motion, hands together (thumb-crossing is the real skill).
4. Broken then blocked tonic triads with inversions; then arpeggios.
5. Chromatic scale, one octave, hands separate.
6. Touch layered on top: evenness first, then crescendo/diminuendo, then accent; only after that, melody-over-accompaniment balance.

**Key order for an adult beginner (suggested):** C, G, F, D, A minor, E minor, D minor, then A, B-flat, E, then the harder keys. Both syllabi front-load C, G, D, F and A, D, E minor. White-key hand positions (C, G, F) keep the black-key fingering burden minimal and let the learner focus on thumb crossing and evenness.

**Implication for piano:**

1. Reorder Technique unlocks to match the ladder above, not a seven-keys-at-once menu. Unlock the next key or pattern after 3 test runs at timing and touch in range (≥ 80%); show the ladder as a visible path (competence and autonomy: the player may skip ahead).
2. Add contrary-motion scale as the first hands-together item, and three-note chord sequences (triads with inversions) as the first chord item. This matches the order both systems chose independently.
3. Cap Technique at about 5 to 8 minutes per session in the default session plan. The evidence for any amount is thin, and the Duke et al. result (strategy over time) argues for brief, targeted work.
4. Treat Hanon-style exercises as out of scope until a player asks. Do not build them on the strength of tradition.
5. Tempo targets from the syllabi: RCM L1 quarter note = 69 for eighth-note scales, rising to 80 at L2 and L3; ABRSM G1 quarter = 60 and G2 quarter = 66 (teacher sheet). Use these as default targets, adjustable.

---

## 7. Adult-beginner specifics: attrition, persistence, playing real music, plateaus

**Findings**

- Peer-reviewed adult-specific piano research is sparse. What I found:
  - Daniel and Bowden (2013, British Journal of Music Education), a survey of 583 teachers in the UK, USA and Australia, reports a high drop-out rate at the intermediate stage with minimal research on it, and that external commitments hurt commitment and progression. Via a search summary. [OBS, secondary]
  - A 2016 British Journal of Music Education study of lapsed adult amateur participation argues this group is under-researched and that adults who see themselves as learners struggle to commit to the practice needed. Via a search summary. [OBS, secondary]
  - MacIntyre et al. (2017), second-hand: desire to learn, then effort, then perceived competence, as a loop. [OBS, secondary]
- Teacher and commercial writing names lack of practice time, slow-seeming progress, perfectionism, guilt about inconsistent practice, and repetitive early material as the leading reasons adults quit. [PRAC; widely repeated but not systematically measured]
- Plateau: I found no study of the "plateau" as such in adult piano learners. The intermediate-stage teacher survey above is the closest. The plausible mechanism, from the practice literature, is that repetitive practice without error-targeting stops improving performance, which fits Hallam et al. (2012) and the general deliberate-practice account. [thin]
- Playing real music early: I found no controlled evidence. Penttinen and Huovinen's adult novices improved over nine months in a course context, and Hallam et al. link repetitive habits to disengagement. Best read as an SDT argument (relevance, autonomy) rather than a measured effect. [thin]

**Implication for piano:**

1. **Always have a real piece in play.** Keep the Songs page one tap from Read music and Technique, and have the post-session screen suggest one short public-domain piece that uses only notes and keys the player has unlocked (the product already ships such arrangements). This directly addresses the "repetitive drills feel like homework" attrition story and costs little.
2. **Session shape (default 15 to 20 minutes):** 2 to 3 review cards (spacing), a Read-music block (5 min), one target song section with the error loop (8 min), 3 to 5 min Technique or touch. The mix gives variety, and each part is short enough to stay inside attention.
3. **Plateau detection:** if first-try accuracy on a stage has not improved over 5 sessions, say so plainly and change the task (shrink the loop, change the key, add a rhythm pre-drill), not the reward. Do not pad with confetti.
4. **Low-guilt design:** no streak-loss messaging, a "welcome back" state that restarts from the last due items, and a weekly view instead of a daily one. These follow the habit data (single misses are harmless) and the practice-guilt anecdote.
5. **Measure it:** local analytics only; log sessions per week, minutes per session and median days between sessions in the JSON export. If this app is meant to be a real practice tool, retention and improvement slope are the metrics, not engagement time.

---

## (c) Where evidence is thin or contested

- **Guidance hypothesis for complex skills.** The core results are from simple laboratory tasks with every-trial knowledge of results; whether per-note judgement words on a falling-notes highway harm retention in piano has never been tested. The feedback-fade design above is an informed bet.
- **Self-controlled practice.** Reported benefit of g = .44 shrinks to g = .107 after bias correction; the 2025 feedback-specific meta-analysis is positive. Do not rely on "choice improves learning" as a performance claim; rely on it only as a motivation and ownership claim, which is also mixed.
- **Contextual interference in music.** The motor-learning meta-analyses favour random practice for adults, but the direct music test is n = 10, non-significant, and learners dislike it. Effects may depend on skill level; novices may need blocked first.
- **Slow practice and hands separate.** No modern controlled study found for either. The recommendation to loop slowly or practise hands separately rests on teacher consensus and indirect motor-learning logic.
- **Isolated note drills versus contextual reading.** No controlled comparison. The reasoning is from pattern-recognition correlations and a critique of research stimuli, not an experiment.
- **Landmark versus intervallic reading.** Practitioner argument only.
- **Velocity feedback.** No controlled learning study; the physics of velocity versus touch timbre is itself debated.
- **Streaks and Duolingo numbers.** Quoted in blogs, not sourced. The habit paper's 66-day figure is an average with an extrapolated upper tail, and it was a health behaviour in students, not a skill.
- **Gamification effect sizes.** Heterogeneity is large, many studies bundle several elements, and short-term novelty may inflate effects. The meta-analyses disagree on magnitude (g = .25 to .82 in sources I saw). Treat the direction as reliable, the size as not.
- **Deliberate practice.** The theory is influential, the replication was weaker, and the definition is disputed (teacher-led versus self-designed).
- **Mastery learning "2 sigma".** A famous claim reported from two dissertations; later meta-analytic effects are smaller.
- **Hanon and Czerny.** Tradition, not evidence.
- **Adult attrition.** Mostly teacher anecdotes and a few secondary summaries; I did not find a rigorous adult-beginner dropout study.
- **The 85% rule.** Derived for binary classification with gradient-descent learners; the human application is the authors' extrapolation.
- **Syllabus numbers.** The ABRSM grade-by-grade requirements here come from a teacher's compilation that appears to predate the 2021 revision, and other sources disagree on Grade 1 hands-together items. Verify against the current syllabus before copying.

---

## (d) Bibliography

Items marked (unv) were not opened in full; details came from a search summary or abstract page. Items marked (mem) are cited from memory and were not re-verified this session.

**Practice and deliberate practice**

- Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. *Psychological Review*, 100(3), 363-406. https://stafforini.com/works/ericsson-1993-role-deliberate-practice/ (unv)
- Macnamara, B. N., Hambrick, D. Z., & Oswald, F. L. (2014). Deliberate practice and performance in music, games, sports, education, and professions: a meta-analysis. *Psychological Science*, 25(8), 1608-1618. https://www.psychologicalscience.org/news/releases/becoming-an-expert-takes-more-than-practice.html (unv)
- Macnamara, B. N., & Maitra, M. (2019). The role of deliberate practice in expert performance: revisiting Ericsson, Krampe & Tesch-Römer (1993). *Royal Society Open Science*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6731745/ (unv)
- Williamon, A., & Valentine, E. (2000). Quantity and quality of musical practice as predictors of performance quality. *British Journal of Psychology*, 91(3), 353-376. https://researchonline.rcm.ac.uk/id/eprint/2174 (unv)
- Duke, R. A., Simmons, A. L., & Cash, C. D. (2009). It's not how much; it's how: characteristics of practice behavior and retention of performance skills. *Journal of Research in Music Education*, 56(4), 310-321. (title and pages from memory; findings via secondary sources: https://www.musicmark.org.uk/news/8-things-top-practicers-do-differently/) (unv, mem)
- Miksza, P. (2011). A review of research on practicing: summary and synthesis of the extant research with implications for a new theoretical orientation. *Bulletin of the Council for Research in Music Education*, 190, 51-92. (unv)
- Hallam, S., Rinta, T., Varvarigou, M., Creech, A., Papageorgi, I., Gomes, T., & Lanipekun, J. (2012). The development of practising strategies in young people. *Psychology of Music*, 40(5), 652-680. https://pure.unic.ac.cy/en/publications/the-development-of-practising-strategies-in-young-people/ (unv)
- Chaffin, R., Imreh, G., & Crawford, M. (2002). *Practicing Perfection: Memory and Piano Performance*. Erlbaum. https://www.schweitzer-online.de/en/buch/Chaffin/Practicing-Perfection/9780805826104/A1898069/ (unv)
- Daniel, R., & Bowden, A. (2013). Survey of teachers on the intermediate piano stage (583 teachers, UK/USA/Australia). *British Journal of Music Education* (exact title not confirmed). Summary: https://researchonline.jcu.edu.au/26114/ (unv)

**Motor learning and learning science**

- Salmoni, A. W., Schmidt, R. A., & Walter, C. B. (1984). Knowledge of results and motor learning: a review and critical reappraisal. *Psychological Bulletin*, 95, 355-386. (unv)
- Winstein, C. J., & Schmidt, R. A. (1990). Reduced frequency of knowledge of results enhances motor skill learning. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 16, 677-691. (described via review: https://pmc.ncbi.nlm.nih.gov/articles/PMC7205416) (unv)
- Sigrist, R., Rauter, G., Riener, R., & Wolf, P. (2013). Augmented visual, auditory, haptic, and multimodal feedback in motor learning: a review. *Psychonomic Bulletin & Review*, 20, 21-53. https://www.doi.org/10.3758/S13423-012-0333-8 (unv)
- Wulf, G., & Lewthwaite, R. (2016). Optimizing performance through intrinsic motivation and attention for learning: the OPTIMAL theory of motor learning. *Psychonomic Bulletin & Review*, 23, 1382-1414. https://oasis.library.unlv.edu/kns_fac_articles/123 (unv)
- Wulf, G., & Shea, C. H. (2002). Principles derived from the study of simple skills do not generalize to complex skill learning. *Psychonomic Bulletin & Review*, 9, 185-211. (mem)
- McKay, B., et al. (2022). Meta-analytic findings of the self-controlled motor learning literature: underpowered, biased, and lacking evidential value. https://raw.github.com/cartermaclab/carterlab-papers/main/2022_mckay-etal_meta-analytic-findings-of-the-self-controlled-motor-learning-literature-underpowered-biased-and-lacking-evidential-value.pdf (unv)
- Self-controlled feedback and behavioral outcomes in motor skill learning: a meta-analysis (2025). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12467369/ (unv)
- Brady, F. (2004). Contextual interference: a meta-analytic study. *Perceptual and Motor Skills*, 99 (journal and pages from memory). https://www.gwern.net/docs/spaced-repetition/2004-brady.pdf (unv, mem)
- Contextual interference in adult and older-adult motor learning, systematic review (2024). *Frontiers in Psychology*. https://frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1377122/full (unv)
- Brunmair, M., & Richter, T. (2019). Similarity matters: a meta-analysis of interleaved learning and its moderators. *Psychological Bulletin*. https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf (unv)
- Carter, C. E., & Grahn, J. A. (2016). Optimizing music learning: exploring how blocked and interleaved practice schedules affect advanced performance. *Frontiers in Psychology*, 7, 1251. https://pmc.ncbi.nlm.nih.gov/articles/PMC4989027/
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. *Psychological Bulletin*, 132(3), 354-380. https://pubmed.ncbi.nlm.nih.gov/16719566/
- Rowland, C. A. (2014). The effect of testing versus restudy on retention: a meta-analytic review of the testing effect. *Psychological Bulletin*, 140(6), 1432-1463. https://www.scinapse.io/papers/2050255700 (unv)
- Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: creating desirable difficulties to enhance learning. In *Psychology and the Real World* (pp. 56-64). Worth. https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf (unv)

**Sight-reading**

- Kopiez, R., & Lee, J. I. (2006). Towards a dynamic model of skills involved in sight reading music. *Music Education Research*, 8(1), 97-120. (via search summary; the USP-hosted PDF link returned a different page)
- Kopiez, R., & Lee, J. I. (2008). Towards a general model of skills involved in sight reading music. *Music Education Research*, 10(1), 41-62. (unv)
- Lehmann, A. C., & McArthur, V. (2002). Sight-reading. In R. Parncutt & G. E. McPherson (Eds.), *The Science and Psychology of Music Performance* (pp. 135-150). Oxford University Press. (citation only; content not read)
- Lehmann, A. C., & Ericsson, K. A. (1996). Performance without preparation. *Psychomusicology*, 15, 1-29. (secondary only)
- McPherson, G. E. (1994). Factors and abilities influencing sightreading skill in music. *Journal of Research in Music Education*, 42(3), 217-231. (secondary only)
- Mishra, J. (2014). Improving sightreading accuracy: a meta-analysis. *Psychology of Music*, 42(2). https://journals.sagepub.com/doi/10.1177/0305735612463770 (abstract only)
- Waters, A. J., Townsend, E., & Underwood, G. (1998). Expertise in musical sight reading: a study of pianists. *British Journal of Psychology*. https://scholar.usuhs.edu/en/publications/expertise-in-musical-sight-reading-a-study-of-pianists/ (unv)
- Waters, A. J., Underwood, G., & Findlay, J. M. (1997). Studying expertise in music reading: use of a pattern-matching paradigm. *Perception & Psychophysics*. https://scholar.usuhs.edu/en/publications/studying-expertise-in-music-reading-use-of-a-pattern-matching-par/ (unv)
- Furneaux, S., & Land, M. F. (1999). The effects of skill on the eye-hand span during musical sight-reading. *Proceedings of the Royal Society B*, 266, 2435-2440. https://pmc.ncbi.nlm.nih.gov/articles/PMC1690464 (unv)
- Pike, P. D., & Carter, R. (2010). Employing cognitive chunking techniques to enhance sight-reading performance of undergraduate group-piano students. *International Journal of Music Education*, 28(3), 231-246. https://repository.lsu.edu/music_pubs/40 (abstract only)
- Penttinen, M., & Huovinen, E. (2011). The early development of sight-reading skills in adulthood: a study of eye movements. *Journal of Research in Music Education*, 59(2), 196-220. https://journals.sagepub.com/doi/10.1177/0022429411405339 (abstract only)
- Stewart, L., Walsh, V., & Frith, U. (2004). Reading music modifies spatial mapping in pianists. *Perception & Psychophysics*, 66(2), 183-195. https://research.gold.ac.uk/id/eprint/45 (abstract)
- Leikvoll (2025). Reading music or reading notes? Rethinking musical stimuli in eye-movement research. *Journal of Eye Movement Research*. https://pmc.ncbi.nlm.nih.gov/articles/PMC12821705/
- Wolf, T. (1976). A cognitive model of musical sight-reading. (journal details from memory; could not retrieve; known only through citations by later papers) (mem)

**Dynamics and touch**

- Goebl, W., Bresin, R., & Fujinaga, I. (2014). Perception of touch quality in piano tones. *Journal of the Acoustical Society of America*. https://www.researchgate.net/profile/Werner-Goebl/publication/269274469_GoeblBresinFujinaga2014-JASA-PianoTouchQuality1/links/548576440cf24356db60f1e0/GoeblBresinFujinaga2014-JASA-PianoTouchQuality1.pdf (unv)
- Bernays, M., & Traube, C. (2014). Expressive production of piano timbre: touch and playing techniques for timbre control in piano performance. *Frontiers in Psychology*, 5, 157. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00157/pdf (unv)
- Kinoshita et al. (2007). Loudness control in pianists as exemplified in keystroke force measurements on different touches. *Journal of the Acoustical Society of America*, 121 (author list from memory). https://www.immm.hmtm-hannover.de/fileadmin/www.immm/Publikationen/Kinoshita_et_al_JASA_121_May_2007.pdf (title from the URL; findings via secondary citation)
- Hamond, L. F., Welch, G., & Himonides, E. (2019). The pedagogical use of visual feedback for enhancing dynamics in higher education piano learning and performance. *Opus*. https://www.researchgate.net/publication/337881521 (unv)

**Motivation and gamification**

- Evans, P. (2015). Self-determination theory: an approach to motivation in music education. *Musicae Scientiae*, 19(1), 65-83. https://selfdeterminationtheory.org/wp-content/uploads/2021/05/2015_Evans_SDT_MusicEdu.pdf (abstract only)
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*, 125(6), 627-668. https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf (unv)
- Hamari, J., Koivisto, J., & Sarsa, H. (2014). Does gamification work? A literature review of empirical studies on gamification. *HICSS 47*, 3025-3034. https://research.aalto.fi/fi/publications/does-gamification-work-a-literature-review-of-empirical-studies-o/ (unv)
- Koivisto, J., & Hamari, J. (2019). The rise of motivational information systems: a review of gamification research. *International Journal of Information Management*, 45, 191-210. https://www.utupub.fi/handle/11111/57003 (unv)
- Sailer, M., & Homner, L. (2020). The gamification of learning: a meta-analysis. *Educational Psychology Review*, 32(1), 77-112. https://link.springer.com/article/10.1007/s10648-019-09498-w
- Bai, S., Hew, K. F., & Huang, B. (2020). Does gamification improve student learning outcome? Evidence from a meta-analysis and synthesis of qualitative data in educational contexts. *Educational Research Review*. Summary: https://www.gbl.uzh.ch/quartz/references/Bai-et-al.-(2020) (unv; figures from a summary page)
- Zainuddin, Z., Chu, S. K. W., Shujahat, M., & Perera, C. J. (2020). The impact of gamification on learning and instruction: a systematic review of empirical evidence. *Educational Research Review*, 30, 100326. https://hub.hku.hk/handle/10722/289296 (findings not retrieved)
- Mekler, E. D., Brühlmann, F., Tuch, A. N., & Opwis, K. (2017). Towards understanding the effects of individual gamification elements on intrinsic motivation and performance. *Computers in Human Behavior*, 71, 525-534. https://edoc.unibas.ch/32047/ (abstract)
- Hanus, M. D., & Fox, J. (2015). Assessing the effects of gamification in the classroom. *Computers & Education*, 80, 152-161. (findings via secondary summaries; full text not read)
- Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation. *American Psychologist*, 57(9), 705-717. https://goal-lab.psych.umn.edu/orgpsych/2020/readings/5.%20Motivation/Locke%20&%20Latham%20(2002).pdf (abstract only)
- Engeser, S., & Rheinberg, F. (2008). Flow, performance and moderators of challenge-skill balance. *Motivation and Emotion*, 32, 158-172. https://www.uni-trier.de/fileadmin/fb1/prof/PSY/PGA/bilder/Engeser___Rheinberg_2008.pdf (abstract)
- Wilson, R. C., Shenhav, A., Straccia, M., & Cohen, J. D. (2019). The Eighty Five Percent Rule for optimal learning. *Nature Communications*, 10, 4646. https://pmc.ncbi.nlm.nih.gov/articles/PMC6831579
- Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: modelling habit formation in the real world. *European Journal of Social Psychology*, 40, 998-1009. https://bps.org.uk/research-digest/how-form-habit (summary page)
- Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *ACL 2016*, 1848-1858. https://preview.aclanthology.org/fix_video/P16-1174.pdf (vendor-affiliated)
- Bloom, B. S. (1984). The 2 sigma problem: the search for methods of group instruction as effective as one-to-one tutoring. *Educational Researcher*, 13(6), 4-16. https://Www.Gwern.net/doc/psychology/1984-bloom.pdf (unv)
- Kulik, C.-L. C., Kulik, J. A., & Bangert-Drowns, R. L. (1990). Effectiveness of mastery learning programs: a meta-analysis. *Review of Educational Research*, 60, 265-299. (citation only)

**Syllabi**

- Teacher compilation of ABRSM piano technique requirements, Grades 1-8. https://margaretdentonpiano.com/ABRSM%20Technique%20levels%20complete.pdf (PRAC; syllabus year not stated, appears pre-2021)
- Morin, J. (2022). Technical requirements charts for the RCM 2022 Piano Syllabus. https://colorinmypiano.com/wp-content/files/RCM_2022_Technical_Requirements_Charts_Prep-10.pdf (PRAC; author says charts are not a replacement for the syllabus)
- The Royal Conservatory (2022). Piano Syllabus, 2022 Edition. https://teacherportal.rcmusic.com/getattachment/57f3734d-97e5-4777-b67e-4b1111ee31a3/piano-syllabus-2022-edition.pdf (found, not opened)

**Industry and unverified**

- Duolingo streak and retention figures (for example "+14% day-14 retention from streak wager"): blog-level claims only, not traced to a primary source. Not relied on above.
