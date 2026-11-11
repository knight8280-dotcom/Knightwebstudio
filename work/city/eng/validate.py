import sys,re
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
PHRASING_ONLY={'p','h1','h2','h3','h4','h5','h6','span','b','strong','em','small','dt','summary','button','label'}  # may only contain phrasing (a is transparent)
BLOCK={'div','p','ul','ol','li','dl','dt','dd','section','article','aside','header','footer','nav','main','h1','h2','h3','h4','h5','h6','table','figure','details','summary','form','blockquote'}
INTERACTIVE={'a','button','details','select','input','textarea','label'}
class V(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.stack=[]; s.errs=[]; s.ids={}
    def handle_starttag(s,t,a):
        a=dict(a); line=s.getpos()[0]
        if s.stack and s.stack[-1][0]=='svg-inner': pass
        insvg=any(x[0]=='svg' for x in s.stack)
        if not insvg:
            for anc,_ in s.stack:
                if anc in ('p','h1','h2','h3','h4','span','b','strong','dt','summary','button') and t in BLOCK and not (anc in('dt','summary') and t in ('p',)):
                    # span > block is invalid; p > block invalid; a transparent
                    s.errs.append(f'line {line}: <{t}> inside <{anc}>')
            if t in ('a','button') and any(x[0] in ('a','button') for x in s.stack): s.errs.append(f'line {line}: nested interactive <{t}>')
            if t=='li' and (not s.stack or s.stack[-1][0] not in ('ul','ol','menu')): s.errs.append(f'line {line}: <li> not directly in list (parent {s.stack[-1][0] if s.stack else None})')
            if t in('dt','dd') and (not s.stack or s.stack[-1][0] not in ('dl','div')): s.errs.append(f'line {line}: <{t}> parent {s.stack[-1][0]}')
            if s.stack and s.stack[-1][0] in ('ul','ol') and t!='li': s.errs.append(f'line {line}: <{t}> directly in <{s.stack[-1][0]}>')
            if s.stack and s.stack[-1][0]=='dl' and t not in ('div','dt','dd'): s.errs.append(f'line {line}: <{t}> directly in <dl>')
            if t=='img':
                for k in ('alt','width','height'):
                    if k not in a: s.errs.append(f'line {line}: img missing {k}')
            if t=='a' and not a.get('href'): s.errs.append(f'line {line}: <a> without href')
            if t=='a' and a.get('target')=='_blank' and 'noopener' not in (a.get('rel') or ''): s.errs.append(f'line {line}: target=_blank without rel=noopener')
            if 'style' in a and not re.fullmatch(r'\s*(--[\w-]+\s*:\s*[^;]+;?\s*)+',a['style']): s.errs.append(f'line {line}: style attr not custom-property-only: {a["style"]}')
            if 'id' in a:
                if a['id'] in s.ids: s.errs.append(f'line {line}: duplicate id {a["id"]}')
                s.ids[a['id']]=line
            for k in a:
                if k.startswith('on'): s.errs.append(f'line {line}: inline handler {k}')
        if t not in VOID: s.stack.append((t,line))
    def handle_startendtag(s,t,a):
        s.handle_starttag(t,a)
        if t not in VOID and s.stack and s.stack[-1][0]==t: s.stack.pop()
    def handle_endtag(s,t):
        if t in VOID: return
        if not s.stack: s.errs.append(f'line {s.getpos()[0]}: stray </{t}>'); return
        if s.stack[-1][0]==t: s.stack.pop(); return
        # implicit closes inside svg (path etc. self-closed) are handled by startendtag; anything else is a mismatch
        names=[x[0] for x in s.stack]
        if t in names:
            while s.stack and s.stack[-1][0]!=t:
                u=s.stack.pop(); s.errs.append(f'line {s.getpos()[0]}: </{t}> closes unclosed <{u[0]}> opened line {u[1]}')
            s.stack.pop()
        else: s.errs.append(f'line {s.getpos()[0]}: stray </{t}>')
for f in sys.argv[1:]:
    src=open(f,encoding='utf8').read()
    v=V(); v.feed(src); v.close()
    left=[x for x in v.stack]
    print(f.split('Knightwebstudio/')[-1], 'errors:', len(v.errs), 'unclosed:', left)
    for e in v.errs[:30]: print('   ',e)
    # placeholder / banned words / misc
    body=src[src.index('<body'):]
    main=re.search(r'<main.*?</main>',src,re.S).group(0)
    for pat in [r'lorem',r'TODO',r'FIXME',r'XXX',r'placeholder',r'\bTBD\b',r'\[your',r'example\.com',r'\bAI\b',r'artificial intelligence',r'chatbot',r'\bGPT\b',r'machine learning',r'\bfrom \$',r'starting at',r'as low as',r'ballpark',r'\$\d[\d,]*\s*[-–]\s*\$?\d']:
        m=re.findall(pat,body,re.I if pat not in (r'\bAI\b',r'\bGPT\b') else 0)
        if m: print('    pattern',pat,'->',len(m),m[:3])
    print('    <em>/<i> in main:', len(re.findall(r'<(em|i)\b',main)), '| inline style attrs in main:', re.findall(r'style="[^"]*"',main), '| <br> in main:', len(re.findall(r'<br',main)))
