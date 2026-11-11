import re,sys
from html.parser import HTMLParser
VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
SVGSELF={'path','circle','rect','line','polygon','polyline','ellipse','use','stop'}
BLOCK={'div','p','ul','ol','li','section','nav','aside','header','footer','main','h1','h2','h3','h4','table','form','figure','dl'}
class P(HTMLParser):
    def __init__(s): super().__init__(convert_charrefs=True); s.stack=[]; s.errs=[]; s.ids={}
    def handle_starttag(s,tag,attrs):
        a=dict(attrs)
        if 'id' in a: s.ids[a['id']]=s.ids.get(a['id'],0)+1
        if 'style' in a and not re.fullmatch(r'\s*(--[\w-]+\s*:\s*[^;]+;?\s*)+',a['style']): s.errs.append(('inline style',s.getpos(),a['style'][:60]))
        if tag in VOID: return
        if tag in BLOCK and s.stack and s.stack[-1] in ('p','span','a','b','strong') and not (s.stack[-1]=='a'):
            s.errs.append(('block in inline/p',s.getpos(),tag+' inside '+s.stack[-1]))
        if tag in ('a','button') and any(x in ('a','button') for x in s.stack): s.errs.append(('nested interactive',s.getpos(),tag))
        s.stack.append(tag)
    def handle_startendtag(s,tag,attrs):
        pass
    def handle_endtag(s,tag):
        if tag in VOID: return
        if not s.stack or s.stack[-1]!=tag:
            s.errs.append(('mismatch',s.getpos(),'</%s> but open: %s'%(tag,s.stack[-4:])))
            if tag in s.stack:
                while s.stack and s.stack[-1]!=tag: s.stack.pop()
                s.stack.pop()
        else: s.stack.pop()
for p in ['privacy/index.html','terms/index.html','checkout/index.html','checkout/success/index.html']:
    src=open('/home/user/Knightwebstudio/'+p,encoding='utf-8').read()
    # blank script/style contents so html.parser does not trip
    src2=re.sub(r'(<script\b[^>]*>).*?(</script>)',r'\1\2',src,flags=re.S)
    src2=re.sub(r'(<noscript>)(.*?)(</noscript>)',r'\2',src2,flags=re.S)
    q=P(); q.feed(src2)
    print(p,'| unclosed at end:',q.stack,'| errors:',q.errs[:8],'| dup ids:',[k for k,v in q.ids.items() if v>1])
    body=src[src.index('<body'):]
    print('   placeholder text:',re.findall(r'(?i)lorem|todo|tbd|xxx|placeholder text|fixme',re.sub(r'<script.*?</script>','',body,flags=re.S))[:5],
          '| banned words:',re.findall(r'(?<![A-Za-z])(AI|artificial intelligence|chatbot|GPT|machine learning)(?![A-Za-z])',re.sub(r'<script.*?</script>','',src,flags=re.S))[:5],
          '| body tag:',re.search(r'<body[^>]*>',src).group(0),
          '| main.js:',len(re.findall(r'/assets/js/main\.js',src)),'| stripe.js:',re.findall(r'<script[^>]*js\.stripe\.com[^>]*>',src))
    print('   hedged price words in main:',re.findall(r'(?i)\b(from \$|starting at|as low as|ballpark)',re.search(r'<main.*?</main>',src,re.S).group(0)))
