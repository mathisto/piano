# The horizon: traps and loves, Studies and free courses, Apple guidance now, and iPhone, Mac and Watch

Compiled 2026-11-01 for the owner's request of the same day: a dedicated section for Hanon and the other studies, with community content packs like Piano Marvel's (nothing for sale); find the most complained-about and the best-loved features across piano apps and make sure Piano Forte avoids the first and does the second; apply the latest iOS and iPadOS features and Liquid Glass practice, with up-to-date guidance in the repo; and say what parallel iPhone and Mac versions, and an Apple Watch companion that ticks the metronome silently, would take and look like.

It is a synthesis of three research passes run the same day (user voice across 14 apps and community content models; Apple UI and native features; iPhone, Mac and Watch), checked against the repo at HEAD e15144e and then 9ec6f60 (library-and-profile C1 and S1 merged while this was written). It builds on `docs/research/practice-path.md` (decisions 1 to 10) and `docs/research/library-and-profile.md` (decisions 11 to 22), all accepted by the owner. Nothing here replaces them; section 6 merges the three plans into one phase list. The stale Apple passages in `ios-native.md`, `ios-ux.md` and `platforms.md` were corrected in place the same day, with a dated note at each.

Facts fixed for this pass, overriding the research reports where they disagree: the Apple Developer account is **paid** (Individual, team TC8XUVBATG, since 2026-10-31; TestFlight builds ship); the owner's iPad Air 4 runs **iPadOS 26.5** (checked on the device on 1 Nov), not 27; whether the owner has an iPhone or an Apple Watch is **unknown** (decision 33).

Evidence labels are practice-path's: **MA** meta-analysis or systematic review, **EXP** controlled experiment, **OBS** observational, survey, review-count or dataset study, **REV** narrative review or theory, **PRAC** teacher, syllabus or board document, **IND** product behaviour or vendor claim (Apple's pages and sessions count as IND), **INF** our own inference. **REPO** is measured or read in this repo. **(checked)** marks a claim this synthesis verified itself, on the repo, the machine or Apple's own page. (unv) means read only as an abstract, snippet or summary. Reddit and store counts are OBS: they order themes, they do not measure them.

---

## 1. The recommendation on one page

