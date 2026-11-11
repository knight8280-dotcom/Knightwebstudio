#!/usr/bin/env python3
# sheet2.py OUT.png y0 y1 scale img1 [img2 ...]
import sys
from PIL import Image, ImageDraw
out, y0, y1, sc = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), float(sys.argv[4]); paths = sys.argv[5:]
ims = [Image.open(p).convert('RGB') for p in paths]
crops = [im.crop((0, min(y0, im.height), im.width, min(y1, im.height))) for im in ims]
crops = [c.resize((max(1, int(c.width * sc)), max(1, int(c.height * sc))), Image.LANCZOS) for c in crops]
gap = 10; W = sum(c.width for c in crops) + gap * (len(crops) - 1); H = max(c.height for c in crops) + 20
sheet = Image.new('RGB', (W, H), (255, 0, 255)); d = ImageDraw.Draw(sheet); x = 0
for p, c in zip(paths, crops):
    sheet.paste(c, (x, 20)); d.rectangle((x, 0, x + c.width, 19), fill=(20, 20, 20)); d.text((x + 4, 4), '/'.join(p.split('/')[-2:]).replace('.png', '') + f' y{y0}-{y1}', fill=(255, 255, 255)); x += c.width + gap
sheet.save(out); print(out, sheet.size)
