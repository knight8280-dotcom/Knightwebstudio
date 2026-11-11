#!/bin/sh
# Runs every check for this kit folder and writes test/results.txt. Needs the kit server on :8730:
#   (nohup python3 ../../serve.py >/dev/null 2>&1 &)   run from this folder's parent (kit/flat)
# and Playwright at /opt/node-tools/node_modules. Takes about eight minutes; the overlap sweep is the long one.
cd "$(dirname "$0")/.." || exit 1
T=../../../tools; export NODE_PATH=/opt/node-tools/node_modules
{
  echo "== sizes in bytes (budgets: scripts 8,000; stylesheets 3,500) =="; wc -c arc.css arc.js spotlight.css spotlight.js
  echo; echo "== rules: hex colours, !important, media queries used =="
  grep -c '#[0-9A-Fa-f]\{3,8\}\b' arc.css spotlight.css; grep -c 'important' arc.css spotlight.css; grep -o '@media ([a-z-]*:[^)]*)' arc.css spotlight.css | sort | uniq -c
  # the owner's list of words that must not appear anywhere; kept here in rot13 so that this file does not contain them either
  W=$(echo '\o(NV|negvsvpvny vagryyvtrapr|pungobg|TCG|znpuvar yrneavat)\o' | tr 'A-Za-z' 'N-ZA-Mn-za-m')
  echo; echo "== forbidden words in the delivered files (expect 0 each) =="; grep -ciE "$W" arc.css arc.js spotlight.css spotlight.js demo.html NOTES.md test/bare.html test/*.js test/*.sh test/*.txt
  echo; echo "== sideways scroll, 360 to 1920 in 20px steps =="; node $T/widths.js --urls http://localhost:8730/kit/flat/demo.html,http://localhost:8730/kit/flat/test/bare.html
  echo; echo "== text sizes and targets at 390px =="; node $T/smalltext.js --urls http://localhost:8730/kit/flat/demo.html | tail -2
  echo; echo "== contrast, both themes, 1440 and 390 =="; node $T/contrast.js --base http://localhost:8730 --paths /kit/flat/demo.html
  echo; echo "== contract =="; node test/contract.js
  echo; echo "== signs against the caption, 360 to 1920 in 4px steps =="; node test/overlap.js
  echo; echo "== touch =="; node test/touch.js
  echo; echo "== mouse =="; node test/input.js
  echo; echo "== motion settings in mid-move, off screen, idle =="; node test/still.js
  echo; echo "== theme and pause =="; node test/theme.js
  echo; echo "== layout shift on upgrade =="; node test/cls.js
  echo; echo "== held space and the 4s fallback =="; node test/held.js
  echo; echo "== heights before and after upgrade =="; node test/heights.js 360,364,372,376,380,384,392,400,414,430,440,450,470,480,520,560,599,600,640,700,760,820,980,1100,1280,1440,1920
  echo; echo "== other counts and options =="; node test/edge.js
  echo; echo "== things a client site might do =="; node test/robust.js
  echo; echo "== leaks =="; node test/leak.js
  echo; echo "== frame times =="; node test/perf.js
} > test/results.txt 2>&1
echo "PASS lines: $(grep -c '^PASS' test/results.txt)"; grep -n 'FAIL\|ERROR\|OVER\|SHIFT\|overflow from\|problem\|Error' test/results.txt | grep -v 'no horizontal overflow' | head -20
# Firefox (and WebKit, where it can start) are not part of the run above. If they are installed somewhere:
#   PLAYWRIGHT_BROWSERS_PATH=<folder> node test/other-browsers.js
