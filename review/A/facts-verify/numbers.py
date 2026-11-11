#!/usr/bin/env python3
"""Per page: numeric tokens (with a little context) present in the new body text but not the baseline's, and vice versa."""
import re, sys
sys.path.insert(0, '.')
from blocks import blocks, BASE, NEW
PAGES = ['index.html','services/index.html','consulting/index.html','work/index.html','process/index.html','pricing/index.html','faq/index.html','contact/index.html','about/index.html','start/index.html','web-design-baton-rouge/index.html','web-design-denham-springs/index.html','web-design-gonzales/index.html','web-design-prairieville/index.html','privacy/index.html','terms/index.html','checkout/index.html','checkout/success/index.html','404.html']
TOK = re.compile(r'\$?\d[\d,]*(?:\.\d+)?%?(?:/mo(?:nth)?)?')
WORDNUM = re.compile(r'\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen|thirty|sixty|ninety|half|twice|double)\b', re.I)
def toks(text):
    d = {}
    for m in TOK.finditer(text):
        t = m.group(0).rstrip(',')
        d.setdefault(t, []).append(text[max(0, m.start()-45): m.end()+45])
    return d
for p in PAGES:
    try:
        b = ' | '.join(blocks(BASE + p)); n = ' | '.join(blocks(NEW + p))
    except FileNotFoundError as e:
        print('MISSING', p, e); continue
    tb, tn = toks(b), toks(n)
    new = sorted(set(tn) - set(tb)); gone = sorted(set(tb) - set(tn))
    print(f'## {p}: new numeric tokens {len(new)}, gone {len(gone)}')
    for t in new: print(f'   NEW  {t:10} … {tn[t][0]!r}')
    for t in gone: print(f'   GONE {t:10} … {tb[t][0]!r}')
