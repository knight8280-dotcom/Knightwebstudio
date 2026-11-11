#!/usr/bin/env python3
import sys, re, os
from html.parser import HTMLParser
BASE='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline'
NEW='/home/user/Knightwebstudio'
PAGES="index.html services/index.html consulting/index.html work/index.html process/index.html pricing/index.html faq/index.html contact/index.html about/index.html start/index.html web-design-baton-rouge/index.html web-design-denham-springs/index.html web-design-gonzales/index.html web-design-prairieville/index.html privacy/index.html terms/index.html checkout/index.html checkout/success/index.html 404.html".split()
class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.links=[]; s.ids=[]; s.cur=None; s.svg=0; s.other=[]
    def handle_starttag(s,tag,attrs):
        a=dict(attrs)
        if 'id' in a: s.ids.append(a['id'])
        if tag=='svg': s.svg+=1
        if tag=='a':
            s.cur={'href':a.get('href'),'booking':'data-booking' in a,'cls':a.get('class',''),'target':a.get('target'),'rel':a.get('rel'),'aria':a.get('aria-label'),'text':'','hidden':'hidden' in a}
        for k in ('src','href','action','poster','srcset','content'):
            if k in a and tag!='a': s.other.append((tag,k,a[k]))
    def handle_endtag(s,tag):
        if tag=='svg': s.svg-=1
        if tag=='a' and s.cur:
            s.cur['text']=re.sub(r'\s+',' ',s.cur['text']).strip(); s.links.append(s.cur); s.cur=None
    def handle_data(s,d):
        if s.cur is not None and not s.svg: s.cur['text']+=d
def parse(path):
    p=P(); p.feed(open(path,encoding='utf-8').read()); return p
def exists(root, href, page_ids, cache):
    if href is None: return 'NO HREF'
    if href.startswith(('mailto:','tel:','http://','https://')): return None
    path,_,frag=href.partition('#'); path,_,q=path.partition('?')
    if path=='':
        if frag and frag not in page_ids and frag!='top': return 'missing anchor #'+frag
        return None
    if not path.startswith('/'): return 'relative link'
    f=root+path
    if f.endswith('/'): f+='index.html'
    if not os.path.exists(f): return 'missing file '+path
    if frag:
        if f not in cache: cache[f]=set(parse(f).ids) if f.endswith('.html') else set()
        if frag not in cache[f]: return 'missing anchor %s#%s'%(path,frag)
    return None
cache={}
for pg in PAGES:
    b=parse(BASE+'/'+pg); n=parse(NEW+'/'+pg)
    print('==',pg, 'links base',len(b.links),'new',len(n.links))
    for l in n.links:
        e=exists(NEW,l['href'],set(n.ids),cache)
        if e: print('   BROKEN',l['href'],'|',l['text'][:50],'|',e)
        if l['target']=='_blank' and 'noopener' not in (l['rel'] or ''): print('   target blank w/o noopener', l['href'])
    for t,k,v in n.other:
        if k in('src','href') and v.startswith('/'):
            f=NEW+v.split('?')[0].split('#')[0]
            if f.endswith('/'): f+='index.html'
            if not os.path.exists(f): print('   MISSING ASSET',t,k,v)
        elif k in ('src','href') and not v.startswith(('http','mailto','tel','#','data:')): print('   REL?',t,k,v)
    bh=set((l['href'] or '').split('#')[0] if (l['href'] or '').startswith('/') else l['href'] for l in b.links)
    nh=set((l['href'] or '').split('#')[0] if (l['href'] or '').startswith('/') else l['href'] for l in n.links)
    bfull=set(l['href'] for l in b.links); nfull=set(l['href'] for l in n.links)
    print('   baseline hrefs not on new page:',sorted(x for x in bfull-nfull if x))
    print('   new hrefs not on baseline page:',sorted(x for x in nfull-bfull if x))
    bb=[(l['text'],l['href']) for l in b.links if l['booking']]; nb=[(l['text'],l['href'],l['cls']) for l in n.links if l['booking']]
    print('   booking(base):',bb); print('   booking(new):',nb)
