# stack.py OUT img... : stack images top to bottom
import sys
from PIL import Image
ims = [Image.open(f).convert('RGB') for f in sys.argv[2:]]
w = max(i.width for i in ims); h = sum(i.height for i in ims) + 12 * (len(ims) - 1)
s = Image.new('RGB', (w, h), (60, 60, 60)); y = 0
for i in ims: s.paste(i, (0, y)); y += i.height + 12
s.save(sys.argv[1]); print(sys.argv[1], s.size)
