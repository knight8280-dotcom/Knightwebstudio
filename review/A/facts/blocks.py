import re, sys
from html.parser import HTMLParser
BASE='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline'
NEW='/home/user/Knightwebstudio'
BLOCK=set("p div section article header footer main nav aside h1 h2 h3 h4 h5 h6 ul ol li dl dt dd table thead tbody tfoot tr td th caption figure figcaption form fieldset legend label select option textarea button details summary blockquote address br hr pre a span b strong small".split())
class X(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out=[]; s.cur=[]; s.skip=0; s.main=0
    def fl(s):
        t=re.sub(r'\s+',' ',''.join(s.cur)).strip(); s.cur=[]
        if t and s.main: s.out.append(t)
    def handle_starttag(s,t,a):
        if t in('script','style','svg'): s.skip+=1
        if t in BLOCK-{'a','span','b','strong','small'}: s.fl()
        if t=='main': s.main=1
    def handle_endtag(s,t):
        if t in('script','style','svg'): s.skip-=1
        if t in BLOCK-{'a','span','b','strong','small'}: s.fl()
        if t=='main': s.fl(); s.main=0
    def handle_data(s,d):
        if not s.skip: s.cur.append(d)
def blocks(p):
    x=X(); x.feed(open(p,encoding='utf-8').read()); x.fl(); return x.out
def squash(t): return re.sub(r'[^a-z0-9$%]+','',t.lower())
for pg in sys.argv[1:]:
    b=blocks(BASE+'/'+pg); n=blocks(NEW+'/'+pg)
    bj=squash(' '.join(b)); nj=squash(' '.join(n))
    print('=====',pg)
    for t in b:
        # split into sentences
        for sent in re.split(r'(?<=[.?!])\s+',t):
            if squash(sent) and squash(sent) not in nj: print('  BASE ONLY:',sent)
    for t in n:
        for sent in re.split(r'(?<=[.?!])\s+',t):
            if squash(sent) and squash(sent) not in bj: print('  NEW ONLY :',sent)
