import re, sys
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr','path','circle','rect','line','polyline','polygon','ellipse','use','stop'}
PHRASING={'a','abbr','b','bdi','bdo','br','button','cite','code','data','em','i','img','input','kbd','label','mark','q','s','samp','small','span','strong','sub','sup','time','u','var','wbr','svg','select','textarea'}
PONLY={'p','h1','h2','h3','h4','h5','h6','span','b','i','strong','small','s','label','legend','summary','a','button','caption','th' }  # elements that may hold only phrasing (th/td can hold flow, th excluded below)
class C(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.stack=[]; s.errs=[]; s.counts={}; s.attrs_seen=[]
    def handle_starttag(s, tag, attrs):
        line=s.getpos()[0]; a=dict(attrs)
        s.counts[tag]=s.counts.get(tag,0)+1
        keys=[k for k,_ in attrs]
        if len(keys)!=len(set(keys)): s.errs.append(f'line {line}: duplicate attribute on <{tag}>')
        if 'style' in a and not re.fullmatch(r'\s*(--[\w-]+\s*:\s*[^;]+;?\s*)+', a['style'] or ''): s.errs.append(f'line {line}: style attribute not only custom properties: {a["style"]}')
        for k in a:
            if k.startswith('on') and not (tag=='form' and k=='onsubmit'): s.errs.append(f'line {line}: inline handler {k} on <{tag}>')
        parent=s.stack[-1][0] if s.stack else None
        insvg=any(t=='svg' for t,_ in s.stack)
        if not insvg:
            # phrasing-only parents
            for t,l in s.stack:
                if t in ('p','h1','h2','h3','h4','h5','h6','span','b','strong','small','label','legend','summary','button') and tag not in PHRASING:
                    s.errs.append(f'line {line}: <{tag}> inside <{t}> (opened line {l}) - not phrasing content'); break
            if tag=='a' and any(t=='a' for t,_ in s.stack): s.errs.append(f'line {line}: nested <a>')
            if tag in ('a','button','input','select','textarea','summary','details') and any(t in ('a','button') for t,_ in s.stack): s.errs.append(f'line {line}: interactive <{tag}> inside interactive')
            if tag=='li' and parent not in ('ul','ol','menu'): s.errs.append(f'line {line}: <li> parent is <{parent}>')
            if parent in ('ul','ol') and tag not in ('li','script','template'): s.errs.append(f'line {line}: <{tag}> directly inside <{parent}>')
            if tag in ('dt','dd') and parent not in ('dl','div'): s.errs.append(f'line {line}: <{tag}> parent <{parent}>')
            if parent=='dl' and tag not in ('dt','dd','div'): s.errs.append(f'line {line}: <{tag}> in dl')
            if tag in ('tr',) and parent not in ('thead','tbody','tfoot','table'): s.errs.append(f'line {line}: tr parent {parent}')
            if tag in ('td','th') and parent!='tr': s.errs.append(f'line {line}: {tag} parent {parent}')
            if tag=='figcaption' and parent!='figure': s.errs.append(f'line {line}: figcaption parent {parent}')
            if tag=='legend' and parent!='fieldset': s.errs.append(f'line {line}: legend parent {parent}')
            if tag=='summary' and parent!='details': s.errs.append(f'line {line}: summary parent {parent}')
            if tag=='caption' and parent!='table': s.errs.append(f'line {line}: caption parent {parent}')
            if tag in ('header','footer') and any(t in ('header','footer','address') for t,_ in s.stack): s.errs.append(f'line {line}: <{tag}> inside header/footer')
            if tag=='main' and s.stack and any(t in ('article','aside','footer','header','nav') for t,_ in s.stack): s.errs.append(f'line {line}: main inside sectioning')
        if tag not in VOID: s.stack.append((tag,line))
    def handle_startendtag(s, tag, attrs):
        s.handle_starttag(tag, attrs)
        if tag not in VOID and s.stack and s.stack[-1][0]==tag: s.stack.pop()
    def handle_endtag(s, tag):
        line=s.getpos()[0]
        if tag in VOID: return
        if not s.stack: s.errs.append(f'line {line}: stray </{tag}>'); return
        if s.stack[-1][0]!=tag:
            names=[t for t,_ in s.stack]
            if tag in names:
                while s.stack[-1][0]!=tag: t,l=s.stack.pop(); s.errs.append(f'line {line}: </{tag}> closes unclosed <{t}> opened line {l}')
                s.stack.pop()
            else: s.errs.append(f'line {line}: stray </{tag}> (open: {names[-3:]})')
        else: s.stack.pop()
src=open(sys.argv[1],encoding='utf-8').read()
c=C(); c.feed(src); c.close()
for t,l in c.stack: c.errs.append(f'unclosed <{t}> opened line {l}')
print(sys.argv[1].split('/')[-2:], 'errors:', len(c.errs))
for e in c.errs[:40]: print('  ', e)
# other text checks
main=re.search(r'<main\b.*?</main>', src, re.S).group(0)
print('placeholder text:', re.findall(r'(?i)lorem|ipsum|TODO|FIXME|XXX|placeholder|tbd\b|\?\?\?', main))
print('banned words:', re.findall(r'(?i)\bAI\b|artificial intelligence|chatbot|\bGPT\b|machine learning', src))
print('hedged prices:', re.findall(r'(?i)(?:from|starting at|as low as|ballpark|up to)\s+\$[\d,]+|\$[\d,]+\s*(?:-|–|to)\s*\$[\d,]+|\$[\d,]+\+', re.sub(r'<[^>]+>',' ',main)))
print('em/i emphasis:', re.findall(r'<(?:em|i)\b[^>]*>[^<]+</(?:em|i)>', main)[:5])
print('inline style attrs:', sorted(set(re.findall(r'style="([^"]*)"', main))))
print('ids:', re.findall(r'\bid="([^"]+)"', main))
print('data-booking in main:', len(re.findall(r'data-booking', main)))
print('non-root-absolute internal hrefs:', [h for h in re.findall(r'href="([^"]+)"', main) if not re.match(r'(/|#|tel:|mailto:|https?://)', h)])
print('smart punctuation mix:', {k: main.count(k) for k in ["'", "’", '"', '“', '—', '–', '×', '&nbsp;', '·']})
