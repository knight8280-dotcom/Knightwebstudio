#!/usr/bin/env python3
"""Static proof: the folded stylesheet, with comments and blank lines removed, is exactly the shared sheet
followed by the sixteen page sheets in block order. Also: each block holds its file byte for byte."""
import pathlib, re, hashlib
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
PRE, REPO = R / 'prefold', pathlib.Path('/home/user/Knightwebstudio')
new = (REPO / 'assets/css/styles.css').read_text(encoding='utf-8')
order = re.findall(r'^/\* == \d\d [^\n]*?\[data-page="([a-z-]+)"\][^\n]* == \*/$', new, flags=re.M)
print('block order:', ' '.join(order))
assert len(order) == 16 == len(set(order))
def bare(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    return '\n'.join(l.rstrip() for l in css.split('\n') if l.strip())
old = (PRE / 'assets/css/styles.css').read_text(encoding='utf-8')
expect = bare(old) + '\n' + '\n'.join(bare((PRE / 'assets/css/pages' / f'{s}.css').read_text(encoding='utf-8')) for s in order)
got = bare(new)
print('rules-only text identical to shared + pages in order:', got == expect, f'({len(got):,} characters)')
assert got == expect
# byte-for-byte blocks
titles = list(re.finditer(r'^/\* == \d\d [^\n]*?\[data-page="([a-z-]+)"\][^\n]* == \*/\n', new, flags=re.M))
for i, m in enumerate(titles):
    end = titles[i + 1].start() - 1 if i + 1 < len(titles) else len(new)   # the blank line before the next title
    block = new[m.end():end]
    src = (PRE / 'assets/css/pages' / f'{m.group(1)}.css').read_bytes()
    ok = block.encode('utf-8') == src
    print(f'  {m.group(1):18s} {len(src):6d} bytes  sha1 {hashlib.sha1(src).hexdigest()[:10]}  byte-identical: {ok}')
    assert ok
head_end = new.index('/* == 01 Fonts == */')
part_start = new.index('\n/* =====')
old_body = old[old.index('/* == 01 Fonts == */'):]
print('shared system byte-identical below the header comment:', new[head_end:part_start] == old_body)
assert new[head_end:part_start] == old_body
print('size:', len(new.encode('utf-8')), 'bytes =', round(len(new.encode('utf-8')) / 1024, 1), 'KiB; lines:', new.count('\n'))
print('comments balanced:', new.count('/*') == new.count('*/'), ' braces balanced:', bare(new).count('{') == bare(new).count('}'))
print('pages folder gone:', not (REPO / 'assets/css/pages').exists(), ' css files in repo:', [p.relative_to(REPO).as_posix() for p in REPO.rglob('*.css') if '.git' not in p.parts])
