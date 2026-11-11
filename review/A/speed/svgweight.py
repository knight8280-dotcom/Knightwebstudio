import re, sys, gzip, hashlib, collections
root = sys.argv[1]
pages = "index.html services/index.html consulting/index.html work/index.html process/index.html pricing/index.html faq/index.html contact/index.html about/index.html start/index.html web-design-baton-rouge/index.html web-design-denham-springs/index.html web-design-gonzales/index.html web-design-prairieville/index.html privacy/index.html terms/index.html checkout/index.html checkout/success/index.html 404.html".split()
for p in pages:
    s = open(f"{root}/{p}", encoding="utf-8").read()
    svgs = re.findall(r"<svg\b.*?</svg>", s, flags=re.S)
    tot = sum(len(x.encode()) for x in svgs)
    head = s.split("<body")[0]
    jsonld = sum(len(x) for x in re.findall(r'<script type="application/ld\+json">.*?</script>', s, flags=re.S))
    # strip ids/classes to detect dup drawings
    def norm(x):
        x = re.sub(r'\s(id|class|aria-[a-z]+|role|width|height|focusable)="[^"]*"', '', x)
        x = re.sub(r'url\(#[^)]+\)', 'url()', x)
        x = re.sub(r'href="#[^"]+"', 'href=""', x)
        return x
    c = collections.Counter(hashlib.md5(norm(x).encode()).hexdigest() for x in svgs)
    dups = []
    seen = {}
    for x in svgs:
        h = hashlib.md5(norm(x).encode()).hexdigest()
        if c[h] > 1 and h not in seen:
            seen[h] = 1
            dups.append((c[h], len(x), x[:110].replace("\n"," ")))
    wasted = sum((n-1)*l for n,l,_ in dups)
    print(f"{p:42s} html={len(s.encode()):6d} svg={tot:6d} ({100*tot//len(s.encode())}%) n={len(svgs):2d} jsonld={jsonld:6d} head={len(head.encode()):6d} dup_wasted={wasted}")
    for n,l,pre in sorted(dups, key=lambda d:-d[0]*d[1]):
        print(f"      x{n} {l:6d}B  {pre}")
