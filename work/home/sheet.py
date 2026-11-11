#!/usr/bin/env python3
"""sheet.py OUT.png SCALE COLS file1 file2 ...  -> grid contact sheet"""
import sys
from PIL import Image
out, scale, cols = sys.argv[1], float(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ims = []
for f in files:
    im = Image.open(f).convert('RGB')
    im = im.resize((int(im.width*scale), int(im.height*scale)), Image.LANCZOS)
    ims.append(im)
gap = 10
rows = [ims[i:i+cols] for i in range(0, len(ims), cols)]
W = max(sum(i.width for i in r) + gap*(len(r)-1) for r in rows)
H = sum(max(i.height for i in r) for r in rows) + gap*(len(rows)-1)
sheet = Image.new('RGB', (W, H), (128,128,128))
y = 0
for r in rows:
    x = 0
    for im in r:
        sheet.paste(im, (x, y)); x += im.width + gap
    y += max(i.height for i in r) + gap
sheet.save(out)
print(out, sheet.size)
