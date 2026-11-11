import json, re, collections
rules = json.load(open('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/integrate/verify/cssrules.json'))
aud = json.load(open('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/integrate/verify/cssaudit.json'))
css = open('/home/user/Knightwebstudio/assets/css/styles.css').read()
# find index of first page rule
first = next(i for i, r in enumerate(rules) if '[data-page' in r['sel'])
print('first data-page rule index', first, rules[first]['sel'])
def split(s):
    parts=[];d=0;cur=''
    for ch in s:
        if ch in '([': d+=1
        if ch in ')]': d-=1
        if ch==',' and d==0: parts.append(cur.strip()); cur=''
        else: cur+=ch
    if cur.strip(): parts.append(cur.strip())
    return parts
# scoping
bad=[]
for i,r in enumerate(rules):
    for s in split(r['sel']):
        has = '[data-page' in s
        if i>=first and not has: bad.append((i,s))
        if i<first and has: bad.append((i,'SHARED-HAS-PAGE '+s))
        if has and not re.match(r'^(\.js |html:not\(\.js\) )?\[data-page[\^]?="[a-z-]+"\]', s): bad.append((i,'NOT-LEADING '+s))
print('scoping problems:', bad)
# hex/rgb in page part
pg = css[css.index('PAGES\n'):]
print('hex in pages:', re.findall(r'#[0-9a-fA-F]{3,8}\b', re.sub(r'/\*.*?\*/','',pg,flags=re.S)))
print('rgb in pages:', re.findall(r'rgba?\([^)]*\)', pg))
print('raw px in pages:', sorted(set(re.findall(r'[\d.]+px', re.sub(r'/\*.*?\*/','',pg,flags=re.S)))))
print('raw s/ms in pages:', sorted(set(re.findall(r'(?<![\w-])[\d.]+m?s\b', re.sub(r'/\*.*?\*/','',pg,flags=re.S)))))
sh = css[:css.index('PAGES\n')]
shn = re.sub(r'/\*.*?\*/','',sh,flags=re.S)
# hex in shared outside token section 02 and print
body = re.sub(r'/\*.*?\*/','',sh[sh.index('/* == 03 Base'):],flags=re.S)
print('hex in shared after tokens:', re.findall(r'#[0-9a-fA-F]{3,8}\b', body))
print('rgba in shared after tokens:', re.findall(r'rgba?\([^)]*\)', body))
# hover outside (hover: hover)
for r in rules:
    if ':hover' in r['sel'] and 'hover: hover' not in r['ctx']:
        print('HOVER UNGUARDED:', r['sel'], '|', r['ctx'])
# duplicates across page blocks
norm = collections.defaultdict(list)
for i,r in enumerate(rules[first:]):
    for s in split(r['sel']):
        m = re.search(r'\[data-page[\^]?="([a-z-]+)"\]', s)
        key = (re.sub(r'\[data-page[\^]?="[a-z-]+"\]','[P]',s), r['ctx'], r['decl'])
        norm[key].append(m.group(1))
print('--- identical rule on more than one page block:')
for k,v in norm.items():
    if len(set(v))>1: print('  ', sorted(set(v)), k[0], '{', k[2][:110], '}', k[1])
# same declarations (ignoring selector) repeated in 2+ page blocks, decl length > 60
bydecl = collections.defaultdict(set)
for r in rules[first:]:
    m = re.search(r'\[data-page[\^]?="([a-z-]+)"\]', r['sel'])
    if len(r['decl'])>70: bydecl[r['decl']].add((m.group(1), r['sel'][:90]))
print('--- same long declaration block in 2+ pages:')
for d,v in bydecl.items():
    if len(set(x[0] for x in v))>1: print('  ', sorted(v), '{', d[:140], '}')
# page-block rule identical to a shared rule's declarations
shared = collections.defaultdict(list)
for r in rules[:first]:
    shared[r['decl']].append((r['sel'][:80], r['ctx']))
print('--- page rule whose declarations equal a shared rule (len>50):')
for r in rules[first:]:
    if len(r['decl'])>50 and r['decl'] in shared:
        print('  ', r['sel'][:90], '|', r['ctx'], '==', shared[r['decl']][:2], '{', r['decl'][:100])
# shared selectors that match on one data-page only
hits = aud['hits']
slug = {'/':'home','/checkout/?plan=starter-deposit':'checkout','/checkout/':'checkout','/checkout/success/':'checkout-success','/404.html':'notfound','/web-design-baton-rouge/':'city','/web-design-denham-springs/':'city','/web-design-gonzales/':'city','/web-design-prairieville/':'city'}
one = collections.defaultdict(list)
shared_sels=set()
for r in rules[:first]:
    for s in split(r['sel']): shared_sels.add(s)
for s in shared_sels:
    pages = set(slug.get(p, p.strip('/')) for p in hits.get(s, []))
    if len(pages)==1: one[list(pages)[0]].append(s)
print('--- shared selectors matching one page only:')
for k,v in sorted(one.items()): print('  ', k, len(v), v[:40])
