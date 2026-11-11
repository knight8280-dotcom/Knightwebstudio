import re, json, html
R='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
b=open(R+'/baseline/consulting/index.html',encoding='utf-8').read()
n=open('/home/user/Knightwebstudio/consulting/index.html',encoding='utf-8').read()
def head(s): return s[:s.index('</head>')]
hb, hn = head(b), head(n)
def grab(s, pat): return re.findall(pat, s, re.S)
for label, pat in [('title', r'<title>.*?</title>'), ('meta desc', r'<meta name="description"[^>]*>'), ('canonical', r'<link rel="canonical"[^>]*>'), ('og', r'<meta property="og:[^>]*>'), ('twitter', r'<meta name="twitter:[^>]*>'), ('jsonld', r'<script type="application/ld\+json">.*?</script>'), ('robots', r'<meta name="robots"[^>]*>')]:
    print(label, 'SAME' if grab(hb,pat)==grab(hn,pat) else 'DIFFERENT', len(grab(hb,pat)), len(grab(hn,pat)))
# head line diff
import difflib
d=[l for l in difflib.unified_diff(hb.splitlines(), hn.splitlines(), lineterm='', n=0) if not l.startswith(('---','+++','@@'))]
print('\n'.join(x[:260] for x in d))
# FAQ wording
def faq(s):
    return [(html.unescape(re.sub(r'<[^>]+>','',q)).strip(), html.unescape(re.sub(r'<[^>]+>','',a)).strip()) for q,a in re.findall(r'<summary>(.*?)</summary>\s*<div class="faq-body">(.*?)</div>', s, re.S)]
fb, fn = faq(b), faq(n)
print('FAQ same wording:', fb==fn, len(fb), len(fn))
# JSON-LD FAQ vs page
for blk in grab(hn, r'<script type="application/ld\+json">(.*?)</script>'):
    try: j=json.loads(blk)
    except Exception as e: print('jsonld parse error', e); continue
    items = j if isinstance(j,list) else j.get('@graph',[j])
    for it in items:
        print(' jsonld type:', it.get('@type'))
        if it.get('@type')=='FAQPage':
            ld=[(q['name'], q['acceptedAnswer']['text']) for q in it['mainEntity']]
            print('  FAQ jsonld == page:', ld==fn)
            for (a,b2),(c,d2) in zip(ld,fn):
                if a!=c or b2!=d2: print('   DIFF', a, '|', c)
        if it.get('@type') in ('Service','OfferCatalog','Product'):
            print('  ', json.dumps(it)[:600])
# main in sync with page?
m=open(R+'/pages/consulting/main.html',encoding='utf-8').read().strip()
pm=re.search(r'<main\b.*?</main>', n, re.S).group(0)
print('page main == main.html:', pm.strip()==m, len(pm), len(m))
