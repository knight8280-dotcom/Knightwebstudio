#!/usr/bin/env python3
"""Build ONE page of the KnightWebstudio site from its <main> and touch no other file.

    python3 kws_page.py services/index.html --main /path/to/services/main.html
                        [--css extra-slug[,another]] [--no-check] [--repo DIR] [--baseline DIR]

You write only the page's <main id="main"> ... </main>. This tool supplies the rest:

  head      the untouched baseline <head> (title, meta, canonical, Open Graph, JSON-LD),
            with theme-color #F6F0E4, data-theme="auto", the light-first first-paint
            snippet from tools/chrome/head-script.inc and the two font preloads
  styles    /assets/css/styles.css, then /assets/css/pages/<slug>.css if that file
            exists, then one link per name in --css (for example --css pricing)
  body      <body data-page="slug">, skip link, top strip, the right header variant with
            aria-current, your <main>, the sticky phone bar where the page has one,
            the right footer (all from tools/chrome/ through tools/sync_chrome.py)
  scripts   exactly the <script> tags the baseline page has after its footer, byte for
            byte (main.js, calculator.js, the inline Stripe scripts on the checkout pages)
  art       <!-- art:NAME --><!-- /art:NAME --> markers filled for this page only

It refuses to build, and writes nothing, when:
  - the file has no <main>...</main>
  - a style attribute sets anything other than CSS custom properties
  - the <main> holds a <style> or <script> element, or a header/footer crest marker
  - a word from the owner's never-use list (BRIEF.md section 4) is in the markup
  - on /checkout/ and /checkout/success/, an id that the inline script uses is missing
  - the props rule is broken: more than one .tilt; more than one stamp (counting the
    seal); any prop on FAQ, legal or checkout pages; a street scene outside home, start
    and 404; a .vig without a .flag; a .bigfig without a .note; reveal or seq on the 404
  - the page stylesheet (/assets/css/pages/<slug>.css) has a hex colour, !important, a
    selector that does not start with [data-page="<slug>"], a media width that is not
    one of the six breakpoints, or a :hover rule outside @media (hover: hover)
It prints the page stylesheet's size against its budget, then runs check_site.py for
this page and prints the result (exit code 1 on a FAIL).

Leave art markers EMPTY in your file. Retired markers (shards, chess pieces, the full
crest) are removed for you. The page is written in one step, so a half-built file is
never on disk, and no other page, stylesheet or shared file is touched: it is safe to
run for different pages at the same moment.
"""
import argparse, html, importlib.util, os, pathlib, re, subprocess, sys, tempfile
from html.parser import HTMLParser

# The whole site's CSS must stay under 140 KB. The shared sheet is 62 KB; these are the page sheets' shares, in bytes.
BUDGET = {'home': 15000, 'consulting': 9000, 'start': 6000, 'pricing': 5000, 'services': 5000, 'city': 4000, 'contact': 4000, 'about': 4000,
          'work': 3000, 'process': 3000, 'checkout': 3000, 'faq': 2000, 'checkout-success': 2000, 'notfound': 2000, 'privacy': 1000, 'terms': 1000}
WIDTHS = {380, 600, 760, 980, 1100, 1280}
# Set by the system pass only, to rebuild a page whose own agent has not yet brought it in line: lint failures become notes.
SYSTEM_PASS = os.environ.get('KWS_SYSTEM_PASS') == '1'

HERE = pathlib.Path(__file__).resolve().parent
ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument('page', help='page path inside the site, e.g. services/index.html or 404.html')
ap.add_argument('--main', required=True, help='file holding <main id="main">...</main>')
ap.add_argument('--css', default='', help='extra page stylesheets to link, by slug, comma separated')
ap.add_argument('--repo', default='/home/user/Knightwebstudio')
ap.add_argument('--baseline', default=str(HERE.parent / 'baseline'))
ap.add_argument('--no-check', action='store_true', help='skip check_site.py')
a = ap.parse_args()
REPO, BASE = pathlib.Path(a.repo), pathlib.Path(a.baseline)
page = a.page.lstrip('./')


def die(msg):
    sys.exit(f'kws_page: {page}: {msg}\nNothing was written.')


def load(name, path):
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


chrome = load('sync_chrome', REPO / 'tools' / 'sync_chrome.py')
art = load('build', REPO / 'tools' / 'art' / 'build.py')
if page not in chrome.PAGES:
    die('not a page of this site. Pages: ' + ', '.join(chrome.PAGES))
