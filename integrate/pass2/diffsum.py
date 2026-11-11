"""diffsum.py DIR: for each differing combination in DIR/report.json, the rows (y bands) that differ, read from the diff sheet."""
import json, sys, pathlib
from PIL import Image
d = pathlib.Path(sys.argv[1])
rep = json.loads((d / 'report.json').read_text())
same = [k for k, v in rep.items() if not v.get('error') and v['differingPixels'] == 0]
print(len(rep), 'combinations;', len(same), 'identical;', len(rep) - len(same), 'differ')
for k, v in rep.items():
    if v.get('error'): print('ERROR', k, v['error'][:100]); continue
    if not v['differingPixels']: continue
    f = d / (k + '__diff.png')
    im = Image.open(f); W = (im.width - 32) // 3
    red = im.crop((2 * W + 32, 0, im.width, im.height)).convert('RGB').split()[1].point(lambda x: 255 if x < 100 else 0)
    # y bands
    rows = [red.crop((0, y, W, y + 1)).getbbox() is not None for y in range(red.height)]
    bands, s = [], None
    for y, on in enumerate(rows + [False]):
        if on and s is None: s = y
        if not on and s is not None:
            if bands and s - bands[-1][1] < 24: bands[-1][1] = y
            else: bands.append([s, y])
            s = None
    desc = ', '.join(f'{a}-{b}' for a, b in bands[:8]) + (' …' if len(bands) > 8 else '')
    print(f"{k:44s} hA {v['heightA']:6d} hB {v['heightB']:6d} px {v['differingPixels']:8d}  bands({len(bands)}): {desc}")
