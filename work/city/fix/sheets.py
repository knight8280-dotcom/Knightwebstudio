#!/usr/bin/env python3
"""Contact sheets from shoot.js output: one image per page and mode, in cs/."""
import glob, math, os, re, sys
from PIL import Image
src = sys.argv[1]; out = sys.argv[2]; os.makedirs(out, exist_ok=True)
groups = {}
for f in sorted(glob.glob(src + '/*.png')):
    m = re.match(r'(.*)__(\d+|sheet\d+)\.png$', os.path.basename(f))
    if m: groups.setdefault(m.group(1), []).append(f)
for key, files in groups.items():
    ims = [Image.open(f) for f in files]
    if 'sheet' in files[0]:                       # phone sheets: stack them
        W = max(i.width for i in ims); H = sum(i.height for i in ims) + 12 * (len(ims) - 1)
        sheet = Image.new('RGB', (W, H), '#888'); y = 0
        for i in ims: sheet.paste(i, (0, y)); y += i.height + 12
        s = min(1, 1950 / H)
    else:
        cols = 4 if ims[0].width < 1000 else 3
        rows = math.ceil(len(ims) / cols); w, h = ims[0].size
        sheet = Image.new('RGB', (cols * w + 16 * (cols - 1), rows * h + 16 * (rows - 1)), '#888')
        for n, i in enumerate(ims): sheet.paste(i, ((n % cols) * (w + 16), (n // cols) * (h + 16)))
        s = min(1, 1950 / sheet.width)
    sheet = sheet.resize((int(sheet.width * s), int(sheet.height * s)), Image.LANCZOS)
    sheet.save(f'{out}/{key}.png')
print(len(groups), 'sheets in', out)
