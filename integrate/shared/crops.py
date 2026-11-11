#!/usr/bin/env python3
"""crops.py DIR [--only substr] [--keep]: from sectdiff.js output, cut each changed band's changed part out of the two
full-page screenshots and write DIR/crops/<key>__bNN.png (A above B, or side by side when narrow)."""
import sys, json, pathlib
from PIL import Image, ImageDraw
d = pathlib.Path(sys.argv[1]); only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else ''
out = d / 'crops'; out.mkdir(exist_ok=True)
for jf in sorted(d.glob('*.json')):
    rep = json.loads(jf.read_text()); key = rep['key']
    if only and only not in key: continue
    if not rep['roots']: continue
    A, B = Image.open(d / f'{key}__a.png').convert('RGB'), Image.open(d / f'{key}__b.png').convert('RGB')
    for r in rep['roots']:
        def span(side):
            ys = [(x[side][1], x[side][1] + x[side][3]) for x in r['diffs'] if x[side][3] > 0 and x[side][2] > 0] or [(0, r[side]['h'])]
            y0 = max(0, min(a for a, b in ys) - 40); y1 = min(r[side]['h'], max(b for a, b in ys) + 40)
            return y0, max(y1, y0 + 60)
        (a0, a1), (b0, b1) = span('a'), span('b'); y0 = min(a0, b0); ha = min(max(a1, b1) - y0, 1500)
        def cut(img, side):
            top = r[side]['top'] + y0; return img.crop((0, int(top), img.width, int(min(img.height, top + ha))))
        ca, cb = cut(A, 'a'), cut(B, 'b')
        side = A.width <= 800
        Wd = ca.width * 2 + 12 if side else ca.width; Hd = max(ca.height, cb.height) + 20 if side else ca.height + cb.height + 12 + 20
        card = Image.new('RGB', (Wd, Hd), (70, 70, 70)); dr = ImageDraw.Draw(card)
        dr.text((4, 4), f"{key} band {r['i']} {r['name'][:50]} rows {int(y0)}-{int(y0 + ha)} of {r['a']['h']}/{r['b']['h']}  A=before {'left' if side else 'top'}", fill=(255, 255, 255))
        card.paste(ca, (0, 20)); card.paste(cb, (ca.width + 12, 20) if side else (0, 20 + ca.height + 12))
        card.save(out / f"{key}__b{r['i']:02d}.png")
    if '--keep' not in sys.argv:
        pass
print('crops in', out)
