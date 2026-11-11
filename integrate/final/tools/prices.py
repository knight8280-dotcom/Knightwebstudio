import re, html, pathlib, sys, collections
ROOT = pathlib.Path(sys.argv[1])
PAGES = ['index.html','services/index.html','consulting/index.html','work/index.html','process/index.html','pricing/index.html','faq/index.html','contact/index.html','about/index.html','start/index.html','web-design-baton-rouge/index.html','web-design-denham-springs/index.html','web-design-gonzales/index.html','web-design-prairieville/index.html','privacy/index.html','terms/index.html','checkout/index.html','checkout/success/index.html','404.html']
def main_text(t):
    m = re.search(r'<main\b.*?</main>', t, flags=re.S)
    t = m.group(0)
    t = re.sub(r'<!--.*?-->', ' ', t, flags=re.S)
    t = re.sub(r'<(script|style|svg)\b.*?</\1>', ' ', t, flags=re.S)
    t = re.sub(r'<[^>]+>', '', t)
    return re.sub(r'\s+', ' ', html.unescape(t))
pat = re.compile(r'\$\d[\d,]*(?:\.\d+)?(?:\s?(?:/\s?(?:mo|month|yr|year)\b| a month| per month| a year| each| per setup| down| to set up| setup| audit| session))?')
allf = collections.defaultdict(lambda: collections.defaultdict(int))
for p in PAGES:
    t = main_text((ROOT / p).read_text())
    for m in pat.finditer(t):
        s = m.group(0)
        kind = re.sub(r'\$\d[\d,]*', '$N', s)
        allf[kind][p] += 1
    for m in re.finditer(r'\$\d{4,}', t): print('NO COMMA', p, m.group(0))
    for m in re.finditer(r'\d\s?-\s?\d+ (days|weeks)', t): print('HYPHEN RANGE', p, m.group(0))
    for m in re.finditer(r'.{30}(?:per month|monthly payments|/month|a month).{20}', t): pass
for kind, pages in sorted(allf.items()):
    print(f'{kind!r:28}', ', '.join(f'{p.replace("/index.html","").replace("index.html","home")}:{n}' for p, n in pages.items()))
