import sys, glob, os
from PIL import Image
prefix, out = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(prefix + '-*.png'))
names = []
for f in files:
    n = os.path.basename(f)[len(os.path.basename(prefix)) + 1:].rsplit('-', 1)[0]
    if n not in names: names.append(n)
rows = []
for n in names:
    ims = [Image.open(f) for f in sorted(glob.glob(f'{prefix}-{n}-*.png'))]
    rows.append(ims)
W = max(sum(i.width for i in r) + 8 * (len(r) - 1) for r in rows); H = sum(max(i.height for i in r) for r in rows) + 8 * (len(rows) - 1)
sheet = Image.new('RGB', (W, H), (128, 128, 128)); y = 0
for r in rows:
    x = 0
    for i in r: sheet.paste(i, (x, y)); x += i.width + 8
    y += max(i.height for i in r) + 8
sheet.save(out); print(out, sheet.size)
