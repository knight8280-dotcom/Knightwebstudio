#!/bin/sh
# Runs every check for this kit folder and writes test/results.txt. Needs the kit server on :8730.
#   (nohup python3 ../../serve.py >/dev/null 2>&1 &)   from this folder's parent's parent, if it is not running
cd "$(dirname "$0")/.." || exit 1
T=../../../tools
FLAT=$(cd ../.. && pwd)/.browsers-flat
{
  echo "run on: $(date -u +%Y-%m-%dT%H:%MZ); machine load: $(uptime | sed 's/.*load average/load average/') (frame times below move with it)"; echo
  echo "== sizes (bytes) =="; wc -c cylinder.css cylinder.js ring.css ring.js
  echo; echo "== rules: hex colours, !important, widths in media queries =="
  grep -c '#[0-9A-Fa-f]\{3,8\}' cylinder.css ring.css; grep -c 'important' cylinder.css ring.css; grep -o '@media ([a-z-]*:[^)]*)' cylinder.css ring.css | sort | uniq -c
  echo; echo "== contract (keyboard, script off, reduced motion, motion paused, touch, mount API, small screens, no 3D, layout shift) =="; node test/contract.js
  echo; echo "== sideways scroll, 360 to 1920 in 20px steps, scripts on and off =="; node test/widths.js
  echo; echo "== layout shift with the scripts arriving late =="; node test/cls.js
  echo; echo "== held space and the 4s fallback (kit scripts blocked) =="; node test/held.js; PLAYWRIGHT_BROWSERS_PATH=$FLAT node test/held.js firefox
  echo; echo "== text sizes and targets at 390px =="; node $T/smalltext.js --urls http://localhost:8730/kit/depth/demo.html | tail -2
  echo; echo "== contrast, both themes, 1440 and 390 =="; node $T/contrast.js --base http://localhost:8730 --paths /kit/depth/demo.html
  echo; echo "== leaks =="; node test/leak.js
  echo; echo "== other browsers =="; PLAYWRIGHT_BROWSERS_PATH=$FLAT node test/other-browsers.js
  echo; echo "== frame times, 390x844 (demo page: two cylinders and two rings mounted, the site script running) =="; node test/perf.js
  echo; echo "== ring: touch scroll past it, 4x CPU throttle, three rounds each =="
  echo "one ring on a page with the site stylesheet (test/one-ring.html):"; node test/perf-page.js http://localhost:8730/kit/depth/test/one-ring.html
  echo "bare client page, one cylinder and one ring (test/bare.html):"; node test/perf-page.js http://localhost:8730/kit/depth/test/bare.html
  echo "demo page:"; node test/perf-page.js http://localhost:8730/kit/depth/demo.html
  echo; echo "== where the main thread's time goes while the ring turns (demo page, 4x) =="; node test/trace.js | head -12
} > test/results.txt 2>&1
grep -c '^PASS' test/results.txt; grep '^FAIL' test/results.txt; echo "written: test/results.txt"
