#!/usr/bin/env python3
"""The fold: one stylesheet for the whole site.

    python3 fold.py [--dry]

Reads the frozen pre-fold copy (never the repository's own, possibly already folded, files), so it can be
run again and always writes the same result:
  - assets/css/styles.css = the shared sheet, byte for byte below its header comment, with the contents
    list extended, followed by the "Pages" part: every assets/css/pages/<slug>.css, byte for byte, one
    titled block per page, in the order of PAGES in tools/sync_chrome.py;
  - every page loses its one <link> to a page stylesheet and nothing else.
It does not delete assets/css/pages/: that is a separate, deliberate step.
"""
import pathlib, re, sys

R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
PRE, REPO = R / 'prefold', pathlib.Path('/home/user/Knightwebstudio')
DRY = '--dry' in sys.argv

# slug, block title, where it applies. The order is PAGES in tools/sync_chrome.py (the site's own page order).
BLOCKS = [
    ('home',             'Home',             '/'),
    ('services',         'Services',         '/services/'),
    ('consulting',       'Consulting',       '/consulting/'),
    ('work',             'Work',             '/work/'),
    ('process',          'Process',          '/process/'),
    ('pricing',          'Pricing',          '/pricing/'),
    ('faq',              'FAQ',              '/faq/'),
    ('about',            'About',            '/about/'),
    ('city',             'City pages',       'the four /web-design-<town>/ pages'),
    ('contact',          'Contact',          '/contact/'),
    ('privacy',          'Privacy',          '/privacy/'),
    ('terms',            'Terms',            '/terms/'),
    ('checkout',         'Checkout',         '/checkout/'),
    ('checkout-success', 'Checkout success', '/checkout/success/'),
    ('start',            'Start',            '/start/, the landing page'),
    ('notfound',         'Not found',        '/404.html'),
]
FIRST = 19   # the shared system ends at section 18

OLD_HEAD = '''/* KnightWebstudio: the "Main Street" design system. One shared stylesheet; DESIGN.md is its handbook.
   Tokens first; one line per colour holds both themes: var(--L, day) var(--D, night). Tone scopes re-point them.
   Phone first; breakpoints 380, 600, 760, 980, 1100, 1280. Page-only rules: /assets/css/pages/<slug>.css. */
'''

shared = (PRE / 'assets/css/styles.css').read_text(encoding='utf-8')
assert shared.startswith(OLD_HEAD), 'the shared sheet does not start with the header this script knows'
body = shared[len(OLD_HEAD):]
assert body.startswith('\n/* == 01 Fonts == */\n') and body.endswith('}\n')
sections = re.findall(r'^/\* == (\d\d) (.+?) == \*/$', body, flags=re.M)
assert [n for n, _ in sections] == ['%02d' % i for i in range(1, FIRST)], sections

on_disk = sorted(p.stem for p in (PRE / 'assets/css/pages').glob('*.css'))
assert on_disk == sorted(s for s, _, _ in BLOCKS), 'page stylesheets on disk and BLOCKS differ'


def columns(items, per_row, indent):
    """Lay 'NN name' entries out in rows, as a contents list."""
    width = max(len(x) for x in items) + 3
    rows = [items[i:i + per_row] for i in range(0, len(items), per_row)]
    return '\n'.join((indent + ''.join(x.ljust(width) for x in row)).rstrip() for row in rows)


sys_items = [f'{n} {t}' for n, t in sections]
page_items = [f'{FIRST + i:02d} {title}' for i, (_, title, _) in enumerate(BLOCKS)]
new_head = f'''/* KnightWebstudio: the "Main Street" design system. The site's one stylesheet; DESIGN.md is its handbook.
   Tokens first; one line per colour holds both themes: var(--L, day) var(--D, night). Tone scopes re-point them.
   Phone first; breakpoints 380, 600, 760, 980, 1100, 1280.

   Contents
   The system, shared by every page:
{columns(sys_items, 3, '     ')}
   Pages, the page-only rules, one block per page, every selector scoped with [data-page="<slug>"]:
{columns(page_items, 4, '     ')} */
'''

part = f'''
/* ======================================================================================================
   PAGES
   Page-only rules: one block per page, in the order of PAGES in tools/sync_chrome.py.
   Every selector starts with [data-page="<slug>"] (the slug is on <body>), so no block can reach another
   page. This part stays last in the file: a page rule then wins over a shared rule of the same weight,
   as it did when each block was a file of its own, linked after this one.
   ====================================================================================================== */
'''
out = new_head + body + part
for i, (slug, title, where) in enumerate(BLOCKS):
    css = (PRE / 'assets/css/pages' / f'{slug}.css').read_text(encoding='utf-8')
    assert css.endswith('\n') and not css.endswith('\n\n') and '\r' not in css
    out += f'\n/* == {FIRST + i:02d} {title}: [data-page="{slug}"], {where} == */\n' + css

# ---- proof by construction: nothing but the header, the part divider and the block titles is new
lines_new = out.split('\n')
assert out.count(body) == 1
for slug, _, _ in BLOCKS:
    assert out.count((PRE / 'assets/css/pages' / f'{slug}.css').read_text(encoding='utf-8')) == 1, slug
assert out.count('/*') == out.count('*/')

target = REPO / 'assets/css/styles.css'
now = target.read_text(encoding='utf-8')
assert now in (shared, out), 'the repository stylesheet is neither the pre-fold sheet nor this fold: someone else changed it'
print(f'styles.css: {len(shared.encode()):,} -> {len(out.encode()):,} bytes ({len(out.encode()) / 1024:.1f} KiB); '
      f'shared {len(body.encode()):,} + pages {sum((PRE / "assets/css/pages" / (s + ".css")).stat().st_size for s, _, _ in BLOCKS):,} '
      f'+ comments added {len(out.encode()) - len(shared.encode()) + len(OLD_HEAD.encode()) - sum((PRE / "assets/css/pages" / (s + ".css")).stat().st_size for s, _, _ in BLOCKS):,}')
if not DRY and now != out:
    target.write_text(out, encoding='utf-8')
    print('wrote', target)

# ---- the pages: drop the one link to a page stylesheet
LINK = re.compile(r'\n<link rel="stylesheet" href="/assets/css/pages/([a-z-]+)\.css">')
pages = sorted(p.relative_to(PRE).as_posix() for p in list(PRE.glob('*.html')) + list(PRE.glob('*/index.html')) + list(PRE.glob('*/*/index.html'))
               if p.relative_to(PRE).parts[0] not in ('tools', 'assets', 'server'))
assert len(pages) == 19, pages
for page in pages:
    pre = (PRE / page).read_text(encoding='utf-8')
    found = LINK.findall(pre)
    assert len(found) == 1, (page, found)
    new = LINK.sub('', pre)
    assert len(pre) - len(new) == len(f'\n<link rel="stylesheet" href="/assets/css/pages/{found[0]}.css">')
    assert new.count('rel="stylesheet"') == 1 and '<link rel="stylesheet" href="/assets/css/styles.css">' in new
    cur = (REPO / page).read_text(encoding='utf-8')
    assert cur in (pre, new), f'{page}: the repository page is neither the pre-fold page nor this fold'
    if not DRY and cur != new:
        (REPO / page).write_text(new, encoding='utf-8')
    print(f'{"would edit" if DRY and cur != new else "ok        "} {page:42s} -{found[0]}.css')
