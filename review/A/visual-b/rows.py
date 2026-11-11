import sys, glob, os
from PIL import Image
# rows.py OUT SCALE MAXCOLS dir page [page...]   (each page = one row of its stops; skips last N footer-only stops if 'page:K' gives max stops)
out, scale, maxcols, d = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
rows = []
for spec in sys.argv[5:]:
    page, _, k = spec.partition(':')
    files = sorted(glob.glob(os.path.join(d, page + '__[0-9][0-9].png')))
    if k: files = files[:int(k)]
    for i in range(0, len(files), maxcols):
        rows.append([Image.open(f) for f in files[i:i+maxcols]])
gap = 10
rs = lambda im: im.resize((int(im.width*scale), int(im.height*scale)), Image.LANCZOS)
rows = [[rs(i) for i in r] for r in rows]
W = max(sum(i.width for i in r) + gap*(len(r)-1) for r in rows)
H = sum(max(i.height for i in r) for r in rows) + gap*(len(rows)-1)
s = Image.new('RGB', (W, H), (128,128,128)); y = 0
for r in rows:
    x = 0
    for i in r: s.paste(i, (x, y)); x += i.width + gap
    y += max(i.height for i in r) + gap
s.save(out); print(out, s.size)
