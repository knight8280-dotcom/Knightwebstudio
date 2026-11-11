#!/usr/bin/env python3
"""Check that the pricing page's two copies of the packages agree.

    python3 tools/check_pricing.py        exit 1 and say what differs, if anything does

/pricing/ carries the four website packages twice: the spec table (shown from 760px, and on phones with script off)
and the folder stack (shown on phones). Only one is ever on screen, but a price, payment line, inclusion, support
period or button changed in one must be changed in the other. This compares them row by row: every piece of text in
a table row must be in its folder, and the folder's links must be the row's links (same addresses, same words, same
data-booking). It writes nothing.
"""
import html, pathlib, re, sys

sys.dont_write_bytecode = True
page = (pathlib.Path(__file__).resolve().parents[1] / 'pricing' / 'index.html').read_text()
table = page[page.index('<table class="spec"'):]
table = table[:table.index('</table>')]
stack = page[page.index('kws-folders--stack'):]
stack = stack[:stack.index('<table class="spec"')]

text = lambda h: ' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', h)).split())
links = lambda h: [(a, text(t)) for a, t in re.findall(r'<a\b([^>]*)>(.*?)</a>', h, re.S)]
norm = lambda attrs: sorted(re.sub(r'\bclass="[^"]*"', '', attrs).split())

rows = re.findall(r'<tr role="row"[^>]*>\s*<th role="rowheader"[^>]*>(.*?)</th>(.*?)</tr>', table, re.S)
folders = dict(re.findall(r'<article class="kws-folder" id="pkg-([a-z]+)">(.*?)</article>', stack, re.S))
problems = []
if len(rows) != len(folders):
    problems.append(f'{len(rows)} table rows but {len(folders)} folders')
for head, cells in rows:
    name = text(re.sub(r'<span class="popular">.*?</span>', '', head, flags=re.S))
    slug = re.sub(r'[^a-z]', '', name.lower())
    folder = folders.get(slug)
    if folder is None:
        problems.append(f'{name}: no folder #pkg-{slug}')
        continue
    ftext = text(folder)
    for cell in re.findall(r'<td role="cell"[^>]*>(.*?)</td>', cells, re.S):
        cell = re.sub(r'<span class="cell-label"[^>]*>.*?</span>', '', cell, flags=re.S)
        for piece in re.split(r'<(?:li|small|br)\b[^>]*>', re.sub(r'<a\b.*?</a>', '', cell, flags=re.S)):
            piece = text(piece)
            if piece and piece not in ftext:
                problems.append(f'{name}: "{piece}" is in the table but not in its folder')
    if 'Most popular' in head and 'Most popular' not in ftext:
        problems.append(f'{name}: "Most popular" is in the table but not in its folder')
    tl, fl = links(cells), links(folder)
    if [(norm(a), t) for a, t in tl] != [(norm(a), t) for a, t in fl]:
        problems.append(f'{name}: the links differ\n    table:  {tl}\n    folder: {fl}')

print('\n'.join(problems) if problems else f'pricing: the table and the phone folders agree ({len(rows)} packages)')
sys.exit(1 if problems else 0)
