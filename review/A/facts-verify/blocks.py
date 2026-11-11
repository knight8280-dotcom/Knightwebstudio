#!/usr/bin/env python3
"""Independent block-level text comparison: baseline vs new.
For every block-level text unit (p, li, h1-h6, dt, dd, summary, td, th, figcaption, label, a.btn, option)
in the baseline <body>, is the same text present verbatim (whitespace/dash-normalised) in the new page's body text?
Usage: blocks.py PAGE [--all]"""
import sys, re, html
from html.parser import HTMLParser

BASE = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline/'
NEW = '/home/user/Knightwebstudio/'
BLOCK = {'p','li','h1','h2','h3','h4','h5','h6','dt','dd','summary','td','th','figcaption','label','option','blockquote','address','div','section','header','footer','main','nav','ul','ol','dl','table','tr','form','fieldset','legend','details','article','aside','figure','button','caption','thead','tbody','br','hr'}
SKIP = {'script','style','svg','noscript','template'}
VOID = {'br','hr','img','input','meta','link','wbr','source','area','base','col','embed','track'}

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0; self.inbody = False; self.out = []; self.buf = []
    def flush(self):
        t = ''.join(self.buf); self.buf = []
        t = norm(t)
        if t: self.out.append(t)
    def handle_starttag(self, tag, attrs):
        if tag == 'body': self.inbody = True
        if tag in SKIP: self.skip += 1; return
        if tag in BLOCK: self.flush()
    def handle_endtag(self, tag):
        if tag in SKIP: self.skip = max(0, self.skip - 1); return
        if tag in BLOCK: self.flush()
    def handle_data(self, d):
        if self.inbody and not self.skip: self.buf.append(d)

def norm(t):
    t = t.replace(' ', ' ').replace(' ', ' ').replace(' ', ' ').replace('​', '')
    t = t.replace('‑', '-')
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def blocks(path):
    p = P(); p.feed(open(path, encoding='utf-8').read()); p.flush(); return p.out

def loose(t):
    # for "is it there at all": drop spaces around punctuation differences
    return re.sub(r'\s+', ' ', t)

if __name__ == '__main__':
    page = sys.argv[1]
    b = blocks(BASE + page); n = blocks(NEW + page)
    ntext = ' '.join(n)
    nset = set(n)
    miss = [x for x in b if x not in nset]
    print(f'## {page}: baseline blocks {len(b)}, new blocks {len(n)}, baseline blocks not found verbatim as a block: {len(miss)}')
    for x in miss:
        tag = 'IN-TEXT ' if x in ntext else 'ABSENT  '
        print('  ', tag, x[:400])
    if '--new' in sys.argv:
        bset = set(b); btext = ' '.join(b)
        print('  -- new blocks not in baseline:')
        for x in n:
            if x not in bset:
                print('   ', ('IN-TEXT ' if x in btext else 'NEW     '), x[:400])
