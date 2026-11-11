"""Markup changes from the worklist, made in the page mains ($R/pages). Rebuild the pages afterwards (rebuild.sh)."""
import pathlib, re, sys
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/pages')
city = [f'city/web-design-{t}.main.html' for t in ('baton-rouge', 'gonzales', 'prairieville', 'denham-springs')]
files = {f: (R / f).read_text() for f in ['home/main.html', 'services/main.html', 'consulting/main.html', 'work/main.html', 'process/main.html', 'pricing/main.html',
         'faq/main.html', 'about/main.html', 'contact/main.html', 'privacy/main.html', 'terms/main.html', 'checkout/main.html', 'checkout-success/main.html',
         'start/main.html', 'notfound/main.html'] + city}
log = []
def sub(f, pattern, repl, expect=None, flags=0):
    new, n = re.subn(pattern, repl, files[f], flags=flags)
    if expect is not None and n != expect: sys.exit(f'{f}: expected {expect} of {pattern!r}, found {n}')
    files[f] = new; log.append(f'{f}: {n} x {pattern[:60]}')
def rep(f, old, new, expect=1):
    if files[f].count(old) != expect: sys.exit(f'{f}: expected {expect} of {old[:70]!r}, found {files[f].count(old)}')
    files[f] = files[f].replace(old, new); log.append(f'{f}: {expect} x {old[:60]}')

# E1: a space between the figures of a price strip, so the link does not read "$1,000$2,000$4,000$8,000"
for f in ['home/main.html', 'start/main.html', 'consulting/main.html'] + city:
    m = re.search(r'<span class="price-strip-nums">(.*?)</span>', files[f])
    inner = m.group(1); fixed = inner.replace('</b><b>', '</b> <b>')
    if inner == fixed: sys.exit(f + ': price strip already spaced?')
    files[f] = files[f].replace(m.group(0), f'<span class="price-strip-nums">{fixed}</span>'); log.append(f'{f}: price strip spaced')

# E2: a monthly amount never splits at its slash
for f in ['home/main.html', 'start/main.html'] + city:
    def nowrap(m):
        text = m.group(2)
        new, n = re.subn(r'(?<!nowrap">)(\$[\d,]+/mo)\b', r'<span class="nowrap">\1</span>', text)
        if n != 1: sys.exit(f'{f}: tier-plan without one monthly amount: {text}')
        return m.group(1) + new + m.group(3)
    files[f], n = re.subn(r'(<span class="tier-plan">)(.*?)(</span>\n)', nowrap, files[f])
    if n != 4: sys.exit(f'{f}: {n} tier-plan lines')
    log.append(f'{f}: 4 monthly amounts kept whole')

# G2: project links say that they open a new tab
for f in ['home/main.html'] + city:
    def tab(m): return m.group(0)[:-4] + '<span class="sr-only"> (opens in a new tab)</span></p>'
    files[f], n = re.subn(r'<p class="print-kind">(?:(?!</p>).)*</p>', tab, files[f])
    if n != (3 if f.startswith('home') else 1): sys.exit(f'{f}: {n} print captions')
    log.append(f'{f}: {n} x opens in a new tab')

# Corbel Books is described as on /work/ and /about/
rep('home/main.html', 'Fintech SaaS<span class="sep"> · </span><span>Product site &amp; app UI</span>', 'Bookkeeping software<span class="sep"> · </span><span>Product site &amp; app screens</span>')
rep('start/main.html', 'Fintech SaaS · Product site &amp; app UI<span', 'Bookkeeping software · Product site &amp; app screens<span')

# G3: the services figure has a short name of its own
rep('services/main.html', '<figure class="fig reveal">', '<figure class="fig reveal" aria-label="How missed-call text-back works, step by step">')

# P-1: .pl-long goes on the row. Home's rows never had a leader: the span goes.
sub('start/main.html', r'<li class="pl-long">\n(\s*)<div class="pl-row">', r'<li>\n\1<div class="pl-row pl-long">', 6)
sub('services/main.html', r'<h3 class="pl-row">(<span class="pl-name">[^<]*</span> <span class="dots" aria-hidden="true"></span> )<span class="pl-price pl-terms">', r'<h3 class="pl-row pl-long">\1<span class="pl-price">', 3)
sub('home/main.html', r'(<div class="pl-row"><h3 class="pl-name">[^<]*</h3>)<span class="dots" aria-hidden="true"></span>', r'\1', 3)

# P-6: the legal pages' contents lists have names only
for f in ['privacy/main.html', 'terms/main.html']: rep(f, '<nav class="toc" aria-labelledby="toc-title">', '<nav class="toc toc-plain" aria-labelledby="toc-title">')

# P-12: home's business card stays cream paper after dark, like the one on /about/
rep('home/main.html', '<div class="bizcard tilt reveal">', '<div class="bizcard tilt on-paper reveal">')

# G1: lists drawn without bullets keep their list role for VoiceOver
LISTS = r'ticks|steps|pricelist|points|board-tiers|pills|fig-legend|receipt-lines|bizcard-lines'
for f in files:
    def role(m):
        tag = m.group(0)
        if 'role=' in tag: return tag
        cls = re.search(r'class="([^"]*)"', tag)
        if cls and re.search(r'(?:^|\s)(?:%s)(?:\s|$)' % LISTS, cls.group(1)): return tag[:-1] + ' role="list">'
        return tag
    new = re.sub(r'<(?:ul|ol)\b[^>]*>', role, files[f])
    # the contents list: the <ol> inside nav.toc
    new = re.sub(r'(<nav class="toc[^"]*"[^>]*>\s*<p[^>]*>[^<]*</p>\s*)<ol>', r'\1<ol role="list">', new)
    n = new.count('role="list"') - files[f].count('role="list"')
    if n: log.append(f'{f}: {n} x role="list"')
    files[f] = new
for f, text in files.items(): (R / f).write_text(text)
print('\n'.join(log))
