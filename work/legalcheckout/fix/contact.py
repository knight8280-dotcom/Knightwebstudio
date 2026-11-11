import sys, glob, os
from PIL import Image
# contact.py PREFIX scale OUT : puts every stop of shots/PREFIX__*.png side by side
prefix, sc, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
files = sorted(glob.glob(f'shots/{prefix}__*.png'))
ims = [Image.open(f).convert('RGB') for f in files]
ims = [i.resize((int(i.width * sc), int(i.height * sc)), Image.LANCZOS) for i in ims]
gap = 12; W = sum(i.width for i in ims) + gap * (len(ims) - 1); H = max(i.height for i in ims)
s = Image.new('RGB', (W, H), (90, 90, 90)); x = 0
for i in ims: s.paste(i, (x, 0)); x += i.width + gap
s.save(out); print(out, s.size, len(files))
