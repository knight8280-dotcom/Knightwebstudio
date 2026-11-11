import re, sys, html
from html.parser import HTMLParser
class T(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.out=[]; s.skip=0; s.inmain=False
    def handle_starttag(s,t,a):
        if t=='main': s.inmain=True
        if t in('script','style','svg'): s.skip+=1
        if t in ('p','li','h1','h2','h3','h4','div','section','dt','dd','a','figcaption','br','span','b'): s.out.append(' ')
    def handle_endtag(s,t):
        if t=='main': s.inmain=False
        if t in('script','style','svg'): s.skip-=1
        if t in ('p','li','h1','h2','h3','h4','div','section','dt','dd','figcaption'): s.out.append('\n')
    def handle_data(s,d):
        if s.inmain and not s.skip: s.out.append(d)
def text(path):
    src=open(path,encoding='utf-8').read()
    p=T(); p.feed(src)
    t=''.join(p.out)
    lines=[re.sub(r'\s+',' ',l).strip() for l in t.split('\n')]
    return [l for l in lines if l]
if __name__=='__main__':
    for l in text(sys.argv[1]): print(l)
