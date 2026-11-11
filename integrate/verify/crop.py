#!/usr/bin/env python3
"""crop.py KEY Y0 Y1 [X0 X1] [--out NAME]: cut the same band from A, B (and the red diff) of a compare sheet."""
import sys
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
V = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/integrate/verify'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
key, y0, y1 = args[0], int(args[1]), int(args[2])
yb = None
for a_ in sys.argv:
    if a_.startswith("--yb="): yb = int(a_.split("=")[1])
cmpdir = 'cmp'
for a in sys.argv:
    if a.startswith('--dir='): cmpdir = a.split('=')[1]
im = Image.open(f'{V}/{cmpdir}/{key}__diff.png')
W = (im.width - 32) // 3
x0, x1 = (int(args[3]), int(args[4])) if len(args) >= 5 else (0, W)
y1 = min(y1, im.height)
yb0 = y0 if yb is None else yb
a = im.crop((x0, y0, x1, y1)); b = im.crop((W + 16 + x0, yb0, W + 16 + x1, yb0 + (y1 - y0))); d = im.crop((2 * W + 32 + x0, y0, 2 * W + 32 + x1, y1))
w, h = a.size
if w <= 500:
    sheet = Image.new('RGB', (w * 3 + 16, h), (128, 128, 128)); sheet.paste(a, (0, 0)); sheet.paste(b, (w + 8, 0)); sheet.paste(d, (2 * w + 16, 0))
else:
    sheet = Image.new('RGB', (w, h * 2 + 8), (255, 0, 255)); sheet.paste(a, (0, 0)); sheet.paste(b, (0, h + 8))
name = f'{V}/crops/{key}__{y0}-{y1}.png'
for a_ in sys.argv:
    if a_.startswith('--out='): name = f'{V}/crops/' + a_.split('=')[1]
sheet.save(name); print(name, sheet.size)
