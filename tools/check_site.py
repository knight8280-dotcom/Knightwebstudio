#!/usr/bin/env python3
"""Integrity checks for the KnightWebstudio refresh.

    python3 check_site.py --root SITE_DIR --baseline BASELINE_DIR [--pages index.html,consulting/index.html]
                          [--show-missing] [--show-new-numbers]

Compares a redesigned copy of the site against the untouched baseline and
checks the hard rules in BRIEF.md: facts, prices, SEO metadata, structured
data, forms, checkout wiring, links, headings and images.

FAIL lines must be fixed. WARN lines need a look and a reason if left.
INFO lines are for reviewers. Exit code 1 when there is at least one FAIL.
"""
import argparse, html, json, pathlib, re, sys

ap = argparse.ArgumentParser()
ap.add_argument('--root', required=True)
ap.add_argument('--baseline', required=True)
ap.add_argument('--pages', default='')
ap.add_argument('--show-missing', action='store_true', help='list baseline sentences no longer on each page')
ap.add_argument('--show-new-numbers', action='store_true', help='list new sentences with figures the old site never used')
a = ap.parse_args()
ROOT, BASE = pathlib.Path(a.root), pathlib.Path(a.baseline)
SKIP_DIRS = {'tools', 'assets', 'server', 'node_modules', '.git'}
LEGAL = {'privacy/index.html', 'terms/index.html'}
CHECKOUT = {'checkout/index.html', 'checkout/success/index.html'}

fails, warns, infos = [], [], []
def fail(page, msg): fails.append(f'FAIL  {page}: {msg}')
def warn(page, msg): warns.append(f'WARN  {page}: {msg}')
def info(page, msg): infos.append(f'INFO  {page}: {msg}')

def pages_of(root):
    out = []
    for p in list(root.glob('*.html')) + list(root.glob('*/index.html')) + list(root.glob('*/*/index.html')):
        rel = p.relative_to(root).as_posix()
        if rel.split('/')[0] in SKIP_DIRS: continue
        out.append(rel)
    return sorted(set(out))

def strip_art(t):
    return re.sub(r'(<!-- art:([a-z0-9-]+) -->).*?(<!-- /art:\2 -->)', r'\1\3', t, flags=re.S)

def visible(t):
    t = re.sub(r'<!--.*?-->', ' ', t, flags=re.S)
    t = re.sub(r'<(script|style|svg|template|noscript)\b.*?</\1>', ' ', t, flags=re.S | re.I)
    m = re.search(r'<body\b.*?>(.*)</body>', t, flags=re.S | re.I)
    t = m.group(1) if m else t
    t = re.sub(r'<[^>]+>', ' ', t)
    return norm(html.unescape(t))

def norm(s):
    s = s.replace(' ', ' ').replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    s = s.replace('–', '-').replace('—', '-').replace('‑', '-')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s+([.,;:!?)\]])', r'\1', s)
    s = re.sub(r'([(\[])\s+', r'\1', s)
    return s.strip()

def sentences(text):
    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"\'$(])', text)
    return [p.strip() for p in parts if len(p.split()) >= 6]

def attrs(tag):
    return dict((k.lower(), html.unescape(v if v is not None else v2 if v2 is not None else v3 or ''))
                for k, v, v2, v3 in re.findall(r'([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+)))?', tag))

def tags(t, name):
    return [attrs(m.group(1)) for m in re.finditer(r'<%s\b([^>]*)>' % name, t, flags=re.I)]

def head_meta(t):
    out = {}
    m = re.search(r'<title>(.*?)</title>', t, flags=re.S | re.I)
    out['title'] = norm(html.unescape(m.group(1))) if m else None
    for at in tags(t, 'meta'):
        k = at.get('name') or at.get('property')
        if k: out['meta:' + k] = at.get('content')
    for at in tags(t, 'link'):
        if at.get('rel') == 'canonical': out['canonical'] = at.get('href')
    m = re.search(r'<html\b([^>]*)>', t, flags=re.I)
    out['lang'] = attrs(m.group(1)).get('lang') if m else None
    return out

def jsonld(t):
    out = []
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', t, flags=re.S):
        try: out.append(json.loads(b))
        except Exception as e: out.append({'__error__': str(e)})
    return out

def inline_scripts(t):
    return [norm(m.group(2)) for m in re.finditer(r'<script\b([^>]*)>(.*?)</script>', t, flags=re.S | re.I)
            if 'ld+json' not in m.group(1) and 'src=' not in m.group(1) and m.group(2).strip()]

def ids(t):
    return set(re.findall(r'\bid\s*=\s*"([^"]+)"', strip_art(t)))

