import re, json, sys, hashlib
BASE='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/baseline'
NEW='/home/user/Knightwebstudio'
PAGES="index.html services/index.html consulting/index.html work/index.html process/index.html pricing/index.html faq/index.html contact/index.html about/index.html start/index.html web-design-baton-rouge/index.html web-design-denham-springs/index.html web-design-gonzales/index.html web-design-prairieville/index.html privacy/index.html terms/index.html checkout/index.html checkout/success/index.html 404.html".split()
def parts(src):
    head=src[:src.index('</head>')] if '</head>' in src else src
    d={}
    d['title']=re.findall(r'<title>.*?</title>',src,re.S)
    d['desc']=re.findall(r'<meta\s+name="description"[^>]*>',src)
    d['canonical']=re.findall(r'<link\s+rel="canonical"[^>]*>',src)
    d['og']=re.findall(r'<meta\s+property="og:[^>]*>',src)
    d['twitter']=re.findall(r'<meta\s+name="twitter:[^>]*>',src)
    d['robots']=re.findall(r'<meta\s+name="robots"[^>]*>',src)
    d['jsonld']=re.findall(r'<script type="application/ld\+json">.*?</script>',src,re.S)
    d['lang']=re.findall(r'<html[^>]*>',src)
    d['othermeta']=sorted(re.findall(r'<meta\s+[^>]*>',head))
    d['links']=sorted(re.findall(r'<link\s+[^>]*>',head))
    return d
for pg in PAGES:
    a=parts(open(BASE+'/'+pg,encoding='utf-8').read()); b=parts(open(NEW+'/'+pg,encoding='utf-8').read())
    res=[]
    for k in ('title','desc','canonical','og','twitter','robots','jsonld'):
        res.append('%s:%s(%d)'%(k,'=' if a[k]==b[k] else 'DIFF',len(b[k])))
    print(pg.ljust(42),' '.join(res))
    for k in ('lang','othermeta','links'):
        if a[k]!=b[k]:
            for x in a[k]:
                if x not in b[k]: print('     -',k,x[:200])
            for x in b[k]:
                if x not in a[k]: print('     +',k,x[:200])
    # jsonld validity and types
    types=[]
    for m in b['jsonld']:
        j=json.loads(re.sub(r'^<script[^>]*>|</script>$','',m))
        objs=j if isinstance(j,list) else j.get('@graph',[j])
        types+= [str(o.get('@type')) for o in objs]
    print('     jsonld types:',types)
