import re,sys,difflib,html
from html.parser import HTMLParser
R='/home/user/Knightwebstudio/'
B='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline/'
class T(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out=[]; s.skip=0; s.links=[]
    def handle_starttag(s,tag,attrs):
        if tag in('script','style','svg'): s.skip+=1
        a=dict(attrs)
        if tag=='a' and not s.skip: s.links.append(a.get('href'))
        if tag in ('p','h1','h2','h3','h4','li','div','section','ol','ul','nav','aside','br'): s.out.append('\n')
    def handle_endtag(s,tag):
        if tag in('script','style','svg'): s.skip-=1
        if tag in ('p','h1','h2','h3','h4','li','div','section','ol','ul','nav','aside'): s.out.append('\n')
    def handle_data(s,d):
        if not s.skip: s.out.append(d)
def main_of(path):
    s=open(path,encoding='utf-8').read()
    m=re.search(r'<main\b.*?</main>',s,re.S).group(0)
    m=re.sub(r'<!--.*?-->','',m,flags=re.S)
    t=T(); t.feed(m)
    txt=''.join(t.out)
    lines=[re.sub(r'\s+',' ',l).strip() for l in txt.split('\n')]
    return [l for l in lines if l], t.links
for p in ['privacy/index.html','terms/index.html','checkout/index.html','checkout/success/index.html']:
    a,la=main_of(B+p); b,lb=main_of(R+p)
    print('=====',p)
    wa=' '.join(a).split(); wb=' '.join(b).split()
    print('words baseline',len(wa),'new',len(wb))
    sm=difflib.SequenceMatcher(None,wa,wb,autojunk=False)
    for op,i1,i2,j1,j2 in sm.get_opcodes():
        if op!='equal':
            print(' ',op,'| OLD:',' '.join(wa[i1:i2])[:300],'| NEW:',' '.join(wb[j1:j2])[:400])
    print(' links baseline:',la)
    print(' links new     :',lb)
    print(' missing links :',[x for x in la if x not in lb])
    print(' added links   :',[x for x in lb if x not in la])
