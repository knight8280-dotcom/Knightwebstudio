#!/usr/bin/env python3
"""Contrast of the colour tokens, straight from the stylesheet.

    python3 tools/contrast_tokens.py [/home/user/Knightwebstudio/assets/css/styles.css]

Reads every `--name: var(--L, day) var(--D, night)` line plus the tone scopes, then checks
the pairs the system uses: text needs 4.5:1, large text, controls and focus rings 3:1.
Exit code 1 if a pair falls short. (tools/contrast.js measures the same on the rendered pages.)
"""
import re, sys
css = open(sys.argv[1] if len(sys.argv) > 1 else '/home/user/Knightwebstudio/assets/css/styles.css').read()
day, night = {}, {}
for name, d, n in re.findall(r'--([a-z0-9-]+):\s*var\(--L,\s*(#[0-9A-Fa-f]{6})\)\s*var\(--D,\s*(#[0-9A-Fa-f]{6})\)', css):
    day[name], night[name] = d, n
for name, v in re.findall(r'--(gold|cream):\s*(#[0-9A-Fa-f]{6})', css):
    day[name] = night[name] = v

def rgb(h): h = h.lstrip('#'); return [int(h[i:i + 2], 16) for i in (0, 2, 4)]
def lum(c):
    f = lambda x: x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    r, g, b = [f(v / 255) for v in c]; return 0.2126 * r + 0.7152 * g + 0.0722 * b
def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)
def over(fg, alpha, bg): return [fg[i] * alpha + bg[i] * (1 - alpha) for i in range(3)]

scope = dict(re.findall(r'\.(on-blue|on-ink) \{ --ink-2: (#[0-9A-Fa-f]{6})', css))
scope3 = dict(re.findall(r'\.(on-blue|on-ink) \{ --ink-2: #[0-9A-Fa-f]{6}; --ink-3: (#[0-9A-Fa-f]{6})', css))
bad = 0
def check(label, fg, bg, need):
    global bad
    r = ratio(fg, bg); flag = '' if r >= need else '   <-- BELOW %.1f' % need
    if flag: bad += 1
    print(f'{r:5.2f}  {label}{flag}')

for theme, T in (('day', day), ('night', night)):
    print(f'--- {theme}')
    c = {k: rgb(v) for k, v in T.items()}
    for bg in ('paper', 'paper-2', 'card'):
        for fg in ('ink', 'ink-2', 'ink-3', 'blue', 'brick'):
            check(f'{fg} on {bg}', c[fg], c[bg], 4.5)
        check(f'ctl (field outline) on {bg}', c['ctl'], c[bg], 3)
        check(f'focus ring on {bg}', c['focus'], c[bg], 3)
    check('on-blue on blue (primary button)', c['on-blue'], c['blue'], 4.5)
    check('on-blue on blue-deep (button hover)', c['on-blue'], c['blue-deep'], 4.5)
    check('blue on blue-tint (pill-go)', c['blue'], c['blue-tint'], 4.5)
    check('brick on brick-tint (pill-new, note flag)', c['brick'], c['brick-tint'], 4.5)
    check('ink-2 on paper-3 (flag)', c['ink-2'], c['paper-3'], 4.5)
    check('ink on paper-3 (customer bubble, payment plan)', c['ink'], c['paper-3'], 4.5)
    check('paper on ink (popular marker, deposit block)', c['paper'], c['ink'], 4.5)
    print('  .on-blue')
    board = c['board']
    check('cream on board', c['cream'], board, 4.5)
    check('ink-2 on board', rgb(scope['on-blue']), board, 4.5)
    check('ink-3 on board', rgb(scope3['on-blue']), board, 4.5)
    check('gold on board (eyebrow, prices)', c['gold'], board, 4.5)
    check('ink on cream (primary button on blue)', rgb('#1A2238'), c['cream'], 4.5)
    check('ink on gold (its hover)', rgb('#1A2238'), c['gold'], 4.5)
    check('gold focus ring on board', c['gold'], board, 3)
    check('cream at 70% (field outline) on board', over(c['cream'], .7, board), board, 3)
    print('  .on-ink')
    foot = c['footer']
    check('cream on footer', c['cream'], foot, 4.5)
    check('ink-2 on footer', rgb(scope['on-ink']), foot, 4.5)
    check('ink-3 on footer', rgb(scope3['on-ink']), foot, 4.5)
    check('gold on footer', c['gold'], foot, 4.5)
print(f'\n{bad} pair(s) below the bar' if bad else '\nevery pair meets AA')
sys.exit(1 if bad else 0)
