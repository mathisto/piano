#!/usr/bin/env python3
"""Build public/samples/{ep,organ,harp,strings}/ and src/instrument-samples.ts from open multisamples (see docs/sounds.md).

  python3 scripts/make-instruments.py [ep organ harp strings]

  harp     Versilian Community Sample Library, Concert Harp (CC0, github.com/sgossner/VCSL), mf and f
  organ    VCSL Pipe Organ, manual 3 open, loud (CC0; sampled by Simon Dalzell, Ivy Audio, for Versilian Studios)
  strings  VSCO 2 Community Edition, section sustains with vibrato: cello, viola, violin (CC0, github.com/sgossner/VSCO-2-CE)
  ep       Greg Sullivan's Wurlitzer EP200 (CC BY 3.0, github.com/sfzinstruments/GregSullivan.E-Pianos), pp, f and ff

Every instrument gets a root every third semitone (the layout the player expects); each is the nearest recording bent to that
pitch, at 48 kHz mono (a 44.1 kHz MP3 crashed the iPad web view's decoder). Notes that die away are trimmed 55 dB down and faded;
held ones (organ, strings) get a seamless loop. Levels are matched per layer to the piano. Needs ffmpeg, numpy, scipy.
"""
import json, re, subprocess, sys, tempfile
from fractions import Fraction
from pathlib import Path
from urllib.parse import quote
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
RAW = 'https://raw.githubusercontent.com/{}/master/{}'
VCSL, VSCO, SULL = 'sgossner/VCSL', 'sgossner/VSCO-2-CE', 'sfzinstruments/GregSullivan.E-Pianos'
NAMES = {0: 'C', 3: 'Ds', 6: 'Fs', 9: 'A'}
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def name(m): return f'{NAMES[m % 12]}{m // 12 - 1}'
def midi(s):
    n, o = re.fullmatch(r'([A-G]#?)(-?\d)', s).groups()
    return 12 * (int(o) + 1) + NOTE[n]


def listing(repo):
    out = subprocess.run(['gh', 'api', f'repos/{repo}/git/trees/master?recursive=1', '--jq', '.tree[] | select(.type=="blob") | .path'], check=True, capture_output=True, text=True).stdout
    return out.splitlines()


def fetch(repo, path, tmp):
    f = tmp / re.sub(r'\W', '_', f'{repo}/{path}')
    if not f.exists():
        subprocess.run(['curl', '-sfL', '-o', str(f), RAW.format(repo, quote(path))], check=True)
    return f


def decode(f):
    w = f.with_suffix('.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(f), '-ac', '1', '-ar', str(SR), '-sample_fmt', 's16', '-f', 'wav', str(w)], check=True)
    _, x = wavfile.read(w)
    return x.astype(np.float64) / 32768


def bend(x, semis):
    """Play the recording faster or slower, as a sampler does, to move it `semis` semitones up (negative: down)."""
    if abs(semis) < 0.005: return x
    r = Fraction(2 ** (-semis / 12)).limit_denominator(2000)
    return resample_poly(x, r.numerator, r.denominator)


def rms(x): return float(np.sqrt(np.mean(x ** 2))) + 1e-12
def db(v): return 10 ** (v / 20)


def period(x, m, lo):
    """Pitch period in samples near the nominal one, by autocorrelation with a parabolic peak."""
    t0 = SR / (440 * 2 ** ((m - 69) / 12))
    w = x[lo:lo + int(.5 * SR)]
    n = len(w) - int(t0 * 1.1) - 2
    lags = np.arange(int(t0 * .95), int(t0 * 1.05) + 2)
    ac = np.array([np.dot(w[:n], w[l:l + n]) for l in lags])
    k = int(np.argmax(ac))
    if 0 < k < len(ac) - 1:
        a, b, c = ac[k - 1], ac[k], ac[k + 1]
        d = a - 2 * b + c
        return float(lags[k] + (0.5 * (a - c) / d if d else 0))
    return float(lags[k])


def encode(y, kbps, path):
    with tempfile.TemporaryDirectory() as td:
        w = Path(td) / 'a.wav'
        wavfile.write(w, SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(w), '-ac', '1', '-ar', str(SR), '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', str(path)], check=True)


