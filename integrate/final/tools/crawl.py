# crawl.py ROOT : every local reference in pages, CSS, manifest, sitemap and JSON-LD points at a file that exists; every asset is referenced
import re, sys, json, pathlib, html
ROOT = pathlib.Path(sys.argv[1])
pages = [p for p in list(ROOT.glob('*.html')) + list(ROOT.glob('*/index.html')) + list(ROOT.glob('*/*/index.html')) if p.relative_to(ROOT).parts[0] not in ('tools', 'assets', 'server', 'node_modules')]
missing, used = [], set()
def resolve(ref, base):
    ref = html.unescape(ref).split('#')[0].split('?')[0]
    if not ref: return None
    if ref.startswith('https://knightwebstudio.com'): ref = ref[len('https://knightwebstudio.com'):] or '/'
    if re.match(r'^[a-z][a-z0-9+.-]*:', ref) or ref.startswith('//'): return None
    t = (ROOT / ref.lstrip('/')) if ref.startswith('/') else (base.parent / ref)
    if ref.endswith('/') or t.is_dir(): t = t / 'index.html'
    return t
n = 0
for p in pages:
    t = p.read_text()
    refs = re.findall(r'\b(?:href|src|poster|action|content)\s*=\s*"([^"]+)"', t)
    for m in re.findall(r'\bsrcset\s*=\s*"([^"]+)"', t): refs += [x.strip().split(' ')[0] for x in m.split(',')]
    refs += re.findall(r'"(https://knightwebstudio\.com[^"]*)"', t)
    for r in refs:
        if not (r.startswith('/') or r.startswith('https://knightwebstudio.com') or re.match(r'^[\w.-]+/|^[\w-]+\.(html|png|jpg|svg|css|js|ico|webmanifest)$', r)): continue
        if r.startswith('/') and ' ' in r: continue
        tgt = resolve(r, p)
        if tgt is None: continue
        n += 1
        if not tgt.exists(): missing.append(f'{p.relative_to(ROOT)}: {r}')
        else: used.add(tgt.resolve())
for cssf in ROOT.glob('assets/css/*.css'):
    for r in re.findall(r'url\(\s*["\']?([^"\')]+)', cssf.read_text()):
        if r.startswith('data:'): continue
        tgt = resolve(r, cssf); n += 1
        if tgt is not None:
            if not tgt.exists(): missing.append(f'{cssf.relative_to(ROOT)}: {r}')
            else: used.add(tgt.resolve())
mf = json.loads((ROOT / 'site.webmanifest').read_text())
for r in [mf.get('start_url')] + [i['src'] for i in mf.get('icons', [])]:
    tgt = resolve(r, ROOT / 'site.webmanifest'); n += 1
    if not tgt.exists(): missing.append(f'site.webmanifest: {r}')
    else: used.add(tgt.resolve())
for r in re.findall(r'<loc>([^<]+)</loc>', (ROOT / 'sitemap.xml').read_text()):
    tgt = resolve(r, ROOT / 'sitemap.xml'); n += 1
    if not tgt.exists(): missing.append(f'sitemap.xml: {r}')
for r in re.findall(r'Sitemap:\s*(\S+)', (ROOT / 'robots.txt').read_text()):
    tgt = resolve(r, ROOT / 'robots.txt'); n += 1
    if not tgt.exists(): missing.append(f'robots.txt: {r}')
js = ''.join(f.read_text() for f in ROOT.glob('assets/js/*.js'))
for r in re.findall(r'["\'](/(?:assets/[^"\']+|[a-z-]+/(?:\?[^"\']*)?))["\']', js):
    tgt = resolve(r, ROOT / 'assets/js/main.js'); n += 1
    if tgt is not None and not tgt.exists(): missing.append(f'js: {r}')
    elif tgt is not None: used.add(tgt.resolve())
print(f'{len(pages)} pages, {n} local references checked')
print('MISSING:' if missing else 'nothing references a missing file'); [print('  ', m) for m in sorted(set(missing))]
unused = [f for f in sorted((ROOT / 'assets').rglob('*')) if f.is_file() and f.resolve() not in used]
print('UNUSED in assets/:' if unused else 'every file in assets/ is referenced'); [print('  ', u.relative_to(ROOT)) for u in unused]
print('fonts:', sorted(f.name for f in (ROOT / 'assets/fonts').iterdir()))
sm = set(re.findall(r'<loc>https://knightwebstudio\.com(/[^<]*)</loc>', (ROOT / 'sitemap.xml').read_text()))
pg = {'/' + str(p.relative_to(ROOT)).replace('index.html', '') for p in pages}
print('pages not in sitemap:', sorted(pg - sm))