slug = chrome.slug(page)
base_html = (BASE / page).read_text()

# ---- the supplied <main>
src = pathlib.Path(a.main).read_text()
m = re.search(r'<main\b[^>]*>.*</main>', src, flags=re.S | re.I)
if not m:
    die(f'{a.main} has no <main>...</main>')
main = m.group(0)
extra = re.sub(r'<!--.*?-->', '', src[:m.start()] + src[m.end():], flags=re.S).strip()
if extra:
    print(f'note: ignored {len(extra)} characters outside <main> in {a.main} (the header, phone bar, footer and scripts come from the tool)')
tag = re.match(r'<main\b[^>]*>', main, flags=re.I).group(0)
if not re.search(r'\bid="main"', tag):
    if re.search(r'\bid=', tag):
        die('<main> must have id="main" (the skip link points at it)')
    main = main.replace(tag, tag[:5] + ' id="main"' + tag[5:], 1)

retired = set()
def drop(mm):
    retired.add(mm.group(1))
    return ''
main = re.sub(r'<!-- art:(shards|full-crest|hero-crest|piece-[a-z]+) -->.*?<!-- /art:\1 -->', drop, main, flags=re.S)
if retired:
    print('note: removed retired art markers: ' + ', '.join(sorted(retired)))
main = re.sub(r'(<!-- art:([a-z0-9-]+) -->).*?(<!-- /art:\2 -->)', r'\1\3', main, flags=re.S)   # markers are refilled below

for mm in re.finditer(r'(?is)\sstyle\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))', main):
    value = next(v for v in mm.groups() if v is not None)
    bad = [d.strip() for d in value.split(';') if d.strip() and not d.strip().startswith('--')]
    if bad:
        die(f'inline style="{value}" is not allowed. Only custom properties that carry data (style="--w:50") may be inline; put the rule in /assets/css/pages/{slug}.css')
for tagname in ('style', 'script'):
    if re.search(r'(?i)<%s\b' % tagname, main):
        die(f'the <main> holds a <{tagname}> element. Styles go in /assets/css/pages/{slug}.css; the page\'s scripts are added by this tool, exactly as the live page has them')
if re.search(r'<!-- art:crest-(?:header|footer) -->', main):
    die('the <main> holds a header or footer crest marker. The crest in the header and footer comes from the tool; inside a page only <!-- art:crest-card --> (the business card) is allowed')


# ---- the props rule and the honest-mock rule (DESIGN.md sections 9 and 11)
class Outline(HTMLParser):
    """Enough of a tree to answer: does every .vig hold a .flag, and every .bigfig a .note?"""
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
    def __init__(self):
        super().__init__(); self.stack = []; self.count = {}; self.missing = []
    def handle_starttag(self, tag, attrs):
        classes = (dict(attrs).get('class') or '').split()
        for c in classes:
            self.count[c] = self.count.get(c, 0) + 1
        for frame in self.stack:
            frame[2].update(classes)
        if tag not in self.VOID:
            self.stack.append([tag, classes, set()])
    def handle_endtag(self, tag):
        while self.stack:
            t, classes, inside = self.stack.pop()
            for holder, needs in (('vig', 'flag'), ('bigfig', 'note')):
                if holder in classes and needs not in inside:
                    self.missing.append(f'a .{holder} with no .{needs} inside it')
            if t == tag:
                break

outline = Outline(); outline.feed(main); outline.close()
n = lambda c: outline.count.get(c, 0)
seals = len(re.findall(r'<!-- art:seal -->', main))
scenes = re.findall(r'<!-- art:(scene-[a-z0-9-]+) -->', main)
problems = list(outline.missing)
if n('tilt') > 1:
    problems.append(f'{n("tilt")} tilted objects (.tilt); a page has one at most')
if n('stamp') + seals > 1:
    problems.append(f'{n("stamp")} stamp(s) and {seals} seal(s); a page has one stamp at most, counting the seal')
if slug in ('faq', 'privacy', 'terms', 'checkout', 'checkout-success') and (n('tilt') or n('stamp') or seals or scenes):
    problems.append('a prop (tilt, stamp, seal or scene); FAQ, legal and checkout pages get none')
