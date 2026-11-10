"""Write the artwork from emblems.py into the site.

    python3 tools/art/build.py                       every page, plus logo.svg and crest.svg
    python3 tools/art/build.py pricing/index.html    only the pages named (nothing else is written)

1. Every  <!-- art:NAME -->…<!-- /art:NAME -->  pair in the HTML pages is
   refilled with the matching drawing below. Edit the drawings in emblems.py,
   never between the markers: anything there is overwritten.
2. With no arguments, assets/img/logo.svg (the mark) and assets/img/crest.svg
   (full crest) are also rewritten as standalone files.

Markers: crest-header, crest-footer, crest-card (the business card), seal
(the round "Fixed prices" seal), scene-street (the shop front), scene-notfound
(the same shop, its sign reading PAGE NOT FOUND), scene-bench (the workbench).

Icons and the link-preview image are rasterised separately by render.js,
which needs Playwright:  node tools/art/render.js
"""
import pathlib, re, sys

sys.dont_write_bytecode = True   # keep __pycache__ out of the published folder

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import emblems as e  # noqa: E402

PAGES = ['index.html', '404.html'] + [f'{d}/index.html' for d in
                                      ('services', 'consulting', 'work', 'process', 'pricing', 'faq', 'contact', 'privacy', 'terms', 'start', 'about',
                                       'checkout', 'checkout/success',
                                       'web-design-baton-rouge', 'web-design-gonzales',
                                       'web-design-prairieville', 'web-design-denham-springs')]

# The crest is decorative wherever it sits beside the name (header, footer, card).
ART = {
    'crest-header':   lambda: e.charger('ch', 'crest'),
    'crest-footer':   lambda: e.charger('cf', 'crest'),
    'crest-card':     lambda: e.charger('cc', 'crest'),
    'seal':           lambda: e.seal('sl'),
    'scene-street':   lambda: e.street('st'),
    'scene-notfound': lambda: e.street('st', sign='PAGE NOT FOUND', title='Drawing of a brick shop front. '
                                       'The painted sign above its striped awning reads: page not found.'),
    'scene-bench':    lambda: e.bench('bn'),
}
# Retired with the 2026 redesign. Remove the marker pair from the page.
RETIRED = re.compile(r'^(shards|full-crest|hero-crest|piece-[a-z]+)$')

MARKER = re.compile(r'(<!-- art:([a-z0-9-]+) -->)(.*?)(<!-- /art:\2 -->)', re.S)


def fill(html, page):
    def sub(m):
        name = m.group(2)
        if RETIRED.match(name):
            sys.exit(f'{page}: the art marker "{name}" was retired; delete the marker pair from the page')
        if name not in ART:
            sys.exit(f'{page}: unknown art marker "{name}" (known: {", ".join(ART)})')
        return m.group(1) + ART[name]() + m.group(4)
    return MARKER.sub(sub, html)


def main():
    only = [a.lstrip('./') for a in sys.argv[1:]]
    unknown = [p for p in only if p not in PAGES]
    if unknown:
        sys.exit(f'not a page of this site: {", ".join(unknown)}')
    changed = 0
    for page in only or PAGES:
        p = ROOT / page
        old = p.read_text()
        new = fill(old, page)
        if new != old:
            p.write_text(new)
            changed += 1
            print('updated', page)
    if only:
        print(f'{changed} page(s) updated')
        return
    xmlns = '<svg xmlns="http://www.w3.org/2000/svg" '
    (ROOT / 'assets/img/logo.svg').write_text(
        e.charger('logo', 'crest', 'Knight Web Studio').replace('<svg ', xmlns, 1) + '\n')
    (ROOT / 'assets/img/crest.svg').write_text(
        e.full_crest('crest').replace('<svg ', xmlns, 1) + '\n')
    print(f'{changed} page(s) updated; logo.svg and crest.svg written')


if __name__ == '__main__':
    main()
