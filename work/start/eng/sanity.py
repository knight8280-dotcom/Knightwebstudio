import re,sys
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
SVGVOID={'path','circle','rect','line','polygon','polyline','ellipse','use','stop'}
class P(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.st=[]; s.err=[]; s.ids={}; s.h=[]; s.imgs=[]; s.insvg=0; s.styles=[]
    def handle_starttag(s,t,a):
        d=dict(a)
        if 'id' in d: s.ids[d['id']]=s.ids.get(d['id'],0)+1
        if 'style' in d: s.styles.append((t,d['style'],s.getpos()))
        if t=='svg': s.insvg+=1
        if re.fullmatch('h[1-6]',t) and not s.insvg: s.h.append((int(t[1]),s.getpos()[0], d.get('class','')))
        if t=='img': s.imgs.append(d)
        if t in VOID: return
        # nesting checks
        if t in('p',) and 'p' in [x for x in s.st[-1:]]: s.err.append(('p in p',s.getpos()))
        if t in ('div','ul','ol','h1','h2','h3','h4','p','section','dl','table','header') and s.st and s.st[-1]=='p': s.err.append((f'<{t}> inside <p>',s.getpos()))
        if t=='a' and 'a' in s.st: s.err.append(('a in a',s.getpos()))
        if t in('a','button') and 'button' in s.st: s.err.append(('interactive in button',s.getpos()))
        if t=='li' and s.st and s.st[-1] not in('ul','ol','menu'): s.err.append((f'li in {s.st[-1]}',s.getpos()))
        if t in('dt','dd') and s.st and s.st[-1] not in('dl','div'): s.err.append((f'{t} in {s.st[-1]}',s.getpos()))
        if s.st and s.st[-1] in('ul','ol') and t not in('li','script','template'): s.err.append((f'<{t}> direct child of list',s.getpos()))
        if s.st and s.st[-1]=='dl' and t not in('dt','dd','div','script','template'): s.err.append((f'<{t}> direct child of dl',s.getpos()))
        if s.st and s.st[-1]=='span' and t in('div','p','ul','ol','h1','h2','h3','h4','section') and not s.insvg: s.err.append((f'block <{t}> in span',s.getpos()))
        s.st.append(t)
    def handle_startendtag(s,t,a):
        d=dict(a)
        if 'id' in d: s.ids[d['id']]=s.ids.get(d['id'],0)+1
        if t=='img': s.imgs.append(d)
    def handle_endtag(s,t):
        if t in VOID: return
        if t=='svg': s.insvg-=1
        if not s.st or s.st[-1]!=t:
            s.err.append((f'mismatched </{t}> open={s.st[-3:]}',s.getpos()))
            if t in s.st:
                while s.st and s.st[-1]!=t: s.st.pop()
                s.st.pop()
        else: s.st.pop()
t=open(sys.argv[1],encoding='utf8').read()
p=P(); p.feed(t)
print('unclosed:',p.st); print('errors:',p.err[:30])
print('dup ids:',{k:v for k,v in p.ids.items() if v>1})
print('headings:',[(h[0],h[2]) for h in p.h])
print('imgs:',[(d.get('src'),d.get('width'),d.get('height'),d.get('alt','<<NO ALT>>')[:40],d.get('loading'),d.get('decoding')) for d in p.imgs])
print('style attrs:',[(a,b[:60]) for a,b,c in p.styles if not re.fullmatch(r'\s*(--[\w-]+\s*:\s*[^;]+;?\s*)+',b)][:20], 'count', len(p.styles))
low=t.lower()
body=t[t.find('<body'):]
for w in [r'\bAI\b', r'artificial intelligence', r'chatbot', r'\bGPT\b', r'machine learning']:
    m=re.findall(w, t if w.startswith(r'\bAI') or 'GPT' in w else low)
    print('banned',w,len(m))
for w in ['lorem','todo','fixme','placeholder','xxx','tbd','from \\$','starting at','as low as','ballpark']:
    print('scan',w,[x for x in re.findall(r'.{0,40}'+w+r'.{0,30}', body, flags=re.I)][:4])
