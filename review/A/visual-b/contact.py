import sys
from PIL import Image
# contact.py OUT SCALE COLS file...
out, scale, cols = sys.argv[1], float(sys.argv[2]), int(sys.argv[3])
ims = []
for f in sys.argv[4:]:
    im = Image.open(f); ims.append(im.resize((int(im.width*scale), int(im.height*scale)), Image.LANCZOS))
w = max(i.width for i in ims); h = max(i.height for i in ims); gap = 10
rows = (len(ims)+cols-1)//cols
s = Image.new('RGB', (cols*w+(cols-1)*gap, rows*h+(rows-1)*gap), (128,128,128))
for j, i in enumerate(ims): s.paste(i, ((j%cols)*(w+gap), (j//cols)*(h+gap)))
s.save(out); print(out, s.size)
