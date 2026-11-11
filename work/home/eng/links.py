import re,sys
def links(path, scope='main'):
    s=open(path,encoding='utf-8').read()
    s=re.sub(r'<!--.*?-->','',s,flags=re.S)
    if scope=='main':
        m=re.search(r'<main.*?</main>',s,re.S); s=m.group(0)
    out=[]
    for m in re.finditer(r'<a\b([^>]*)>(.*?)</a>',s,re.S):
        attrs=m.group(1); href=re.search(r'href="([^"]*)"',attrs)
        txt=re.sub(r'<[^>]+>','',re.sub(r'<svg.*?</svg>','',m.group(2),flags=re.S)); txt=re.sub(r'\s+',' ',txt).strip()
        out.append((href.group(1) if href else None, txt, 'data-booking' in attrs, 'target="_blank"' in attrs, 'rel="noopener"' in attrs))
    return out
B=links('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline/index.html')
N=links('/home/user/Knightwebstudio/index.html')
print('BASELINE main'); 
for l in B: print('  ',l)
print('NEW main')
for l in N: print('  ',l)
bh=set(l[0] for l in B); nh=set(l[0] for l in N)
print('in baseline main, not in new main:', sorted(bh-nh))
print('in new main, not in baseline main:', sorted(nh-bh))
NA=links('/home/user/Knightwebstudio/index.html','all'); BA=links('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline/index.html','all')
print('baseline whole-page hrefs missing from new whole page:', sorted(set(l[0] for l in BA)-set(l[0] for l in NA)))
print('new whole-page hrefs not in baseline whole page:', sorted(set(l[0] for l in NA)-set(l[0] for l in BA)))
s=open('/home/user/Knightwebstudio/index.html').read()
ids=set(re.findall(r'\bid="([^"]+)"',re.sub(r'<!--.*?-->','',s,flags=re.S)))
for l in NA:
    if l[0] and l[0].startswith('#') and l[0][1:] not in ids: print('BROKEN ANCHOR', l)
bs=open('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline/index.html').read()
bids=set(re.findall(r'\bid="([^"]+)"',re.sub(r'<!--.*?-->','',bs,flags=re.S)))
print('baseline section ids lost:', sorted(i for i in bids-ids if not re.match(r'(pc-|c[fh]-|sh-|fc-)',i)))
print('new ids:', sorted(i for i in ids-bids))
