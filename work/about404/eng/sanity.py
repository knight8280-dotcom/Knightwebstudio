import sys,re
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
BLOCK={'div','p','ul','ol','li','section','header','footer','nav','main','h1','h2','h3','h4','h5','h6','table','dl','dt','dd','figure','form','article','aside'}
PHRASING_ONLY={'p','h1','h2','h3','h4','h5','h6','span','a','b','strong','small','button'}
class C(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.st=[]; s.err=[]; s.ids={}; s.h=[]; s.insvg=0
    def handle_starttag(s,t,a):
        d=dict(a)
        if 'id' in d: s.ids[d['id']]=s.ids.get(d['id'],0)+1
        if t=='svg': s.insvg+=1
        if s.insvg:
            if t!='svg' and t in ('path','circle','rect','line','polygon','polyline','ellipse','use','stop'): return  # self-closing shapes
        # nesting rules
        if not s.insvg:
            for anc in s.st:
                if anc in ('p',) and t in BLOCK: s.err.append(f'line {s.getpos()[0]}: <{t}> inside <p>')
                if anc=='a' and t in ('a','button'): s.err.append(f'line {s.getpos()[0]}: interactive <{t}> inside <a>')
                if anc in ('span','a','h1','h2','h3','h4','b','strong') and t in BLOCK and not (anc=='a'): s.err.append(f'line {s.getpos()[0]}: block <{t}> inside <{anc}>')
            if t=='li' and (not s.st or s.st[-1] not in ('ul','ol')): s.err.append(f'line {s.getpos()[0]}: <li> not directly in ul/ol (parent {s.st[-1] if s.st else None})')
            if s.st and s.st[-1] in ('ul','ol') and t!='li': s.err.append(f'line {s.getpos()[0]}: <{t}> directly inside <{s.st[-1]}>')
            if s.st and s.st[-1]=='dl' and t not in ('div','dt','dd'): s.err.append(f'line {s.getpos()[0]}: <{t}> directly inside <dl>')
        if t in VOID: return
        s.st.append(t)
    def handle_startendtag(s,t,a):
        d=dict(a)
        if 'id' in d: s.ids[d['id']]=s.ids.get(d['id'],0)+1
    def handle_endtag(s,t):
        if t in VOID: return
        if t=='svg': s.insvg-=1
        if not s.st or s.st[-1]!=t:
            s.err.append(f'line {s.getpos()[0]}: </{t}> closes while open stack ends {s.st[-3:]}')
            if t in s.st:
                while s.st and s.st[-1]!=t: s.st.pop()
                s.st.pop()
        else: s.st.pop()
for f in sys.argv[1:]:
    c=C(); src=open(f).read(); c.feed(src)
    print(f, 'unclosed:',c.st, 'dup ids:',[k for k,v in c.ids.items() if v>1])
    for e in c.err[:30]: print('   ',e)
    # attributes
    print('   style attrs:', re.findall(r'style="[^"]*"', src)[:10])
    print('   inline handlers:', re.findall(r'\son[a-z]+="', src)[:5])
    print('   target=_blank without rel=noopener:', [m for m in re.findall(r'<a [^>]*target="_blank"[^>]*>', src) if 'noopener' not in m])
    print('   relative hrefs/srcs:', [m for m in re.findall(r'(?:href|src)="([^"]*)"', src) if not re.match(r'(/|https?:|mailto:|tel:|#|data:)', m)])
    for w in ['AI','artificial intelligence','chatbot','GPT','machine learning','lorem','TODO','FIXME','placeholder','xxx']:
        pat = r'\bAI\b' if w=='AI' else re.escape(w)
        fl = 0 if w in ('AI','GPT') else re.I
        m=re.findall(pat, src, fl)
        if m: print('   WORD',w,len(m))
    for w in ['from \$','starting at','as low as','ballpark','starting from']:
        m=re.findall(w, src, re.I)
        if m: print('   HEDGE',w,len(m))
