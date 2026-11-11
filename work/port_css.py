"""One-off: carry the prototype's home-only and pricing-only rules into scoped page stylesheets."""
import pathlib, re
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
css = (R / 'design/mainstreet/site/assets/css/styles.css').read_text()
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)

def blocks(text):
    """Top-level (prelude, body) pairs with brace matching."""
    out, i, n = [], 0, len(text)
    while i < n:
        j = text.find('{', i)
        if j < 0: break
        depth, k = 1, j + 1
        while depth:
            if text[k] == '{': depth += 1
            elif text[k] == '}': depth -= 1
            k += 1
        out.append((text[i:j].strip(), text[j + 1:k - 1].strip()))
        i = k
    return out

def split_sel(s):
    parts, depth, cur = [], 0, ''
    for ch in s:
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if ch == ',' and depth == 0: parts.append(cur.strip()); cur = ''
        else: cur += ch
    if cur.strip(): parts.append(cur.strip())
    return parts

HOME = set('''hero hero-grid hero-copy hero-aside price-strip price-strip-label price-strip-nums price-strip-note hero-art hero-scene hero-phone hero-seal
svc-grid svc svc-body svc-no svc-feature svc-art mock-browser mock-browser-bar mock-site mock-site-nav mock-site-hero mock-h mock-h-2 mock-p mock-p-2 mock-btn mock-site-pic mock-site-row mock-mobile
route stop stop-rail stop-pin stop-copy stop-tag stop-art stop-last stop-missed route-more vig-text phone-flat scene-bench thread-open tally tally-copy prints process-grid who who-note ring ring-2 scene-street'''.split())
PRICING = set('''page-head-grid page-seal jump plans plan plan-head plan-price plan-split plan-note plan-ask plan-featured awning pay pricing-foot pay-art split-head menu menu-col menu-actions
bundle bundle-price care-top includes includes-head care-tiers care care-name care-price care-fit care-terms care-mid'''.split())
# selectors that name one of these belong to the shared sheet now, whatever else they name
SHARED_ONLY = set('''points sheet-table sheet bizcard cta-band appt board ticket ticket-steps ticket-no ticket-stamp ticks tag tag-hole stamp seal topbar site-header nav nav-links footer-col mobile-cta
places ledger ledger-row ledger-dots ledger-price menu-title plan-flag pay-bar pay-label bundle-stamp cal leads notice vig vig-flag pill print'''.split())

BP = {'max-width: 380px': 'max-width: 399.98px', 'max-width: 420px': 'max-width: 399.98px', 'min-width: 520px': 'min-width: 600px', 'max-width: 560px': 'max-width: 599.98px',
      'min-width: 561px': 'min-width: 600px', 'min-width: 600px': 'min-width: 600px', 'max-width: 619px': 'max-width: 599.98px', 'min-width: 620px': 'min-width: 600px',
      'min-width: 680px': 'min-width: 760px', 'min-width: 720px': 'min-width: 760px', 'max-width: 759px': 'max-width: 759.98px', 'min-width: 760px': 'min-width: 760px',
      'min-width: 820px': 'min-width: 760px', 'min-width: 900px': 'min-width: 980px', 'min-width: 980px': 'min-width: 980px', 'max-width: 1099px': 'max-width: 1099.98px',
      'min-width: 1100px': 'min-width: 1100px', 'min-width: 1160px': 'min-width: 1100px'}
PX = {'4px': 'var(--s-1)', '8px': 'var(--s-2)', '12px': 'var(--s-3)', '16px': 'var(--s-4)', '24px': 'var(--s-5)', '32px': 'var(--s-6)', '48px': 'var(--s-7)', '64px': 'var(--s-8)', '96px': 'var(--s-9)'}
NEAR = {'2px': 'var(--s-0)', '6px': 'var(--s-2)', '7px': 'var(--s-2)', '9px': 'var(--s-2)', '10px': 'var(--s-3)', '11px': 'var(--s-3)', '13px': 'var(--s-3)', '14px': 'var(--s-4)', '18px': 'var(--s-4)', '20px': 'var(--s-5)',
        '22px': 'var(--s-5)', '26px': 'var(--s-5)', '28px': 'var(--s-6)', '30px': 'var(--s-6)', '34px': 'var(--s-6)', '36px': 'var(--s-6)', '40px': 'var(--s-7)', '44px': 'var(--s-7)', '56px': 'var(--s-8)', '60px': 'var(--s-8)'}
