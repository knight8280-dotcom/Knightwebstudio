import re, json, html
R='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh'
def qa(path):
    s=open(path,encoding='utf-8').read()
    out=[]
    for m in re.finditer(r'<details[^>]*>\s*<summary>(.*?)</summary>\s*<div class="faq-body">(.*?)</div>\s*</details>',s,re.S):
        q=html.unescape(re.sub(r'<[^>]+>','',m.group(1))).strip()
        a=html.unescape(re.sub(r'<[^>]+>','',m.group(2))); a=' '.join(a.split())
        out.append((q,a))
    ld=[]
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):
        try: d=json.loads(m.group(1))
        except Exception as e: print('bad json',e); continue
        def walk(x):
            if isinstance(x,dict):
                if x.get('@type')=='Question': ld.append((x['name'].strip(),' '.join(x['acceptedAnswer']['text'].split())))
                for v in x.values(): walk(v)
            elif isinstance(x,list):
                for v in x: walk(v)
        walk(d)
    return out, ld
new,ldn=qa('/home/user/Knightwebstudio/faq/index.html'); old,ldo=qa(f'{R}/baseline/faq/index.html')
print(len(new),len(old),len(ldn),len(ldo))
print('JSON-LD identical to baseline:',ldn==ldo)
print('page QA set identical to baseline page:',dict(new)==dict(old))
print('page QA identical to JSON-LD:',dict(new)==dict(ldn))
for q,a in new:
    if dict(ldn).get(q)!=a: print('MISMATCH vs LD',q); print('  page:',a); print('  ld:  ',dict(ldn).get(q))
print('order new:'); [print('  ',q) for q,_ in new]
print('order ld:'); [print('  ',q) for q,_ in ldn]
