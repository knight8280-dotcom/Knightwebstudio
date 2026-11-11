#!/usr/bin/env python3
"""Write the shared header, footer, sticky phone bar and first-paint snippet into the pages.

    python3 tools/sync_chrome.py                      every page
    python3 tools/sync_chrome.py faq/index.html ...   only the pages named
    python3 tools/sync_chrome.py --check              change nothing; exit 1 if any page has drifted

The site has no include system, so the chrome is copied into every page and
has to stay identical. The one true copy lives in tools/chrome/ (the files end
in .inc so that nothing in there is published as a page):

    topbar.inc         skip link and the top strip (city, tap-to-call number)
    header.inc         the standard header with the menu
    header-start.inc   /start/: no menu on purpose, one booking button
    header-bare.inc    404: brand only (that page loads no script)
    footer.inc         the standard footer
    footer-start.inc   /start/: one line of contact details and three links
    footer-bare.inc    404: the same, without the year
    skyline.inc        the Baton Rouge skyline that tops every footer
    phone-bar.inc      the sticky Call + booking bar for phones and tablets
    head-script.inc    the first-paint snippet in every page's <head>: theme, the .js class, the crest's one-time build

{{topbar}} and {{skyline}} inside a partial are replaced by those files, so
they too exist once. PAGES below says which page gets which variant, its
data-page slug and whether it carries the phone bar. This script sets
<body data-page>, keeps the right aria-current="page" in the menu, and refills
the art markers it writes (tools/art/build.py does the drawing). It leaves the
rest of each <head> (title, description, Open Graph, JSON-LD) and the <main> alone.
"""
import pathlib, re, sys

sys.dont_write_bytecode = True   # keep __pycache__ out of the published folder

ROOT = pathlib.Path(__file__).resolve().parents[1]
CHROME = ROOT / 'tools' / 'chrome'
sys.path.insert(0, str(ROOT / 'tools' / 'art'))

# page: (data-page slug, header, footer, phone bar?)
STANDARD, NO_BAR = ('header', 'footer', True), ('header', 'footer', False)
PAGES = {
    'index.html':                           ('home',) + STANDARD,
    'services/index.html':                  ('services',) + STANDARD,
    'consulting/index.html':                ('consulting',) + STANDARD,
    'work/index.html':                      ('work',) + STANDARD,
    'process/index.html':                   ('process',) + STANDARD,
    'pricing/index.html':                   ('pricing',) + STANDARD,
    'faq/index.html':                       ('faq',) + STANDARD,
    'about/index.html':                     ('about',) + STANDARD,
    'web-design-baton-rouge/index.html':    ('city',) + STANDARD,
    'web-design-gonzales/index.html':       ('city',) + STANDARD,
    'web-design-prairieville/index.html':   ('city',) + STANDARD,
    'web-design-denham-springs/index.html': ('city',) + STANDARD,
    # The form, the legal text and the payment form are the point of these pages: no bar over them
    'contact/index.html':                   ('contact',) + NO_BAR,
    'privacy/index.html':                   ('privacy',) + NO_BAR,
    'terms/index.html':                     ('terms',) + NO_BAR,
    'checkout/index.html':                  ('checkout',) + NO_BAR,
    'checkout/success/index.html':          ('checkout-success',) + NO_BAR,
    'start/index.html':                     ('start', 'header-start', 'footer-start', True),
    '404.html':                             ('notfound', 'header-bare', 'footer-bare', False),
}

BODY = re.compile(r'<body\b[^>]*>', re.I)
HEAD_BLOCK = re.compile(r'(<body\b[^>]*>)(.*?)(<main\b)', re.S | re.I)
FOOTER = re.compile(r'(?:<!-- =+ FOOTER =+ -->\s*)?<footer\b.*?</footer>', re.S | re.I)
BAR = re.compile(r'(?:<!--(?:(?!-->).)*?-->\s*)?<div class="mobile-cta".*?</div>\s*</div>\n?', re.S)
ART = re.compile(r'(<!-- art:([a-z0-9-]+) -->).*?(<!-- /art:\2 -->)', re.S)
# The one inline script in the <head> that is not data: it reads the saved theme
HEAD_SCRIPT = re.compile(r"<script>(?:(?!</script>).)*?localStorage\.getItem\('theme'\).*?</script>", re.S)