def trim(x, cap):
    """Keep the note until it is 55 dB down, within `cap` seconds, and fade the tail."""
    win = SR // 20
    env = np.sqrt(np.convolve(x * x, np.ones(win) / win, 'same'))
    loud = np.nonzero(env > env.max() * db(-55))[0]
    n = int(min(loud[-1] / SR if len(loud) else 2, cap) * SR)
    x = x[:n].copy()
    f = min(int(.4 * SR), len(x))
    x[-f:] *= np.linspace(1, 0, f) ** 2
    return x


def make_loop(x, m, start, length, xfade, tail):
    """A whole number of pitch periods, its end crossfaded into its start. Returns the shortened file and (start, end) seconds."""
    T = period(x, m, int(start * SR))
    ls = int(start * SR)
    le = ls + round(round(length * SR / T) * T)
    # section recordings are not strictly periodic: slide the end, within a period, to where the waves before it match the waves before the start best
    w, ref = int(.03 * SR), x[ls - int(.03 * SR):ls]
    best = max(range(-int(T), int(T) + 1), key=lambda d: np.dot(x[le + d - w:le + d], ref) / (np.linalg.norm(x[le + d - w:le + d]) + 1e-9))
    le += best
    f = int(xfade * SR)
    u = np.arange(f) / f
    x = x.copy()
    x[le - f:le] = x[le - f:le] * np.cos(u * np.pi / 2) + x[ls - f:ls] * np.sin(u * np.pi / 2)
    return x[:le + int(tail * SR)], (round(ls / SR, 5), round(le / SR, 5))


# ---- what each instrument is made from: layers, each a list of (midi, repo, path, cents) recordings ----

def harp():
    files = [p for p in listing(VCSL) if '/Concert Harp/' in p and p.endswith('.wav')]
    by = {'mf': [], 'f': []}
    for p in files:
        n, v = re.search(r'KSHarp_([A-G]#?\d)_(p|mp|mf|f)\d', p).groups()
        if v != 'p': by['f' if v == 'f' else 'mf'].append((midi(n), VCSL, p, 0))  # the two top notes recorded only softly are left out
    return dict(layers=[by['mf'], by['f']], roots=range(36, 97, 3), kbps=80, cap=(5.0, 2.5), levels=[-29, -24], sustained=False)


def organ():
    files = [p for p in listing(VCSL) if '/Pipe Organ/Loud/' in p and p.endswith('.wav')]
    src = [(midi(re.search(r'_([A-G]#?\d)\.wav', p).group(1)), VCSL, p, 0) for p in files]
    return dict(layers=[src], roots=range(24, 85, 3), kbps=64, levels=[-26], sustained=True, loop=(1.0, 1.5, .15, .1))


def strings():
    ls = listing(VSCO)
    pick = lambda d, pat, tag: [(midi(re.search(pat, p).group(1)), VSCO, p, 0) for p in ls if d in p and tag in p and p.endswith('.wav')]
    cello = pick('Cello Section/susvib/', r'susvib_([A-G]#?\d)_', '_v3_1')
    viola = pick('Viola Section/susvib/', r'susvib_([A-G]#?\d)_', '_v2_1')
    violin = pick('Violin Section/susVib/', r'susVib_([A-G]#?\d)_', '_v2.wav')
    return dict(layers=[cello, viola, violin], zones=[(0, 52), (53, 68), (69, 200)], roots=range(24, 85, 3), kbps=64, levels=[-26], sustained=True, loop=(1.3, 2.0, .35, .1))


