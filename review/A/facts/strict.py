import re, sys
from html.parser import HTMLParser
BASE='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline'
NEW='/home/user/Knightwebstudio'
BL=set("p div section article header footer main nav aside h1 h2 h3 h4 h5 h6 ul ol li dl dt dd table tr td th caption figure figcaption details summary blockquote".split())
class X(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out=[]; s.cur=[]; s.skip=0; s.main=0; s.hid=[]
    def fl(s):
        t=re.sub(r'\s+',' ',''.join(s.cur)).strip(); s.cur=[]
        if t and s.main: s.out.append(t)
    def handle_starttag(s,t,a):
        a=dict(a)
        if t in('script','style','svg'): s.skip+=1
        if t in BL: s.fl()
        if t=='main': s.main=1
        if t=='br': s.cur.append(' ')
    def handle_endtag(s,t):
        if t in('script','style','svg'): s.skip-=1
        if t in BL: s.fl()
        if t=='main': s.fl(); s.main=0
    def handle_data(s,d):
        if not s.skip: s.cur.append(d)
def blocks(p):
    x=X(); x.feed(open(p,encoding='utf-8').read()); x.fl(); return x.out
for pg in sys.argv[1:]:
    b=blocks(BASE+'/'+pg); n=blocks(NEW+'/'+pg)
    nj=' \n '.join(n)
    miss=[]
    for t in b:
        if t in nj: continue
        # try sentence level exact
        for sent in re.split(r'(?<=[.?!])\s+',t):
            if sent not in nj: miss.append(sent)
    print('==',pg,'baseline blocks',len(b),'| not found verbatim (after whitespace normalisation):',len(miss))
    for m in miss: print('     ',m[:200])
