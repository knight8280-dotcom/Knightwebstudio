#!/usr/bin/env python3
# pixdiff.py dirA dirB [--modes m1,m2] [--thr 6]   band-wise visual diff of full-page shots, tolerant of vertical drift
import sys, os
import numpy as np
from PIL import Image
A, B = sys.argv[1], sys.argv[2]
def arg(k, d):
    return sys.argv[sys.argv.index('--' + k) + 1] if '--' + k in sys.argv else d
modes = [m for m in arg('modes', '').split(',') if m]; thr = float(arg('thr', '6')); S = 4; BAND = 240
def load(p):
    im = Image.open(p).convert('RGB'); w, h = im.size
    return np.asarray(im.resize((w // S, h // S), Image.BOX), dtype=np.int16), h
for f in sorted(os.listdir(A)):
    if not f.endswith('.png') or not os.path.exists(os.path.join(B, f)): continue
    if modes and not any('__' + m + '.' in f for m in modes): continue
    a, ha = load(os.path.join(A, f)); b, hb = load(os.path.join(B, f))
    if a.shape[1] != b.shape[1]: print(f, 'WIDTH DIFFERS', a.shape, b.shape); continue
    bh = BAND // S; off = 0; bad = []
    for y in range(0, a.shape[0] - bh + 1, bh):
        best = (1e9, off)
        for d in range(off - 24, off + 25):
            y2 = y + d
            if y2 < 0 or y2 + bh > b.shape[0]: continue
            diff = np.abs(a[y:y + bh] - b[y2:y2 + bh])
            # ignore faint antialiasing: count pixels that differ clearly
            score = float((diff.max(axis=2) > 40).mean() * 100)
            if score < best[0] - 1e-9 or (abs(score - best[0]) < 1e-9 and abs(d - off) < abs(best[1] - off)): best = (score, d)
        off = best[1]
        if best[0] > thr: bad.append((y * S, round(best[0], 1), off * S))
    print(f"{f.replace('.png','')}: heights {ha}/{hb}, final drift {off * S}px, bands over {thr}%: {len(bad)}" + (' -> ' + ', '.join(f'y{y}({s}%)' for y, s, o in bad[:14]) if bad else ''))
