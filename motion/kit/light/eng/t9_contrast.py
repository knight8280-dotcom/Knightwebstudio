#!/usr/bin/env python3
"""Per-pixel WCAG contrast of each text colour against the ground photographed behind it (words transparent), frame by frame."""
import json, glob, os, re, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

def lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def lum(rgb):
    l = lin(np.asarray(rgb, dtype=np.float64))
    return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]

def box3(a):
    p = np.pad(a, 1, mode='edge')
    return sum(p[i:i + a.shape[0], j:j + a.shape[1]] for i in range(3) for j in range(3)) / 9.0

rows = []
for d in sorted(glob.glob(os.path.join(HERE, 'contrast', '*'))):
    if not os.path.isdir(d): continue
    info = json.load(open(os.path.join(d, 'rects.json')))
    dsf, clip = info['dsf'], info['clip']
    frames = sorted(glob.glob(os.path.join(d, 'f-*.png')))
    worst = {}  # per text element
    tot = below = 0
    gmin = (99, None, None); gmin3 = (99, None, None)
    changed = 0; prev = None
    for fi, f in enumerate(frames):
        im = np.asarray(Image.open(f).convert('RGB'), dtype=np.float64)
        if prev is not None and np.abs(im - prev).mean() > 0.05: changed += 1
        prev = im
        L = lum(im); L3 = box3(L)
        for r in info['rects']:
            m = re.match(r'rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)', r['color'])
            if not m: continue
            if m.group(4) is not None and float(m.group(4)) < 1: continue
            Lt = float(lum(np.array([float(m.group(1)), float(m.group(2)), float(m.group(3))])))
            x0 = int(round((r['x'] - clip['x']) * dsf)); y0 = int(round((r['y'] - clip['y']) * dsf)); x1 = int(round((r['x'] + r['w'] - clip['x']) * dsf)); y1 = int(round((r['y'] + r['h'] - clip['y']) * dsf))
            x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(L.shape[1], x1), min(L.shape[0], y1)
            if x1 <= x0 or y1 <= y0: continue
            reg = L[y0:y1, x0:x1]; reg3 = L3[y0:y1, x0:x1]
            cr = (np.maximum(reg, Lt) + .05) / (np.minimum(reg, Lt) + .05)
            cr3 = (np.maximum(reg3, Lt) + .05) / (np.minimum(reg3, Lt) + .05)
            large = r['fs'] >= 24 or (r['fs'] >= 18.66 and r['fw'] >= 700)
            need = 3.0 if large else 4.5
            tot += cr.size; below += int((cr < need).sum())
            key = (r['cls'], r['text'], r['color'], need)
            mn, mn3 = float(cr.min()), float(cr3.min())
            w = worst.get(key, (99, 99))
            worst[key] = (min(w[0], mn), min(w[1], mn3))
            if need == 4.5:
                if mn < gmin[0]: gmin = (mn, key, fi)
                if mn3 < gmin3[0]: gmin3 = (mn3, key, fi)
    name = os.path.basename(d)
    fails = [(k, v) for k, v in worst.items() if v[0] < k[3]]
    rows.append((name, len(frames), changed, tot, below, gmin, gmin3, fails))
    print(f"{name}: frames {len(frames)} (changed {changed}), px behind text {tot:,}, below AA {below:,} ({100.0*below/max(tot,1):.4f}%)")
    print(f"    worst pixel (normal text) {gmin[0]:.2f}:1  [{gmin[1][0] if gmin[1] else ''} \"{gmin[1][1] if gmin[1] else ''}\" {gmin[1][2] if gmin[1] else ''} frame {gmin[2]}]   worst 3x3 mean {gmin3[0]:.2f}:1 [{gmin3[1][1] if gmin3[1] else ''}]")
    for k, v in sorted(fails, key=lambda kv: kv[1][0])[:6]:
        print(f"    BELOW: {k[0]} \"{k[1]}\" {k[2]} need {k[3]} → worst px {v[0]:.2f}, worst 3x3 {v[1]:.2f}")
