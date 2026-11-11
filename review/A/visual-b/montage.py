import sys, os, glob, re
from PIL import Image
# usage: montage.py SRC_DIR OUT_DIR COLS ROWS [filter_regex]
src, out, cols, rows = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
flt = sys.argv[5] if len(sys.argv) > 5 else '.'
os.makedirs(out, exist_ok=True)
groups = {}
for f in sorted(glob.glob(os.path.join(src, '*.png'))):
    b = os.path.basename(f)
    if not re.search(flt, b): continue
    m = re.match(r'(.+?)__(\d+|sheet\d+)\.png$', b)
    if not m: continue
    groups.setdefault(m.group(1), []).append(f)
n = cols * rows
for key, files in groups.items():
    for i in range(0, len(files), n):
        ims = [Image.open(f) for f in files[i:i+n]]
        w = max(im.width for im in ims); h = max(im.height for im in ims); gap = 12
        c = min(cols, len(ims)); r = (len(ims) + cols - 1) // cols
        sheet = Image.new('RGB', (c*w + (c-1)*gap, r*h + (r-1)*gap), (128, 128, 128))
        for j, im in enumerate(ims):
            sheet.paste(im, ((j % cols)*(w+gap), (j // cols)*(h+gap)))
        p = os.path.join(out, f"{key}__m{i//n+1}.png")
        sheet.save(p)
        print(p, sheet.size)
