# Public-domain and open sources for a piano library

Research date: 2026-10-19. Scope: where `piano.mattkelly.io` can get legally safe sheet music in a form its importers can use.

Claim markers used throughout:

- **[V]** verified this session: I fetched the page, queried the API, or ran the code myself.
- **[S]** seen only in a search-result summary or a secondary page. Treat as a lead, not a fact.
- **[U]** unverified: my background knowledge or an inference. Check before relying on it.
- **[X]** the site blocked fetching (403, 404, 503, DNS, or an expired certificate), so I could not read it.

Blocked or unreadable: musescore.com [X 403], musescore.org forum nodes 315935 and 294820 [X 403], kunstderfuge.com [X 403], cpdl.org [X 403], free-scores.com [X 403], audiveris.com [X 403], pianosociety.com [X expired certificate], kern.humdrum.org [X 503], openscore.cc [X DNS failure], Mutopia FAQ [X 404], Commons:Sheet_music [X 404], IMSLP "Copyright Cautions", "Copyright Issues" and "General Disclaimer" [X 404]. 8notes, Classical Archives and Piano Society terms never surfaced in any search.

This is research, not legal advice. Nothing here was checked by a lawyer.

---

## 0. What the app can ingest today (read from source)

All [V], from `src/song.ts` and `src/musicxml.ts`:

- MIDI goes through `fromMidi` (`@tonejs/midi`). Hands come from track count: exactly two tracks means the lower mean pitch is the left hand; anything else splits at MIDI 60. Key signature comes from the first key-signature event, else Krumhansl-Schmuckler estimation. Tempo and time signature come from the file.
- MusicXML goes through `fromMusicXml`. It accepts `score-partwise` only and rejects `score-timewise`. `.mxl` is unzipped with `DecompressionStream`.
- `<repeat>`, `<ending>`, D.C. and D.S. are ignored, so repeated sections play once.
- Grace notes are skipped. Tied notes merge, including across barlines.
- Tempo is read only from `<sound tempo>`. If it is absent, the importer assumes 100 bpm.
- Each `<part>` becomes tracks `part*4 + staff - 1`. `h` (hand) is set only when a part has two or more staves. A one-staff part (a voice line, say) falls back to the pitch split at 60 and lands in the hands.

I tested the real importer on real files [V]. I copied `song.ts` and `musicxml.ts` to the scratchpad and ran them in Node 25. The sections below report the results.

---

## 1. TL;DR

**Recommendation: ship a small curated library (about 40 pieces, under 1 MB) built by a repeatable fetch script. Take Mutopia pieces tagged "Public Domain" as MIDI, take OpenScore Lieder piano parts as MXL, and hand-write the first-notes tier as specs. Use IMSLP only as a manual reference and as an OMR source for gaps. Do not bulk-import anything whose licence label is user-supplied.**

Top five sources, in the order I would build them:

1. **Mutopia Project, "Public Domain" pieces only.** It has 2,124 pieces [V], hand-typeset in LilyPond, with per-piece machine-readable licence and source-edition metadata. It ships LilyPond, MIDI and PDF only, with **no MusicXML** [V]. The MIDI parses cleanly in our importer [V]. Each piece sits in a plain directory (`.ly`, `.mid`, `.rdf`, PDFs) [V]. Shipping the MIDI works today with no new importer code.
2. **Our own specs** (the `starters.ts` format). Zero licence risk for the first-notes tier and for scale or Hanon-style patterns. We own the arrangement and can dedicate it to CC0.
3. **OpenScore Lieder Corpus.** It is CC0 [V], and the GitHub repo directly holds **1,462 `.mxl` files (18.6 MB total)** [V, GitHub tree API]. Raw URLs send `access-control-allow-origin: *` [V], so even the browser can fetch them. All 30 randomly sampled files parsed [V]. They are voice-and-piano songs, mostly intermediate or harder, and the voice part must be filtered out (see section 5).
4. **IMSLP as the master reference, plus OMR for gaps.** It is the best place to find a PD edition of a specific piece, but it is almost entirely PDF (section 2.1), and its terms make automated bulk download a bad idea.
5. **PDMX as a discovery index only.** It holds 250K MusicXML files labelled public domain or CC0 [V], but the labels come from uploaders, and MuseScore's own forum says the PD flag is misleading [S]. Never auto-ship from it.

Everything else is either non-commercial or share-alike (ASAP, MAESTRO, DCML, CPDL), unclear (Kunst der Fuge, Classical Archives, free-scores, 8notes, BitMidi), or the wrong kind of content (choral, string quartets, performance recordings).

**Four things I found that change plans:**

- Mutopia pieces mix licences. Satie's Gnossiennes, Mozart K.545, Beethoven's Moonlight, Diabelli Op.149 and Schumann's Album for the Young are CC BY-SA, not PD [V]. Filter per piece, not per composer.
- Mutopia's file server sends no CORS header [V], so the app cannot fetch from it at runtime. A build-time fetch is the only route, with no backend.
- Four of 30 sampled OpenScore files contain `<repeat>` marks, and three of 30 lack a tempo [V]. Both are importer gaps (section 5).
- On real piano scans, open-source OMR is nowhere near ship quality (section 4). A published 2024 comparison measured symbol-error rates of 75-95% for Audiveris and oemer [V].

---

## 2. Comparison table

Grades are mine. Licence clarity: A = machine-readable per-piece licence I could verify, D = unknown or restrictive. Quality: H = hand-engraved or hand-transcribed, A = auto-converted or crowd-sourced.

