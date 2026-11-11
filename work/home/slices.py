# python3 slices.py FULL.png OUTPREFIX SLICE_H COLS : cut a tall full-page shot into columns laid side by side, several per sheet
import sys
from PIL import Image
full, prefix, sh, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(full).convert('RGB')
W, H = im.size
parts = [im.crop((0, y, W, min(y + sh, H))) for y in range(0, H, sh)]
n = 0
for i in range(0, len(parts), cols):
    grp = parts[i:i + cols]
    sheet = Image.new('RGB', (W * len(grp) + 14 * (len(grp) - 1), sh), (110, 110, 110))
    for j, p in enumerate(grp):
        sheet.paste(p, (j * (W + 14), 0))
    n += 1
    f = f'{prefix}-{n:02d}.png'
    sheet.save(f); print(f, sheet.size)
