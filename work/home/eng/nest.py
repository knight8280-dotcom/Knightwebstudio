import re, sys
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
PHRASING_ONLY={'p','span','b','i','strong','small','a?','h1','h2','h3','h4','button','label','dt?'}
BLOCK={'div','p','ul','ol','li','section','header','footer','figure','figcaption','blockquote','h1','h2','h3','h4','dl','dt','dd','table','article','aside','nav','main','form'}
class V(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.st=[]; s.err=[]; s.insvg=0
    def handle_starttag(s,t,a):
        if t=='svg': s.insvg+=1
        if s.insvg and t!='svg':
            if not s.rawtext().endswith('/>'): s.st.append((t,s.getpos()))
            return
        if t in VOID: return
        # block inside p / span / heading / button
        for anc,_ in s.st:
            if anc in ('p','span','b','strong','small','h1','h2','h3','h4','button','label','i','dt') and t in BLOCK and t not in ('span',):
                s.err.append(f'{s.getpos()}: <{t}> inside <{anc}>')
            if anc=='a' and t in ('a','button'): s.err.append(f'{s.getpos()}: interactive <{t}> inside <a>')
        if s.st and s.st[-1][0] in ('ul','ol') and t not in ('li','script','template'): s.err.append(f'{s.getpos()}: <{t}> directly in <{s.st[-1][0]}>')
        if t=='li' and (not s.st or s.st[-1][0] not in ('ul','ol','menu')): s.err.append(f'{s.getpos()}: <li> outside list (parent {s.st[-1][0] if s.st else None})')
        s.st.append((t,s.getpos()))
    def rawtext(s): return s.get_starttag_text() or ''
    def handle_startendtag(s,t,a): pass
    def handle_endtag(s,t):
        if t in VOID: return
        if not s.st: s.err.append(f'{s.getpos()}: stray </{t}>'); return
        if s.st[-1][0]!=t:
            s.err.append(f'{s.getpos()}: </{t}> closes while <{s.st[-1][0]}> (opened {s.st[-1][1]}) is open')
            # recover
            for i in range(len(s.st)-1,-1,-1):
                if s.st[i][0]==t: del s.st[i:]; break
        else: s.st.pop()
        if t=='svg': s.insvg-=1
src=open(sys.argv[1],encoding='utf-8').read()
v=V(); v.feed(src); v.close()
print('errors:',len(v.err)); [print('  ',e) for e in v.err[:40]]
print('unclosed at end:', v.st[:10])
