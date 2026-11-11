#!/bin/sh
# Runs every check for this kit folder and writes test/results.txt. Needs the kit server on :8730.
#   (nohup python3 ../../serve.py >/dev/null 2>&1 &)   from this folder's parent's parent, if it is not running
cd "$(dirname "$0")/.." || exit 1
T=../../../tools
{
  echo "== sizes (bytes) =="; wc -c arc.css arc.js spotlight.css spotlight.js
  echo; echo "== rules: hex colours, !important, widths in media queries =="
  grep -c '#[0-9A-Fa-f]\{3,8\}' arc.css spotlight.css; grep -c 'important' arc.css spotlight.css; grep -o '@media ([a-z-]*:[^)]*)' arc.css spotlight.css | sort | uniq -c
  echo; echo "== sideways scroll, 360 to 1920 in 20px steps =="; node $T/widths.js --urls http://localhost:8730/kit/flat/demo.html,http://localhost:8730/kit/flat/test/bare.html
  echo; echo "== text sizes and targets at 390px =="; node $T/smalltext.js --urls http://localhost:8730/kit/flat/demo.html | tail -2
  echo; echo "== contrast, both themes, 1440 and 390 =="; node $T/contrast.js --base http://localhost:8730 --paths /kit/flat/demo.html
  echo; echo "== contract =="; node test/contract.js
  echo; echo "== touch =="; node test/touch.js
  echo; echo "== theme and pause =="; node test/theme.js
  echo; echo "== layout shift on upgrade =="; node test/cls.js
  echo; echo "== held space and the 4s fallback =="; node test/held.js
  echo; echo "== heights before and after upgrade =="; node test/heights.js 360,370,380,390,400,414,430,480,520,560,599,600,640,700,760,820,980,1100,1280,1440,1920
  echo; echo "== other counts and options =="; node test/edge.js
  echo; echo "== leaks =="; node test/leak.js
  echo; echo "== frame times =="; node test/perf.js
} > test/results.txt 2>&1
grep -c '^PASS' test/results.txt; grep -n 'FAIL\|ERROR\|OVER\|SHIFT\|overflow\|problem' test/results.txt | head -20
