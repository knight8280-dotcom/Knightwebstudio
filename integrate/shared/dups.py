"""dups.py : rules repeated across page blocks (same selector once the [data-page] scope is removed, same or overlapping declarations),
and page rules that only repeat what the shared rule of the same selector already says."""
import re, pathlib, collections
css = pathlib.Path('/home/user/Knightwebstudio/assets/css/styles.css').read_text()
css = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), css, flags=re.S)
rules = []   # (context, selector, {prop: value}, line)
def walk(a, b, ctx):
    i = pre = a
    while i < b:
        ch = css[i]
        if ch == '{':
            head = ' '.join(css[pre:i].split()); depth = 1; j = i + 1
            while j < b and depth:
                depth += {'{': 1, '}': -1}.get(css[j], 0); j += 1
            if re.match(r'@(media|supports|container)', head): walk(i + 1, j - 1, ctx + (head,))
            elif not head.startswith('@'):
                decl = collections.OrderedDict()
                for d in css[i + 1:j - 1].split(';'):
                    if ':' in d:
                        k, v = d.split(':', 1); decl[k.strip()] = ' '.join(v.split())
                rules.append((ctx, head, decl, css[:pre].count('\n') + 1))
            i = pre = j; continue
        if ch == ';': pre = i + 1
        i += 1
walk(0, len(css), ())
scope = re.compile(r'(?:\.js |html:not\(\.js\) )?\[data-page(?:\^)?="([a-z-]+)"\]\s*')
by = collections.defaultdict(list)
shared = collections.defaultdict(dict)
for ctx, sel, decl, line in rules:
    for s in re.split(r',(?![^()]*\))', sel):
        s = s.strip(); m = scope.match(s)
        if m: by[(ctx, scope.sub('', s, count=1) or ':scope')].append((m.group(1), decl, line))
        else: shared[(ctx, s)].update(decl)
print('== the same selector in two or more page blocks, with declarations in common')
for (ctx, s), items in sorted(by.items(), key=lambda kv: kv[1][0][2]):
    pages = {p for p, _, _ in items}
    if len(pages) < 2: continue
    common = set(items[0][1].items())
    for _, d, _ in items[1:]: common &= set(d.items())
    if common: print(f"  {s}   {' / '.join(ctx)[:60]}\n      pages: {', '.join(f'{p} L{l}' for p, _, l in items)}\n      common: {'; '.join(k + ': ' + v for k, v in sorted(common))[:200]}")
print('\n== a page rule that repeats a declaration of the shared rule with the same selector and context')
for (ctx, s), items in sorted(by.items(), key=lambda kv: kv[1][0][2]):
    sh = shared.get((ctx, s)) or {}
    for p, d, l in items:
        same = [k for k, v in d.items() if sh.get(k) == v]
        if same: print(f'  L{l} [{p}] {s}: {", ".join(same)}')

print('\n== the same declarations (two or more) under different selectors, in two or more page blocks or shared + page')
bydecl = collections.defaultdict(list)
for ctx, sel, decl, line in rules:
    if len(decl) < 2: continue
    m = scope.match(sel.split(',')[0].strip())
    bydecl[(ctx, tuple(sorted(decl.items())))].append((m.group(1) if m else 'shared', sel, line))
for (ctx, d), items in sorted(bydecl.items(), key=lambda kv: kv[1][0][2]):
    if len({p for p, _, _ in items}) < 2: continue
    print('  ' + '; '.join(k + ': ' + v for k, v in d)[:170] + '   ' + ' / '.join(ctx)[:50])
    for p, s, l in items: print(f'      L{l} [{p}] {s[:110]}')