if scenes and slug not in ('home', 'start', 'notfound'):
    problems.append(f'the drawing {", ".join(sorted(set(scenes)))}; the street scene belongs to the home page, /start/ and the 404 page only')
if slug == 'notfound' and (n('reveal') or n('seq')):
    problems.append('reveal or seq on the 404 page; it loads no script, so those blocks would stay hidden for four seconds')
if problems:
    msg = 'the page breaks the props rule (DESIGN.md section 9): ' + '; '.join(problems)
    if SYSTEM_PASS:
        print('note: ' + msg)
    else:
        die(msg)
# The words the owner wants nowhere on the site: the list lives in check_site.py (BANNED), read from there
banned_src = re.search(r'^BANNED = (\[.*?\])\n(?=HEDGES)', (HERE / 'check_site.py').read_text(), flags=re.S | re.M)
for rx, label in (eval(banned_src.group(1)) if banned_src else []):
    if re.search(rx, main):
        die(f'the markup contains {label}; the owner wants no mention of it anywhere')
if len(re.findall(r'<h1\b', main, flags=re.I)) != 1:
    print('note: the page should have exactly one <h1>')

# ---- scripts: whatever the baseline page has after </main>, byte for byte
after = base_html.split('</head>', 1)[1]
after = after.split('</main>', 1)[1] if '</main>' in after else after
scripts = re.findall(r'<script\b[^>]*>.*?</script>', after, flags=re.S | re.I)
inline = '\n'.join(s for s in scripts if 'src=' not in s.split('>', 1)[0])
if inline:
    # An id counts as used when the script names it in any form: getElementById('x'), querySelector('#x'), mount('#x') ...
    base_main = re.search(r'<main\b.*?</main>', base_html, flags=re.S | re.I).group(0)
    used = {i for i in re.findall(r'\bid\s*=\s*"([^"]+)"', base_main) if re.search(r'[\'"]#?%s[\'"]' % re.escape(i), inline)}
    have = set(re.findall(r'\bid\s*=\s*"([^"]+)"', main))
    gone = sorted(used - have)
    if gone:
        die('the inline script on this page needs these ids and your <main> has dropped them: ' + ', '.join(gone)
            + '. Ids the script uses: ' + ', '.join(sorted(used)))

# ---- body
parts = [f'<body data-page="{slug}">', chrome.header(page), '', main, '']
if chrome.phone_bar(page):
    parts += [chrome.phone_bar(page), '']
parts += [chrome.footer(page)] + scripts + ['</body>']
body = '\n'.join(parts)

with tempfile.TemporaryDirectory(prefix='kws-page-') as tmp:
    tmp = pathlib.Path(tmp)
    (tmp / 'body.html').write_text(body)
    cmd = [sys.executable, str(HERE / 'assemble.py'), '--site', str(tmp / 'site'), '--baseline', str(BASE), '--page', page, '--body', str(tmp / 'body.html'),
           '--theme-color', '#F6F0E4', '--default-theme', 'auto', '--preload', 'fraunces-soft.woff2,figtree.woff2',
           '--head-script', str(REPO / 'tools' / 'chrome' / 'head-script.inc')]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        die('assemble.py failed: ' + (r.stderr or r.stdout).strip())
    out = (tmp / 'site' / page).read_text()

head, rest = out.split('</head>', 1)
# 404.html: its first-paint script has no leading comment, and it carries an old inline <style>
snippet = (REPO / 'tools' / 'chrome' / 'head-script.inc').read_text().strip('\n')
if snippet not in head:
    head, n = re.subn(r'<script>(?:(?!</script>).)*?localStorage\.getItem\(\'theme\'\).*?</script>', lambda x: '<script>\n' + snippet + '\n</script>', head, count=1, flags=re.S)
    if not n:
        die('could not find the first-paint script in the head')
head = re.sub(r'<style\b.*?</style>\n?', '', head, flags=re.S | re.I)


