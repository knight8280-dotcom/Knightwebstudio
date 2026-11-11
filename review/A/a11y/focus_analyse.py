# Measure each focus ring from the focused/unfocused clip pair: how much of each side is drawn, and with what contrast against what was there.
import json, glob, os, sys
import numpy as np
from PIL import Image
def lum(a):
    a = a.astype(np.float64) / 255.0
    a = np.where(a <= 0.03928, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
rows = []
for jf in sorted(glob.glob('out/keys_*_*_*.json')):
    base = os.path.basename(jf)[5:-5]
    stops = json.load(open(jf))
    for s in stops:
        if 'clip' not in s: 
            rows.append((base, s['i'], s['text'], 'NOCLIP', 0, 0, 0, s['sel'], s['rect'])); continue
        f = f"shots/focus/{base}_{s['i']:03d}_f.png"; u = f"shots/focus/{base}_{s['i']:03d}_u.png"
        if not (os.path.exists(f) and os.path.exists(u)): continue
        F = np.asarray(Image.open(f).convert('RGB')); U = np.asarray(Image.open(u).convert('RGB'))
        if F.shape != U.shape: continue
        diff = np.abs(F.astype(int) - U.astype(int)).max(axis=2) > 10
        lf, lu = lum(F), lum(U)
        cr = (np.maximum(lf, lu) + 0.05) / (np.minimum(lf, lu) + 0.05)
        strong = diff & (cr >= 3.0)
        cx, cy, cw, ch = s['clip']; x, y, w, h = s['rect']
        scale = F.shape[1] / cw
        L = int((x - cx) * scale); T = int((y - cy) * scale); R = int((x + w - cx) * scale); B = int((y + h - cy) * scale)
        H, W = strong.shape
        def frac(mask):
            return float(mask.mean()) if mask.size else -1
        o, i_ = int(9 * scale), int(5 * scale)
        xs = slice(max(0, L), min(W, R)); ys = slice(max(0, T), min(H, B))
        top = strong[max(0, T - o):max(0, min(H, T + i_)), xs].any(axis=0) if T - o < H else np.array([])
        bot = strong[max(0, B - i_):min(H, B + o), xs].any(axis=0)
        lef = strong[ys, max(0, L - o):max(0, min(W, L + i_))].any(axis=1)
        rig = strong[ys, max(0, R - i_):min(W, R + o)].any(axis=1)
        sides = [frac(top), frac(bot), frac(lef), frac(rig)]
        # median contrast of changed pixels
        med = float(np.median(cr[diff])) if diff.any() else 0
        rows.append((base, s['i'], s['text'], 'ok', int(diff.sum()), int(strong.sum()), [round(v, 2) for v in sides], s['sel'], s['rect'], round(med, 2), s.get('fv'), s['outline']))
json.dump(rows, open('out/focus_measure.json', 'w'))
bad = [r for r in rows if r[3] != 'ok' or min(r[6]) < 0.7]
print('pairs', len(rows), 'flagged', len(bad))
from collections import Counter
c = Counter()
for r in bad:
    key = (r[7].split(' > ')[-1], str(r[6]) if r[3]=='ok' else r[3])
    c[key] += 1
agg = {}
for r in bad:
    k = r[7].split(' > ')[-1][:70]
    agg.setdefault(k, []).append(r)
for k, v in sorted(agg.items(), key=lambda kv: -len(kv[1])):
    r = v[0]
    print(f"{len(v):4d}  {k}  e.g. {r[0]} #{r[1]} \"{r[2][:30]}\" sides(T,B,L,R)={r[6]} changed={r[4]} strong={r[5]} med={r[9] if len(r)>9 else ''} rect={r[8]}")
