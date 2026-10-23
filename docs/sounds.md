# Sounds

Checked 2026-10-19. Every sample in `public/samples/` and where it came from.

| Instrument | id | Source | Licence | Folder | Size |
|---|---|---|---|---|---|
| Grand piano | `piano` | Salamander Grand Piano V3 (Alexander Holm), original 48 kHz 24-bit FLAC from github.com/sfzinstruments/SalamanderGrandPiano, three of its 16 velocity layers | CC BY 3.0 | `salamander/` | 7.4 MB |
| Electric piano | `ep` | Greg Sullivan's Wurlitzer EP200 (github.com/sfzinstruments/GregSullivan.E-Pianos, mapped by kinwie): pp, f and ff layers, each recording bent to a root every third semitone with the sfz's own tuning offsets | CC BY 3.0 (the author's own site says 4.0) | `ep/` | 1.3 MB |
| Church organ | `organ` | Versilian Community Sample Library, Pipe Organ, manual 3 open, loud set (github.com/sgossner/VCSL; sampled by Simon Dalzell of Ivy Audio for Versilian Studios), looped | CC0 | `organ/` | 0.45 MB |
| Harp | `harp` | VCSL Concert Harp: mf and f layers | CC0 | `harp/` | 1.5 MB |
| Strings | `strings` | VSCO 2 Community Edition (github.com/sgossner/VSCO-2-CE), section sustains with vibrato: cello for the bass, viola for the middle, violin above, looped | CC0 | `strings/` | 0.6 MB |
| Music box | `musicbox` | MuseScore_General, preset 0:10 "Music Box" | MIT | `musicbox/` | 224 KB |
| Synth | `synth` | none, two oscillators in `src/audio.ts` | n/a | n/a | 0 |

Each set loads only when picked (or when it is the saved choice at start-up). The piano is the only big one: its medium layer (2.5 MB) loads first and plays at once, the soft and hard layers follow.

## Piano build

`python3 scripts/make-piano.py` fetches layers 4, 9 and 14 of 16 for the 30 recorded notes, sums them to mono, trims each note 55 dB down (6 s in the bass, 2.5 s at the top: the iPad's web view is killed by memory when the piano holds 117 MB decoded, which the first 9 to 5 s version did), fades the tail, levels the layers to about -33, -26 and -22 dB RMS (the step from soft to hard, with each note's own loudness across the keyboard kept) and encodes 48 kHz, 96 kbps mono MP3 as `NAME-0` (soft), `NAME-1`, `NAME-2` (hard). A hit blends the two nearest layers by velocity, equal-power (`mix` in `src/audio.ts`). The files are 48 kHz, the recordings' own rate, on purpose: encoded at 44.1 kHz, one file (Fs5, medium layer) crashed the iPad web view's MP3 decoder when it resampled it (found by decoding all 90 files on the iPad one at a time; desktop Chrome and WebKit decoded it fine). If the iPad's web view terminates when a new sample set loads, decode the files one by one on the device and look for the one that kills it. This replaced the 30-file Tone.js set, which was one layer at about 37 kbps stereo: thin, and the same note at every strength. Every instrument now goes through a small synthesised hall (1.7 s, 20% wet) so a sample does not sound dry. The release-noise and sustain-pedal samples in the repo are not used. The earlier note below, that sound has not been judged by ear, still holds: check on the iPad.

## Open multisamples (`scripts/make-instruments.py`)

`python3 scripts/make-instruments.py [ep organ harp strings]` (needs `gh`, ffmpeg, numpy, scipy) downloads the recordings from GitHub and rewrites `public/samples/{ep,organ,harp,strings}/` and `src/instrument-samples.ts` (each instrument's roots, loops and layer count, read by `src/instruments.ts`). Every instrument gets a root every third semitone: each is the nearest source recording bent to that pitch (a sampler's own method, at most a few semitones), at 48 kHz mono, 64 to 80 kbps. Notes that die away (harp, electric piano) are cut 55 dB down and faded; held ones (organ, strings) get a loop whose end is slid to the point where the waves before it best match the waves before the start, then crossfaded. Levels are matched to the piano per strength layer. Layers blend by how hard the key is hit (`layerAt` in `src/audio.ts`: two layers at 0.3 and 0.78, three at 0.22, 0.54 and 0.85).

Licences, read from each repo's own files on 2026-10-23: VCSL and VSCO 2 CE are CC0 1.0 (their LICENSE files; VCSL's README: "you can do whatever you want with these sounds (even make commercial software), no royalties, no credit"; VSCO's Readme asks only that the samples not be sold directly and that Versilian Studios be credited, which Credits does). The Wurlitzer repo's README says CC BY 3.0 "with the author permission with the request for attribution"; the author's page says 4.0. We credit Greg Sullivan in Credits.

Measured, not heard: decoded sizes (harp 28 MB, ep 25 MB, strings 14 MB, organ 11 MB), per-layer loudness, and that each loop's wrap step is no bigger than the waveform's largest normal step (no click). Listen on the iPad: the strings use one loud ensemble recording per register (cello below G3, viola to D5, violin above), so the register changes are the place to listen for a seam; the harp's top notes bend up to 7 semitones from F6.

Rejected sources: jRhodes3c/3d (the best Rhodes, but CC BY-NC), Sonatina Symphonic Orchestra (CC Sampling Plus), Philharmonia (no redistribution as a sampler), GeneralUser GS (custom terms), Iowa MIS (no named licence). No clean music-box set exists; VCSL's kalimba and glockenspiel are CC0 if a replacement is wanted.

## MuseScore_General (MIT)

- The soundfont: `MuseScore_General.sf3`, version 0.2 (13 May 2020), 40 MB, <https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General.sf3>
- Licence evidence, saved verbatim as `public/samples/MuseScore_General-LICENSE.md`: <https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General_License.md> says "MuseScore_General.sf2 is shared under the MIT license as described in COPYING, as was FluidR3Mono and FluidR3 before it", prints the MIT text, and adds: "The acknowledgements and copyright notices above must be included in any derivative work."
- MuseScore's handbook lists it as MIT, courtesy of S. Christian Collins: <https://musescore.org/en/handbook/3/soundfonts-and-sfz-files>
- Per-preset sample sources: <https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General_Sample_Sources.csv>. The five presets above have an empty "Sample Credit" cell, and the licence file says "All instruments without attribution are still using samples from FluidR3Mono", so their samples are Frank Wen's FluidR3 (MIT, Copyright 2000-2002, 2008 Frank Wen; mono conversion Copyright 2014-17 Michael Cowgill; adaptation Copyright 2018-19 S. Christian Collins).
- Only the music box preset is used now. Presets by Collins' own samples, the Temple Blocks (Ethan Winer) and the Drumline Cymbals (Michael Schorsch) are not used. Presets with public-domain or CC0 samples (the Splendid Grand piano, the HQ ensemble strings) are not used either.

What we did to it: `scripts/make-sounds.py` plays one note per root (velocity 100, no reverb or chorus) through fluidsynth for the music box, matches the loudness to the Salamander piano, trims where it goes quiet and encodes mono MP3 at 56 kbps. These are derivative works, so `MuseScore_General-LICENSE.md` ships next to them in the public folder, which satisfies the MIT notice requirement. Credits names the soundfont and its authors.

## Salamander (CC BY 3.0)

See `public/samples/salamander/CREDITS.txt`. CC BY needs a visible credit, which the Settings footer gives with a link to the licence.

## Looked at and not used

- gleitz/midi-js-soundfonts (FluidR3_GM, MusyngKite, FatBoy renderings): the README says FluidR3_GM is CC BY 3.0, but MusyngKite and FatBoy are CC BY-SA 3.0 (share-alike: a risk for a repo that may mix licences). <https://github.com/gleitz/midi-js-soundfonts>. Its FluidR3 claim of CC BY also disagrees with FluidR3's own MIT notice, so we went to the MuseScore_General source files, whose licence text is unambiguous.
- TimGM6mb: GPL v2 per MuseScore's handbook (<https://musescore.org/en/handbook/3/soundfonts-and-sfz-files>), rejected.
- Not evaluated (no licence text read): GeneralUser GS, SGM, sfzinstruments, Pianobook, VCSL, freepats.

## Rebuild

Open multisamples: see above. Music box: `brew install fluid-synth ffmpeg`, download the sf3 above, then `python3 scripts/make-sounds.py path/to/MuseScore_General.sf3` (needs numpy and scipy); it rewrites `public/samples/musicbox/`.

Sound quality has not been judged by ear; loudness was matched by RMS only.
