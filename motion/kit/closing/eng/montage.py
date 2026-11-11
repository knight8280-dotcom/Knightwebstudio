import sys
from PIL import Image
out = sys.argv[1]; files = sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
scale = 2 if max(i.width for i in ims) < 500 else 1
ims = [i.resize((i.width*scale, i.height*scale), Image.NEAREST) for i in ims]
W = max(i.width for i in ims); H = sum(i.height for i in ims) + 6*(len(ims)-1)
m = Image.new('RGB', (W, H), (255, 0, 255)); y = 0
for i in ims: m.paste(i, (0, y)); y += i.height + 6
m.save(out)
