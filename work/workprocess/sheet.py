# python3 sheet.py IN.png OUT.png [cols] [y0] [y1]  : cut a tall full-page shot into side-by-side columns
import sys
from PIL import Image
im = Image.open(sys.argv[1]); cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
y0 = int(sys.argv[4]) if len(sys.argv) > 4 else 0; y1 = int(sys.argv[5]) if len(sys.argv) > 5 else im.height
im = im.crop((0, y0, im.width, y1)); h = -(-im.height // cols); gap = 16
out = Image.new('RGB', (cols * im.width + (cols - 1) * gap, h), (120, 120, 120))
for i in range(cols): out.paste(im.crop((0, i * h, im.width, min(im.height, (i + 1) * h))), (i * (im.width + gap), 0))
out.save(sys.argv[2]); print(out.size)
