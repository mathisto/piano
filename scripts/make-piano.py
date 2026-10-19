#!/usr/bin/env python3
"""Build public/samples/salamander/ from the original Salamander Grand Piano V3 (CC BY 3.0, see docs/sounds.md).

  python3 scripts/make-piano.py

Downloads three of the 16 velocity layers (soft, medium, hard) for each of the 30 recorded notes as 48 kHz 24-bit
FLAC from github.com/sfzinstruments/SalamanderGrandPiano, sums to mono, trims each note where it has decayed
(longer for the bass, within 6 to 2.5 s), fades the tail, levels the three layers against each other (a note's own loudness across
the keyboard is kept) and writes NAME-0.mp3 (soft) to NAME-2.mp3 (hard). Needs ffmpeg, numpy, scipy.
"""
import subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/samples/salamander'
URL = 'https://raw.githubusercontent.com/sfzinstruments/SalamanderGrandPiano/master/Samples/{}v{}.flac'
SR = 48000  # the recordings' own rate: a 44.1 kHz MP3 made the iPad's decoder crash on one file (Fs5, medium layer) when it resampled
LAYERS = [4, 9, 14]  # of 16: velocities about 30, 70 and 110
TARGET_DB = [-33.0, -26.0, -22.0]  # RMS of the first second, the layers' loudness steps
NAMES = {0: 'C', 3: 'Ds', 6: 'Fs', 9: 'A'}
ROOTS = ['A0'] + [f'{n}{o}' for o in range(1, 8) for n in ('C', 'Ds', 'Fs', 'A')] + ['C8']
KBPS = 96


def midi(name):
    pc = {v: k for k, v in NAMES.items()}[name.rstrip('0123456789')]
    return 12 * (int(name[len(name.rstrip('0123456789')):]) + 1) + pc


def fetch(tmp, name, v):
    f = tmp / f'{name}v{v}.flac'  # the repo spells Ds as D#, fetched as D%23
    if not f.exists():
        subprocess.run(['curl', '-sfL', '-o', str(f), URL.format(name.replace('s', '%23'), v)], check=True)
    return f


def decode(f):
    w = f.with_suffix('.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(f), '-ac', '1', '-ar', str(SR), '-sample_fmt', 's16', str(w)], check=True)
    _, x = wavfile.read(w)
    return x.astype(np.float32) / 32768


def keep(x, m):
    """Seconds of a note worth keeping: until it is 55 dB down, within 6 s in the bass down to 2.5 s at the top. Every second is 190 KB of decoded audio held in memory per recording, and the iPad's web view is killed when the piano holds too much (117 MB did it)."""
    win = SR // 20
    env = np.sqrt(np.convolve(x * x, np.ones(win) / win, 'same'))
    loud = np.nonzero(env > env.max() * 10 ** (-55 / 20))[0]
    cap = 6 - 3.5 * (m - 21) / 87
    return float(np.clip(loud[-1] / SR if len(loud) else 2, 2, cap))


def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x[:SR] ** 2)) + 1e-9)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        jobs = [(n, v) for n in ROOTS for v in LAYERS]
        with ThreadPoolExecutor(8) as ex:
            files = dict(zip(jobs, ex.map(lambda j: fetch(tmp, *j), jobs)))
        audio = {j: decode(f) for j, f in files.items()}
        for li, v in enumerate(LAYERS):
            med = np.median([rms_db(audio[(n, v)]) for n in ROOTS])
            for n in ROOTS:
                x = audio[(n, v)] * 10 ** ((TARGET_DB[li] - med) / 20)
                x = x[: int(keep(x, midi(n)) * SR)]
                fade = int(0.5 * SR)
                x[-fade:] *= np.linspace(1, 0, min(fade, len(x))) ** 2
                x = np.clip(x, -0.98, 0.98)
                w = tmp / f'{n}-{li}.wav'
                wavfile.write(w, SR, (x * 32767).astype(np.int16))
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(w), '-b:a', f'{KBPS}k', '-ac', '1', '-ar', str(SR), str(OUT / f'{n}-{li}.mp3')], check=True)
    for old in OUT.glob('*.mp3'):
        if '-' not in old.stem:
            old.unlink()  # the single-layer set this replaces
    size = sum(f.stat().st_size for f in OUT.glob('*.mp3'))
    print(f'{len(list(OUT.glob("*.mp3")))} files, {size / 1e6:.1f} MB')


if __name__ == '__main__':
    sys.exit(main())
