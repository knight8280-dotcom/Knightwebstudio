import sys, glob
from PIL import Image
# grid.py OUT scale cols file...
out, sc, cols = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]); files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
ims = [i.resize((int(i.width * sc), int(i.height * sc)), Image.LANCZOS) for i in ims]
gap = 10; rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
W = max(sum(i.width for i in r) + gap * (len(r) - 1) for r in rows); H = sum(max(i.height for i in r) for r in rows) + gap * (len(rows) - 1)
s = Image.new('RGB', (W, H), (90, 90, 90)); y = 0
for r in rows:
    x = 0
    for i in r: s.paste(i, (x, y)); x += i.width + gap
    y += max(i.height for i in r) + gap
s.save(out); print(out, s.size)
