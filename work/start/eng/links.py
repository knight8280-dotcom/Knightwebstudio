import re, sys, html
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.links=[]; s.stack=[]; s.region='chrome'; s.cur=None; s.ids=set()
    def handle_starttag(s, tag, attrs):
        a=dict(attrs)
        if tag=='main': s.region='main'
        if 'id' in a: s.ids.add(a['id'])
        if tag in('a','button'):
            s.cur=[s.region, tag, a.get('href',''), 'data-booking' in a, a.get('target',''), a.get('rel',''), '']
    def handle_endtag(s, tag):
        if tag=='main': s.region='chrome'
        if tag in('a','button') and s.cur:
            s.cur[-1]=' '.join(s.cur[-1].split())[:50]; s.links.append(tuple(s.cur)); s.cur=None
    def handle_data(s,d):
        if s.cur: s.cur[-1]+=d
def run(f):
    t=open(f,encoding='utf8').read()
    t=re.sub(r'(<!-- art:[a-z0-9-]+ -->).*?(<!-- /art:[a-z0-9-]+ -->)', r'\1\2', t, flags=re.S)
    p=P(); p.feed(t); return p
old=run('baseline/start/index.html'); new=run('/home/user/Knightwebstudio/start/index.html')
print('OLD'); [print('  ',l) for l in old.links]
print('NEW'); [print('  ',l) for l in new.links]
oh=set((l[2],l[3]) for l in old.links); nh=set((l[2],l[3]) for l in new.links)
print('destinations lost:', oh-nh); print('destinations added:', nh-oh)
print('ids lost:', old.ids-new.ids); print('ids added:', new.ids-old.ids)
for l in new.links:
    if l[2].startswith('#') and l[2][1:] not in new.ids: print('BROKEN ANCHOR', l)
