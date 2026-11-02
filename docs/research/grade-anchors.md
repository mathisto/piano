# G1 difficulty anchors — owner review

**TL;DR:** 80 complete piano pieces in the live catalogue are matched to their published Henle difficulty. Seven also appear in the current ABRSM practical syllabus. This is review data only: it changes no catalogue level.

**Status:** waiting for owner approval before the fitted re-grade. Reviewed 2 November 2026.

## What to review

1. Each catalogue piece is the same work named by the source. Pay particular attention to the two Anna Magdalena minuets (BWV Anh. 114 and 115), whose numbering was the known open check.
2. Flag any published placement that should not control Piano Forte because this edition is materially easier or harder than the named work.
3. Approve the set, or name additions/removals. The fit and every `gradeOverride` wait for that approval.

The later five-fold holdout must group rows by collection/work (for example, all Op. 68 pieces in one fold), not scatter near-neighbours across train and test. Otherwise the reported accuracy would be leakage.

## Coverage

Henle distribution — 1: 2 · 2: 4 · 3: 12 · 4: 27 · 5: 9 · 6: 9 · 7: 6 · 8: 8 · 9: 3.

The deliberate concentration at levels 3–4 supplies the learning path’s busy range. Chopin ballades, etudes, nocturnes and preludes supply independent upper-range anchors. No fragment, study-lane item or accompaniment is included.

## Sources

- Henle · Anna Magdalena: https://www.henle.de/en/Notebook-for-Anna-Magdalena-Bach/HN-1349
- Henle · Schumann: https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46
- Henle · Preludes: https://www.henle.de/en/Preludes/HN-882
- Henle · Inventions: https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589
- Henle · Schubert: https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138
- Henle · Grieg: https://www.henle.de/en/Complete-Lyric-Pieces/HN-1136
- Henle · Ballades: https://www.henle.de/Ballades/HN-863
- Henle · Etudes: https://www.henle.de/en/Etudes/HN-124
- Henle · Nocturnes: https://www.henle.de/en/Nocturnes/HN-233
- ABRSM Piano Practical Grades 2025–26: https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf

ABRSM page numbers below are PDF page numbers. A blank ABRSM cell means no current ABRSM placement was used; Henle remains the anchor.

## Table