def prices(text):
    return set(re.findall(r'\$\d[\d,]*', text))

def chrome(t, which):
    """Shared header (everything between <body> and <main>) or footer, normalised."""
    t = strip_art(t)
    if which == 'header':
        m = re.search(r'<body\b[^>]*>(.*?)<main\b', t, flags=re.S | re.I)
    else:
        m = re.search(r'(<footer\b.*?</footer>)', t, flags=re.S | re.I)
    if not m: return None
    s = re.sub(r'\s+aria-current="page"', '', m.group(1))
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    return re.sub(r'\s+', ' ', s).strip()

new_pages, base_pages = pages_of(ROOT), pages_of(BASE)
only = [p.strip() for p in a.pages.split(',') if p.strip()]
check = [p for p in base_pages if not only or p in only]

for p in base_pages:
    if p not in new_pages: fail(p, 'page is missing from the redesigned site')
for p in new_pages:
    if p not in base_pages: info(p, 'new page that the baseline does not have')

js_text = ''
for f in (ROOT / 'assets' / 'js').glob('*.js'):
    js_text += f.read_text(errors='ignore') + '\n'
def js_ids(extra=''):
    src = js_text + extra
    found = set(re.findall(r'getElementById\(\s*[\'"]([^\'"]+)', src))
    found |= set(re.findall(r'querySelector(?:All)?\(\s*[\'"]#([\w-]+)', src))
    return found

base_all_text = ' '.join(visible((BASE / p).read_text(errors='ignore')) for p in base_pages)
base_all_prices = prices(base_all_text)
base_all_numbers = set(re.findall(r'\d[\d,.]*%?', base_all_text))

BANNED = [(r'\bAI\b', 'the word "AI"'), (r'(?i)artificial intelligence', '"artificial intelligence"'), (r'(?i)\bchat\s?bots?\b', '"chatbot"'),
          (r'(?i)\bchatgpt\b|\bGPT\b', '"GPT"'), (r'(?i)machine learning', '"machine learning"'), (r'\bLLMs?\b', '"LLM"')]
HEDGES = r'(?i)\b(starting at|starts at|starting from|prices from|from \$|as low as \$|ballpark)\b'
LOREM = r'(?i)lorem ipsum|dolor sit amet|\bTODO\b|\bTBD\b|placeholder text|your text here'

