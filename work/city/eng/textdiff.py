import re, sys, html, difflib
from html.parser import HTMLParser
R='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
BLOCK={'p','h1','h2','h3','h4','li','dt','dd','summary','div','section','article','aside','header','ul','ol','dl','details','a','figure','main','span'}
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.out=[]; s.inmain=False; s.skip=0; s.links=[]; s.stack=[]
    def handle_starttag(s,t,a):
        a=dict(a)
        if t=='main': s.inmain=True
        if not s.inmain: return
        if t in('svg','script','style'): s.skip+=1
        if t=='a': s.links.append([a.get('href'),a.get('class',''),'data-booking' in a, a.get('target'),a.get('rel'),''])
        if t in ('p','h1','h2','h3','h4','li','dt','dd','summary','br','div','section','article','aside','header','ul','ol','dl','details','a'): s.out.append('\n')
        if t=='img': s.out.append('[IMG alt=%s w=%s h=%s loading=%s]'%(a.get('alt'),a.get('width'),a.get('height'),a.get('loading')))
    def handle_endtag(s,t):
        if t in('svg','script','style') and s.inmain: s.skip-=1
        if t=='main': s.inmain=False
        if s.inmain and t in ('p','h1','h2','h3','h4','li','dt','dd','summary','div','section','article','aside','header','ul','ol','dl','details','a'): s.out.append('\n')
    def handle_data(s,d):
        if s.inmain and not s.skip:
            s.out.append(d)
            if s.links: pass
def text(path):
    p=P(); p.feed(open(path,encoding='utf8').read())
    t=''.join(p.out)
    lines=[re.sub(r'\s+',' ',l).strip() for l in t.split('\n')]
    return [l for l in lines if l], p.links
for town in ['baton-rouge','denham-springs','gonzales','prairieville']:
    b,bl=text(f'{R}/baseline/web-design-{town}/index.html')
    n,nl=text(f'/home/user/Knightwebstudio/web-design-{town}/index.html')
    print('=====',town)
    bs=set(b); ns=set(n)
    print('--- baseline lines not in new:')
    for l in b:
        if l not in ns: print('   -',l)
    print('--- new lines not in baseline:')
    for l in n:
        if l not in bs: print('   +',l)
    # whole-text check: every baseline word sequence
    print('--- links baseline:', sorted(set((x[0],x[2]) for x in bl)))
    print('--- links new     :', sorted(set((x[0],x[2]) for x in nl)))
    from collections import Counter
    print('    counts baseline', Counter(x[0] for x in bl))
    print('    counts new     ', Counter(x[0] for x in nl))