**Studies and courses: build it, as a file, not a marketplace.** A *course* is a small JSON list that names things the app can already resolve: catalogue pieces by id, generated exercises by their settings, Read stages and Scales stages by id, each with an optional note, hand, tempo and which aids are on. It never carries music, so it carries no licence risk and needs no moderation of content. The Technique page gains a **Studies** section at its top (Hanon, Czerny, Burgmüller, Clementi), each study book a course that says "next is No. 4 of 18"; repertoire courses (Schumann's Album for the Young, the Anna Magdalena notebook) sit behind a Courses chip on Songs. First-party courses ship in the bundle first. Then import by file and by a link that carries the whole course in its fragment (no server sees it), and a `courses/` folder in the public repo that anyone can add to by pull request, checked by CI and read by a human. No accounts, ratings, comments, uploads or store: those are what made Anki's shared decks noisy and MuseScore.com r/piano's most hated site (OBS). A course with notes is also the free version of the teacher assignment Piano Marvel and Sight Reading Factory charge for (IND).

**Traps and loves: the app already avoids the loud traps** (billing tricks, vanishing songs, ads, accounts, locked paths, star pressure, mic misdetection) and does most of the loved things. The gaps that matter: the thin start (few easy pieces), studies that exist but are scattered and graded as hard (all 20 Hanon pieces sit at grade 4 or 5, checked), finger numbers that cannot be turned off, own-file import that a newcomer cannot find, progress split between devices, no Dynamic Type, no answer from a human without a GitHub account. Each has a named fix in section 2.

**Apple guidance: the app's choices hold, with five fixes.** Liquid Glass belongs to system controls, never to content; a web view cannot render it and should not imitate it. Apple's own brand session (WWDC26 251) says brand lives in the content layer, which is exactly Urtext. What to do now: put the seven tabs in the View menu and the in-app settings below the system Settings item (HIG, checked); an opt-in daily practice reminder; Dynamic Type through the system text size; a layered Icon Composer icon; and an iCloud Drive backup that doubles as sync. The April 2027 rule (iOS 27 SDK for uploads, checked on Apple's news page) is already met: this Mac builds with Xcode 27.1 (checked).

**iPhone, Mac, Watch: in that order, each behind a hard gate.** The iPhone is the same binary with one setting flipped and a layout pass (about 3 sessions), but needs an iPhone to test on. The Mac is free twice over: the website in Chrome (make it installable with a manifest) and the iPad app running on Apple silicon; but a third device multiplies data islands, so the Mac app waits for sync. The Watch can only pair with an iPhone, plays haptics only while its app is frontmost or in a workout session, and has no measured timing; a silent wrist metronome is possible and the least proven idea in this report. A silent pulse on the staff, and a click sent to the FP-10's own headphones, answer "practise without waking the house" first, on every device, with no new platform.

**The four calls that shape it.**

- **A course names; it never carries.** Every item resolves to something already licensed, graded and hash-pinned in the catalogue, so a shared file can be wrong but cannot be infringing or harmful.
- **System glass, our paper.** Native surfaces the app presents (pairing, file picker, share sheet, alerts, menu bar) are glass for free; the web content stays opaque paper and ink.
- **Sync before screens.** A second or third Apple device is worth little while each holds its own progress; one shared folder in iCloud Drive, merged by the export code that already exists, comes before the iPhone and the Mac app.
- **Try before building, on the wrist.** A week with an existing watch metronome answers whether a pianist feels the tap, for nothing, before five sessions of SwiftUI.

---

## 2. Traps and loves

Sources: 1-2 star App Store reviews since 2025-11 for 14 apps (Simply Piano 162, Hello Piano 60, flowkey 48, Tonestro 41, Skoove 31 and others), Trustpilot for four apps, 51 full Reddit comment trees across r/piano, r/pianolearning and r/learnpiano (Jun 2024 to Nov 2026), Hacker News (all OBS, counted by regex, which orders themes and does not measure them). Store reviewers write about money; Reddit regulars, closer to this app's users, write about teaching. Use Reddit for design and the store for trust.

### 2.1 The traps

| # | Trap | Evidence | Piano Forte | Fix for the gap |
|---|---|---|---|---|
| 1 | Trials that charge, cancellation that fails, "lifetime" plans that lose songs | The top theme everywhere: 78% of Hello Piano's and 51% of Simply's low stars; Playground's lifetime plan lost its licensed songs after two years (OBS) | **Avoids.** Free, no ads, no account, MIT, and it says so | None. The public repo and the one-file export are the proof against a rug-pull; keep both |
| 2 | Songs removed; a second paywall | "Flowkey just deletes songs now?"; 16% of flowkey and 21% of Yousician low stars (OBS) | **Avoids.** Public-domain, credited, hash-pinned; `aliases` keep ids across rebuilds (REPO) | None |
| 3 | No songs people recognise | Pop and film are the most asked-for; three threads ask for an app that takes your own files (OBS) | **Not yet, by licence policy.** Own-file import exists but a newcomer cannot find it | T1: a "Bring your own MIDI or MusicXML" line in Set up and on Songs; Files open-in (built 30 Oct, not seen on the iPad) |
| 4 | The falling-notes crutch: "it teaches you to copy" | Strong on Reddit, about Synthesia and the subscription apps alike; players turn aids off themselves (OBS) | **Partly.** The staff is the main view; note names, judgement words and live marks fade. Finger numbers on scales are always drawn (`staff.ts:422`, no setting, checked) | T1: a Finger numbers switch; a course item may turn note names and finger numbers off (decision 28) |
| 5 | Rhythm, holds, dynamics, pedal not graded | "Three stars and think you're great"; "apps use timing only, not velocity" (OBS) | **Avoids, mostly.** Time, holds and touch are separate lines since practice-path phase 1; windows tuned by feel; nothing seen on the FP-10 yet | P3 (Auto strictness by level); the device sheet |
| 6 | The reverse: over-punishing, or a 16th late still scores 100% | Piano Marvel and flowkey reviews (OBS) | **Partly.** Calibration, Easy, Standard, Strict | P3: Auto follows the Path level |
| 7 | Wait mode as an accountability hole | Playground and flowkey users (OBS) | **Avoids.** The card says "The song waited, so time is not measured." (`ui-results.ts:100`, checked) | None |
| 8 | Plateau after month two; bland or badly graded music | Strong on Reddit: "training wheels", "too easy or too complicated" (OBS) | **Partly.** A strong top end; a thin and mis-graded start (48 grade-1 pieces outside Lieder and studies, library-and-profile 4.6) | G1, G3, and the courses in section 3 |
| 9 | "Almost no etudes, Hanon or Czerny"; "a buffet with no clear path" | A Pianote review; Czerny's "basic trilogy" and Burgmüller Op. 100 recommended in threads (OBS, PRAC) | **Partly.** The material exists (section 3.4) but is scattered, titled "Movement k" and graded hard | K1: the Studies section and first-party courses |
| 10 | Microphone misdetection | 31% of Piano Academy's low stars (OBS) | **Avoids.** MIDI only; the cost is that acoustic-only players are excluded | None (PRODUCT.md) |
| 11 | MIDI that will not connect, or stops after an update | Hello Piano, Piano Marvel ("loss of keyboard recognition since latest update"), Melodics ("the only way to tell is to start playing") (OBS) | **Partly.** The keyboard chip says Connected or No keyboard; in-app Bluetooth pairing is built; nothing seen on the iPad per TestFlight build | Run the device sheet on every TestFlight build; the Appium smoke lane (ios-native B4) once a regression recurs |
| 12 | Stars, streak guilt, gamification | "IT GAVE ME ZERO STARS"; "gimmicky beyond belief" (OBS) | **Avoids.** No points or ranks; a quiet streak with freezes | Keep it so; the reminder (decision 29) must not threaten the streak |
| 13 | Forced paths, locked lessons, A/B-tested progressions | Skoove "locked"; Yousician A/B "could mess up your learning" (OBS) | **Avoids.** Nothing locks (principle 7) | None |
| 14 | No teacher, no technique or posture | The most common Reddit answer is "get a method book and a teacher" (OBS) | **Not yet.** Touch coaching, Listen back, Compare and the teacher summary are partial | A course is a free assignment: a teacher writes one, the summary returns by text (section 3.7) |
| 15 | Ads, "learn piano in a day" | 141 points on one thread (OBS) | **Avoids.** The copy rules forbid transfer claims | None |
| 16 | Login loops, re-pairing every session | Hello Piano, Skoove, Playground on iPad (OBS) | **Avoids.** No account; paired BLE reconnects by itself since iOS 16 (IND) | None |
| 17 | Progress lost, or split between devices | Playground "my progress doesn't save" (OBS) | **Partly.** IndexedDB plus export; a daily backup file to Files (built, not seen on the iPad); the iPad app and Chrome on the Mac are separate; a damaged record is fixed only by Clear all data (ROADMAP) | A5 (iCloud Drive backup that merges, decision 34); T1: skip and report a damaged record instead of Clear all data |
| 18 | Unusable with VoiceOver | Melodics "completely inaccessible" (OBS) | **Not yet.** The staff and highway are canvas and SVG; the Mark list from phase 1 is the screen-reader path to a run's results | A live region for the results line (ios-native N6); `ariaNotify` on iPadOS 27 (section 4.4); A11Y-24 |
| 19 | Text that cannot be enlarged | HIG (IND); A11Y-7 (REPO) | **Not yet.** px type | A4: Dynamic Type (decision 32) |
| 20 | Nobody answers | Pianote's human feedback is its most praised feature (OBS) | **Partly.** Report a problem opens a GitHub form, which needs an account (UX-45) | T1: the owner's address in `REPORT_TO`, so it becomes mail |
| 21 | Android ignored | Piano Marvel's Android "doesn't work well" (OBS) | **Unknown.** Web MIDI is listed for Chrome on Android (platforms.md) | Test the site in Chrome on an Android tablet when one is to hand (platforms.md section 5) |

### 2.2 The loves

| Love | Evidence | Piano Forte | To do |
|---|---|---|---|
| Playing something real in the first sitting | Simply is the most-recommended beginner app even among its critics (OBS (unv)) | **Partly.** Eight starters; few short easy pieces; no famous tunes, by policy | G3 (written first pieces, decision 15); Clementi's Op. 42 lessons as a first course (3.4) |
| Motivation and guidance, "90% of the battle" | Reddit (OBS) | **Partly**, closing with practice-path phase 2 (`nextUp()`, Continue) | P2 |
| A clear method in a clear order | Piano Marvel, Pianote's Method, Playground bootcamps (OBS) | **Partly.** The Path, Start here, the ladder | Courses give each study book its order |
| Wait mode; chunk, slow, build to tempo | Reddit, Trustpilot, HN (OBS) | **Does it.** Learn, A-B loop, tempo ladder, Auto tempo | None |
| Sight-reading with an assessment | Piano Marvel's SASR "superb" (OBS) | **Partly.** Read stages and Sight Run; no single reading level | P5 placement (decision 9) |
| Your own library | Reddit (OBS) | **Does it**; hard to find | T1 |
| Instant, honest feedback | Playground on Trustpilot (OBS) | **Does it** | None |
| Aids you can switch off | Reddit (OBS) | **Mostly** | The Finger numbers switch (T1) |
| A graded library with playlists | OKTAV's five-star reviews (OBS) | **Partly.** Graded; no playlists | Courses are the playlists |
| A human who answers | Pianote, Tonestro (OBS) | **Not yet**; a solo maintainer | `REPORT_TO`; say plainly in Credits that it is one person's project |
| A one-time tool with no streak nagging | Tenuto: 0 of 12 recent reviews low (OBS) | **Does it**, for free | None |
| Not being talked down to | flowkey's "adult look and feel" (OBS) | **Does it.** Urtext, grand staff, bass clef, no cartoon | None |
| Being left alone with the keyboard and a real score | Reddit (OBS) | **Does it.** This is Piano Forte's ground | Keep effects out of the staff (principle 2) |

---

## 3. Studies and courses

### 3.1 How the models work, and the lesson from each

| Model | How it works | Lesson |
|---|---|---|
| Piano Marvel | Teachers upload MIDI, MusicXML or audio, slice measures, set tempo, order into collections and share them with a class (IND) | The unit people trade is an ordered, tempo-set list; sharing stays inside a studio |
| MuseScore.com | Anyone uploads and picks a licence; PDMX found 12.29% of 254,077 "public-domain" scores with conflicting licence metadata (OBS) | Uploader licence labels cannot be trusted; monetising volunteers made it the most hated site on r/piano (OBS) |
| OpenScore, Mutopia | Volunteer transcription, a human proofreader or reviewer, a pull request, a hard licence rule (IND) | A plain repo, a human on the thin layer and a hard rule last; Piano Forte already ships 1,299 OpenScore and 748 Mutopia pieces |
| Anki shared decks | One file, no server needed, no manual review, stars and download counts (IND) | Free sharing became noise and duplicates; one maintained deck beats a thousand forks (OBS (unv)) |
| Hooktheory | Wiki editing over copyrighted songs under a fair-use claim (IND) | Not for an app with no server and no lawyer |
| Noteflight Learn, Sight Reading Factory | Teachers copy demo assignments; generated exercises set by parameters (IND) | A generated exercise is the cheapest content there is: the recipe is the content |
| Synthesia, MIDI sites | Any file, unclear licences, no teaching order (IND) | Unvetted piles with no order are what teachers complain about |

What makes sharing work: one small file that travels by chat or link, content whose licence is already vetted, a human on the thin layer, and **an order with a reason**, which is what players actually trade ("start with Czerny Op. 599 and combine it with etudes from other opuses so that you don't play the same etude two days in a row", OBS). What makes it fail: trusting uploaders' licence labels, abandoned duplicates, a host that must defend copyright, money.

### 3.2 Where studies live

Decision 14 put the studies under Technique, off the piece ladder. The owner now asks for a dedicated section. Both fit one design:

- **Technique gets a Studies section at its top**, above the generated syllabus (which becomes "Exercises"). Each row is a course: the book's name, how far you are ("No. 4 of 18 next"), one Start (the lamp only if it is the page's recommended Start, practice-path 2.5), and an ⋯ with the list. Hanon, Czerny, Burgmüller, Clementi's lessons and the generated drill courses live here.
- **Songs already has a Studies lane** (C1 and S1, merged 1 Nov as 9ec6f60: `kind: study` for the 39 pieces tagged `technique`, listed by composer and number). The lane is the pile; a course is the order and the guidance. Each Studies course on Technique links to its pieces in the lane, and the lane's head links back to the courses.
- **Songs gets a Courses chip in Browse** (library-and-profile Option D) for repertoire courses: Schumann Op. 68, the Anna Magdalena notebook, the ladder's five levels, and any course you imported.
- **No eighth tab.** The HIG says fewer tabs and no overflow (IND, HIG Tab bars, revised 8 Jun 2026); the tab capsule already scrolls at 820 px (ROADMAP Known gaps). Decision 23 holds the alternative.

**Wireframe: Technique with Studies (iPad landscape, 1180 x 820).**

```
+----------------------------------------------------------------------------------------+
| Technique                                                    [ Start: Hanon 3 and 4 ]  |
+----------------------------------------------------------------------------------------+
|  Studies                                                                               |
|  Hanon, The Virtuoso Pianist 1-20     warm-up · two a day, slow     next: 3 and 4  [>] |
|  Burgmüller, 25 Studies Op. 100       one a week · 18 in library    next: No. 4    [>] |
|  Czerny, short exercises Op. 821      reading and patterns          next: No. 7    [>] |
|  Clementi, Introduction Op. 42        the first lessons             3 of 24 done   [>] |
|  Bring a course   (a file, or a link someone sent you)                                 |
|                                                                                        |
|  Exercises                                                                             |
|  Five-finger · Scales · Hands together · Contrary motion · Arpeggios · ...  (as today) |
+----------------------------------------------------------------------------------------+
```

**A course opened.**

```
+----------------------------------------------------------------------------------------+
|  <  Technique    Burgmüller, 25 Studies Op. 100            by Piano Forte · CC0 list   |
|  One short piece a week. Hands apart first, then together at 70%.                      |
+----------------------------------------------------------------------------------------+
|  ✓  1  La Candeur              Level 2   Ready                                          |
|  ✓  2  L'Arabesque             Level 3   Ready                                          |
|  ✓  3  La Pastorale            Level 2   Ready                                          |
|  ●  4  La Petite Réunion       Level 2   Learning · "Left hand alone first."  [ Learn ] |
|     5  Innocence               Level 3                                                  |
|     ...                                                                                 |
|     19 to 25: not in the library yet                                     (greyed)       |
+----------------------------------------------------------------------------------------+
```

### 3.3 The course format

```jsonc
{
  "pf": 1,                                  // format version; the importer sniffs for it
  "id": "burgmuller-op100",                 // stable; progress is stored under it
  "title": "Burgmüller: 25 Studies, Op. 100",
  "by": "Piano Forte",                      // free text, shown, never trusted
  "about": "One short piece a week. Hands apart first, then together at 70%.",   // <= 300 chars
  "licence": "CC0-1.0",                     // of this list, its order and its notes only
  "items": [
    { "piece": "mutopia-202", "sha": "ab12cd34", "note": "Slowly, hands apart.", "hands": "R", "rate": 0.7 },
    { "drill": { "pattern": "scale", "tonic": 7, "hands": "both", "bpm": 60 } },
    { "read": "t-led1" },
    { "scale": "s1" },
    { "piece": "mutopia-218", "view": { "names": false, "fingers": false } }
  ]
}
```

- **Items.** `piece` is a catalogue id (`src/catalog-types.ts`); `drill` is a technique `Opts` object (`src/technique.ts`), range-checked against the patterns that exist; `read` and `scale` are stage ids (`src/drill.ts`, `src/scales.ts`). `note` (at most 140 characters), `hands`, `rate` (a share of the written tempo, 0.4 to 1) and `view` (which aids are on) are optional. Nothing else is accepted.
- **Resolution.** An unknown id shows as a greyed row with its note. `sha` is advisory (rebuilds can change bytes; the repeats patch did): a mismatch says "this piece was updated since the course was written". An alias resolves through `aliases`. All text goes through `textContent`. A course cannot run code, carry bytes or claim a licence for music (INF).
- **Done.** An item is done when its own existing rule says so: a piece at Ready, a drill at a counted good run (`syllabus.ts`), a stage at Solid. The course's next item is the first not done. No new grading.
- **Progress.** `course:<id>` holds the done indices and the last-opened date; add `course:` to the `EXTRA` pattern in `src/backup.ts` (line 29) so export, import and merge carry it, and to the `clearAll` prefixes. One course in progress offers its next item to `nextUp()` as a candidate with the reason "Next in Burgmüller Op. 100", never a gate (principle 7).
- **External files: not in v1.** `{ "file": url }` would be another trust class (an unvetted licence, takedowns). People who want their own MIDI already import it.

### 3.4 What the catalogue actually holds (checked)

Read from `.cache/library/out-reanalyse/catalog.json` (built 30 Oct, 2,241 pieces, build `3446ecc039f9b9bd`):

| Book | In the catalogue | Ids | Grades today | Notes |
|---|---|---|---|---|
| Hanon, The Virtuoso Pianist, Part I | Nos. 1 to 20 of 60 | `mutopia-2037-1` to `-20` | 19 at 4, 1 at 5 | MIDI; titled "Movement k"; tagged `technique`. Graded far too hard: a five-finger pattern in C is not grade 4. `kind: study` (C1, merged 1 Nov) moves them to the Studies lane but keeps the grade, so a course shows no level for them until G1 |
| Czerny, 160 Eight-Measure Exercises, Op. 821 | Nos. 1 to 19 | 19 Mutopia ids | 3 to 5 | Eight bars, about 13 s each; tagged `technique` (with Hanon these are decision 14's 39 studies, now `kind: study`) |
| Czerny, 50 Melodic Studies, Op. 840 | Nos. 1 to 10 | `mutopia-2146` to `-2154`, `-2177` | 2 to 4 | Not tagged `technique`, so C1 (merged 1 Nov) leaves them as pieces: `kindOf` reads only the tag, and its title regex for the `study` form does not match "Übungsstücke" (`scripts/library/kind.ts`). A course names them by id either way; tagging the ten `technique` would put them in the Studies lane too |
| Czerny Op. 599, 261, 299, 740, 849 | **none** | | | The books teachers name ("the basic trilogy 832, 299, 740", OBS) are absent |
| Burgmüller, 25 Easy and Progressive Studies, Op. 100 | Nos. 1 to 18 of 25 | `mutopia-202` to `-230` | 2 to 4 | Nos. 19 to 25 (Ave Maria to La Chevaleresque) absent; titles inconsistent (some "Op. 100 No. n", some the French title alone) |
| Schumann, Album for the Young, Op. 68 | 20 of 43 | | 1 to 4 | Nos. 1 to 14, 16, 18, 25, 26, 32, 36 |
| Anna Magdalena notebook (BWV Anh. 113 to 131) | 14 | | 1 to 3 | Seven at grade 1 (Anh. 114, 115, 116, 118, 120, 121, 131) |
| Clementi, Introduction to the Art of Playing on the Piano Forte, Op. 42 | 76 movements | `mutopia-1938-*` | 14 at 1, 29 at 2, 21 at 3, 8 at 4, 4 at 5 | A method book of short lessons; 39 movements of 32 bars or fewer; titled "Movement k". **The best supply for the thin first rung, and it shares the app's name** |
| Bach | Inventions 15, Sinfonias 15, Little Preludes 3 | | | |
| Gurlitt, Köhler, Beyer, Duvernoy, Heller, Bertini, Diabelli, Türk, Concone | **none** | | | |

Consequences: Hanon, Czerny Op. 821 and 840, Burgmüller 1 to 18, Op. 68 and the Anna Magdalena pieces make courses today. Clementi's Op. 42 needs its movement titles (lesson names from the source) before it reads as a course; a course note can carry the lesson name, but the fix belongs in the catalogue (`title`), not in a list. The missing books go on a hand sourcing list (decision 27), checked one source at a time on Mutopia and IMSLP, never scraped (`public-domain-sources.md`).

### 3.5 First-party courses

All public domain or generated; the catalogue's per-piece licence and the course list's CC0 apply.

1. **Hanon warm-up** (Nos. 1 to 20): two a day, slow, both hands, "stop if it tenses or hurts"; never "finish the book". The Reddit consensus is a small, careful part of practice (OBS); two "stop Hanon" threads (178 and 71 points) say what happens otherwise.
2. **Burgmüller Op. 100**, Nos. 1 to 18, one a week, hands apart first; reordered by the re-grade (G1) where its own numbering and the level disagree.
3. **Czerny for reading and patterns**: Op. 821 for eight-bar sight-reading, Op. 840 as melodic studies, interleaved so no study repeats two days running (the Reddit advice quoted above; contextual interference, MA, `learning-science.md`).
4. **Clementi's first lessons** (Op. 42, the 39 short movements), once titled: the bottom rung that library-and-profile 4.6 found thin.
5. **Album for the Young** and **the Anna Magdalena notebook** as "first real music".
6. **Generated courses at no content cost**: the Technique syllabus as `drill` items (five-finger, then C, G, D and F); Read stages from treble landmarks to ledger lines.
7. **The ladder's five levels** as courses, so the ladder and courses are one mechanism (`src/ladder-data.ts` already is `{ level, id, why }`).

### 3.6 Import, discovery, moderation

- **By file.** `*.course.json` from Files, Mail or a drop on Songs. The iPad's `file` listener (`src/native-app.ts:54`) already routes opened files into `importFiles`; sniff for `"pf"` before the song importer.
- **By link.** `https://pianoforte.mattkelly.io/#course=z:<base64url(deflate(json))>`: the whole course rides in the fragment, which never reaches a server; the native `CompressionStream` does the deflate. A 12-item course is about 400 bytes (INF), small enough for a text message. **Links never fetch a third-party URL:** the page's CSP allows `connect-src` only to itself and pianoforte.mattkelly.io (`index.html:6`, checked), and widening it to GitHub or gists would be a new security surface for no gain over the inline link.
- **The index.** A `courses/` folder in the public repo, one file per course, deployed to `pianoforte.mattkelly.io/courses/` with an `index.json`, read by the app (already inside the CSP). Submit by pull request. CI checks every `piece` id exists, every `drill` validates, text lengths hold, no URLs in text, the list licence is CC0 or CC BY. A human reads the title and the notes (Mutopia's model, at hobby scale). The index is a convenience, not a gate: a course can travel as a file or a link without it.
- **Shown origin.** "Piano Forte" only for courses in the bundle or the repo index; any other shows "From a file" or "From a link". No signing: a signature on a no-account app proves only "the same key as before" (INF).
- **Licence of the list.** CC0 preferred, CC BY allowed. A reference to a CC BY-SA score copies none of it, so share-alike does not attach to a list (INF, not legal advice; `docs/library.md` keeps BY-SA bytes out of the MIT code, and a reference is not bytes).
- **Universal links, later.** With Associated Domains (open now the account is paid), a course link tapped in Messages opens the app instead of Safari. 0.5 to 1 session, once there is someone to share with.

### 3.7 The teacher loop, free

A teacher (or the owner, for himself) writes a course with notes ("Bars 9 to 12 hands apart at 60"), sends the link; the student's progress stays on the student's device; Settings > Data > Practice summary already writes the text that goes back. That is Piano Marvel's and Sight Reading Factory's assignment, minus the account and the platform fee (IND). It is the cheapest honest answer to trap 14.

### 3.8 Not to build

Accounts, ratings, comments, download counts (they need a server), music uploads, a marketplace, trusted uploader licence labels, signed courses, a course editor inside the app in v1 (a JSON file and the validator's error messages are enough for the people who will write them; an editor is the upgrade if non-programmers ask).

---

## 4. Apple platform guidance now

`ios-native.md` (30 Oct) holds the shell detail and stays the reference; `ios-ux.md` (19 Oct) holds the HIG numbers. Both were corrected in place today. This section is what changed and what to do.

### 4.1 Liquid Glass: what it is and what a web-view app should do

- **The rule.** Liquid Glass is the functional layer (bars, sidebars, controls, sheets) floating over the content layer; "don't use Liquid Glass in the content layer"; custom glass "sparingly", only on the most important functional elements; tint only primary actions; brand colour belongs in content (HIG Materials, WWDC25 219 and 356, IND).
- **What changed since 19 Oct.** iOS 26.1 added Settings > Display & Brightness > Liquid Glass, Clear or Tinted (IND (unv), press); iOS and iPadOS 27 replace it with a slider and a more tinted default (IND, Apple newsroom); HIG Tab bars, Sidebars, Menus and Scroll views were revised on 8 Jun 2026, and App icons on 28 Oct 2026 (IND); building with the iOS 27 SDK ignores `UIDesignRequiresCompatibility` ("The system ignores this key when you build for iOS 27 or later", checked on Apple's page). The owner's iPad on 26.5 has Clear and Tinted, not the slider.
- **The brand session.** WWDC26 251, "Communicate your brand identity on iOS": brand in the content layer, familiar chrome, tint for meaning and sparingly, custom fonts must support Dynamic Type, Dark Mode supported, a logo on one tab only (IND). Urtext already matches all of it except Dynamic Type (4.4) and the PF mark in every page's bar (a taste call; flagged, not changed).
- **What a web view can and cannot do.** It cannot render Liquid Glass: Safari's `backdrop-filter: blur()` is a blur, and the SVG refraction trick that imitates glass renders nothing in WebKit (IND (unv), developer write-ups). DESIGN.md already bans `backdrop-filter` (it costs frames over the WebGL highway, rule 7). Every system surface the app presents (the Bluetooth pairing popover, the document picker, the share sheet, alerts, the menu bar) is already system glass and follows the user's Clear, Tinted or slider setting. `prefers-reduced-transparency` does not reach WKWebView (IND (unv), caniuse), and nothing here depends on transparency except near-opaque scrims.
- **Native glass chrome: no.** A native tab bar would show five of the seven tabs and a "More" overflow, which the HIG says to avoid; it would put glass over the play surface, which the content-layer rule warns against; and it would fork the UI from the website. `ios-native.md` section 1 reached the same verdict (option B); the new WKWebView `obscuredContentInsets` (Safari 26, IND) makes it technically easier, not wiser.

### 4.2 The menu bar (built 30 Oct, not yet seen on the iPad)

`AppDelegate.buildMenu` (checked) inserts "Settings…" ⌘, at the end of the application menu, adds a **Go** menu for the seven tabs (⌘1 to ⌘7) after View, a Practice menu, zoom and views in View, and Keyboard Shortcuts in Help. Against the HIG's menu-bar page (revised 9 Jun 2025, checked):

1. "Reserve the YourAppName > Settings menu item for opening your app's page in iPadOS Settings. If your app includes its own internal preferences area, link to it with a separate menu item beneath Settings in the same group." Fix: place the app's own item below the system one, in the same group (first check on the device whether the system already shows a Settings item that opens the app's page; there is no Settings.bundle).
2. "For apps with tab-style navigation, consider adding each tab as a menu item in the View menu." Fix: move the seven tabs from Go into View, keeping ⌘1 to ⌘7. Decision 31 holds keeping Go as a recorded exception.
3. iPadOS 27 adds a setting that keeps the menu bar always on screen (IND (unv), press), taking the status bar's height: check the 56 px top bar at 820 px of height on a 27 device. Not on the owner's 26.5 iPad.
4. iOS 27 hides menu item images by default; the menu has none, so nothing changes.
5. The code overrides `buildMenu(with:)`; `ios-native.md` recommended `UIMainMenuSystem`. Keep `buildMenu` if the iPad shows the menu (it was the supported route through 26); the doc now says so.

### 4.3 Practice reminders (new, P1)

None of the earlier notes plan a reminder except as a watch aside. For a product with a day streak, freezes and a first week, the cue is the missing piece of the habit loop (streaks with repair, Silverman and Barasch 2023, rated M in ROADMAP's evidence rules; that a timed cue raises practice days is INF here, not a sourced finding). Design, all INF:

- Opt-in in Settings, with one time of day; the permission is asked when the switch is turned on, never at launch.
- At most one a day. Each time the app goes to the background, schedule the next three days at that time, skipping any day already practised (`practice:days`), so after three unanswered days it falls silent until you come back. It never chases.
- Words: what is next, never what is at risk. "Ten minutes? Next up: Bass landmarks." Never "Don't lose your streak".
- Local notifications (`UNUserNotificationCenter`) need no push entitlement and no server (IND). A plugin method on `CoreMidiPlugin` (about 40 lines of Swift) rather than a new dependency. iPad app only: the web build would need Web Push and a server.

### 4.4 Icon, Dynamic Type, VoiceOver

- **App icon.** HIG App icons (28 Oct 2026, IND): two formats, a bitmap the system segments into layers (glass only on "large, simple shapes", not on text and thin lines) or a layered Icon Composer file; four appearances (default, dark, clear, tinted), and the system generates the ones you omit. The asset catalog has default, dark and tinted 1024 px PNGs (ROADMAP 14). Make the layered `.icon` from `design/identity/icon-background.svg` and `icon-foreground.svg` in Icon Composer (a GUI tool: the owner, about 30 minutes), then check the mark in Clear and Tinted on the iPad.
- **Dynamic Type.** `font: -apple-system-body` on `:root` ties text to the system size in WKWebView (IND (unv), Use Your Loaf, Furbo). UI text is already the system font (`design-language.md`), so only Newsreader names need their own ratio. Scale text, not the staff and the highway (they have zoom and print-size rules). Claim the App Store's Larger Text label only after a pass at 200% (IND). One session plus a device pass; closes A11Y-7.
- **VoiceOver.** Safari 27 adds `ariaNotify` for announcements (IND, release notes); the owner's 26.5 iPad does not have it, so use an `aria-live` region and call `ariaNotify` where present. The results headline and the coaching point are what to announce.

### 4.5 Native features, prioritised

P1 do now, P2 next, P3 a later bet, No decided against. Effort in agent sessions (2 to 4 hours each).

| Feature | Value here | Effort | Priority |
|---|---|---|---|
| Menu bar per HIG; window-control and menu-bar checks on the device | Built and unverified; two HIG mismatches (4.2) | 0.25 to 0.5 | **P1** |
| Practice reminder (local notification) | The missing cue of the habit loop (4.3) | 0.5 to 1 | **P1** |
| Designed-for-iPad run on this Mac (FP-10 over USB) | Settles whether CoreMIDI shows the keyboard in the Mac build; five minutes now the team is paid | 0.1 | **P1** |
| Web app manifest | Chrome installs the site as a Mac app with the new icon (ROADMAP 14) | 0.25 | **P1** |
| Dynamic Type | Accessibility, the Larger Text label | 1 | P2 |
| Layered app icon | Clear and Tinted look intentional | owner 0.5 h | P2 |
| iCloud Drive backup that merges (section 5.4) | Survives an app delete; carries progress between Apple devices and Chrome on the Mac | 2 | P2 |
| App Intents and Shortcuts ("Start today's practice", "Open Sight Run") | Voice and Spotlight without a tap; classic Siri and Shortcuts run on the A14 (IND) | 1 | P2 |
| Live region and `ariaNotify` | VoiceOver hears results | 0.25 on top of N6 | P2 |
| Universal links | Course and piece links open the app | 0.5 to 1 | P3 |
| Widgets (streak, today's next) | A daily glance on the Home and Lock Screen | 1 to 2 | P3 |
| Background Assets (Apple-hosted packs by level) | Makes the iPad independent of the home server at an App Store release (IND) | 2 to 3 | P3, at release |
| Pencil marks per bar | A teacher's circle on a bar; anchoring to a re-engraved score is the hard part | 1 to 2 (web) | P3 |
| CloudKit sync | Real merge, but a second store beside IndexedDB, and Apple-only | 3 to 4 | P3, only if the folder merge fails |
| Native tab bar or toolbars, imitation glass | Section 4.1 | | No |
| Live Activities on the iPad | Nobody at the keys looks at the Lock Screen | | No |
| Haptics on the iPad Air, Game Center, StoreKit, SharePlay, Focus filters, multiple windows, Foundation Models on the A14 | No hardware, against principle 7, free app, no fit, or not eligible (library-and-profile section 2) | | No |

**iPadOS 26.5 against 27.** The owner's iPad is on 26.5 (checked on the device). Three things in the earlier notes are 27-only: the Bluetooth pairing crash (27.0 and 27.0.1; `PianoNative.swift`'s workaround is gated `#available(iOS 27, *)`, so on 26.5 the plain pairing sheet runs and should work, and ROADMAP's "use USB" warning is about 27.0), `ariaNotify`, and the always-on menu bar setting. Most users of a released app will be on 27. Decision 30.

**The SDK deadline.** From April 2027, App Store Connect uploads must be built with the iOS 27 and iPadOS 27 SDK (Apple developer news, 9 Sep 2026, checked; the "Upcoming requirements" page does not list it yet, checked). This Mac has Xcode 27.1 (checked), so `npm run ios:beta` already builds with it: the deadline is met as long as builds come from here. The consequences (scene life cycle and launch screen mandatory, `UIDesignRequiresCompatibility` ignored, which the app does not set) are already met (`ios-native.md` section 0.7).

---

## 5. iPhone, Mac and Watch

### 5.1 The hard constraints

| Constraint | Evidence | Consequence |
|---|---|---|
| The app is iPad-only today | `TARGETED_DEVICE_FAMILY = 2` in both configurations, set by `e1fe5d1` on 30 Oct (checked); Info.plist still lists iPhone orientations | iPhone is one setting plus a layout pass, a decision not an accident |
| Safari has no Web MIDI, on the Mac or on iOS | caniuse through Safari 27.1 TP and iOS 27.2; WebKit bug 107250 still NEW (IND) | The Mac's browser route is Chrome, Edge or Firefox; Safari users need the app |
| A watch pairs only with an iPhone | Apple support pages (IND (unv)); WatchConnectivity links a watch app to its iPhone app (IND) | No iPad-to-wrist link; everything crosses through an iPhone or the network |
| Watch haptics play only while the app is active, except in a workout session; a second call waits at least 100 ms; no Core Haptics | Apple's `WKInterfaceDevice.play(_:)` page (IND, read by the research pass) | A wrist metronome must keep the screen on, or claim an extended session or workout that does not describe practice (an App Review question) |
| No measured latency or jitter for watch haptics | Nothing found beyond vendor claims (IND (unv)) | It must be calibrated on the wrist before it can be trusted |
| Each device is its own data island | IndexedDB per origin: the iPad app (`capacitor://localhost`), Chrome, and a Mac app would be three (REPO, INF) | Sync before advertising a second device |

### 5.2 What each would look like

**iPhone: the same app, the small screen.** On an iPhone 17 Pro in landscape (874 x 402 pt) about 210 pt remain for the staff with the dock faded: one grand-staff system fits, barely, in the staff-only view, and staff plus falling notes does not (INF, computed from `style.css`). Portrait is right for Today, Progress, Theory, ear and Read cards; landscape for a piece on the stand. A phone rule never offers the split view and raises `--control` from 40 to 44 pt. USB-C iPhones (15 and later) take the FP-10's cable with no adapter (IND (unv)).

```
iPhone portrait, a Read card              iPhone landscape, a piece, staff only
+------------------------------+          +--------------------------------------------------+
| <  Read              FP-10 * |          | <  Prelude in C    Perform|Learn  72 bpm  FP-10 |
|                              |          |  G ====o=========|===o===o=====|=========o====   |
|   G-clef ==================  |          |  F ============|=======o======|=============   |
|          ==o===============  |          |  (one system at a time; no split view)           |
|      What is this note?      |          | keys strip: the next hand position               |
|  |  | | |  | | | |  | | |  | |          +--------------------------------------------------+
+------------------------------+
| Today  Songs  Read  Theory ..|
+------------------------------+
```

**Mac: two free routes.** (a) The website in Chrome, installable as an app with a web manifest (ROADMAP 14 already wants one). (b) The iPad binary on Apple silicon ("Designed for iPad"): Xcode lists "My Mac (Designed for iPad)" for this scheme (IND, research pass), the paid team can run it now, and App Store Connect offers it on Macs unless switched off. Whether CoreMIDI shows the FP-10 inside it is unverified; five minutes settle it. Catalyst, Electron and Tauri: no (`platforms.md` section 3). The Mac's wide window already gets the two-column layout at 1180 px; the iPad's menu bar becomes the Mac's real menus.

**Watch: a complication first, a metronome only if a week says so.**

```
Running (screen held on)        Smart Stack / complications
+--------------------+           +-----+   +-----+   +--------------------+
|  72 bpm  4/4       |           | 12  |   | (O) |   | Practice 12/20 min |
|  * . . .           |           | min |   | 12  |   | Streak 9 days      |
|  Bar 12            |           +-----+   +-----+   | Next: Sight run    |
|  [ Stop ]          |                               +--------------------+
+--------------------+
```

A wrist pulse tied to the app's own beat would share a *schedule*, not a clock: the device that starts the run publishes `{ anchor, bpm, meter, epoch }` seconds ahead, the watch counts locally from `anchor`, and a wrist calibration (tap the FP-10 in time with the pulse sixteen times; the mean is the offset, the spread the honest jitter, as touch coaching already reports bias apart from spread) soaks up what is constant. The iPad's grid stays the truth for judging: the pulse is off in judged paced runs, because 30 ms of unmeasured offset would break principle 4 (INF, research pass 3.4).

### 5.3 The owner's spitballs, rated

| Idea | Verdict | Why |
|---|---|---|
| A dedicated Studies section | **Strong** | The material is in the library, scattered and mis-graded; an order is what players ask for (sections 2 and 3) |
| Community packs like Piano Marvel's | **Strong, as a free file** | The course format and a repo index give the value with none of the marketplace's failure modes |
| A curriculum marketplace | **Trap** | Accounts, ratings and uploads are where Anki, MuseScore.com and Hooktheory went wrong |
| Liquid Glass throughout | **Mostly a trap for a web view** | System surfaces already have it; imitation in content is against Apple's own rule and costs frames |
| The latest native features | **Strong, selectively** | Reminder, Dynamic Type, menu bar, icon, App Intents; not Live Activities, Game Center or native tab chrome |
| A parallel iPhone version | **Good, gated** | Same binary, about 3 sessions, but needs an iPhone in hand and sync first |
| A parallel Mac version | **Strong and nearly free** | Chrome plus a manifest now; the iPad app on the Mac after sync |
| A watch that ticks the metronome silently | **Possible, weakest evidence** | Background haptic limits, a weak motor (reviewers prefer the dedicated Soundbrenner wearable, IND (unv)), no timing data, and an iPhone required |
| A watch practice timer, a count-in tap, which-hand taps, heart rate, remote start and stop | **Gimmicks** | The app counts minutes; a count-in needs the same session machinery for four taps; one motor cannot say which hand; heart rate has no link to learning and pauses the haptics |

### 5.4 Ideas beyond the reports

1. **Sync through one iCloud Drive folder (strong).** Each device writes its existing backup file (`saveBackup`, built 30 Oct) as `Piano Forte/<device>.json` into the app's iCloud Drive folder; on open, each merges the other devices' files with the import merge that already exists (`src/backup.ts`: per record, `byTs`, max for days and minutes). Each device writes only its own file, so iCloud never sees a conflict. Chrome on the Mac reaches the same folder through a folder the player picks once (Chrome's File System Access, a persisted handle). That covers the iPad, an iPhone, the Mac app and Chrome on the Mac with no server, no account beyond the Apple ID the device already has, and no second schema; it fits principle 5 better than the sync-code relay. Unverified (INF, M): iCloud placeholders for files not yet downloaded (the native side must ask for the download), and Chrome reading a dataless file in the iCloud Drive folder. About 2 sessions. The sync-code relay on quartz stays the answer if Android or another browser joins (decision 34).
2. **A click in the FP-10's own headphones (strong if it works).** For silent practice the problem is the room, not the wrist. With headphones in the FP-10, its own speakers are off and the iPad's click is the only sound in the room. Send the click to the keyboard as a short, quiet, very high note over MIDI out, scheduled ahead with a timestamp (Web MIDI `output.send(data, t)` in Chrome; `MIDISendEventList` with a future host time natively): it then sounds in the player's ears with the keyboard's own latency and nothing in the room. Unverified (INF): which note and velocity read as a click on the FP-10, and whether it masks the player's own notes. A ten-minute test from Chrome before any code (decision 36). About 0.5 session: the app has MIDI in, not out.
3. **A silent pulse on the staff (strong, from the research pass).** A slow ink-tone pulse on the current-bar marker, never amber (amber means "play this") and never a flash, honouring reduced motion. It works on every device with no pairing, and it is what the player is already looking at. 0.5 session.
4. **Course links as the cross-device carrier.** The same link opens a course on any device, so the iPhone, the Mac and a teacher's student need no sync to share a plan.
5. **The phone as the away-from-the-piano trainer.** Theory, ear, rhythm echo and Read cards with headphones and on-screen keys already fit a phone in portrait; that, not a "companion mode", is the iPhone's real use, and its minutes count as effort like any other.

### 5.5 Effort and order

| # | Step | Effort | Gate |
|---|---|---|---|
| 1 | Designed-for-iPad run on this Mac with the FP-10 over USB; web manifest | 0.25 session | none |
| 2 | Silent staff pulse; the MIDI-out click test, then the click | 0.5 + 0.5 session | the test sounds right |
| 3 | W0: a week with an existing watch metronome while playing | $0 to $5, a week | a watch you wear |
| 4 | iCloud Drive folder sync | 2 sessions + device days | decision 34 |
| 5 | iPhone: flip the family, layout pass, TestFlight | 3 sessions | an iPhone (decision 33), step 4 |
| 6 | Mac app left on in App Store Connect, one test | 0.5 session | steps 1 and 4 |
| 7 | iPhone reminder that mirrors to the watch; a Live Activity for a phone session | 1 to 1.5 sessions | the iPhone in real use |
| 8 | Watch complication from a summary record | 1 to 2 sessions | a watch, step 7 |
| 9 | Watch metronome, then the shared schedule and wrist calibration | 2 to 3, then 2 sessions + device days | W0 positive |

Steps 7 to 9 add a second UI language (SwiftUI) to a repo that is TypeScript apart from 323 lines of Swift (checked); keep the watch app small and fed by summaries, never by the web app's schema.

---

## 6. One combined plan

### 6.1 Pace

492 commits since 18 October, 69 of them on 31 October and 1 November (REPO). A phase is one agent session of two to four hours, as in practice-path and library-and-profile; two or three such branches run in parallel worktrees in a round. Build time is rarely the limit. The limits are the owner's looks on the iPad, devices nobody has, weeks of practice data, and App Review.

### 6.2 The phases

**P** is practice-path, **L, C, S, G, R** library-and-profile (both unchanged); **A** Apple shell, **K** courses, **T** traps, **X** other platforms are this plan's.

| # | Phase | Builds | Estimate | Needs |
|---|---|---|---|---|
| done | P1 + L1 | practice-path phase 1 with `got`, `sp` and month-keyed card rows | shipped (e15144e) | |
| 1 | **A1** Shell fixes and checks | tabs into View and settings below Settings (decision 31); web manifest; the Designed-for-iPad run; device-sheet lines for window controls, the menu bar and the icon in Clear and Tinted | 0.5 | nothing |
| done | C1, S1 | catalogue fix, `kind`, sidecar, covers, facets with a Studies lane | merged 1 Nov (9ec6f60); the catalogue publish and the iPad look are owed (`docs/changes/library-c1-s1.md`) | |
| 3 | P2 + L2 | `nextUp()`, Continue, `by` | 1 (as planned) | P1 |
| 4 | **K1** Studies and first-party courses | the course loader and validator (pure, unit-tested), `course:` progress in export, merge and clear; Studies on Technique; Courses chip on Songs; a course's next item as a `nextUp()` candidate; the seven first-party courses of 3.5 except Clementi | 1.5, plus an hour of the owner's look at each order | P2 for the Today candidate |
| 5 | **T1** Trap fixes | Finger numbers switch; own-file import findable on first run and on Songs; `REPORT_TO` once the owner gives an address; a damaged IndexedDB record skipped and reported instead of Clear all data | 1 | the owner's address |
| 6 | **A2** Practice reminder | plugin method, Settings row, the three-day schedule of 4.3 | 0.75 | decision 29 |
| 7 | R1, G1, P3 | as planned | 1, 2, 1 | as planned |
| 8 | **K2** Course import and the index | file sniffing on open and drop; `#course=z:` links; `courses/` in the repo with the CI validator; the index page; Clementi's lesson titles in the catalogue and its course | 1 | K1 |
| 9 | **A4** Dynamic Type | root scale from the system size, Newsreader ratio, a 200% pass | 1 + device pass | decision 32 |
| 10 | **A5** iCloud Drive folder sync | 5.4 item 1; Principle 5 reworded in PRODUCT.md | 2 + device days | decision 34 |
| 11 | G2 + S2, G3 | as planned | 2, 1 | G1, P2 |
| 12 | **X0** Silent pulse and the FP-10 click | 5.4 items 2 and 3 | 1 | decision 36 |
| 13 | **A6** App Intents | two or three intents routed into the page | 1 | nothing |
| 14 | **X1** iPhone | family flip, layout pass, TestFlight | 3 | an iPhone, A5 |
| 15 | **X2** Mac app | Designed for iPad on TestFlight, one test | 0.5 | A1, A5 |
| 16 | R3, P4 + R4, P5, R5 | as planned | 1, 2.5, 2, 2 | weeks to months of log |
| 17 | **X3, X4, X5** iPhone extras, watch complication, watch metronome and schedule | 5.5 | 1.25, 1.5, 4.5 | an iPhone in use; a watch; W0 positive |

**This plan's new build:** about 10 sessions that need no new device (A1 0.5, K1 1.5, T1 1, A2 0.75, K2 1, A4 1, A5 2, X0 1, A6 1), plus about 10.5 that wait on an iPhone or a watch (X1 3, X2 0.5, X3 to X5 7.25). With what remains of the two earlier plans (practice-path about 6.5, library-and-profile about 11 after C1 and S1), the whole list is about 30 sessions without new devices and about 40 with all of them. At the observed pace that is two to three weeks of build for the first 30; the calendar is set by the owner's iPad looks, the profile's data (about three months for its last views), and whether an iPhone and a watch exist.

**Dependencies.** P2 before K1's Today candidate; a pipeline run for K2's Clementi titles. A5 before X1 and X2. X1 before X3 and X4. W0 before X4's metronome.

---

## 7. Decisions for the owner

Answer by number. Each has a recommended answer and the alternative. The numbering continues from library-and-profile's 11 to 22.

23. **Where the studies live.** Recommended: a Studies section at the top of Technique (Hanon, Czerny, Burgmüller, Clementi), each book a course that says what is next, and repertoire courses (Schumann Op. 68, Anna Magdalena) behind a Courses chip on Songs; no eighth tab. Alternative: an eighth tab, Studies.
24. **The word.** Recommended: "Course". Alternative: "Book" or "Pack".
25. **What ships first.** Recommended: first-party courses in the bundle first; then import by file and by link, and a `courses/` folder in the public repo added to by pull request, checked by CI and read by a human; never accounts, ratings, comments or uploads. Alternative: import in the first release.
26. **Hanon.** Recommended: Nos. 1 to 20 as a warm-up course, two a day, slow, "stop if it tenses or hurts", no level shown. Alternative: list Hanon as plain studies with no guidance.
27. **The missing study books.** Recommended: a hand sourcing list (Czerny Op. 599, 261 and 299; Burgmüller Nos. 19 to 25; the rest of Op. 68; Gurlitt, Köhler, Beyer, Duvernoy), checked one source at a time, never scraped; generated drills fill the gap meanwhile. Alternative: write Czerny-style exercises from rules now.
28. **Aids you can switch off.** Recommended: a Finger numbers switch, and a course item may turn note names and finger numbers off. Alternative: the switch only.
29. **A practice reminder.** Recommended: opt-in, one time of day, at most one a day, none on a day already practised, silent after three unanswered days, words about what is next and never about the streak; iPad app only. Alternative: no reminder.
30. **iPadOS on your iPad.** Recommended: stay on 26.5 until 27.2 ships with Apple's Bluetooth pairing fix, then update, since most users will be on 27. Alternative: update to 27 now to test the 27-only behaviour.
31. **The menu bar.** Recommended: the seven tabs in the View menu (⌘1 to ⌘7) and the app's own settings below the system's Settings item, as the HIG asks. Alternative: keep Go and Settings as built, recorded as an exception.
32. **Dynamic Type.** Recommended: yes, in the iPad app: one root scale from the system text size, with the staff and the highway left to their zoom; claim Larger Text only after a 200% pass. Alternative: an in-app Text size setting for the website and the app alike.
33. **Your devices.** Question: do you own an iPhone or an Apple Watch, and do you wear the watch while you play? Recommended: until you say, no iPhone or watch work starts. Alternative: borrow or buy a USB-C iPhone (15 or later) for the layout pass.
34. **Progress across devices.** Recommended: each device writes its backup file into the app's iCloud Drive folder and merges the others' when it opens, and Chrome on the Mac reads the same folder once you pick it; Principle 5 becomes "no account, and nothing we run or can read". Alternative: the sync-code relay on quartz (covers Android and any browser, but it is a server to run), or CloudKit.
35. **iPhone and Mac.** Recommended: one universal app after sync (songs in staff-only landscape, Theory, ear and Read in portrait); on the Mac, a web manifest now and the Designed-for-iPad app once sync exists. Alternative: iPad only, and the Mac in Chrome only.
36. **The silent metronome and the watch.** Recommended: a silent pulse on the staff first, then a ten-minute test of a click sent to the FP-10's own headphones, then a week with an existing watch metronome; a watch app only if that week works, complication first. Alternative: build the watch metronome now.

---

## 8. Risks

- **Courses that point at moving targets.** A rebuild can change a piece's bytes or merge two ids. `aliases` and the advisory `sha` cover it; CI on the `courses/` folder runs against the live catalogue on every deploy, and a broken id greys one row, never the course.
- **Studies graded wrong until the re-grade.** Hanon at grade 4 would mislead a course's level line; K1 shows no level for `kind: study` items until G1.
- **Course noise.** If the index grows like Anki's, the human read is the brake; one maintained first-party course per book beats forks, so first-party courses take pull requests instead of duplicates.
- **Inline links can be long.** A 60-item course with notes may pass 2,000 characters; some chat apps cut links (INF). Fall back to a file.
- **The reminder as nagging.** One a day, three days, then silence; words about what is next. Measure turn-offs (the switch going off within a week means the words or the time are wrong).
- **A menu bar nobody has seen.** It was built on 30 Oct and has not appeared on a device; the HIG fixes are tiny, but the device check comes first.
- **Folder sync unknowns.** iCloud placeholders, Chrome's permission prompt on each visit for a persisted folder handle, and big backups (imported songs and takes): if any blocks it, CloudKit or the sync-code relay is the fallback, and the export file still works by hand.
- **Testing on 26.5 while users run 27.** Behaviour that only 27 shows (pairing workaround, `ariaNotify`, the always-on menu bar) stays unverified until the owner updates (decision 30) or a second device on 27 exists.
- **The MIDI-out click** could sound like a stray piano note, or collide with the player's own notes. The ten-minute test decides before any code.
- **A watch built on hope.** No published haptic timing, background limits, a weak motor, an App Review question on session type; W0 and wrist calibration are the guards.
- **Three islands before sync.** Shipping the Mac app or an iPhone before A5 would split progress three ways; the order in 6.2 prevents it.
- **App Review 4.2 on a web-wrapped app** (`ios-native.md` section 8): the native case (CoreMIDI, pairing, Files open-in, menu bar, reminders, App Intents) grows with each A phase; write it into the Review Notes.
- **The owner is the only tester**, on one keyboard and one iPad, as before.

**Unknowns.** Whether the system adds its own Settings item to the iPad app's menu; whether CoreMIDI shows the FP-10 in the Designed-for-iPad build; iCloud Drive and Chrome folder access in practice; which MIDI note reads as a click on the FP-10; how a pianist feels a wrist tap while both hands play; Clementi Op. 42's lesson titles in the Mutopia source.

**What to measure** (local, in the export): course starts and completions per course, and which item stalls (the order may be wrong there); courses imported by file against by link; reminder taps against turn-offs; the share of days practised after a reminder against without (one player, so a trend, not a test); W0's one-week verdict in the owner's words.

---

## 9. Sources

**User voice** (OBS; counts by regex over Apple's public review RSS and archived Reddit; Reddit permalinks are `reddit.com/comments/<id>`)
- Reddit threads read in full: 1qbxj96 1fpnzx5 1uzve08 1tzdzxp 1t30wmz 1g110u6 1of42hd 1fvknxg 1ot3kma 1p5epbn 1n3wydk 1wyjqkx 1wcsr1e 1udr9rf 1f7u0so 1qtbg0r 1g8mvqh 1hfp7jk 1ncidpf 1hxo0vn 1rn130j 1pma25w 1jzg2y0 1nu5ee4 1ote44h 1t3ky30 1wsz8nz 1rqw6qj 1ql9rbn 1paopb7 1o3h7z8 1h7x2ln 1umbr25 1n0ld9z 1sb030x 1wto8dx 1r9d9x9.
- Trustpilot: https://www.trustpilot.com/review/flowkey.com ; https://www.trustpilot.com/review/yousician.com ; https://www.trustpilot.com/review/skoove.com ; https://www.trustpilot.com/review/hellosimply.com
- App Store ids: 1019442026 1020357408 1469033443 1160668178 1016751878 1139846930 1460388277 1390574671 459313476 1046058520 6466106363 1365630760 1429986841 6504540940.
- Hacker News: https://news.ycombinator.com/item?id=41146712 ; https://news.ycombinator.com/item?id=35748980
- Pianote review: https://pianoers.com/pianote-review/ ; GummySearch (unv): https://gummysearch.com/tools/best-products/piano-app/

**Content models** (IND unless marked)
- Piano Marvel uploads: https://pianomarvel.com/feature/uploads
- PDMX licence conflicts (OBS): https://zenodo.org/records/14648209 ; https://arxiv.org/abs/2409.10831
- OpenScore Lieder: https://github.com/OpenScore/Lieder ; Kickstarter (unv): https://openscore.cc/blog/2017/5/30/openscore-kickstart-the-sheet-music-revolution
- Mutopia contribution rules: https://www.mutopiaproject.org/contribute.html
- Anki packaged decks: https://docs.ankiweb.net/importing/packaged-decks.html ; shared-deck noise: https://forums.ankiweb.net/t/ankiweb-shared-decks-filtering-to-limit-noise/15018
- Hooktheory: https://hooktheory.com/support/tabs
- Noteflight Learn (unv): https://notes.noteflight.com/?p=2611 ; Sight Reading Factory assignments: https://static.sightreadingfactory.com/focus/assignmentsForEducators
- Synthesia MIDI sites (unv): https://www.musicianwave.com/free-synthesia-midi-files/ ; Melodics community (unv): https://melodics.com/info/community
- Excalidraw, keys in the URL fragment (unv): https://plus.excalidraw.com/blog/end-to-end-encryption

**Apple** (IND; "checked" read by this synthesis)
- Developer news, 9 Sep 2026 (iOS 27 SDK from April 2027), 16 Oct 2026 (App Review 2.5.19), 28 Oct 2026 (Touch on Mac); checked: https://developer.apple.com/news/
- Upcoming requirements (lists the April 2026 Xcode 26 rule, not yet the 27 one); checked: https://developer.apple.com/news/upcoming-requirements/
- `UIDesignRequiresCompatibility`; checked: https://developer.apple.com/documentation/bundleresources/information-property-list/uidesignrequirescompatibility
- HIG, The menu bar (Settings item, tabs in View; revised 9 Jun 2025); checked: https://developer.apple.com/design/human-interface-guidelines/the-menu-bar
- HIG Materials, Tab bars, Sidebars, Toolbars, Scroll views, App icons (28 Oct 2026): https://developer.apple.com/design/human-interface-guidelines/
- iOS and iPadOS 27 release notes: https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-27-release-notes ; Safari 26 and 27 release notes: https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes
- Adopting Liquid Glass: https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- WWDC26 251 Communicate your brand identity on iOS: https://developer.apple.com/videos/play/wwdc2026/251 ; WWDC26 278: https://developer.apple.com/videos/play/wwdc2026/278 ; WWDC25 219, 356, 208: https://developer.apple.com/videos/play/wwdc2025/219/ , /356/ , /208/
- Apple newsroom, iOS 27 Liquid Glass slider: https://www.apple.com/newsroom/2026/09/major-updates-for-apples-software-platforms-are-now-available/
- `WKInterfaceDevice.play(_:)`: https://developer.apple.com/documentation/watchkit/wkinterfacedevice/play(_:) ; `WKExtendedRuntimeSession`: https://developer.apple.com/documentation/watchkit/wkextendedruntimesession ; Live Activities on Apple Watch (WWDC24 10068): https://developer.apple.com/videos/play/wwdc2024/10068/
- Running iOS apps on macOS: https://developer.apple.com/documentation/apple-silicon/running-your-ios-apps-in-macos ; Mac availability in App Store Connect: https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/manage-availability-of-iphone-and-ipad-apps-on-macs-with-apple-silicon
- Bluetooth MIDI pairing crash on iOS 27: https://developer.apple.com/forums/thread/850584 ; window controls: https://developer.apple.com/forums/thread/790994
- Watch pairing (unv): https://support.apple.com/en-ng/HT204505 ; https://discussions.apple.com/thread/253333255

**Secondary** (IND (unv))
- Liquid Glass Clear and Tinted in 26.1: https://9to5mac.com/2025/10/20/ios-26-1-beta-4-adds-new-setting-to-tone-down-liquid-glass-transparency/ ; MacStories iOS 27 review: https://www.macstories.net/stories/ios-and-ipados-27-review/2/
- NN/g on Liquid Glass: https://www.nngroup.com/articles/liquid-glass/
- Liquid Glass on the web: https://dev.to/devyatov/liquid-glass-on-the-web-6-ways-to-build-it-with-css-and-svg-3m07 ; `prefers-reduced-transparency`: https://caniuse.com/wf-prefers-reduced-transparency
- Dynamic Type in web views: https://useyourloaf.com/blog/using-dynamic-type-with-web-views/ ; https://furbo.org/?p=2791
- Web MIDI: https://caniuse.com/midi ; https://bugs.webkit.org/show_bug.cgi?id=107250
- Watch metronomes and the Soundbrenner Pulse: https://ask.audio/articles/review-soundbrenner-pulse ; https://apps.apple.com/us/app/pulse-haptic-metronome-for-watch/id1097323003 ; https://apps.apple.com/ro/app/conducto/id6748840117
- Roland FP-10 on a Mac over Bluetooth: https://support.roland.com/hc/en-us/articles/14969314718363-FP-10-How-to-connect-to-a-Mac-via-Bluetooth-MIDI

**Research passes behind this note** (scratch, not in the repo): user voice and packs, Apple UI, platforms, all 2026-11-01.

**In the repo** (REPO): `.cache/library/out-reanalyse/catalog.json` (30 Oct, 2,241 pieces), `ios/App/App.xcodeproj/project.pbxproj` (lines 332 to 360), `ios/App/App/AppDelegate.swift`, `ios/App/App/Info.plist`, `ios/App/App/PianoNative.swift`, `index.html` (CSP), `src/backup.ts`, `src/native-app.ts`, `src/staff.ts`, `src/ui-results.ts`, `src/catalog-types.ts`, `src/technique.ts`, `src/syllabus.ts`, `src/ladder-data.ts`, `DESIGN.md`, `PRODUCT.md`, `ROADMAP.md`, `docs/research/practice-path.md`, `library-and-profile.md`, `ios-native.md`, `ios-ux.md`, `platforms.md`, `learning-science.md`, `public-domain-sources.md`; `xcodebuild -version` on this Mac (Xcode 27.1).
