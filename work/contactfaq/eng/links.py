import re, sys, json, html
from html.parser import HTMLParser
R='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
def main_of(path):
    s=open(path,encoding='utf-8').read()
    m=re.search(r'<main[^>]*>.*?</main>',s,re.S)
    return m.group(0), s
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.links=[]; s.ids=[]; s.forms=[]; s.stack=[]; s.cur=None; s.text=''
    def handle_starttag(s,tag,attrs):
        a=dict(attrs)
        if 'id' in a: s.ids.append(a['id'])
        if tag=='a': s.cur=[a.get('href'),'' , a]; 
        if tag in('input','select','textarea','option','form','button'): s.forms.append((tag,tuple(sorted(a.items()))))
    def handle_endtag(s,tag):
        if tag=='a' and s.cur: s.links.append((s.cur[0],' '.join(s.cur[1].split()),s.cur[2])); s.cur=None
    def handle_data(s,d):
        if s.cur: s.cur[1]+=d
for page in ['contact','faq']:
    bm,bs=main_of(f'{R}/baseline/{page}/index.html'); nm,ns=main_of(f'/home/user/Knightwebstudio/{page}/index.html')
    b=P(); b.feed(bm); n=P(); n.feed(nm)
    print('=====',page)
    print('baseline main links:'); [print('   ',l[0],'|',l[1]) for l in b.links]
    print('new main links:'); [print('   ',l[0],'|',l[1], '|', {k:v for k,v in l[2].items() if k not in('href','class')}) for l in n.links]
    bh=set(l[0] for l in b.links); nh=set(l[0] for l in n.links)
    print('lost hrefs:',bh-nh); print('added hrefs:',nh-bh)
    print('baseline ids:',b.ids); print('new ids:',n.ids)
    print('ids lost:',set(b.ids)-set(n.ids))
    # duplicate ids in whole doc
    w=P(); w.feed(ns); 
    from collections import Counter
    print('dup ids whole doc:',[k for k,v in Counter(w.ids).items() if v>1])
    # in-page anchors
    for l in w.links:
        h=l[0] or ''
        if h.startswith('#') and h!='#top' and h[1:] not in w.ids: print('BROKEN in-page anchor',h)
    if page=='contact':
        def norm(forms):
            out=[]
            for tag,a in forms:
                d=dict(a)
                if tag=='option': out.append(('option',d.get('value')))
                elif tag=='form': out.append(('form',d.get('action'),d.get('method'),d.get('id'),'novalidate' in d))
                else: out.append((tag,d.get('type'),d.get('name'),d.get('id'),d.get('value'),'required' in d, d.get('autocomplete'), d.get('aria-describedby')))
            return out
        fb=norm(b.forms); fn=norm(n.forms)
        print('form controls identical (tag,type,name,id,value,required,autocomplete,describedby):',fb==fn)
        for x,y in zip(fb,fn):
            if x!=y: print('  DIFF',x,y)
        print(len(fb),len(fn))
