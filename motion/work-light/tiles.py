import sys
from PIL import Image
src, prefix, th = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1000
im = Image.open(src); w, h = im.size; n = 0
for y in range(0, h, th):
    im.crop((0, y, w, min(h, y + th))).save(f'{prefix}-{n:02d}.png'); n += 1
print(w, h, n)
