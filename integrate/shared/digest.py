#!/usr/bin/env python3
"""digest.py DIR [--only substring] : for every *__diff.png in DIR (A | B | red, as written by compare.js) write
DIR/digest/<key>__NN.png: only the bands that differ, A above B, cropped to the columns that differ.
Prints one line per combination: heights, number of bands, and their y ranges."""
import sys, json, pathlib
from PIL import Image, ImageDraw
d = pathlib.Path(sys.argv[1]); only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else ''
out = d / 'digest'; out.mkdir(exist_ok=True)
for f in out.glob('*.png'):
    if not only or only in f.name: f.unlink()
rep = json.loads((d / 'report.json').read_text()) if (d / 'report.json').exists() else {}
for f in sorted(d.glob('*__diff.png')):
    key = f.name[:-len('__diff.png')]
    if only and only not in key: continue
    im = Image.open(f).convert('RGB'); W = (im.width - 32) // 3; H = im.height
    A, B, Rd = im.crop((0, 0, W, H)), im.crop((W + 16, 0, 2 * W + 16, H)), im.crop((2 * W + 32, 0, 3 * W + 32, H))
    mask = Rd.convert('L').point(lambda v: 255 if v < 200 else 0)   # red is darker than white in L
    rows = [y for y in range(H) if mask.crop((0, y, W, y + 1)).getbbox()]
    bands = []
    for y in rows:
        if bands and y - bands[-1][1] <= 48: bands[-1][1] = y
        else: bands.append([y, y])
    info = rep.get(key, {})
    print(f"{key}: A {info.get('heightA')} B {info.get('heightB')} px, {info.get('percent')}% differ, {len(bands)} band(s): " + ', '.join(f'{a}-{b}' for a, b in bands[:14]) + (' ...' if len(bands) > 14 else ''))
    cards, cur, curh = [], [], 0
    for a, b in bands:
        y0, y1 = max(0, a - 28), min(H, b + 29)
        bb = mask.crop((0, y0, W, y1)).getbbox()
        x0, x1 = max(0, bb[0] - 60), min(W, bb[2] + 60)
        if x1 - x0 < 700: 
            c = (x0 + x1) // 2; x0 = max(0, c - 350); x1 = min(W, x0 + 700); x0 = max(0, x1 - 700)
        h = y1 - y0
        if h > 1300: y1 = y0 + 1300; h = 1300
        ca, cb = A.crop((x0, y0, x1, y1)), B.crop((x0, y0, x1, y1))
        side = (x1 - x0) <= 760
        w = (x1 - x0) * 2 + 12 if side else (x1 - x0)
        hh = h + 22 if side else 2 * h + 12 + 22
        card = Image.new('RGB', (w, hh), (255, 0, 255) if False else (90, 90, 90))
        dr = ImageDraw.Draw(card); dr.text((4, 4), f'{key}  y {a}-{b}  x {x0}-{x1}   A = before (left/top), B = after', fill=(255, 255, 255))
        card.paste(ca, (0, 22)); card.paste(cb, ((x1 - x0) + 12, 22) if side else (0, 22 + h + 12))
        if curh + hh > 1900 and cur:
            cards.append(cur); cur, curh = [], 0
        cur.append(card); curh += hh + 8
    if cur: cards.append(cur)
    for i, group in enumerate(cards[:8], 1):
        w = max(c.width for c in group); h = sum(c.height + 8 for c in group)
        sheet = Image.new('RGB', (w, h), (40, 40, 40)); y = 0
        for c in group: sheet.paste(c, (0, y)); y += c.height + 8
        sheet.save(out / f'{key}__{i:02d}.png')
    if len(cards) > 8: print(f'   ... {len(cards) - 8} more digest sheet(s) not written for {key}')