FS = [(r'\.59\d+rem|\.65\d+rem|\.68\d+rem|\.71\d+rem|\.75rem', 'var(--fs-cap)'), (r'\.8125rem', 'var(--fs-label)'), (r'\.84\d+rem|\.875rem|\.90\d+rem|\.9375rem|\.96\d+rem', 'var(--fs-sm)'),
      (r'1rem', 'var(--fs-md)'), (r'1\.0625rem', 'var(--fs-body)'), (r'1\.125rem|1\.1875rem', 'var(--fs-h4)'), (r'1\.375rem', 'var(--fs-h3)')]

def classes(sel): return set(re.findall(r'\.([a-zA-Z][\w-]*)', sel))

def belongs(sel, mine):
    c = classes(sel)
    return bool(c & mine) and not (c & SHARED_ONLY and not (c & mine - {'scene-bench'}) )

def scope(sel, slug):
    s = f'[data-page="{slug}"]'
    if sel.startswith('.js '): return f'.js {s} ' + sel[4:]
    if sel.startswith('[data-theme="dark"] '): return f'DARK {s} ' + sel[len('[data-theme="dark"] '):]
    if sel.startswith(':root'): return None
    return f'{s} {sel}'

def tokens(body):
    def space(m):
        prop, val = m.group(1), m.group(2)
        if 'clamp(' in val or 'calc(' in val or 'var(' in val and 'px' not in val: return m.group(0)
        val = re.sub(r'(?<![\d.\w-])(-?)(\d+px)\b', lambda x: (('calc(-1 * ' + (PX.get(x.group(2)) or NEAR.get(x.group(2))) + ')') if x.group(1) else (PX.get(x.group(2)) or NEAR.get(x.group(2)))) if (x.group(2) in PX or x.group(2) in NEAR) else x.group(0), val)
        return f'{prop}: {val};'
    body = re.sub(r'\b(margin(?:-[a-z-]+)?|padding(?:-[a-z-]+)?|gap|row-gap|column-gap)\s*:\s*([^;]+);', space, body + ';').rstrip(';') if False else re.sub(r'\b(margin(?:-[a-z-]+)?|padding(?:-[a-z-]+)?|gap|row-gap|column-gap)\s*:\s*([^;]+);', space, body)
    def fs(m):
        v = m.group(1)
        if 'clamp' in v or 'var(' in v: return m.group(0)
        for rx, tok in FS:
            if re.fullmatch(rx, v.strip()): return f'font-size: {tok};'
        return m.group(0)
    body = re.sub(r'font-size:\s*([^;]+);', fs, body)
    body = body.replace('var(--fs-xs)', 'var(--fs-label)').replace('var(--board-ink)', 'var(--cream)').replace('#FFFBF2', 'var(--cream)')
    body = re.sub(r'border-radius:\s*999px', 'border-radius: var(--r-pill)', body)
    return body

def port(slug, mine):
    out = []
    def rule(pre, body):
        sels = [s for s in split_sel(pre) if belongs(s, mine)]
        sels = [scope(s, slug) for s in sels]
        sels = [s for s in sels if s]
        if not sels: return None
        return ', '.join(sels) + ' { ' + tokens(body if body.endswith(';') else body + ';') + ' }'
    for pre, body in blocks(css):
        if pre.startswith('@media'):
            cond = pre
            for k, v in BP.items(): cond = cond.replace(k, v)
            inner = [r for r in (rule(p, b) for p, b in blocks(body)) if r]
            if inner: out.append(cond + ' {\n' + '\n'.join('  ' + r for r in inner) + '\n}')
        elif pre.startswith('@'):
            continue
        else:
            r = rule(pre, body)
            if r: out.append(r)
    return '\n'.join(out)

for slug, mine in (('home', HOME), ('pricing', PRICING)):
    t = port(slug, mine)
    (R / f'work/port-{slug}.css').write_text(t + '\n')
    print(slug, len(t), 'bytes;', t.count('DARK'), 'dark rules;', len(re.findall(r'\d+px', t)), 'px literals left')
