"""Write the artwork from emblems.py into the site.

    python3 tools/art/build.py      (from the repository root)

1. Every  <!-- art:NAME -->…<!-- /art:NAME -->  pair in the HTML pages is
   refilled with the matching drawing below. Edit the drawings in emblems.py,
   never between the markers: anything there is overwritten.
2. assets/img/logo.svg (the mark) and assets/img/crest.svg (full crest) are
   rewritten as standalone files.

Icons and the link-preview image are rasterised separately by render.js,
which needs Playwright:  node tools/art/render.js
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import emblems as e  # noqa: E402

PAGES = ['index.html', '404.html'] + [f'{d}/index.html' for d in
                                      ('services', 'work', 'process', 'pricing', 'faq', 'contact', 'privacy', 'terms', 'start', 'about',
                                       'checkout', 'checkout/success',
                                       'web-design-baton-rouge', 'web-design-gonzales',
                                       'web-design-prairieville', 'web-design-denham-springs')]

# Accessible name for the crest on the pages. The business name is one word;
# the lettering drawn inside the crest artwork itself is left as it is.
CREST_LABEL = 'KnightWebstudio crest'

ART = {
    'crest-header': lambda: e.charger('ch', 'crest brand-crest'),
    'crest-footer': lambda: e.charger('cf', 'crest footer-crest'),
    'full-crest':   lambda: e.full_crest('fc', 'crest-full', label=CREST_LABEL),
    # landing-page hero: .play from the start, so it builds as the page opens
    'hero-crest':   lambda: e.full_crest('hc', 'crest-full play', label=CREST_LABEL),
    'shards':       e.shards,
}
for name in ('rook', 'knight', 'pawn', 'king', 'bishop', 'queen'):
    ART[f'piece-{name}'] = (lambda n=name: e.piece(n, f'pc-{n}'))

MARKER = re.compile(r'(<!-- art:([a-z-]+) -->)(.*?)(<!-- /art:\2 -->)', re.S)


def fill(html, page):
    def sub(m):
        name = m.group(2)
        if name not in ART:
            sys.exit(f'{page}: unknown art marker "{name}"')
        return m.group(1) + ART[name]() + m.group(4)
    return MARKER.sub(sub, html)


def main():
    changed = 0
    for page in PAGES:
        p = ROOT / page
        old = p.read_text()
        new = fill(old, page)
        if new != old:
            p.write_text(new)
            changed += 1
            print('updated', page)
    xmlns = '<svg xmlns="http://www.w3.org/2000/svg" '
    (ROOT / 'assets/img/logo.svg').write_text(
        e.charger('logo', 'crest', 'Knight Web Studio').replace('<svg ', xmlns, 1) + '\n')
    (ROOT / 'assets/img/crest.svg').write_text(
        e.full_crest('crest').replace('<svg ', xmlns, 1) + '\n')
    print(f'{changed} page(s) updated; logo.svg and crest.svg written')


if __name__ == '__main__':
    main()
