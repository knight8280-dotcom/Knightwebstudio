#!/usr/bin/env python3
# cols.py IN.png OUT_PREFIX [chunk=1500] [scale=0.6] [maxcols=6]   a long phone page as columns, several sheets if needed
import sys
from PIL import Image, ImageDraw
src, outp = sys.argv[1], sys.argv[2]; chunk = int(sys.argv[3]) if len(sys.argv) > 3 else 1500; sc = float(sys.argv[4]) if len(sys.argv) > 4 else 0.6; maxc = int(sys.argv[5]) if len(sys.argv) > 5 else 6
im = Image.open(src).convert('RGB'); n = (im.height + chunk - 1) // chunk
parts = [im.crop((0, i * chunk, im.width, min((i + 1) * chunk, im.height))) for i in range(n)]
parts = [p.resize((int(p.width * sc), max(1, int(p.height * sc))), Image.LANCZOS) for p in parts]
for s in range(0, n, maxc):
    grp = parts[s:s + maxc]; gap = 8; W = sum(p.width for p in grp) + gap * (len(grp) - 1); H = int(chunk * sc) + 16
    sheet = Image.new('RGB', (W, H), (255, 0, 255)); d = ImageDraw.Draw(sheet); x = 0
    for k, p in enumerate(grp):
        sheet.paste(p, (x, 16)); d.rectangle((x, 0, x + p.width, 15), fill=(20, 20, 20)); d.text((x + 3, 2), f'y{(s + k) * chunk}', fill=(255, 255, 255)); x += p.width + gap
    out = f'{outp}_{s // maxc + 1}.png'; sheet.save(out); print(out, sheet.size)
