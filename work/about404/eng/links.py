import re,sys
from html.parser import HTMLParser
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.inmain=False; s.links=[]; s.cur=None; s.ids=set(); s.stack=[]
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='main': s.inmain=True
        if 'id' in a: s.ids.add(a['id'])
        if s.inmain and t=='a':
            s.cur=[a.get('href'), 'data-booking' in a, a.get('target'), a.get('rel'), '']
    def handle_endtag(s,t):
        if t=='main': s.inmain=False
        if t=='a' and s.cur: s.links.append(s.cur); s.cur=None
    def handle_data(s,d):
        if s.cur: s.cur[4]+=d
def run(f):
    p=P(); p.feed(open(f).read()); return p
for name,b,n in [('about','about.base.html','about.built.html'),('404','nf.base.html','nf.built.html')]:
    pb=run(b); pn=run(n)
    print('=====',name,'baseline main links')
    for l in pb.links: print('  ',l[0],'| booking' if l[1] else '', '|',l[2] or '', l[3] or '', '|', ' '.join(l[4].split()))
    print('=====',name,'new main links')
    for l in pn.links: print('  ',l[0],'| booking' if l[1] else '', '|',l[2] or '', l[3] or '', '|', ' '.join(l[4].split()))
    sb=set((l[0],l[1]) for l in pb.links); sn=set((l[0],l[1]) for l in pn.links)
    print('  missing from new:', sb-sn); print('  added in new:', sn-sb)
    print('  ids baseline-not-new:', sorted(pb.ids-pn.ids)); 
    print('  ids new:', sorted(pn.ids))