def partial(name):
    text = (CHROME / f'{name}.inc').read_text()
    for inner in ('topbar', 'skyline'):
        text = text.replace('{{%s}}\n' % inner, (CHROME / f'{inner}.inc').read_text())
    return text.strip('\n')


def slug(page):
    return PAGES[page][0]


def header(page):
    """The block between <body> and <main>, with this page's menu link marked current."""
    text = partial(PAGES[page][1])
    url = '/' + page[:-len('index.html')]
    link = f'<li><a href="{url}">'
    if url != '/' and link in text:
        text = text.replace(link, f'<li><a href="{url}" aria-current="page">', 1)
    return text


def footer(page):
    return partial(PAGES[page][2])


def phone_bar(page):
    return partial('phone-bar') if PAGES[page][3] else ''


def head_script():
    return '<script>\n' + (CHROME / 'head-script.inc').read_text().strip('\n') + '\n</script>'


def apply(html, page):
    """Return html with the canonical chrome for this page (art markers left empty)."""
    if not HEAD_BLOCK.search(html) or not re.search(r'</main>', html, re.I):
        raise ValueError(f'{page}: needs <body>, <main> and </main>')
    head, sep, body = html.partition('</head>')
    if not sep or not HEAD_SCRIPT.search(head):
        raise ValueError(f'{page}: no first-paint script in its <head> (the one that reads localStorage "theme")')
    html = HEAD_SCRIPT.sub(lambda m: head_script(), head, count=1) + sep + body
    html = HEAD_BLOCK.sub(lambda m: f'<body data-page="{slug(page)}">\n{header(page)}\n\n{m.group(3)}', html, count=1)
    head, rest = re.split(r'(?<=</main>)', html, maxsplit=1, flags=re.I)
    rest = BAR.sub('', rest, count=1)
    if FOOTER.search(rest):
        rest = FOOTER.sub(lambda m: '\x00', rest, count=1)
    else:
        rest = '\x00\n' + rest.lstrip('\n')
    bar = phone_bar(page)
    rest = rest.replace('\x00', (bar + '\n\n' if bar else '') + footer(page), 1)
    return head + '\n\n' + rest.lstrip('\n')


def _norm(html):
    return re.sub(r'\s+', ' ', ART.sub(r'\1\3', html)).strip()


def main():
    args = sys.argv[1:]
    if any(a.startswith('-') and a != '--check' for a in args):   # --help, or a mistyped flag: explain and write nothing
        sys.exit(__doc__)
    check = '--check' in args
    only = [a.lstrip('./') for a in args if not a.startswith('-')]
    unknown = [p for p in only if p not in PAGES]
    if unknown:
        sys.exit(f'not a page of this site: {", ".join(unknown)}')
    import build  # tools/art/build.py: fills the art markers
    drifted = []
    for page in only or PAGES:
        path = ROOT / page
        old = path.read_text()
        try:
            new = apply(old, page)
        except ValueError as err:
            sys.exit(str(err))
        if _norm(new) == _norm(old):
            continue
        drifted.append(page)
        if not check:
            path.write_text(build.fill(new, page))
            print('synced', page)
    if check:
        for page in drifted:
            print('DRIFT ', page)
        print(f'{len(drifted)} of {len(only or PAGES)} page(s) differ from tools/chrome/' if drifted
              else f'chrome is in step on all {len(only or PAGES)} page(s)')
        sys.exit(1 if drifted else 0)
    print(f'{len(drifted)} page(s) updated' if drifted else 'nothing to do: chrome is already in step')


if __name__ == '__main__':
    main()
