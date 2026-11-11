import sys
from PIL import Image
# sheet.py in.png out_prefix strip_h cols [scale]
src, out, sh, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
im = Image.open(src).convert('RGB'); W, H = im.size
n = (H + sh - 1) // sh; k = 0
for s in range(0, n, cols):
    strips = [im.crop((0, i * sh, W, min(H, (i + 1) * sh))) for i in range(s, min(n, s + cols))]
    sheet = Image.new('RGB', (len(strips) * (W + 8), sh), (255, 0, 255))
    for j, st in enumerate(strips): sheet.paste(st, (j * (W + 8), 0))
    if scale != 1.0: sheet = sheet.resize((int(sheet.width * scale), int(sheet.height * scale)), Image.LANCZOS)
    k += 1; sheet.save(f"{out}_{k}.png"); print(f"{out}_{k}.png", sheet.size)
