# sheet.py OUT COLS SCALE [--crop x,y,w,h] img...   : a labelled contact sheet
import sys
from PIL import Image, ImageDraw
out, cols, scale = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
args = sys.argv[4:]; crop = None
if args[0] == '--crop': crop = tuple(int(v) for v in args[1].split(',')); args = args[2:]
ims = []
for f in args:
    im = Image.open(f).convert('RGB')
    if crop: im = im.crop((crop[0], crop[1], crop[0] + crop[2], min(im.height, crop[1] + crop[3])))
    im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    ims.append((f.split('/')[-1].replace('.png', ''), im))
gap = 10; lab = 16
w = max(im.width for _, im in ims); h = max(im.height for _, im in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols + 1) * gap, rows * (h + lab) + (rows + 1) * gap), (90, 90, 90))
d = ImageDraw.Draw(sheet)
for i, (name, im) in enumerate(ims):
    x = gap + (i % cols) * (w + gap); y = gap + (i // cols) * (h + lab + gap)
    d.text((x, y), name[:int(w / 6.2)], fill=(255, 255, 255)); sheet.paste(im, (x, y + lab))
sheet.save(out); print(out, sheet.size)