| Source | Licence clarity | Quality | Formats | Beginner-intermediate piano | Bulk / API | Verdict |
|---|---|---|---|---|---|---|
| **Mutopia** | A- (per piece: PD, CC BY, CC BY-SA) [V] | H (LilyPond) | `.ly`, `.mid`, PDF; no MusicXML [V] | Good: Burgmüller, Kuhlau, Clementi, Czerny, Bach, Joplin, Chopin [V] | Open directories, robots allows all [V]; RSS feed [V]; no CORS [V] | **Primary** |
| **OpenScore Lieder** | A (CC0 repo-wide) [V] | H (volunteer transcription from scans) | `.mxl`, `.mscz`, `.mscx` in GitHub [V] | Piano parts of songs; mostly intermediate+ | `git clone` or raw URLs with CORS [V] | **Secondary** |
| **OpenScore String Quartets** | A (CC0) [V] | H | `.mscx` in GitHub [V] | None (not piano) | Git | Skip |
| **IMSLP** | B (per-file tags; Canada-based) [V] | H for old engravings; noisy scans | Almost all PDF; `.mxl` accepted but rare [V] | Excellent for finding PD editions | API for work lists only [V]; robots disallows `/images/` and `/library/`, `Crawl-delay: 2` [V] | **Manual reference and OMR input** |
| **PDMX** | C (uploader-claimed; 12.29% internal conflict) [V] | A (crowd-sourced) | `.mxl`, `.mid`, PDF + CSV [V] | Unknown share of piano | 14.4 GB on Zenodo [V] | Index only |
| **MuseScore.com** | C (PD flag is misleading) [S] | Mixed | mscz, MusicXML (account) | Huge but unvetted | ToS unreadable [X]; downloads often paywalled [S] | Avoid scraping |
| **ASAP** | A (CC BY-NC-SA 4.0) [V] | H (non-professional) | MIDI and MusicXML | 222 scores from 16 composers [V] | GitHub | Cannot ship (NC) |
| **MAESTRO** | A (CC BY-NC-SA 4.0) [V] | Performances | MIDI and audio only; no scores [V] | Concert repertoire | 56 MB MIDI-only archive [V] | Test data only |
| **KernScores** | D (no single licence found) [S] | H | Humdrum `**kern` | Bach, Joplin, Beethoven | Download interface [S]; site 503 [X] | Check per dataset |
| **Kunst der Fuge** | D (copyright by default, some CC) [S] | A (sequenced MIDI) | MIDI | Classical, huge | Terms unreadable [X] | Avoid |
| **Classical Archives** | D | A | MIDI from contributors [S] | Classical | Terms not found | Avoid |
| **CPDL** | C (GPL-style CPDL licence, some NC) [S] | H | PDF, MusicXML, MIDI | Choral only | cpdl.org unreadable [X] | Skip |
| **Wikimedia Commons / Wikisource** | B (file-by-file) | Scans mostly | Images; no native notation upload [S] | Some | MediaWiki API [U] | Reference only |
| **Open Goldberg** | A ("free of copyright (all uses allowed)") [V] | H | PDF confirmed [V]; MuseScore project linked [V] | Aria only | Bandcamp, IA | One piece |
| **music21 corpus** | C ("some ... may not be used for commercial uses") [S] | H | MusicXML, kern | Bach chorales, quartets | pip | Per-file check |
| **DCML corpora** | A (CC BY-NC-SA) [S] | H (annotated) | MuseScore, TSV | Beethoven sonatas etc. | GitHub | Cannot ship (NC) |
| **Piano Society** | D (terms not found) | Recordings | MP3, PDF [U] | Classical | Cert expired [X] | Unknown |
| **Free-scores.com** | D | A (user-uploaded) | PDF, MIDI, MP3 [S] | Large | Terms unreadable [X] | Avoid |
| **8notes** | D | A | PDF, MIDI [U] | Large | Terms not found | Avoid |
| **BitMidi / game-MIDI sites** | D | A | MIDI | Pop, game, anime | Terms not found | Do not use |
| **Internet Archive** | Varies | Scans | PDF | Varies | Search API [U] | Reference only |

---

## 3. Per-source detail

### 3.1 Mutopia Project (primary)

- URL: https://www.mutopiaproject.org/. Home page: "2,124" pieces. Formats named: PDF (A4 and Letter), MIDI, LilyPond source. **No mention of MusicXML anywhere** [V]. A directory listing of one piece shows `.ly`, `.mid`, `.rdf`, `.log`, PDFs, `.ps.gz` and a preview PNG, with no `.xml`, `.musicxml` or `.mxl` [V].
- Licence page https://www.mutopiaproject.org/legal.html: three options, quoted [V]:
  - "Public Domain": "The contributor of this music has dedicated their contribution into the public domain."
  - CC-BY: "You must, however, give the original author credit."
  - CC-BY-SA: "if you alter, transform, or build upon the work, you must distribute the resulting work under an identical license." (Versions 4.0 down to 1.0 are accepted.)
  - "provided as-is" with no warranty.
