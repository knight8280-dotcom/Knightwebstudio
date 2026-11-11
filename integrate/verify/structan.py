import json, collections, sys, re
V='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/integrate/verify'
import os
rep = json.load(open(os.environ.get('STRUCT', V+'/struct.json')))
GEO_IGN = set()
style_changes = collections.defaultdict(lambda: collections.defaultdict(set))   # (sig, prop, a, b) -> pages
size_changes = collections.defaultdict(lambda: collections.defaultdict(list))
added = collections.defaultdict(set); removed = collections.defaultdict(set)
text_changes = collections.defaultdict(set)
heights = {}
def sig(e):
    return e['tag'] + ('.' + e['cls'] if e['cls'] else '') + ' <' + (e['pcls'] or '-') + '>'
for key, got in rep.items():
    p, w, th = key.split('|')
    a = {e['path']: e for e in got['a']['els']}; b = {e['path']: e for e in got['b']['els']}
    heights[key] = (got['a']['H'], got['b']['H'], got['a']['W'], got['b']['W'])
    for path, ea in a.items():
        eb = b.get(path)
        if not eb:
            if not ea['hid'] and ea['w'] and ea['h']: removed[(p, sig(ea), ea['text'][:50])].add(f'{w}{th[0]}')
            continue
        if ea['cls'] != eb['cls']:
            style_changes[(sig(ea), 'CLASS', ea['cls'], eb['cls'])][p].add(f'{w}{th[0]}')
        if ea['text'] != eb['text']:
            text_changes[(p, ea['text'], eb['text'])].add(f'{w}{th[0]}')
        for prop, va in ea['st'].items():
            vb = eb['st'][prop]
            if va != vb:
                style_changes[(sig(eb), prop, va, vb)][p].add(f'{w}{th[0]}')
        for pe in ('::before', '::after'):
            pa, pb = ea['ps'].get(pe), eb['ps'].get(pe)
            if (pa is None) != (pb is None):
                style_changes[(sig(eb), pe, 'present' if pa else 'absent', 'present' if pb else 'absent')][p].add(f'{w}{th[0]}')
            elif pa:
                for prop, va in pa.items():
                    if va != pb[prop]: style_changes[(sig(eb), pe + ' ' + prop, va, pb[prop])][p].add(f'{w}{th[0]}')
        if ea['hid'] != eb['hid']:
            pass
        elif not ea['hid'] and (abs(ea['w'] - eb['w']) > 0.6 or abs(ea['h'] - eb['h']) > 0.6):
            size_changes[sig(eb)][p].append((w, th[0], ea['w'], ea['h'], eb['w'], eb['h'], eb['text'][:30]))
    for path, eb in b.items():
        if path not in a and not eb['hid'] and eb['w'] and eb['h']:
            added[(p, sig(eb), eb['text'][:50])].add(f'{w}{th[0]}')
json.dump({'heights': heights}, open(V+'/struct-heights.json','w'))
mode = sys.argv[1] if len(sys.argv) > 1 else 'style'
def pages(d):
    return ' '.join(f"{(p.strip('/') or 'home')[:14]}[{','.join(sorted(v))}]" if len(v) < 6 else f"{(p.strip('/') or 'home')[:14]}[all]" for p, v in sorted(d.items()))
if mode == 'style':
    for (s, prop, va, vb), d in sorted(style_changes.items(), key=lambda kv: (kv[0][1], kv[0][0])):
        print(f'{prop:22} {s[:70]:70} | {str(va)[:70]} -> {str(vb)[:70]} | {len(d)}pg: {pages(d)[:160]}')
elif mode == 'text':
    for (p, ta, tb), v in sorted(text_changes.items()): print(p, '|', ta, '->', tb, '|', ','.join(sorted(v)))
elif mode == 'addrem':
    print('REMOVED'); 
    for (p, s, t), v in sorted(removed.items()): print('  ', p, s[:80], '|', t, '|', ','.join(sorted(v)))
    print('ADDED')
    for (p, s, t), v in sorted(added.items()): print('  ', p, s[:80], '|', t, '|', ','.join(sorted(v)))
elif mode == 'heights':
    for k, v in heights.items():
        if v[0] != v[1] or v[2] != v[3]: print(k, v)
elif mode == 'size':
    for s, d in sorted(size_changes.items()):
        n = sum(len(v) for v in d.values())
        ex = next(iter(d.values()))[0]
        print(f'{s[:80]:80} {n:4} in {len(d)}pg e.g. {ex}')
