#!/usr/bin/env python3
"""Working aid only: derive spotlight.js from arc.js so the shared engine stays identical while it is being tuned.
The two delivered files are plain hand-readable source; this script does not ship."""
p = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion/'
s = open(p + 'kit/flat/arc.js').read()
def cut(a, b, new):
    global s
    i = s.index(a); j = s.index(b, i); s = s[:i] + new + s[j:]
def rep(a, b, cnt=1):
    global s
    assert s.count(a) == cnt, (a, s.count(a)); s = s.replace(a, b)
s = open(p + 'work-flat/spot-head.txt').read() + s[s.index('(function () {'):]
cut('\t// On resize', '\tconst tick = now', open(p + 'work-flat/spot-mid.txt').read())
s = s.replace('kws-arc-tile', 'kws-spot-frame').replace('kws-arc-', 'kws-spot-').replace('tiles', 'frames')
rep(".arc = { mount }", ".spotlight = { mount }"); rep('[data-kws=arc]', '[data-kws=spotlight]')
rep("{ abs, min, max, round, sign, sin, cos }", "{ abs, min, max, round, sign, sin, PI }")
rep("	at = (v, p, k = p | 0) => v[k] + (v[k + 1] - v[k]) * (p - k), fix = v => v.toFixed(2),\n", "	fix = v => v.toFixed(2),\n")
rep("ang = [0], size = [1], ", "")
rep("		R, step, half;", "		shift, bulge, small, step;")
rep("max(-14, min(14, -g.v * 1000 / step))", "max(-6, min(6, -g.v * 1000 / step))")
rep("let i = still() ? a : max(a - half - 1, min(a + half + 1, round(pos + v * .16)));", "let i = still() ? a : round(pos + v * .16);")
rep("[list, ...caps].forEach(x => ro.observe(x));", "ro.observe(list);")
# two strokes meeting, so the stylesheet needs no line-join rule
rep("prev = nav('Previous ', '14 6-6 6 6 6'), next = nav('Next ', '10 6 6 6-6 6')", "prev = nav('Previous ', '14 6-6 6m0 0 6 6'), next = nav('Next ', '10 6 6 6m0 0-6 6')")
# the spotlight's cards are big pictures: make their layers when a pointer or focus arrives, not on the first frame of a move
rep("\tconst ro = new ResizeObserver(measure)", "\t// Make the cards' layers when a pointer or focus arrives, not on the first frame of a move\n\tconst warm = e => frames.forEach(f => f.style.willChange = /[rn]$/.test(e.type) ? 'transform,opacity' : '');\n\tfor (const t of ['pointerenter', 'pointerleave', 'focusin', 'focusout']) on(el, t, warm);\n\n\tconst ro = new ResizeObserver(measure)")
open(p + 'kit/flat/spotlight.js', 'w').write(s)
