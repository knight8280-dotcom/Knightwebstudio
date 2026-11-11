import sys
from PIL import Image
# sheet.py OUT crop_h scale name1 name2 ...  (from r2/)
out, ch, sc = sys.argv[1], int(sys.argv[2]), float(sys.argv[3]); names = sys.argv[4:]
ims = []
for n in names:
    im = Image.open(f'r2/{n}.png').convert('RGB'); im = im.crop((0, 0, im.width, min(ch, im.height)))
    im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS); ims.append(im)
gap = 16; W = sum(i.width for i in ims) + gap * (len(ims) - 1); H = max(i.height for i in ims)
sheet = Image.new('RGB', (W, H), (128, 128, 128)); x = 0
for i in ims: sheet.paste(i, (x, 0)); x += i.width + gap
sheet.save(out); print(out, sheet.size)