| Henle | Catalogue piece | Catalogue id | Published source title | ABRSM |
|---:|---|---|---|---:|
| 1 | J. S. Bach — Menuet | `mutopia-76` | Menuet BWV Anhang 115 · [Henle · Anna Magdalena](https://www.henle.de/en/Notebook-for-Anna-Magdalena-Bach/HN-1349) |  |
| 1 | J. S. Bach — Minuet in G, BWV Anh. 114 | `mutopia-75` | Menuet BWV Anhang 114 · [Henle · Anna Magdalena](https://www.henle.de/en/Notebook-for-Anna-Magdalena-Bach/HN-1349) |  |
| 2 | R. Schumann — Humming Song, Op. 68 No. 3 | `mutopia-651` | Trällerliedchen op. 68,3 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 2 | R. Schumann — Little Piece, Op. 68 No. 5 | `mutopia-653` | Stückchen op. 68,5 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 2 | R. Schumann — Soldiers' March, Op. 68 No. 2 | `mutopia-650` | Soldatenmarsch op. 68,2 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 2 | Robert Schumann — Melody, Op. 68 No. 1 | `mutopia-647` | Melodie op. 68,1 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 3 | E. Grieg — Albumblatt in E minor | `mutopia-2194` | Album Leaf op. 12,7 · [Henle · Grieg](https://www.henle.de/en/Complete-Lyric-Pieces/HN-1136) |  |
| 3 | J. S. Bach — Invention 1 | `mutopia-40` | Invention 1 C major BWV 772 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 3 | J. S. Bach — Invention 6 | `mutopia-159` | Invention 6 E major BWV 777 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) | [Grade 6, p. 37](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf#page=37) |
| 3 | J. S. Bach — Invention No. 4 in D minor, BWV 775 | `mutopia-67` | Invention 4 d minor BWV 775 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 3 | R. Schumann — A Chorale, Op. 68 No. 4 | `mutopia-782` | Ein Choral op. 68,4 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 3 | R. Schumann — Folk Song, Op. 68 No. 9 | `mutopia-675` | Volksliedchen op. 68,9 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 3 | R. Schumann — Hunting Song, Op. 68 No. 7 | `mutopia-691` | Jägerliedchen op. 68,7 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 3 | R. Schumann — Little Study, Op. 68 No. 14 | `mutopia-786` | Kleine Studie op. 68,14 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 3 | R. Schumann — Poor Orphan, Op. 68 No. 6 | `mutopia-687` | Armes Waisenkind op. 68,6 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 3 | R. Schumann — Sicilienne, Op. 68 No. 11 | `mutopia-783` | Sicilianisch op. 68,11 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 3 | R. Schumann — The Happy Farmer, Op. 68 No. 10 | `mutopia-659` | Fröhlicher Landmann op. 68,10 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 3 | R. Schumann — The Wild Horseman, Op. 68 No. 8 | `mutopia-655` | Wilder Reiter op. 68,8 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) | [Grade 3, p. 28](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf#page=28) |
| 4 | Frédéric Chopin — Prelude in A major, Op. 28 No. 7 | `mutopia-470` | Prelude A major op. 28,7 · [Henle · Preludes](https://www.henle.de/en/Preludes/HN-882) |  |
| 4 | Frédéric Chopin — Prelude in B minor, Op. 28 No. 6 | `mutopia-469` | Prelude b minor op. 28,6 · [Henle · Preludes](https://www.henle.de/en/Preludes/HN-882) |  |
| 4 | Frédéric Chopin — Prelude in E minor, Op. 28 No. 4 | `mutopia-468` | Prelude e minor op. 28,4 · [Henle · Preludes](https://www.henle.de/en/Preludes/HN-882) |  |
| 4 | J. S. Bach — Invention 10 | `mutopia-62` | Invention 10 G major BWV 781 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 11 | `mutopia-71` | Invention 11 g minor BWV 782 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 12 | `mutopia-174` | Invention 12 A major BWV 783 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 13 | `mutopia-59` | Invention 13 a minor BWV 784 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 14 | `mutopia-72` | Invention 14 B flat major BWV 785 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) | [Grade 6, p. 37](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf#page=37) |
| 4 | J. S. Bach — Invention 15 | `mutopia-68` | Invention 15 b minor BWV 786 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 2 | `mutopia-58` | Invention 2 c minor BWV 773 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 3 | `mutopia-70` | Invention 3 D major BWV 774 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 5 | `mutopia-55` | Invention 5 E flat major BWV 776 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 7 | `mutopia-73` | Invention 7 e minor BWV 778 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention 9 | `mutopia-171` | Invention 9 f minor BWV 780 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) |  |
| 4 | J. S. Bach — Invention No. 8 in F major, BWV 779 | `mutopia-61` | Invention 8 F major BWV 779 · [Henle · Inventions](https://www.henle.de/en/Inventions-and-Sinfonias/HN-1589) | [Grade 5, p. 34](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf#page=34) |
| 4 | R. Schumann — First Loss, Op. 68 No. 16 | `mutopia-676` | Erster Verlust op. 68,16 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Kinderscenen - Bittendes Kind | `mutopia-366` | Bittendes Kind op. 15,4 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Kinderscenen - Curiose Geschichte | `mutopia-355` | Curiose Geschichte op. 15,2 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Kinderscenen - Wichtige Begebenheit | `mutopia-374` | Wichtige Begebenheit op. 15,6 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Knecht Ruprecht, Op. 68 No. 12 | `mutopia-784` | Knecht Ruprecht op. 68,12 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Little Morning Wanderer, Op. 68 No. 17 | `pdmx-5953762` | Kleiner Morgenwanderer op. 68,17 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Little Romance, Op. 68 No. 19 | `pdmx-5971576` | Kleine Romanze op. 68,19 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Reapers' Song, Op. 68 No. 18 | `mutopia-663` | Schnitterliedchen op. 68,18 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Scheherazade, Op. 68 No. 32 | `mutopia-692` | Sheherazade op. 68,32 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Spring Song, Op. 68 No. 15 | `pdmx-5942974` | Frühlingsgesang op. 68,15 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | R. Schumann — Untitled, Op. 68 No. 26 | `mutopia-788` | *** op. 68,26 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 4 | Robert Schumann — Of Foreign Lands and People, Op. 15 No. 1 | `mutopia-354` | Von fremden Ländern und Menschen op. 15,1 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) | [Grade 5, p. 35](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf#page=35) |
| 5 | F. F. Chopin — Prelude: Op. 28, No. 2 | `mutopia-494` | Prelude a minor op. 28,2 · [Henle · Preludes](https://www.henle.de/en/Preludes/HN-882) |  |
| 5 | F. Schubert — Impromptu in As-dur | `mutopia-1195` | Impromptu A flat major op. post. 142,2 D 935 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) | [Grade 8, p. 44](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf#page=44) |
| 5 | F. Schubert — Moments Musicaux No. 3 in F Minor | `mutopia-1023` | Moment musical f minor op. 94,3 D 780 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) | [Grade 6, p. 37](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20%26%202026%20Prac%20syllabus%2020240524_access.pdf#page=37) |
| 5 | Frédéric Chopin — Prelude in D-flat major, Op. 28 No. 15 (Raindrop) | `mutopia-471` | Prelude (Raindrop) D flat major op. 28,15 · [Henle · Preludes](https://www.henle.de/en/Preludes/HN-882) |  |
| 5 | R. Schumann — Echoes from the Theatre, Op. 68 No. 25 | `mutopia-787` | Nachklänge aus dem Theater op. 68,25 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 5 | R. Schumann — Kinderscenen - Glückes genug | `mutopia-372` | Glückes genug op. 15,5 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 5 | R. Schumann — Kinderscenen - Hasche-Mann | `mutopia-365` | Hasche-Mann op. 15,3 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 5 | R. Schumann — May, Lovely May, Op. 68 No. 13 | `mutopia-662` | Mai, lieber Mai op. 68,13 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 5 | Robert Schumann — Träumerei, Op. 15 No. 7 | `mutopia-504` | Träumerei op. 15,7 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 6 | F. F. Chopin — Nocturne | `mutopia-1590` | Nocturne E flat major op. 9,2 · [Henle · Nocturnes](https://www.henle.de/en/Nocturnes/HN-233) |  |
| 6 | F. F. Chopin — Nocturne in B-flat minor, Op. 9 No. 1 | `chopin-009-1-KI-001` | Nocturne b flat minor op. 9,1 · [Henle · Nocturnes](https://www.henle.de/en/Nocturnes/HN-233) |  |
| 6 | F. F. Chopin — Prelude: Op. 28, No. 1 | `mutopia-411` | Prelude C major op. 28,1 · [Henle · Preludes](https://www.henle.de/en/Preludes/HN-882) |  |
| 6 | F. Schubert — Impromptu in As-dur | `mutopia-1552` | Impromptu A flat major op. 90,4 D 899 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) |  |
| 6 | F. Schubert — Impromptu in B-dur | `mutopia-1721` | Impromptu B flat major op. post. 142,3 D 935 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) |  |
| 6 | F. Schubert — Impromptu in c-moll | `mutopia-1192` | Impromptu c minor op. 90,1 D 899 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) |  |
| 6 | F. Schubert — Impromptu in Es-dur | `mutopia-1551` | Impromptu E flat major op. 90,2 D 899 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) |  |
| 6 | F. Schubert — Impromptu in Ges-dur | `mutopia-1193` | Impromptu G flat major op. 90,3 D 899 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) |  |
| 6 | R. Schumann — Italian Sailors' Song, Op. 68 No. 36 | `mutopia-688` | Lied italienischer Marinari op. 68,36 · [Henle · Schumann](https://www.henle.de/en/Scenes-from-Childhood-op.-15-and-Album-for-the-Young-op.-68/HN-46) |  |
| 7 | F. F. Chopin — Etude in A-flat major, Op. 10 No. 10 | `chopin-010_7-12-1-KI-010` | Etude A flat major op. 10,10 · [Henle · Etudes](https://www.henle.de/en/Etudes/HN-124) |  |
| 7 | F. F. Chopin — Etude in C major, Op. 10 No. 7 | `chopin-010_7-12-1-KI-007` | Etude C major op. 10,7 · [Henle · Etudes](https://www.henle.de/en/Etudes/HN-124) |  |
| 7 | F. F. Chopin — Etude in E major, Op. 10 No. 3 | `chopin-010-1b-Sm-003` | Etude E major op. 10,3 · [Henle · Etudes](https://www.henle.de/en/Etudes/HN-124) |  |
| 7 | F. F. Chopin — Etude in G-flat major, Op. 10 No. 5 | `chopin-010-1b-Sm-005` | Etude G flat major op. 10,5 · [Henle · Etudes](https://www.henle.de/en/Etudes/HN-124) |  |
| 7 | F. F. Chopin — Nocturne in B major, Op. 9 No. 3 | `chopin-009-1-KI-003` | Nocturne B major op. 9,3 · [Henle · Nocturnes](https://www.henle.de/en/Nocturnes/HN-233) |  |
| 7 | F. Schubert — Impromptu in f-moll | `mutopia-1194` | Impromptu f minor op. post. 142,1 D 935 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) |  |
| 8 | F. F. Chopin — Ballade in A-flat major, Op. 47 | `chopin-047-1-BH` | Ballade A flat major op. 47 · [Henle · Ballades](https://www.henle.de/Ballades/HN-863) |  |
| 8 | F. F. Chopin — Ballade in F major, Op. 38 | `chopin-038-1-TR` | Ballade F major op. 38 · [Henle · Ballades](https://www.henle.de/Ballades/HN-863) |  |
| 8 | F. F. Chopin — Etude in C minor, Op. 10 No. 12 | `chopin-010_7-12-1-KI-012` | Etude (Revolution) c minor op. 10,12 · [Henle · Etudes](https://www.henle.de/en/Etudes/HN-124) |  |
| 8 | F. F. Chopin — Etude in C-sharp minor, Op. 10 No. 4 | `chopin-010-1b-Sm-004` | Etude c sharp minor op. 10,4 · [Henle · Etudes](https://www.henle.de/en/Etudes/HN-124) |  |
| 8 | F. F. Chopin — Etude in F major, Op. 10 No. 8 | `chopin-010_7-12-1-KI-008` | Etude F major op. 10,8 · [Henle · Etudes](https://www.henle.de/en/Etudes/HN-124) |  |
| 8 | F. F. Chopin — Prelude in F-sharp minor, Op. 28 No. 8 | `chopin-028_1-12-1a-C-008` | Prelude f sharp minor op. 28,8 · [Henle · Preludes](https://www.henle.de/en/Preludes/HN-882) |  |
| 8 | F. F. Chopin — Première Ballade | `mutopia-1959` | Ballade g minor op. 23 · [Henle · Ballades](https://www.henle.de/Ballades/HN-863) |  |
| 8 | F. Schubert — Impromptu in f-moll | `mutopia-1689` | Impromptu f minor op. post. 142,4 D 935 · [Henle · Schubert](https://www.henle.de/Impromptus-and-Moments-musicaux/HN-138) |  |
| 9 | F. F. Chopin — Ballade in F minor, Op. 52 | `chopin-052-1-Sm` | Ballade f minor op. 52 · [Henle · Ballades](https://www.henle.de/Ballades/HN-863) |  |
| 9 | F. F. Chopin — Etude in C major, Op. 10 No. 1 | `chopin-010-1b-Sm-001` | Etude C major op. 10,1 · [Henle · Etudes](https://www.henle.de/en/Etudes/HN-124) |  |
| 9 | F. F. Chopin — Prelude in D minor, Op. 28 No. 24 | `chopin-028_13-24-1a-C-024` | Prelude d minor op. 28,24 · [Henle · Preludes](https://www.henle.de/en/Preludes/HN-882) |  |
