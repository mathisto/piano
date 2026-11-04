# Explicit unmeasured score time

**4 November 2026.** Chopin's Nocturne Op. 9 No. 3 contains a `senza Tempo` passage that crosses an invisible system boundary before ordinary 2/2 time resumes. The Humdrum source states both facts, but the converter previously turned the invisible boundary into a measure boundary and silently kept the preceding metre. The resulting MusicXML therefore split one unmeasured passage into two measured bars.

The converter now recognizes only the explicit source phrase `senza Tempo`, suppresses only an unnumbered invisible `=-` boundary while that state is active, writes MusicXML's standard `<senza-misura/>`, and restores ordinary numeric time at the next stated meter. The app importer uses the occupied score duration for that unmeasured passage instead of padding it to the previous meter. Ordinary invisible boundaries, incomplete measures and numbered or visible barlines are unchanged.

This is deliberately narrower than a visual guess. The cross-staff barline in Chopin Op. 44 and the long recitative measure in Op. 49 do not carry this explicit source predicate, so neither is admitted by this rule. They remain separate notation questions.

The complete cached 512-source Chopin build changes one shipped package, `chopin-009-1-KI-003`. Its two source fragments become one explicit unmeasured measure, reducing the package from 159 to 158 bars; every other overlapping package is byte-identical. Two independent complete builds are byte-identical: Chopin catalogue SHA-256 `bb53b8e50b83c67e46a26c902fc9847f190dded326db83e85237b585469c7443`; changed package `p/d6d8f3e4a04d008d.mxl`, SHA-256 `d6d8f3e4a04d008de0a1c89db300173cd7a613b62580823b438d7dc35fa6457b`.

Checks: 62 focused converter/importer tests, TypeScript, all 1,049 unit tests, the boot bundle gate, all 47 end-to-end tests, the complete Chopin build twice, recursive output comparison and exact old/new package comparison. The two existing smoke diagnostics remain open: Settings exceeds the one-screen fixture and the inline-CSP fixture logs a console error.

Published: commit `65a78f3`; live catalogue `44a4bc80bf5e2109`, 2,347 pieces, catalogue SHA-256 `a85c524779c93a7922388075dc1fa720dc44eea935bf08b37e3db7e9f3045a5d`; web runtime `65a78f3f`; TestFlight build 631. The live catalogue and changed package match the twice-built candidate hashes above.

Sources: [Chopin Online Kistner score page](https://chopinonline.ac.uk/ocve/browse/pageview/67747/), [MusicXML `senza-misura`](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/senza-misura/), [Humdrum invisible barlines](https://doc.verovio.humdrum.org/humdrum/getting_started/barlines.html), [Humdrum **kern barlines](https://www.humdrum.org/Humdrum/representations/kern.html).
