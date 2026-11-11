#!/usr/bin/env python3
"""where.py PAGE WIDTH THEME CLASS_SUBSTR [TEXT_SUBSTR]: y/h of matching elements in A and B. Caches per-key slices."""
import json, sys, os, pickle
V='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/integrate/verify'
cache = V + '/struct.pkl'
if not os.path.exists(cache):
    rep = json.load(open(V + '/struct.json'))
    slim = {k: {s: [(e['path'], e['tag'], e['cls'], e['text'], e['x'], e['y'], e['w'], e['h'], e['hid']) for e in v[s]['els']] for s in 'ab'} for k, v in rep.items()}
    pickle.dump(slim, open(cache, 'wb'))
slim = pickle.load(open(cache, 'rb'))
p, w, th, cls = sys.argv[1:5]; txt = sys.argv[5] if len(sys.argv) > 5 else ''
key = f'{p}|{w}|{th}'
for s in 'ab':
    for (path, tag, c, t, x, y, ww, hh, hid) in slim[key][s]:
        full = tag + '.' + c
        if cls in full and txt.lower() in t.lower() and not hid:
            print(s.upper(), f'y={y} h={hh} x={x} w={ww}', full[:60], '|', t[:50])
