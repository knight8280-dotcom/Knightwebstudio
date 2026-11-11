#!/usr/bin/env python3
"""Fill the numbers into kit/light/NOTES.md (sizes, the measured section, the open list)."""
import os, re
D='/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion/kit/light/'
sz=lambda f: f'{os.path.getsize(D+f):,}'
css=open(D+'cards.css').read(); parts=re.split(r'(?m)^(?=/\* == )',css)
part={ (re.match(r'/\* == ([^=]+?) ==',p).group(1) if p.startswith('/* ==') else 'header'): len(p.encode()) for p in parts }
n=open(D+'NOTES.md').read()
rep={'{{motion.js}}':sz('motion.js'),'{{motion.css}}':sz('motion.css'),'{{shader.js}}':sz('shader.js'),'{{shader.css}}':sz('shader.css'),'{{cards.css}}':sz('cards.css'),'{{cards.js}}':sz('cards.js'),
 '{{c.shared}}':f"{part['Shared']+part['header']:,}",'{{c.folders}}':f"{part['Folder cards']:,}",'{{c.stack}}':f"{part['The folder stack']:,}",'{{c.marks}}':f"{part['Bookmark cards']:,}"}
MEASURED=open('notes_measured.md').read(); OPEN=open('notes_open.md').read()
for k,v in rep.items(): MEASURED=MEASURED.replace(k,v); OPEN=OPEN.replace(k,v)
n=re.sub(r'(?s)## 7\. What was measured\n\n.*?\n## 8\. Decisions', lambda m: '## 7. What was measured\n\n'+MEASURED.strip()+'\n\n## 8. Decisions', n)
n=re.sub(r'(?s)## 9\. Not right yet, and things for whoever places these\n\n.*\Z', lambda m: '## 9. Not right yet, and things for whoever places these\n\n'+OPEN.strip()+'\n', n)
for k,v in rep.items(): n=n.replace(k,v)
left=re.findall(r'\{\{[^}]+\}\}',n)
open(D+'NOTES.md','w').write(n); print('filled; placeholders left:',left, len(n))
