# Split a full-page screenshot into viewport tiles and lay them side by side (N per sheet).
import sys
from PIL import Image
src, tile_h, per = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
start = int(sys.argv[4]) if len(sys.argv) > 4 else 0
maxsheets = int(sys.argv[5]) if len(sys.argv) > 5 else 99
im = Image.open(src).convert('RGB'); W, H = im.size
tiles = [im.crop((0, y, W, min(y + tile_h, H))) for y in range(start, H, tile_h)]
out = []
for i in range(0, len(tiles), per):
    if i // per >= maxsheets: break
    group = tiles[i:i + per]
    sheet = Image.new('RGB', (W * len(group) + 8 * (len(group) - 1), tile_h), (255, 0, 255))
    for j, t in enumerate(group): sheet.paste(t, (j * (W + 8), 0))
    name = src.replace('.png', f'__s{i // per + 1}.png'); sheet.save(name); out.append(name)
print('\n'.join(out))