for p in check:
    bf, nf = BASE / p, ROOT / p
    if not nf.exists(): continue
    bt, nt = bf.read_text(errors='ignore'), nf.read_text(errors='ignore')
    bv, nv = visible(bt), visible(nt)

    # --- SEO metadata and structured data stay exactly as they are
    bm, nm = head_meta(bt), head_meta(nt)
    for k, v in bm.items():
        if k in ('meta:theme-color', 'meta:og:image:alt'): continue
        if nm.get(k) != v: fail(p, f'head {k} changed: was {v!r}, now {nm.get(k)!r}')
    bj, nj = jsonld(bt), jsonld(nt)
    if any('__error__' in x for x in nj): fail(p, 'a JSON-LD block no longer parses')
    if bj != nj: fail(p, 'JSON-LD structured data differs from the baseline (it must be identical)')
    for block in nj:
        nodes = block.get('@graph', [block]) if isinstance(block, dict) else []
        for n in nodes:
            if isinstance(n, dict) and n.get('@type') == 'FAQPage':
                for q in n.get('mainEntity', []):
                    qn, an = norm(q['name']), norm(q['acceptedAnswer']['text'])
                    if qn.lower() not in nv.lower(): fail(p, f'FAQ question in structured data is not visible on the page: {qn!r}')
                    if an.lower() not in nv.lower(): fail(p, f'FAQ answer must match its structured data word for word: {qn!r}')

    # --- banned words, hedged prices, placeholder text
    whole = strip_art(nt)
    for rx, label in BANNED:
        if re.search(rx, re.sub(r'<(script|style)\b.*?</\1>', ' ', whole, flags=re.S) if label == '"LLM"' else whole):
            fail(p, f'contains {label} (the owner wants no mention of it anywhere)')
    m = re.search(HEDGES, nv)
    if m: fail(p, f'hedged price wording {m.group(0)!r}: every price is fixed, never a range or "from"')
    m = re.search(LOREM, nv)
    if m: fail(p, f'placeholder text {m.group(0)!r}')

    # --- prices
    bp, np_ = prices(bv), prices(nv)
    lost = sorted(bp - np_)
    if lost: fail(p, f'price figures on the old page are gone: {", ".join(lost)}')
    odd = sorted(np_ - base_all_prices)
    if odd: fail(p, f'price figures the site never used before: {", ".join(odd)}')
    moved = sorted((np_ - bp) - set(odd))
    if moved: info(p, f'prices new to this page (valid elsewhere on the site): {", ".join(moved)}')

    # --- copy drift
    low = nv.lower()
    missing = [s for s in sentences(bv) if s.lower() not in low]
    if p in LEGAL or p in CHECKOUT:
        def main_only(tt):
            mm = re.search(r'<main\b.*?</main>', tt, flags=re.S | re.I)
            return visible('<body>' + (mm.group(0) if mm else tt) + '</body>')
        missing = [s for s in sentences(main_only(bt)) if s.lower() not in main_only(nt).lower()]
        for s in missing: fail(p, f'legal/checkout wording must stay word for word; missing: {s[:140]!r}')
    else:
        tot = len(sentences(bv))
        info(p, f'{len(missing)} of {tot} baseline sentences are reworded or removed')
        if a.show_missing:
            for s in missing: infos.append(f'        - {s[:220]}')
    if a.show_new_numbers:
        blow = base_all_text.lower()
        for s in sentences(nv):
            if s.lower() in blow: continue
            nums = set(re.findall(r'\d[\d,.]*%?', s)) - base_all_numbers
            if nums: infos.append(f'        new figure(s) {sorted(nums)} on {p}: {s[:220]}')

    # --- structure
    h1 = len(re.findall(r'<h1\b', nt, flags=re.I))
    if h1 != 1: fail(p, f'{h1} <h1> elements (need exactly 1)')
    levels = [int(x) for x in re.findall(r'<h([1-6])\b', re.sub(r'<(header|footer)\b[^>]*class="[^"]*site-[^"]*".*?</\1>', '', nt, flags=re.S), flags=re.I)]
    for x, y in zip(levels, levels[1:]):
        if y > x + 1: warn(p, f'heading level jumps from h{x} to h{y}'); break
    for at in tags(strip_art(nt), 'img'):
        src = at.get('src', '?')
        if 'alt' not in at: fail(p, f'<img {src}> has no alt attribute')
        if 'width' not in at or 'height' not in at: fail(p, f'<img {src}> needs width and height (prevents layout shift)')
        if src.startswith('/') and not (ROOT / src.lstrip('/').split('?')[0]).exists(): fail(p, f'image not found: {src}')
    for at in tags(nt, 'a'):
        if at.get('target') == '_blank' and 'noopener' not in (at.get('rel') or ''): warn(p, f'target=_blank without rel=noopener: {at.get("href")}')

    # --- links
    page_ids = ids(nt)
    for at in tags(strip_art(nt), 'a') + tags(nt, 'link') + tags(nt, 'script'):
        href = at.get('href') or at.get('src') or ''
        if href.startswith('#'):
            if len(href) > 1 and href != '#top' and href[1:] not in page_ids: fail(p, f'link to #{href[1:]} but no element has that id')
        elif href.startswith('/') and not href.startswith('//'):
            path, _, frag = href.partition('#')
            path = path.split('?')[0]
            target = ROOT / path.lstrip('/')
            if path.endswith('/') or path == '': target = target / 'index.html'
            if not target.exists(): fail(p, f'broken internal link: {href}')
            elif frag and target.suffix == '.html' and frag not in ids(target.read_text(errors='ignore')): fail(p, f'link {href}: target page has no id "{frag}"')
        elif re.match(r'https?://', href) and (at.get('rel') == 'stylesheet' or ('src' in at and not re.search(r'js\.stripe\.com', href))):
            fail(p, f'loads a third-party file in the HTML: {href} (self-host it)')
    if re.search(r'fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|unpkg\.com|cdnjs', nt): fail(p, 'references a font/script CDN; everything must be self-hosted')

    # --- behaviour wiring
    binline, ninline = inline_scripts(bt), inline_scripts(nt)
    if p in CHECKOUT:
        body_of = lambda tt: tt.split('</head>', 1)[-1]
        if inline_scripts(body_of(bt)) != inline_scripts(body_of(nt)): fail(p, 'inline checkout script changed (payment logic must stay byte for byte)')
        elif binline != ninline: warn(p, 'the first-paint <script> in the head differs from the baseline (fine if it only changes the default theme)')
        gone = sorted(ids(bt) & js_ids('\n'.join(binline)) - page_ids)
    else:
        if binline != ninline: warn(p, 'an inline <script> differs from the baseline (fine only for the theme/first-paint snippet; say why)')
        gone = sorted(ids(bt) & js_ids('\n'.join(ninline)) - page_ids)
    if gone: fail(p, f'ids the scripts rely on are gone: {", ".join(gone)}')
    bforms = re.findall(r'<form\b.*?</form>', bt, flags=re.S | re.I)
    nforms_text = ' '.join(re.findall(r'<form\b.*?</form>', nt, flags=re.S | re.I))
    for bfm in bforms:
        m = re.search(r'<form\b([^>]*)>', bfm)
        fa = attrs(m.group(1))
        nm_ = re.search(r'<form\b[^>]*id="%s"[^>]*>' % re.escape(fa.get('id', '')), nt) if fa.get('id') else None
        if fa.get('id') and not nm_: fail(p, f'form #{fa.get("id")} is gone'); continue
        if nm_:
            na = attrs(nm_.group(0)[5:-1])
            for k in ('action', 'method'):
                if fa.get(k) != na.get(k): fail(p, f'form #{fa.get("id")} {k} changed')
        for tagname in ('input', 'select', 'textarea'):
            for at in tags(bfm, tagname):
                nmn = at.get('name')
                if not nmn: continue
                cands = [x for x in tags(nforms_text, tagname) if x.get('name') == nmn]
                if not cands: fail(p, f'form field name="{nmn}" is gone'); continue
                if at.get('type') == 'hidden' and at.get('value') not in [x.get('value') for x in cands]: fail(p, f'hidden field {nmn} value changed')
                if at.get('type') == 'checkbox' and at.get('value') and at.get('value') not in [x.get('value') for x in cands]: fail(p, f'checkbox {nmn}="{at.get("value")}" is gone')
                if 'required' in at and not any('required' in x for x in cands): fail(p, f'field {nmn} is no longer required')
        for at in tags(bfm, 'option'):
            if at.get('value') not in [x.get('value') for x in tags(nforms_text, 'option')]: fail(p, f'select option value="{at.get("value")}" is gone')
    for marker, label in (('id="mobile-cta"', 'mobile sticky CTA'), ('data-booking', 'a booking button (data-booking)'), ('class="skip-link"', 'the skip link')):
        if marker in bt and marker not in nt: fail(p, f'{label} was on this page and is gone')
    if ('/assets/js/main.js' in bt) != ('/assets/js/main.js' in nt): fail(p, 'main.js include changed')
    if ('/assets/js/calculator.js' in bt) != ('/assets/js/calculator.js' in nt): fail(p, 'calculator.js include changed')
    for at in tags(nt, 'link'):
        if at.get('rel') == 'stylesheet' and at.get('href') != '/assets/css/styles.css': warn(p, f'extra stylesheet linked: {at.get("href")} (allowed only while pages are being built; the finished site has one stylesheet)')
    opens = re.findall(r'<!-- art:([a-z0-9-]+) -->', nt); closes = re.findall(r'<!-- /art:([a-z0-9-]+) -->', nt)
    if opens != closes: fail(p, 'art markers are unbalanced (every <!-- art:x --> needs <!-- /art:x -->)')