def lint_sheet(path, slug):
    """Problems in a page stylesheet that would leak or drift when the files are folded into one."""
    css = re.sub(r'/\*.*?\*/', '', path.read_text(), flags=re.S)
    out = []
    if re.search(r'#[0-9a-fA-F]{3,8}\b', css):
        out.append('a hex colour (use the tokens): ' + ', '.join(sorted(set(re.findall(r'#[0-9a-fA-F]{3,8}\b', css)))[:5]))
    if '!important' in css:
        out.append('!important')
    for w in sorted({float(x) for x in re.findall(r'(?:min|max)-width:\s*([\d.]+)px', css)}):
        if round(w + .02, 2) not in WIDTHS and w not in WIDTHS:
            out.append(f'a media width of {w:g}px (the six breakpoints are 380, 600, 760, 980, 1100, 1280)')
    scope = f'[data-page="{slug}"]'
    stack, i, prelude = [], 0, ''          # stack of enclosing at-rules
    while i < len(css):
        ch = css[i]
        if ch == '{':
            head = ' '.join(prelude.split()); prelude = ''
            if head.startswith('@keyframes') or head.startswith('@font-face'):
                depth, i = 1, i + 1
                while i < len(css) and depth:
                    depth += {'{': 1, '}': -1}.get(css[i], 0); i += 1
                if head.startswith('@font-face'):
                    out.append('an @font-face rule (fonts belong to the shared sheet)')
                continue
            if head.startswith('@'):
                stack.append(head)
            else:
                stack.append(None)
                hover_ok = any(h and 'hover: hover' in h for h in stack if h)
                for sel in re.split(r',(?![^()]*\))', head):
                    sel = sel.strip()
                    if not (sel.startswith(scope) or sel.startswith('.js ' + scope) or sel.startswith('html:not(.js) ' + scope)):
                        out.append(f'a selector that does not start with {scope}: {sel[:70]}')
                    if ':hover' in sel and not hover_ok:
                        out.append(f'a :hover rule outside @media (hover: hover): {sel[:70]}')
        elif ch == '}':
            if stack:
                stack.pop()
            prelude = ''
        elif ch == ';' and not (stack and stack[-1] is None):
            prelude = ''
        else:
            prelude += ch
        i += 1
    return out


links = []
for s in [slug] + [x.strip() for x in a.css.split(',') if x.strip()]:
    if s in links:
        continue
    if (REPO / 'assets' / 'css' / 'pages' / f'{s}.css').exists():
        links.append(s)
    elif s != slug:
        die(f'--css {s}: /assets/css/pages/{s}.css does not exist')
own = REPO / 'assets' / 'css' / 'pages' / f'{slug}.css'
size_note = ''
if own.exists():
    bad = lint_sheet(own, slug)
    if bad:
        msg = f'/assets/css/pages/{slug}.css has ' + '; '.join(dict.fromkeys(bad))
        if SYSTEM_PASS:
            print('note: ' + msg)
        else:
            die(msg)
    size, room = own.stat().st_size, BUDGET.get(slug, 0)
    size_note = f'{slug}.css is {size:,} bytes of its {room:,} byte budget' + ('' if size <= room else f'  <-- OVER by {size - room:,}: cut it, the whole site must stay under 140 KB')
if '<meta name="theme-color"' not in head:   # 404.html never had one
    head = head.replace('<meta name="viewport"', '<meta name="theme-color" content="#F6F0E4">\n<meta name="viewport"', 1)
sheet = '<link rel="stylesheet" href="/assets/css/styles.css">'
if sheet not in head:
    die('the baseline head has no link to /assets/css/styles.css')
head = head.replace(sheet, sheet + ''.join(f'\n<link rel="stylesheet" href="/assets/css/pages/{s}.css">' for s in links), 1)
out = art.fill(head + '</head>' + rest, page)

dest = REPO / page
fd, tmpname = tempfile.mkstemp(dir=str(dest.parent), prefix='.kws-', suffix='.tmp')
with os.fdopen(fd, 'w') as f:
    f.write(out)
os.chmod(tmpname, 0o644)
os.replace(tmpname, dest)
print(f'built {dest}  (data-page="{slug}", header: {chrome.PAGES[page][1]}, footer: {chrome.PAGES[page][2]}, phone bar: {"yes" if chrome.PAGES[page][3] else "no"}, '
      f'page css: {", ".join(links) or "none"}, scripts: {len(scripts)})')
if size_note:
    print(size_note)

if not a.no_check:
    r = subprocess.run([sys.executable, str(HERE / 'check_site.py'), '--root', str(REPO), '--baseline', str(BASE), '--pages', page], capture_output=True, text=True)
    print(r.stdout.rstrip())
    if r.stderr.strip():
        print(r.stderr.rstrip())
    sys.exit(r.returncode)
