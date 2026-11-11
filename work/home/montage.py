# python3 montage.py OUT.png img1 img2 ... [--h 800] : side-by-side sheet scaled to a common height
import sys
from PIL import Image
args = sys.argv[1:]
H = 800
if '--h' in args:
    i = args.index('--h'); H = int(args[i+1]); del args[i:i+2]
out, files = args[0], args[1:]
ims = []
for f in files:
    im = Image.open(f).convert('RGB')
    w = round(im.width * H / im.height)
    ims.append(im.resize((w, H), Image.LANCZOS))
W = sum(i.width for i in ims) + 12 * (len(ims) - 1)
sheet = Image.new('RGB', (W, H), (120, 120, 120))
x = 0
for im in ims:
    sheet.paste(im, (x, 0)); x += im.width + 12
sheet.save(out)
print(out, sheet.size)
