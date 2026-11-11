#!/usr/bin/env python3
"""Assemble kit/closing/demo.html (and portable.html) from demo.src.html / portable.src.html and the kit's own partials,
the way tools/sync_chrome.py would: {{skyline}} is replaced by skyline.inc and the crest marker is filled with the
site's footer crest. Nothing in the repository is written."""
import pathlib, re, sys
HERE = pathlib.Path(__file__).resolve().parent
KIT = HERE.parent / 'kit' / 'closing'
REPO = pathlib.Path('/home/user/Knightwebstudio')

def partial(name, sample=False):
    t = (KIT / f'{name}.inc').read_text()
    t = t.replace('{{skyline}}\n', (KIT / 'skyline.inc').read_text())
    if sample:   # a second copy on one page: no duplicate id, not a landmark
        t = t.replace(' id="year"', '').replace('<footer class="site-footer ', '<div class="').replace('</footer>', '</div>')
    return t.rstrip('\n')

crest = re.search(r'<!-- art:crest-footer -->(.*?)<!-- /art:crest-footer -->', (REPO / 'pricing/index.html').read_text(), re.S).group(1)
head = (REPO / 'tools/chrome/head-script.inc').read_text().rstrip('\n')

def build(src, dest):
    t = (HERE / src).read_text()
    t = t.replace('{{HEAD_SCRIPT}}', head)
    t = t.replace('{{FOOTER}}', partial('footer'))
    t = t.replace('{{SKYLINE}}\n', (KIT / 'skyline.inc').read_text())
    t = t.replace('{{FOOTER_SAMPLE}}', partial('footer', True))
    t = t.replace('{{FOOTER_START}}', partial('footer-start', True))
    t = t.replace('{{FOOTER_BARE}}', partial('footer-bare', True))
    n = t.count('<!-- art:crest-footer --><!-- /art:crest-footer -->')
    # only the first crest keeps its gradient ids; later copies get a suffix so ids stay unique
    def fill(m, c=[0]):
        c[0] += 1
        art = crest if c[0] == 1 else re.sub(r'\bcf-', f'cf{c[0]}-', crest)
        return '<!-- art:crest-footer -->' + art + '<!-- /art:crest-footer -->'
    t = re.sub(r'<!-- art:crest-footer --><!-- /art:crest-footer -->', fill, t)
    (KIT / dest).write_text(t)
    print(f'built {dest}: {len(t.encode())} bytes, {n} crest(s)')

for pair in (('demo.src.html', 'demo.html'), ('portable.src.html', 'portable.html')):
    if (HERE / pair[0]).exists():
        build(*pair)
