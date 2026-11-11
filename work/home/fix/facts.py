# Compare the visible text of the live (baseline) home page's <main> with the new one: figures, and sentences.
import re, sys, html
from html.parser import HTMLParser
class T(HTMLParser):
    def __init__(s): super().__init__(); s.out=[]; s.skip=0; s.inmain=0
    def handle_starttag(s, tag, attrs):
        a = dict(attrs)
        if tag == 'main': s.inmain = 1
        if tag in ('script','style','svg'): s.skip += 1
        if tag in ('p','li','h1','h2','h3','h4','div','section','dt','dd','figcaption','blockquote','a','span','br'): s.out.append('\n' if tag not in ('span','a') else ' ')
        if s.inmain and not s.skip and a.get('aria-label'): s.out.append(' [' + a['aria-label'] + '] ')
        if s.inmain and not s.skip and a.get('alt'): s.out.append(' [' + a['alt'] + '] ')
    def handle_endtag(s, tag):
        if tag == 'main': s.inmain = 0
        if tag in ('script','style','svg'): s.skip -= 1
        if tag in ('p','li','h1','h2','h3','h4','div','section','dt','dd','figcaption','blockquote'): s.out.append('\n')
    def handle_data(s, d):
        if s.inmain and not s.skip: s.out.append(d)
    def handle_comment(s, d): pass
def text(path):
    t = T(); t.feed(open(path, encoding='utf-8').read()); x = ''.join(t.out)
    x = x.replace('–','-').replace('—','-').replace('’',"'").replace(' ',' ')
    lines = [re.sub(r'\s+', ' ', l).strip() for l in x.split('\n')]
    return [l for l in lines if l]
old = text('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline/index.html')
new = text('/home/user/Knightwebstudio/index.html')
num = lambda ls: sorted(set(re.findall(r'\$[\d,]+(?:/mo)?|\b\d[\d,.]*(?:-\d+)?(?:\s?(?:days?|weeks?|months?|minutes?|hours?|%|x))?', ' '.join(ls))))
on, nn = num(old), num(new)
print('FIGURES only on the live page:', [x for x in on if x not in nn])
print('FIGURES only on the new page :', [x for x in nn if x not in on])
if '--text' in sys.argv:
    print('\n== LIVE =='); print('\n'.join(old)); print('\n== NEW =='); print('\n'.join(new))
