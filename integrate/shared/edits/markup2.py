"""G1, second pass: the other lists drawn without markers (found with checks2.js) get role="list" too."""
import pathlib, re, sys
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/pages')
log = []
for f in sorted(R.glob('*/*.html')):
    s = f.read_text(); n0 = s.count('role="list"')
    def role(m):
        tag = m.group(0)
        if 'role=' in tag: return tag
        cls = (re.search(r'class="([^"]*)"', tag) or [None, ''])[1].split()
        if 'route' in cls or 'thread' in cls or 'aria-labelledby=' in tag: return tag[:-1] + ' role="list">'
        return tag
    s = re.sub(r'<(?:ul|ol)\b[^>]*>', role, s)
    s = re.sub(r'(<td\b[^>]*>(?:<span class="cell-label"[^>]*>[^<]*</span>)?)<ul>', r'\1<ul role="list">', s)       # short lists in table cells
    s = re.sub(r'(<div class="nf-more">\s*<p[^>]*>[^<]*</p>\s*)<ul>', r'\1<ul role="list">', s)
    n = s.count('role="list"') - n0
    if n: f.write_text(s); log.append(f'{f.parent.name}/{f.name}: {n}')
print('\n'.join(log))
h = pathlib.Path('/home/user/Knightwebstudio/tools/chrome/header.inc'); t = h.read_text()
assert t.count('<ul class="nav-links">') == 1
h.write_text(t.replace('<ul class="nav-links">', '<ul class="nav-links" role="list">')); print('header.inc: nav-links')
