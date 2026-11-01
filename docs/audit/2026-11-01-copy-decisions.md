# Orchestrator decisions on the copy audit's judgement calls (1 Nov 2026)

Apply every **clear** finding in copy-findings.md as written (verify the line still exists after the fix merges; the text may have moved), plus these judgement calls as decided:

- CP-10: yes, but per platform. iPad (native): banner "No keyboard yet. Plug it in over USB, or tap the keyboard button at the top right to connect over Bluetooth." Web: as proposed, after confirming in Chrome that a USB keyboard appears by itself once MIDI permission has been granted (the chip panel line on the web then reads as proposed).
- CP-11: yes, as proposed.
- CP-14: yes.
- CP-15: yes ("too loud").
- CP-16: yes.
- CP-19: yes, shortened: "Watches how loud each note is: marks notes much louder or softer than the ones around them, and adds evenness, dynamics and pedal lines to results. Gentle flags only big differences; Strict small ones too."
- CP-20: yes (Off · Gentle · Standard · Strict; stored value stays `steady`).
- CP-23: yes.
- CP-28: yes.
- CP-29: the Help line yes; the two difficulty scales (words vs Level numbers) are left for Matt, no change.
- CP-31: yes, including "on time" -> "on the beat" in the histogram.
- CP-33: yes ("Syllabus").
- CP-45: yes.
- CP-46: yes ("Clean" / "Not clean yet").
- CP-48: yes, with "Diminuendo, loud to soft" (coach.ts already says diminuendo).
- CP-49: yes ("Your file · MIDI").
- CP-51: yes.
- CP-55: yes.
- CP-56: yes.
- CP-58: "Suggested" yes; "set" -> "run" only if the widening really counts a run, not a set (check the code).
- CP-59: yes.
- CP-68: yes.
- CP-69: yes.
- CP-71: keep the cover's small capitals (the approved identity spec) and record it in DESIGN.md's copy rules as the one exception: a title-page convention on covers only. Prefer `font-variant-caps: all-small-caps` on sentence-case text over a hard-coded uppercase string.
- CP-72: done already: the shell fixes renamed it "Sight run" everywhere user-visible (sentence case).
- CP-76: yes.
- CP-77: yes.
- CP-79: yes.
- CP-80: yes.

Glossary: apply a glossary term only where a finding (clear, or decided above) covers that string. No blind global search-and-replace.
