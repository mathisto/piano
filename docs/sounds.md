# Sounds

Checked 2026-10-19. Every sample in `public/samples/` and where it came from.

| Instrument | id | Source | Licence | Folder | Size |
|---|---|---|---|---|---|
| Grand piano | `piano` | Salamander Grand Piano V3 (Alexander Holm), the 30-file set from Tone.js | CC BY 3.0 | `salamander/` | 2.0 MB |
| Electric piano | `ep` | MuseScore_General, preset 0:4 "Tine Electric Piano" | MIT | `ep/` | 466 KB |
| Church organ | `organ` | MuseScore_General, preset 0:19 "Church Organ" | MIT | `organ/` | 229 KB |
| Harp | `harp` | MuseScore_General, preset 0:46 "Harp" | MIT | `harp/` | 376 KB |
| Strings | `strings` | MuseScore_General, preset 0:48 "Strings Fast" | MIT | `strings/` | 230 KB |
| Music box | `musicbox` | MuseScore_General, preset 0:10 "Music Box" | MIT | `musicbox/` | 224 KB |
| Synth | `synth` | none, two oscillators in `src/audio.ts` | n/a | n/a | 0 |

Each set loads only when picked (or when it is the saved choice at start-up). The piano is the only big one.

## MuseScore_General (MIT)

- The soundfont: `MuseScore_General.sf3`, version 0.2 (13 May 2020), 40 MB, <https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General.sf3>
- Licence evidence, saved verbatim as `public/samples/MuseScore_General-LICENSE.md`: <https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General_License.md> says "MuseScore_General.sf2 is shared under the MIT license as described in COPYING, as was FluidR3Mono and FluidR3 before it", prints the MIT text, and adds: "The acknowledgements and copyright notices above must be included in any derivative work."
- MuseScore's handbook lists it as MIT, courtesy of S. Christian Collins: <https://musescore.org/en/handbook/3/soundfonts-and-sfz-files>
- Per-preset sample sources: <https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General_Sample_Sources.csv>. The five presets above have an empty "Sample Credit" cell, and the licence file says "All instruments without attribution are still using samples from FluidR3Mono", so their samples are Frank Wen's FluidR3 (MIT, Copyright 2000-2002, 2008 Frank Wen; mono conversion Copyright 2014-17 Michael Cowgill; adaptation Copyright 2018-19 S. Christian Collins).
- Presets by Collins' own samples, the Temple Blocks (Ethan Winer) and the Drumline Cymbals (Michael Schorsch) are not used. Presets with public-domain or CC0 samples (the Splendid Grand piano, the HQ ensemble strings) are not used either.

What we did to it: `scripts/make-sounds.py` plays one note per root (velocity 100, no reverb or chorus) through fluidsynth, matches the loudness to the Salamander piano, trims decaying notes where they go quiet, makes the organ and strings loop seamlessly, and encodes mono MP3 at 48 or 56 kbps. These are derivative works, so `MuseScore_General-LICENSE.md` ships next to them in the public folder, which satisfies the MIT notice requirement. The Settings footer also names the soundfont and its authors.

## Salamander (CC BY 3.0)

See `public/samples/salamander/CREDITS.txt`. CC BY needs a visible credit, which the Settings footer gives with a link to the licence.

## Looked at and not used

- gleitz/midi-js-soundfonts (FluidR3_GM, MusyngKite, FatBoy renderings): the README says FluidR3_GM is CC BY 3.0, but MusyngKite and FatBoy are CC BY-SA 3.0 (share-alike: a risk for a repo that may mix licences). <https://github.com/gleitz/midi-js-soundfonts>. Its FluidR3 claim of CC BY also disagrees with FluidR3's own MIT notice, so we went to the MuseScore_General source files, whose licence text is unambiguous.
- TimGM6mb: GPL v2 per MuseScore's handbook (<https://musescore.org/en/handbook/3/soundfonts-and-sfz-files>), rejected.
- Not evaluated (no licence text read): GeneralUser GS, SGM, sfzinstruments, Pianobook, VCSL, freepats.

## Rebuild

`brew install fluid-synth ffmpeg`, download the sf3 above, then `python3 scripts/make-sounds.py path/to/MuseScore_General.sf3` (needs numpy and scipy). It rewrites `public/samples/{ep,organ,harp,strings,musicbox}/` and `src/instrument-loops.ts`.

Sound quality has not been judged by ear; loudness was matched by RMS only.
