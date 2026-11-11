#!/usr/bin/env python3
# sheet.py OUT.png y0 y1 img1 [img2 ...]   crops the same vertical band from each full-page shot and sets them side by side
import sys
from PIL import Image, ImageDraw
out, y0, y1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); paths = sys.argv[4:]
ims = [Image.open(p).convert('RGB') for p in paths]
crops = [im.crop((0, min(y0, im.height), im.width, min(y1, im.height))) for im in ims]
gap = 12; W = sum(c.width for c in crops) + gap * (len(crops) - 1); H = max(c.height for c in crops) + 22
sheet = Image.new('RGB', (W, H), (255, 0, 255)); d = ImageDraw.Draw(sheet); x = 0
for p, c in zip(paths, crops):
    sheet.paste(c, (x, 22)); d.rectangle((x, 0, x + c.width, 21), fill=(20, 20, 20)); d.text((x + 4, 5), '/'.join(p.split('/')[-2:]) + f'  y{y0}-{y1}', fill=(255, 255, 255)); x += c.width + gap
sheet.save(out)
