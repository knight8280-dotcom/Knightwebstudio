import re, sys, collections
css = open('/home/user/Knightwebstudio/assets/css/styles.css', encoding='utf-8').read()
raw = len(css)
nc = re.sub(r'/\*.*?\*/', lambda m: ' ' * 0, css, flags=re.S)
print('bytes', raw, 'comments', raw - len(nc), 'lines', css.count('\n'))
# tokenise into (context stack, selector, body) for leaf blocks
out = []; stack = []; buf = ''; i = 0
while i < len(nc):
    c = nc[i]
    if c == '{':
        stack.append(buf.strip()); buf = ''
    elif c == '}':
        body = buf.strip(); sel = stack.pop() if stack else '?'
        if body and '{' not in body: out.append((tuple(stack), sel, body))
        buf = ''
    else: buf += c
    i += 1
print('leaf blocks', len(out))
# 1. same property twice in one block
same_val = []; fallback = 0
for ctx, sel, body in out:
    if sel.startswith('@') and not sel.startswith('@font-face') and not sel.startswith('@page'): pass
    decls = [d.strip() for d in re.split(r';(?![^(]*\))', body) if d.strip() and ':' in d]
    seen = {}
    for d in decls:
        p, v = d.split(':', 1); p = p.strip(); v = v.strip()
        if p in seen:
            if seen[p] == v: same_val.append((ctx, sel, p, v))
            else: fallback += 1
        seen[p] = v
print('property repeated with a DIFFERENT value in one block (fallback pattern):', fallback)
print('property repeated with the SAME value in one block:', len(same_val))
for x in same_val[:20]: print('   ', x)
# 2. identical (context, selector) appearing more than once
by = collections.defaultdict(list)
for ctx, sel, body in out:
    if sel.startswith('@') or re.match(r'^(from|to|\d+%)', sel): continue
    by[(ctx, re.sub(r'\s+', ' ', sel))].append(body)
rep = {k: v for k, v in by.items() if len(v) > 1}
print('selector written more than once in the same context:', len(rep))
# of those, declarations that are exactly repeated (same prop+value in two blocks for the same selector)
exact = []
for (ctx, sel), bodies in rep.items():
    seen = collections.Counter()
    for b in bodies:
        for d in set(x.strip() for x in re.split(r';(?![^(]*\))', b) if x.strip()): seen[re.sub(r'\s+', ' ', d)] += 1
    for d, n in seen.items():
        if n > 1: exact.append((ctx, sel, d, n))
print('declarations stated twice for the same selector in the same context:', len(exact), 'bytes ~', sum(len(e[2]) * (e[3] - 1) for e in exact))
for e in exact[:40]: print('   ', ' / '.join(e[0])[:50], '|', e[1][:70], '|', e[2][:90], 'x', e[3])
# 3. whole blocks identical across different selectors (could be grouped) - size only
bodies = collections.defaultdict(list)
for ctx, sel, body in out:
    if sel.startswith('@') or re.match(r'^(from|to|\d+%)', sel): continue
    bodies[(ctx, re.sub(r'\s+', ' ', body))].append(sel)
big = [(k, v) for k, v in bodies.items() if len(v) > 1 and len(k[1]) > 60]
print('identical declaration blocks (over 60 chars) under different selectors:', len(big), 'bytes ~', sum(len(k[1]) * (len(v) - 1) for k, v in big))
for k, v in sorted(big, key=lambda kv: -len(kv[0][1]) * (len(kv[1]) - 1))[:12]: print('   ', len(k[1]), 'B x', len(v), ':', ' || '.join(s[:60] for s in v)[:230])
