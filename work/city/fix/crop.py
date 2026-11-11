#!/usr/bin/env python3
"""crop.py IMG Y0 Y1 [OUT] [X0 X1] : cut a band out of a full-page screenshot"""
import sys
from PIL import Image
im = Image.open(sys.argv[1]); y0, y1 = int(sys.argv[2]), int(sys.argv[3])
out = sys.argv[4] if len(sys.argv) > 4 else sys.argv[1].replace('.png', f'-{y0}.png')
x0, x1 = (int(sys.argv[5]), int(sys.argv[6])) if len(sys.argv) > 6 else (0, im.width)
im.crop((x0, y0, x1, min(y1, im.height))).save(out); print(out)