# --- header / footer identical wherever they were identical before
for which in ('header', 'footer'):
    groups = {}
    for p in base_pages:
        c = chrome((BASE / p).read_text(errors='ignore'), which)
        if c: groups.setdefault(c, []).append(p)
    for members in groups.values():
        if len(members) < 2: continue
        seen = {}
        for p in members:
            if not (ROOT / p).exists(): continue
            seen.setdefault(chrome((ROOT / p).read_text(errors='ignore'), which), []).append(p)
        if len(seen) > 1:
            sizes = sorted(seen.values(), key=len, reverse=True)
            odd = [x for grp in sizes[1:] for x in grp]
            fail('site', f'{which} differs between pages that used to share it. Out of step: {", ".join(odd[:12])}')

# --- calculator: pre-rendered results must equal what the defaults compute
cp = ROOT / 'consulting' / 'index.html'
if cp.exists() and (not only or 'consulting/index.html' in only):
    ct = cp.read_text(errors='ignore')
    def val(i):
        for at in tags(ct, 'input'):
            if at.get('id') == i:
                try: return float(at.get('value', '0'))
                except ValueError: return 0.0
        return None
    def txt(i):
        m = re.search(r'id="%s"[^>]*>(.*?)</' % i, ct, flags=re.S)
        return norm(html.unescape(re.sub(r'<[^>]+>', '', m.group(1)))) if m else None
    need = ['c-job', 'c-rate', 'c-calls', 'c-callwin', 'c-quotes', 'c-quotewin', 'c-hours', 'c-auto']
    if any(val(i) is None for i in need): fail('consulting/index.html', 'calculator inputs missing: need ids ' + ', '.join(need))
    else:
        W = 52 / 12
        cj = val('c-calls') * W * min(val('c-callwin'), 100) / 100; qj = val('c-quotes') * min(val('c-quotewin'), 100) / 100
        cr, qr = cj * val('c-job'), qj * val('c-job'); mo = cr + qr
        hm = val('c-hours') * min(val('c-auto'), 100) / 100 * W
        money = lambda v: '$' + format(int(v + 0.5), ',')
        expect = {'r-month': money(mo), 'r-year': money(mo * 12), 'r-jobs': str(round((cj + qj) * 10 + 1e-9) / 10).rstrip('0').rstrip('.') if (cj + qj) % 1 else str(int(cj + qj)),
                  'r-calls': money(cr) + '/mo', 'r-quotes': money(qr) + '/mo', 'r-hours': f'{int(hm + 0.5)} hours/mo', 'r-timeval': money(hm * 12 * val('c-rate')) + '/yr'}
        for i, e in expect.items():
            got = txt(i)
            if got is None: fail('consulting/index.html', f'calculator result #{i} is missing')
            elif got != e: fail('consulting/index.html', f'calculator result #{i} shows {got!r} but the default inputs compute {e!r}')
        if txt('r-payback') is None: fail('consulting/index.html', 'calculator #r-payback is missing')

