#!/usr/bin/env python3
"""Merge confirmed findings from finished review workflow outputs into review/<STAGE>/confirmed.json.
   python3 merge_findings.py STAGE OUTPUT_FILE [OUTPUT_FILE...]"""
import json, sys, pathlib
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
stage = sys.argv[1]
dest = R / 'review' / stage / 'confirmed.json'
notes_dest = R / 'review' / stage / 'notes.json'
acc = {f['dimension'] + ':' + f['id']: f for f in (json.loads(dest.read_text()) if dest.exists() else [])}
notes = {n['key']: n for n in (json.loads(notes_dest.read_text()) if notes_dest.exists() else [])}
for f in sys.argv[2:]:
    d = json.load(open(f)); r = d.get('result', d)
    if isinstance(r, str): r = json.loads(r)
    for x in r.get('confirmed') or []: acc[x.get('dimension', '?') + ':' + x['id']] = x
    for n in r.get('notes') or []: notes[n['key']] = n
dest.write_text(json.dumps(list(acc.values()), indent=1)); notes_dest.write_text(json.dumps(list(notes.values()), indent=1))
sev = {}
for x in acc.values(): sev[x['severity']] = sev.get(x['severity'], 0) + 1
print(len(acc), 'confirmed', sev)
for x in acc.values(): print(f"  [{x['severity']}] {x.get('dimension')}:{x['id']} | {x['pages'][:40]} | {x['what'][:150]}")
print('--- notes')
for n in notes.values(): print(' ', n['key'], '| reported', n.get('reported'), '| could not check:', (n.get('couldNotCheck') or [])[:4], '| scores:', (n.get('scores') or '')[:300])
