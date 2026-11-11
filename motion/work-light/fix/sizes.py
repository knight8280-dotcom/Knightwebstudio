#!/usr/bin/env python3
"""Sizes of the kit files, and of each component inside cards.css and shader.css (bytes on disk)."""
import os, re, sys
D='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion/kit/light/'
for f in ['shader.js','motion.js','cards.js','shader.css','motion.css','cards.css','demo.html','portable.html','NOTES.md']:
    if os.path.exists(D+f): print(f'{f:14} {os.path.getsize(D+f):6}')
s=open(D+'cards.css').read()
parts=re.split(r'(?m)^(?=/\* == )',s)
print('cards.css by part:')
for p in parts:
    name=re.match(r'/\* == ([^=]+?) ==',p)
    print('  ',(name.group(1) if name else 'header'), len(p.encode()))
