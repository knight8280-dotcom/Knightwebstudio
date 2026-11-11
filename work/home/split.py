#!/usr/bin/env python3
"""split.py IN.png OUT.png N [scale] -> cut a tall image into N columns side by side"""
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); n = int(sys.argv[3]); sc = float(sys.argv[4]) if len(sys.argv) > 4 else 1
if sc != 1: im = im.resize((int(im.width*sc), int(im.height*sc)), Image.LANCZOS)
h = im.height; step = -(-h // n)
ims = [im.crop((0, i*step, im.width, min(h, (i+1)*step))) for i in range(n)]
W = sum(i.width for i in ims) + 10*(n-1)
s = Image.new('RGB', (W, step), (128,128,128)); x = 0
for i in ims: s.paste(i, (x, 0)); x += i.width + 10
s.save(sys.argv[2]); print(sys.argv[2], s.size)
