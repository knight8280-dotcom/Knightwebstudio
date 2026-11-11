import json, re, sys
from PIL import Image
def lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
LUT = [lin(i) for i in range(256)]
def lum(rgb): return 0.2126 * LUT[rgb[0]] + 0.7152 * LUT[rgb[1]] + 0.0722 * LUT[rgb[2]]
def parse(c):
    v = [float(x) for x in re.findall(r'[\d.]+', c)]
    return (int(round(v[0])), int(round(v[1])), int(round(v[2])))
idx = json.load(open('cshots/index.json'))
worst_all = 99
for run in idx:
    worst = (99, None); fails = 0; total = 0; lows = []
    for f in run['files']:
        im = Image.open(f).convert('RGB'); px = im.load(); W, H = im.size
        for b in run['boxes']:
            Lt = lum(parse(b['color'])); need = 3.0 if (b['size'] >= 24 or (b['size'] >= 18.66 and b['bold'])) else 4.5
            x0, y0 = max(0, int(b['x'])), max(0, int(b['y'])); x1, y1 = min(W, int(b['x'] + b['w']) + 1), min(H, int(b['y'] + b['h']) + 1)
            for y in range(y0, y1):
                for x in range(x0, x1):
                    Lb = lum(px[x, y]); r = (max(Lt, Lb) + 0.05) / (min(Lt, Lb) + 0.05); total += 1
                    if r < need: fails += 1
                    if r / need < worst[0]: worst = (r / need, (round(r, 2), need, b['text'], b['size'], f.split('/')[-1], px[x, y], b['color']))
    w = worst[1]
    worst_all = min(worst_all, worst[0])
    print(f"{run['theme']:5} {run['w']:4} {run['name']:11} live={run['live']} frames={len(run['files'])} pixels={total:>9,} below AA={fails}  lowest {w[0]}:1 (needs {w[1]}:1) at \"{w[2]}\" {w[3]}px, ground {w[5]}, text {w[6]}")
print('worst ratio to requirement:', round(worst_all, 3), 'PASS' if worst_all >= 1 else 'FAIL')
