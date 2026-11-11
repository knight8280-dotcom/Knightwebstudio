"""Every heading, price, description, tick and link of the live /services/ main must be in the new main.
Compares visible text of <main> only, piece by piece (the site checker compares run-on sentences)."""
import re, html, pathlib, sys
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
def main_of(p):
    t = p.read_text()
    t = re.sub(r'(<!-- art:[a-z0-9-]+ -->).*?(<!-- /art:[a-z0-9-]+ -->)', '', t, flags=re.S)
    return re.search(r'<main\b.*?</main>', t, flags=re.S).group(0)
def pieces(m):
    out = []
    for tag in ('h1', 'h2', 'h3', 'p', 'li', 'a', 'span'):
        for x in re.findall(r'<%s\b[^>]*>(.*?)</%s>' % (tag, tag), m, flags=re.S):
            s = html.unescape(re.sub(r'<svg.*?</svg>', '', x, flags=re.S))
            s = re.sub(r'<[^>]+>', ' ', s); s = re.sub(r'\s+', ' ', s).strip()
            if s: out.append(s)
    return out
def text(m):
    s = html.unescape(re.sub(r'<svg.*?</svg>', '', m, flags=re.S)); s = re.sub(r'<[^>]+>', ' ', s); return re.sub(r'\s+', ' ', s)
old, new = main_of(R / 'baseline/services/index.html'), main_of(pathlib.Path('/home/user/Knightwebstudio/services/index.html'))
nt = text(new)
# the old h2 holds "name <span>price</span>": check name and price separately
missing = []
for s in sorted(set(pieces(old)), key=len):
    if s in nt: continue
    parts = [x for x in re.split(r'\s{2,}', s)]
    missing.append(s)
print('pieces of the live <main> not found verbatim in the new <main>:')
for s in missing: print('  -', s)
print('\nlinks, old:', sorted(set(re.findall(r'href="([^"]+)"', old))))
print('links, new:', sorted(set(re.findall(r'href="([^"]+)"', new))))
print('\nids, new main:', re.findall(r'\sid="([^"]+)"', new))
print('prices old:', sorted(set(re.findall(r'\$[\d,]+', text(old)))))
print('prices new:', sorted(set(re.findall(r'\$[\d,]+', nt))))
print('h tags new:', re.findall(r'<(h[1-6])\b', new))