def ep():
    sfz = subprocess.run(['gh', 'api', 'repos/' + SULL + '/contents/Wurlitzer%20EP200/Wurlitzer%20EP200.sfz', '--jq', '.content'], check=True, capture_output=True, text=True).stdout
    text = __import__('base64').b64decode(sfz).decode()
    group, layers = None, {}
    for line in text.splitlines():
        if m := re.search(r'group_label=(\w+)', line): group = m.group(1)
        if r := re.search(r'<region>(.*)', line):
            d = dict(re.findall(r'(\w+)=(\S+)', r.group(1)))
            s = d['sample'].replace('$EXT', 'flac')
            layers.setdefault(group, {})[(int(d['pitch_keycenter']), s)] = int(d.get('tune', 0))
    mk = lambda g: [(k, SULL, f'Wurlitzer EP200/Samples/{s}', t) for (k, s), t in sorted(layers[g].items())]
    return dict(layers=[mk('pp'), mk('f'), mk('ff')], roots=range(33, 97, 3), kbps=80, cap=(3.5, 2.5), levels=[-31, -26, -22], sustained=False)


SETS = {'harp': harp, 'organ': organ, 'strings': strings, 'ep': ep}


def build(id, tmp):
    c = SETS[id]()
    out = ROOT / 'public/samples' / id
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.mp3'): old.unlink()
    zones = c.get('zones')  # strings: one recording per register, not one per strength
    layered = len(c['layers']) > 1 and not zones
    cache, loops, total = {}, [], 0
    # level each layer against its own median over the keyboard, so a note keeps its natural loudness across the range
    pieces = {}
    for m in c['roots']:
        for li, cands in enumerate(c['layers'] if layered else [None]):
            if zones: cands = next(c['layers'][i] for i, (lo, hi) in enumerate(zones) if lo <= m <= hi)
            elif cands is None: cands = c['layers'][0]
            src = min(cands, key=lambda s: abs(s[0] - m))
            key = (src[1], src[2])
            if key not in cache: cache[key] = decode(fetch(src[1], src[2], tmp))
            x = bend(cache[key], m - src[0] + src[3] / 100)
            pieces[(m, li)] = x
    for li in range(len(c['levels'])):
        mids = []
        for m in c['roots']:
            x = pieces[(m, li)]
            mids.append(rms(x[SR // 20:SR + SR // 20]) if not c['sustained'] else rms(x[int(c['loop'][0] * SR):int((c['loop'][0] + c['loop'][1]) * SR)]))
        med = np.median([20 * np.log10(v) for v in mids])
        for m, own in zip(c['roots'], mids):
            x = pieces[(m, li)] * db(c['levels'][li] - med) if not c['sustained'] else pieces[(m, li)] * db(c['levels'][li]) / own
            if c['sustained']:
                x, lp = make_loop(x, m, *c['loop'])
                if li == 0: loops.append(lp)
            else:
                x = trim(x, c['cap'][0] - (c['cap'][0] - c['cap'][1]) * (m - 33) / 63)
            x *= min(1, .95 / np.abs(x).max())
            p = out / (f'{name(m)}-{li}.mp3' if layered else f'{name(m)}.mp3')
            encode(x, c['kbps'], p)
            total += p.stat().st_size
        if not layered: break
    roots = [[name(m), m] + (list(loops[i]) if loops else []) for i, m in enumerate(c['roots'])]
    print(f'{id}: {len(list(out.glob("*.mp3")))} files, {total / 1e6:.2f} MB')
    return dict(layers=len(c['layers']) if layered else 0, roots=roots)


def main():
    ids = sys.argv[1:] or list(SETS)
    cfg = {}
    ts = ROOT / 'src/instrument-samples.ts'
    if ts.exists():
        m = re.search(r'= (\{.*\})\n', ts.read_text())
        if m: cfg = json.loads(m.group(1))
    with tempfile.TemporaryDirectory() as t:
        for id in ids: cfg[id] = build(id, Path(t))
    ts.write_text(
        '// Generated by scripts/make-instruments.py: the recordings of each open-source instrument, as [file, midi, loopStart, loopEnd] (the loop only for held notes), and how many strengths each was recorded at (0: one).\n'
        'export const SAMPLES: Record<string, { layers: number; roots: [string, number, number?, number?][] }> = ' + json.dumps(cfg) + '\n')


if __name__ == '__main__':
    sys.exit(main())