# --- site-wide files
if not only:
    mj = ROOT / 'assets' / 'js' / 'main.js'
    if mj.exists():
        mt = mj.read_text(errors='ignore')
        for needle in ("https://calendly.com/knightwebstudio1/30min", "https://plausible.io/js/pa-M8H39gIN2J-TgmR4OOcVA.js", "api.web3forms.com" if "api.web3forms.com" in (BASE / 'assets/js/main.js').read_text() else "SITE_CONFIG"):
            if needle not in mt: fail('assets/js/main.js', f'{needle} is gone')
    else: fail('assets/js/main.js', 'file missing')
    for f in ['CNAME', 'robots.txt', 'sitemap.xml', 'site.webmanifest', 'favicon.ico', '.nojekyll', 'assets/img/logo.svg', 'assets/img/og-image.png']:
        if not (ROOT / f).exists() and (BASE / f).exists(): fail(f, 'file missing')
    for f in list((ROOT / 'assets').rglob('*')):
        if f.is_file():
            kb = f.stat().st_size / 1024
            rel = f.relative_to(ROOT).as_posix()
            if f.suffix in ('.css', '.js'):
                txt_ = f.read_text(errors='ignore')
                for rx, label in BANNED[:2]:
                    if re.search(rx, txt_): fail(rel, f'contains {label}')
                if re.search(r'@import\s+url\(|https?://(?!www\.w3\.org|plausible\.io|js\.hcaptcha\.com|hcaptcha\.com|api\.web3forms\.com|calendly\.com|knightwebstudio\.com|[a-z0-9-]+\.onrender\.com|js\.stripe\.com)[a-z0-9.-]+\.[a-z]{2,}', txt_) and f.suffix == '.css': fail(rel, 'stylesheet references an outside URL; self-host everything')
            if f.suffix == '.css' and kb > 140: warn(rel, f'{kb:.0f} KB of CSS (budget 140 KB unminified)')
            if f.suffix == '.js' and kb > 60: warn(rel, f'{kb:.0f} KB script (budget 60 KB each)')
            if f.suffix in ('.jpg', '.jpeg', '.png', '.webp', '.avif') and kb > 260 and 'og-image' not in rel and 'icon-' not in rel: warn(rel, f'{kb:.0f} KB image (budget 260 KB)')
            if f.suffix in ('.woff2',) and kb > 140: warn(rel, f'{kb:.0f} KB font file (subset it; budget 140 KB each)')
    fonts = list((ROOT / 'assets' / 'fonts').glob('*')) if (ROOT / 'assets' / 'fonts').exists() else []
    if len(fonts) > 5: warn('assets/fonts', f'{len(fonts)} font files (keep it to 4 or fewer)')
    for f in list(ROOT.glob('*.md')) + list(ROOT.glob('*.webmanifest')) + list(ROOT.glob('*.xml')):
        for rx, label in BANNED[:2]:
            if re.search(rx, f.read_text(errors='ignore')): fail(f.name, f'contains {label}')

for line in fails + warns + infos: print(line)
print(f'\n{len(fails)} FAIL, {len(warns)} WARN, {len([i for i in infos if i.startswith("INFO")])} INFO across {len(check)} pages')
sys.exit(1 if fails else 0)
