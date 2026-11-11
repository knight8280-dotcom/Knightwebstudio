import re, sys, glob, os
from html.parser import HTMLParser
R='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/'
SITE='/home/user/Knightwebstudio/'
new=open(SITE+'pricing/index.html').read()
base=open(R+'baseline/pricing/index.html').read()
def main(s): return re.search(r'<main.*?</main>',s,re.S).group(0)
class L(HTMLParser):
    def __init__(s): super().__init__(); s.links=[]; s.cur=None; s.ids=[]; s.stack=[]; s.errors=[]
    VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr','path','circle','rect','line','polygon','polyline','ellipse','use','stop'}
    def handle_starttag(s,t,a):
        a=dict(a)
        if 'id' in a: s.ids.append(a['id'])
        if t=='a': s.cur=[a.get('href'),'', 'data-booking' in a, a.get('aria-label'), a.get('class')]
        if t not in s.VOID: s.stack.append((t,s.getpos()))
        # nesting checks
        par=[x[0] for x in s.stack[:-1]]
        if t in ('div','ul','ol','p','table','h1','h2','h3','h4','figure','nav','section','header') and 'p' in par[-1:]:
            s.errors.append(f'{t} inside <p> at {s.getpos()}')
        if t=='a' and 'a' in par: s.errors.append(f'nested a at {s.getpos()}')
        if t in('div','p','ul','h3','h4') and par and par[-1] in ('span','b','small','a') and not any(x=='svg' for x in par): s.errors.append(f'block {t} inside inline {par[-1]} at {s.getpos()}')
    def handle_startendtag(s,t,a):
        a=dict(a)
        if 'id' in a: s.ids.append(a['id'])
    def handle_endtag(s,t):
        if t in s.VOID: return
        if t=='a' and s.cur: s.links.append(s.cur); s.cur=None
        if not s.stack: s.errors.append(f'stray </{t}> at {s.getpos()}'); return
        if s.stack[-1][0]!=t:
            s.errors.append(f'mismatch: </{t}> at {s.getpos()} closes <{s.stack[-1][0]}> opened at {s.stack[-1][1]}')
            # recover
            for i in range(len(s.stack)-1,-1,-1):
                if s.stack[i][0]==t: del s.stack[i:]; break
        else: s.stack.pop()
    def handle_data(s,d):
        if s.cur: s.cur[1]+=d
def parse(h):
    p=L(); p.feed(h); return p
pb=parse(main(base)); pn=parse(main(new))
print('BASELINE main links:', len(pb.links))
for l in pb.links: print('  ',l[0], '| booking' if l[2] else '', '|', ' '.join(l[1].split()))
print('NEW main links:', len(pn.links))
for l in pn.links: print('  ',l[0], '| booking' if l[2] else '', '|', ' '.join(l[1].split()), '| aria:',l[3] if l[3] else '')
from collections import Counter
cb=Counter((l[0],l[2]) for l in pb.links); cn=Counter((l[0],l[2]) for l in pn.links)
print('MISSING from new (href,booking):', {k:v-cn.get(k,0) for k,v in cb.items() if cn.get(k,0)<v})
print('ADDED in new:', {k:v-cb.get(k,0) for k,v in cn.items() if cb.get(k,0)<v})
print('nesting errors new main:', pn.errors, 'unclosed:', pn.stack)
# whole page
pw=parse(new); print('whole-page nesting errors:', pw.errors[:10], 'unclosed:', pw.stack)
ids=Counter(pw.ids); print('duplicate ids:', [k for k,v in ids.items() if v>1])
# in-page anchors
for l in pw.links:
    if l[0] and l[0].startswith('#'): print('anchor', l[0], 'OK' if l[0][1:] in ids else 'BROKEN')
bids=set(parse(base).ids); print('baseline ids missing in new:', sorted(bids-set(ids)))
# other pages linking to pricing anchors
for f in glob.glob(SITE+'**/*.html',recursive=True)+glob.glob(SITE+'assets/js/*.js'):
    s=open(f).read()
    for m in set(re.findall(r'/pricing/#([A-Za-z0-9_-]+)',s)): print('inbound', os.path.relpath(f,SITE), '#'+m, 'OK' if m in ids else 'BROKEN')
# contact package option values
c=open(SITE+'contact/index.html').read()
opts=re.findall(r'<option value="([^"]*)"',c); print('contact options:', opts)
for l in pn.links:
    m=re.search(r'package=([a-z]+)', l[0] or '')
    if m: print('  package', m.group(1), 'OK' if m.group(1) in opts else 'NOT AN OPTION')
# checkout plans
ck=open(SITE+'checkout/index.html').read()
for l in pn.links:
    m=re.search(r'plan=([a-z-]+)', l[0] or '')
    if m: print('  plan', m.group(1), 'in checkout script' if m.group(1) in ck else 'NOT FOUND in checkout page')
# banned words
txt=new
for w in [r'\bAI\b', r'artificial intelligence', r'chatbot', r'\bGPT\b', r'machine learning']:
    print('banned', w, len(re.findall(w, txt, re.I if 'AI' not in w and 'GPT' not in w else 0)))
css=open(SITE+'assets/css/pages/pricing.css').read()
for w in [r'\bAI\b', r'artificial intelligence', r'chatbot', r'\bGPT\b', r'machine learning']:
    print('banned css', w, len(re.findall(w, css)))
# hedged price wording
m=main(new); t=re.sub(r'<[^>]+>',' ',m)
for w in ['from \$','starting at','as low as','ballpark','starts at','from just','up to \$', r'\$\d[\d,]*\s*[-–]\s*\$?\d']:
    print('hedge', w, re.findall('.{30}'+w+'.{20}', t, re.I))
# inline styles
print('style attrs:', set(re.findall(r'style="([^"]*)"', m)))
print('images in main:', re.findall(r'<img[^>]*>', m))
print('placeholder text:', re.findall(r'lorem|TODO|TBD|xxx|placeholder', m, re.I))
