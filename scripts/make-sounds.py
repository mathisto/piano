#!/usr/bin/env python3
"""Render the music box in public/samples/musicbox/ from MuseScore_General.sf3 (MIT, see docs/sounds.md).

  python3 scripts/make-sounds.py /path/to/MuseScore_General.sf3

Needs fluidsynth, ffmpeg, numpy, scipy. One mono mp3 per root pitch (every minor third, C2 to C7), trimmed where it goes
quiet. The other instruments come from scripts/make-instruments.py.
"""
import struct, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
from scipy.io import wavfile

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
# id: (GM program, sustained?, kbps)
SETS = {'musicbox': (10, False, 56)}
MIDIS = list(range(36, 97, 3))
NAMES = {0: 'C', 3: 'Ds', 6: 'Fs', 9: 'A'}
HOLD, GAP = 3.2, 1.5


def name(m): return f'{NAMES[m % 12]}{m // 12 - 1}'


def vlq(n):
    out = [n & 127]
    while n >> 7:
        n >>= 7
        out.append((n & 127) | 128)
    return bytes(reversed(out))


def midi_file(program, hold):
    """One channel, notes in sequence at 960 ticks per second (480 ppq, 120 bpm); returns (bytes, [start second per root])."""
    ev, starts, t = [(0, bytes([0xC0, program]))], [], 0
    for m in MIDIS:
        starts.append(t / 960)
        ev += [(t, bytes([0x90, m, 100])), (t + round(hold * 960), bytes([0x80, m, 0]))]
        t += round((hold + GAP) * 960)
    prev, trk = 0, b'\x00\xff\x51\x03\x07\xa1\x20'
    for at, msg in ev:
        trk += vlq(at - prev) + msg
        prev = at
    trk += b'\x00\xff\x2f\x00'
    return b'MThd' + struct.pack('>IHHH', 6, 0, 1, 480) + b'MTrk' + struct.pack('>I', len(trk)) + trk, starts


def render(sf, mid, wav):
    subprocess.run(['fluidsynth', '-ni', '-g', '0.5', '-r', str(SR), '-o', 'synth.reverb.active=0', '-o', 'synth.chorus.active=0', '-F', str(wav), str(sf), str(mid)], check=True, capture_output=True)
    sr, x = wavfile.read(wav)
    assert sr == SR
    x = x.astype(np.float64) / (32768 if x.dtype == np.int16 else 1)
    return x.mean(axis=1) if x.ndim == 2 else x


def rms(x): return float(np.sqrt(np.mean(x**2))) + 1e-12


def piano_rms():
    """The loudness to match: the shipped Salamander piano at C3, C4 and C5, 0.05 to 0.65 s after the hit."""
    out = []
    for n in ('C3', 'C4', 'C5'):
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(ROOT / f'public/samples/salamander/{n}-1.mp3'), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], check=True, capture_output=True).stdout
        out.append(rms(np.frombuffer(raw, dtype='<f4')[int(.05 * SR):int(.65 * SR)]))
    return float(np.mean(out))


def encode(y, kbps, path):
    with tempfile.TemporaryDirectory() as td:
        w = Path(td) / 'a.wav'
        wavfile.write(w, SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(w), '-ac', '1', '-ar', str(SR), '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', str(path)], check=True)


def main():
    sf = Path(sys.argv[1])
    target = piano_rms()
    for id, (prog, _, kbps) in SETS.items():
        hold = HOLD
        out = ROOT / 'public/samples' / id
        out.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as td:
            mid = Path(td) / 'a.mid'
            data, starts = midi_file(prog, hold)
            mid.write_bytes(data)
            x = render(sf, mid, Path(td) / 'a.wav')
        total = 0
        for m, s in zip(MIDIS, starts):
            seg = x[int(s * SR):int((s + hold) * SR)].copy()
            pk = np.abs(seg).max()
            end = int(np.nonzero(np.abs(seg) > .004 * pk)[0][-1]) + int(.05 * SR)
            seg = seg[:min(end, len(seg))]
            fo = min(int(.08 * SR), len(seg))
            seg[-fo:] *= np.linspace(1, 0, fo)
            seg = seg * (target / rms(seg[int(.05 * SR):int(.65 * SR)]))
            seg *= min(1, .95 / np.abs(seg).max())
            p = out / f'{name(m)}.mp3'
            encode(seg, kbps, p)
            total += p.stat().st_size
        print(f'{id}: {len(MIDIS)} files, {total / 1024:.0f} KB')


main()
