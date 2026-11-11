#!/usr/bin/env python3
"""Collect page-group results from finished workflow output files into rollout-results.json.
   python3 collect.py OUTPUT_FILE [OUTPUT_FILE...]"""
import json, sys, pathlib
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
store = R / 'rollout-results.json'
acc = json.loads(store.read_text()) if store.exists() else {}
for f in sys.argv[1:]:
    d = json.load(open(f)); r = d.get('result', d)
    if isinstance(r, str): r = json.loads(r)
    for item in (r.get('results') or []):
        if not item: continue
        key = item.get('key')
        if not key: continue
        acc[key] = item
store.write_text(json.dumps(acc, indent=1))
for key, item in acc.items():
    revs = item.get('reviews') or []
    issues = [i for rv in revs for i in (rv.get('issues') or [])]
    fx = item.get('fixed') or {}
    print(f"== {key}: reviews={len(revs)} scores={[rv.get('score') for rv in revs]} verdicts={[rv.get('verdict') for rv in revs]} issues={len(issues)} (blockers {sum(i['severity']=='blocker' for i in issues)}, major {sum(i['severity']=='major' for i in issues)}) fixed={'yes' if fx else 'NO'}")
    src = fx or item.get('built') or {}
    print('   heights:', (src.get('phoneHeights') or '')[:200].replace('\n',' '))
    print('   css:', (src.get('cssBytes') or '')[:160].replace('\n',' '))
    print('   open:', len(src.get('openIssues') or []), ' shared:', len(set((item.get('shared') or []) + (src.get('sharedIssues') or []))))
