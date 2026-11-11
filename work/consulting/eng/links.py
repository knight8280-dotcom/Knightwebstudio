import re, sys, html
from html.parser import HTMLParser
def main_of(path):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'<main\b.*?</main>', s, re.S)
    return s, m.group(0)
class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.ids=[]; self.cur=None; self.text=''
        self.stack=[]
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        if tag=='a':
            self.cur = dict(a); self.text=''
    def handle_data(self, d):
        if self.cur is not None: self.text += d
    def handle_endtag(self, tag):
        if tag=='a' and self.cur is not None:
            self.links.append((self.cur.get('href'), ' '.join(self.text.split()), 'data-booking' in self.cur, self.cur.get('target'), self.cur.get('rel')))
            self.cur=None
R='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
for name, path in (('BASELINE', R+'/baseline/consulting/index.html'), ('NEW', '/home/user/Knightwebstudio/consulting/index.html')):
    full, m = main_of(path)
    p = P(); p.feed(m)
    print('==', name, 'main links')
    for l in p.links: print('  ', l)
    print('  ids:', p.ids)
    pf = P(); pf.feed(full)
    allids = set(pf.ids)
    for h, t, *_ in p.links:
        if h and h.startswith('#') and h[1:] not in allids: print('  !! unresolved anchor', h)
    globals()[name] = (p, allids)
bl = set(h for h, *_ in BASELINE[0].links); nw = set(h for h, *_ in NEW[0].links)
print('destinations in baseline main missing from new main:', bl - nw)
print('destinations new in new main:', nw - bl)
print('baseline ids missing in new page:', set(BASELINE[0].ids) - NEW[1])
