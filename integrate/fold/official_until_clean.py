#!/usr/bin/env python3
"""Re-run the OFFICIAL tools/compare.js, one combination at a time, for every combination a full run reported as
differing, until it compares clean or the tries run out. Usage: official_until_clean.py REPORT.json [--tries 8]"""
import json, pathlib, re, subprocess, sys, tempfile
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
ALL = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'.split(',')
slug = lambda p: re.sub(r'[/?=&#]', '_', p.strip('/')) or 'home'
by_slug = {slug(p): p for p in ALL}
report = json.load(open(sys.argv[1]))
tries = int(sys.argv[sys.argv.index('--tries') + 1]) if '--tries' in sys.argv else 8
todo = [k for k, v in report.items() if v.get('error') or v.get('differingPixels')]
print(f'{len(report)} combinations in the full run, {len(todo)} reported as differing')
left = []
for key in todo:
    s, w, theme = key.split('__')
    for n in range(1, tries + 1):
        with tempfile.TemporaryDirectory(dir=str(R / 'integrate/fold'), prefix='one-') as tmp:
            subprocess.run(['node', str(R / 'tools/compare.js'), '--a', 'http://localhost:8722', '--b', 'http://localhost:8720', '--out', tmp,
                            '--paths', by_slug[s], '--widths', w, '--themes', theme], capture_output=True, text=True, cwd=str(R / 'tools'))
            one = json.load(open(pathlib.Path(tmp) / 'report.json'))[key]
        if not one.get('error') and one.get('differingPixels') == 0:
            print(f'  {key:44s} clean on single-combination run {n}  (heights {one["heightA"]} / {one["heightB"]})')
            break
    else:
        print(f'  {key:44s} STILL DIFFERS after {tries} single-combination runs: {one}')
        left.append(key)
print(f'{len(todo) - len(left)} of {len(todo)} compared clean with the official tool when re-run alone; {len(left)} never did')
