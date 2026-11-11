import json, pathlib, re, collections, sys
d = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/integrate/shared/sd') / sys.argv[1]
only = sys.argv[2] if len(sys.argv) > 2 else ''
known = [r'^(STYLE a "[A-Za-z]+"::after: pseudo\d+: 12px -> 8px|MOVE li: at [\d.]+,0 -> [\d.]+,0|SIZE (li|a "[A-Za-z]+"|ul.nav-links|nav#nav.nav|div.nav-inner)[^:]*: [\d.]+x44 -> [\d.]+x44|MOVE (div.header-actions|nav#nav.nav)|SIZE div.header-actions)',
 r'^STYLE span.mark .*::after: pseudo\d+: auto -> -1', r'^STYLE li.thread-note.*position: static -> relative', r'^STYLE span.steps-no.*whiteSpace: normal -> nowrap',
 r'^STYLE .*textWrap: (wrap|balance|pretty) -> (balance|pretty|wrap)$', r'^(MOVE b "\$|MOVE span.price-strip-note|SIZE (a|p).price-strip|SIZE span.price-strip-nums|SIZE b "\$)',
 r'^STYLE .*(backgroundColor|boxShadow|color|borderTopColor|stroke|fill)[^;]*rgba?\(', r'^COUNT ', r'^(STYLE (ul.pills|li ")|SIZE ul.pills|MOVE li ")', r'scroll-progress',
 r'display: flow-root -> block|textAlign: start -> left', r'^MOVE wbr',
 r'^SIZE (section|div.container|footer)', ]
for jf in sorted(d.glob('*.json')):
    rep = json.loads(jf.read_text())
    if only and only not in rep['key']: continue
    out = []
    for r in rep['roots']:
        rows = []
        for x in r['diffs']:
            line = f"{x['kind']} {x['what']}"
            if x.get('widthOnly') or any(re.search(rx, line) for rx in known): continue
            rows.append(line[:138])
        if rows: out.append(f"  [{r['i']}] {r['name'][:44]} {r['a']['h']} -> {r['b']['h']}"); out += ['      ' + x for x in rows[:int(sys.argv[3]) if len(sys.argv) > 3 else 9]] + ([f'      ... {len(rows) - 9} more'] if len(rows) > 9 and len(sys.argv) <= 3 else [])
    if out: print(rep['key']); print('\n'.join(out))
