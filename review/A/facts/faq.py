import re, json, html, sys
from html.parser import HTMLParser
BASE='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline'
NEW='/home/user/Knightwebstudio'
class D(HTMLParser):
    """collect <details>: summary text, body text"""
    def __init__(s):
        super().__init__(convert_charrefs=True); s.items=[]; s.depth=0; s.insum=False; s.cur=None; s.skip=0
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='details': s.cur={'q':'','a':''}; s.depth+=1
        elif t=='summary': s.insum=True
        elif t=='svg': s.skip+=1
        elif s.cur is not None and a.get('aria-hidden')=='true' and t!='svg': pass
        if s.cur is not None and t in('p','li','br','div','ul','ol') and not s.insum: s.cur['a']+=' '
    def handle_endtag(s,t):
        if t=='details' and s.cur is not None: s.items.append(s.cur); s.cur=None
        elif t=='summary': s.insum=False
        elif t=='svg': s.skip-=1
    def handle_data(s,d):
        if s.cur is None or s.skip: return
        if s.insum: s.cur['q']+=d
        else: s.cur['a']+=d
def norm(x): return re.sub(r'\s+',' ',x).strip()
def faqs(path):
    src=open(path,encoding='utf-8').read()
    d=D(); d.feed(src)
    vis=[(norm(i['q']),norm(i['a'])) for i in d.items]
    ld=[]
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>',src,re.S):
        try: j=json.loads(m.group(1))
        except Exception as e: print('JSON ERR',path,e); continue
        objs=j if isinstance(j,list) else j.get('@graph',[j])
        for o in objs:
            if o.get('@type')=='FAQPage':
                for q in o['mainEntity']:
                    ld.append((norm(q['name']),norm(re.sub(r'<[^>]+>','',q['acceptedAnswer']['text']))))
    return vis,ld
for pg in sys.argv[1:]:
    bv,bl=faqs(BASE+'/'+pg); nv,nl=faqs(NEW+'/'+pg)
    print('==',pg,'visible base/new',len(bv),len(nv),'jsonld base/new',len(bl),len(nl))
    print('   visible Q&A set equal to baseline:', sorted(bv)==sorted(nv), '| same order:', bv==nv)
    for q,a in bv:
        if (q,a) not in nv:
            print('   BASE NOT IN NEW:',q); 
            m=[x for x in nv if x[0]==q]
            if m: print('      base:',a); print('      new :',m[0][1])
    for q,a in nv:
        if (q,a) not in bv: print('   NEW NOT IN BASE:',q,'=>',a[:200])
    print('   jsonld equal to baseline:', bl==nl)
    # visible vs json-ld
    nld=dict(nl)
    for q,a in nv:
        if q not in nld: print('   visible Q not in JSON-LD:',q)
        elif nld[q]!=a: print('   MISMATCH vs JSON-LD:',q,'\n      vis:',a,'\n      ld :',nld[q])
    for q,a in nl:
        if q not in dict(nv): print('   JSON-LD Q not visible:',q)
