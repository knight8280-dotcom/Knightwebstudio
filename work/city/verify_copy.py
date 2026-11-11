#!/usr/bin/env python3
"""Every block of text in the live page's <main> must still be in the new page's <main>, word for word.
Blocks: headings, paragraphs, list items, summaries, the price-card spans, link and button labels."""
import html, pathlib, re, sys
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
REPO = pathlib.Path('/home/user/Knightwebstudio')

def norm(s):
    s = re.sub(r'<!--.*?-->', ' ', s, flags=re.S)
    s = re.sub(r'<svg\b.*?</svg>', ' ', s, flags=re.S)
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s))
    s = s.replace(' ', ' ')
    s = re.sub(r'\s+', ' ', s)
    s = re.sub(r'\s+([.,;:!?)\]])', r'\1', s)
    return s.strip()

def main_of(t):
    return re.search(r'<main\b.*?</main>', t, flags=re.S).group(0)

bad = 0
ALLOWED_GONE = {'Questions', 'Live', 'Pricing', 'What we build', 'Local work'}   # eyebrows that repeated their titles (kept where they do not); the flag now reads 'Status: Live site'
for slug in ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville']:
    old = main_of((R / 'baseline' / f'web-design-{slug}' / 'index.html').read_text())
    new = main_of((REPO / f'web-design-{slug}' / 'index.html').read_text())
    new_text = norm(new)
    blocks = []
    for tag in ('h1', 'h2', 'h3', 'p', 'li', 'summary', 'span', 'a'):
        for m in re.finditer(r'<%s\b[^>]*>(.*?)</%s>' % (tag, tag), old, flags=re.S):
            inner = m.group(1)
            if tag in ('p', 'li', 'span', 'a', 'summary', 'h1', 'h2', 'h3') and re.search(r'<(p|li|div|ul|h[1-6])\b', inner):
                continue
            t = norm(inner)
            if t:
                blocks.append((tag, t))
    missing = []
    for tag, t in blocks:
        if t in new_text:
            continue
        # a paragraph may have been set in two places: then each of its sentences must still be there, whole
        parts = [x for x in re.split(r'(?<=[.!?])\s+(?=[A-Z])', t) if x]
        gone = [x for x in parts if x not in new_text]
        if len(parts) > 1 and not gone:
            print('   note: set in', len(parts), 'sentences, all present:', repr(t[:70]))
            continue
        if t in ALLOWED_GONE:
            print('   note: label dropped on purpose:', repr(t))
            continue
        missing.append((tag, t))
    # headings: same text AND still a heading
    heads_old = [norm(m.group(2)) for m in re.finditer(r'<(h[1-6])\b[^>]*>(.*?)</\1>', old, flags=re.S)]
    heads_new = [norm(m.group(2)) for m in re.finditer(r'<(h[1-6])\b[^>]*>(.*?)</\1>', new, flags=re.S)]
    lost_heads = [h for h in heads_old if h not in heads_new]
    extra_heads = [h for h in heads_new if h not in heads_old]
    links_old = sorted(set(re.findall(r'<a\b[^>]*href="([^"]+)"', old)))
    links_new = sorted(set(re.findall(r'<a\b[^>]*href="([^"]+)"', new)))
    print(f'{slug}: {len(blocks)} blocks checked, {len(missing)} not found; headings {len(heads_old)} -> {len(heads_new)}')
    for tag, t in missing: print('   MISSING', tag, repr(t[:150]))
    for h in lost_heads: print('   HEADING LOST', repr(h))
    for h in extra_heads: print('   HEADING NEW', repr(h))
    print('   link targets lost:', [l for l in links_old if l not in links_new], ' new:', [l for l in links_new if l not in links_old])
    # words: every word count of the old main vs the new one (what was added)
    ow, nw = norm(old).split(), new_text.split()
    from collections import Counter
    co, cn = Counter(ow), Counter(nw)
    added = sorted((cn - co).elements()); removed = sorted((co - cn).elements())
    print('   words added:', ' '.join(added))
    print('   words removed:', ' '.join(removed))
    bad += len(missing) + len(lost_heads)
sys.exit(1 if bad else 0)