- Contribution rules https://www.mutopiaproject.org/contribute.html [V]. "It is up to the contributor to decide what terms the music is released under." The `license` header must be CC BY-SA 4.0, CC BY 4.0 or "Public Domain". For the PD choice the page requires that the composer, lyricist, arranger and editor "**all** have been dead for at least seventy complete years" and that "The work must have been published prior to 1923". That makes a Mutopia "Public Domain" tag one of the strictest in this survey, and it is safe in the US, EU and Canada at once. I saw the rule on the contribution page; I did not see Mutopia enforce it on legacy pieces. Older pieces predate it, so still check the source edition field.
- Per-piece page https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=202 [V] gives: Licence "Public Domain", with a "CC: No rights reserved" badge; Source "Collection Litolff, 19th Century"; Maintainer "Bas Wassink"; typeset with LilyPond 2.16.1; last updated 2013/Jan/12; Music ID `Mutopia-2013/01/12-202`; and the as-is disclaimer.
- A search results table (`make-table.cgi?Instrument=Piano&Composer=<ID>&searchingfor=<title>`) lists title, licence, piece id and MIDI URL, 10 per page with a "Next 10" link [V]. Composer identifiers follow the pattern `BurgmullerJFF`, `BachJS`, `JoplinS` [V]. There is also an RSS feed of additions at `/latestadditions.rss` [V]. robots.txt: `User-agent: * / Disallow:` (everything allowed) [V]. No rate limit or API terms are stated. I would stay at one request per second.
- Bulk: the GitHub repo https://github.com/MutopiaProject/MutopiaProject says "the entire archive is openly available for download" and has an `ftp` directory [V]. It gives no licence for the repo and no download instructions [V].
- Composer coverage [V]: Bach 417, Beethoven 77, Mozart 96, Chopin 47, Schumann 35, Diabelli 36, Czerny 29, Burgmüller 19, Joplin 18, Satie 16, Grieg 10, Tchaikovsky 9, Kuhlau 3, Clementi 2. Hanon, Beyer and Gurlitt are absent from the composers page [V]. These counts cover all instruments, not just piano.
- **MIDI quality for our importer** [V, I ran it]: three files (Burgmüller Op.100/1, Bach Anh.114, Joplin's The Entertainer) were fetched and parsed by `@tonejs/midi`. All have ppq 384, tempo, time signature and key signature, and exactly two named note tracks ("up"/"down", or "one"/"two"). That is the case where `assignHands` takes the two-track path, so hands come out right. The Entertainer has key-signature changes (C, then F, then C); `fromMidi` uses the first only.
- **LilyPond sources are not trivially machine-convertible** [V on one file]. The Burgmüller `.ly` uses `\relative`, variables, `\include "nederlands.ly"` (Dutch note names) and a `\midi { \tempo 4 = 152 }` block. A converter must cope with all of that.
- **CORS** [V, by curl]: the `.mid` file response has no `Access-Control-Allow-Origin` header, so a browser app on another origin cannot fetch it. Fetch at build time.
- **Mixed licences** [V] (not exhaustive, from the listings I read):
  - Public Domain: Burgmüller Op.100 (all ten listed), Joplin (all ten listed), Czerny Op.840 Nos 1-10, Kuhlau Op.20/1, Clementi Op.36/1, Bach Anh.114/118/120/121/126, Satie Gymnopédies 1-3, Für Elise, Chopin Preludes Nos 4/6/7/15/20, Tchaikovsky Op.39, Grieg Mountain King, Debussy Première Arabesque and Clair de lune.
  - CC BY-SA: Satie Gnossiennes and other Satie (4.0); Diabelli Op.149 (3.0); Schumann Album für die Jugend Op.68 (2.5/3.0); Mozart K.545 (3.0); Beethoven Moonlight (2.5); Chopin Op.28 Nos 1 and 2.
  - Within one composer: Schumann Kinderszenen Nos 1, 5, 7 are PD but Nos 2, 3, 4, 6 are CC BY 3.0 [V]. Bach Inventions 1, 6, 9 are CC BY-SA while 2, 3, 4, 5, 7, 8, 10 are PD [V].
- Not found in Mutopia [V, "no matches"]: Ode to Joy as a piano piece, Beethoven Sonatinas, Bach "Little Prelude", and a "Hymn medley" collection. The Hymn style has only six pieces.
- Attribution rule for our use: PD needs none legally, but credit anyway (section 7). CC BY needs the author credit. CC BY-SA needs credit and share-alike on the resulting work, which complicates a mixed-licence public repo. I would ship PD-only in v1.

### 3.2 OpenScore (Lieder; also String Quartets)

- https://fourscoreandmore.org/openscore/ [V]: "carefully transcribed scores released under the maximally permissive CC0 licence." Collections: Lieder (about 1,500 songs), String Quartets (about 700 movements), Orchestral (about 100 movements, not yet available). **Piano is not a collection** [V]. Hosting: MuseScore.com for online play and GitHub mirrors. "Four Score and More" distributes "compressed MuseScore (mscz) and MusicXML (mxl) scores" [V].
- Lieder repo https://github.com/OpenScore/Lieder [V]: "These scores are released under Creative Commons Zero (CC0)." Public credit is a request, not a licence condition: "asks users to credit OpenScore Lieder for public-facing use". Zenodo v3.0.0 (17 May 2025) is CC0 1.0, 23.5 MB [V]. The Zenodo description says "Most were transcribed in MuseScore 3".
- **Discrepancy:** the README fetch did not mention `.mxl` files, but the GitHub tree API shows them [V]. Totals: 10,609 entries, **1,352 `.mscx`, 1,462 `.mscz`, 1,462 `.mxl`**, plus `.txt` lyrics and `.rntxt` analyses. The `.mxl` files total 18.6 MB. Paths look like `scores/Schumann,_Clara/6_Lieder,_Op.13/4_Der_Mond_kommt_still_gegangen/lc5126921.mxl` [V].
- CORS [V]: `raw.githubusercontent.com/OpenScore/Lieder/main/<path>.mxl` returns `access-control-allow-origin: *`. The app could fetch these directly with no build step.
- Importer test [V]: 30 random `.mxl` files all parsed. Typical result: 2 parts (Voice and Piano), 250-3,000 notes, 14-150 bars. Findings:
  - 3 of 30 had 3-5 parts (duets, choral).
  - 4 of 30 contain `<repeat>` marks (ignored by the importer).
  - 3 of 30 had no `<sound tempo>` (fall back to 100 bpm).
  - Part order is Voice first, then Piano. The voice part is single-staff, so it would land in the hands by pitch split. Filter the voice part out at fetch time.
- Caveat on one piece: a forum comment says Clara Schumann's "Lorelei" is PD in most but not all countries [S]. Check per work.
- Strings: https://github.com/OpenScore/StringQuartets is CC0 with `.mscx` only [V]. Not piano; skip.

### 3.3 IMSLP / Petrucci

- Rules, from https://imslp.org/wiki/public_domain [V]: "died in 1971 or earlier may generally be uploaded to the main IMSLP servers"; "the works of authors who died in 1972 or later are _generally_ still copyrighted"; "any work first published in 1930 or earlier is in the public domain" (US); "All the works of any person who died in 1955 or earlier are generally in the public domain" (EU). "Downloading and/or using an item may not be allowed in your country if it is not in the public domain". IMSLP "makes no guarantee" about status in your country.
- Why Canada: "IMSLP has to follow Canadian copyright law" [V, FAQ]. A work that is PD in Canada but protected in the US can still be hosted; scanning or uploading it could violate US law for US residents [S]. Files that are US-protected but PD in Canada and the EU are served from the unaffiliated EU server [S]. Each file's page marks its status [V].
- **Editions:** urtext and critical editions "may be uploaded to IMSLP **only if 25 years have passed since their publication**" [V]. Edition rights "do not change the fact that the underlying work is in the public domain" [V]. A Burgmüller page I fetched shows the status mix [V]: Schirmer 1903 and Peters scans are "Public Domain"; a 1956 Polish edition is "Public Domain - Non-PD US, Non-PD EU"; a Wiener Urtext edition is flagged for urtext rules; amateur engravings are CC BY 4.0, CC BY-SA 4.0 or CC BY-NC-SA 3.0.
- Permitted licences (https://imslp.org/wiki/IMSLP:Permissible_licenses [V]): CC0, CC BY, CC BY-SA, PD, and Performance-Restricted; NC licences are deprecated.
- **Formats:** "the _only_ file formats IMSLP accepts for scores" are BRF, PDF, MXL, MSCZ and ZIP [V]. MIDI is not a score format there. In practice the Burgmüller Op.100 page lists no MusicXML [V], so IMSLP is a PDF library.
- **Automation:** API docs list only people and works lists, with no file links, rate limits or terms [V]. `robots.txt` has `Crawl-delay: 2` and disallows `/images/`, `/wiki/File:`, `/wiki/Special:` and `/library/` for generic crawlers [V]. File downloads sit behind a disclaimer step [U]. **Do not script IMSLP downloads.** Find the PD edition by hand, download by hand, record the file number and licence in the manifest.
- The site footer says content is "available under the Creative Commons Attribution-ShareAlike 4.0 License", which covers wiki text, not scores [V].
- Bartók, specifically: IMSLP pages for several Bartók works say PD in Canada, the EU and life+50/70 countries, but "probably still protected in the United States unless an exception applies" [S]. Treat Bartók as not shippable from a US-hosted public repo.

### 3.4 PDMX (MuseScore-derived)

- Real and public: Zenodo record 15571083 [V]. **Dataset licence CC BY 4.0.** Files: `mxl.tar.gz` 1.9 GB, `mid.tar.gz` 214 MB, `pdf.tar.gz` 9.6 GB, `PDMX.csv` 225 MB, total 14.4 GB. The CSV `license` column records the original MuseScore licence per score. The paper keeps only Public Domain Mark or CC0 scores: 254,077 files scraped; 102K after deduplication; 14K "rated" [V, arXiv 2409.10831].
- **Reliability problem 1:** version 9 found "a discrepancy between the public-facing copyright metadata" and the file's internal data, affecting 31,221 songs (12.29%). They flag it in a `license_conflict` column and recommend a `no_license_conflict` subset of 222,856 songs [V].
- **Reliability problem 2:** the paper does not audit label accuracy. It says other datasets "fail to adequately vet for copyrighted music" and "cannot assume that all songs in the base PDMX dataset are of high quality" [V]. It reports no instrument breakdown [V].
- **Reliability problem 3:** MuseScore's own forum says the PD flag means a score derived from a PD source, so arrangements of PD works can carry it, "which is known to mislead users" [S]. Newer uploads are CC0, but a CC0 declaration covers only the uploader's rights [S]. A copyrighted anime arrangement mislabelled PD would pass the filter.
- The `homr` project's licence FAQ lists the PDMX subset it used as CC BY 4.0 [V], consistent with the above.
- Use: query the CSV for solo scores by composers who died before 1900, shortlist, then verify each against IMSLP and re-check by ear or eye. Never ship unreviewed.

### 3.5 MuseScore.com

- The site returned 403 to every fetch [X]. From forum snippets [S]: the "Public Domain Mark" option was retired in favour of CC0 for new uploads; existing PD scores keep the label; PD-labelled scores sometimes require a Pro subscription to download; the PD flag can be applied to arrangements of PD works. I found no evidence of a bulk API. Scraping is a terms-of-service risk I could not read. Skip.
- Open Goldberg Variations has a MuseScore.com project page linked from its site [V]; I could not open it.

### 3.6 Research datasets

- **ASAP:** https://github.com/fosfrancesco/asap-dataset. "CC BY-NC-SA 4.0", MIDI and MusicXML, performances from MAESTRO, "The scores were written by non-professionals", 222 to 236 scores depending on which line you read, 16 composers [V]. Non-commercial and share-alike: do not ship.
- **MAESTRO:** CC BY-NC-SA 4.0, about 200 hours of paired audio and MIDI, 1,276 performances, a 56 MB MIDI-only archive; "does not mention sheet music" [V]. Useful for testing performance-MIDI falling notes during development, not for shipping.
- **DCML corpora** (Beethoven, others): ABC is CC BY-NC-SA 4.0 [S]. Same problem.
- **KernScores:** the site was down [X]. Secondary sources say licensing varies per repository and files should carry `YEC`/`YEM` reference records [S]. The 2005 ISMIR paper says scores came from scans via SharpEye [S]. Check each collection if needed.
- **music21 corpus:** BSD code, but "some encodings included in the corpus may not be used for commercial uses or have other restrictions" and "check the license embedded in each composition or directory" [S].

### 3.7 Others

- **Kunst der Fuge:** blocked [X]. A search snippet quotes its info page: "every file here contained is subject to copyright" and "for any non-personal, public or commercial purpose you need to understand and respect our Terms and Conditions" [S]. Creative Commons says part of the collection has been CC-licensed since 2008 [S]. Verdict: do not redistribute.
- **Classical Archives:** MIDI contributed by members; no licence text found [S]. Avoid.
- **CPDL:** the default licence is GPL-derived, requiring recipients to keep all rights and derived works under the same terms; some editors restrict to non-commercial or religious use [S]. Choral anyway.
- **Wikimedia Commons / Wikisource:** a 2018 RfC supported allowing notation formats, but a related ticket was still open and scores are uploaded as images or rendered via the Score extension [S]. Useful for finding scans, not for playable data.
- **Open Goldberg Variations:** https://opengoldbergvariations.org/: downloads are "free of copyright (all uses allowed)" [V]; PDF confirmed [V]; recording CC0 [S]; score created with MuseScore [S]. MusicXML not confirmed.
- **Free-scores.com / 8notes / Piano Society / BitMidi:** terms unreadable or not found. Free-scores describes itself as a platform where "there may be restrictions on the use of the music" [S]. These sites host user-contributed arrangements, so a PD composer does not make a PD file.
- **Internet Archive:** only a pointer: it hosts scans, with item-by-item rights [U].

---

## 4. Conversion routes

### 4.1 OMR (PDF or image to MusicXML)

| Tool | Licence | Runs offline in a build script? | Notes |
|---|---|---|---|
| **Audiveris** | AGPL-3.0 [V] | Yes. Java; `-batch` (no GUI), `-transcribe`, `-export` (MusicXML), `-output DIR` [V] | Latest 5.10.2, March 2026 [S]. "a 100% recognition ratio is simply out of reach in many cases" [V]. Printed music only [S]. Needs about 300 dpi [S]. |
| **oemer** | MIT [V] | Yes. `pip install oemer`, `oemer <image>`, first run downloads checkpoints (up to ~10 minutes) [V] | "will probably not work on transcribing hand-written scores" [V]. Reported unmaintained since 2024 [S]. |
| **homr** | AGPL-3.0 code and weights [V] | Yes. `uvx --from 'homr[cpu]' homr <image>`, Python 3.11/3.12; accepts PDFs [V] | Piano grand staff supported; focuses on pitch and rhythm and drops dynamics, articulation, double accidentals [V]. "non-commercial volunteer project"; its transformer weights include PrIMuS (CC BY-NC) training data, and whether that carries to the weights is "an open legal question" [V]. |
| **Sheet Music Transformer** | Code/weights licence not stated [V] | Research code on GitHub and Hugging Face [V] | Best published open result on piano pages (below). Not a polished tool. |
| **Soundslice scanner** | Commercial | No; cloud web app | Free tier 2 scans a month (1 page, 32 bars); Plus 100 pages/month; exports MusicXML [V]. Best baseline in published comparisons [V]. No terms on copyrighted scans visible [V]. |
| **Newzik, PlayScore 2, SmartScore, ScanScore** | Commercial apps | No | $50-$399 [V, Scoring Notes Dec 2024] |
| **SheetVision** | n/a | n/a | No hits in search [V]. Do not plan around it. |
| **Magenta** | Apache [U] | n/a | I believe Magenta does audio-to-MIDI and generation, not OMR [U]. |
| **MuseScore Studio** | GPL [U] | n/a | I believe it has no PDF import [U]. |

**Accuracy on real piano pages** (arXiv 2405.12105, "End-to-End Full-Page OMR for Pianoform Sheet Music" [V]). Symbol error rate, lower is better:

| Model | Mozarteum scans | Polish Digital Scores |
|---|---|---|
| Audiveris | 94.6 | 94.9 |
| Oemer | 90.3 | 75.2 |
| SMT, zero-shot | 38.9 | 65.4 |
| SMT, fine-tuned | 14.1 | 25.8 |

The paper says zero-shot SMT is worse than the commercial SoundSlice baseline. These are hard historic scans; clean modern engravings will do better. The Audiveris vendor page claims 80-90% on clean scores [S, marketing]. A December 2024 Scoring Notes review of commercial tools found that Moonlight Sonata (piano) lost implied triplets and second voices, and that a complex orchestral page needed 10-30% of measures re-entered [V]. Soundslice's scan of the Nutcracker was "unusable" while its PDF import needed quick edits [V].

**Plan for OMR:**
- Treat it as an assist for pieces with no Mutopia or OpenScore copy, never a pipeline stage.
- Expect to hand-correct every page: wrong accidentals and clefs, missed ties, lost voices, wrong tuplets, and chords split across staves. Budget roughly half an hour or more per page of dense piano music [U, my estimate; no timing data found].
- For the simple pieces a beginner needs, typing the notes into the `Spec` format (or MuseScore) is often faster than fixing OMR.
- Source PDFs for OMR must be PD editions, from IMSLP, with the file number recorded.
- AGPL tools run as a build step do not make our static site AGPL [U; my reading, not legal advice].

### 4.2 MIDI to MusicXML pitfalls

We do not need this for Mutopia, because `fromMidi` already reads MIDI. If you ever convert:

- MIDI has no pitch spelling. MuseScore's importer guesses from key; the app's `spell.ts` already guesses [U].
- MuseScore's MIDI import options are a quantization grid (adaptive), a maximum-quantization cap, a maximum number of voices, a "Search tuplets" heuristic, and an "Is human performance" mode [S]. Any wrong setting produces tied-note clutter.
- It loses slurs, dynamics, fingering and repeats, and invents voices.
- Do the reverse for fidelity instead: keep the MIDI as the playable source and, where exact notation matters, use MusicXML.

### 4.3 LilyPond to MusicXML

- LilyPond only **imports** MusicXML (`musicxml2ly`). It has no official exporter [S: LilyPond docs and a 2022 study, plus a 2016 mailing-list thread].
- python-ly (Frescobaldi project, GPL) contains an `ly.musicxml` module with a `writer()`. The README says "experimental support" [V]. I could not confirm a `ly musicxml` CLI subcommand [V, README lists none].
- `ateney/ly2musicxml` is an MIT, dependency-free Python converter with a CLI. It handles `\relative`, chords, ties, tuplets, `\partial`, key/time/tempo and clefs [V]. It was validated only on two movements of one Shostakovich quartet (against LilyPond's own MIDI). It does not claim `\include` or general-variable support [V]. Mutopia files rely on both, so expect many to fail.
- **Cheapest robust route:** don't convert. Use Mutopia's own MIDI, which LilyPond generates. If you want MusicXML for exact spelling, round-trip through the MIDI-validation approach the ly2musicxml author used: convert, then compare notes against the MIDI and reject mismatches.

---

## 5. Recommended pipeline

**Goal:** a committed `public/library/` that is reproducible, auditable, and impossible to pollute with an unverified licence.

```
scripts/
  library.in.json        # curated input: hand-picked pieces only
  fetch-library.mjs      # node 22+, no deps
public/library/
  index.json             # generated manifest, committed
  mutopia-75.mid ...     # generated files, committed
  lieder-lc5126921.mxl
```

`library.in.json` entries:

```json
{ "id": "mutopia-75", "src": "mutopia", "pieceId": 75, "level": "Elementary", "order": 9 }
{ "id": "lieder-lc5126921", "src": "openscore-lieder",
  "path": "scores/Schumann,_Clara/6_Lieder,_Op.13/4_Der_Mond_kommt_still_gegangen/lc5126921.mxl",
  "keepPart": "Piano", "level": "Intermediate" }
```

`fetch-library.mjs` outline:

```js
const ALLOW = new Set(['Public Domain', 'CC0'])          // v1: no BY, no BY-SA
for (const e of input) {
  if (e.src === 'mutopia') {
    const html = await get(`https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=${e.pieceId}`)
    const m = { licence, source, maintainer, updated } = scrape(html)   // 5 labelled fields
    if (!ALLOW.has(m.licence)) throw Error(`${e.id}: ${m.licence}`)
    const dir = midUrlFromPage(html)                       // read the .mid link; zip-only pieces need -mids.zip handling
    bytes = await get(dir)                                 // 1 req/s, descriptive User-Agent
  } else if (e.src === 'openscore-lieder') {
    bytes = await get(RAW + encodeURI(e.path))             // already CC0 repo-wide
    bytes = dropOtherParts(bytes, e.keepPart)              // unzip, delete non-piano <part>, <part-list> entries, rezip
  }
  write(`public/library/${e.id}.${ext}`, bytes)
  manifest.push({ id: e.id, title, composer, lifespan, level, order: e.order,
    format: ext, sha256: sha256(bytes), fetched: today,
    licence: m.licence, licenceUrl, sourceUrl, sourceEdition: m.source,
    engraver: m.maintainer, credit: creditLine(m) })
}
write('public/library/index.json', JSON.stringify(manifest, null, 1))
```

Checks that must fail the build (put them in `vitest`, next to `starters.test.ts`):

1. Every file in `public/library/` has a manifest entry, and no manifest entry points at a missing file.
2. `licence` is in `ALLOW`. A CC BY or BY-SA entry fails until the UI shows credits and the SA consequence is decided.
3. `lifespan` death year is <= 1955 and the source edition is dated <= 1930, so the piece is PD in the US (<= 1930), EU (<= 1955) and Canada (<= 1971) at once (section 6).
4. The file parses with `fromMidi` or `fromMusicXml`, has more than 20 notes and at least one bar, and `lo`/`hi` fall inside the piano range.
5. Reject the file if its sha256 changed without the manifest changing (catches silent upstream edits).

App side (small): load `/library/index.json` lazily, show the `credit` line on the song card and in an About/Credits screen, and keep a "report a problem" link per piece.

**Importer fixes the library needs** (file these; I did not touch the source):
- Honour `<repeat>`/`<ending>` (4 of 30 OpenScore samples have repeats).
- Use `fromMidi` key changes beyond the first event (Entertainer has three).
- Warn or default sensibly when no tempo is found (3 of 30 fell back to 100 bpm).
- Let the importer or fetch step drop non-piano parts (voice lines land in the hands today).

**Effort:** the fetch script and tests are about a day. Most of the time goes to the hand-curation of the 40 entries.

**Legal checks to automate vs. do by eye:**
- Automated: licence allowlist, death-year bound, sha256, parse test.
- By eye, once per piece: open the Mutopia "Source" field and confirm an edition published before 1923 [V rule, but legacy pieces may predate it]; open the IMSLP page of that edition if there is any doubt; confirm no editorial text (fingerings, annotations) from a modern editor leaked through (Mutopia strips these by policy but verify) [U].
- A CC BY or BY-SA tier can come later, but only once credit lines are shown and the share-alike consequence for the repo's data files is accepted.

---

## 6. The graded list: 40 pieces

Ordered easiest to hardest. "Own spec" means we write it in the `Spec` format ourselves; the underlying composition is PD, and the arrangement is ours to dedicate to CC0. Mutopia links are `http://www.mutopiaproject.org/cgibin/piece-info.cgi?id=N`; MIDI file URLs follow the pattern `https://www.mutopiaproject.org/ftp/<Composer>/<dir>/<name>.mid` (the Mutopia id is the key).

**Tier 1: first notes (own specs, no outside licence)**

| # | Piece | Source | Licence note |
|---|---|---|---|
| 1 | Five-finger warm-up | In repo (`starters.ts`) | Ours [V] |
| 2 | Hanon, Virtuoso Pianist No. 1 | Own spec, generated from the pattern; check against IMSLP | Hanon d. 1900 [U]; pattern generator, ours |
| 3 | Twinkle, Twinkle, Little Star | In repo | Traditional; ours [V] |
| 4 | Korobeiniki (Russian folk song) | Own spec | Folk tune is PD [U]; do **not** copy any game arrangement |
| 5 | Ode to Joy (Beethoven) | In repo | Beethoven d. 1827; ours [V]. No piano score in Mutopia [V] |
| 6 | Amazing Grace | Own spec | Tune "New Britain" 1835 [U]; ours |
| 7 | Silent Night (Gruber) | Own spec | Gruber d. 1863 [U]; ours |
| 8 | Greensleeves | In repo | Traditional; ours [V] |

**Tier 2: elementary (Mutopia PD)**

| # | Piece | Source | Licence note |
|---|---|---|---|
| 9 | Minuet in G, BWV Anh. 114 (Anna Magdalena Notebook) | Mutopia id 75 | PD [V] |
| 10 | Musette in D, BWV Anh. 126 | Mutopia id 79 | PD [V] |
| 11 | Minuet in A minor, BWV Anh. 120 | Mutopia id 1612 | PD [V] |
| 12 | Minuet in C minor, BWV Anh. 121 | Mutopia id 1613 | PD [V] |
| 13 | Burgmüller, La Candeur, Op. 100/1 | Mutopia id 202 | PD; source Collection Litolff [V] |
| 14 | Burgmüller, L'Arabesque, Op. 100/2 | Mutopia id 203 | PD [V] |
| 15 | Burgmüller, La Pastorale, Op. 100/3 | Mutopia id 218 | PD [V] |
| 16 | Czerny, Op. 840 No. 1 | Mutopia id 2146 | PD [V] |
| 17 | Kuhlau, Sonatine Op. 20/1, Allegro | Mutopia id 232 | PD [V] |
| 18 | Clementi, Sonatina Op. 36/1 | Mutopia id 804 | PD [V]; MIDI is a zip of movements |

**Tier 3: late elementary to early intermediate**

| # | Piece | Source | Licence note |
|---|---|---|---|
| 19 | Tchaikovsky, Morning Prayer, Op. 39/1 | Mutopia id 2032 | PD [V] |
| 20 | Tchaikovsky, March of the Wooden Soldiers, Op. 39/5 | Mutopia id 1806 | PD [V] |
| 21 | Burgmüller, Innocence, Op. 100/5 | Mutopia id 214 | PD [V] |
| 22 | Burgmüller, Tendre Fleur, Op. 100/10 | Mutopia id 221 | PD [V] |
| 23 | Schumann, Von fremden Ländern, Op. 15/1 | Mutopia id 354 | PD [V] |
| 24 | Schumann, Melodie, Op. 68/1 | Mutopia id 647 | **CC BY-SA 2.5** [V]. Defer to a later tier, or swap for a PD alternative |
| 25 | Bach, Invention 8, BWV 779 | Mutopia id 61 | PD [V] |
| 26 | Bach, Invention 4, BWV 775 | Mutopia id 67 | PD [V] |
| 27 | Satie, Gymnopédie No. 1 | Mutopia id 37 | PD [V]. Other Satie on Mutopia is CC BY-SA |
| 28 | Chopin, Prelude Op. 28/7 | Mutopia id 470 | PD [V] |

**Tier 4: intermediate**

| # | Piece | Source | Licence note |
|---|---|---|---|
| 29 | Chopin, Prelude Op. 28/6 | Mutopia id 469 | PD [V] |
| 30 | Chopin, Prelude Op. 28/4 | Mutopia id 468 | PD [V] |
| 31 | Schumann, Träumerei, Op. 15/7 | Mutopia id 504 | PD [V] |
| 32 | Beethoven, Für Elise, WoO 59 | Mutopia id 931 | PD [V] |
| 33 | Pachelbel, Canon in D | In repo | Ours [V] |
| 34 | Joplin, The Entertainer | Mutopia id 263 | PD [V] |
| 35 | Joplin, Elite Syncopations | Mutopia id 1540 | PD [V] |
| 36 | Grieg, In the Hall of the Mountain King, Op. 46/4 | Mutopia id 1888 | PD [V] |
| 37 | Debussy, Première Arabesque | Mutopia id 1777 | PD [V] |
| 38 | Debussy, Clair de lune | Mutopia id 1778 | PD [V] |
| 39 | Chopin, Prelude Op. 28/15 (Raindrop) | Mutopia id 471 | PD [V] |
| 40 | Joplin, Bethena | Mutopia id 463 | PD [V] |

Notes on this list:

- **Difficulty order is my judgement** [U]; no source graded these. Checking against a graded syllabus (ABRSM, RCM) would be a sensible follow-up.
- **PD status:** 38 of the 40 are PD-tagged on Mutopia or are our own specs of PD works. The exceptions are #24 (CC BY-SA) and #2 (Hanon, not yet checked against IMSLP). If #24 is dropped, add Czerny Op.840 No. 2 (id 2147) or Tchaikovsky's Old French Song (id 2080) instead.
- **Left out on purpose:** Mozart K.545 (CC BY-SA 3.0, id 998), Moonlight (CC BY-SA 2.5, id 276), Diabelli Op.149 (CC BY-SA 3.0), Satie Gnossiennes (CC BY-SA 4.0), Bartók (US status, section 3.3). Bach Little Preludes, Beyer, Gurlitt and Hanon have no Mutopia copy [V "no matches" or absent from composers page]; they need IMSLP plus hand entry.
- **Ragtime:** all ten listed Joplin pieces are PD on Mutopia [V]. James Scott and early jazz are not on the Mutopia composers page I read, so I have no verified source. Scott d. 1938 [U] puts the work in the US PD (published before 1931) and EU PD (life+70 ended 2008), but verify before adding. Avoid W. C. Handy (d. 1958 [U]); EU life+70 would not have expired.
- **"Game-music-adjacent":** Mountain King (#36) and Korobeiniki (#4) cover this. The tune is PD; the famous game arrangements are not.
- **MIDI-sourced pieces come hands-correct** (two tracks) [V on three files], with the key-change caveat above. The ones shipping as MIDI have no exact enharmonic spelling; the app's heuristic fills that in.
- **Mutopia Schumann Op.15 numbers 2, 3, 4, 6 are CC BY 3.0** [V], so Träumerei and No. 1 are fine but do not assume the whole set is.

---

## 7. Legal notes

All of this is orientation, not advice.

**What is protected, and for how long**

- **Composition (the work).** Term depends on country. IMSLP's rules of thumb [V]: US, first published 1930 or earlier; EU, author died 1955 or earlier; Canada (IMSLP main servers), author died 1971 or earlier. Canada moved to life+70 from 2023 but did not revive expired works [S]. **Safe-everywhere rule for this app: author died by 1955 and first publication by 1930.** As of today (October 2026) that is consistent with the US "1930 or earlier" line IMSLP gives.
- **Edition or engraving.** IMSLP: re-engraving a PD work "generally isn't protected in Canada if it adds no original material"; in the EU, editions are protected up to 25 years if published after the original copyright expired (30 in Poland); in the US, "copyright can only apply to new creative work" [S]. So a faithful note-for-note transcription of a pre-1923 edition (what Mutopia does) is low risk, whereas editorial additions (fingering, phrasing, pedal, dynamics added by a modern editor) can be copyrighted. Prefer sources that cite a pre-1923 edition. Mutopia cites its source edition per piece [V].
- **Arrangement.** A creative arrangement of a PD work gets its own copyright. This is the biggest trap for "easy piano" versions of PD melodies, and for most free-scores and 8notes content [U]. Our own specs are our arrangements.
- **MIDI files.** A MIDI is probably a copyrightable sound file [S, Wikilegal]. "The song itself can be in the public domain but still the original recording can be privately owned." Auto-generated MIDI may not qualify, but a manually sequenced or performed one may. Mutopia's MIDI is generated from a PD-dedicated LilyPond source, so the chain is clean [V rule]. A random MIDI site gives no such chain.
- **Dataset licences are separate.** CC0 on OpenScore covers the transcribers' rights only [S forum, for MuseScore CC0]; the underlying composition must also be PD.

**Country differences that matter here**

- Hosting is a Mac behind Cloudflare; users are worldwide. Treat the strictest of US, EU and Canada as the bar (section 5, check 3).
- IMSLP being Canada-hosted means it deliberately carries works that are PD in Canada but protected in the US (Bartók, Ravel, Stravinsky and similar) [S]. Anything from IMSLP needs its own US check.

**What the app should display**

- Per piece: composer with dates; "Engraving: Mutopia Project, typeset by <maintainer>, Public Domain"; "Source edition: <field>"; for OpenScore, "OpenScore Lieder Corpus (CC0)", which they request though do not require [V]; for any CC BY item, name, licence and link (mandatory); for CC BY-SA, plus the share-alike notice.
- A Credits screen listing Mutopia, OpenScore and IMSLP (as a reference), linking to their pages.
- Do not display "Public Domain" unqualified. Say "Public Domain (Mutopia)" so users see where the claim comes from.
- A takedown contact address, so an error can be corrected quickly.

**Video-game and anime MIDI libraries**

- They are overwhelmingly sequences of copyrighted compositions, often made from copyrighted sound recordings or scores. There are two layers of rights: the sequencer's rights in the file, and the composer's rights in the music [S, Wikilegal]. Free availability does not make a file legal to reuse [S].
- I could not read any such site's terms (BitMidi, free-scores, kunstderfuge all unreadable or silent). Absent a clear licence, assume no permission. The `PRODUCT.md` rule stands: "nothing copyrighted ships".
- Users importing their own files stay in the browser and never touch the repo, which is the correct design.
- A repo risk to avoid: a pull request, or a future "community" import, bringing in unvetted MIDI. The manifest allowlist test in section 5 is the guard.

**Bulk-source specifics**

- Mutopia: robots allows all [V]; no stated crawl terms. Be polite, identify the script, and fetch only your curated list.
- IMSLP: do not automate downloads (section 3.3).
- PDMX: CC BY 4.0 dataset licence requires credit if you redistribute the dataset; individual scores carry their own licence [V].
- AGPL tools (Audiveris, homr): running them offline in a build does not make our output AGPL [U], but do not embed them in the shipped app.

---

## 8. Open items

Holes found that this research did not close (file in the roadmap):

1. Grade the 40 pieces against a real syllabus.
2. Check Mutopia's GitHub `ftp` tree for a bulk mirror that has CORS, in case runtime fetching is ever wanted [U].
3. Check whether Mutopia MIDI unfolds repeats (the Entertainer file is 252.9 s at 72 bpm; I did not compare against the score).
4. Find verified sources for Hanon, Beyer, Gurlitt, Bach Little Preludes, James Scott. Candidates are IMSLP plus hand entry.
5. Read the unreadable terms (musescore.com, Kunst der Fuge, CPDL, free-scores, 8notes, Piano Society) from a browser, if any of those matter.
6. Importer: repeats, key changes in MIDI, missing-tempo warning, part filtering (section 5).
7. Decide the policy for a later CC BY and CC BY-SA tier.
