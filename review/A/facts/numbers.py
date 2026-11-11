import re, sys, collections
from html.parser import HTMLParser
BASE='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline'
NEW='/home/user/Knightwebstudio'
PAGES="index.html services/index.html consulting/index.html work/index.html process/index.html pricing/index.html faq/index.html contact/index.html about/index.html start/index.html web-design-baton-rouge/index.html web-design-denham-springs/index.html web-design-gonzales/index.html web-design-prairieville/index.html privacy/index.html terms/index.html checkout/index.html checkout/success/index.html 404.html".split()
class X(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.t=[]; s.skip=0; s.body=0
    def handle_starttag(s,t,a):
        if t in('script','style'): s.skip+=1
        if t=='body': s.body=1
        a=dict(a)
        for k in('aria-label','alt','title','placeholder'):
            if a.get(k) and s.body: s.t.append(' '+a[k]+' ')
        s.t.append(' ')
    def handle_endtag(s,t):
        if t in('script','style'): s.skip-=1
        s.t.append(' ')
    def handle_data(s,d):
        if not s.skip and s.body: s.t.append(d)
def text(p):
    x=X(); x.feed(open(p,encoding='utf-8').read()); return re.sub(r'\s+',' ',''.join(x.t))
NUM=re.compile(r'\$\s?[\d,]+(?:\.\d+)?(?:\s?/\s?(?:mo|month|yr|year))?|\b\d[\d,.]*\s?(?:%|–\s?\d+\s?(?:days|weeks|months)|-\s?\d+\s?(?:days|weeks)|(?:business )?days?\b|weeks?\b|months?\b|hours?\b|minutes?\b|min\b|pages?\b|rounds?\b|requests?\b|-minute|-hour|-product|x\b)|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirty|sixty)\b[ -](?:days?|weeks?|months?|hours?|minutes?|business days?|revision|design|rounds?|pages?|strategy|calls?|steps|services|questions|categories|live|packages|fixed)|\b\d[\d,.]*\b',re.I)
for pg in PAGES:
    b=text(BASE+'/'+pg); n=text(NEW+'/'+pg)
    cb=collections.Counter(m.group(0).lower().replace(' ','') for m in NUM.finditer(b)); cn=collections.Counter(m.group(0).lower().replace(' ','') for m in NUM.finditer(n))
    lost=sorted(k for k in cb if k not in cn); added=sorted(k for k in cn if k not in cb)
    print('==',pg); print('   in baseline only:',lost); print('   in new only     :',added)
